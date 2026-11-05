import { Converter } from '@/components/converter';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  'JPG to AVIF Converter - Converter Tool',
  'Convert JPG images to the next-generation AVIF format for superior compression.',
  '/jpg-to-avif'
);

export default function JpgToAvifPage() {
  return (
    <Converter
      title="JPG to AVIF Converter"
      description="Convert your JPG images to efficient AVIF files, right in your browser."
      fromType="jpg,jpeg"
      toType="avif"
      engine="avif"
    />
  );
}
