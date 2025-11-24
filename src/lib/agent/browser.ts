import { chromium } from 'playwright';

export async function scanWebsite(url: string) {
  console.log(`[Browser] Launching Chromium...`);
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log(`[Browser] Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Extract page title
    const title = await page.title();
    console.log(`[Browser] Page title: ${title}`);

    // Extract visible text content (simplified for now)
    const content = await page.evaluate(() => {
      return document.body.innerText;
    });
    console.log(`[Browser] Content extracted (${content.length} chars).`);

    // Get all interactive elements
    const interactiveElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('button, a, input, select, textarea');
      return Array.from(elements).map(el => ({
        tagName: el.tagName.toLowerCase(),
        text: el.textContent?.trim() || '',
        id: el.id,
        name: (el as any).name,
        placeholder: (el as any).placeholder,
        href: (el as any).href,
      }));
    });
    console.log(`[Browser] Found ${interactiveElements.length} interactive elements.`);

    return {
      title,
      content,
      interactiveElements,
    };
  } catch (error) {
    console.error('[Browser] Error scanning website:', error);
    throw error;
  } finally {
    await browser.close();
  }
}
