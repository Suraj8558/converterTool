import { PdfEditor } from '@/components/pdf-editor';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PDF Editor - ConvertIQ',
  description: 'Edit pages in your PDF files online for free. Add and remove pages from your document.',
};

export default function PdfEditorPage() {
  return (
    <div className="container mx-auto max-w-7xl py-12 flex justify-center">
      <PdfEditor />
    </div>
  );
}
