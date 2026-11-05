'use client';

import { useState } from 'react';
import { Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileDropzone } from '@/components/file-dropzone';
import { ResultPanel, ToolCard, baseName, primaryButtonClass, selectClass, useResultFile, useToolError } from '@/components/tool-shell';
import { addPageNumbers, type PageNumberOptions } from '@/lib/conversions/pdf-edit';
import type { StampPosition } from '@/lib/conversions/pdf-geometry';

export const STAMP_POSITIONS: { value: StampPosition; label: string }[] = [
  { value: 'top-left', label: 'Top left' },
  { value: 'top-center', label: 'Top center' },
  { value: 'top-right', label: 'Top right' },
  { value: 'bottom-left', label: 'Bottom left' },
  { value: 'bottom-center', label: 'Bottom center' },
  { value: 'bottom-right', label: 'Bottom right' },
];

export function PdfPageNumbers() {
  const [file, setFile] = useState<File | null>(null);
  const [position, setPosition] = useState<StampPosition>('bottom-center');
  const [format, setFormat] = useState<PageNumberOptions['format']>('number');
  const [start, setStart] = useState(1);
  const [fontSize, setFontSize] = useState(12);
  const [isSaving, setIsSaving] = useState(false);
  const { result, publish, clear } = useResultFile();
  const showError = useToolError('Could Not Add Page Numbers');

  const isValid = Number.isInteger(start) && start >= 0 && fontSize >= 6 && fontSize <= 72;

  const handleSave = async () => {
    if (!file) return;
    setIsSaving(true);
    try {
      publish(await addPageNumbers(file, { position, format, start, fontSize }), `${baseName(file)}_numbered.pdf`);
    } catch (error) {
      showError(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ToolCard title="Add Page Numbers" description="Number every page of a PDF, with the position and style you choose.">
      {result ? (
        <ResultPanel
          result={result}
          resetLabel="Number Another PDF"
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="number-position">Position</Label>
              <select id="number-position" className={selectClass} value={position} onChange={(event) => setPosition(event.target.value as StampPosition)}>
                {STAMP_POSITIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="number-format">Format</Label>
              <select id="number-format" className={selectClass} value={format} onChange={(event) => setFormat(event.target.value as PageNumberOptions['format'])}>
                <option value="number">1, 2, 3</option>
                <option value="page-of">Page 1 of 3</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="number-start">Start at</Label>
              <Input id="number-start" type="number" min={0} value={start} onChange={(event) => setStart(event.target.valueAsNumber)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="number-size">Text size (6 to 72)</Label>
              <Input id="number-size" type="number" min={6} max={72} value={fontSize} onChange={(event) => setFontSize(event.target.valueAsNumber)} />
            </div>
          </div>
          <Button onClick={handleSave} disabled={!isValid || isSaving} className={primaryButtonClass}>
            <Hash className="mr-2 h-5 w-5" />
            {isSaving ? 'Adding...' : 'Add Page Numbers'}
          </Button>
        </>
      )}
    </ToolCard>
  );
}
