import { Converter } from '@/components/converter';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  'EPUB to MOBI Converter - Converter Tool',
  'Convert EPUB e-books to MOBI format.',
  '/epub-to-mobi'
);

export default function EpubToMobiPage() {
  return (
    <Converter
      title="EPUB to MOBI Converter"
      description="Convert unprotected EPUB e-books to MOBI for older e-readers. Links between chapters and very large images are not kept."
      fromType="epub"
      toType="mobi"
      engine="epub-to-mobi"
    />
  );
}
