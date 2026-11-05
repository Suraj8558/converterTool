import { ImageCompressor } from '@/components/image-compressor';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  'Image Compressor - Converter Tool',
  'Compress JPG, PNG, and WebP images online to reduce their file size.',
  '/image-compressor'
);

export default function ImageCompressorPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12 flex justify-center">
      <ImageCompressor />
    </div>
  );
}
