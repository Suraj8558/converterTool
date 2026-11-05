import { PdfToJpg } from '@/components/pdf-to-jpg';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  'PDF to JPG - Converter Tool',
  'Convert each page of a PDF to a JPG image without uploading it.',
  '/pdf-to-jpg'
);

export default function PdfToJpgPage() {
  return <PdfToJpg />;
}
