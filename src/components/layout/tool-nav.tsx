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
    <nav aria-label="Tools" className="hidden md:flex items-center gap-1">
      {toolCategories.map((category) => (
        <DropdownMenu key={category.name}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              {category.name}
              <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {category.tools.map((tool) => (
              <DropdownMenuItem key={tool.href} asChild>
                <Link href={tool.href}>{tool.name}</Link>
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
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open tools menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetTitle>All Tools</SheetTitle>
        <nav aria-label="Tools" className="mt-6 space-y-6">
          {toolCategories.map((category) => (
            <div key={category.name}>
              <h3 className="font-semibold font-headline mb-2">{category.name}</h3>
              <ul className="space-y-1">
                {category.tools.map((tool) => (
                  <li key={tool.href}>
                    <Link
                      href={tool.href}
                      onClick={() => setOpen(false)}
                      className="block py-1 text-sm text-muted-foreground hover:text-foreground"
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
