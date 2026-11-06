// Photo clean-up for passport pictures: brightness, contrast, colour and tilt, and
// swapping the background behind a person. Background removal uses MediaPipe's selfie
// segmentation model, which runs in the browser, so the photo never leaves the device.

export interface Adjustments {
  /** -100 to 100. 0 leaves the photo unchanged. */
  brightness: number;
  /** -100 to 100. 0 leaves the photo unchanged. */
  contrast: number;
  /** -100 (black and white) to 100 (vivid). 0 leaves the photo unchanged. */
  saturation: number;
  /** Degrees to turn the photo clockwise, to level a tilted head. */
  rotation: number;
}

export const noAdjustments: Adjustments = { brightness: 0, contrast: 0, saturation: 0, rotation: 0 };

export const isAdjusted = (adjustments: Adjustments) =>
  (Object.keys(noAdjustments) as (keyof Adjustments)[]).some((key) => adjustments[key] !== noAdjustments[key]);

/** Brightens or darkens, stretches or flattens tones around mid-grey, then adjusts colour, in place. */
export function adjustPixels(data: Uint8ClampedArray, { brightness, contrast, saturation }: Adjustments) {
  if (brightness === 0 && contrast === 0 && saturation === 0) return;
  const offset = (brightness / 100) * 128;
  // A contrast of 100 doubles the spread of tones; -100 flattens everything to grey.
  const factor = 1 + contrast / 100;
  const table = new Uint8ClampedArray(256);
  for (let value = 0; value < 256; value++) {
    table[value] = Math.round((value + offset - 128) * factor + 128);
  }
  const colour = 1 + saturation / 100;
  for (let index = 0; index < data.length; index += 4) {
    const red = table[data[index]];
    const green = table[data[index + 1]];
    const blue = table[data[index + 2]];
    if (saturation === 0) {
      data[index] = red;
      data[index + 1] = green;
      data[index + 2] = blue;
      continue;
    }
    // Move each channel away from (or towards) the pixel's own grey.
    const grey = 0.299 * red + 0.587 * green + 0.114 * blue;
    data[index] = grey + (red - grey) * colour;
    data[index + 1] = grey + (green - grey) * colour;
    data[index + 2] = grey + (blue - grey) * colour;
  }
}

const clampTo = (value: number, limit: number) => Math.min(limit, Math.max(-limit, value));

/**
 * Suggests brightness and contrast that centre the photo's middle tone on mid-grey and
 * spread its darkest and lightest tones towards the ends, so a dim or washed-out photo
 * looks right in one click. Pass `weights` (0 to 255 per pixel) to judge only the person,
 * so a white wall doesn't skew the result.
 */
export function autoAdjustments(
  data: Uint8ClampedArray,
  weights?: Uint8ClampedArray,
  limit = 50
): Pick<Adjustments, 'brightness' | 'contrast'> {
  const histogram = new Float64Array(256);
  let total = 0;
  for (let pixel = 0; pixel < data.length / 4; pixel++) {
    const weight = weights ? weights[pixel] / 255 : 1;
    if (weight === 0) continue;
    const grey = Math.round(0.299 * data[pixel * 4] + 0.587 * data[pixel * 4 + 1] + 0.114 * data[pixel * 4 + 2]);
    histogram[grey] += weight;
    total += weight;
  }
  if (total === 0) return { brightness: 0, contrast: 0 };

  const percentile = (fraction: number) => {
    let seen = 0;
    for (let value = 0; value < 256; value++) {
      seen += histogram[value];
      if (seen >= total * fraction) return value;
    }
    return 255;
  };
  const low = percentile(0.02);
  const middle = percentile(0.5);
  const high = percentile(0.98);

  // Stretch the 2nd to 98th percentile tones to about 12..243, then bring the middle to grey.
  const spread = Math.max(1, high - low);
  const factor = Math.min(1 + limit / 100, Math.max(1 - limit / 100, 231 / spread));
  return {
    contrast: Math.round(clampTo((factor - 1) * 100, limit)),
    brightness: Math.round(clampTo(((128 - middle) / 128) * 100, limit)),
  };
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

type Vision = typeof import('@mediapipe/tasks-vision');
type Fileset = Awaited<ReturnType<Vision['FilesetResolver']['forVisionTasks']>>;

let filesetPromise: Promise<{ vision: Vision; fileset: Fileset }> | null = null;

function loadEngine() {
  filesetPromise ??= (async () => {
    const vision = await import('@mediapipe/tasks-vision');
    return { vision, fileset: await vision.FilesetResolver.forVisionTasks(WASM_PATH) };
  })().catch((error) => {
    filesetPromise = null; // Let the next attempt try again, say after a network blip.
    throw error;
  });
  return filesetPromise;
}

/** Tries each place a model could be served from, keeping the first that loads. */
async function createFirstThatLoads<T>(paths: string[], create: (modelAssetPath: string) => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (const path of paths) {
    try {
      return await create(path);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

type Segmenter = import('@mediapipe/tasks-vision').ImageSegmenter;
let segmenterPromise: Promise<Segmenter> | null = null;

function loadSegmenter(): Promise<Segmenter> {
  segmenterPromise ??= (async () => {
    const { vision, fileset } = await loadEngine();
    return createFirstThatLoads(MODEL_PATHS, (modelAssetPath) =>
      vision.ImageSegmenter.createFromOptions(fileset, {
        baseOptions: { modelAssetPath, delegate: 'CPU' },
        runningMode: 'IMAGE',
        outputConfidenceMasks: true,
        outputCategoryMask: false,
      })
    );
  })().catch((error) => {
    segmenterPromise = null;
    console.error('Background removal failed to load:', error);
    throw new Error('Background removal could not be loaded. Check your connection and try again.');
  });
  return segmenterPromise;
}

const FACE_MODEL_FILE = 'blaze_face_short_range.tflite';
const FACE_MODEL_PATHS = [
  `/mediapipe/${FACE_MODEL_FILE}`,
  `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/${FACE_MODEL_FILE}`,
];

type Detector = import('@mediapipe/tasks-vision').FaceDetector;
let detectorPromise: Promise<Detector> | null = null;

function loadDetector(): Promise<Detector> {
  detectorPromise ??= (async () => {
    const { vision, fileset } = await loadEngine();
    return createFirstThatLoads(FACE_MODEL_PATHS, (modelAssetPath) =>
      vision.FaceDetector.createFromOptions(fileset, {
        baseOptions: { modelAssetPath, delegate: 'CPU' },
        runningMode: 'IMAGE',
        minDetectionConfidence: 0.5,
      })
    );
  })().catch((error) => {
    detectorPromise = null;
    console.error('Face detection failed to load:', error);
    throw new Error('Face detection could not be loaded. Check your connection and try again.');
  });
  return detectorPromise;
}

/** Finds the largest face in the photo, or null if there isn't one. */
export async function findFace(image: HTMLCanvasElement): Promise<{ x: number; y: number; width: number; height: number } | null> {
  const detector = await loadDetector();
  const boxes = detector
    .detect(image)
    .detections.flatMap((detection) => (detection.boundingBox ? [detection.boundingBox] : []));
  if (boxes.length === 0) return null;
  const largest = boxes.reduce((a, b) => (b.width * b.height > a.width * a.height ? b : a));
  return { x: largest.originX, y: largest.originY, width: largest.width, height: largest.height };
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
  if (adjustments.brightness !== 0 || adjustments.contrast !== 0 || adjustments.saturation !== 0) {
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
  if (adjustments.rotation !== 0) {
    // Turn only the person, so the backdrop fills the corners the turn uncovers.
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate((adjustments.rotation * Math.PI) / 180);
    ctx.drawImage(subject, -width / 2, -height / 2);
    ctx.restore();
  } else {
    ctx.drawImage(subject, 0, 0);
  }
  return output;
}
