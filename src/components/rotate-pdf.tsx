'use client';

import { useState } from 'react';
import { RotateCcw, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileDropzone } from '@/components/file-dropzone';
import { PageCard, pageGridClass, usePdfThumbnails } from '@/components/page-grid';
import { ResultPanel, ToolCard, baseName, primaryButtonClass, useResultFile, useToolError } from '@/components/tool-shell';
import { rotatePdf } from '@/lib/conversions/pdf-edit';

export function RotatePdf() {
  const [file, setFile] = useState<File | null>(null);
  const [turns, setTurns] = useState<Record<number, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const { result, publish, clear } = useResultFile();
  const showError = useToolError('Could Not Rotate PDF');
  const { pageCount, thumbnails } = usePdfThumbnails(file, (error) => {
    showError(error);
    setFile(null);
  });

  const turnAll = (amount: number) =>
    setTurns(Object.fromEntries(Array.from({ length: pageCount }, (_, index) => [index, (turns[index] ?? 0) + amount])));

  const handleSave = async () => {
    if (!file) return;
    setIsSaving(true);
    try {
      const list = Array.from({ length: pageCount }, (_, index) => turns[index] ?? 0);
      publish(await rotatePdf(file, list), `${baseName(file)}_rotated.pdf`);
    } catch (error) {
      showError(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    clear();
    setFile(null);
    setTurns({});
  };

  return (
    <ToolCard wide title="Rotate PDF" description="Turn one page or the whole document.">
      {result ? (
        <ResultPanel result={result} resetLabel="Rotate Another PDF" onReset={handleReset} />
      ) : !file ? (
        <FileDropzone accept="pdf" multiple={false} onFiles={([selected]) => setFile(selected)} />
      ) : (
        <>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={() => turnAll(-90)} disabled={pageCount === 0}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Rotate All Left
            </Button>
            <Button variant="outline" onClick={() => turnAll(90)} disabled={pageCount === 0}>
              <RotateCw className="mr-2 h-4 w-4" />
              Rotate All Right
            </Button>
          </div>

          <div className={pageGridClass}>
            {Array.from({ length: pageCount }, (_, index) => (
              <PageCard key={index} label={`Page ${index + 1}`} thumbnail={thumbnails[index]} rotation={turns[index] ?? 0}>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Rotate page ${index + 1} left`}
                  onClick={() => setTurns({ ...turns, [index]: (turns[index] ?? 0) - 90 })}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Rotate page ${index + 1} right`}
                  onClick={() => setTurns({ ...turns, [index]: (turns[index] ?? 0) + 90 })}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </PageCard>
            ))}
          </div>

          <Button onClick={handleSave} disabled={pageCount === 0 || isSaving} className={primaryButtonClass}>
            {isSaving ? 'Saving...' : 'Save Rotated PDF'}
          </Button>
        </>
      )}
    </ToolCard>
  );
}
