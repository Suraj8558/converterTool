'use client';

import { useState, useEffect } from 'react';
import { UploadCloud, Download, RotateCcw, Image as ImageIcon, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import NextImage from 'next/image';

export function ImageResizer() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null);
  
  const [width, setWidth] = useState<number | string>('');
  const [height, setHeight] = useState<number | string>('');
  const [keepAspectRatio, setKeepAspectRatio] = useState(true);
  
  const [resizedImageUrl, setResizedImageUrl] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    if (originalFile) {
      const url = URL.createObjectURL(originalFile);
      setOriginalImageUrl(url);
      
      const img = new window.Image();
      img.src = url;
      img.onload = () => {
        setOriginalDimensions({ width: img.width, height: img.height });
        setWidth(img.width);
        setHeight(img.height);
      };
      
      return () => URL.revokeObjectURL(url);
    }
  }, [originalFile]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      resetState();
      setOriginalFile(file);
    } else {
      toast({
        title: 'Invalid File Type',
        description: 'Please select an image file.',
        variant: 'destructive',
      });
    }
  };

  const handleDimensionChange = (e: React.ChangeEvent<HTMLInputElement>, dimension: 'width' | 'height') => {
    const value = e.target.value === '' ? '' : parseInt(e.target.value, 10);
    if (value !== '' && isNaN(value)) return;
    
    if (dimension === 'width') {
      setWidth(value);
      if (keepAspectRatio && originalDimensions && value !== '') {
        const newHeight = Math.round((Number(value) / originalDimensions.width) * originalDimensions.height);
        setHeight(newHeight);
      }
    } else {
      setHeight(value);
      if (keepAspectRatio && originalDimensions && value !== '') {
        const newWidth = Math.round((Number(value) / originalDimensions.height) * originalDimensions.width);
        setWidth(newWidth);
      }
    }
  };

  const handleResize = () => {
    if (!originalFile || !width || !height) return;

    setIsResizing(true);
    setResizedImageUrl(null);

    const img = new window.Image();
    img.src = originalImageUrl!;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Number(width);
        canvas.height = Number(height);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');
        
        ctx.drawImage(img, 0, 0, Number(width), Number(height));
        
        canvas.toBlob((blob) => {
          if (blob) {
            if(resizedImageUrl) URL.revokeObjectURL(resizedImageUrl);
            setResizedImageUrl(URL.createObjectURL(blob));
          } else {
            throw new Error('Canvas to Blob conversion failed');
          }
          setIsResizing(false);
        }, originalFile.type);
      } catch (error) {
        console.error("Image resizing failed:", error);
        toast({
          title: 'Resizing Failed',
          description: 'An error occurred while resizing the image.',
          variant: 'destructive',
        });
        setIsResizing(false);
      }
    };
  };

  const resetState = () => {
    if(originalImageUrl) URL.revokeObjectURL(originalImageUrl);
    if(resizedImageUrl) URL.revokeObjectURL(resizedImageUrl);

    setOriginalFile(null);
    setOriginalImageUrl(null);
    setOriginalDimensions(null);
    setWidth('');
    setHeight('');
    setResizedImageUrl(null);
    setIsResizing(false);
  };
  
  const getFileName = () => {
    if(!originalFile) return '';
    const nameParts = originalFile.name.split('.');
    const ext = nameParts.pop();
    return `${nameParts.join('.')}_${width}x${height}.${ext}`;
  }

  return (
    <Card className="rounded-xl shadow-lg w-full">
      <CardHeader>
        <CardTitle className="text-3xl font-bold font-headline">Image Resizer</CardTitle>
        <CardDescription>Resize your images to the perfect dimensions.</CardDescription>
      </CardHeader>
      <CardContent>
        {!originalFile ? (
          <div 
            className="border border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted transition-colors bg-muted/50"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Drag & drop your image here, or click to browse</p>
            <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Original Image</h3>
                {originalImageUrl && (
                  <div className="relative aspect-video w-full rounded-md overflow-hidden border">
                    <NextImage src={originalImageUrl} alt="Original" fill style={{ objectFit: 'contain' }} />
                  </div>
                )}
                {originalDimensions && (
                    <p className="text-sm text-muted-foreground">Dimensions: {originalDimensions.width} x {originalDimensions.height}px</p>
                )}
              </div>
              <div className="space-y-4">
                 <h3 className="font-semibold text-lg">Resized Image</h3>
                {resizedImageUrl ? (
                    <div className="relative aspect-video w-full rounded-md overflow-hidden border">
                        <NextImage src={resizedImageUrl} alt="Resized" fill style={{ objectFit: 'contain' }} />
                    </div>
                ) : (
                    <div className="aspect-video w-full rounded-md border bg-muted flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                )}
                <p className="text-sm text-muted-foreground">Dimensions: {width} x {height}px</p>
              </div>
            </div>
            
            <Card className="p-4 bg-muted/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="width">Width (px)</Label>
                            <Input id="width" type="number" value={width} onChange={(e) => handleDimensionChange(e, 'width')} placeholder="e.g. 1920" />
                        </div>
                        <div>
                            <Label htmlFor="height">Height (px)</Label>
                            <Input id="height" type="number" value={height} onChange={(e) => handleDimensionChange(e, 'height')} placeholder="e.g. 1080" />
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 justify-self-start pb-2">
                        <Switch id="aspect-ratio" checked={keepAspectRatio} onCheckedChange={setKeepAspectRatio} />
                        <Label htmlFor="aspect-ratio">Keep aspect ratio</Label>
                    </div>
                </div>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={handleResize} disabled={isResizing || !width || !height} className="w-full sm:w-auto flex-1">
                <Ruler className="mr-2 h-4 w-4" />
                {isResizing ? 'Resizing...' : 'Resize Image'}
              </Button>
              {resizedImageUrl && (
                <Button asChild className="w-full sm:w-auto flex-1">
                  <a href={resizedImageUrl} download={getFileName()}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Resized Image
                  </a>
                </Button>
              )}
            </div>
             <Button onClick={resetState} variant="outline" className="w-full">
                <RotateCcw className="mr-2 h-4 w-4" />
                Start Over
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
