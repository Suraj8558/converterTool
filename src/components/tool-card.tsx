import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ToolVisual, type Tone, type ToolVisualSpec } from '@/components/tool-visual';

interface ToolCardProps {
  name: string;
  href: string;
  description: string;
  visual: ToolVisualSpec;
  tone: Tone;
}

/** The whole card is one link, so the entire tile is clickable and reads as one item. */
export function ToolCard({ name, href, description, visual, tone }: ToolCardProps) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-soft ring-offset-background transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <ToolVisual spec={visual} tone={tone} className="border-b" />
      <div className="flex flex-1 flex-col gap-1.5 p-4 sm:p-5">
        <h3 className="font-headline text-base font-semibold leading-snug sm:text-lg">{name}</h3>
        <p className="flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
          Open tool
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
