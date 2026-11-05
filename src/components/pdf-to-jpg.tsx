'use client';

import { useState } from 'react';
import { FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FileDropzone } from '@/components/file-dropzone';
import { ResultPanel, ToolCard, primaryButtonClass, useResultFile, useToolError } from '@/components/tool-shell';
import { pdfToJpg } from '@/lib/conversions/pdf-edit';

export function PdfToJpg() {
  const [file, setFile] = useState<File | null>(null);
  const [dpi, setDpi] = useState('150');
  const [progress, setProgress] = useState<number | null>(null);
  const { result, publish, clear } = useResultFile();
  const showError = useToolError('Conversion Failed');

  const handleConvert = async () => {
    if (!file) return;
    setProgress(0);
    try {
      const { blob, name } = await pdfToJpg(file, Number(dpi), (fraction) => setProgress(Math.round(fraction * 100)));
      publish(blob, name);
    } catch (error) {
      showError(error);
    } finally {
      setProgress(null);
    }
  };

  return (
    <ToolCard title="PDF to JPG" description="Save each page of a PDF as a JPG image. Several pages download as a .zip.">
      {result ? (
        <ResultPanel
          result={result}
          resetLabel="Convert Another PDF"
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
          <RadioGroup value={dpi} onValueChange={setDpi} className="space-y-2">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="150" id="dpi-standard" />
              <Label htmlFor="dpi-standard">Standard quality (150 DPI)</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="300" id="dpi-high" />
              <Label htmlFor="dpi-high">High quality (300 DPI, larger files)</Label>
            </div>
          </RadioGroup>
          {progress !== null && <Progress value={progress} className="w-full" />}
          <Button onClick={handleConvert} disabled={progress !== null} className={primaryButtonClass}>
            <FileImage className="mr-2 h-5 w-5" />
            {progress !== null ? 'Converting...' : 'Convert to JPG'}
          </Button>
        </>
      )}
    </ToolCard>
  );
}
