import { Converter } from '@/components/converter';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  'PDF to Word Converter - Converter Tool',
  'Convert PDF documents to editable Word (.docx) files.',
  '/pdf-to-word'
);

export default function PdfToWordPage() {
  return (
    <Converter
      title="PDF to Word Converter"
      description="Extract the text of a PDF into an editable .docx file. Images, tables and exact layout are not kept, and scanned PDFs are not supported."
      fromType="pdf"
      toType="docx"
      engine="pdf-to-docx"
    />
  );
}
