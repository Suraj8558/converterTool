import { Converter } from '@/components/converter';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  'SVG to PNG Converter - Converter Tool',
  'Easily convert your scalable vector graphics (SVG) to high-quality PNG images.',
  '/svg-to-png'
);

export default function SvgToPngPage() {
  return (
    <Converter 
      title="SVG to PNG Converter"
      description="Convert your SVG files to high-quality PNG images, ideal for web use and applications requiring transparency."
      fromType="svg"
      toType="png"
    />
  );
}
