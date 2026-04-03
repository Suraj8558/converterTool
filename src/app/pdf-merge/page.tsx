import { ComingSoon } from '@/components/coming-soon';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PDF Merge - devSuraj',
  description: 'Combine multiple PDF files into one single document.',
};

export default function PdfMergePage() {
  return (
    <ComingSoon
      title="PDF Merge"
      description="Combine multiple PDF files into one single, organized document."
      reason="Merging multiple PDF files requires complex handling of PDF structures that is best performed server-side. This feature is not yet available but is coming soon."
    />
  );
}
