import { ComingSoon } from '@/components/coming-soon';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Word to PDF Converter - devSuraj',
  description: 'Convert Microsoft Word documents (DOC, DOCX) to PDF format for free.',
};

export default function WordToPdfPage() {
  return (
    <ComingSoon
      title="Word to PDF Converter"
      description="Create professional, secure PDF files from your Word documents."
      reason="Converting DOCX to PDF requires server-side rendering tools (e.g., LibreOffice or Pandoc). This feature is not yet available but is coming soon."
    />
  );
}
