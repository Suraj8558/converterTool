import { Converter } from '@/components/converter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SVG to PNG Converter - devSuraj',
  description: 'Easily convert your scalable vector graphics (SVG) to high-quality PNG images.',
};

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
