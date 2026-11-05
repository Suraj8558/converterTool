import { PdfSplit } from '@/components/pdf-split';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  'PDF Split - Converter Tool',
  'Extract page ranges from a PDF or split it into single pages.',
  '/pdf-split'
);

export default function PdfSplitPage() {
  return <PdfSplit />;
}
