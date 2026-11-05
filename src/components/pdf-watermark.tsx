'use client';

import { useState } from 'react';
import { Stamp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { FileDropzone } from '@/components/file-dropzone';
import { STAMP_POSITIONS } from '@/components/pdf-page-numbers';
import { ResultPanel, ToolCard, baseName, primaryButtonClass, selectClass, useResultFile, useToolError } from '@/components/tool-shell';
import { addWatermark } from '@/lib/conversions/pdf-edit';
import type { StampPosition } from '@/lib/conversions/pdf-geometry';

export function PdfWatermark() {
  const [file, setFile] = useState<File | null>(null);
  const [kind, setKind] = useState<'text' | 'image'>('text');
  const [text, setText] = useState('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState('#808080');
  const [image, setImage] = useState<File | null>(null);
  const [widthPercent, setWidthPercent] = useState(40);
  const [position, setPosition] = useState<StampPosition>('center');
  const [diagonal, setDiagonal] = useState(true);
  const [opacity, setOpacity] = useState(30);
  const [isSaving, setIsSaving] = useState(false);
  const { result, publish, clear } = useResultFile();
  const showError = useToolError('Could Not Add Watermark');

  const isValid = kind === 'text' ? text.trim().length > 0 && fontSize >= 6 && fontSize <= 200 : image !== null;

  const handleSave = async () => {
    if (!file) return;
    setIsSaving(true);
    try {
      const content =
        kind === 'text'
          ? { kind, text: text.trim(), fontSize, color }
          : { kind, file: image!, widthPercent };
      publish(
        await addWatermark(file, { content, position, opacity: opacity / 100, diagonal }),
        `${baseName(file)}_watermarked.pdf`
      );
    } catch (error) {
      showError(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ToolCard title="Add Watermark" description="Stamp text or an image across every page of a PDF.">
      {result ? (
        <ResultPanel
          result={result}
          resetLabel="Watermark Another PDF"
          onReset={() => {
            clear();
            setFile(null);
          }}
        />
      ) : !file ? (
        <FileDropzone accept="pdf" multiple={false} onFiles={([selected]) => setFile(selected)} />
      ) : (
        <>
          <p className="text-sm text-center font-medium">{file.name}</p>

          <RadioGroup value={kind} onValueChange={(value) => setKind(value as 'text' | 'image')} className="flex gap-6">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="text" id="kind-text" />
              <Label htmlFor="kind-text">Text</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="image" id="kind-image" />
              <Label htmlFor="kind-image">Image</Label>
            </div>
          </RadioGroup>

          {kind === 'text' ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-3">
                <Label htmlFor="watermark-text">Watermark text</Label>
                <Input id="watermark-text" value={text} onChange={(event) => setText(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="watermark-size">Text size (6 to 200)</Label>
                <Input id="watermark-size" type="number" min={6} max={200} value={fontSize} onChange={(event) => setFontSize(event.target.valueAsNumber)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="watermark-color">Color</Label>
                <Input id="watermark-color" type="color" value={color} onChange={(event) => setColor(event.target.value)} />
              </div>
            </div>
          ) : image ? (
            <div className="space-y-3">
              <p className="text-sm">
                Image: <span className="font-medium">{image.name}</span>{' '}
                <Button variant="link" className="h-auto p-0" onClick={() => setImage(null)}>Change</Button>
              </p>
              <Label id="image-width-label">Width: {widthPercent}% of the page</Label>
              <Slider aria-labelledby="image-width-label" min={5} max={100} step={5} value={[widthPercent]} onValueChange={([value]) => setWidthPercent(value)} />
            </div>
          ) : (
            <FileDropzone accept="png,jpg,jpeg" multiple={false} onFiles={([selected]) => setImage(selected)} />
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="watermark-position">Position</Label>
              <select id="watermark-position" className={selectClass} value={position} onChange={(event) => setPosition(event.target.value as StampPosition)}>
                <option value="center">Center</option>
                {STAMP_POSITIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              <Label id="opacity-label">Opacity: {opacity}%</Label>
              <Slider aria-labelledby="opacity-label" min={5} max={100} step={5} value={[opacity]} onValueChange={([value]) => setOpacity(value)} />
            </div>
          </div>

          {position === 'center' && (
            <div className="flex items-center gap-2">
              <Switch id="watermark-diagonal" checked={diagonal} onCheckedChange={setDiagonal} />
              <Label htmlFor="watermark-diagonal">Tilt across the page</Label>
            </div>
          )}

          <Button onClick={handleSave} disabled={!isValid || isSaving} className={primaryButtonClass}>
            <Stamp className="mr-2 h-5 w-5" />
            {isSaving ? 'Adding...' : 'Add Watermark'}
          </Button>
        </>
      )}
    </ToolCard>
  );
}
