import { ComingSoon } from '@/components/coming-soon';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PDF to Word Converter - tools.typingSnap',
  description: 'Convert PDF files to editable Microsoft Word documents.',
};

export default function PdfToWordPage() {
  return (
    <ComingSoon
      title="PDF to Word Converter"
      description="Turn static PDFs into fully editable Microsoft Word documents."
      reason="Accurately extracting structured text, tables, and formatting from a PDF into a DOCX file requires complex server-side parsing. This feature is not yet available but is coming soon."
    />
  );
}
