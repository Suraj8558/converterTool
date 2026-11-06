import * as React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { DesktopToolNav, MobileToolNav } from '@/components/layout/tool-nav';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-4 lg:gap-8">
          <Link href="/" className="flex items-center gap-2 rounded-lg ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <Logo />
            <span className="whitespace-nowrap font-headline text-lg font-bold tracking-tight">
              Converter Tool
            </span>
          </Link>
          <DesktopToolNav />
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button asChild size="sm" className="hidden bg-brand-gradient shadow-md hover:saturate-150 lg:inline-flex">
            <Link href="/#images">Browse tools</Link>
          </Button>
          <ThemeToggle />
          <MobileToolNav />
        </div>
      </div>
    </header>
  );
}
