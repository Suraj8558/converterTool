'use client';

import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { ArrowLeft, ArrowRight, Crop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FileDropzone } from '@/components/file-dropzone';
import { ResultPanel, ToolCard, baseName, primaryButtonClass, useResultFile, useToolError } from '@/components/tool-shell';
import { cropPdf, type CropMargins } from '@/lib/conversions/pdf-edit';
import { renderPages } from '@/lib/conversions/pdf-render';

const PREVIEW_WIDTH = 700;
const MIN_REMAINING = 5; // Percent of the page that must stay visible in each direction.
const NO_CROP: CropMargins = { top: 0, right: 0, bottom: 0, left: 0 };
const SIDES = ['top', 'right', 'bottom', 'left'] as const;

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));
const round = (value: number) => Math.round(value * 10) / 10;

export function CropPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [current, setCurrent] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [margins, setMargins] = useState<CropMargins>(NO_CROP);
  const [scope, setScope] = useState<'all' | 'this'>('all');
  const [isSaving, setIsSaving] = useState(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const { result, publish, clear } = useResultFile();
  const showError = useToolError('Could Not Crop PDF');

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    let url: string | null = null;

    renderPages(file, { width: PREVIEW_WIDTH, quality: 0.8, pages: [current] }, ({ blob, pageCount: total }) => {
      if (cancelled) return;
      url = URL.createObjectURL(blob);
      setPreview(url);
      setPageCount(total);
    }).catch((error) => {
      if (cancelled) return;
      showError(error);
      setFile(null);
    });

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [file, current, showError]);

  const positionIn = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: clampPercent(((event.clientX - rect.left) / rect.width) * 100),
      y: clampPercent(((event.clientY - rect.top) / rect.height) * 100),
    };
  };

  const handleDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return;
    const point = positionIn(event);
    setMargins({
      left: round(Math.min(dragStart.current.x, point.x)),
      right: round(100 - Math.max(dragStart.current.x, point.x)),
      top: round(Math.min(dragStart.current.y, point.y)),
      bottom: round(100 - Math.max(dragStart.current.y, point.y)),
    });
  };

  const isValid =
    SIDES.every((side) => Number.isFinite(margins[side]) && margins[side] >= 0) &&
    100 - margins.left - margins.right >= MIN_REMAINING &&
    100 - margins.top - margins.bottom >= MIN_REMAINING;
  const hasCrop = SIDES.some((side) => margins[side] > 0);

  const handleSave = async () => {
    if (!file) return;
    setIsSaving(true);
    try {
      publish(await cropPdf(file, margins, scope === 'all' ? 'all' : [current]), `${baseName(file)}_cropped.pdf`);
    } catch (error) {
      showError(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    clear();
    setFile(null);
    setPreview(null);
    setPageCount(0);
    setCurrent(0);
    setMargins(NO_CROP);
  };

  return (
    <ToolCard title="Crop PDF" description="Drag across the page to choose the area to keep, or enter margins.">
      {result ? (
        <ResultPanel result={result} resetLabel="Crop Another PDF" onReset={handleReset} />
      ) : !file ? (
        <FileDropzone accept="pdf" multiple={false} onFiles={([selected]) => setFile(selected)} />
      ) : (
        <>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="icon" aria-label="Previous page" disabled={current === 0} onClick={() => setCurrent(current - 1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm" data-testid="page-indicator">Page {current + 1} of {pageCount || '...'}</span>
            <Button variant="outline" size="icon" aria-label="Next page" disabled={current >= pageCount - 1} onClick={() => setCurrent(current + 1)}>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {preview ? (
            <div
              data-testid="crop-area"
              className="relative mx-auto w-fit max-w-full cursor-crosshair select-none overflow-hidden border touch-none"
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                dragStart.current = positionIn(event);
              }}
              onPointerMove={handleDrag}
              onPointerUp={() => {
                dragStart.current = null;
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- A local preview, not a site image. */}
              <img src={preview} alt={`Page ${current + 1}`} draggable={false} className="block max-h-[70vh] w-auto max-w-full" />
              {hasCrop && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
                  style={{
                    left: `${margins.left}%`,
                    right: `${margins.right}%`,
                    top: `${margins.top}%`,
                    bottom: `${margins.bottom}%`,
                  }}
                />
              )}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground">Loading page...</p>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {SIDES.map((side) => (
              <div key={side} className="space-y-2">
                <Label htmlFor={`crop-${side}`} className="capitalize">{side} (%)</Label>
                <Input
                  id={`crop-${side}`}
                  type="number"
                  min={0}
                  max={95}
                  value={margins[side]}
                  onChange={(event) => setMargins({ ...margins, [side]: event.target.valueAsNumber })}
                />
              </div>
            ))}
          </div>

          <RadioGroup value={scope} onValueChange={(value) => setScope(value as 'all' | 'this')} className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="all" id="scope-all" />
              <Label htmlFor="scope-all">All pages</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="this" id="scope-this" />
              <Label htmlFor="scope-this">This page only</Label>
            </div>
          </RadioGroup>

          <p className="text-xs text-muted-foreground">
            Cropping hides content but doesn&apos;t delete it from the file, so don&apos;t rely on it to remove anything private.
          </p>

          <Button onClick={handleSave} disabled={!isValid || !hasCrop || isSaving} className={primaryButtonClass}>
            <Crop className="mr-2 h-5 w-5" />
            {isSaving ? 'Cropping...' : 'Crop PDF'}
          </Button>
        </>
      )}
    </ToolCard>
  );
}
