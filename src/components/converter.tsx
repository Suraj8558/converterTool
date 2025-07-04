
'use client';

import { useState } from 'react';
import { UploadCloud, File as FileIcon, X, Download, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

const convertImageOnClient = (file: File, toType: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      if (!event.target?.result) {
        return reject(new Error("Failed to read file"));
      }
      const img = new Image();
      img.src = event.target.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }
        
        const lowerCaseToType = toType.toLowerCase();
        if (lowerCaseToType === 'jpg' || lowerCaseToType === 'jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        ctx.drawImage(img, 0, 0);
        
        const mimeType = `image/${lowerCaseToType === 'jpg' ? 'jpeg' : lowerCaseToType}`;
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas to Blob conversion failed'));
          }
        }, mimeType, 0.9);
      };
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
  });
};

interface ConverterProps {
  title: string;
  description: string;
  fromType: string;
  toType: string;
}

interface ConvertedFile {
    name: string;
    url: string;
}

export function Converter({ title, description, fromType, toType }: ConverterProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [convertedFiles, setConvertedFiles] = useState<ConvertedFile[]>([]);
  const [conversionComplete, setConversionComplete] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(Array.from(event.target.files));
      setConversionComplete(false);
      setConvertedFiles([]);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files) {
      setFiles(Array.from(event.dataTransfer.files));
      setConversionComplete(false);
      setConvertedFiles([]);
    }
  };
  
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };
  
  const handleConvert = async () => {
    if (files.length === 0) return;
    setIsConverting(true);
    setConversionComplete(false);
    setConversionProgress(0);

    const progressInterval = setInterval(() => {
      setConversionProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + 10;
      });
    }, 150);

    const isImageConversion = ['png', 'jpg', 'jpeg', 'webp'].includes(toType.toLowerCase());

    try {
      const conversionPromises = files.map(async (file) => {
        const originalName = file.name.lastIndexOf('.') > -1 
          ? file.name.substring(0, file.name.lastIndexOf('.'))
          : file.name;
        const newName = `${originalName}.${toType}`;
        
        let blob: Blob;
        if (isImageConversion) {
          blob = await convertImageOnClient(file, toType);
        } else {
          // Fallback for non-image types
          const dummyContent = `This is a simulated converted file: ${newName} from ${file.name}`;
          blob = new Blob([dummyContent], { type: 'application/octet-stream' });
        }

        const url = URL.createObjectURL(blob);
        return { name: newName, url };
      });

      const newConvertedFiles = await Promise.all(conversionPromises);
      
      clearInterval(progressInterval);
      setConversionProgress(100);
      setConvertedFiles(newConvertedFiles);
      setConversionComplete(true);
    } catch (error) {
      console.error("File conversion failed:", error);
      clearInterval(progressInterval);
      toast({
        title: 'Conversion Failed',
        description: 'An error occurred during file conversion. Please check the file format and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsConverting(false);
    }
  };


  const handleDownload = (file: ConvertedFile) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleDownloadAll = async () => {
    if (convertedFiles.length < 2) return;

    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    for (const file of convertedFiles) {
        const response = await fetch(file.url);
        const blob = await response.blob();
        zip.file(file.name, blob);
    }

    zip.generateAsync({ type: 'blob' }).then(content => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `ConvertIQ_files.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    });
  };
  
  const handleReset = () => {
      convertedFiles.forEach(file => URL.revokeObjectURL(file.url));
      
      setFiles([]);
      setConvertedFiles([]);
      setConversionComplete(false);
      setIsConverting(false);
      setConversionProgress(0);
  }

  return (
    <div className="container mx-auto max-w-3xl py-12">
      <Card className="rounded-xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold font-headline">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!conversionComplete ? (
            <>
              <div 
                className="border border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted transition-colors bg-muted/50"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">Drag & drop your files here, or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">Supported format(s): .{fromType.replace(/,/g, ', .')}</p>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept={fromType.split(',').map(t => `.${t.trim()}`).join(',')}
                  multiple
                />
              </div>

              {files.length > 0 && !isConverting && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Selected Files:</h3>
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm truncate">{file.name}</span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeFile(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              {isConverting && (
                <div className="space-y-2">
                  <p className="text-center">Converting...</p>
                  <Progress value={conversionProgress} className="w-full" />
                  <p className="text-sm text-center text-muted-foreground">{conversionProgress}%</p>
                </div>
              )}

              <Button 
                onClick={handleConvert} 
                disabled={files.length === 0 || isConverting}
                className="w-full h-12 text-lg font-bold transition-all duration-300 transform hover:scale-105"
              >
                  Convert to .{toType}
              </Button>
            </>
          ) : (
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold font-headline">Conversion Complete!</h3>
              <p className="text-muted-foreground">Your files are ready for download.</p>
              <div className="space-y-3 pt-4">
                {convertedFiles.map((file, index) => (
                  <Card key={index} className="flex items-center justify-between p-3 bg-muted/50">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileIcon className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm font-medium truncate">{file.name}</span>
                    </div>
                    <Button onClick={() => handleDownload(file)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </Card>
                ))}
              </div>
              
              {convertedFiles.length > 1 && (
                <Button onClick={handleDownloadAll} size="lg" className="w-full">
                  <Download className="mr-2 h-5 w-5" />
                  Download All (.zip)
                </Button>
              )}

              <Button onClick={handleReset} variant="outline" className="w-full">
                <RotateCcw className="mr-2 h-4 w-4" />
                Convert More Files
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
