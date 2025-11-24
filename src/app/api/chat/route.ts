import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { createServiceClient } from '@/utils/supabase/service';
import { langfuse } from '@/lib/langfuse';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, scanId } = await req.json();

  // Initialize Supabase Service Client (admin access for tools)
  // In a real app, we should validate the user has access to this scanId first via RLS/middleware
  // For now, we assume the frontend passes a valid scanId and the user is authorized.
  // Ideally, we should get the user's session here and pass their token to createClient
  // but for tools that need to write, service client is often easier if RLS is strict.
  // Let's use service client for simplicity in this agentic context, but be aware of security.
  const supabase = createServiceClient();

  // Fetch prompt from Langfuse
  let systemPrompt = "You are a helpful AI assistant that helps users manage Gherkin feature files.";
  try {
    const prompt = await langfuse.getPrompt("gherkin-chat-agent");
    systemPrompt = prompt.compile({});
  } catch (e) {
    console.warn("Failed to fetch prompt from Langfuse", e);
  }

  const result = streamText({
    model: openai('gpt-4o'),
    messages,
    system: systemPrompt,
    experimental_telemetry: {
        isEnabled: true,
        functionId: 'chat-agent',
    },
    tools: {
      addFeature: (tool as any)({
        description: 'Add a new Gherkin feature file to the database',
        parameters: z.object({
          title: z.string().describe('The title of the feature'),
          description: z.string().describe('A brief description'),
          file_path: z.string().describe('The file path, e.g., features/login.feature'),
          content: z.string().describe('The full Gherkin content'),
        }),
        execute: async ({ title, description, file_path, content }: { title: string, description: string, file_path: string, content: string }) => {
          const { error } = await supabase.from('features').insert({
            scan_id: scanId,
            title,
            description,
            file_path,
            content,
          });
          if (error) throw new Error(`Failed to add feature: ${error.message}`);
          return { success: true, message: `Feature "${title}" added successfully.` };
        },
      }),
      updateFeature: (tool as any)({
        description: 'Update an existing Gherkin feature file',
        parameters: z.object({
          old_title: z.string().describe('The current title of the feature to find'),
          new_title: z.string().optional(),
          new_content: z.string().optional(),
        }),
        execute: async ({ old_title, new_title, new_content }: { old_title: string, new_title?: string, new_content?: string }) => {
            // First find the feature
            const { data: features } = await supabase
                .from('features')
                .select('id')
                .eq('scan_id', scanId)
                .eq('title', old_title)
                .single();

            if (!features) throw new Error(`Feature "${old_title}" not found.`);

            const updates: any = {};
            if (new_title) updates.title = new_title;
            if (new_content) updates.content = new_content;

            const { error } = await supabase
                .from('features')
                .update(updates)
                .eq('id', features.id);

            if (error) throw new Error(`Failed to update feature: ${error.message}`);
            return { success: true, message: `Feature "${old_title}" updated.` };
        },
      }),
      deleteFeature: (tool as any)({
        description: 'Delete a Gherkin feature file',
        parameters: z.object({
          title: z.string().describe('The title of the feature to delete'),
        }),
        execute: async ({ title }: { title: string }) => {
           const { error } = await supabase
            .from('features')
            .delete()
            .eq('scan_id', scanId)
            .eq('title', title);

            if (error) throw new Error(`Failed to delete feature: ${error.message}`);
            return { success: true, message: `Feature "${title}" deleted.` };
        },
      }),
    },
  });

  return result.toTextStreamResponse();
}
