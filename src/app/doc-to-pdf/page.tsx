import { Converter } from '@/components/converter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DOC to PDF Converter - devSuraj',
  description: 'Convert Microsoft Word documents (DOC, DOCX) to PDF format for free.',
};

export default function DocToPdfPage() {
  return (
    <Converter 
      title="DOC to PDF Converter"
      description="Convert your Word documents to PDF for easy sharing, archiving, and printing."
      fromType="doc,docx"
      toType="pdf"
    />
  );
}
