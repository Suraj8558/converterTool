import { ImageCompressor } from '@/components/image-compressor';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Image Compressor - ConvertIQ',
  description: 'Compress JPG, PNG, and WebP images online to reduce their file size.',
};

export default function ImageCompressorPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12 flex justify-center">
      <ImageCompressor />
    </div>
  );
}
