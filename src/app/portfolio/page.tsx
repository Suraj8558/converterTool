import { Portfolio } from '@/components/portfolio';
import type { Metadata } from 'next';
import './portfolio.css';

export const metadata: Metadata = {
  title: 'Suraj Kumar - Portfolio',
  description: 'The portfolio of Suraj Kumar, a full-stack developer and UI/UX enthusiast.',
};

export default function PortfolioPage() {
  return <Portfolio />;
}
