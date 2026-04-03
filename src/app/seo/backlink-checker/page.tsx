import { ComingSoon } from '@/components/coming-soon';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Backlink Checker - devSuraj',
  description: 'Analyze the backlink profile of any domain with our AI-powered tool.',
};

export default function BacklinkCheckerPage() {
  return (
    <ComingSoon
      title="AI Backlink Checker"
      description="Analyze the backlink profile of any domain."
      reason="Accurate backlink analysis requires deep crawling and indexing of the entire web. Our current AI model simulates this, but we're working on a real-time data connection."
    />
  );
}
