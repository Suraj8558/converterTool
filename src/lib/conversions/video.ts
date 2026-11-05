import type { FFmpeg } from '@ffmpeg/ffmpeg';
import type { ProgressCallback } from './index';

// The engine files are copied to public/ffmpeg by scripts/copy-ffmpeg.mjs. They are
// imported at runtime because Turbopack can't bundle FFmpeg's dynamic worker URL.
let ffmpegPromise: Promise<FFmpeg> | null = null;

function loadFfmpeg(): Promise<FFmpeg> {
  ffmpegPromise ??= (async () => {
    const base = `${window.location.origin}/ffmpeg`;
    const { FFmpeg: FFmpegClass } = (await import(
      /* turbopackIgnore: true */ `${base}/index.js`
    )) as typeof import('@ffmpeg/ffmpeg');
    const ffmpeg = new FFmpegClass();
    await ffmpeg.load({
      coreURL: `${base}/ffmpeg-core.js`,
      wasmURL: `${base}/ffmpeg-core.wasm`,
    });
    return ffmpeg;
  })().catch((error) => {
    ffmpegPromise = null; // Allow a retry after a network failure.
    console.error('FFmpeg failed to load:', error);
    throw new Error('The video engine could not be loaded. Please check your connection and try again.');
  });
  return ffmpegPromise;
}

async function transcode(
  file: File,
  inputName: string,
  outputName: string,
  args: string[],
  mimeType: string,
  onProgress: ProgressCallback
): Promise<Blob> {
  const ffmpeg = await loadFfmpeg();
  const handleProgress = ({ progress }: { progress: number }) => {
    if (progress >= 0 && progress <= 1) onProgress(progress);
  };

  ffmpeg.on('progress', handleProgress);
  try {
    await ffmpeg.writeFile(inputName, new Uint8Array(await file.arrayBuffer()));
    const exitCode = await ffmpeg.exec(['-i', inputName, ...args, outputName]);
    if (exitCode !== 0) {
      throw new Error(`"${file.name}" could not be converted. It may be damaged or unsupported.`);
    }
    const data = await ffmpeg.readFile(outputName);
    return new Blob([data as Uint8Array<ArrayBuffer>], { type: mimeType });
  } finally {
    ffmpeg.off('progress', handleProgress);
    await ffmpeg.deleteFile(inputName).catch(() => undefined);
    await ffmpeg.deleteFile(outputName).catch(() => undefined);
  }
}

export function gifToMp4(file: File, onProgress: ProgressCallback): Promise<Blob> {
  return transcode(
    file,
    'input.gif',
    'output.mp4',
    [
      '-movflags', 'faststart',
      '-pix_fmt', 'yuv420p',
      // H.264 with yuv420p requires even dimensions.
      '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
    ],
    'video/mp4',
    onProgress
  );
}

export function mp4ToAvi(file: File, onProgress: ProgressCallback): Promise<Blob> {
  return transcode(
    file,
    'input.mp4',
    'output.avi',
    ['-c:v', 'mpeg4', '-q:v', '4', '-c:a', 'libmp3lame', '-q:a', '4'],
    'video/x-msvideo',
    onProgress
  );
}
