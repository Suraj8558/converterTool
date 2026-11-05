import { describe, expect, it } from 'vitest';
import { alignToFace, cropRect, layoutSheet, maxCopies, mmToPx, panCrop, PHOTO_SIZES, SHEET_SIZES, searchQuality } from './passport-photo';

const size = (id: string) => PHOTO_SIZES.find((photo) => photo.id === id)!;
const sheet = (id: string) => SHEET_SIZES.find((paper) => paper.id === id)!;

describe('mmToPx', () => {
  it('prints at 300 DPI', () => {
    expect(mmToPx(35)).toBe(413);
    expect(mmToPx(45)).toBe(531);
    expect(mmToPx(50.8)).toBe(600);
  });
});

describe('cropRect', () => {
  const image = { width: 1000, height: 800 };

  it('takes the largest centred crop with the photo shape', () => {
    const rect = cropRect(image, 35 / 45, { zoom: 1, centerX: 0.5, centerY: 0.5 });
    expect(rect.height).toBe(800);
    expect(rect.width).toBeCloseTo(622.22, 1);
    expect(rect.x).toBeCloseTo((1000 - rect.width) / 2);
    expect(rect.y).toBe(0);
  });

  it('zooms in around the centre', () => {
    const rect = cropRect(image, 1, { zoom: 2, centerX: 0.5, centerY: 0.5 });
    expect(rect).toEqual({ x: 300, y: 200, width: 400, height: 400 });
  });

  it('never leaves the image', () => {
    const rect = cropRect(image, 1, { zoom: 2, centerX: 0, centerY: 1 });
    expect(rect).toEqual({ x: 0, y: 400, width: 400, height: 400 });
  });

  it('handles images wider than tall and taller than wide', () => {
    const tall = cropRect({ width: 300, height: 2000 }, 35 / 45, { zoom: 1, centerX: 0.5, centerY: 0.5 });
    expect(tall.width).toBe(300);
    expect(tall.height).toBeCloseTo(385.71, 1);
  });
});

describe('panCrop', () => {
  it('moves the crop and stops at the edge', () => {
    const image = { width: 1000, height: 1000 };
    const moved = panCrop(image, 1, { zoom: 2, centerX: 0.5, centerY: 0.5 }, 100, -50);
    expect(cropRect(image, 1, moved)).toEqual({ x: 350, y: 200, width: 500, height: 500 });
    const stopped = panCrop(image, 1, moved, 10_000, 0);
    expect(cropRect(image, 1, stopped).x).toBe(500);
  });
});

describe('layoutSheet', () => {
  it('fits six 35 × 45 mm photos on 4 × 6 in paper', () => {
    expect(maxCopies(size('in'), sheet('4x6'))).toBe(6);
  });

  it('fits two 2 × 2 in photos on 4 × 6 in paper', () => {
    expect(maxCopies(size('us'), sheet('4x6'))).toBe(2);
  });

  it('turns the sheet sideways when that fits more', () => {
    // A wide 70 × 40 mm photo fits 1 × 3 upright on 4 × 6 in paper, but 2 × 2 sideways.
    const wide = { id: 'wide', label: 'Wide', widthMm: 70, heightMm: 40 };
    const layout = layoutSheet(wide, sheet('4x6'), 10);
    expect(layout).toMatchObject({ widthMm: 152.4, heightMm: 101.6, columns: 2, rows: 2 });
    expect(layout.slots).toHaveLength(4);
  });

  it('keeps every photo on the paper', () => {
    for (const photo of PHOTO_SIZES) {
      for (const paper of SHEET_SIZES) {
        const layout = layoutSheet(photo, paper, 100);
        expect(layout.slots.length).toBe(layout.columns * layout.rows);
        for (const slot of layout.slots) {
          expect(slot.x).toBeGreaterThanOrEqual(0);
          expect(slot.y).toBeGreaterThanOrEqual(0);
          expect(slot.x + photo.widthMm).toBeLessThanOrEqual(layout.widthMm);
          expect(slot.y + photo.heightMm).toBeLessThanOrEqual(layout.heightMm);
        }
      }
    }
  });

  it('places only the copies asked for', () => {
    expect(layoutSheet(size('in'), sheet('a4'), 4).slots).toHaveLength(4);
    expect(layoutSheet(size('in'), sheet('a4'), 0).slots).toHaveLength(0);
  });

  it('centres a partial row', () => {
    const layout = layoutSheet(size('in'), sheet('a4'), 1);
    expect(layout.slots[0].x).toBeCloseTo((layout.widthMm - 35) / 2);
  });
});

describe('alignToFace', () => {
  const image = { width: 2000, height: 3000 };
  const aspect = 35 / 45;
  const face = { x: 800, y: 900, width: 400, height: 500 };

  it('centres the crop on the face sideways', () => {
    expect(alignToFace(image, aspect, face).centerX).toBeCloseTo(0.5);
  });

  it('puts the chin on the lower guide line and the head top on the upper one', () => {
    const crop = alignToFace(image, aspect, face);
    const rect = cropRect(image, aspect, crop);
    const chin = face.y + face.height * 0.78;
    expect((chin - rect.y) / rect.height).toBeCloseTo(0.78, 2);
    expect((chin - face.height * 1.27 - rect.y) / rect.height).toBeCloseTo(0.12, 2);
  });

  it('zooms in more for a smaller face', () => {
    const small = alignToFace(image, aspect, { ...face, width: 160, height: 200 });
    expect(small.zoom).toBeGreaterThan(alignToFace(image, aspect, face).zoom);
  });

  it('never zooms out past the whole picture or in past the limit', () => {
    expect(alignToFace(image, aspect, { x: 0, y: 0, width: 2000, height: 3000 }).zoom).toBe(1);
    expect(alignToFace(image, aspect, { x: 900, y: 900, width: 10, height: 10 }).zoom).toBe(4);
  });

  it('keeps the crop inside the picture for a face near the edge', () => {
    const rect = cropRect(image, aspect, alignToFace(image, aspect, { x: 0, y: 0, width: 300, height: 400 }));
    expect(rect.x).toBeGreaterThanOrEqual(0);
    expect(rect.y).toBeGreaterThanOrEqual(0);
  });
});

describe('searchQuality', () => {
  // A pretend encoder whose files grow in proportion to quality.
  const encoder = (bytesAtFullQuality: number) => {
    const tried: number[] = [];
    return {
      tried,
      encode: async (quality: number) => {
        tried.push(quality);
        return { size: Math.round(quality * bytesAtFullQuality), quality };
      },
    };
  };

  it('keeps the best quality when it already fits', async () => {
    const { encode, tried } = encoder(50_000);
    const result = await searchQuality(encode, 100_000);
    expect(result?.quality).toBe(0.95);
    expect(tried).toEqual([0.95]);
  });

  it('finds the highest quality that fits', async () => {
    const { encode } = encoder(100_000);
    const result = await searchQuality(encode, 60_000);
    expect(result!.size).toBeLessThanOrEqual(60_000);
    expect(result!.size).toBeGreaterThan(58_000);
  });

  it('gives up when even the lowest quality is too big', async () => {
    const { encode } = encoder(1_000_000);
    expect(await searchQuality(encode, 100_000)).toBeNull();
  });
});
