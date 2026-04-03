import { ComingSoon } from '@/components/coming-soon';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PNG to SVG Converter - devSuraj',
  description: 'Convert PNG images to scalable vector graphics (SVG) online.',
};

export default function PngToSvgPage() {
  return (
    <ComingSoon
      title="PNG to SVG Converter"
      description="Convert PNG images into scalable SVG vector graphics."
      reason="Converting a raster image (PNG) to a vector (SVG) is a process called image tracing/vectorization. It requires a dedicated algorithm that is not yet integrated."
    />
  );
}
