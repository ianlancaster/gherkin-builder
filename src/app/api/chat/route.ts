import { openai } from "@ai-sdk/openai";
import { ToolLoopAgent, createAgentUIStreamResponse, tool } from "ai";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";
import { langfuse } from "@/lib/langfuse";
import { gherkinChatAgentFallback } from "@/lib/prompts/gherkin-chat-agent";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, scanId } = await req.json();

  console.log("Chat API called with scanId:", scanId);

  // Get authenticated user session
  const authClient = await createClient();
  const {
    data: { session },
  } = await authClient.auth.getSession();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = session.access_token;

  // Initialize Supabase Service Client with user's access token
  // This allows the service client to bypass strict RLS for writes while still respecting user ownership for reads
  const supabase = createServiceClient(accessToken);

  // Fetch scan details (URL) and existing features for context
  const { data: scan, error: scanError } = await supabase
    .from("scans")
    .select("url, scan_data")
    .eq("id", scanId)
    .single();

  if (scanError) {
    console.error("Error fetching scan:", scanError);
  }

  const { data: features, error: featuresError } = await supabase
    .from("features")
    .select("title, description, content")
    .eq("scan_id", scanId);

  const url = scan?.url || "";
  // Use persisted scan data if available, otherwise default to empty
  const scanData: any = scan?.scan_data || {
    title: "Unknown",
    interactiveElements: [],
    content: "No content available",
  };

  const existingFeaturesContext =
    features
      ?.map(
        (f) => `
Feature: ${f.title}
Description: ${f.description}
Content:
${f.content}
-------------------
`
      )
      .join("\n") || "No existing features.";

  // Fetch prompt from Langfuse
  const prompt = await langfuse.getPrompt("gherkin-chat-agent", undefined, {
    fallback: gherkinChatAgentFallback,
  });

  const variables = {
    url,
    scanDataTitle: scanData.title,
    scanDataJson: JSON.stringify(scanData.interactiveElements, null, 2),
    scanDataContent: scanData.content,
    existingFeatures: existingFeaturesContext,
  };

  const compiledPrompt = prompt.compile(variables);

  // Define tools
  const tools = {
    addFeature: tool({
      description: "Add a new Gherkin feature file to the database",
      needsApproval: true,
      inputSchema: z.object({
        title: z.string().describe("The title of the feature"),
        description: z.string().describe("A brief description"),
        file_path: z
          .string()
          .describe("The file path, e.g., features/login.feature"),
        content: z.string().describe("The full Gherkin content"),
      }),
      execute: async ({
        title,
        description,
        file_path,
        content,
      }: {
        title: string;
        description: string;
        file_path: string;
        content: string;
      }) => {
        const { error } = await supabase.from("features").insert({
          scan_id: scanId,
          title,
          description,
          file_path,
          content,
        });
        if (error) throw new Error(`Failed to add feature: ${error.message}`);
        return {
          success: true,
          message: `Feature "${title}" added successfully.`,
        };
      },
    }),
    updateFeature: tool({
      description: "Update an existing Gherkin feature file",
      needsApproval: true,
      inputSchema: z.object({
        old_title: z
          .string()
          .describe("The current title of the feature to find"),
        new_title: z.string().optional(),
        new_content: z.string().optional(),
      }),
      execute: async ({
        old_title,
        new_title,
        new_content,
      }: {
        old_title: string;
        new_title?: string;
        new_content?: string;
      }) => {
        // First find the feature
        const { data: features } = await supabase
          .from("features")
          .select("id")
          .eq("scan_id", scanId)
          .eq("title", old_title)
          .order("title", { ascending: true })
          .single();

        if (!features) throw new Error(`Feature "${old_title}" not found.`);

        const updates: any = {};
        if (new_title) updates.title = new_title;
        if (new_content) updates.content = new_content;

        const { error } = await supabase
          .from("features")
          .update(updates)
          .eq("id", features.id);

        if (error)
          throw new Error(`Failed to update feature: ${error.message}`);
        return { success: true, message: `Feature "${old_title}" updated.` };
      },
    }),
    deleteFeature: tool({
      description: "Delete a Gherkin feature file",
      needsApproval: true,
      inputSchema: z.object({
        title: z.string().describe("The title of the feature to delete"),
      }),
      execute: async ({ title }: { title: string }) => {
        const { error } = await supabase
          .from("features")
          .delete()
          .eq("scan_id", scanId)
          .eq("title", title);

        if (error)
          throw new Error(`Failed to delete feature: ${error.message}`);
        return { success: true, message: `Feature "${title}" deleted.` };
      },
    }),
  };

  // Create agent with dynamic instructions
  const agent = new ToolLoopAgent({
    model: openai("gpt-4o"),
    instructions: compiledPrompt,
    tools,
    experimental_telemetry: {
      isEnabled: true,
      functionId: "chat-agent",
      recordInputs: true,
      recordOutputs: true,
      metadata: {
        langfusePrompt: prompt.toJSON(),
        variables: JSON.stringify(variables),
      },
    },
  });

  return createAgentUIStreamResponse({ agent, messages });
}
