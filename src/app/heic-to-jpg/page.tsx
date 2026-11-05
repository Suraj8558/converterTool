import { Converter } from '@/components/converter';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  'HEIC to JPG Converter - Converter Tool',
  'Convert iPhone HEIC photos to JPG without uploading them.',
  '/heic-to-jpg'
);

export default function HeicToJpgPage() {
  return (
    <Converter
      title="HEIC to JPG Converter"
      description="Convert iPhone HEIC photos to JPG files you can open and share anywhere."
      fromType="heic,heif"
      toType="jpg"
      engine="heic-to-jpg"
    />
  );
}
