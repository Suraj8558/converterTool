import Link from 'next/link';
import { toolCategories } from '@/lib/tools';
import { Sheet } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-background/80 border-t mt-16">
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center space-x-2">
              <Sheet className="h-6 w-6 text-primary" />
              <span className="font-bold font-headline">ConvertIQ</span>
            </Link>
            <p className="text-sm text-muted-foreground mt-2">
              All-in-one file conversion and SEO tools.
            </p>
          </div>
          {toolCategories.map((category) => (
            <div key={category.name}>
              <h4 className="font-semibold text-foreground">{category.name}</h4>
              <ul className="mt-4 space-y-2">
                {category.tools.map((tool) => (
                  <li key={tool.name}>
                    <Link href={tool.href} className="text-sm text-muted-foreground hover:text-foreground">
                      {tool.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t pt-8 flex flex-col items-center justify-between md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} ConvertIQ. All rights reserved.
          </p>
          <div className="flex mt-4 md:mt-0 space-x-6">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
              Terms of Service
            </Link>
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
