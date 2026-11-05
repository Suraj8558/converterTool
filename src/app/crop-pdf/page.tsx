import { CropPdf } from '@/components/crop-pdf';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  'Crop PDF - Converter Tool',
  'Crop the pages of a PDF without uploading it.',
  '/crop-pdf'
);

export default function CropPdfPage() {
  return <CropPdf />;
}
