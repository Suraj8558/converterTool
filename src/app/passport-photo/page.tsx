import { PassportPhoto } from '@/components/passport-photo';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  'Passport Photo Maker - Converter Tool',
  'Make passport and visa photos in official sizes: remove or change the background, fix brightness and contrast, and print a sheet of copies on 4×6, A4 or Letter paper.',
  '/passport-photo'
);

export default function PassportPhotoPage() {
  return <PassportPhoto />;
}
