import { Converter } from '@/components/converter';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  'MP4 to AVI Converter - Converter Tool',
  'Convert MP4 videos to AVI format.',
  '/mp4-to-avi'
);

export default function Mp4ToAviPage() {
  return (
    <Converter
      title="MP4 to AVI Converter"
      description="Convert MP4 videos to AVI. The video engine (about 31 MB) downloads on first use, and large videos can take a while."
      fromType="mp4"
      toType="avi"
      engine="mp4-to-avi"
    />
  );
}
