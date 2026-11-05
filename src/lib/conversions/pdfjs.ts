export async function openWithPdfjs(file: File) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();

  try {
    return await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  } catch (error) {
    if (error instanceof Error && error.name === 'PasswordException') {
      throw new Error(`"${file.name}" is password-protected. Please remove the password first.`);
    }
    throw new Error(`"${file.name}" could not be read as a PDF.`);
  }
}
