import { OrganizePdf } from '@/components/organize-pdf';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  'Organize PDF - Converter Tool',
  'Reorder, remove or add pages in a PDF without uploading it.',
  '/organize-pdf'
);

export default function OrganizePdfPage() {
  return <OrganizePdf />;
}
