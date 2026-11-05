'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, FileCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileDropzone } from '@/components/file-dropzone';
import { PageCard, pageGridClass, usePdfThumbnails } from '@/components/page-grid';
import { ResultPanel, ToolCard, baseName, primaryButtonClass, useResultFile, useToolError } from '@/components/tool-shell';
import { organizePdf } from '@/lib/conversions/pdf-edit';

interface PageItem {
  id: string;
  fileIndex: number;
  pageIndex: number;
}

/** Reports one file's page count and thumbnails to the page list. */
function FileLoader({
  file,
  onLoad,
  onError,
}: {
  file: File;
  onLoad: (pageCount: number, thumbnails: Record<number, string>) => void;
  onError: (error: unknown) => void;
}) {
  const { pageCount, thumbnails } = usePdfThumbnails(file, onError);
  useEffect(() => {
    if (pageCount > 0) onLoad(pageCount, thumbnails);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onLoad changes on every render.
  }, [pageCount, thumbnails]);
  return null;
}

export function OrganizePdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [loaded, setLoaded] = useState<Record<number, { pageCount: number; thumbnails: Record<number, string> }>>({});
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [order, setOrder] = useState<string[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { result, publish, clear } = useResultFile();
  const showError = useToolError('Could Not Organize PDF');

  // New pages join the end of the list as each file finishes loading.
  const pages = useMemo<PageItem[]>(() => {
    const all: PageItem[] = Object.entries(loaded).flatMap(([fileIndex, { pageCount }]) =>
      Array.from({ length: pageCount }, (_, pageIndex) => ({
        id: `${fileIndex}-${pageIndex}`,
        fileIndex: Number(fileIndex),
        pageIndex,
      }))
    );
    const rank = new Map(order.map((id, index) => [id, index]));
    return all
      .filter((page) => !removed.has(page.id))
      .sort((a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity));
  }, [loaded, order, removed]);

  const moveTo = (id: string, target: number) => {
    const ids = pages.map((page) => page.id).filter((pageId) => pageId !== id);
    ids.splice(target, 0, id);
    setOrder(ids);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const name = `${baseName(files[0])}_organized.pdf`;
      publish(await organizePdf(files, pages), name);
    } catch (error) {
      showError(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    clear();
    setFiles([]);
    setLoaded({});
    setRemoved(new Set());
    setOrder([]);
  };

  return (
    <ToolCard
      wide
      title="Organize PDF"
      description="Reorder, remove or add pages. Drag pages into place, or use the arrows."
    >
      {files.map((file, index) => (
        <FileLoader
          key={`${file.name}-${index}`}
          file={file}
          onError={showError}
          onLoad={(pageCount, thumbnails) =>
            setLoaded((current) => ({ ...current, [index]: { pageCount, thumbnails } }))
          }
        />
      ))}

      {result ? (
        <ResultPanel result={result} resetLabel="Organize Another PDF" onReset={handleReset} />
      ) : (
        <>
          <FileDropzone accept="pdf" onFiles={(added) => setFiles((current) => [...current, ...added])} />

          {pages.length > 0 && (
            <>
              <p className="text-sm text-center text-muted-foreground">{pages.length} page(s) in the new PDF</p>
              <div className={pageGridClass}>
                {pages.map((page, index) => {
                  const label = `${files[page.fileIndex].name}, page ${page.pageIndex + 1}`;
                  return (
                    <PageCard
                      key={page.id}
                      label={label}
                      thumbnail={loaded[page.fileIndex]?.thumbnails[page.pageIndex]}
                      draggable
                      onDragStart={() => setDragging(page.id)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        if (dragging) moveTo(dragging, index);
                        setDragging(null);
                      }}
                    >
                      <Button variant="ghost" size="icon" aria-label={`Move ${label} earlier`} disabled={index === 0} onClick={() => moveTo(page.id, index - 1)}>
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label={`Move ${label} later`} disabled={index === pages.length - 1} onClick={() => moveTo(page.id, index + 1)}>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label={`Remove ${label}`} onClick={() => setRemoved((current) => new Set(current).add(page.id))}>
                        <X className="h-4 w-4" />
                      </Button>
                    </PageCard>
                  );
                })}
              </div>
            </>
          )}

          <Button onClick={handleSave} disabled={pages.length === 0 || isSaving} className={primaryButtonClass}>
            <FileCheck className="mr-2 h-5 w-5" />
            {isSaving ? 'Saving...' : 'Save New PDF'}
          </Button>
        </>
      )}
    </ToolCard>
  );
}
