import type { PDFDocument } from 'pdf-lib';

export async function loadPdf(file: File): Promise<PDFDocument> {
  const { PDFDocument } = await import('pdf-lib');
  try {
    return await PDFDocument.load(await file.arrayBuffer());
  } catch (error) {
    if (error instanceof Error && error.message.includes('encrypted')) {
      throw new Error(`"${file.name}" is password-protected. Please remove the password first.`);
    }
    throw new Error(`"${file.name}" could not be read as a PDF.`);
  }
}

/** Parses a range list such as "1-3, 5" into zero-based page indexes, in order. */
export function parsePageRanges(input: string, pageCount: number): number[] {
  const indexes: number[] = [];
  for (const part of input.split(',')) {
    const match = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) throw new Error(`"${part.trim()}" isn't a valid page range. Try something like 1-3, 5.`);

    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : start;
    if (start < 1 || end < start || end > pageCount) {
      throw new Error(`"${part.trim()}" is outside this document, which has ${pageCount} page(s).`);
    }
    for (let page = start; page <= end; page++) indexes.push(page - 1);
  }
  return indexes;
}
