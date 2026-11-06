'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Download, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export const primaryButtonClass =
  'w-full h-12 text-base font-semibold shadow-md hover:shadow-lg bg-brand-gradient hover:saturate-150';

export const selectClass =
  'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function ToolCard({
  title,
  description,
  wide,
  children,
}: {
  title: string;
  description: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={cn('container mx-auto py-8 md:py-12', wide ? 'max-w-5xl' : 'max-w-3xl')}>
      <Card className="shadow-soft">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold sm:text-3xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">{children}</CardContent>
      </Card>
    </div>
  );
}

export interface ResultFile {
  url: string;
  name: string;
}

/** Holds a finished file, releasing its memory when it's replaced or the page closes. */
export function useResultFile() {
  const [result, setResult] = useState<ResultFile | null>(null);

  useEffect(() => {
    if (!result) return;
    return () => URL.revokeObjectURL(result.url);
  }, [result]);

  const publish = useCallback((blob: Blob, name: string) => {
    setResult({ url: URL.createObjectURL(blob), name });
  }, []);
  const clear = useCallback(() => setResult(null), []);

  return { result, publish, clear };
}

export function useToolError(title: string) {
  const { toast } = useToast();
  return useCallback(
    (error: unknown) => {
      console.error(`${title}:`, error);
      toast({
        title,
        description: error instanceof Error ? error.message : 'Something went wrong with this file.',
        variant: 'destructive',
      });
    },
    [title, toast]
  );
}

export function ResultPanel({
  result,
  heading = 'Your File Is Ready!',
  resetLabel,
  onReset,
}: {
  result: ResultFile;
  heading?: string;
  resetLabel: string;
  onReset: () => void;
}) {
  return (
    <div className="text-center space-y-4">
      <h3 className="text-2xl font-bold font-headline">{heading}</h3>
      <Button asChild size="lg" className="w-full">
        <a href={result.url} download={result.name}>
          <Download className="mr-2 h-5 w-5" />
          Download {result.name}
        </a>
      </Button>
      <Button onClick={onReset} variant="outline" className="w-full">
        <RotateCcw className="mr-2 h-4 w-4" />
        {resetLabel}
      </Button>
    </div>
  );
}

export const baseName = (file: File) => file.name.replace(/\.[^.]+$/, '');
