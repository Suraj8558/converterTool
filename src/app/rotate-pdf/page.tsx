import { RotatePdf } from '@/components/rotate-pdf';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  'Rotate PDF - Converter Tool',
  'Rotate one page or a whole PDF without uploading it.',
  '/rotate-pdf'
);

export default function RotatePdfPage() {
  return <RotatePdf />;
}
