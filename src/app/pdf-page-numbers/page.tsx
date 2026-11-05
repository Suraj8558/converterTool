import { PdfPageNumbers } from '@/components/pdf-page-numbers';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  'Add Page Numbers to PDF - Converter Tool',
  'Add page numbers to a PDF without uploading it.',
  '/pdf-page-numbers'
);

export default function PdfPageNumbersPage() {
  return <PdfPageNumbers />;
}
