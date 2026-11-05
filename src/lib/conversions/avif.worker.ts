// Uses the single-threaded encoder directly. The package's default entry also pulls
// in a multi-threaded build that refers to itself as a worker, which hangs Turbopack.
import createEncoder from '@jsquash/avif/codec/enc/avif_enc.js';
import { defaultOptions } from '@jsquash/avif/meta.js';

const encoder = createEncoder({ noInitialRun: true });

self.onmessage = async (event: MessageEvent<ImageData>) => {
  try {
    const { data, width, height } = event.data;
    const output = (await encoder).encode(new Uint8Array(data.buffer), width, height, {
      ...defaultOptions,
      quality: 60,
      speed: 7,
    });
    if (!output) throw new Error('AVIF encoding failed');
    const buffer = output.buffer as ArrayBuffer;
    self.postMessage({ buffer }, { transfer: [buffer] });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : String(error) });
  }
};
