import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, UploadCloud, FileText } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PDF Merge - ConvertIQ',
  description: 'Combine multiple PDF files into one single document.',
};

export default function PdfMergePage() {
  return (
    <div className="container mx-auto max-w-3xl py-12">
      <Alert className="mb-8">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Developer Note</AlertTitle>
        <AlertDescription>
          This tool is currently a demonstration. PDF merging requires backend processing and will be implemented soon.
        </AlertDescription>
      </Alert>
      <Card className="rounded-xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold font-headline">PDF Merge</CardTitle>
          <CardDescription>Combine multiple PDF files into a single document.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="border border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted transition-colors bg-muted/50">
              <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">Drag & drop your PDF files here, or click to browse</p>
            </div>
            <div className="space-y-2">
                <h3 className="font-semibold">Selected Files:</h3>
                <div className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                    <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm truncate">document_1.pdf</span>
                    </div>
                </div>
                 <div className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                    <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm truncate">document_2.pdf</span>
                    </div>
                </div>
            </div>
            <Button
              disabled
              className="w-full h-12 text-lg font-bold text-primary-foreground bg-gradient-to-r from-primary to-tertiary hover:saturate-150 transition-all duration-300"
            >
                Merge PDFs
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
