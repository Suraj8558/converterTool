import { ComingSoon } from '@/components/coming-soon';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MP3 to WAV Converter - devSuraj',
  description: 'Easily convert your MP3 audio files to uncompressed WAV format for free.',
};

export default function Mp3ToWavPage() {
  return (
    <ComingSoon
      title="MP3 to WAV Converter"
      description="Transform MP3s into uncompressed WAV for professional audio quality."
      reason="Audio decoding and re-encoding (MP3 → WAV) requires server-side processing. This feature is not yet available but is coming soon."
    />
  );
}
