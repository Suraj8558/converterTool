import * as React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { DesktopToolNav, MobileToolNav } from '@/components/layout/tool-nav';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <Logo />
            <span className="font-bold font-headline">
              Converter Tool
            </span>
          </Link>
          <DesktopToolNav />
        </div>
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <MobileToolNav />
        </div>
      </div>
    </header>
  );
}
