import { expect, test, type Page } from '@playwright/test';
import { createHash, randomBytes } from 'node:crypto';
import { parseBridgeMessage, type BridgeMessage } from '../mobile/src/downloads';
import { CHUNK_BYTES, DOWNLOAD_BRIDGE_SCRIPT } from '../mobile/src/injected';
import { choose, decodeImage, pageIsReady, WORK_TIMEOUT } from './helpers';

// The Android app shows this site in a WebView and injects DOWNLOAD_BRIDGE_SCRIPT, which
// sends saved files to the app. These tests run that same script against the real site,
// with a stand-in for the app's end of the bridge.

async function installBridge(page: Page) {
  await page.addInitScript(() => {
    const target = window as unknown as { __sent: string[]; ReactNativeWebView: { postMessage(message: string): void } };
    target.__sent = [];
    target.ReactNativeWebView = { postMessage: (message) => target.__sent.push(message) };
  });
  await page.addInitScript(DOWNLOAD_BRIDGE_SCRIPT);
}

/** Waits for one whole file to arrive, and puts it back together as the app would. */
async function receiveFile(page: Page) {
  await page.waitForFunction(
    () => (window as unknown as { __sent: string[] }).__sent.some((message) => /download-(end|error)/.test(message)),
    undefined,
    { timeout: WORK_TIMEOUT }
  );
  const raw = await page.evaluate(() => (window as unknown as { __sent: string[] }).__sent);
  const messages = raw.map((message) => {
    const parsed = parseBridgeMessage(message);
    expect(parsed, `the app must understand: ${message.slice(0, 80)}`).not.toBeNull();
    return parsed as BridgeMessage;
  });
  const start = messages.find((message) => message.type === 'download-start');
  const chunks = messages.flatMap((message) => (message.type === 'download-chunk' ? [message.data] : []));
  return {
    messages,
    start: start?.type === 'download-start' ? start : undefined,
    chunks,
    ended: messages.some((message) => message.type === 'download-end'),
    bytes: Buffer.concat(chunks.map((chunk) => Buffer.from(chunk, 'base64'))),
  };
}

/** Makes a download link on the page, like the ones the tools show for their results. */
async function clickBlobLink(page: Page, bytes: Buffer, name: string, type: string) {
  await page.evaluate(
    ({ base64, name, type }) => {
      const data = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob([data], { type }));
      link.download = name;
      link.textContent = 'save';
      document.body.append(link);
      link.click();
    },
    { base64: bytes.toString('base64'), name, type }
  );
}

test.describe('Android app download bridge', () => {
  test('sends a large file in chunks that put the file back together exactly', async ({ page }) => {
    const downloads: string[] = [];
    page.on('download', (download) => downloads.push(download.suggestedFilename()));
    await installBridge(page);
    await page.goto('/');
    await pageIsReady(page);

    const original = randomBytes(2_000_000);
    await clickBlobLink(page, original, 'big file.bin', 'application/octet-stream');
    const file = await receiveFile(page);

    expect(file.start).toMatchObject({ name: 'big file.bin', mime: 'application/octet-stream' });
    expect(file.ended).toBe(true);
    expect(file.chunks).toHaveLength(Math.ceil(original.length / CHUNK_BYTES));
    // Every chunk but the last is a whole number of 3-byte groups, so it has no padding
    // and the app can append the chunks one after another.
    for (const chunk of file.chunks.slice(0, -1)) expect(chunk).toHaveLength((CHUNK_BYTES / 3) * 4);
    expect(createHash('sha256').update(file.bytes).digest('hex')).toBe(createHash('sha256').update(original).digest('hex'));
    // The WebView must not also try (and fail) to download the blob itself.
    expect(downloads).toEqual([]);
  });

  test('sends an empty file as a start and an end', async ({ page }) => {
    await installBridge(page);
    await page.goto('/');
    await pageIsReady(page);
    await clickBlobLink(page, Buffer.alloc(0), 'empty.txt', 'text/plain');
    const file = await receiveFile(page);
    expect(file.start).toMatchObject({ name: 'empty.txt', mime: 'text/plain' });
    expect(file.chunks).toHaveLength(0);
    expect(file.ended).toBe(true);
  });

  test('leaves ordinary download links to the browser', async ({ page }) => {
    await installBridge(page);
    await page.goto('/');
    await pageIsReady(page);
    await page.evaluate(() => {
      const link = document.createElement('a');
      link.href = '/icon.svg';
      link.download = 'icon.svg';
      link.textContent = 'ordinary';
      document.body.append(link);
    });
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('link', { name: 'ordinary' }).click()]);
    expect(download.suggestedFilename()).toBe('icon.svg');
    expect(await page.evaluate(() => (window as unknown as { __sent: string[] }).__sent)).toEqual([]);
  });

  test('saves the result of a real tool', async ({ page }) => {
    await installBridge(page);
    await page.goto('/image-resizer');
    await choose(page, 'logo.png');
    await page.getByRole('button', { name: 'Resize Image' }).click();
    await page.getByRole('link', { name: /Download Resized Image/ }).click({ timeout: WORK_TIMEOUT });

    const file = await receiveFile(page);
    expect(file.start).toMatchObject({ name: 'logo_120x80.png', mime: 'image/png' });
    expect(file.ended).toBe(true);
    expect(await decodeImage(page, file.bytes, 'image/png')).toMatchObject({ width: 120, height: 80 });
  });

  test('saves a PDF made by a real tool', async ({ page }) => {
    await installBridge(page);
    await page.goto('/pdf-merge');
    await choose(page, 'a.pdf', 'b.pdf');
    await page.getByRole('button', { name: 'Merge PDFs' }).click();
    await page.getByRole('link', { name: /Download merged\.pdf/ }).click({ timeout: WORK_TIMEOUT });

    const file = await receiveFile(page);
    expect(file.start).toMatchObject({ name: 'merged.pdf', mime: 'application/pdf' });
    expect(file.bytes.subarray(0, 5).toString()).toBe('%PDF-');
  });
});
