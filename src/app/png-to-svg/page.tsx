import { Converter } from '@/components/converter';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  'PNG to SVG Converter - Converter Tool',
  'Trace PNG images into scalable SVG vector graphics.',
  '/png-to-svg'
);

export default function PngToSvgPage() {
  return (
    <Converter
      title="PNG to SVG Converter"
      description="Trace your PNG images into scalable SVG vectors. Works best on logos, icons and flat artwork."
      fromType="png"
      toType="svg"
      engine="png-to-svg"
    />
  );
}
