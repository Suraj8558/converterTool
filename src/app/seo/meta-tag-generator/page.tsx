import { MetaTagGenerator } from '@/components/meta-tag-generator';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Meta Tag Generator - devSuraj',
  description: 'Generate SEO-friendly meta titles, descriptions, and keywords for your website using AI.',
};

export default function MetaTagGeneratorPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight font-headline">AI Meta Tag Generator</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Let our AI create optimized meta tags to improve your search engine rankings.
        </p>
      </div>
      <MetaTagGenerator />
    </div>
  );
}
