import { Converter } from '@/components/converter';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PDF to Word Converter - ConvertIQ',
  description: 'Convert PDF files to editable Microsoft Word documents.',
};

export default function PdfToWordPage() {
  return (
    <>
      <div className="container mx-auto max-w-3xl pt-12">
        <Alert>
          <Terminal className="h-4 w-4" />
          <AlertTitle>Developer Note</AlertTitle>
          <AlertDescription>
            This converter is currently a demonstration. PDF to Word conversion requires complex backend processing and will be implemented soon.
          </AlertDescription>
        </Alert>
      </div>
      <Converter 
        title="PDF to Word Converter"
        description="Convert your PDF files back into editable Word documents."
        fromType="pdf"
        toType="docx"
      />
    </>
  );
}
