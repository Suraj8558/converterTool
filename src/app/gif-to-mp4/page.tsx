
import { Converter } from '@/components/converter';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GIF to MP4 Converter - devSuraj',
  description: 'Convert animated GIF files to MP4 videos online for free.',
};

export default function GifToMp4Page() {
  return (
    <>
      <div className="container mx-auto max-w-3xl pt-12">
        <Alert>
          <Terminal className="h-4 w-4" />
          <AlertTitle>Developer Note</AlertTitle>
          <AlertDescription>
            This converter is currently a demonstration. A full GIF to MP4 conversion requires backend processing and will be implemented soon.
          </AlertDescription>
        </Alert>
      </div>
      <Converter 
        title="GIF to MP4 Converter"
        description="Convert your animated GIF images to MP4 videos in seconds."
        fromType="gif"
        toType="mp4"
      />
    </>
  );
}
