import { fileToImageData } from './image-data';

// AVIF encoding is slow, so it runs in a worker to keep the page responsive.
export async function imageToAvif(file: File): Promise<Blob> {
  const imageData = await fileToImageData(file);
  const worker = new Worker(new URL('./avif.worker.ts', import.meta.url), { type: 'module' });

  try {
    const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      worker.onmessage = ({ data }) => {
        if (data.buffer) resolve(data.buffer);
        else reject(new Error(data.error ?? 'AVIF encoding failed'));
      };
      worker.onerror = () => reject(new Error('The AVIF encoder could not be loaded.'));
      worker.postMessage(imageData);
    });
    return new Blob([buffer], { type: 'image/avif' });
  } finally {
    worker.terminate();
  }
}
