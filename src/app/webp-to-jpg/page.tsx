import { Converter } from '@/components/converter';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  'WebP to JPG Converter - Converter Tool',
  'Convert modern WebP images to the widely compatible JPG format for free.',
  '/webp-to-jpg'
);

export default function WebpToJpgPage() {
  return (
    <Converter 
      title="WebP to JPG Converter"
      description="Convert your WebP images to high-quality JPG files in seconds."
      fromType="webp"
      toType="jpg"
    />
  );
}
