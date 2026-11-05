import { Converter } from '@/components/converter';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  'GIF to MP4 Converter - Converter Tool',
  'Convert animated GIFs to compact MP4 videos.',
  '/gif-to-mp4'
);

export default function GifToMp4Page() {
  return (
    <Converter
      title="GIF to MP4 Converter"
      description="Turn animated GIFs into much smaller MP4 videos. The video engine (about 31 MB) downloads on first use."
      fromType="gif"
      toType="mp4"
      engine="gif-to-mp4"
    />
  );
}
