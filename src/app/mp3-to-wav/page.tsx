import { Converter } from '@/components/converter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MP3 to WAV Converter - devSuraj',
  description: 'Easily convert your MP3 audio files to uncompressed WAV format for free.',
};

export default function Mp3ToWavPage() {
  return (
    <Converter 
      title="MP3 to WAV Converter"
      description="Convert your MP3 audio to uncompressed WAV files for maximum quality."
      fromType="mp3"
      toType="wav"
    />
  );
}
