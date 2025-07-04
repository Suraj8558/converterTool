'use client';

import { useState } from 'react';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ConverterProps {
  title: string;
  description: string;
  fromType: string;
  toType: string;
}

export function Converter({ title, description, fromType, toType }: ConverterProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(Array.from(event.target.files));
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files) {
      setFiles(Array.from(event.dataTransfer.files));
    }
  };
  
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };
  
  const handleConvert = () => {
    if (files.length === 0) return;
    setIsConverting(true);
    setConversionProgress(0);

    const interval = setInterval(() => {
      setConversionProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsConverting(false);
            setFiles([]);
          }, 1000);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <div className="container mx-auto max-w-3xl py-12">
      <Card className="rounded-xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold font-headline">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div 
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors bg-background/50"
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
              <p>Converting...</p>
              <Progress value={conversionProgress} className="w-full" />
              <p className="text-sm text-center text-muted-foreground">{conversionProgress}%</p>
            </div>
          )}

          <Button 
            onClick={handleConvert} 
            disabled={files.length === 0 || isConverting}
            className="w-full h-12 text-lg font-bold bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-300 transform hover:scale-105"
          >
              Convert to .{toType}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
