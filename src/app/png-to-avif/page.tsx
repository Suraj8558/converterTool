import { Converter } from '@/components/converter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PNG to AVIF Converter - ConvertIQ',
  description: 'Convert PNG images to the next-generation AVIF format for superior compression.',
};

export default function PngToAvifPage() {
  return (
    <Converter 
      title="PNG to AVIF Converter"
      description="Convert your PNG images to high-quality, efficient AVIF files."
      fromType="png"
      toType="avif"
    />
  );
}
