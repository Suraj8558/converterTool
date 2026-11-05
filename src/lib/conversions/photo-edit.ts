// Photo clean-up for passport pictures: brightness and contrast, and swapping the
// background behind a person. Background removal uses MediaPipe's selfie segmentation
// model, which runs in the browser, so the photo never leaves the device.

export interface Adjustments {
  /** -100 to 100. 0 leaves the photo unchanged. */
  brightness: number;
  /** -100 to 100. 0 leaves the photo unchanged. */
  contrast: number;
}

export const noAdjustments: Adjustments = { brightness: 0, contrast: 0 };

/** Brightens or darkens, then stretches or flattens tones around mid-grey, in place. */
export function adjustPixels(data: Uint8ClampedArray, { brightness, contrast }: Adjustments) {
  if (brightness === 0 && contrast === 0) return;
  const offset = (brightness / 100) * 128;
  // A contrast of 100 doubles the spread of tones; -100 flattens everything to grey.
  const factor = 1 + contrast / 100;
  const table = new Uint8ClampedArray(256);
  for (let value = 0; value < 256; value++) {
    table[value] = Math.round((value + offset - 128) * factor + 128);
  }
  for (let index = 0; index < data.length; index += 4) {
    data[index] = table[data[index]];
    data[index + 1] = table[data[index + 1]];
    data[index + 2] = table[data[index + 2]];
  }
}

/**
 * Turns the model's per-pixel "is a person" confidence into opacity. Values in the
 * uncertain middle band fade smoothly, which keeps hair and shoulders from looking cut out.
 */
export function confidenceToAlpha(confidence: Float32Array, low = 0.25, high = 0.75): Uint8ClampedArray {
  const alpha = new Uint8ClampedArray(confidence.length);
  for (let index = 0; index < confidence.length; index++) {
    const t = Math.min(1, Math.max(0, (confidence[index] - low) / (high - low)));
    alpha[index] = Math.round(t * t * (3 - 2 * t) * 255);
  }
  return alpha;
}

export interface PersonMask {
  width: number;
  height: number;
  /** Opacity of the person at each pixel, 0 to 255. */
  alpha: Uint8ClampedArray;
}

const WASM_PATH = '/mediapipe';
const MODEL_FILE = 'selfie_multiclass_256x256.tflite';
// The build downloads the model next to the engine; if that failed, use Google's copy.
const MODEL_PATHS = [
  `/mediapipe/${MODEL_FILE}`,
  `https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/${MODEL_FILE}`,
];

type Segmenter = import('@mediapipe/tasks-vision').ImageSegmenter;
let segmenterPromise: Promise<Segmenter> | null = null;

function loadSegmenter(): Promise<Segmenter> {
  segmenterPromise ??= (async () => {
    const { FilesetResolver, ImageSegmenter } = await import('@mediapipe/tasks-vision');
    const fileset = await FilesetResolver.forVisionTasks(WASM_PATH);
    let lastError: unknown;
    for (const modelAssetPath of MODEL_PATHS) {
      try {
        return await ImageSegmenter.createFromOptions(fileset, {
          baseOptions: { modelAssetPath, delegate: 'CPU' },
          runningMode: 'IMAGE',
          outputConfidenceMasks: true,
          outputCategoryMask: false,
        });
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  })().catch((error) => {
    segmenterPromise = null; // Let the next attempt try again, say after a network blip.
    console.error('Background removal failed to load:', error);
    throw new Error('Background removal could not be loaded. Check your connection and try again.');
  });
  return segmenterPromise;
}

/** Finds the person in the photo. The first call downloads the model. */
export async function findPerson(image: HTMLCanvasElement): Promise<PersonMask> {
  const segmenter = await loadSegmenter();
  const result = segmenter.segment(image);
  try {
    const masks = result.confidenceMasks ?? [];
    if (masks.length === 0) throw new Error('No person could be found in this photo.');
    // The multi-class model's first mask is the background; everything else is the person,
    // including hair, clothes and accessories.
    const background = masks[0].getAsFloat32Array();
    const person = new Float32Array(background.length);
    for (let index = 0; index < background.length; index++) person[index] = 1 - background[index];
    return { width: masks[0].width, height: masks[0].height, alpha: confidenceToAlpha(person) };
  } finally {
    result.close();
  }
}

export type Backdrop = { kind: 'color'; color: string } | { kind: 'image'; image: ImageBitmap };

/** Large photos are scaled down first. 2000 px is still well above any print size here. */
export const WORKING_MAX_SIDE = 2000;

export function workingCanvas(source: ImageBitmap): HTMLCanvasElement {
  const scale = Math.min(1, WORKING_MAX_SIDE / Math.max(source.width, source.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function context(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  return ctx;
}

function drawBackdrop(ctx: CanvasRenderingContext2D, backdrop: Backdrop, width: number, height: number) {
  if (backdrop.kind === 'color') {
    ctx.fillStyle = backdrop.color;
    ctx.fillRect(0, 0, width, height);
    return;
  }
  // Cover the whole frame, cropping the backdrop image evenly on the long side.
  const { image } = backdrop;
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  ctx.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}

/**
 * Builds the finished photo at working size: adjusted colours, and the person placed on
 * the new backdrop when a mask is given. Without a mask the backdrop only shows through
 * transparent parts of the photo.
 */
export function composePhoto(
  base: HTMLCanvasElement,
  adjustments: Adjustments,
  backdrop: Backdrop,
  mask: PersonMask | null
): HTMLCanvasElement {
  const { width, height } = base;

  const subject = document.createElement('canvas');
  subject.width = width;
  subject.height = height;
  const subjectCtx = context(subject);
  subjectCtx.drawImage(base, 0, 0);
  if (adjustments.brightness !== 0 || adjustments.contrast !== 0) {
    const pixels = subjectCtx.getImageData(0, 0, width, height);
    adjustPixels(pixels.data, adjustments);
    subjectCtx.putImageData(pixels, 0, 0);
  }

  if (mask) {
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = mask.width;
    maskCanvas.height = mask.height;
    const maskPixels = new ImageData(mask.width, mask.height);
    for (let index = 0; index < mask.alpha.length; index++) maskPixels.data[index * 4 + 3] = mask.alpha[index];
    context(maskCanvas).putImageData(maskPixels, 0, 0);

    subjectCtx.globalCompositeOperation = 'destination-in';
    subjectCtx.imageSmoothingQuality = 'high';
    subjectCtx.drawImage(maskCanvas, 0, 0, width, height);
    subjectCtx.globalCompositeOperation = 'source-over';
  }

  const output = document.createElement('canvas');
  output.width = width;
  output.height = height;
  const ctx = context(output);
  drawBackdrop(ctx, backdrop, width, height);
  ctx.drawImage(subject, 0, 0);
  return output;
}
