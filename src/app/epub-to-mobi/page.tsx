import { ComingSoon } from '@/components/coming-soon';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EPUB to MOBI Converter - tools.typingSnap',
  description: 'Convert EPUB e-books to MOBI format for your Kindle device.',
};

export default function EpubToMobiPage() {
  return (
    <ComingSoon
      title="EPUB to MOBI Converter"
      description="Convert EPUB e-books to MOBI format for your Kindle device."
      reason="E-book format conversion requires server-side tools like Calibre. This feature is not yet available but is coming soon."
    />
  );
}
