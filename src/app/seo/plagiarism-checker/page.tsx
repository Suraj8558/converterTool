import { PlagiarismChecker } from '@/components/plagiarism-checker';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Plagiarism Checker - devSuraj',
  description: 'Check your text for uniqueness and find potential plagiarism with our AI-powered tool.',
};

export default function PlagiarismCheckerPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight font-headline">AI Plagiarism Checker</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Ensure your content is original and avoid duplicate content issues.
        </p>
      </div>
      <PlagiarismChecker />
    </div>
  );
}
