'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { toolCategories } from '@/lib/tools';

const linkClass =
  'rounded-sm underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/** Shows where a tool lives, with a way back to the full list. Renders nothing elsewhere. */
export function ToolBreadcrumb() {
  const pathname = usePathname();
  const category = toolCategories.find((item) => item.tools.some((tool) => tool.href === pathname));
  const tool = category?.tools.find((item) => item.href === pathname);
  if (!category || !tool) return null;

  return (
    <nav aria-label="Breadcrumb" className="container pt-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <li>
          <Link href="/" className={linkClass}>
            All tools
          </Link>
        </li>
        <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        <li>
          <Link href={`/#${category.id}`} className={linkClass}>
            {category.name}
          </Link>
        </li>
        <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        <li aria-current="page" className="font-medium text-foreground">{tool.name}</li>
      </ol>
    </nav>
  );
}
