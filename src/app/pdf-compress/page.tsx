import { PdfCompress } from '@/components/pdf-compress';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  'PDF Compress - Converter Tool',
  'Reduce the file size of a PDF without uploading it.',
  '/pdf-compress'
);

export default function PdfCompressPage() {
  return <PdfCompress />;
}
