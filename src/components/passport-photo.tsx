'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { Download, IdCard, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileDropzone } from '@/components/file-dropzone';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ToolCard, baseName, primaryButtonClass, selectClass, useToolError } from '@/components/tool-shell';
import {
  PHOTO_SIZES,
  SHEET_SIZES,
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

const BACKGROUNDS = [
  { label: 'White', value: '#ffffff' },
  { label: 'Off-white', value: '#f2f2f2' },
  { label: 'Light grey', value: '#d9d9d9' },
  { label: 'Light blue', value: '#dbe9f7' },
];

const PREVIEW_WIDTH = 240;
const KEY_STEP = 0.02;

interface Output {
  label: string;
  name: string;
  url: string;
}

export function PassportPhoto() {
  const [file, setFile] = useState<File | null>(null);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [photoId, setPhotoId] = useState(PHOTO_SIZES[0].id);
  const [sheetId, setSheetId] = useState(SHEET_SIZES[0].id);
  const [crop, setCrop] = useState<CropState>(defaultCrop);
  const [background, setBackground] = useState(BACKGROUNDS[0].value);
  const [copies, setCopies] = useState<number | ''>(6);
  const [cutLines, setCutLines] = useState(true);
  const [imageVersion, setImageVersion] = useState(0);
  const [made, setMade] = useState<{ key: string; outputs: Output[] } | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const showError = useToolError('Could Not Create Photos');

  const photo = PHOTO_SIZES.find((size) => size.id === photoId)!;
  const sheet = SHEET_SIZES.find((size) => size.id === sheetId)!;
  const aspect = photo.widthMm / photo.heightMm;
  const fits = maxCopies(photo, sheet);
  const copyCount = Math.min(Number(copies) || 0, fits);

  // Downloads stay on screen only while they match the current settings.
  const settingsKey = JSON.stringify([imageVersion, photoId, sheetId, crop, background, copyCount, cutLines]);
  const outputs = made?.key === settingsKey ? made.outputs : [];

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  // Release decoded images and finished files once they are replaced, or on unmount.
  useEffect(() => () => bitmap?.close(), [bitmap]);
  useEffect(() => () => made?.outputs.forEach((output) => URL.revokeObjectURL(output.url)), [made]);

  const previewHeight = Math.round(PREVIEW_WIDTH / aspect);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !bitmap) return;
    const scale = window.devicePixelRatio || 1;
    canvas.width = Math.round(PREVIEW_WIDTH * scale);
    canvas.height = Math.round(previewHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawPhoto(ctx, bitmap, crop, { x: 0, y: 0, width: canvas.width, height: canvas.height }, background);
  }, [bitmap, crop, background, previewHeight]);

  const handleFile = async (selected: File) => {
    try {
      const decoded = await createImageBitmap(selected);
      setFile(selected);
      setBitmap(decoded);
      setImageVersion((version) => version + 1);
      setCrop(defaultCrop);
    } catch {
      showError(new Error(`"${selected.name}" could not be read as an image.`));
    }
  };

  const reset = () => {
    setFile(null);
    setBitmap(null);
    setMade(null);
    setCrop(defaultCrop);
  };

  /** Moves the visible part of the photo by a distance measured on the preview. */
  const nudge = (dxPreview: number, dyPreview: number) => {
    if (!bitmap) return;
    setCrop((current) => {
      const visibleWidth = Math.min(bitmap.width, bitmap.height * aspect) / current.zoom;
      const sourcePerPreview = visibleWidth / PREVIEW_WIDTH;
      return panCrop(bitmap, aspect, current, dxPreview * sourcePerPreview, dyPreview * sourcePerPreview);
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
    if (!bitmap || !file || copyCount < 1) return;
    setIsWorking(true);
    try {
      const options: PassportOptions = { photo, sheet, copies: copyCount, crop, background, cutLines };
      const name = `${baseName(file)}_passport`;
      const [single, sheetJpg, sheetPdf] = await Promise.all([
        renderSinglePhoto(bitmap, options),
        renderSheetJpg(bitmap, options),
        renderSheetPdf(bitmap, options),
      ]);
      setMade({ key: settingsKey, outputs: [
        { label: 'Single Photo (JPG)', name: `${name}.jpg`, url: URL.createObjectURL(single) },
        { label: 'Print Sheet (PDF)', name: `${name}_sheet.pdf`, url: URL.createObjectURL(sheetPdf) },
        { label: 'Print Sheet (JPG)', name: `${name}_sheet.jpg`, url: URL.createObjectURL(sheetJpg) },
      ] });
    } catch (error) {
      showError(error);
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <ToolCard
      title="Passport Photo Maker"
      description="Crop a photo to an official passport or visa size and print a sheet of copies. Your photo never leaves your device."
      wide
    >
      {!bitmap ? (
        <FileDropzone accept="jpg,jpeg,png,webp" multiple={false} onFiles={([selected]) => handleFile(selected)} />
      ) : (
        <div className="grid gap-8 md:grid-cols-[auto_1fr]">
          <div className="space-y-3 mx-auto">
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
            </div>
            <p className="text-xs text-muted-foreground text-center max-w-[240px]">
              Fit your face inside the oval, with the top of your head near the upper line and your chin near the lower one.
            </p>
          </div>

          <div className="space-y-5">
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
                max={4}
                step={0.05}
                value={[crop.zoom]}
                onValueChange={([zoom]) => setCrop((current) => ({ ...current, zoom }))}
              />
            </div>

            <div className="space-y-2">
              <Label id="background-label">Background fill</Label>
              <div role="radiogroup" aria-labelledby="background-label" className="flex gap-2">
                {BACKGROUNDS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={background === option.value}
                    aria-label={option.label}
                    title={option.label}
                    onClick={() => setBackground(option.value)}
                    className="h-8 w-8 rounded-full border-2 transition-shadow aria-checked:ring-2 aria-checked:ring-primary aria-checked:ring-offset-2 ring-offset-background"
                    style={{ backgroundColor: option.value }}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Fills transparent areas and any space the photo doesn&apos;t cover. Use a photo taken against a plain, light wall.
              </p>
            </div>

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

            <div className="flex items-center gap-2">
              <Switch id="cut-lines" checked={cutLines} onCheckedChange={setCutLines} />
              <Label htmlFor="cut-lines">Show cutting lines on the sheet</Label>
            </div>

            {outputs.length === 0 ? (
              <Button onClick={handleCreate} disabled={isWorking || copyCount < 1} className={primaryButtonClass}>
                <IdCard className="mr-2 h-5 w-5" />
                {isWorking ? 'Creating...' : 'Create Passport Photos'}
              </Button>
            ) : (
              <div className="space-y-3">
                <h3 className="text-xl font-bold font-headline text-center">Your Photos Are Ready!</h3>
                {outputs.map((output) => (
                  <Button key={output.name} asChild size="lg" className="w-full" variant={output.name.endsWith('.pdf') ? 'default' : 'secondary'}>
                    <a href={output.url} download={output.name}>
                      <Download className="mr-2 h-5 w-5" />
                      Download {output.label}
                    </a>
                  </Button>
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
