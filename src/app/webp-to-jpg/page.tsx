import { Converter } from '@/components/converter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WebP to JPG Converter - devSuraj',
  description: 'Convert modern WebP images to the widely compatible JPG format for free.',
};

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
