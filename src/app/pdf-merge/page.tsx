import { PdfMerge } from '@/components/pdf-merge';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  'PDF Merge - Converter Tool',
  'Combine multiple PDF files into one single document.',
  '/pdf-merge'
);

export default function PdfMergePage() {
  return <PdfMerge />;
}
