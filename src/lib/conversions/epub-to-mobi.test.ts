import { describe, expect, it } from 'vitest';
import { buildMobi, splitTextRecords } from './epub-to-mobi';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** Rebuilds the text the way a reader does, using each record's trailing overlap count. */
function reassemble(records: Uint8Array[]): Uint8Array {
  const parts = records.map((record) => record.subarray(0, record.length - 1 - record[record.length - 1]));
  const output = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

describe('splitTextRecords', () => {
  it('splits text into 4096-byte records that rejoin exactly', () => {
    const text = encoder.encode('a'.repeat(10000));
    const records = splitTextRecords(text);
    expect(records).toHaveLength(3);
    expect(reassemble(records)).toEqual(text);
  });

  it('completes a multi-byte character that crosses a record boundary', () => {
    const text = encoder.encode(`${'a'.repeat(4095)}日本語`);
    const [first] = splitTextRecords(text);
    expect(first[first.length - 1]).toBe(2); // Two extra bytes finish "日".
    expect(decoder.decode(first.subarray(0, first.length - 1))).toBe(`${'a'.repeat(4095)}日`);
    expect(decoder.decode(reassemble(splitTextRecords(text)))).toBe(`${'a'.repeat(4095)}日本語`);
  });
});

describe('buildMobi', () => {
  const book = {
    title: 'Título',
    author: 'Jane Author',
    html: `<html><body>${'x'.repeat(5000)}</body></html>`,
    images: [new Uint8Array([1, 2, 3])],
  };

  it('writes a Palm database with the expected records and headers', async () => {
    const bytes = new Uint8Array(await buildMobi(book).arrayBuffer());
    const view = new DataView(bytes.buffer);
    const text = (start: number, length: number) => decoder.decode(bytes.subarray(start, start + length));

    expect(text(60, 8)).toBe('BOOKMOBI');
    // Header, 2 text records, 1 image and the end-of-file marker.
    expect(view.getUint16(76)).toBe(5);

    const firstRecord = view.getUint32(78);
    expect(view.getUint16(firstRecord)).toBe(1); // No compression
    expect(view.getUint32(firstRecord + 4)).toBe(encoder.encode(book.html).length);
    expect(view.getUint16(firstRecord + 8)).toBe(2);
    expect(text(firstRecord + 16, 4)).toBe('MOBI');
    expect(view.getUint32(firstRecord + 16 + 12)).toBe(65001); // UTF-8
    expect(view.getUint32(firstRecord + 16 + 92)).toBe(3); // First image record
    expect(text(firstRecord + 16 + 232, 4)).toBe('EXTH');

    const nameOffset = view.getUint32(firstRecord + 16 + 68);
    const nameLength = view.getUint32(firstRecord + 16 + 72);
    expect(text(firstRecord + nameOffset, nameLength)).toBe('Título');

    expect([...bytes.subarray(-4)]).toEqual([0xe9, 0x8e, 0x0d, 0x0a]);
  });

  it('marks the image index as unset when a book has no images', async () => {
    const bytes = new Uint8Array(await buildMobi({ ...book, images: [] }).arrayBuffer());
    const view = new DataView(bytes.buffer);
    expect(view.getUint32(view.getUint32(78) + 16 + 92)).toBe(0xffffffff);
  });
});
