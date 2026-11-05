import { describe, expect, it } from 'vitest';
import { adjustPixels, confidenceToAlpha } from './photo-edit';

const pixel = (r: number, g: number, b: number, a = 255) => new Uint8ClampedArray([r, g, b, a]);

describe('adjustPixels', () => {
  it('leaves the photo alone with no adjustments', () => {
    const data = pixel(10, 128, 250);
    adjustPixels(data, { brightness: 0, contrast: 0 });
    expect(Array.from(data)).toEqual([10, 128, 250, 255]);
  });

  it('brightens and darkens every colour channel but not transparency', () => {
    const brighter = pixel(100, 100, 100, 77);
    adjustPixels(brighter, { brightness: 50, contrast: 0 });
    expect(Array.from(brighter)).toEqual([164, 164, 164, 77]);

    const darker = pixel(100, 100, 100);
    adjustPixels(darker, { brightness: -50, contrast: 0 });
    expect(Array.from(darker)).toEqual([36, 36, 36, 255]);
  });

  it('spreads tones away from mid-grey with more contrast', () => {
    const data = pixel(78, 128, 178);
    adjustPixels(data, { brightness: 0, contrast: 100 });
    expect(Array.from(data)).toEqual([28, 128, 228, 255]);
  });

  it('flattens tones towards mid-grey with less contrast', () => {
    const data = pixel(0, 128, 255);
    adjustPixels(data, { brightness: 0, contrast: -50 });
    expect(Array.from(data)).toEqual([64, 128, 192, 255]);
  });

  it('clips instead of wrapping around', () => {
    const data = pixel(250, 5, 128);
    adjustPixels(data, { brightness: 100, contrast: 100 });
    expect(data[0]).toBe(255);
    adjustPixels(data, { brightness: -100, contrast: 100 });
    expect(data[1]).toBe(0);
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
