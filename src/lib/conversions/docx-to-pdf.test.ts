import { describe, expect, it } from 'vitest';
import { assertIsDocx, UNSUPPORTED_TEXT } from './docx-to-pdf';

describe('assertIsDocx', () => {
  const file = new File([], 'report.docx');

  it('accepts ZIP-based files', () => {
    expect(() => assertIsDocx(file, new Uint8Array([0x50, 0x4b, 3, 4]).buffer)).not.toThrow();
  });

  it('explains what to do with an older .doc file', () => {
    expect(() => assertIsDocx(file, new Uint8Array([0xd0, 0xcf, 0x11, 0xe0]).buffer)).toThrow(/Save As/);
  });
});

describe('UNSUPPORTED_TEXT', () => {
  it.each(['Hello, world!', 'Crème brûlée', 'Ελληνικά', 'Привет', 'Price: €20 — “quoted” text…'])(
    'allows %s',
    (text) => {
      expect(UNSUPPORTED_TEXT.test(text)).toBe(false);
    }
  );

  it.each(['नमस्ते', '日本語', 'مرحبا'])('rejects %s, which the PDF font cannot draw', (text) => {
    expect(UNSUPPORTED_TEXT.test(text)).toBe(true);
  });
});
