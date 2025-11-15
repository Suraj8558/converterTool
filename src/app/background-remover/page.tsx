import { BackgroundRemover } from '@/components/background-remover';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Image Background Remover - devSuraj',
  description: 'Easily remove the background from any image with a single click using AI.',
};

export default function BackgroundRemoverPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12 flex justify-center">
      <BackgroundRemover />
    </div>
  );
}
