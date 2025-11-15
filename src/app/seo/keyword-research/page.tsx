import { KeywordResearchTool } from '@/components/keyword-research';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Keyword Research Tool - devSuraj',
  description: 'Discover keyword ideas, search volume, and difficulty with our AI-powered tool.',
};

export default function KeywordResearchPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight font-headline">AI Keyword Research Tool</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Uncover valuable keywords to boost your content strategy and SEO.
        </p>
      </div>
      <KeywordResearchTool />
    </div>
  );
}
