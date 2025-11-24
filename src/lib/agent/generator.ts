import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { langfuse } from "@/lib/langfuse";
import { z } from "zod";

// Define the schema for the output
const gherkinSchema = z.object({
  features: z.array(
    z.object({
      title: z.string().describe("Feature Name"),
      description: z.string().describe("Brief description of the feature"),
      file_path: z.string().describe("features/feature_name.feature"),
      content: z.string().describe("Feature: ... \n  Scenario: ..."),
    })
  ),
});

import { gherkinGeneratorFallback } from "@/lib/prompts/gherkin-generator";

export async function generateGherkin(url: string, scanData: any) {
  // Fetch prompt from Langfuse (Enforced)
  const prompt = await langfuse.getPrompt("gherkin-generator", undefined, {
    fallback: gherkinGeneratorFallback,
  });
  const variables = {
    url,
    scanDataTitle: scanData.title,
    scanDataJson: JSON.stringify(scanData.interactiveElements, null, 2),
    scanDataContent: scanData.content,
  };
  const userPrompt = prompt.compile(variables);
  console.log("[Generator] Using prompt from Langfuse.");

  try {
    console.log(
      "[Generator] Calling OpenAI via Vercel AI SDK (generateObject)..."
    );
    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: gherkinSchema,
      prompt: userPrompt,
      system: "You are a helpful AI assistant that generates Gherkin syntax.",
      experimental_telemetry: {
        isEnabled: true,
        functionId: "generate-gherkin",
        recordInputs: true,
        recordOutputs: true,
        metadata: {
          langfusePrompt: prompt.toJSON(),
          variables: JSON.stringify(variables),
        },
      },
    });
    console.log(
      `[Generator] OpenAI response received. Generated ${object.features.length} features.`
    );

    return object.features;
  } catch (error) {
    console.error("Error generating Gherkin:", error);
    throw error;
  }
}
