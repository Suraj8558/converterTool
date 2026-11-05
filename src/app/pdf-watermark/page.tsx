import { PdfWatermark } from '@/components/pdf-watermark';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  'Add Watermark to PDF - Converter Tool',
  'Stamp text or an image on a PDF without uploading it.',
  '/pdf-watermark'
);

export default function PdfWatermarkPage() {
  return <PdfWatermark />;
}
