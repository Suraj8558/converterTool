import { fileToImageData } from './image-data';

// Tracing cost grows quickly with size and rarely adds detail past this point.
const MAX_PIXELS = 4_000_000;

export async function pngToSvg(file: File): Promise<Blob> {
  const imageData = await fileToImageData(file);
  if (imageData.width * imageData.height > MAX_PIXELS) {
    throw new Error(
      `"${file.name}" is too large to trace. Please resize it to under 4 megapixels first.`
    );
  }

  const { default: ImageTracer } = await import('imagetracerjs');
  const svg = ImageTracer.imagedataToSVG(imageData, {
    numberofcolors: 32,
    colorsampling: 2,
    pathomit: 4,
    strokewidth: 0,
    viewbox: true,
  });
  return new Blob([svg], { type: 'image/svg+xml' });
}
