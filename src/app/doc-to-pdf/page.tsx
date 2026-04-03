import { ComingSoon } from '@/components/coming-soon';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DOC to PDF Converter - devSuraj',
  description: 'Convert Microsoft Word documents (DOC, DOCX) to PDF format for free.',
};

export default function DocToPdfPage() {
  return (
    <ComingSoon
      title="DOC to PDF Converter"
      description="Convert Word documents to PDF for universal sharing and printing."
      reason="Converting DOC/DOCX to PDF requires server-side rendering tools (e.g., LibreOffice or Pandoc). This feature is not yet available but is coming soon."
    />
  );
}
