import { describe, expect, it } from 'vitest';
import { adjustPixels, autoAdjustments, confidenceToAlpha, isAdjusted, noAdjustments } from './photo-edit';

const pixel = (r: number, g: number, b: number, a = 255) => new Uint8ClampedArray([r, g, b, a]);
const adj = (changes: Partial<typeof noAdjustments>) => ({ ...noAdjustments, ...changes });

describe('adjustPixels', () => {
  it('leaves the photo alone with no adjustments', () => {
    const data = pixel(10, 128, 250);
    adjustPixels(data, adj({ brightness: 0, contrast: 0 }));
    expect(Array.from(data)).toEqual([10, 128, 250, 255]);
  });

  it('brightens and darkens every colour channel but not transparency', () => {
    const brighter = pixel(100, 100, 100, 77);
    adjustPixels(brighter, adj({ brightness: 50, contrast: 0 }));
    expect(Array.from(brighter)).toEqual([164, 164, 164, 77]);

    const darker = pixel(100, 100, 100);
    adjustPixels(darker, adj({ brightness: -50, contrast: 0 }));
    expect(Array.from(darker)).toEqual([36, 36, 36, 255]);
  });

  it('spreads tones away from mid-grey with more contrast', () => {
    const data = pixel(78, 128, 178);
    adjustPixels(data, adj({ brightness: 0, contrast: 100 }));
    expect(Array.from(data)).toEqual([28, 128, 228, 255]);
  });

  it('flattens tones towards mid-grey with less contrast', () => {
    const data = pixel(0, 128, 255);
    adjustPixels(data, adj({ brightness: 0, contrast: -50 }));
    expect(Array.from(data)).toEqual([64, 128, 192, 255]);
  });

  it('clips instead of wrapping around', () => {
    const data = pixel(250, 5, 128);
    adjustPixels(data, adj({ brightness: 100, contrast: 100 }));
    expect(data[0]).toBe(255);
    adjustPixels(data, adj({ brightness: -100, contrast: 100 }));
    expect(data[1]).toBe(0);
  });
});

describe('adjustPixels saturation', () => {
  it('turns colours to grey at -100', () => {
    const data = pixel(200, 100, 50);
    adjustPixels(data, adj({ saturation: -100 }));
    expect(data[0]).toBe(data[1]);
    expect(data[1]).toBe(data[2]);
  });

  it('makes colours stronger and keeps greys as they are', () => {
    const colourful = pixel(200, 100, 50);
    adjustPixels(colourful, adj({ saturation: 50 }));
    expect(colourful[0]).toBeGreaterThan(200);
    expect(colourful[2]).toBeLessThan(50);

    const grey = pixel(90, 90, 90);
    adjustPixels(grey, adj({ saturation: 80 }));
    expect(Array.from(grey)).toEqual([90, 90, 90, 255]);
  });
});

describe('isAdjusted', () => {
  it('is true once any adjustment moves off zero', () => {
    expect(isAdjusted(noAdjustments)).toBe(false);
    expect(isAdjusted(adj({ rotation: -2.5 }))).toBe(true);
    expect(isAdjusted(adj({ saturation: 10 }))).toBe(true);
  });
});

describe('autoAdjustments', () => {
  const greys = (values: number[]) => new Uint8ClampedArray(values.flatMap((value) => [value, value, value, 255]));
  const spread = (low: number, high: number, count = 100) =>
    Array.from({ length: count }, (_, index) => Math.round(low + ((high - low) * index) / (count - 1)));

  it('leaves a well-exposed photo almost alone', () => {
    const result = autoAdjustments(greys(spread(12, 243)));
    expect(Math.abs(result.brightness)).toBeLessThanOrEqual(5);
    expect(Math.abs(result.contrast)).toBeLessThanOrEqual(5);
  });

  it('brightens a dark photo', () => {
    expect(autoAdjustments(greys(spread(5, 120))).brightness).toBeGreaterThan(10);
  });

  it('darkens a bright photo', () => {
    expect(autoAdjustments(greys(spread(140, 250))).brightness).toBeLessThan(-10);
  });

  it('adds contrast to a flat photo and removes it from a harsh one', () => {
    expect(autoAdjustments(greys(spread(100, 160))).contrast).toBeGreaterThan(20);
    expect(autoAdjustments(greys([0, ...spread(0, 255), 255])).contrast).toBeLessThan(0);
  });

  it('stays within the slider limits', () => {
    const result = autoAdjustments(greys(spread(0, 10)));
    expect(result.brightness).toBe(50);
    expect(result.contrast).toBe(50);
  });

  it('judges only the weighted pixels, such as the person without the wall', () => {
    // A bright wall fills most of the frame, with a darker person in front. Only the person counts.
    const values = [...Array(70).fill(250), ...spread(20, 100, 30)];
    const weights = new Uint8ClampedArray(values.map((_, index) => (index < 70 ? 0 : 255)));
    expect(autoAdjustments(greys(values), weights).brightness).toBeGreaterThan(20);
    expect(autoAdjustments(greys(values)).brightness).toBeLessThan(0);
  });

  it('returns no change when there is nothing to judge', () => {
    expect(autoAdjustments(greys([10, 20]), new Uint8ClampedArray([0, 0]))).toEqual({ brightness: 0, contrast: 0 });
  });
});

describe('confidenceToAlpha', () => {
  it('hides sure background, keeps a sure person, and fades in between', () => {
    const alpha = confidenceToAlpha(new Float32Array([0, 0.2, 0.5, 0.8, 1]));
    expect(Array.from(alpha)).toEqual([0, 0, 128, 255, 255]);
  });

  it('rises steadily through the uncertain band', () => {
    const alpha = Array.from(confidenceToAlpha(new Float32Array([0.3, 0.4, 0.5, 0.6, 0.7])));
    expect([...alpha].sort((a, b) => a - b)).toEqual(alpha);
  });
});
