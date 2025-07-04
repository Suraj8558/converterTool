import { PassportPhotoMaker } from '@/components/passport-photo-maker';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Passport Size Photo Maker - ConvertIQ',
  description: 'Easily create passport size photos from your own pictures for free.',
};

export default function PassportPhotoMakerPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12 flex justify-center">
      <PassportPhotoMaker />
    </div>
  );
}
