'use client';

import { useEffect, useState } from 'react';
import { Download, RotateCcw, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FileDropzone } from '@/components/file-dropzone';
import { useToast } from '@/hooks/use-toast';
import { loadPdf, parsePageRanges } from '@/lib/conversions/pdf-tools';

type SplitMode = 'ranges' | 'every-page';

export function PdfSplit() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [mode, setMode] = useState<SplitMode>('ranges');
  const [ranges, setRanges] = useState('');
  const [isSplitting, setIsSplitting] = useState(false);
  const [result, setResult] = useState<{ url: string; name: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!result) return;
    return () => URL.revokeObjectURL(result.url);
  }, [result]);

  const showError = (title: string, error: unknown) => {
    console.error(`${title}:`, error);
    toast({
      title,
      description: error instanceof Error ? error.message : 'Something went wrong with this PDF.',
      variant: 'destructive',
    });
  };

  const handleFile = async ([selected]: File[]) => {
    try {
      const pdf = await loadPdf(selected);
      setPageCount(pdf.getPageCount());
      setRanges(`1-${pdf.getPageCount()}`);
      setFile(selected);
    } catch (error) {
      showError('Could Not Open PDF', error);
    }
  };

  const handleSplit = async () => {
    if (!file) return;
    setIsSplitting(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const source = await loadPdf(file);
      const baseName = file.name.replace(/\.pdf$/i, '');

      const extract = async (indexes: number[]) => {
        const output = await PDFDocument.create();
        const pages = await output.copyPages(source, indexes);
        pages.forEach((page) => output.addPage(page));
        return output.save();
      };

      if (mode === 'ranges') {
        const bytes = await extract(parsePageRanges(ranges, pageCount));
        setResult({
          url: URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' })),
          name: `${baseName}_pages.pdf`,
        });
      } else {
        const { default: JSZip } = await import('jszip');
        const zip = new JSZip();
        for (let index = 0; index < pageCount; index++) {
          zip.file(`${baseName}_page_${index + 1}.pdf`, await extract([index]));
        }
        setResult({
          url: URL.createObjectURL(await zip.generateAsync({ type: 'blob' })),
          name: `${baseName}_pages.zip`,
        });
      }
    } catch (error) {
      showError('Split Failed', error);
    } finally {
      setIsSplitting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPageCount(0);
    setRanges('');
    setResult(null);
  };

  return (
    <div className="container mx-auto max-w-3xl py-8 md:py-12">
      <Card className="shadow-soft">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold sm:text-3xl">PDF Split</CardTitle>
          <CardDescription>Extract the pages you need, or split a PDF into single pages.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!file ? (
            <FileDropzone accept="pdf" multiple={false} onFiles={handleFile} />
          ) : result ? (
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold font-headline">Split Complete!</h3>
              <Button asChild size="lg" className="w-full">
                <a href={result.url} download={result.name}>
                  <Download className="mr-2 h-5 w-5" />
                  Download {result.name}
                </a>
              </Button>
              <Button onClick={handleReset} variant="outline" className="w-full">
                <RotateCcw className="mr-2 h-4 w-4" />
                Split Another PDF
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-center text-muted-foreground">
                <span className="font-medium text-foreground">{file.name}</span> has {pageCount} page(s).
              </p>
              <RadioGroup value={mode} onValueChange={(value) => setMode(value as SplitMode)} className="space-y-2">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="ranges" id="split-ranges" />
                  <Label htmlFor="split-ranges">Extract page ranges into one PDF</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="every-page" id="split-every" />
                  <Label htmlFor="split-every">Save every page as its own PDF (.zip)</Label>
                </div>
              </RadioGroup>
              {mode === 'ranges' && (
                <div className="space-y-2">
                  <Label htmlFor="page-ranges">Pages</Label>
                  <Input id="page-ranges" value={ranges} onChange={(event) => setRanges(event.target.value)} placeholder="e.g. 1-3, 5" />
                </div>
              )}
              <Button
                onClick={handleSplit}
                disabled={isSplitting || (mode === 'ranges' && !ranges.trim())}
                className="w-full h-12 text-lg font-bold text-primary-foreground bg-gradient-to-r from-primary to-tertiary hover:saturate-150 transition-all duration-300"
              >
                <Scissors className="mr-2 h-5 w-5" />
                {isSplitting ? 'Splitting...' : 'Split PDF'}
              </Button>
              <Button onClick={handleReset} variant="outline" className="w-full">
                <RotateCcw className="mr-2 h-4 w-4" />
                Choose a Different PDF
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
