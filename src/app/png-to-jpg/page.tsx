import { Converter } from '@/components/converter';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  'PNG to JPG Converter - Converter Tool',
  'Easily and quickly convert your PNG images to high-quality JPG format for free.',
  '/png-to-jpg'
);

export default function PngToJpgPage() {
  return (
    <Converter 
      title="PNG to JPG Converter"
      description="Convert your PNG images to high-quality JPG files with an adjustable compression level."
      fromType="png"
      toType="jpg"
    />
  );
}
