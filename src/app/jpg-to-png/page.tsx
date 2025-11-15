import { Converter } from '@/components/converter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JPG to PNG Converter - devSuraj',
  description: 'Easily and quickly convert your JPG images to high-quality PNG format for free.',
};

export default function JpgToPngPage() {
  return (
    <Converter 
      title="JPG to PNG Converter"
      description="Convert your JPG images to high-quality PNG files in seconds."
      fromType="jpg,jpeg"
      toType="png"
    />
  );
}
