'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { renderPages } from '@/lib/conversions/pdf-render';

const THUMBNAIL_WIDTH = 220;

/**
 * Loads thumbnails for a PDF one page at a time, showing placeholders as they arrive.
 * Each object URL is released when the file changes or the page closes.
 */
export function usePdfThumbnails(file: File | null, onError: (error: unknown) => void) {
  const [state, setState] = useState<{ file: File | null; pageCount: number; thumbnails: Record<number, string> }>({
    file: null,
    pageCount: 0,
    thumbnails: {},
  });
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onErrorRef.current = onError;
  });

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    const urls: string[] = [];

    renderPages(file, { width: THUMBNAIL_WIDTH, quality: 0.7 }, ({ index, pageCount, blob }) => {
      if (cancelled) return false;
      const url = URL.createObjectURL(blob);
      urls.push(url);
      setState((current) => ({
        file,
        pageCount,
        thumbnails: { ...(current.file === file ? current.thumbnails : {}), [index]: url },
      }));
    }).catch((error) => {
      if (!cancelled) onErrorRef.current(error);
    });

    return () => {
      cancelled = true;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [file]);

  const isCurrent = state.file === file;
  return { pageCount: isCurrent ? state.pageCount : 0, thumbnails: isCurrent ? state.thumbnails : {} };
}

export function PageCard({
  label,
  thumbnail,
  rotation = 0,
  children,
  ...props
}: {
  label: string;
  thumbnail?: string;
  rotation?: number;
  children?: ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} data-testid="page-card" className="rounded-lg border bg-muted/50 p-2 flex flex-col gap-2">
      <div className="aspect-[3/4] flex items-center justify-center overflow-hidden rounded bg-background">
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element -- A local preview, not a site image.
          <img
            src={thumbnail}
            alt={label}
            draggable={false}
            className="max-h-full max-w-full object-contain transition-transform"
            // The box is 3:4, so shrinking to 75% keeps any sideways page inside it.
            style={{ transform: `rotate(${rotation}deg) scale(${rotation % 180 === 0 ? 1 : 0.75})` }}
          />
        ) : (
          <span className="text-xs text-muted-foreground">Loading...</span>
        )}
      </div>
      <p className="text-center text-xs text-muted-foreground truncate">{label}</p>
      {children && <div className="flex justify-center gap-1">{children}</div>}
    </div>
  );
}

export const pageGridClass = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3';
