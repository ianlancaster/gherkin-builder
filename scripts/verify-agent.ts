import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

console.log('Environment Debug:');
console.log('LANGFUSE_PUBLIC_KEY:', process.env.LANGFUSE_PUBLIC_KEY ? 'Present' : 'Missing');
console.log('LANGFUSE_SECRET_KEY:', process.env.LANGFUSE_SECRET_KEY ? 'Present' : 'Missing');
console.log('LANGFUSE_HOST:', process.env.LANGFUSE_HOST);

async function verifyAgent() {
  // Dynamic imports to ensure env vars are loaded first
  const { scanWebsite } = await import('../src/lib/agent/browser');
  const { generateGherkin } = await import('../src/lib/agent/generator');

  const url = 'https://example.com';
  console.log(`Scanning ${url}...`);

  try {
    const scanData = await scanWebsite(url);
    console.log('Scan complete. Title:', scanData.title);
    console.log('Interactive elements found:', scanData.interactiveElements.length);

    console.log('Generating Gherkin...');
    const features = await generateGherkin(url, scanData);

    console.log('Generation complete. Features generated:', features.length);
    features.forEach((f: any) => {
        console.log(`- ${f.title} (${f.file_path})`);
    });

  } catch (error) {
    console.error('Verification failed:', error);
  }
}

verifyAgent();
