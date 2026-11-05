import { openWithPdfjs } from './pdfjs';
import { loadPdf } from './pdf-tools';
import type { ProgressCallback } from './index';

export type CompressionMode = 'keep-text' | 'smallest';

const RENDER_SCALE = 1.5; // About 108 pixels per inch: readable on screen and in print.
const JPEG_QUALITY = 0.6;

/** Tidies the file structure only, so text stays selectable and nothing looks different. */
async function optimizeStructure(file: File): Promise<Blob> {
  const pdf = await loadPdf(file);
  return new Blob([(await pdf.save({ useObjectStreams: true })) as BlobPart], { type: 'application/pdf' });
}

/** Rebuilds every page as a compressed image. Much smaller, but text can't be selected. */
async function rebuildAsImages(file: File, onProgress: ProgressCallback): Promise<Blob> {
  const source = await openWithPdfjs(file);
  const { PDFDocument } = await import('pdf-lib');
  const output = await PDFDocument.create();

  for (let number = 1; number <= source.numPages; number++) {
    const page = await source.getPage(number);
    const size = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: RENDER_SCALE });

    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    // Print intent skips requestAnimationFrame, which pauses in background tabs.
    await page.render({ canvas, viewport, intent: 'print' }).promise;

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
    if (!blob) throw new Error(`Page ${number} could not be compressed.`);
    const image = await output.embedJpg(new Uint8Array(await blob.arrayBuffer()));

    output.addPage([size.width, size.height]).drawImage(image, {
      x: 0,
      y: 0,
      width: size.width,
      height: size.height,
    });
    canvas.width = 0; // Free the page's memory right away.
    page.cleanup();
    onProgress(number / source.numPages);
  }
  await source.loadingTask.destroy();

  return new Blob([(await output.save()) as BlobPart], { type: 'application/pdf' });
}

export function compressPdf(file: File, mode: CompressionMode, onProgress: ProgressCallback): Promise<Blob> {
  return mode === 'keep-text' ? optimizeStructure(file) : rebuildAsImages(file, onProgress);
}
