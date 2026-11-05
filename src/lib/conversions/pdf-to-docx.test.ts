import { describe, expect, it } from 'vitest';
import { groupIntoLines, mostCommonFontSize, type PositionedText } from './pdf-to-docx';

const item = (str: string, x: number, y: number, width = str.length * 6, fontSize = 12): PositionedText => ({
  str,
  x,
  y,
  width,
  fontSize,
});

describe('groupIntoLines', () => {
  it('orders lines top to bottom and pieces left to right', () => {
    const lines = groupIntoLines([item('second', 10, 680), item('world', 46, 700), item('hello', 10, 700, 30)]);
    expect(lines.map((line) => line.text)).toEqual(['hello world', 'second']);
  });

  it('keeps slightly offset text, such as superscripts, on one line', () => {
    const lines = groupIntoLines([item('E=mc', 10, 700, 24), item('2', 34, 703, 6)]);
    expect(lines.map((line) => line.text)).toEqual(['E=mc2']);
  });

  it('does not add a space between touching pieces', () => {
    const lines = groupIntoLines([item('Con', 10, 700, 18), item('vert', 28, 700)]);
    expect(lines[0].text).toBe('Convert');
  });

  it('drops lines that contain only whitespace', () => {
    expect(groupIntoLines([item('   ', 10, 700)])).toEqual([]);
  });
});

describe('mostCommonFontSize', () => {
  it('weights sizes by how much text uses them', () => {
    const lines = [
      { text: 'Big Heading', y: 700, fontSize: 24 },
      { text: 'A much longer body paragraph of ordinary text', y: 680, fontSize: 11 },
      { text: 'Another Heading', y: 660, fontSize: 24 },
    ];
    expect(mostCommonFontSize(lines)).toBe(11);
  });

  it('falls back to 12 with no text', () => {
    expect(mostCommonFontSize([])).toBe(12);
  });
});
