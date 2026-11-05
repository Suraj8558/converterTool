// Passport and visa photos: crop a portrait to an official size, then tile copies
// onto a sheet of photo paper that can be printed at home or at a print shop.

/** Print resolution. Photo labs and passport offices expect at least 300 DPI. */
export const PRINT_DPI = 300;
const MM_PER_INCH = 25.4;
const POINTS_PER_MM = 72 / MM_PER_INCH;

export const mmToPx = (mm: number, dpi = PRINT_DPI) => Math.round((mm / MM_PER_INCH) * dpi);

export interface PhotoSize {
  id: string;
  label: string;
  widthMm: number;
  heightMm: number;
}

export const PHOTO_SIZES: PhotoSize[] = [
  { id: 'in', label: 'India passport / visa (35 × 45 mm)', widthMm: 35, heightMm: 45 },
  { id: 'eu', label: 'UK / EU / Schengen (35 × 45 mm)', widthMm: 35, heightMm: 45 },
  { id: 'us', label: 'US passport / visa (2 × 2 in)', widthMm: 50.8, heightMm: 50.8 },
  { id: 'ca', label: 'Canada passport (50 × 70 mm)', widthMm: 50, heightMm: 70 },
  { id: 'au', label: 'Australia passport (35 × 45 mm)', widthMm: 35, heightMm: 45 },
  { id: 'cn', label: 'China visa (33 × 48 mm)', widthMm: 33, heightMm: 48 },
  { id: 'jp', label: 'Japan passport (35 × 45 mm)', widthMm: 35, heightMm: 45 },
  { id: 'my', label: 'Malaysia passport (35 × 50 mm)', widthMm: 35, heightMm: 50 },
  { id: 'stamp', label: 'Stamp size (20 × 25 mm)', widthMm: 20, heightMm: 25 },
];

export interface SheetSize {
  id: string;
  label: string;
  widthMm: number;
  heightMm: number;
}

export const SHEET_SIZES: SheetSize[] = [
  { id: '4x6', label: '4 × 6 in photo paper', widthMm: 101.6, heightMm: 152.4 },
  { id: '5x7', label: '5 × 7 in photo paper', widthMm: 127, heightMm: 177.8 },
  { id: 'a4', label: 'A4', widthMm: 210, heightMm: 297 },
  { id: 'letter', label: 'US Letter', widthMm: 215.9, heightMm: 279.4 },
];

/** Space between photos and around the sheet edge, leaving room to cut. */
const SHEET_GAP_MM = 3;
const SHEET_MARGIN_MM = 4;

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CropState {
  /** 1 shows the largest crop that fits; higher values zoom in. */
  zoom: number;
  /** Centre of the crop, as a fraction of the image width and height. */
  centerX: number;
  centerY: number;
}

export const defaultCrop: CropState = { zoom: 1, centerX: 0.5, centerY: 0.5 };


/** The most the preview can zoom in. */
export const MAX_ZOOM = 4;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** The part of the source image that becomes the photo, kept inside the image. */
export function cropRect(image: { width: number; height: number }, aspect: number, crop: CropState): Rect {
  const zoom = Math.max(1, crop.zoom);
  let width = image.width;
  let height = width / aspect;
  if (height > image.height) {
    height = image.height;
    width = height * aspect;
  }
  width /= zoom;
  height /= zoom;

  const x = clamp(crop.centerX * image.width - width / 2, 0, image.width - width);
  const y = clamp(crop.centerY * image.height - height / 2, 0, image.height - height);
  return { x, y, width, height };
}

/** Moves the crop by a distance in source pixels, keeping it inside the image. */
export function panCrop(
  image: { width: number; height: number },
  aspect: number,
  crop: CropState,
  dx: number,
  dy: number
): CropState {
  const rect = cropRect(image, aspect, crop);
  const x = clamp(rect.x + dx, 0, image.width - rect.width);
  const y = clamp(rect.y + dy, 0, image.height - rect.height);
  return {
    ...crop,
    centerX: (x + rect.width / 2) / image.width,
    centerY: (y + rect.height / 2) / image.height,
  };
}

/** A detected face, in pixels of the image it was found in. */
export interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Where the head sits in the finished photo, as fractions of its height. These match the
// guide drawn over the preview: head top on the upper line, chin on the lower one.
const HEAD_TOP = 0.12;
const CHIN = 0.78;
// The face detector's box is roughly square and reaches a little below the chin, so the
// chin is found part-way up the box, and the whole head, hair included, is a bit taller
// than the box. Measured on sample portraits.
const CHIN_IN_BOX = 0.78;
const HEAD_TO_FACE_HEIGHT = 1.27;

/** Zoom and position that put a detected face where passport offices expect it. */
export function alignToFace(image: { width: number; height: number }, aspect: number, face: FaceBox): CropState {
  const headHeight = face.height * HEAD_TO_FACE_HEIGHT;
  const cropHeight = headHeight / (CHIN - HEAD_TOP);
  const chinY = face.y + face.height * CHIN_IN_BOX;
  const cropTop = chinY - CHIN * cropHeight;

  const fullHeight = cropRect(image, aspect, defaultCrop).height;
  const zoom = clamp(fullHeight / cropHeight, 1, MAX_ZOOM);
  return {
    zoom,
    centerX: (face.x + face.width / 2) / image.width,
    // Centre of the crop; cropRect keeps it inside the image if the face is near an edge.
    centerY: (cropTop + fullHeight / zoom / 2) / image.height,
  };
}

/** Lowest JPG quality tried when squeezing a photo under a size limit. */
const MIN_QUALITY = 0.3;
const BEST_QUALITY = 0.95;

/**
 * Finds the best JPG quality whose file is no bigger than `maxBytes`: full quality if that
 * fits, otherwise the highest quality found by halving the range. Returns null when even
 * the lowest quality is too big.
 */
export async function searchQuality<T extends { size: number }>(
  encode: (quality: number) => Promise<T>,
  maxBytes: number
): Promise<T | null> {
  const best = await encode(BEST_QUALITY);
  if (best.size <= maxBytes) return best;

  let fitting = await encode(MIN_QUALITY);
  if (fitting.size > maxBytes) return null;

  let low = MIN_QUALITY;
  let high = BEST_QUALITY;
  for (let step = 0; step < 7; step++) {
    const middle = (low + high) / 2;
    const attempt = await encode(middle);
    if (attempt.size <= maxBytes) {
      fitting = attempt;
      low = middle;
    } else {
      high = middle;
    }
  }
  return fitting;
}

export interface SheetLayout {
  widthMm: number;
  heightMm: number;
  columns: number;
  rows: number;
  /** Top-left corner of each photo, measured from the top-left of the sheet. */
  slots: { x: number; y: number }[];
}

function gridFor(photo: { widthMm: number; heightMm: number }, widthMm: number, heightMm: number) {
  const fit = (space: number, size: number) =>
    Math.max(0, Math.floor((space - SHEET_MARGIN_MM * 2 + SHEET_GAP_MM) / (size + SHEET_GAP_MM)));
  return { columns: fit(widthMm, photo.widthMm), rows: fit(heightMm, photo.heightMm) };
}

/**
 * Tiles up to `copies` photos on the sheet, turning the sheet sideways when that fits
 * more. Photos start at the top margin and are centred across, so the unused strip
 * at the bottom can be kept for another print.
 */
export function layoutSheet(photo: PhotoSize, sheet: SheetSize, copies: number): SheetLayout {
  const portrait = gridFor(photo, sheet.widthMm, sheet.heightMm);
  const landscape = gridFor(photo, sheet.heightMm, sheet.widthMm);
  const useLandscape = landscape.columns * landscape.rows > portrait.columns * portrait.rows;
  const { columns, rows } = useLandscape ? landscape : portrait;
  const widthMm = useLandscape ? sheet.heightMm : sheet.widthMm;
  const heightMm = useLandscape ? sheet.widthMm : sheet.heightMm;

  const count = Math.min(Math.max(0, Math.floor(copies)), columns * rows);
  const usedColumns = Math.min(columns, count);
  const usedRows = Math.ceil(count / Math.max(1, columns));
  const blockWidth = usedColumns * photo.widthMm + Math.max(0, usedColumns - 1) * SHEET_GAP_MM;
  const blockHeight = usedRows * photo.heightMm + Math.max(0, usedRows - 1) * SHEET_GAP_MM;
  const left = (widthMm - blockWidth) / 2;
  const top = Math.min(SHEET_MARGIN_MM, Math.max(0, (heightMm - blockHeight) / 2));

  const slots = Array.from({ length: count }, (_, index) => ({
    x: left + (index % columns) * (photo.widthMm + SHEET_GAP_MM),
    y: top + Math.floor(index / columns) * (photo.heightMm + SHEET_GAP_MM),
  }));
  return { widthMm, heightMm, columns, rows, slots };
}

export const maxCopies = (photo: PhotoSize, sheet: SheetSize) => {
  const layout = layoutSheet(photo, sheet, Number.MAX_SAFE_INTEGER);
  return layout.columns * layout.rows;
};

function newCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  return { canvas, ctx };
}

function canvasBlob(canvas: HTMLCanvasElement, type: string, quality = 0.95): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('The photo could not be saved. Try a smaller image.'))),
      type,
      quality
    )
  );
}

/**
 * Draws the cropped photo onto a canvas. The background colour fills any transparent
 * areas, since JPG has no transparency and offices expect a plain backdrop.
 */
export function drawPhoto(
  ctx: CanvasRenderingContext2D,
  source: PhotoSource,
  crop: CropState,
  target: Rect,
  background: string
) {
  const rect = cropRect(source, target.width / target.height, crop);
  ctx.fillStyle = background;
  ctx.fillRect(target.x, target.y, target.width, target.height);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, rect.x, rect.y, rect.width, rect.height, target.x, target.y, target.width, target.height);
}

/** The finished photo before cropping: an image, or a canvas with edits applied. */
export type PhotoSource = ImageBitmap | HTMLCanvasElement;

export interface PassportOptions {
  photo: PhotoSize;
  sheet: SheetSize;
  copies: number;
  crop: CropState;
  background: string;
  /** Thin grey lines around each photo on the sheet, to guide the scissors. */
  cutLines: boolean;
  /** Largest size, in bytes, for the single-photo JPG. Online forms often set one. */
  maxBytes?: number;
}

export async function renderSinglePhoto(source: PhotoSource, options: PassportOptions): Promise<Blob> {
  const width = mmToPx(options.photo.widthMm);
  const height = mmToPx(options.photo.heightMm);
  const { canvas, ctx } = newCanvas(width, height);
  drawPhoto(ctx, source, options.crop, { x: 0, y: 0, width, height }, options.background);

  if (!options.maxBytes) return canvasBlob(canvas, 'image/jpeg');
  const fitted = await searchQuality((quality) => canvasBlob(canvas, 'image/jpeg', quality), options.maxBytes);
  if (!fitted) {
    throw new Error(
      `This photo can't be made smaller than ${Math.round(options.maxBytes / 1024)} KB without becoming blurry. Choose a larger limit.`
    );
  }
  return fitted;
}

function renderSheetCanvas(source: PhotoSource, options: PassportOptions) {
  const layout = layoutSheet(options.photo, options.sheet, options.copies);
  if (layout.slots.length === 0) throw new Error('This photo size does not fit on the chosen paper.');

  const { canvas, ctx } = newCanvas(mmToPx(layout.widthMm), mmToPx(layout.heightMm));
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw one photo, then stamp copies of it so every copy is identical.
  const width = mmToPx(options.photo.widthMm);
  const height = mmToPx(options.photo.heightMm);
  const single = newCanvas(width, height);
  drawPhoto(single.ctx, source, options.crop, { x: 0, y: 0, width, height }, options.background);

  for (const slot of layout.slots) {
    const x = mmToPx(slot.x);
    const y = mmToPx(slot.y);
    ctx.drawImage(single.canvas, x, y);
    if (options.cutLines) {
      ctx.strokeStyle = '#b0b0b0';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 0.5, y - 0.5, width + 1, height + 1);
    }
  }
  return { canvas, layout };
}

export async function renderSheetJpg(source: PhotoSource, options: PassportOptions): Promise<Blob> {
  return canvasBlob(renderSheetCanvas(source, options).canvas, 'image/jpeg');
}

/** A PDF keeps the exact paper size, so printers don't rescale the photos. */
export async function renderSheetPdf(source: PhotoSource, options: PassportOptions): Promise<Blob> {
  const { canvas, layout } = renderSheetCanvas(source, options);
  const jpg = new Uint8Array(await (await canvasBlob(canvas, 'image/jpeg')).arrayBuffer());

  const { PDFDocument } = await import('pdf-lib');
  const pdf = await PDFDocument.create();
  const width = layout.widthMm * POINTS_PER_MM;
  const height = layout.heightMm * POINTS_PER_MM;
  const image = await pdf.embedJpg(jpg);
  pdf.addPage([width, height]).drawImage(image, { x: 0, y: 0, width, height });
  return new Blob([(await pdf.save()) as BlobPart], { type: 'application/pdf' });
}
