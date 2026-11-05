import { Converter } from '@/components/converter';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  'Word to PDF Converter - Converter Tool',
  'Convert Word (.docx) documents to PDF.',
  '/word-to-pdf'
);

export default function WordToPdfPage() {
  return (
    <Converter
      title="Word to PDF Converter"
      description="Convert .docx documents to PDF, keeping headings, lists, tables and images. The page layout may differ from Word. For older .doc files, use Save As in Word to create a .docx first."
      fromType="docx"
      toType="pdf"
      engine="docx-to-pdf"
    />
  );
}
