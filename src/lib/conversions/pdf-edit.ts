import type { PDFDocument, PDFImage, PDFPage } from 'pdf-lib';
import { embedImageFile } from './images-to-pdf';
import { loadPdf } from './pdf-tools';
import { renderPages } from './pdf-render';
import {
  normalizeRotation,
  pageLabel,
  placeStamp,
  visualRectToPageBox,
  visualSize,
  visualToPage,
  type StampPosition,
} from './pdf-geometry';
import type { ProgressCallback } from './index';

const STAMP_MARGIN = 30;

const toPdfBlob = async (pdf: PDFDocument) =>
  new Blob([(await pdf.save()) as BlobPart], { type: 'application/pdf' });

const pageGeometry = (page: PDFPage) => {
  const box = page.getCropBox();
  const rotation = normalizeRotation(page.getRotation().angle);
  return { box, rotation, size: visualSize(box, rotation) };
};

export interface OrganizedPage {
  fileIndex: number;
  pageIndex: number;
}

/** Builds a new PDF from pages of one or more files, in the given order. */
export async function organizePdf(files: File[], pages: OrganizedPage[]): Promise<Blob> {
  const { PDFDocument } = await import('pdf-lib');
  const output = await PDFDocument.create();
  // Only open files that still have pages here, so a damaged file that was added
  // and rejected can't block saving the rest.
  const sources = new Map<number, PDFDocument>();
  for (const { fileIndex, pageIndex } of pages) {
    const source = sources.get(fileIndex) ?? (await loadPdf(files[fileIndex]));
    sources.set(fileIndex, source);
    const [page] = await output.copyPages(source, [pageIndex]);
    output.addPage(page);
  }
  return toPdfBlob(output);
}

/** Rotates each page by its own number of degrees, added to any rotation it already has. */
export async function rotatePdf(file: File, turns: number[]): Promise<Blob> {
  const { degrees } = await import('pdf-lib');
  const pdf = await loadPdf(file);
  pdf.getPages().forEach((page, index) => {
    page.setRotation(degrees(normalizeRotation(page.getRotation().angle + (turns[index] ?? 0))));
  });
  return toPdfBlob(pdf);
}

export interface PageNumberOptions {
  position: StampPosition;
  format: 'number' | 'page-of';
  start: number;
  fontSize: number;
}

export async function addPageNumbers(file: File, options: PageNumberOptions): Promise<Blob> {
  const { degrees, rgb, StandardFonts } = await import('pdf-lib');
  const pdf = await loadPdf(file);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();

  pages.forEach((page, index) => {
    const { box, rotation, size } = pageGeometry(page);
    const text = pageLabel(options.format, index, pages.length, options.start);
    const stamp = {
      width: font.widthOfTextAtSize(text, options.fontSize),
      height: font.heightAtSize(options.fontSize),
    };
    const visual = placeStamp(options.position, size, stamp, STAMP_MARGIN);
    const { x, y } = visualToPage(visual.x, visual.y, box, rotation);
    page.drawText(text, { x, y, size: options.fontSize, font, color: rgb(0, 0, 0), rotate: degrees(rotation) });
  });
  return toPdfBlob(pdf);
}

export type WatermarkContent =
  | { kind: 'text'; text: string; fontSize: number; color: string }
  | { kind: 'image'; file: File; widthPercent: number };

export interface WatermarkOptions {
  content: WatermarkContent;
  position: StampPosition;
  opacity: number;
  /** Tilts a centered watermark across the page. */
  diagonal: boolean;
}

const hexToRgb = (hex: string) =>
  [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255) as [number, number, number];

export async function addWatermark(file: File, options: WatermarkOptions): Promise<Blob> {
  const { degrees, rgb, StandardFonts } = await import('pdf-lib');
  const pdf = await loadPdf(file);
  const { content } = options;

  const font = content.kind === 'text' ? await pdf.embedFont(StandardFonts.HelveticaBold) : null;
  const image: PDFImage | null = content.kind === 'image' ? await embedImageFile(pdf, content.file) : null;

  if (content.kind === 'text') {
    try {
      font!.encodeText(content.text);
    } catch {
      throw new Error('Watermark text can only use Latin characters for now. Try an image watermark instead.');
    }
  }

  const angle = options.diagonal && options.position === 'center' ? 45 : 0;
  const radians = (angle * Math.PI) / 180;

  for (const page of pdf.getPages()) {
    const { box, rotation, size } = pageGeometry(page);

    const stamp =
      content.kind === 'text'
        ? { width: font!.widthOfTextAtSize(content.text, content.fontSize), height: font!.heightAtSize(content.fontSize) }
        : (() => {
            const width = (size.width * content.widthPercent) / 100;
            return { width, height: (width * image!.height) / image!.width };
          })();

    // pdf-lib rotates around the stamp's corner, so offset it to rotate around its center.
    const placed = placeStamp(options.position, size, stamp, STAMP_MARGIN);
    const centerX = placed.x + stamp.width / 2;
    const centerY = placed.y + stamp.height / 2;
    const cornerX = centerX - (stamp.width / 2) * Math.cos(radians) + (stamp.height / 2) * Math.sin(radians);
    const cornerY = centerY - (stamp.width / 2) * Math.sin(radians) - (stamp.height / 2) * Math.cos(radians);

    const { x, y } = visualToPage(cornerX, cornerY, box, rotation);
    const rotate = degrees(rotation + angle);

    if (content.kind === 'text') {
      const [red, green, blue] = hexToRgb(content.color);
      page.drawText(content.text, {
        x,
        y,
        size: content.fontSize,
        font: font!,
        color: rgb(red, green, blue),
        opacity: options.opacity,
        rotate,
      });
    } else {
      page.drawImage(image!, { x, y, width: stamp.width, height: stamp.height, opacity: options.opacity, rotate });
    }
  }
  return toPdfBlob(pdf);
}

export interface CropMargins {
  /** Percentages of the page's visible size, measured from each edge. */
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Limits a page's visible area. The cropped content is hidden, not removed from the file. */
export async function cropPdf(file: File, margins: CropMargins, pageIndexes: number[] | 'all'): Promise<Blob> {
  const pdf = await loadPdf(file);
  const pages = pdf.getPages();
  const targets = pageIndexes === 'all' ? pages : pageIndexes.map((index) => pages[index]);

  for (const page of targets) {
    const { box, rotation, size } = pageGeometry(page);
    const crop = visualRectToPageBox(
      {
        x: (size.width * margins.left) / 100,
        y: (size.height * margins.bottom) / 100,
        width: (size.width * (100 - margins.left - margins.right)) / 100,
        height: (size.height * (100 - margins.top - margins.bottom)) / 100,
      },
      box,
      rotation
    );
    page.setCropBox(crop.x, crop.y, crop.width, crop.height);
  }
  return toPdfBlob(pdf);
}

export interface JpgExport {
  blob: Blob;
  name: string;
}

/** Saves every page as a JPG: one file for a single page, otherwise a zip. */
export async function pdfToJpg(file: File, dpi: number, onProgress: ProgressCallback): Promise<JpgExport> {
  const baseName = file.name.replace(/\.pdf$/i, '');
  const images: { name: string; blob: Blob }[] = [];

  const pageCount = await renderPages(file, { scale: dpi / 72, quality: 0.9 }, ({ index, pageCount, blob }) => {
    images.push({ name: `${baseName}_page_${index + 1}.jpg`, blob });
    onProgress((index + 1) / pageCount);
  });

  if (pageCount === 1) return images[0];

  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  images.forEach(({ name, blob }) => zip.file(name, blob));
  return { name: `${baseName}_images.zip`, blob: await zip.generateAsync({ type: 'blob' }) };
}
