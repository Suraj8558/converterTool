import { describe, expect, it } from 'vitest';
import { defaultImageOptions, layoutImagePage } from './images-to-pdf';

const image = { width: 400, height: 200 };

describe('layoutImagePage', () => {
  it('sizes the page to the image by default', () => {
    expect(layoutImagePage(image, defaultImageOptions)).toEqual({
      page: { width: 300, height: 150 },
      image: { x: 0, y: 0, width: 300, height: 150 },
    });
  });

  it('adds margins around a fitted image', () => {
    const layout = layoutImagePage(image, { ...defaultImageOptions, margin: 'small' });
    expect(layout.page).toEqual({ width: 340, height: 190 });
    expect(layout.image).toMatchObject({ x: 20, y: 20, width: 300, height: 150 });
  });

  it('uses A4 portrait, with the image centered and undistorted', () => {
    const { page, image: placed } = layoutImagePage(image, { pageSize: 'a4', orientation: 'portrait', margin: 'none' });
    expect(page).toEqual({ width: 595.28, height: 841.89 });
    expect(placed.width).toBeCloseTo(595.28);
    expect(placed.height).toBeCloseTo(297.64);
    expect(placed.y).toBeCloseTo((841.89 - 297.64) / 2);
  });

  it('swaps the page for landscape', () => {
    const { page } = layoutImagePage(image, { pageSize: 'letter', orientation: 'landscape', margin: 'none' });
    expect(page).toEqual({ width: 792, height: 612 });
  });

  it('keeps the image inside large margins', () => {
    const { image: placed } = layoutImagePage(image, { pageSize: 'a4', orientation: 'portrait', margin: 'big' });
    expect(placed.x).toBe(40);
    expect(placed.width).toBeCloseTo(595.28 - 80);
  });
});
