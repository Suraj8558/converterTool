'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { toolCategories } from '@/lib/tools';

export function DesktopToolNav() {
  return (
    <nav aria-label="Tools" className="hidden lg:flex items-center gap-1">
      {toolCategories.map((category) => (
        <DropdownMenu key={category.name}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="data-[state=open]:bg-accent">
              {category.name}
              <ChevronDown className="h-4 w-4 opacity-60" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-[70vh] w-64 overflow-y-auto p-2">
            {category.tools.map((tool) => (
              <DropdownMenuItem key={tool.href} asChild className="cursor-pointer gap-3 rounded-lg py-2">
                <Link href={tool.href}>
                  <span className="text-primary [&_svg]:h-4 [&_svg]:w-4" aria-hidden="true">{tool.icon}</span>
                  {tool.name}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ))}
    </nav>
  );
}

export function MobileToolNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open tools menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[85%] overflow-y-auto">
        <SheetTitle className="font-headline text-xl">All Tools</SheetTitle>
        <nav aria-label="Tools" className="mt-6 space-y-7 pb-6">
          {toolCategories.map((category) => (
            <div key={category.name}>
              <h3 className="mb-2 flex items-center gap-2 font-headline text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <span className="text-primary [&_svg]:h-4 [&_svg]:w-4" aria-hidden="true">{category.icon}</span>
                {category.name}
              </h3>
              <ul>
                {category.tools.map((tool) => (
                  <li key={tool.href}>
                    <Link
                      href={tool.href}
                      onClick={() => setOpen(false)}
                      className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {tool.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
