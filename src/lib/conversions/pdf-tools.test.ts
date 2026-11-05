import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { loadPdf, parsePageRanges } from './pdf-tools';

describe('parsePageRanges', () => {
  it('turns ranges into zero-based indexes, in the order given', () => {
    expect(parsePageRanges('1-3, 5', 5)).toEqual([0, 1, 2, 4]);
    expect(parsePageRanges('3, 1', 3)).toEqual([2, 0]);
  });

  it('accepts spaces around the dash', () => {
    expect(parsePageRanges(' 2 - 3 ', 3)).toEqual([1, 2]);
  });

  it.each(['abc', '1-', '-2', '1,,2'])('rejects malformed input %j', (input) => {
    expect(() => parsePageRanges(input, 5)).toThrow(/isn't a valid page range/);
  });

  it.each(['0', '9', '3-1', '4-9'])('rejects pages outside the document %j', (input) => {
    expect(() => parsePageRanges(input, 5)).toThrow(/outside this document/);
  });
});

describe('loadPdf', () => {
  it('loads a valid PDF', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    source.addPage();
    const file = new File([(await source.save()) as BlobPart], 'two.pdf');
    expect((await loadPdf(file)).getPageCount()).toBe(2);
  });

  it('names the file when it is not a PDF', async () => {
    await expect(loadPdf(new File(['not a pdf'], 'fake.pdf'))).rejects.toThrow(/"fake\.pdf" could not be read/);
  });
});
