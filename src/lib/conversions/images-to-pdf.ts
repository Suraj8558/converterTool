import type { PDFDocument, PDFImage } from 'pdf-lib';
import { fitInside } from './pdf-geometry';

const POINTS_PER_PIXEL = 0.75; // 96 pixels per inch on a 72 points-per-inch page.

const PAGE_SIZES = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
};

const MARGINS = { none: 0, small: 20, big: 40 };

export interface ImagesToPdfOptions {
  pageSize: 'fit' | keyof typeof PAGE_SIZES;
  orientation: 'portrait' | 'landscape';
  margin: keyof typeof MARGINS;
}

export const defaultImageOptions: ImagesToPdfOptions = {
  pageSize: 'fit',
  orientation: 'portrait',
  margin: 'none',
};

/** Works out a page's size and where its image goes, in points. */
export function layoutImagePage(image: { width: number; height: number }, options: ImagesToPdfOptions) {
  const margin = MARGINS[options.margin];

  if (options.pageSize === 'fit') {
    const width = image.width * POINTS_PER_PIXEL;
    const height = image.height * POINTS_PER_PIXEL;
    return {
      page: { width: width + margin * 2, height: height + margin * 2 },
      image: { x: margin, y: margin, width, height },
    };
  }

  const size = PAGE_SIZES[options.pageSize];
  const page =
    options.orientation === 'landscape'
      ? { width: size.height, height: size.width }
      : { width: size.width, height: size.height };
  return {
    page,
    image: fitInside(image, {
      x: margin,
      y: margin,
      width: page.width - margin * 2,
      height: page.height - margin * 2,
    }),
  };
}

async function canvasBytes(canvas: HTMLCanvasElement, type: string): Promise<Uint8Array> {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.92));
  if (!blob) throw new Error('The image could not be prepared for the PDF.');
  return new Uint8Array(await blob.arrayBuffer());
}

/** Decoding through a canvas applies EXIF rotation, so phone photos stay upright. */
export async function embedImageFile(pdf: PDFDocument, file: File): Promise<PDFImage> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(`"${file.name}" could not be read as an image.`);
  }

  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  return /\.jpe?g$/i.test(file.name)
    ? pdf.embedJpg(await canvasBytes(canvas, 'image/jpeg'))
    : pdf.embedPng(await canvasBytes(canvas, 'image/png'));
}

export async function imagesToPdf(files: File[], options: ImagesToPdfOptions = defaultImageOptions): Promise<Blob> {
  const { PDFDocument } = await import('pdf-lib');
  const pdf = await PDFDocument.create();

  for (const file of files) {
    const image = await embedImageFile(pdf, file);
    const layout = layoutImagePage(image, options);
    pdf.addPage([layout.page.width, layout.page.height]).drawImage(image, layout.image);
  }

  return new Blob([(await pdf.save()) as BlobPart], { type: 'application/pdf' });
}
