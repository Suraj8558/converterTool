import { expect, test } from '@playwright/test';
import JSZip from 'jszip';
import mammoth from 'mammoth';
import { PDFDocument } from 'pdf-lib';
import { choose, convert, decodeImage, expectConversionError, fixture } from './helpers';

const text = (bytes: Buffer, start: number, length: number) => bytes.subarray(start, start + length).toString('latin1');

test.describe('image converters', () => {
  test('JPG to PNG', async ({ page }) => {
    const { name, bytes } = await convert(page, '/jpg-to-png', 'photo.jpg');
    expect(name).toBe('photo.png');
    expect(text(bytes, 1, 3)).toBe('PNG');
    expect(await decodeImage(page, bytes, 'image/png')).toMatchObject({ width: 120, height: 80 });
  });

  test('PNG to JPG fills transparency with white', async ({ page }) => {
    const { name, bytes } = await convert(page, '/png-to-jpg', 'logo.png');
    expect(name).toBe('logo.jpg');
    const image = await decodeImage(page, bytes, 'image/jpeg');
    expect(image).toMatchObject({ width: 120, height: 80 });
    expect(image.corner.slice(0, 3).every((channel) => channel > 250)).toBe(true);
  });

  test('WebP to JPG', async ({ page }) => {
    const { name, bytes } = await convert(page, '/webp-to-jpg', 'pic.webp');
    expect(name).toBe('pic.jpg');
    expect(await decodeImage(page, bytes, 'image/jpeg')).toMatchObject({ width: 90, height: 60 });
  });

  test('SVG to PNG', async ({ page }) => {
    const { name, bytes } = await convert(page, '/svg-to-png', 's.svg');
    expect(name).toBe('s.png');
    expect(await decodeImage(page, bytes, 'image/png')).toMatchObject({ width: 64, height: 64 });
  });

  test('SVG to PNG works when the browser reports no file type', async ({ page }) => {
    await page.goto('/svg-to-png');
    await page.locator('input[type=file]').setInputFiles({
      name: 'untyped.svg',
      mimeType: '',
      buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>'),
    });
    await page.getByRole('button', { name: /Convert to/ }).click();
    await expect(page.getByRole('heading', { name: 'Conversion Complete!' })).toBeVisible();
  });

  test('PNG to SVG produces a vector that keeps the image size', async ({ page }) => {
    const { name, bytes } = await convert(page, '/png-to-svg', 'logo.png');
    expect(name).toBe('logo.svg');
    const svg = bytes.toString('utf8');
    expect(svg).toContain('<svg');
    expect(svg).toContain('viewBox="0 0 120 80"');
    expect(svg).toContain('<path');
  });

  test('PNG to AVIF produces a real AVIF that keeps transparency', async ({ page, browserName }) => {
    const { name, bytes } = await convert(page, '/png-to-avif', 'logo.png');
    expect(name).toBe('logo.avif');
    expect(text(bytes, 4, 8)).toBe('ftypavif');
    if (browserName === 'webkit') return; // WebKit test builds can't display AVIF, only create it.
    const image = await decodeImage(page, bytes, 'image/avif');
    expect(image).toMatchObject({ width: 120, height: 80 });
    expect(image.corner[3]).toBe(0);
  });

  test('JPG to AVIF produces a real AVIF', async ({ page, browserName }) => {
    const { name, bytes } = await convert(page, '/jpg-to-avif', 'photo.jpg');
    expect(name).toBe('photo.avif');
    expect(text(bytes, 4, 8)).toBe('ftypavif');
    if (browserName === 'webkit') return; // WebKit test builds can't display AVIF, only create it.
    expect(await decodeImage(page, bytes, 'image/avif')).toMatchObject({ width: 120, height: 80 });
  });

  test('HEIC to JPG', async ({ page }) => {
    const { name, bytes } = await convert(page, '/heic-to-jpg', 'photo.heic');
    expect(name).toBe('photo.jpg');
    expect(await decodeImage(page, bytes, 'image/jpeg')).toMatchObject({ width: 160, height: 120 });
  });

  test('converting several files offers them as a zip', async ({ page }) => {
    await page.goto('/png-to-jpg');
    await choose(page, 'logo.png', 'clear.png');
    await page.getByRole('button', { name: /Convert to/ }).click();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /Download All/ }).click(),
    ]);
    expect(download.suggestedFilename()).toBe('converted_files.zip');
    const { readFileSync } = await import('node:fs');
    const zip = await JSZip.loadAsync(readFileSync(await download.path()));
    expect(Object.keys(zip.files).sort()).toEqual(['clear.jpg', 'logo.jpg']);
  });
});

test.describe('document converters', () => {
  test('Word to PDF keeps the text', async ({ page }) => {
    const { name, bytes } = await convert(page, '/word-to-pdf', 'report.docx');
    expect(name).toBe('report.pdf');
    expect(text(bytes, 0, 5)).toBe('%PDF-');
    expect((await PDFDocument.load(bytes)).getPageCount()).toBeGreaterThan(0);
  });

  test('Word to PDF explains why an old .doc file fails', async ({ page }) => {
    await expectConversionError(page, '/word-to-pdf', 'old.docx', /isn't a \.docx file/);
  });

  test('Word to PDF refuses text it cannot draw', async ({ page }) => {
    await expectConversionError(page, '/word-to-pdf', 'hindi.docx', /contains characters/);
  });

  test('PDF to Word finds headings and paragraphs', async ({ page }) => {
    const { name, bytes } = await convert(page, '/pdf-to-word', 'a.pdf');
    expect(name).toBe('a.docx');
    const { value } = await mammoth.convertToHtml({ buffer: bytes });
    expect(value).toContain('<h2>Alpha Heading 1</h2>');
    expect(value).toContain('<p>This is the first line of Alpha page 1, which continues on a second line.</p>');
    expect(value).toContain('<h2>Alpha Heading 2</h2>');
  });

  test('PDF to Word explains why a scan fails', async ({ page }) => {
    await expectConversionError(page, '/pdf-to-word', 'scanned.pdf', /No text was found/);
  });

  test('EPUB to MOBI writes a Mobipocket book', async ({ page }) => {
    const { name, bytes } = await convert(page, '/epub-to-mobi', 'book.epub');
    expect(name).toBe('book.mobi');
    expect(text(bytes, 60, 8)).toBe('BOOKMOBI');
    const content = bytes.toString('utf8');
    expect(content).toContain('Chapter One');
    expect(content).toContain('The end marker.');
  });
});

test.describe('audio and video converters', () => {
  test('MP3 to WAV', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit' && process.platform === 'win32', 'The Windows WebKit build has no Web Audio.');
    const { name, bytes } = await convert(page, '/mp3-to-wav', 'tone.mp3');
    expect(name).toBe('tone.wav');
    expect(text(bytes, 0, 4)).toBe('RIFF');
    expect(text(bytes, 8, 4)).toBe('WAVE');
    expect(bytes.readUInt32LE(24)).toBe(44100);
    expect(bytes.readUInt16LE(34)).toBe(16);
  });

  test('GIF to MP4', async ({ page }) => {
    test.setTimeout(120_000);
    const { name, bytes } = await convert(page, '/gif-to-mp4', 'anim.gif');
    expect(name).toBe('anim.mp4');
    expect(text(bytes, 4, 4)).toBe('ftyp');
    expect(bytes.includes(Buffer.from('avc1'))).toBe(true);
  });

  test('MP4 to AVI', async ({ page }) => {
    test.setTimeout(120_000);
    const { name, bytes } = await convert(page, '/mp4-to-avi', 'clip.mp4');
    expect(name).toBe('clip.avi');
    expect(text(bytes, 0, 4)).toBe('RIFF');
    expect(text(bytes, 8, 4)).toBe('AVI ');
  });
});

test('dropping a file works the same as choosing one', async ({ page }) => {
  await page.goto('/png-to-jpg');
  const { readFileSync } = await import('node:fs');
  const base64 = readFileSync(fixture('logo.png')).toString('base64');
  await page.evaluate((data) => {
    const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
    const transfer = new DataTransfer();
    transfer.items.add(new File([bytes], 'dropped.png', { type: 'image/png' }));
    document.querySelector('[role=button]')!.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer }));
  }, base64);
  await expect(page.getByText('dropped.png')).toBeVisible();
});

test('files of the wrong type are skipped with a message', async ({ page }) => {
  await page.goto('/png-to-jpg');
  await choose(page, 'photo.jpg');
  await expect(page.getByText('This tool only accepts .png files.').first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Convert to/ })).toBeDisabled();
});
