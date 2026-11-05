import { ImagesToPdf } from '@/components/images-to-pdf';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  'Images to PDF - Converter Tool',
  'Combine JPG, PNG and WebP images into one PDF without uploading them.',
  '/images-to-pdf'
);

export default function ImagesToPdfPage() {
  return <ImagesToPdf />;
}
