'use client';

import { useEffect, useState } from 'react';
import { Download, RotateCcw, Shrink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FileDropzone } from '@/components/file-dropzone';
import { useToast } from '@/hooks/use-toast';
import { compressPdf, type CompressionMode } from '@/lib/conversions/pdf-compress';

const formatMb = (bytes: number) =>
  bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

interface CompressionResult {
  url: string | null;
  size: number;
}

export function PdfCompress() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<CompressionMode>('smallest');
  const [progress, setProgress] = useState<number | null>(null);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const url = result?.url;
    if (!url) return;
    return () => URL.revokeObjectURL(url);
  }, [result]);

  const handleCompress = async () => {
    if (!file) return;
    setProgress(0);
    try {
      const blob = await compressPdf(file, mode, (fraction) => setProgress(Math.round(fraction * 100)));
      // Only offer the new file when it actually helps.
      setResult({ size: blob.size, url: blob.size < file.size ? URL.createObjectURL(blob) : null });
    } catch (error) {
      console.error('PDF compression failed:', error);
      toast({
        title: 'Compression Failed',
        description: error instanceof Error ? error.message : 'This PDF could not be compressed.',
        variant: 'destructive',
      });
    } finally {
      setProgress(null);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
  };

  const isWorking = progress !== null;
  const baseName = file?.name.replace(/\.pdf$/i, '');

  return (
    <div className="container mx-auto max-w-3xl py-8 md:py-12">
      <Card className="shadow-soft">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold sm:text-3xl">PDF Compress</CardTitle>
          <CardDescription>Reduce the file size of a PDF, right in your browser.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!file ? (
            <FileDropzone accept="pdf" multiple={false} onFiles={([selected]) => setFile(selected)} />
          ) : result ? (
            <div className="text-center space-y-4">
              {result.url ? (
                <>
                  <h3 className="text-2xl font-bold font-headline">
                    {Math.round((1 - result.size / file.size) * 100)}% Smaller!
                  </h3>
                  <p className="text-muted-foreground">
                    {formatMb(file.size)} is now {formatMb(result.size)}.
                  </p>
                  <Button asChild size="lg" className="w-full">
                    <a href={result.url} download={`${baseName}_compressed.pdf`}>
                      <Download className="mr-2 h-5 w-5" />
                      Download Compressed PDF
                    </a>
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-bold font-headline">Already Well Compressed</h3>
                  <p className="text-muted-foreground">
                    This setting couldn&apos;t make {file.name} smaller, so your original is still the best version.
                  </p>
                  <Button onClick={() => setResult(null)} className="w-full">
                    Try a Different Setting
                  </Button>
                </>
              )}
              <Button onClick={handleReset} variant="outline" className="w-full">
                <RotateCcw className="mr-2 h-4 w-4" />
                Compress Another PDF
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-center text-muted-foreground">
                <span className="font-medium text-foreground">{file.name}</span> ({formatMb(file.size)})
              </p>
              <RadioGroup value={mode} onValueChange={(value) => setMode(value as CompressionMode)} className="space-y-3">
                <div className="flex items-start gap-2">
                  <RadioGroupItem value="smallest" id="mode-smallest" className="mt-0.5" />
                  <Label htmlFor="mode-smallest" className="leading-snug">
                    Smallest file
                    <span className="block font-normal text-muted-foreground">
                      Best for scans and photos. Pages become images, so text can no longer be selected or searched.
                    </span>
                  </Label>
                </div>
                <div className="flex items-start gap-2">
                  <RadioGroupItem value="keep-text" id="mode-keep-text" className="mt-0.5" />
                  <Label htmlFor="mode-keep-text" className="leading-snug">
                    Keep text and quality
                    <span className="block font-normal text-muted-foreground">
                      Only tidies the file&apos;s structure, so savings are usually small.
                    </span>
                  </Label>
                </div>
              </RadioGroup>
              {isWorking && <Progress value={progress} className="w-full" />}
              <Button
                onClick={handleCompress}
                disabled={isWorking}
                className="w-full h-12 text-lg font-bold text-primary-foreground bg-gradient-to-r from-primary to-tertiary hover:saturate-150 transition-all duration-300"
              >
                <Shrink className="mr-2 h-5 w-5" />
                {isWorking ? 'Compressing...' : 'Compress PDF'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
