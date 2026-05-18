import { Page, TestInfo } from '@playwright/test';

/**
 * Genera una captura full page y la adjunta al reporte HTML de Playwright.
 */
export async function takeScreenshot(
  page: Page,
  testInfo: TestInfo,
  screenshotName: string
): Promise<void> {
  const sanitizedName = screenshotName.replace(/[^a-zA-Z0-9-_]/g, '_');
  const screenshotPath = testInfo.outputPath(`${sanitizedName}.png`);

  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
  });

  await testInfo.attach(`${sanitizedName}.png`, {
    path: screenshotPath,
    contentType: 'image/png',
  });
}