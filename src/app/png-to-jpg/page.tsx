import { Converter } from '@/components/converter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PNG to JPG Converter - ConvertIQ',
  description: 'Easily and quickly convert your PNG images to high-quality JPG format for free.',
};

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
