import { ComingSoon } from '@/components/coming-soon';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Plagiarism Checker - devSuraj',
  description: 'Check your text for uniqueness and find potential plagiarism with our AI-powered tool.',
};

export default function PlagiarismCheckerPage() {
  return (
    <ComingSoon
      title="AI Plagiarism Checker"
      description="Check your text for uniqueness and avoid duplicate content issues."
      reason="Real-time plagiarism detection requires comparing text against an index of trillions of pages. Our current model simulates this, but we're working on a real database connection."
    />
  );
}
