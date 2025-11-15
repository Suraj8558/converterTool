import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, UploadCloud, Scissors } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PDF Split - devSuraj',
  description: 'Split a single PDF into multiple files by page ranges.',
};

export default function PdfSplitPage() {
  return (
    <div className="container mx-auto max-w-3xl py-12">
      <Alert className="mb-8">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Developer Note</AlertTitle>
        <AlertDescription>
          This tool is currently a demonstration. PDF splitting requires backend processing and will be implemented soon.
        </AlertDescription>
      </Alert>
      <Card className="rounded-xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold font-headline">PDF Split</CardTitle>
          <CardDescription>Extract pages or split a PDF into multiple documents.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="border border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted transition-colors bg-muted/50">
              <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">Drag & drop your PDF file here, or click to browse</p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="ranges">Page ranges to extract (e.g., 1-3, 5, 7-9)</Label>
                <Input id="ranges" placeholder="1-3, 5, 7-9" disabled />
            </div>
            <Button
              disabled
              className="w-full h-12 text-lg font-bold text-primary-foreground bg-gradient-to-r from-primary to-tertiary hover:saturate-150 transition-all duration-300"
            >
                <Scissors className="mr-2 h-5 w-5" />
                Split PDF
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
