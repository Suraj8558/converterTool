import { describe, expect, it } from 'vitest';
import {
  fitInside,
  normalizeRotation,
  pageLabel,
  placeStamp,
  visualRectToPageBox,
  visualSize,
  visualToPage,
  type QuarterTurn,
} from './pdf-geometry';

const box = { x: 0, y: 0, width: 600, height: 800 };

describe('normalizeRotation', () => {
  it.each([
    [0, 0],
    [90, 90],
    [360, 0],
    [450, 90],
    [-90, 270],
  ])('turns %i into %i', (input, expected) => {
    expect(normalizeRotation(input)).toBe(expected);
  });
});

describe('visualSize', () => {
  it('swaps width and height for sideways pages', () => {
    expect(visualSize(box, 90)).toEqual({ width: 800, height: 600 });
    expect(visualSize(box, 180)).toEqual({ width: 600, height: 800 });
  });
});

describe('visualToPage', () => {
  // On screen, a rotated page's corners land in known places.
  it.each<[QuarterTurn, { x: number; y: number }]>([
    [0, { x: 0, y: 0 }],
    [90, { x: 600, y: 0 }],
    [180, { x: 600, y: 800 }],
    [270, { x: 0, y: 800 }],
  ])('finds the visual bottom-left corner when rotated %i', (rotation, expected) => {
    expect(visualToPage(0, 0, box, rotation)).toEqual(expected);
  });

  it('accounts for a box that does not start at zero', () => {
    expect(visualToPage(10, 20, { x: 100, y: 200, width: 600, height: 800 }, 0)).toEqual({ x: 110, y: 220 });
  });
});

describe('visualRectToPageBox', () => {
  it('keeps a rectangle unchanged on an upright page', () => {
    const rect = { x: 10, y: 20, width: 100, height: 200 };
    expect(visualRectToPageBox(rect, box, 0)).toEqual(rect);
  });

  it('swaps a rectangle onto a sideways page', () => {
    // 100 wide and 200 tall on screen is 200 wide and 100 tall in the page's own terms.
    const result = visualRectToPageBox({ x: 10, y: 20, width: 100, height: 200 }, box, 90);
    expect(result).toEqual({ x: 380, y: 10, width: 200, height: 100 });
  });
});

describe('placeStamp', () => {
  const page = { width: 600, height: 800 };
  const stamp = { width: 100, height: 20 };

  it.each([
    ['top-left', { x: 30, y: 750 }],
    ['top-center', { x: 250, y: 750 }],
    ['top-right', { x: 470, y: 750 }],
    ['center', { x: 250, y: 390 }],
    ['bottom-left', { x: 30, y: 30 }],
    ['bottom-center', { x: 250, y: 30 }],
    ['bottom-right', { x: 470, y: 30 }],
  ] as const)('places a stamp at %s', (position, expected) => {
    expect(placeStamp(position, page, stamp, 30)).toEqual(expected);
  });
});

describe('fitInside', () => {
  it('scales up and centers without distortion', () => {
    expect(fitInside({ width: 100, height: 100 }, { x: 0, y: 0, width: 400, height: 200 })).toEqual({
      x: 100,
      y: 0,
      width: 200,
      height: 200,
    });
  });

  it('respects a margin offset', () => {
    expect(fitInside({ width: 200, height: 100 }, { x: 20, y: 20, width: 100, height: 100 })).toEqual({
      x: 20,
      y: 45,
      width: 100,
      height: 50,
    });
  });
});

describe('pageLabel', () => {
  it('numbers pages from the starting number', () => {
    expect(pageLabel('number', 0, 5, 1)).toBe('1');
    expect(pageLabel('number', 2, 5, 10)).toBe('12');
  });

  it('keeps the total consistent with the starting number', () => {
    expect(pageLabel('page-of', 0, 3, 1)).toBe('Page 1 of 3');
    expect(pageLabel('page-of', 2, 3, 5)).toBe('Page 7 of 7');
  });
});
