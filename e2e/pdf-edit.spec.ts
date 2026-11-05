import { expect, test, type Page } from '@playwright/test';
import JSZip from 'jszip';
import { degrees, PDFDocument, StandardFonts } from 'pdf-lib';
import { choose, decodeImage, downloadFrom, pageIsReady, WORK_TIMEOUT } from './helpers';

const STANDARD_PAGE = { width: 400, height: 500 };

/** Builds a PDF with one labeled page per size, optionally carrying a rotation flag. */
async function makePdf(sizes: { width: number; height: number; rotation?: number }[]) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  sizes.forEach(({ width, height, rotation = 0 }, index) => {
    const page = pdf.addPage([width, height]);
    page.drawText(`Sample page ${index + 1}`, { x: 20, y: 20, size: 10, font });
    page.setRotation(degrees(rotation));
  });
  return Buffer.from(await pdf.save());
}

const standardPdf = (pages: number) => makePdf(Array.from({ length: pages }, () => STANDARD_PAGE));

async function open(page: Page, route: string, buffer: Buffer, name = 'sample.pdf') {
  await page.goto(route);
  await pageIsReady(page);
  await page.locator('input[type=file]').first().setInputFiles({ name, mimeType: 'application/pdf', buffer });
}

const widths = async (bytes: Buffer) =>
  (await PDFDocument.load(bytes)).getPages().map((page) => page.getSize().width);

/** Reads each page's text, and where it appears on screen with its rotation applied. */
async function readText(bytes: Buffer) {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const pdf = await getDocument({ data: new Uint8Array(bytes), useSystemFonts: true }).promise;
  const pages = [];
  for (let number = 1; number <= pdf.numPages; number++) {
    const page = await pdf.getPage(number);
    const viewport = page.getViewport({ scale: 1 });
    const { items } = await page.getTextContent();
    pages.push({
      width: viewport.width,
      height: viewport.height,
      items: items.flatMap((item) => {
        if (!('str' in item) || !item.str.trim()) return [];
        const [x, y] = viewport.convertToViewportPoint(item.transform[4], item.transform[5]);
        return [{ text: item.str, x, y }];
      }),
    });
  }
  await pdf.loadingTask.destroy();
  return pages;
}

test.describe('Organize PDF', () => {
  const threeSizes = () =>
    makePdf([
      { width: 100, height: 500 },
      { width: 200, height: 500 },
      { width: 300, height: 500 },
    ]);

  test('shows thumbnails for every page', async ({ page }) => {
    await open(page, '/organize-pdf', await threeSizes());
    await expect(page.getByTestId('page-card')).toHaveCount(3);
    await expect(page.locator('[data-testid=page-card] img')).toHaveCount(3, { timeout: WORK_TIMEOUT });
  });

  test('reorders and removes pages', async ({ page }) => {
    await open(page, '/organize-pdf', await threeSizes());
    await page.getByRole('button', { name: 'Move sample.pdf, page 3 earlier' }).click();
    await page.getByRole('button', { name: 'Remove sample.pdf, page 1' }).click();
    await expect(page.getByTestId('page-card')).toHaveCount(2);
    await page.getByRole('button', { name: 'Save New PDF' }).click();

    const { name, bytes } = await downloadFrom(page, /Download sample_organized\.pdf/);
    expect(name).toBe('sample_organized.pdf');
    expect(await widths(bytes)).toEqual([300, 200]);
  });

  test('moves a page by dragging it', async ({ page }) => {
    await open(page, '/organize-pdf', await threeSizes());
    const cards = page.getByTestId('page-card');
    await expect(cards).toHaveCount(3);
    await cards.nth(2).dragTo(cards.nth(0));
    await page.getByRole('button', { name: 'Save New PDF' }).click();
    const { bytes } = await downloadFrom(page, /Download/);
    expect(await widths(bytes)).toEqual([300, 100, 200]);
  });

  test('adds pages from another PDF', async ({ page }) => {
    await open(page, '/organize-pdf', await threeSizes());
    await expect(page.getByTestId('page-card')).toHaveCount(3);
    await page.locator('input[type=file]').setInputFiles({
      name: 'extra.pdf',
      mimeType: 'application/pdf',
      buffer: await makePdf([{ width: 150, height: 500 }]),
    });
    await expect(page.getByTestId('page-card')).toHaveCount(4);
    await page.getByRole('button', { name: 'Save New PDF' }).click();
    const { bytes } = await downloadFrom(page, /Download/);
    expect(await widths(bytes)).toEqual([100, 200, 300, 150]);
  });

  test('reports a file that is not a PDF', async ({ page }) => {
    await open(page, '/organize-pdf', Buffer.from('not a pdf'), 'fake.pdf');
    await expect(page.getByText(/"fake\.pdf" could not be read/).first()).toBeVisible({ timeout: WORK_TIMEOUT });
  });

  test('a damaged file added later does not block saving the rest', async ({ page }) => {
    await open(page, '/organize-pdf', await threeSizes());
    await expect(page.getByTestId('page-card')).toHaveCount(3);
    await page.locator('input[type=file]').setInputFiles({
      name: 'fake.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('not a pdf'),
    });
    await expect(page.getByText(/"fake\.pdf" could not be read/).first()).toBeVisible({ timeout: WORK_TIMEOUT });
    await page.getByRole('button', { name: 'Save New PDF' }).click();
    const { bytes } = await downloadFrom(page, /Download/);
    expect(await widths(bytes)).toEqual([100, 200, 300]);
  });
});

test.describe('Rotate PDF', () => {
  const angles = async (bytes: Buffer) =>
    (await PDFDocument.load(bytes)).getPages().map((page) => page.getRotation().angle);

  test('rotates a single page and leaves the others', async ({ page }) => {
    await open(page, '/rotate-pdf', await standardPdf(2));
    await page.getByRole('button', { name: 'Rotate page 2 right' }).click();
    await page.getByRole('button', { name: 'Save Rotated PDF' }).click();
    const { name, bytes } = await downloadFrom(page, /Download sample_rotated\.pdf/);
    expect(name).toBe('sample_rotated.pdf');
    expect(await angles(bytes)).toEqual([0, 90]);
  });

  test('rotates all pages, adding to any rotation they already have', async ({ page }) => {
    await open(page, '/rotate-pdf', await makePdf([{ ...STANDARD_PAGE, rotation: 90 }, STANDARD_PAGE]));
    await expect(page.getByTestId('page-card')).toHaveCount(2);
    await page.getByRole('button', { name: 'Rotate All Left' }).click();
    await page.getByRole('button', { name: 'Save Rotated PDF' }).click();
    const { bytes } = await downloadFrom(page, /Download/);
    expect(await angles(bytes)).toEqual([0, 270]);
  });

  test('keeps a turned page inside its preview', async ({ page }) => {
    await open(page, '/rotate-pdf', await standardPdf(1));
    const image = page.locator('[data-testid=page-card] img');
    await expect(image).toBeVisible({ timeout: WORK_TIMEOUT });
    await page.getByRole('button', { name: 'Rotate page 1 right' }).click();
    await page.waitForTimeout(300); // Lets the turning animation finish.

    const turned = (await image.boundingBox())!;
    const frame = (await image.locator('..').boundingBox())!;
    expect(turned.x).toBeGreaterThanOrEqual(frame.x - 1);
    expect(turned.x + turned.width).toBeLessThanOrEqual(frame.x + frame.width + 1);
    expect(turned.width).toBeGreaterThan(turned.height);
  });

  test('returns to the start when the file is not a PDF', async ({ page }) => {
    await open(page, '/rotate-pdf', Buffer.from('not a pdf'), 'fake.pdf');
    await expect(page.getByText(/"fake\.pdf" could not be read/).first()).toBeVisible({ timeout: WORK_TIMEOUT });
    await expect(page.locator('input[type=file]')).toHaveCount(1);
  });
});

test.describe('PDF to JPG', () => {
  test('saves a single page as a JPG', async ({ page }) => {
    await open(page, '/pdf-to-jpg', await standardPdf(1));
    await page.getByRole('button', { name: 'Convert to JPG' }).click();
    const { name, bytes } = await downloadFrom(page, /Download sample_page_1\.jpg/);
    expect(name).toBe('sample_page_1.jpg');
    // 400x500 points at 150 DPI.
    expect(await decodeImage(page, bytes, 'image/jpeg')).toMatchObject({ width: 834, height: 1042 });
  });

  test('saves several pages as a zip', async ({ page }) => {
    await open(page, '/pdf-to-jpg', await standardPdf(3));
    await page.getByRole('button', { name: 'Convert to JPG' }).click();
    const { name, bytes } = await downloadFrom(page, /Download sample_images\.zip/);
    expect(name).toBe('sample_images.zip');
    const zip = await JSZip.loadAsync(bytes);
    expect(Object.keys(zip.files).sort()).toEqual(['sample_page_1.jpg', 'sample_page_2.jpg', 'sample_page_3.jpg']);
  });

  test('high quality doubles the resolution', async ({ page }) => {
    await open(page, '/pdf-to-jpg', await standardPdf(1));
    await page.getByLabel(/High quality/).click();
    await page.getByRole('button', { name: 'Convert to JPG' }).click();
    const { bytes } = await downloadFrom(page, /Download/);
    expect(await decodeImage(page, bytes, 'image/jpeg')).toMatchObject({ width: 1667, height: 2084 });
  });

  test('shows sideways pages the way they appear', async ({ page }) => {
    await open(page, '/pdf-to-jpg', await makePdf([{ ...STANDARD_PAGE, rotation: 90 }]));
    await page.getByRole('button', { name: 'Convert to JPG' }).click();
    const { bytes } = await downloadFrom(page, /Download/);
    expect(await decodeImage(page, bytes, 'image/jpeg')).toMatchObject({ width: 1042, height: 834 });
  });
});

test.describe('Add Page Numbers', () => {
  const add = async (page: Page, buffer: Buffer) => {
    await open(page, '/pdf-page-numbers', buffer);
    await page.getByRole('button', { name: 'Add Page Numbers' }).click();
    const { name, bytes } = await downloadFrom(page, /Download sample_numbered\.pdf/);
    expect(name).toBe('sample_numbered.pdf');
    return readText(bytes);
  };

  test('numbers every page at the bottom center by default', async ({ page }) => {
    const pages = await add(page, await standardPdf(2));
    pages.forEach((result, index) => {
      const label = result.items.find((item) => item.text === String(index + 1));
      expect(label, `page ${index + 1}`).toBeTruthy();
      expect(Math.abs(label!.x - result.width / 2)).toBeLessThan(15);
      expect(label!.y).toBeGreaterThan(result.height - 50); // Screen y grows downward.
    });
  });

  test('stays at the bottom center of a sideways page', async ({ page }) => {
    const [result] = await add(page, await makePdf([{ ...STANDARD_PAGE, rotation: 90 }]));
    expect(result.width).toBe(500);
    const label = result.items.find((item) => item.text === '1');
    expect(label).toBeTruthy();
    expect(Math.abs(label!.x - result.width / 2)).toBeLessThan(15);
    expect(label!.y).toBeGreaterThan(result.height - 50);
  });

  test('supports a starting number, format and position', async ({ page }) => {
    await open(page, '/pdf-page-numbers', await standardPdf(2));
    await page.getByLabel('Position').selectOption('top-right');
    await page.getByLabel('Format').selectOption('page-of');
    await page.getByLabel('Start at').fill('5');
    await page.getByRole('button', { name: 'Add Page Numbers' }).click();
    const { bytes } = await downloadFrom(page, /Download/);
    const pages = await readText(bytes);

    const label = pages[1].items.find((item) => item.text === 'Page 6 of 6');
    expect(label).toBeTruthy();
    expect(label!.x).toBeGreaterThan(pages[1].width / 2);
    expect(label!.y).toBeLessThan(60);
  });

  test('refuses a text size outside the limits', async ({ page }) => {
    await open(page, '/pdf-page-numbers', await standardPdf(1));
    await page.getByLabel(/Text size/).fill('500');
    await expect(page.getByRole('button', { name: 'Add Page Numbers' })).toBeDisabled();
  });
});

test.describe('Add Watermark', () => {
  test('stamps text on every page', async ({ page }) => {
    await open(page, '/pdf-watermark', await standardPdf(2));
    await page.getByLabel('Watermark text').fill('DRAFT');
    await page.getByRole('button', { name: 'Add Watermark' }).click();
    const { name, bytes } = await downloadFrom(page, /Download sample_watermarked\.pdf/);
    expect(name).toBe('sample_watermarked.pdf');
    for (const result of await readText(bytes)) {
      expect(result.items.map((item) => item.text)).toContain('DRAFT');
    }
  });

  test('explains that text is limited to Latin characters', async ({ page }) => {
    await open(page, '/pdf-watermark', await standardPdf(1));
    await page.getByLabel('Watermark text').fill('नमस्ते');
    await page.getByRole('button', { name: 'Add Watermark' }).click();
    await expect(page.getByText(/only use Latin characters/).first()).toBeVisible({ timeout: WORK_TIMEOUT });
  });

  test('stamps an image', async ({ page }) => {
    const original = await standardPdf(1);
    await open(page, '/pdf-watermark', original);
    await page.getByLabel('Image').click();
    await expect(page.getByRole('button', { name: 'Add Watermark' })).toBeDisabled();
    await choose(page, 'logo.png');
    await expect(page.getByText('logo.png')).toBeVisible();
    await page.getByRole('button', { name: 'Add Watermark' }).click();
    const { bytes } = await downloadFrom(page, /Download/);
    expect(bytes.length).toBeGreaterThan(original.length + 500);
  });

  test('only offers tilting for a centered watermark', async ({ page }) => {
    await open(page, '/pdf-watermark', await standardPdf(1));
    await expect(page.getByLabel('Tilt across the page')).toBeVisible();
    await page.getByLabel('Position').selectOption('bottom-right');
    await expect(page.getByLabel('Tilt across the page')).toHaveCount(0);
  });
});

test.describe('Crop PDF', () => {
  const fillMargins = async (page: Page, margins: Record<string, string>) => {
    for (const [side, value] of Object.entries(margins)) {
      await page.getByLabel(`${side} (%)`).fill(value);
    }
  };

  const cropBoxes = async (bytes: Buffer) =>
    (await PDFDocument.load(bytes)).getPages().map((page) => page.getCropBox());

  test('crops all pages to the chosen margins', async ({ page }) => {
    await open(page, '/crop-pdf', await standardPdf(2));
    await expect(page.getByTestId('crop-area')).toBeVisible({ timeout: WORK_TIMEOUT });
    await fillMargins(page, { Top: '10', Right: '20', Bottom: '30', Left: '40' });
    await page.getByRole('button', { name: 'Crop PDF' }).click();

    const { name, bytes } = await downloadFrom(page, /Download sample_cropped\.pdf/);
    expect(name).toBe('sample_cropped.pdf');
    const expected = { x: 160, y: 150, width: 160, height: 300 };
    expect(await cropBoxes(bytes)).toEqual([expected, expected]);
  });

  test('can crop only the current page', async ({ page }) => {
    await open(page, '/crop-pdf', await standardPdf(2));
    await expect(page.getByTestId('page-indicator')).toHaveText('Page 1 of 2', { timeout: WORK_TIMEOUT });
    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(page.getByTestId('page-indicator')).toHaveText('Page 2 of 2');
    await page.getByLabel('This page only').click();
    await fillMargins(page, { Left: '50' });
    await page.getByRole('button', { name: 'Crop PDF' }).click();

    const { bytes } = await downloadFrom(page, /Download/);
    expect(await cropBoxes(bytes)).toEqual([
      { x: 0, y: 0, width: 400, height: 500 },
      { x: 200, y: 0, width: 200, height: 500 },
    ]);
  });

  test('crops what appears on screen when a page is sideways', async ({ page }) => {
    await open(page, '/crop-pdf', await makePdf([{ ...STANDARD_PAGE, rotation: 90 }]));
    await expect(page.getByTestId('crop-area')).toBeVisible({ timeout: WORK_TIMEOUT });
    await fillMargins(page, { Left: '50' });
    await page.getByRole('button', { name: 'Crop PDF' }).click();

    const { bytes } = await downloadFrom(page, /Download/);
    const [result] = await readText(bytes);
    // A 400x500 page turned sideways shows as 500x400, and half its width stays.
    expect(result.width).toBeCloseTo(250);
    expect(result.height).toBeCloseTo(400);
  });

  test('sets the crop by dragging across the page', async ({ page }) => {
    await open(page, '/crop-pdf', await standardPdf(1));
    const area = page.getByTestId('crop-area');
    await expect(area).toBeVisible({ timeout: WORK_TIMEOUT });
    await expect(area.locator('img')).toBeVisible();
    await area.scrollIntoViewIfNeeded();
    const box = (await area.boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.25);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.75, { steps: 5 });
    await page.mouse.up();

    await expect.poll(async () => Number(await page.getByLabel('Left (%)').inputValue())).toBeGreaterThan(20);
    expect(Number(await page.getByLabel('Left (%)').inputValue())).toBeLessThan(30);
    expect(Number(await page.getByLabel('Right (%)').inputValue())).toBeGreaterThan(20);
    await expect(page.getByRole('button', { name: 'Crop PDF' })).toBeEnabled();
  });

  test('refuses a crop that leaves almost nothing', async ({ page }) => {
    await open(page, '/crop-pdf', await standardPdf(1));
    await expect(page.getByTestId('crop-area')).toBeVisible({ timeout: WORK_TIMEOUT });
    await expect(page.getByRole('button', { name: 'Crop PDF' })).toBeDisabled();
    await fillMargins(page, { Left: '60', Right: '38' });
    await expect(page.getByRole('button', { name: 'Crop PDF' })).toBeDisabled();
  });

  test('warns that cropping does not delete content', async ({ page }) => {
    await open(page, '/crop-pdf', await standardPdf(1));
    await expect(page.getByText(/doesn't delete it from the file/)).toBeVisible();
  });
});

test.describe('Images to PDF page options', () => {
  test('uses A4 landscape', async ({ page }) => {
    await page.goto('/images-to-pdf');
    await choose(page, 'logo.png');
    await expect(page.getByLabel('Orientation')).toBeDisabled();
    await page.getByLabel('Page size').selectOption('a4');
    await page.getByLabel('Orientation').selectOption('landscape');
    await page.getByLabel('Margin').selectOption('big');
    await page.getByRole('button', { name: 'Create PDF' }).click();
    const { bytes } = await downloadFrom(page, /Download images\.pdf/);
    const size = (await PDFDocument.load(bytes)).getPage(0).getSize();
    expect(size.width).toBeCloseTo(841.89);
    expect(size.height).toBeCloseTo(595.28);
  });

  test('adds a margin around a page sized to its image', async ({ page }) => {
    await page.goto('/images-to-pdf');
    await choose(page, 'pic.webp');
    await page.getByLabel('Margin').selectOption('small');
    await page.getByRole('button', { name: 'Create PDF' }).click();
    const { bytes } = await downloadFrom(page, /Download images\.pdf/);
    expect((await PDFDocument.load(bytes)).getPage(0).getSize()).toEqual({ width: 107.5, height: 85 });
  });
});
