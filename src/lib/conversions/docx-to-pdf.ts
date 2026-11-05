// Characters the bundled Roboto font can draw: Latin, Greek, Cyrillic and common
// punctuation. Anything else would come out as empty boxes in the PDF.
export const UNSUPPORTED_TEXT = /[^\s -ɏͰ-ϿЀ-ӿ‐-‧‰-⁞₠-₿™ﬀ-ﬄ]/u;

export function assertIsDocx(file: File, bytes: ArrayBuffer) {
  const [first, second] = new Uint8Array(bytes.slice(0, 2));
  // DOCX files are ZIP archives, which always start with "PK".
  if (first !== 0x50 || second !== 0x4b) {
    throw new Error(
      `"${file.name}" isn't a .docx file. For an older .doc file, open it in Word and use Save As to create a .docx first.`
    );
  }
}

export async function docxToPdf(file: File): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  assertIsDocx(file, arrayBuffer);

  const { default: mammoth } = await import('mammoth');
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer });

  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const text = parsed.body.textContent ?? '';
  const unsupported = text.match(UNSUPPORTED_TEXT);
  if (unsupported) {
    throw new Error(
      `"${file.name}" contains characters this tool can't put in a PDF yet (such as "${unsupported[0]}"). It supports Latin, Greek and Cyrillic text.`
    );
  }
  if (!text.trim() && !parsed.querySelector('img')) {
    throw new Error(`"${file.name}" appears to be empty.`);
  }

  const [{ default: htmlToPdfmake }, { default: pdfMake }, { default: pdfFonts }] = await Promise.all([
    import('html-to-pdfmake'),
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts'),
  ]);

  const content = htmlToPdfmake(html, { window });
  const pdf = pdfMake.createPdf(
    { content, pageMargins: [56, 56, 56, 56], defaultStyle: { fontSize: 11, lineHeight: 1.25 } },
    undefined,
    undefined,
    pdfFonts as unknown as Record<string, string>
  );
  return new Promise<Blob>((resolve) => pdf.getBlob(resolve));
}
