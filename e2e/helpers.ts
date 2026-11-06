import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Download, type Page } from '@playwright/test';

export const fixture = (name: string) => join(__dirname, 'fixtures', name);

/** Conversions load their libraries on first use, and video needs a 31 MB engine. */
export const WORK_TIMEOUT = 60_000;

/** Waits for the page's scripts to take over, so its handlers are attached. */
export const pageIsReady = (page: Page) => page.waitForLoadState('networkidle');

export async function choose(page: Page, ...names: string[]) {
  await pageIsReady(page);
  await page.locator('input[type=file]').setInputFiles(names.map(fixture));
}

export async function readDownload(download: Download): Promise<Buffer> {
  return readFileSync(await download.path());
}

/** Clicks a control that downloads a file, returning the download and its bytes. */
export async function downloadFrom(page: Page, name: RegExp) {
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: WORK_TIMEOUT }),
    page.getByRole(/download/i.test(name.source) ? 'link' : 'button', { name }).click(),
  ]);
  return { name: download.suggestedFilename(), bytes: await readDownload(download) };
}

/** Runs a file through a standard converter page and returns its download. */
export async function convert(page: Page, route: string, input: string) {
  await page.goto(route);
  await choose(page, input);
  await page.getByRole('button', { name: /Convert to/ }).click();
  await expect(page.getByRole('heading', { name: 'Conversion Complete!' })).toBeVisible({ timeout: WORK_TIMEOUT });

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download', exact: true }).click(),
  ]);
  return { name: download.suggestedFilename(), bytes: await readDownload(download) };
}

export async function expectConversionError(page: Page, route: string, input: string, message: RegExp) {
  await page.goto(route);
  await choose(page, input);
  await page.getByRole('button', { name: /Convert to/ }).click();
  await expect(page.getByText(message).first()).toBeVisible({ timeout: WORK_TIMEOUT });
  await expect(page.getByRole('heading', { name: 'Conversion Complete!' })).toHaveCount(0);
}

/** Decodes image bytes in the browser under test, proving that it can really open them. */
export async function decodeImage(page: Page, bytes: Buffer, mimeType: string) {
  return page.evaluate(
    async ({ base64, mimeType }) => {
      const data = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const bitmap = await createImageBitmap(new Blob([data], { type: mimeType }));
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(bitmap, 0, 0);
      return {
        width: bitmap.width,
        height: bitmap.height,
        corner: Array.from(ctx.getImageData(0, 0, 1, 1).data),
      };
    },
    { base64: bytes.toString('base64'), mimeType }
  );
}

/**
 * Skips the current test when the browser has no WebGL. MediaPipe (background removal and face
 * detection) needs a GL context even with the CPU delegate, and headless Firefox on CI has none.
 */
export async function skipWithoutWebGL(page: Page) {
  const hasWebGL = await page.evaluate(() => !!document.createElement('canvas').getContext('webgl2'));
  test.skip(!hasWebGL, 'This browser has no WebGL, which the ML models need');
}
