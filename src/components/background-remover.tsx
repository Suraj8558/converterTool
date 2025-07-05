'use client';

import { useState } from 'react';
import { UploadCloud, Download, RotateCcw, ImageIcon, Wand2, Loader2 } from 'lucide-react';
import NextImage from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { removeBackground } from '@/ai/flows/background-remover-flow';

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export function BackgroundRemover() {
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
        } else if (file) {
            toast({
                title: 'Invalid File Type',
                description: 'Please select a valid image file (e.g., JPG, PNG).',
                variant: 'destructive',
            });
        }
    };

    const handleProcess = async () => {
        if (!originalFile) return;

        setIsProcessing(true);
        setProcessedImageUrl(null);

        try {
            const photoDataUri = await fileToDataUri(originalFile);
            const result = await removeBackground({ photoDataUri });
            
            if (result && result.processedPhotoDataUri) {
                setProcessedImageUrl(result.processedPhotoDataUri);
            } else {
                throw new Error("The AI failed to return an image.");
            }

        } catch (error) {
            console.error("Background removal failed:", error);
            toast({
                title: 'Processing Failed',
                description: 'An error occurred while removing the background. The AI may not be able to process this image. Please try another.',
                variant: 'destructive',
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const resetState = () => {
        if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
        setOriginalFile(null);
        setOriginalImageUrl(null);
        setProcessedImageUrl(null);
        setIsProcessing(false);
    };

    const getFileName = () => {
        if (!originalFile) return 'image_no_bg.png';
        const nameParts = originalFile.name.split('.');
        nameParts.pop();
        return `${nameParts.join('_')}_no_bg.png`;
    };

    return (
        <Card className="rounded-xl shadow-lg w-full">
            <CardHeader>
                <CardTitle className="text-3xl font-bold font-headline">AI Background Remover</CardTitle>
                <CardDescription>Automatically remove the background from any image with a single click.</CardDescription>
            </CardHeader>
            <CardContent>
                {!originalFile ? (
                    <div 
                        className="border border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted transition-colors bg-muted/50"
                        onClick={() => document.getElementById('background-remover-upload')?.click()}
                    >
                        <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-4 text-muted-foreground">Drag & drop your image here, or click to browse</p>
                        <input id="background-remover-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/jpeg,image/png,image/webp" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg">Original</h3>
                                {originalImageUrl && <NextImage src={originalImageUrl} alt="Original" width={500} height={500} className="rounded-md border object-contain aspect-square" />}
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg">Background Removed</h3>
                                {isProcessing ? (
                                    <div className="aspect-square w-full rounded-md border bg-muted flex flex-col items-center justify-center">
                                        <Loader2 className="h-12 w-12 text-primary animate-spin" />
                                        <p className="mt-4 text-muted-foreground">AI is working its magic...</p>
                                    </div>
                                ) : processedImageUrl ? (
                                    <NextImage src={processedImageUrl} alt="Background removed" width={500} height={500} className="rounded-md border object-contain aspect-square bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M0%200h10v10H0zM10%2010h10v10H10z%22%20fill%3D%22%23eee%22%20fill-opacity%3D%221%22%2F%3E%3C%2Fsvg%3E')] bg-center" />
                                ) : (
                                    <div className="aspect-square w-full rounded-md border bg-muted flex items-center justify-center">
                                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                                        <p className="sr-only">Preview area for the processed image</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                           {!processedImageUrl ? (
                                <Button onClick={handleProcess} disabled={isProcessing} className="w-full sm:w-auto flex-1 bg-gradient-to-r from-primary to-tertiary text-primary-foreground hover:saturate-150 transition-all duration-300">
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 className="mr-2 h-4 w-4" />
                                            Remove Background
                                        </>
                                    )}
                                </Button>
                            ) : (
                                <Button asChild className="w-full sm:w-auto flex-1">
                                    <a href={processedImageUrl} download={getFileName()}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Download Image
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
