'use client';

import { useEffect, useState } from 'react';
import { Download, FileImage, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileDropzone } from '@/components/file-dropzone';
import { FileOrderList } from '@/components/file-order-list';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { selectClass } from '@/components/tool-shell';
import { defaultImageOptions, imagesToPdf, type ImagesToPdfOptions } from '@/lib/conversions/images-to-pdf';

export function ImagesToPdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [options, setOptions] = useState<ImagesToPdfOptions>(defaultImageOptions);
  const { toast } = useToast();

  const setOption = (name: keyof ImagesToPdfOptions, value: string) =>
    setOptions((current) => ({ ...current, [name]: value }));

  useEffect(() => {
    if (!resultUrl) return;
    return () => URL.revokeObjectURL(resultUrl);
  }, [resultUrl]);

  const handleConvert = async () => {
    setIsConverting(true);
    try {
      setResultUrl(URL.createObjectURL(await imagesToPdf(files, options)));
    } catch (error) {
      console.error('Images to PDF failed:', error);
      toast({
        title: 'Conversion Failed',
        description: error instanceof Error ? error.message : 'The images could not be converted.',
        variant: 'destructive',
      });
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl py-8 md:py-12">
      <Card className="shadow-soft">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold sm:text-3xl">Images to PDF</CardTitle>
          <CardDescription>Combine JPG, PNG and WebP images into one PDF, with one image on each page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {resultUrl ? (
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold font-headline">Your PDF Is Ready!</h3>
              <Button asChild size="lg" className="w-full">
                <a href={resultUrl} download="images.pdf">
                  <Download className="mr-2 h-5 w-5" />
                  Download images.pdf
                </a>
              </Button>
              <Button
                onClick={() => {
                  setFiles([]);
                  setResultUrl(null);
                }}
                variant="outline"
                className="w-full"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Convert More Images
              </Button>
            </div>
          ) : (
            <>
              <FileDropzone accept="jpg,jpeg,png,webp" onFiles={(added) => setFiles((current) => [...current, ...added])} />
              {files.length > 0 && <FileOrderList title="Page order:" files={files} onChange={setFiles} />}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="page-size">Page size</Label>
                  <select id="page-size" className={selectClass} value={options.pageSize} onChange={(event) => setOption('pageSize', event.target.value)}>
                    <option value="fit">Same as image</option>
                    <option value="a4">A4</option>
                    <option value="letter">US Letter</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="page-orientation">Orientation</Label>
                  <select
                    id="page-orientation"
                    className={selectClass}
                    value={options.orientation}
                    disabled={options.pageSize === 'fit'}
                    onChange={(event) => setOption('orientation', event.target.value)}
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="page-margin">Margin</Label>
                  <select id="page-margin" className={selectClass} value={options.margin} onChange={(event) => setOption('margin', event.target.value)}>
                    <option value="none">None</option>
                    <option value="small">Small</option>
                    <option value="big">Big</option>
                  </select>
                </div>
              </div>
              <Button
                onClick={handleConvert}
                disabled={files.length === 0 || isConverting}
                className="w-full h-12 text-lg font-bold text-primary-foreground bg-gradient-to-r from-primary to-tertiary hover:saturate-150 transition-all duration-300"
              >
                <FileImage className="mr-2 h-5 w-5" />
                {isConverting ? 'Creating PDF...' : 'Create PDF'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
