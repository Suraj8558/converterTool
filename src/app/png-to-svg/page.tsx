import { Converter } from '@/components/converter';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PNG to SVG Converter - ConvertIQ',
  description: 'Convert PNG images to scalable vector graphics (SVG) online.',
};

export default function PngToSvgPage() {
  return (
    <>
      <div className="container mx-auto max-w-3xl pt-12">
        <Alert>
          <Terminal className="h-4 w-4" />
          <AlertTitle>Developer Note</AlertTitle>
          <AlertDescription>
            This converter is currently a demonstration. Converting a raster image (PNG) to a vector format (SVG) is a complex process called vectorization and will be implemented soon.
          </AlertDescription>
        </Alert>
      </div>
      <Converter 
        title="PNG to SVG Converter"
        description="Convert your PNG images into scalable SVG vector graphics."
        fromType="png"
        toType="svg"
      />
    </>
  );
}
