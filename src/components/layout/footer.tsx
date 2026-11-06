import Link from 'next/link';
import { Logo } from '@/components/logo';
import { toolCategories } from '@/lib/tools';

export default function Footer() {
  return (
    <footer className="mt-16 border-t bg-muted/40">
      <div className="container py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.1fr_1fr_1.4fr_1fr]">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex w-fit items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Logo />
              <span className="font-headline text-lg font-bold">Converter Tool</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              All-in-one file conversion and productivity tools. Everything runs in your browser, so your files stay private.
            </p>
          </div>
          {toolCategories.map((category) => (
            <div key={category.name}>
              <h3 className="font-headline text-sm font-semibold">{category.name}</h3>
              <ul className="mt-4 space-y-2.5">
                {category.tools.map((tool) => (
                  <li key={tool.href}>
                    <Link href={tool.href} className="rounded-sm text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      {tool.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Converter Tool. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link href="/privacy" className="rounded-sm text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Privacy Policy
            </Link>
            <Link href="/terms" className="rounded-sm text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Terms of Service
            </Link>
            <Link href="/contact" className="rounded-sm text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
