import { Converter } from '@/components/converter';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  'PNG to AVIF Converter - Converter Tool',
  'Convert PNG images to the next-generation AVIF format for superior compression.',
  '/png-to-avif'
);

export default function PngToAvifPage() {
  return (
    <Converter
      title="PNG to AVIF Converter"
      description="Convert your PNG images to efficient AVIF files, with transparency preserved."
      fromType="png"
      toType="avif"
      engine="avif"
    />
  );
}
