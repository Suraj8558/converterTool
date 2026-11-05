
'use client';

import { useState, useEffect } from 'react';
import { Download, RotateCcw, Shrink } from 'lucide-react';
import NextImage from 'next/image';
import { Button } from '@/components/ui/button';
import { FileDropzone } from '@/components/file-dropzone';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const compressToJpeg = (file: File, quality: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const sourceUrl = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(sourceUrl);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Add a white background for images with transparency (like PNGs)
      // as JPG does not support transparency.
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas to Blob conversion failed'));
          }
        },
        'image/jpeg', // Always compress to JPG for effective size reduction
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(sourceUrl);
      reject(new Error('Failed to load image'));
    };
    img.src = sourceUrl;
  });
};

export function ImageCompressor() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [originalFileSize, setOriginalFileSize] = useState<number | null>(null);

  const [compressedImageUrl, setCompressedImageUrl] = useState<string | null>(null);
  const [compressedFileSize, setCompressedFileSize] = useState<number | null>(null);

  const [quality, setQuality] = useState(0.8);
  const [isCompressing, setIsCompressing] = useState(false);
  const { toast } = useToast();

  const handleFile = (file: File) => {
    resetState(false); // Soft reset
    setOriginalFile(file);
    setOriginalFileSize(file.size);
    setOriginalImageUrl(URL.createObjectURL(file));
  };

  // Compress only when the file or quality changes. The result must not be a
  // dependency here, or each finished compression would trigger the next one.
  useEffect(() => {
    if (!originalFile) return;

    let cancelled = false;
    const handler = setTimeout(async () => {
      setIsCompressing(true);
      try {
        const blob = await compressToJpeg(originalFile, quality);
        if (cancelled) return;
        setCompressedImageUrl(URL.createObjectURL(blob));
        setCompressedFileSize(blob.size);
      } catch (error) {
        if (cancelled) return;
        console.error("Image compression failed:", error);
        toast({
          title: 'Compression Failed',
          description: 'An error occurred while compressing the image.',
          variant: 'destructive',
        });
      }
      setIsCompressing(false);
    }, 500); // Debounce compression

    return () => {
      cancelled = true;
      clearTimeout(handler);
    };
  }, [quality, originalFile, toast]);

  // Release each compressed image once it is replaced, or on unmount.
  useEffect(() => {
    if (!compressedImageUrl) return;
    return () => URL.revokeObjectURL(compressedImageUrl);
  }, [compressedImageUrl]);

  const resetState = (fullReset = true) => {
    if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);


    if (fullReset) {
      setOriginalFile(null);
      setOriginalImageUrl(null);
      setOriginalFileSize(null);
    }
    
    setCompressedImageUrl(null);
    setCompressedFileSize(null);
    setIsCompressing(false);
  };
  
  const getFileName = () => {
    if(!originalFile) return 'compressed_image.jpg';
    const nameParts = originalFile.name.split('.');
    nameParts.pop();
    return `${nameParts.join('.')}_compressed.jpg`;
  }
  
  const sizeReduction = originalFileSize && compressedFileSize 
    ? Math.round(((originalFileSize - compressedFileSize) / originalFileSize) * 100)
    : 0;

  return (
    <Card className="rounded-xl shadow-lg w-full">
      <CardHeader>
        <CardTitle className="text-3xl font-bold font-headline">Image Compressor</CardTitle>
        <CardDescription>Reduce image file sizes with an adjustable quality setting.</CardDescription>
      </CardHeader>
      <CardContent>
        {!originalFile ? (
          <FileDropzone accept="jpg,jpeg,png,webp" multiple={false} onFiles={([file]) => handleFile(file)} />
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Original</h3>
                {originalImageUrl && <NextImage src={originalImageUrl} alt="Original" width={500} height={300} className="rounded-md border object-contain aspect-video" />}
                <p className="text-sm text-muted-foreground">{originalFileSize ? formatFileSize(originalFileSize) : ''}</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Compressed</h3>
                 {compressedImageUrl ? (
                    <NextImage src={compressedImageUrl} alt="Compressed" width={500} height={300} className="rounded-md border object-contain aspect-video" />
                ) : (
                    <div className="aspect-video w-full rounded-md border bg-muted flex items-center justify-center">
                        <Shrink className="h-12 w-12 text-muted-foreground" />
                    </div>
                )}
                <p className="text-sm text-muted-foreground">
                  {compressedFileSize ? `${formatFileSize(compressedFileSize)} ` : ''}
                  {sizeReduction > 0 && <span className="text-green-500">({sizeReduction}% smaller)</span>}
                </p>
              </div>
            </div>
            
            <Card className="p-6 bg-muted/50">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label htmlFor="quality">Quality</Label>
                  <span className="text-sm font-medium text-primary">{Math.round(quality * 100)}%</span>
                </div>
                <Slider
                  id="quality"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={[quality]}
                  onValueChange={(value) => setQuality(value[0])}
                  disabled={isCompressing}
                />
              </div>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4">
              {compressedImageUrl && (
                <Button asChild className="w-full sm:w-auto flex-1">
                  <a href={compressedImageUrl} download={getFileName()}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Compressed Image
                  </a>
                </Button>
              )}
              <Button onClick={() => resetState(true)} variant="outline" className="w-full sm:w-auto flex-1">
                <RotateCcw className="mr-2 h-4 w-4" />
                Compress Another
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
