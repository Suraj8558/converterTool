import { Converter } from '@/components/converter';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  'JPG to PNG Converter - Converter Tool',
  'Easily and quickly convert your JPG images to high-quality PNG format for free.',
  '/jpg-to-png'
);

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
