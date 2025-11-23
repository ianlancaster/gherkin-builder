import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createServiceClient } from '@/utils/supabase/service';
import { scanWebsite } from '@/lib/agent/browser';
import { generateGherkin } from '@/lib/agent/generator';

export async function POST(request: Request) {
  const { scanId, url } = await request.json();
  const supabase = await createClient();

  // Verify user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accessToken = session.access_token;

  // Update scan status to processing
  await supabase
    .from('scans')
    .update({ status: 'processing' })
    .eq('id', scanId);

  // Start the scan process asynchronously (fire-and-forget)
  // Note: In a Vercel Serverless environment, this might be killed if the function returns.
  // For production, use a background queue (e.g., Inngest, BullMQ) or Vercel Functions with longer timeouts.
  (async () => {
    console.log(`[Scan ${scanId}] Starting background process for ${url}`);
    // Use service client for background operations to avoid session expiration issues
    // Pass the access token to respect RLS policies as the user
    const serviceClient = createServiceClient(accessToken);

    try {
      console.log(`[Scan ${scanId}] Launching browser...`);
      const scanData = await scanWebsite(url);
      console.log(`[Scan ${scanId}] Browser scan complete. Title: ${scanData.title}`);

      console.log(`[Scan ${scanId}] Generating Gherkin...`);
      const features = await generateGherkin(url, scanData);
      console.log(`[Scan ${scanId}] Gherkin generation complete. Features: ${features.length}`);

      // Save features to database
      for (const feature of features) {
        const { error } = await serviceClient.from('features').insert({
          scan_id: scanId,
          title: feature.title,
          description: feature.description,
          file_path: feature.file_path,
          content: feature.content,
        });
        if (error) console.error(`[Scan ${scanId}] Error saving feature:`, error);
      }
      console.log(`[Scan ${scanId}] Features saved to DB.`);

      // Update scan status to completed
      const { error: updateError } = await serviceClient
        .from('scans')
        .update({ status: 'completed' })
        .eq('id', scanId);

      if (updateError) {
        console.error(`[Scan ${scanId}] Failed to update status to completed:`, updateError);
      } else {
        console.log(`[Scan ${scanId}] Scan completed successfully.`);
      }

    } catch (error) {
      console.error(`[Scan ${scanId}] Scan failed:`, error);

      // Update scan status to failed
      const { error: updateError } = await serviceClient
        .from('scans')
        .update({ status: 'failed' })
        .eq('id', scanId);

      if (updateError) {
        console.error(`[Scan ${scanId}] Failed to update status to failed:`, updateError);
      }
    }
  })();

  console.log(`[Scan ${scanId}] Request accepted, processing in background.`);
  return NextResponse.json({ success: true });
}
