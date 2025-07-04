import { ImageResizer } from '@/components/image-resizer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Image Resizer - ConvertIQ',
  description: 'Resize your JPG, PNG, WebP, or GIF images to any dimensions you need.',
};

export default function ImageResizerPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12 flex justify-center">
      <ImageResizer />
    </div>
  );
}
