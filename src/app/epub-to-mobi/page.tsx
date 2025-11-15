import { Converter } from '@/components/converter';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EPUB to MOBI Converter - devSuraj',
  description: 'Convert EPUB e-books to MOBI format for your Kindle device.',
};

export default function EpubToMobiPage() {
  return (
    <>
      <div className="container mx-auto max-w-3xl pt-12">
        <Alert>
          <Terminal className="h-4 w-4" />
          <AlertTitle>Developer Note</AlertTitle>
          <AlertDescription>
            This converter is currently a demonstration. E-book conversion requires complex backend processing and will be implemented soon.
          </AlertDescription>
        </Alert>
      </div>
      <Converter 
        title="EPUB to MOBI Converter"
        description="Convert your EPUB e-books to MOBI format for your Kindle."
        fromType="epub"
        toType="mobi"
      />
    </>
  );
}
