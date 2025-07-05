
'use client';

import { useState, useEffect, useCallback } from 'react';
import { UploadCloud, Download, RotateCcw, Shrink } from 'lucide-react';
import NextImage from 'next/image';
import { Button } from '@/components/ui/button';
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

export function ImageCompressor() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [originalFileSize, setOriginalFileSize] = useState<number | null>(null);

  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressedImageUrl, setCompressedImageUrl] = useState<string | null>(null);
  const [compressedFileSize, setCompressedFileSize] = useState<number | null>(null);

  const [quality, setQuality] = useState(0.8);
  const [isCompressing, setIsCompressing] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      resetState(false); // Soft reset
      setOriginalFile(file);
      setOriginalFileSize(file.size);
      const url = URL.createObjectURL(file);
      setOriginalImageUrl(url);
    } else if (file) {
      toast({
        title: 'Invalid File Type',
        description: 'Please select a valid image file (JPG, PNG, WebP).',
        variant: 'destructive',
      });
    }
  };

  const compressImage = useCallback(async () => {
    if (!originalFile) return;

    setIsCompressing(true);

    const img = new window.Image();
    img.src = URL.createObjectURL(originalFile);
    await new Promise((resolve) => { img.onload = resolve; });

    try {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      
      // Add a white background for images with transparency (like PNGs)
      // as JPG does not support transparency.
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            if (compressedImageUrl) URL.revokeObjectURL(compressedImageUrl);
            setCompressedBlob(blob);
            setCompressedImageUrl(URL.createObjectURL(blob));
            setCompressedFileSize(blob.size);
          } else {
            throw new Error('Canvas to Blob conversion failed');
          }
          setIsCompressing(false);
        },
        'image/jpeg', // Always compress to JPG for effective size reduction
        quality
      );
    } catch (error) {
      console.error("Image compression failed:", error);
      toast({
        title: 'Compression Failed',
        description: 'An error occurred while compressing the image.',
        variant: 'destructive',
      });
      setIsCompressing(false);
    }
  }, [originalFile, quality, toast, compressedImageUrl]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (originalFile) {
        compressImage();
      }
    }, 500); // Debounce compression
    return () => clearTimeout(handler);
  }, [quality, originalFile, compressImage]);

  const resetState = (fullReset = true) => {
    if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
    if (compressedImageUrl) URL.revokeObjectURL(compressedImageUrl);
    
    if (fullReset) {
      setOriginalFile(null);
      setOriginalImageUrl(null);
      setOriginalFileSize(null);
    }
    
    setCompressedBlob(null);
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
          <div 
            className="border border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted transition-colors bg-muted/50"
            onClick={() => document.getElementById('image-compressor-upload')?.click()}
          >
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Drag & drop your image here, or click to browse</p>
            <input id="image-compressor-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/jpeg,image/png,image/webp" />
          </div>
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
              <Button asChild className="w-full sm:w-auto flex-1">
                  <a href={compressedImageUrl ?? ''} download={getFileName()}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Compressed Image
                  </a>
              </Button>
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
