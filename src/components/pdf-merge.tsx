'use client';

import { useEffect, useState } from 'react';
import { Combine, Download, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileDropzone } from '@/components/file-dropzone';
import { FileOrderList } from '@/components/file-order-list';
import { useToast } from '@/hooks/use-toast';
import { loadPdf } from '@/lib/conversions/pdf-tools';

export function PdfMerge() {
  const [files, setFiles] = useState<File[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!resultUrl) return;
    return () => URL.revokeObjectURL(resultUrl);
  }, [resultUrl]);

  const handleMerge = async () => {
    setIsMerging(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const merged = await PDFDocument.create();
      for (const file of files) {
        const source = await loadPdf(file);
        const pages = await merged.copyPages(source, source.getPageIndices());
        pages.forEach((page) => merged.addPage(page));
      }
      const bytes = await merged.save();
      setResultUrl(URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' })));
    } catch (error) {
      console.error('PDF merge failed:', error);
      toast({
        title: 'Merge Failed',
        description: error instanceof Error ? error.message : 'The PDFs could not be merged.',
        variant: 'destructive',
      });
    } finally {
      setIsMerging(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setResultUrl(null);
  };

  return (
    <div className="container mx-auto max-w-3xl py-12">
      <Card className="rounded-xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold font-headline">PDF Merge</CardTitle>
          <CardDescription>Combine multiple PDF files into one document, in the order you choose.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {resultUrl ? (
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold font-headline">Merge Complete!</h3>
              <Button asChild size="lg" className="w-full">
                <a href={resultUrl} download="merged.pdf">
                  <Download className="mr-2 h-5 w-5" />
                  Download merged.pdf
                </a>
              </Button>
              <Button onClick={handleReset} variant="outline" className="w-full">
                <RotateCcw className="mr-2 h-4 w-4" />
                Merge More Files
              </Button>
            </div>
          ) : (
            <>
              <FileDropzone accept="pdf" onFiles={(added) => setFiles((current) => [...current, ...added])} />

              {files.length > 0 && <FileOrderList title="Merge order:" files={files} onChange={setFiles} />}

              <Button
                onClick={handleMerge}
                disabled={files.length < 2 || isMerging}
                className="w-full h-12 text-lg font-bold text-primary-foreground bg-gradient-to-r from-primary to-tertiary hover:saturate-150 transition-all duration-300"
              >
                <Combine className="mr-2 h-5 w-5" />
                {isMerging ? 'Merging...' : 'Merge PDFs'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
