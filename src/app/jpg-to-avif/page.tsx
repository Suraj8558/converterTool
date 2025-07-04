import { Converter } from '@/components/converter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JPG to AVIF Converter - ConvertIQ',
  description: 'Convert JPG images to the next-generation AVIF format for superior compression.',
};

export default function JpgToAvifPage() {
  return (
    <Converter 
      title="JPG to AVIF Converter"
      description="Convert your JPG images to high-quality, efficient AVIF files."
      fromType="jpg,jpeg"
      toType="avif"
    />
  );
}
