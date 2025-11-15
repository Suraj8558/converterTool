import { BacklinkChecker } from '@/components/backlink-checker';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Backlink Checker - devSuraj',
  description: 'Analyze the backlink profile of any domain with our AI-powered tool.',
};

export default function BacklinkCheckerPage() {
  return (
    <div className="container mx-auto max-w-5xl py-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight font-headline">AI Backlink Checker</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Get a quick analysis of any website's backlink profile.
        </p>
      </div>
      <BacklinkChecker />
    </div>
  );
}
