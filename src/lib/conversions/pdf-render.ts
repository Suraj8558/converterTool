import { openWithPdfjs } from './pdfjs';

interface RenderOptions {
  /** Pixels per PDF point, or a fixed pixel width for previews. */
  scale?: number;
  width?: number;
  quality?: number;
  pages?: number[];
}

export interface RenderedPage {
  index: number;
  pageCount: number;
  blob: Blob;
  /** The page's size in points, as it appears on screen. */
  width: number;
  height: number;
}

/**
 * Renders pages to JPEG one at a time, so a long document doesn't exhaust memory.
 * Return false from onPage to stop early.
 */
export async function renderPages(
  file: File,
  { scale, width, quality = 0.75, pages }: RenderOptions,
  onPage: (page: RenderedPage) => boolean | void | Promise<boolean | void>
): Promise<number> {
  const pdf = await openWithPdfjs(file);
  try {
    const indexes = pages ?? Array.from({ length: pdf.numPages }, (_, index) => index);
    for (const index of indexes) {
      const page = await pdf.getPage(index + 1);
      const size = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: width ? width / size.width : (scale ?? 1) });

      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      // Print intent skips requestAnimationFrame, which pauses in background tabs.
      await page.render({ canvas, viewport, intent: 'print' }).promise;

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
      canvas.width = 0; // Free the page's memory right away.
      page.cleanup();
      if (!blob) throw new Error(`Page ${index + 1} could not be rendered.`);

      const keepGoing = await onPage({
        index,
        pageCount: pdf.numPages,
        blob,
        width: size.width,
        height: size.height,
      });
      if (keepGoing === false) break;
    }
    return pdf.numPages;
  } finally {
    await pdf.loadingTask.destroy();
  }
}
