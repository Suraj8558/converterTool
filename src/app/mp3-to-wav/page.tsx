import { Converter } from '@/components/converter';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  'MP3 to WAV Converter - Converter Tool',
  'Convert MP3 audio files to uncompressed WAV format.',
  '/mp3-to-wav'
);

export default function Mp3ToWavPage() {
  return (
    <Converter
      title="MP3 to WAV Converter"
      description="Convert your MP3 audio to uncompressed 16-bit WAV files."
      fromType="mp3"
      toType="wav"
      engine="mp3-to-wav"
    />
  );
}
