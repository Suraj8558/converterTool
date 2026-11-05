const POINTS_PER_PIXEL = 0.75; // 96 pixels per inch on a 72 points-per-inch page.

async function canvasBytes(canvas: HTMLCanvasElement, type: string): Promise<Uint8Array> {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.92));
  if (!blob) throw new Error('The image could not be prepared for the PDF.');
  return new Uint8Array(await blob.arrayBuffer());
}

export async function imagesToPdf(files: File[]): Promise<Blob> {
  const { PDFDocument } = await import('pdf-lib');
  const pdf = await PDFDocument.create();

  for (const file of files) {
    // Decoding through a canvas applies EXIF rotation, so phone photos stay upright.
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

    const isJpeg = /\.jpe?g$/i.test(file.name);
    const image = isJpeg
      ? await pdf.embedJpg(await canvasBytes(canvas, 'image/jpeg'))
      : await pdf.embedPng(await canvasBytes(canvas, 'image/png'));

    const width = canvas.width * POINTS_PER_PIXEL;
    const height = canvas.height * POINTS_PER_PIXEL;
    pdf.addPage([width, height]).drawImage(image, { x: 0, y: 0, width, height });
  }

  return new Blob([(await pdf.save()) as BlobPart], { type: 'application/pdf' });
}
