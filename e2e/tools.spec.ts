import { expect, test } from '@playwright/test';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { statSync } from 'node:fs';
import { choose, decodeImage, downloadFrom, fixture, WORK_TIMEOUT } from './helpers';

const pageTexts = async (bytes: Buffer) => (await PDFDocument.load(bytes)).getPageCount();

test.describe('PDF Merge', () => {
  test('combines files in the chosen order', async ({ page }) => {
    await page.goto('/pdf-merge');
    await choose(page, 'a.pdf', 'b.pdf');
    await page.getByRole('button', { name: 'Move b.pdf up' }).click();
    await expect(page.locator('span.truncate')).toHaveText(['b.pdf', 'a.pdf']);
    await page.getByRole('button', { name: 'Merge PDFs' }).click();

    const { name, bytes } = await downloadFrom(page, /Download merged\.pdf/);
    expect(name).toBe('merged.pdf');
    const merged = await PDFDocument.load(bytes);
    expect(merged.getPageCount()).toBe(5);
  });

  test('needs at least two files', async ({ page }) => {
    await page.goto('/pdf-merge');
    await choose(page, 'a.pdf');
    await expect(page.getByRole('button', { name: 'Merge PDFs' })).toBeDisabled();
  });
});

test.describe('PDF Split', () => {
  test('extracts page ranges', async ({ page }) => {
    await page.goto('/pdf-split');
    await choose(page, 'b.pdf');
    await expect(page.getByLabel('Pages')).toHaveValue('1-3');
    await page.getByLabel('Pages').fill('3, 1');
    await page.getByRole('button', { name: 'Split PDF' }).click();

    const { name, bytes } = await downloadFrom(page, /Download b_pages\.pdf/);
    expect(name).toBe('b_pages.pdf');
    expect(await pageTexts(bytes)).toBe(2);
  });

  test('rejects pages outside the document', async ({ page }) => {
    await page.goto('/pdf-split');
    await choose(page, 'b.pdf');
    await expect(page.getByLabel('Pages')).toHaveValue('1-3');
    await page.getByLabel('Pages').fill('9');
    await page.getByRole('button', { name: 'Split PDF' }).click();
    await expect(page.getByText(/outside this document/).first()).toBeVisible({ timeout: WORK_TIMEOUT });
  });

  test('saves every page as its own PDF', async ({ page }) => {
    await page.goto('/pdf-split');
    await choose(page, 'b.pdf');
    await page.getByLabel(/Save every page/).click();
    await page.getByRole('button', { name: 'Split PDF' }).click();

    const { bytes } = await downloadFrom(page, /Download b_pages\.zip/);
    const zip = await JSZip.loadAsync(bytes);
    expect(Object.keys(zip.files).sort()).toEqual(['b_page_1.pdf', 'b_page_2.pdf', 'b_page_3.pdf']);
  });
});

test.describe('PDF Compress', () => {
  test('shrinks a scan and keeps its pages', async ({ page }) => {
    await page.goto('/pdf-compress');
    await choose(page, 'scan.pdf');
    await page.getByRole('button', { name: 'Compress PDF' }).click();
    await expect(page.getByRole('heading', { name: /% Smaller!/ })).toBeVisible({ timeout: WORK_TIMEOUT });

    const { name, bytes } = await downloadFrom(page, /Download Compressed PDF/);
    expect(name).toBe('scan_compressed.pdf');
    expect(bytes.length).toBeLessThan(statSync(fixture('scan.pdf')).size);
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(2);
    expect(pdf.getPage(0).getSize()).toEqual({ width: 600, height: 800 });
  });

  test('finishes while the tab is in the background', async ({ page }) => {
    await page.goto('/pdf-compress');
    await choose(page, 'scan.pdf');
    // Test browsers don't pause background tabs, so simulate what real ones do.
    await page.evaluate(() => {
      window.requestAnimationFrame = () => 0;
    });
    await page.getByRole('button', { name: 'Compress PDF' }).click();
    await expect(page.getByRole('heading', { name: /% Smaller!/ })).toBeVisible({ timeout: 20_000 });
  });

  test('offers no download when it cannot shrink a file', async ({ page }) => {
    await page.goto('/pdf-compress');
    await choose(page, 'small.pdf');
    await page.getByRole('button', { name: 'Compress PDF' }).click();
    await expect(page.getByRole('heading', { name: 'Already Well Compressed' })).toBeVisible({ timeout: WORK_TIMEOUT });
    await expect(page.getByRole('link', { name: /Download/ })).toHaveCount(0);

    await page.getByRole('button', { name: 'Try a Different Setting' }).click();
    await page.getByLabel(/Keep text and quality/).click();
    await page.getByRole('button', { name: 'Compress PDF' }).click();
    await expect(page.getByRole('heading', { name: /Already Well Compressed|% Smaller!/ })).toBeVisible({ timeout: WORK_TIMEOUT });
  });
});

test.describe('Images to PDF', () => {
  test('makes one page per image, keeping phone photos upright', async ({ page }) => {
    await page.goto('/images-to-pdf');
    await choose(page, 'rotated.jpg', 'clear.png', 'pic.webp');
    await page.getByRole('button', { name: 'Create PDF' }).click();

    const { name, bytes } = await downloadFrom(page, /Download images\.pdf/);
    expect(name).toBe('images.pdf');
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPages().map((p) => p.getSize())).toEqual([
      { width: 75, height: 150 }, // Stored as 200x100 with a rotation flag.
      { width: 90, height: 60 },
      { width: 67.5, height: 45 },
    ]);
  });
});

test.describe('Image Compressor', () => {
  test('compresses once and then stops', async ({ page }) => {
    await page.addInitScript(() => {
      const original = URL.createObjectURL.bind(URL);
      const counter = window as unknown as { urlsCreated: number };
      counter.urlsCreated = 0;
      URL.createObjectURL = (object) => {
        counter.urlsCreated++;
        return original(object);
      };
    });
    await page.goto('/image-compressor');
    await choose(page, 'logo.png');
    await expect(page.getByRole('link', { name: /Download Compressed Image/ })).toBeVisible();

    const count = () => page.evaluate(() => (window as unknown as { urlsCreated: number }).urlsCreated);
    const settled = await count();
    await page.waitForTimeout(2500);
    expect(await count()).toBe(settled);
  });

  test('downloads a JPG with the image size unchanged', async ({ page }) => {
    await page.goto('/image-compressor');
    await choose(page, 'logo.png');
    const { name, bytes } = await downloadFrom(page, /Download Compressed Image/);
    expect(name).toBe('logo_compressed.jpg');
    expect(await decodeImage(page, bytes, 'image/jpeg')).toMatchObject({ width: 120, height: 80 });
  });
});

test.describe('Image Resizer', () => {
  test('keeps the aspect ratio and resizes', async ({ page }) => {
    await page.goto('/image-resizer');
    await choose(page, 'logo.png');
    await expect(page.getByLabel('Width (px)')).toHaveValue('120');
    await page.getByLabel('Width (px)').fill('60');
    await expect(page.getByLabel('Height (px)')).toHaveValue('40');
    await page.getByRole('button', { name: 'Resize Image' }).click();

    const { name, bytes } = await downloadFrom(page, /Download Resized Image/);
    expect(name).toBe('logo_60x40.png');
    expect(await decodeImage(page, bytes, 'image/png')).toMatchObject({ width: 60, height: 40 });
  });

  test('names the file for the format the browser really wrote', async ({ page }) => {
    await page.goto('/image-resizer');
    await choose(page, 'anim-still.gif');
    await expect(page.getByLabel('Width (px)')).toHaveValue('40');
    await page.getByRole('button', { name: 'Resize Image' }).click();
    const { name } = await downloadFrom(page, /Download Resized Image/);
    expect(name).toBe('anim-still_40x40.png');
  });

  test('can start over with a different image', async ({ page }) => {
    await page.goto('/image-resizer');
    await choose(page, 'logo.png');
    await expect(page.getByLabel('Width (px)')).toHaveValue('120');
    await page.getByRole('button', { name: 'Start Over' }).click();
    await choose(page, 'pic.webp');
    await expect(page.getByLabel('Width (px)')).toHaveValue('90');
  });

  test('shows an error for a damaged image', async ({ page }) => {
    await page.goto('/image-resizer');
    await page.locator('input[type=file]').setInputFiles({
      name: 'broken.png',
      mimeType: 'image/png',
      buffer: Buffer.from('this is not an image'),
    });
    await expect(page.getByText(/could not be read as an image/).first()).toBeVisible();
    await expect(page.locator('input[type=file]')).toHaveCount(1);
  });
});

test.describe('Passport Photo Maker', () => {
  test('makes a 35 × 45 mm photo and a printable sheet', async ({ page }) => {
    await page.goto('/passport-photo');
    await choose(page, 'photo.jpg');
    await expect(page.getByLabel('Copies (up to 6)')).toHaveValue('6');
    await page.getByRole('button', { name: 'Create Passport Photos' }).click();

    const single = await downloadFrom(page, /Download Single Photo/);
    expect(single.name).toBe('photo_passport.jpg');
    expect(await decodeImage(page, single.bytes, 'image/jpeg')).toMatchObject({ width: 413, height: 531 });

    const sheet = await downloadFrom(page, /Download Print Sheet \(PDF\)/);
    expect(sheet.name).toBe('photo_passport_sheet.pdf');
    const pdf = await PDFDocument.load(sheet.bytes);
    const { width, height } = pdf.getPage(0).getSize();
    expect(width).toBeCloseTo(288, 0); // 4 in
    expect(height).toBeCloseTo(432, 0); // 6 in

    const jpg = await downloadFrom(page, /Download Print Sheet \(JPG\)/);
    expect(await decodeImage(page, jpg.bytes, 'image/jpeg')).toMatchObject({ width: 1200, height: 1800 });
  });

  test('limits copies to what fits on the paper', async ({ page }) => {
    await page.goto('/passport-photo');
    await choose(page, 'photo.jpg');
    await page.getByLabel('Photo size').selectOption('us');
    await expect(page.getByLabel('Copies (up to 2)')).toHaveValue('2');
    await page.getByLabel('Print paper').selectOption('a4');
    await page.getByLabel(/Copies/).fill('8');
    await expect(page.getByLabel(/Copies/)).toHaveValue('8');
  });

  test('clears the downloads when the crop changes', async ({ page }) => {
    await page.goto('/passport-photo');
    await choose(page, 'photo.jpg');
    await page.getByRole('button', { name: 'Create Passport Photos' }).click();
    await expect(page.getByRole('link', { name: /Download Single Photo/ })).toBeVisible({ timeout: WORK_TIMEOUT });
    await page.getByRole('img', { name: /Photo preview/ }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('link', { name: /Download Single Photo/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Create Passport Photos' })).toBeVisible();
  });
});
