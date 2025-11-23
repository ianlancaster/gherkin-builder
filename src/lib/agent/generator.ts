import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { langfuse } from '@/lib/langfuse';

export async function generateGherkin(url: string, scanData: any) {
  const prompt = `
    You are an expert QA Automation Engineer.
    Your task is to analyze the following website information and generate a comprehensive set of Gherkin feature files (Cucumber syntax).

    Website URL: ${url}
    Page Title: ${scanData.title}

    Interactive Elements:
    ${JSON.stringify(scanData.interactiveElements.slice(0, 50), null, 2)}
    (Truncated for brevity, focus on main navigation and actions)

    Page Content Summary:
    ${scanData.content.slice(0, 2000)}... (Truncated)

    Instructions:
    1. Identify the main features of the application based on the elements and content.
    2. For each feature, write a Gherkin Feature file.
    3. Include multiple Scenarios for each Feature, covering happy paths and potential edge cases.
    4. Use standard Gherkin syntax (Feature, Scenario, Given, When, Then).
    5. Be specific and descriptive.

    Output Format:
    Return a JSON array of objects, where each object represents a feature file:
    [
      {
        "title": "Feature Name",
        "description": "Brief description of the feature",
        "file_path": "features/feature_name.feature",
        "content": "Feature: ... \n  Scenario: ..."
      }
    ]

    IMPORTANT: Return ONLY the JSON array. Do not include markdown formatting or explanations outside the JSON.
  `;

  // Create a trace for Langfuse
  console.log('[Generator] Creating Langfuse trace...');
  const trace = langfuse.trace({
    name: "generate-gherkin",
    input: { url, scanData },
  });

  try {
    console.log('[Generator] Calling OpenAI...');
    const { text } = await generateText({
      model: openai('gpt-4o'), // Use a capable model
      prompt: prompt,
      system: "You are a helpful AI assistant that generates Gherkin syntax.",
    });
    console.log(`[Generator] OpenAI response received (${text.length} chars).`);

    // Parse the JSON output
    // We might need to clean the output if the model includes markdown code blocks
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const features = JSON.parse(cleanText);
    console.log(`[Generator] Parsed ${features.length} features.`);

    trace.update({
        output: features,
    });

    return features;
  } catch (error) {
    console.error('Error generating Gherkin:', error);
    trace.update({
        tags: ["error"],
    });
    throw error;
  }
}
