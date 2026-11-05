import { describe, expect, it } from 'vitest';
import { encodeWav } from './mp3-to-wav';

const audio = (channels: number[][], sampleRate = 44100) => ({
  numberOfChannels: channels.length,
  length: channels[0].length,
  sampleRate,
  getChannelData: (channel: number) => Float32Array.from(channels[channel]),
});

describe('encodeWav', () => {
  it('writes a valid 16-bit PCM header', async () => {
    const blob = encodeWav(audio([[0, 0.5], [0, -0.5]]));
    const view = new DataView(await blob.arrayBuffer());
    const text = (start: number) => String.fromCharCode(...new Uint8Array(view.buffer, start, 4));

    expect(blob.type).toBe('audio/wav');
    expect(text(0)).toBe('RIFF');
    expect(text(8)).toBe('WAVE');
    expect(view.getUint16(20, true)).toBe(1); // PCM
    expect(view.getUint16(22, true)).toBe(2); // Channels
    expect(view.getUint32(24, true)).toBe(44100);
    expect(view.getUint32(28, true)).toBe(44100 * 2 * 2); // Bytes per second
    expect(view.getUint16(34, true)).toBe(16);
    expect(view.getUint32(40, true)).toBe(8); // 2 frames x 2 channels x 2 bytes
    expect(view.byteLength).toBe(52);
  });

  it('interleaves channels and clips out-of-range samples', async () => {
    const view = new DataView(await encodeWav(audio([[1, 2], [-1, -2]])).arrayBuffer());
    expect(view.getInt16(44, true)).toBe(32767);
    expect(view.getInt16(46, true)).toBe(-32768);
    expect(view.getInt16(48, true)).toBe(32767); // Clipped from 2
    expect(view.getInt16(50, true)).toBe(-32768); // Clipped from -2
  });
});
