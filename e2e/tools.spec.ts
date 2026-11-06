import { expect, test } from '@playwright/test';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { statSync } from 'node:fs';
import { choose, decodeImage, downloadFrom, fixture, skipWithoutWebGL, WORK_TIMEOUT } from './helpers';

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
  const near = (actual: number[], expected: number[], tolerance = 12) =>
    actual.slice(0, 3).every((value, index) => Math.abs(value - expected[index]) <= tolerance);

  test('darkens the photo with the brightness slider', async ({ page }) => {
    await page.goto('/passport-photo');
    await choose(page, 'photo.jpg');
    await page.getByRole('slider', { name: /Brightness/ }).focus();
    await page.keyboard.press('Home');
    await expect(page.getByText('Brightness: -50')).toBeVisible();
    await page.getByRole('button', { name: 'Create Passport Photos' }).click();

    const { bytes } = await downloadFrom(page, /Download Single Photo/);
    const { corner } = await decodeImage(page, bytes, 'image/jpeg');
    expect(near(corner, [191, 191, 191])).toBe(true);
  });

  test('replaces the background with a chosen colour', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/passport-photo');
    await skipWithoutWebGL(page);
    await choose(page, 'photo.jpg');
    await expect(page.getByRole('button', { name: 'Use an image' })).toHaveCount(0);
    await page.getByLabel('Remove the original background').click();
    await expect(page.getByRole('status').filter({ hasText: 'Removing background' })).toHaveCount(0, { timeout: WORK_TIMEOUT });
    await page.getByRole('radio', { name: 'Red', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Use an image' })).toBeVisible();
    await page.getByRole('button', { name: 'Create Passport Photos' }).click();

    // No person in this picture, so all of it is background.
    const { bytes } = await downloadFrom(page, /Download Single Photo/);
    const { corner } = await decodeImage(page, bytes, 'image/jpeg');
    expect(near(corner, [0xd6, 0x3a, 0x3a])).toBe(true);
  });

  test('puts an uploaded image behind the person', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/passport-photo');
    await skipWithoutWebGL(page);
    await choose(page, 'photo.jpg');
    await page.getByLabel('Remove the original background').click();
    await expect(page.getByRole('status').filter({ hasText: 'Removing background' })).toHaveCount(0, { timeout: WORK_TIMEOUT });
    await page.getByLabel('Background image', { exact: true }).setInputFiles(fixture('pic.webp'));
    await expect(page.getByRole('radio', { name: /Background image pic\.webp/ })).toBeChecked();
    await page.getByRole('button', { name: 'Create Passport Photos' }).click();

    const { bytes } = await downloadFrom(page, /Download Single Photo/);
    const { corner } = await decodeImage(page, bytes, 'image/jpeg');
    expect(near(corner, [120, 59, 237])).toBe(true); // pic.webp is a flat purple.
  });
  test('keeps the single photo under the chosen file size', async ({ page }) => {
    await page.goto('/passport-photo');
    await choose(page, 'photo.jpg');
    await page.getByLabel('Single photo file size').selectOption('50');
    await page.getByRole('button', { name: 'Create Passport Photos' }).click();

    const link = page.getByRole('link', { name: /Download Single Photo/ });
    await expect(link).toHaveText(/\d+ KB/, { timeout: WORK_TIMEOUT });
    const { bytes } = await downloadFrom(page, /Download Single Photo/);
    expect(bytes.length).toBeLessThanOrEqual(50 * 1024);
    expect(await decodeImage(page, bytes, 'image/jpeg')).toMatchObject({ width: 413, height: 531 });
  });

  test('says so when there is no face to align', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/passport-photo');
    await skipWithoutWebGL(page);
    await choose(page, 'photo.jpg');
    await page.getByRole('button', { name: 'Auto-align my face' }).click();
    await expect(page.getByText(/No face was found/).first()).toBeVisible({ timeout: WORK_TIMEOUT });
    await expect(page.getByRole('button', { name: 'Auto-align my face' })).toBeEnabled();
  });
  test('auto-enhance brightens a dark photo', async ({ page }) => {
    await page.goto('/passport-photo');
    await choose(page, 'dark.png');
    await page.getByRole('button', { name: 'Auto-enhance' }).click();
    await expect(page.getByText(/^Brightness: \+\d+/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reset all adjustments' })).toBeVisible();
    await page.getByRole('button', { name: 'Create Passport Photos' }).click();

    const { bytes } = await downloadFrom(page, /Download Single Photo/);
    const { corner } = await decodeImage(page, bytes, 'image/jpeg');
    expect(corner[0]).toBeGreaterThan(80); // The background was 40 before.
  });

  test('straightens, changes colour and resets in one click', async ({ page }) => {
    await page.goto('/passport-photo');
    await choose(page, 'photo.jpg');
    await expect(page.getByRole('button', { name: 'Reset all adjustments' })).toHaveCount(0);

    await page.getByRole('slider', { name: /Straighten/ }).focus();
    await page.keyboard.press('End');
    await expect(page.getByText('Straighten: +15.0°')).toBeVisible();
    await page.getByRole('slider', { name: /Colour/ }).focus();
    await page.keyboard.press('Home');
    await expect(page.getByText('Colour: -100')).toBeVisible();

    await page.getByRole('button', { name: 'Reset all adjustments' }).click();
    await expect(page.getByText('Straighten: 0.0°')).toBeVisible();
    await expect(page.getByText('Colour: 0')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reset all adjustments' })).toHaveCount(0);
  });

  test('black and white at minimum colour', async ({ page }) => {
    await page.goto('/passport-photo');
    await choose(page, 'photo.jpg');
    await page.getByRole('slider', { name: /Colour/ }).focus();
    await page.keyboard.press('Home');
    await page.getByRole('button', { name: 'Create Passport Photos' }).click();
    const { bytes } = await downloadFrom(page, /Download Single Photo/);
    const { corner } = await decodeImage(page, bytes, 'image/jpeg');
    expect(Math.abs(corner[0] - corner[1])).toBeLessThanOrEqual(6);
    expect(Math.abs(corner[1] - corner[2])).toBeLessThanOrEqual(6);
  });
});
