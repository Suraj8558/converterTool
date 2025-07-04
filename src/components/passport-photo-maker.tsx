'use client';

import { useState } from 'react';
import { UploadCloud, Download, RotateCcw, UserSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import NextImage from 'next/image';

const PASSPORT_WIDTH = 413; // pixels for 3.5cm at 300 DPI
const PASSPORT_HEIGHT = 531; // pixels for 4.5cm at 300 DPI

export function PassportPhotoMaker() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      resetState();
      setOriginalFile(file);
      const url = URL.createObjectURL(file);
      setOriginalImageUrl(url);
    } else {
      toast({
        title: 'Invalid File Type',
        description: 'Please select an image file.',
        variant: 'destructive',
      });
    }
  };

  const handleProcessImage = () => {
    if (!originalFile || !originalImageUrl) return;

    setIsProcessing(true);
    setProcessedImageUrl(null);

    const img = new window.Image();
    img.crossOrigin = "Anonymous";
    img.src = originalImageUrl;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = PASSPORT_WIDTH;
        canvas.height = PASSPORT_HEIGHT;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');
        
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, PASSPORT_WIDTH, PASSPORT_HEIGHT);

        const imgAspectRatio = img.width / img.height;
        const canvasAspectRatio = PASSPORT_WIDTH / PASSPORT_HEIGHT;

        let drawWidth, drawHeight, x, y;

        if (imgAspectRatio > canvasAspectRatio) {
            // Image is wider than canvas, fit to height
            drawHeight = PASSPORT_HEIGHT;
            drawWidth = drawHeight * imgAspectRatio;
            x = (PASSPORT_WIDTH - drawWidth) / 2;
            y = 0;
        } else {
            // Image is taller than or same aspect as canvas, fit to width
            drawWidth = PASSPORT_WIDTH;
            drawHeight = drawWidth / imgAspectRatio;
            x = 0;
            y = (PASSPORT_HEIGHT - drawHeight) / 2;
        }
        
        ctx.drawImage(img, x, y, drawWidth, drawHeight);
        
        canvas.toBlob((blob) => {
          if (blob) {
            if(processedImageUrl) URL.revokeObjectURL(processedImageUrl);
            setProcessedImageUrl(URL.createObjectURL(blob));
          } else {
            throw new Error('Canvas to Blob conversion failed');
          }
          setIsProcessing(false);
        }, 'image/jpeg', 0.95);
      } catch (error) {
        console.error("Image processing failed:", error);
        toast({
          title: 'Processing Failed',
          description: 'An error occurred while processing the image.',
          variant: 'destructive',
        });
        setIsProcessing(false);
      }
    };
  };

  const resetState = () => {
    if(originalImageUrl) URL.revokeObjectURL(originalImageUrl);
    if(processedImageUrl) URL.revokeObjectURL(processedImageUrl);

    setOriginalFile(null);
    setOriginalImageUrl(null);
    setProcessedImageUrl(null);
    setIsProcessing(false);
  };
  
  const getFileName = () => {
    if(!originalFile) return 'passport_photo.jpg';
    const nameParts = originalFile.name.split('.');
    nameParts.pop();
    return `${nameParts.join('_')}_passport.jpg`;
  }

  return (
    <Card className="rounded-xl shadow-lg w-full">
      <CardHeader>
        <CardTitle className="text-3xl font-bold font-headline">Passport Size Photo Maker</CardTitle>
        <CardDescription>Create a passport-ready photo from your image.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!originalFile ? (
          <div 
            className="border border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted transition-colors bg-muted/50"
            onClick={() => document.getElementById('file-upload-passport')?.click()}
          >
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Upload your photo to get started</p>
            <p className="text-xs text-muted-foreground mt-1">For best results, use a high-quality portrait photo.</p>
            <input id="file-upload-passport" type="file" className="hidden" onChange={handleFileChange} accept="image/jpeg,image/png" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Your Photo</h3>
                {originalImageUrl && (
                  <div className="relative aspect-[7/9] w-full rounded-md overflow-hidden border">
                    <NextImage src={originalImageUrl} alt="Original" fill style={{ objectFit: 'contain' }} />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Passport Photo Preview</h3>
                {processedImageUrl ? (
                  <div className="relative aspect-[7/9] w-full rounded-md overflow-hidden border">
                    <NextImage src={processedImageUrl} alt="Passport Photo" fill style={{ objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div className="aspect-[7/9] w-full rounded-md border bg-muted flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                        <UserSquare className="mx-auto h-12 w-12" />
                        <p>Click "Create Photo"</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                {!processedImageUrl ? (
                    <Button onClick={handleProcessImage} disabled={isProcessing} className="w-full">
                        {isProcessing ? 'Processing...' : 'Create Passport Photo'}
                    </Button>
                ) : (
                    <Button asChild className="w-full">
                        <a href={processedImageUrl} download={getFileName()}>
                            <Download className="mr-2 h-4 w-4" />
                            Download Passport Photo
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
