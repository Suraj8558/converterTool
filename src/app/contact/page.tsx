import { ContactForm } from '@/components/contact-form';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  'Contact Us - Converter Tool',
  'Get in touch with the Converter Tool team.',
  '/contact'
);

export default function ContactPage() {
  return <ContactForm />;
}
