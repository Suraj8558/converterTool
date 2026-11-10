'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { IdCard, ImagePlus, Loader2, RotateCcw, ScanFace, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileDropzone } from '@/components/file-dropzone';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { DownloadButton, ToolCard, baseName, primaryButtonClass, selectClass, useToolError } from '@/components/tool-shell';
import {
  PHOTO_SIZES,
  MAX_ZOOM,
  SHEET_SIZES,
  alignToFace,
  defaultCrop,
  drawPhoto,
  maxCopies,
  panCrop,
  renderSheetJpg,
  renderSheetPdf,
  renderSinglePhoto,
  type CropState,
  type PassportOptions,
} from '@/lib/conversions/passport-photo';
import {
  autoAdjustments,
  composePhoto,
  findFace,
  findPerson,
  isAdjusted,
  noAdjustments,
  workingCanvas,
  type Adjustments,
  type Backdrop,
  type PersonMask,
} from '@/lib/conversions/photo-edit';

const BACKGROUND_COLORS = [
  { label: 'White', value: '#ffffff' },
  { label: 'Off-white', value: '#f2f2f2' },
  { label: 'Light grey', value: '#d9d9d9' },
  { label: 'Light blue', value: '#dbe9f7' },
  { label: 'Blue', value: '#3d7fd1' },
  { label: 'Red', value: '#d63a3a' },
];

// Online visa and passport forms often cap the photo's file size.
const SIZE_LIMITS = [
  { label: 'No limit', kb: 0 },
  { label: 'Under 50 KB', kb: 50 },
  { label: 'Under 100 KB', kb: 100 },
  { label: 'Under 200 KB', kb: 200 },
  { label: 'Under 500 KB', kb: 500 },
];

const formatSize = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);

const PREVIEW_WIDTH = 240;
const KEY_STEP = 0.02;
const IMAGE_TYPES = 'image/jpeg,image/png,image/webp';

const swatchClass =
  'h-8 w-8 rounded-full border-2 transition-shadow aria-checked:ring-2 aria-checked:ring-primary aria-checked:ring-offset-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

interface Output {
  label: string;
  name: string;
  url: string;
}

interface BackdropImage {
  id: number;
  name: string;
  bitmap: ImageBitmap;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

export function PassportPhoto() {
  const [file, setFile] = useState<File | null>(null);
  const [base, setBase] = useState<HTMLCanvasElement | null>(null);
  const [imageVersion, setImageVersion] = useState(0);
  const [photoId, setPhotoId] = useState(PHOTO_SIZES[0].id);
  const [sheetId, setSheetId] = useState(SHEET_SIZES[0].id);
  const [crop, setCrop] = useState<CropState>(defaultCrop);

  const [removeBackground, setRemoveBackground] = useState(false);
  const [mask, setMask] = useState<{ version: number; mask: PersonMask } | null>(null);
  const [isFindingPerson, setIsFindingPerson] = useState(false);
  const [color, setColor] = useState(BACKGROUND_COLORS[0].value);
  const [backdropImage, setBackdropImage] = useState<BackdropImage | null>(null);
  const [useBackdropImage, setUseBackdropImage] = useState(false);
  const [adjustments, setAdjustments] = useState<Adjustments>(noAdjustments);

  const [isAligning, setIsAligning] = useState(false);
  const [sizeLimitKb, setSizeLimitKb] = useState(0);
  const [copies, setCopies] = useState<number | ''>(6);
  const [cutLines, setCutLines] = useState(true);
  const [made, setMade] = useState<{ key: string; outputs: Output[] } | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const showError = useToolError('Could Not Create Photos');

  const photo = PHOTO_SIZES.find((size) => size.id === photoId)!;
  const sheet = SHEET_SIZES.find((size) => size.id === sheetId)!;
  const aspect = photo.widthMm / photo.heightMm;
  const fits = maxCopies(photo, sheet);
  const copyCount = Math.min(Number(copies) || 0, fits);

  const personMask = removeBackground && mask?.version === imageVersion ? mask.mask : null;
  const showingImage = removeBackground && useBackdropImage && backdropImage !== null;
  const backdrop: Backdrop = showingImage ? { kind: 'image', image: backdropImage.bitmap } : { kind: 'color', color };
  const waitingForMask = removeBackground && !personMask;

  // Sliders move smoothly while the heavier recolouring catches up.
  const deferredAdjustments = useDeferredValue(adjustments);
  const composed = useMemo(
    () => (base ? composePhoto(base, deferredAdjustments, backdrop, personMask) : null),
    // backdrop is rebuilt each render; its parts are the real inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [base, deferredAdjustments, personMask, showingImage, backdropImage, color]
  );

  // Downloads stay on screen only while they match the current settings.
  const settingsKey = JSON.stringify([
    imageVersion, photoId, sheetId, crop, copyCount, cutLines,
    removeBackground, showingImage ? backdropImage.id : color, adjustments, sizeLimitKb,
  ]);
  const outputs = made?.key === settingsKey ? made.outputs : [];

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const backdropInputRef = useRef<HTMLInputElement>(null);

  // Release decoded images and finished files once they are replaced, or on unmount.
  useEffect(() => () => backdropImage?.bitmap.close(), [backdropImage]);
  useEffect(() => () => made?.outputs.forEach((output) => URL.revokeObjectURL(output.url)), [made]);

  const previewHeight = Math.round(PREVIEW_WIDTH / aspect);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !composed) return;
    const scale = window.devicePixelRatio || 1;
    canvas.width = Math.round(PREVIEW_WIDTH * scale);
    canvas.height = Math.round(previewHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawPhoto(ctx, composed, crop, { x: 0, y: 0, width: canvas.width, height: canvas.height }, color);
  }, [composed, crop, color, previewHeight]);

  const detectPerson = async (canvas: HTMLCanvasElement, version: number) => {
    setIsFindingPerson(true);
    try {
      const found = await findPerson(canvas);
      setMask({ version, mask: found });
    } catch (error) {
      setRemoveBackground(false);
      showError(error);
    } finally {
      setIsFindingPerson(false);
    }
  };

  const handleFile = async (selected: File) => {
    try {
      const decoded = await createImageBitmap(selected);
      const canvas = workingCanvas(decoded);
      decoded.close();
      const version = imageVersion + 1;
      setFile(selected);
      setBase(canvas);
      setImageVersion(version);
      setCrop(defaultCrop);
      setMask(null);
      if (removeBackground) void detectPerson(canvas, version);
    } catch {
      showError(new Error(`"${selected.name}" could not be read as an image.`));
    }
  };

  /** Picks brightness and contrast from the photo itself, judging only the person when known. */
  const handleAutoEnhance = () => {
    if (!base) return;
    const pixels = base.getContext('2d')?.getImageData(0, 0, base.width, base.height);
    if (!pixels) return;

    let weights: Uint8ClampedArray | undefined;
    if (personMask) {
      // The mask can be smaller than the photo, so look up each pixel's place in it.
      weights = new Uint8ClampedArray(base.width * base.height);
      for (let y = 0; y < base.height; y++) {
        const maskRow = Math.min(personMask.height - 1, Math.floor((y / base.height) * personMask.height)) * personMask.width;
        for (let x = 0; x < base.width; x++) {
          weights[y * base.width + x] = personMask.alpha[maskRow + Math.min(personMask.width - 1, Math.floor((x / base.width) * personMask.width))];
        }
      }
    }
    setAdjustments((current) => ({ ...current, ...autoAdjustments(pixels.data, weights) }));
  };

  const handleAlignFace = async () => {
    if (!base) return;
    setIsAligning(true);
    try {
      const face = await findFace(base);
      if (!face) {
        showError(new Error('No face was found. Use a photo where you face the camera, or position it by hand.'));
        return;
      }
      setCrop(alignToFace(base, aspect, face));
    } catch (error) {
      showError(error);
    } finally {
      setIsAligning(false);
    }
  };

  const toggleRemoveBackground = (on: boolean) => {
    setRemoveBackground(on);
    if (on && base && mask?.version !== imageVersion && !isFindingPerson) void detectPerson(base, imageVersion);
  };

  const handleBackdropFile = async (selected: File | undefined) => {
    if (!selected) return;
    try {
      const bitmap = await createImageBitmap(selected);
      setBackdropImage((current) => ({ id: (current?.id ?? 0) + 1, name: selected.name, bitmap }));
      setUseBackdropImage(true);
    } catch {
      showError(new Error(`"${selected.name}" could not be read as an image.`));
    }
  };

  const reset = () => {
    setFile(null);
    setBase(null);
    setMade(null);
    setMask(null);
    setCrop(defaultCrop);
    setAdjustments(noAdjustments);
  };

  /** Moves the visible part of the photo by a distance measured on the preview. */
  const nudge = (dxPreview: number, dyPreview: number) => {
    if (!base) return;
    setCrop((current) => {
      const visibleWidth = Math.min(base.width, base.height * aspect) / current.zoom;
      const sourcePerPreview = visibleWidth / PREVIEW_WIDTH;
      return panCrop(base, aspect, current, dxPreview * sourcePerPreview, dyPreview * sourcePerPreview);
    });
  };

  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY };
  };
  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const last = dragRef.current;
    if (!last) return;
    dragRef.current = { x: event.clientX, y: event.clientY };
    // Dragging the picture right shows more of its left side.
    nudge(last.x - event.clientX, last.y - event.clientY);
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };
  const onKeyDown = (event: KeyboardEvent<HTMLCanvasElement>) => {
    const step = KEY_STEP * PREVIEW_WIDTH;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    nudge(...move);
  };

  const handleCreate = async () => {
    if (!base || !file || copyCount < 1 || waitingForMask) return;
    setIsWorking(true);
    try {
      // Build from the latest settings, not the preview's possibly lagging copy.
      const finished = composePhoto(base, adjustments, backdrop, personMask);
      const options: PassportOptions = {
        photo, sheet, copies: copyCount, crop, background: color, cutLines,
        maxBytes: sizeLimitKb ? sizeLimitKb * 1024 : undefined,
      };
      const name = `${baseName(file)}_passport`;
      const [single, sheetJpg, sheetPdf] = await Promise.all([
        renderSinglePhoto(finished, options),
        renderSheetJpg(finished, options),
        renderSheetPdf(finished, options),
      ]);
      setMade({
        key: settingsKey,
        outputs: [
          { label: `Single Photo (JPG, ${formatSize(single.size)})`, name: `${name}.jpg`, url: URL.createObjectURL(single) },
          { label: 'Print Sheet (PDF)', name: `${name}_sheet.pdf`, url: URL.createObjectURL(sheetPdf) },
          { label: 'Print Sheet (JPG)', name: `${name}_sheet.jpg`, url: URL.createObjectURL(sheetJpg) },
        ],
      });
    } catch (error) {
      showError(error);
    } finally {
      setIsWorking(false);
    }
  };

  const setAdjustment = (key: keyof Adjustments) => ([value]: number[]) =>
    setAdjustments((current) => ({ ...current, [key]: value }));
  const signed = (value: number) => (value > 0 ? `+${value}` : `${value}`);

  return (
    <ToolCard
      title="Passport Photo Maker"
      description="Crop a photo to an official passport or visa size, swap the background, and print a sheet of copies. Your photo never leaves your device."
      wide
    >
      {!base ? (
        <FileDropzone accept="jpg,jpeg,png,webp" multiple={false} onFiles={([selected]) => handleFile(selected)} />
      ) : (
        <div className="grid gap-8 md:grid-cols-[auto_1fr]">
          <div className="space-y-3 mx-auto md:sticky md:top-20 self-start">
            <div className="relative rounded-md overflow-hidden border shadow-sm" style={{ width: PREVIEW_WIDTH, height: previewHeight }}>
              <canvas
                ref={canvasRef}
                role="img"
                tabIndex={0}
                aria-label="Photo preview. Drag or use the arrow keys to move the photo."
                className="block h-full w-full cursor-grab touch-none active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onKeyDown={onKeyDown}
              />
              {/* Guide: most offices want the face to fill about 70–80% of the photo height. */}
              <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <ellipse cx="50" cy="45" rx="24" ry="30" fill="none" stroke="white" strokeWidth="0.8" strokeDasharray="3 2" vectorEffect="non-scaling-stroke" opacity="0.9" />
                <line x1="0" y1="12" x2="100" y2="12" stroke="white" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" opacity="0.6" />
                <line x1="0" y1="78" x2="100" y2="78" stroke="white" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" opacity="0.6" />
              </svg>
              {isFindingPerson && (
                <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/70 text-sm font-medium">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  Removing background...
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center max-w-[240px]">
              Fit your face inside the oval, with the top of your head near the upper line and your chin near the lower one.
            </p>
          </div>

          <div className="space-y-8">
            <Section title="Size & framing">
              <div className="space-y-2">
                <Label htmlFor="photo-size">Photo size</Label>
                <select id="photo-size" className={selectClass} value={photoId} onChange={(event) => setPhotoId(event.target.value)}>
                  {PHOTO_SIZES.map((size) => (
                    <option key={size.id} value={size.id}>{size.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-3">
                <Label id="zoom-label">Zoom: {crop.zoom.toFixed(1)}×</Label>
                <Slider
                  aria-labelledby="zoom-label"
                  min={1}
                  max={MAX_ZOOM}
                  step={0.05}
                  value={[crop.zoom]}
                  onValueChange={([zoom]) => setCrop((current) => ({ ...current, zoom }))}
                />
              </div>
              <Button type="button" variant="outline" onClick={handleAlignFace} disabled={isAligning}>
                {isAligning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanFace className="mr-2 h-4 w-4" />}
                {isAligning ? 'Finding your face...' : 'Auto-align my face'}
              </Button>
            </Section>

            <Section title="Background">
              <div className="flex items-center gap-2">
                <Switch id="remove-background" checked={removeBackground} onCheckedChange={toggleRemoveBackground} />
                <Label htmlFor="remove-background">Remove the original background</Label>
              </div>

              <div className="space-y-2">
                <Label id="background-label">{removeBackground ? 'New background' : 'Fill colour'}</Label>
                <div role="radiogroup" aria-labelledby="background-label" className="flex flex-wrap items-center gap-2">
                  {BACKGROUND_COLORS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={!showingImage && color === option.value}
                      aria-label={option.label}
                      title={option.label}
                      onClick={() => {
                        setColor(option.value);
                        setUseBackdropImage(false);
                      }}
                      className={swatchClass}
                      style={{ backgroundColor: option.value }}
                    />
                  ))}
                  <label
                    title="Custom colour"
                    className="relative h-8 w-8 cursor-pointer rounded-full border-2 bg-[conic-gradient(red,yellow,lime,aqua,blue,magenta,red)] focus-within:ring-2 focus-within:ring-ring"
                  >
                    <input
                      type="color"
                      aria-label="Custom colour"
                      value={color}
                      onChange={(event) => {
                        setColor(event.target.value);
                        setUseBackdropImage(false);
                      }}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </label>
                  {removeBackground && (
                    <>
                      {backdropImage && (
                        <button
                          type="button"
                          role="radio"
                          aria-checked={showingImage}
                          aria-label={`Background image ${backdropImage.name}`}
                          title={backdropImage.name}
                          onClick={() => setUseBackdropImage(true)}
                          className={`${swatchClass} overflow-hidden bg-muted`}
                        >
                          <BackdropThumbnail bitmap={backdropImage.bitmap} />
                        </button>
                      )}
                      <Button type="button" variant="outline" size="sm" onClick={() => backdropInputRef.current?.click()}>
                        <ImagePlus className="mr-1 h-4 w-4" />
                        {backdropImage ? 'Change image' : 'Use an image'}
                      </Button>
                      <input
                        ref={backdropInputRef}
                        type="file"
                        accept={IMAGE_TYPES}
                        className="hidden"
                        aria-label="Background image"
                        onChange={(event) => {
                          void handleBackdropFile(event.target.files?.[0]);
                          event.target.value = '';
                        }}
                      />
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {removeBackground
                    ? 'Most passports need a plain white or light background. Check the rules for your country.'
                    : 'Fills transparent areas only. Turn on background removal to replace what is behind you.'}
                </p>
              </div>
            </Section>

            <Section title="Adjust">
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" variant="outline" onClick={handleAutoEnhance} disabled={waitingForMask}>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Auto-enhance
                </Button>
                {isAdjusted(adjustments) && (
                  <Button type="button" variant="link" className="h-auto p-0" onClick={() => setAdjustments(noAdjustments)}>
                    Reset all adjustments
                  </Button>
                )}
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-3">
                  <Label id="brightness-label">Brightness: {signed(adjustments.brightness)}</Label>
                  <Slider aria-labelledby="brightness-label" min={-50} max={50} step={1} value={[adjustments.brightness]} onValueChange={setAdjustment('brightness')} />
                </div>
                <div className="space-y-3">
                  <Label id="contrast-label">Contrast: {signed(adjustments.contrast)}</Label>
                  <Slider aria-labelledby="contrast-label" min={-50} max={50} step={1} value={[adjustments.contrast]} onValueChange={setAdjustment('contrast')} />
                </div>
                <div className="space-y-3">
                  <Label id="saturation-label">Colour: {signed(adjustments.saturation)}</Label>
                  <Slider aria-labelledby="saturation-label" min={-100} max={100} step={1} value={[adjustments.saturation]} onValueChange={setAdjustment('saturation')} />
                </div>
                <div className="space-y-3">
                  <Label id="rotation-label">Straighten: {adjustments.rotation > 0 ? '+' : ''}{adjustments.rotation.toFixed(1)}°</Label>
                  <Slider aria-labelledby="rotation-label" min={-15} max={15} step={0.5} value={[adjustments.rotation]} onValueChange={setAdjustment('rotation')} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Passport offices want natural colours and a level head. Don&apos;t over-edit: heavy changes can get a photo rejected.
              </p>
            </Section>

            <Section title="Print">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sheet-size">Print paper</Label>
                  <select id="sheet-size" className={selectClass} value={sheetId} onChange={(event) => setSheetId(event.target.value)}>
                    {SHEET_SIZES.map((size) => (
                      <option key={size.id} value={size.id}>{size.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="copies">Copies (up to {fits})</Label>
                  <Input
                    id="copies"
                    type="number"
                    min={1}
                    max={fits}
                    value={copies === '' ? '' : Math.min(copies, fits)}
                    onChange={(event) => {
                      const value = event.target.value === '' ? '' : parseInt(event.target.value, 10);
                      if (value === '' || !isNaN(value)) setCopies(value === '' ? '' : Math.max(1, value));
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="size-limit">Single photo file size</Label>
                <select id="size-limit" className={selectClass} value={sizeLimitKb} onChange={(event) => setSizeLimitKb(Number(event.target.value))}>
                  {SIZE_LIMITS.map((limit) => (
                    <option key={limit.kb} value={limit.kb}>{limit.label}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">For online forms with an upload limit. The size of the photo itself stays the same; only the JPG quality is lowered.</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="cut-lines" checked={cutLines} onCheckedChange={setCutLines} />
                <Label htmlFor="cut-lines">Show cutting lines on the sheet</Label>
              </div>
            </Section>

            {outputs.length === 0 ? (
              <Button onClick={handleCreate} disabled={isWorking || copyCount < 1 || waitingForMask} className={primaryButtonClass}>
                <IdCard className="mr-2 h-5 w-5" />
                {isWorking ? 'Creating...' : 'Create Passport Photos'}
              </Button>
            ) : (
              <div className="space-y-3">
                <h3 className="text-xl font-bold font-headline text-center">Your Photos Are Ready!</h3>
                {outputs.map((output) => (
                  <DownloadButton key={output.name} href={output.url} fileName={output.name} variant={output.name.endsWith('.pdf') ? 'default' : 'secondary'}>
                    {`Download ${output.label}`}
                  </DownloadButton>
                ))}
                <p className="text-xs text-muted-foreground text-center">
                  Print the sheet at 100% / &quot;actual size&quot;, not &quot;fit to page&quot;, so each photo comes out at {photo.widthMm} × {photo.heightMm} mm.
                </p>
              </div>
            )}

            <Button onClick={reset} variant="outline" className="w-full">
              <RotateCcw className="mr-2 h-4 w-4" />
              Use a Different Photo
            </Button>
          </div>
        </div>
      )}
    </ToolCard>
  );
}

function BackdropThumbnail({ bitmap }: { bitmap: ImageBitmap }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const side = Math.min(bitmap.width, bitmap.height);
    ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, canvas.width, canvas.height);
  }, [bitmap]);
  return <canvas ref={ref} width={64} height={64} className="h-full w-full" aria-hidden="true" />;
}
