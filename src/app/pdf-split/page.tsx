import { ComingSoon } from '@/components/coming-soon';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PDF Split - tools.typingSnap',
  description: 'Split a single PDF into multiple files by page ranges.',
};

export default function PdfSplitPage() {
  return (
    <ComingSoon
      title="PDF Split"
      description="Extract pages or a large PDF into multiple smaller files."
      reason="Splitting PDFs involves complex manipulation of the PDF cross-reference table and objects. This feature is not yet available but is coming soon."
    />
  );
}
