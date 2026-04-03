import { ComingSoon } from '@/components/coming-soon';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MP4 to AVI Converter - tools.typingSnap',
  description: 'Easily convert your MP4 video files to AVI format online for free.',
};

export default function Mp4ToAviPage() {
  return (
    <ComingSoon
      title="MP4 to AVI Converter"
      description="Convert MP4 videos to AVI format for legacy media players."
      reason="Video transcoding (MP4 → AVI) requires server-side processing with tools like FFmpeg. This feature is not yet available but is coming soon."
    />
  );
}
