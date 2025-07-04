import { Converter } from '@/components/converter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MP4 to AVI Converter - ConvertIQ',
  description: 'Easily convert your MP4 video files to AVI format online for free.',
};

export default function Mp4ToAviPage() {
  return (
    <Converter 
      title="MP4 to AVI Converter"
      description="Convert your MP4 videos to AVI format in just a few clicks."
      fromType="mp4"
      toType="avi"
    />
  );
}
