import { ImageResizer } from '@/components/image-resizer';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  'Image Resizer - Converter Tool',
  'Resize your JPG, PNG, WebP, or GIF images to any dimensions you need.',
  '/image-resizer'
);

export default function ImageResizerPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12 flex justify-center">
      <ImageResizer />
    </div>
  );
}
