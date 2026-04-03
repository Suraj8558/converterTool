
import { ComingSoon } from '@/components/coming-soon';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GIF to MP4 Converter - tools.typingSnap',
  description: 'Convert animated GIF files to MP4 videos online for free.',
};

export default function GifToMp4Page() {
  return (
    <ComingSoon
      title="GIF to MP4 Converter"
      description="Convert your animated GIFs into lightweight, high-quality MP4 videos."
      reason="Video encoding (GIF → MP4) requires server-side processing with tools like FFmpeg. This feature is not yet available but is coming soon."
    />
  );
}
