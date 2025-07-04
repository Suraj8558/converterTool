'use client';

import * as React from 'react';
import Link from 'next/link';
import { Menu, Sheet as SheetIcon } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toolCategories } from '@/lib/tools';

export default function Header() {
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        {/* Desktop Menu */}
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <SheetIcon className="h-6 w-6 text-primary" />
            <span className="font-bold sm:inline-block font-headline">
              ConvertIQ
            </span>
          </Link>
          <NavigationMenu>
            <NavigationMenuList>
              {toolCategories.map((category) => (
                <NavigationMenuItem key={category.name}>
                  <NavigationMenuTrigger>{category.name}</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      {category.tools.map((tool) => (
                        <ListItem
                          key={tool.name}
                          title={tool.name}
                          href={tool.href}
                        >
                          {tool.description}
                        </ListItem>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Mobile Menu */}
        <div className="flex-1 items-center md:hidden flex">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full max-w-sm">
              <Link href="/" className="flex items-center space-x-2 p-4 border-b" onClick={() => setOpen(false)}>
                <SheetIcon className="h-6 w-6 text-primary" />
                <span className="font-bold font-headline">ConvertIQ</span>
              </Link>
              <div className="flex flex-col space-y-2 p-4">
                {toolCategories.map((category) => (
                  <div key={category.name} className="pt-2">
                    <h4 className="font-semibold mb-2">{category.name}</h4>
                    <div className="flex flex-col space-y-1">
                    {category.tools.map((tool) => (
                      <Link
                        key={tool.name}
                        href={tool.href}
                        className="text-muted-foreground hover:text-foreground p-2 rounded-md -ml-2"
                        onClick={() => setOpen(false)}
                      >
                        {tool.name}
                      </Link>
                    ))}
                    </div>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex-1 flex justify-center">
            <Link href="/" className="flex items-center space-x-2">
                <SheetIcon className="h-6 w-6 text-primary" />
                <span className="font-bold font-headline">ConvertIQ</span>
            </Link>
          </div>
        </div>
        
        <div className="flex items-center justify-end space-x-2 md:flex-1">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<'a'>,
  React.ComponentPropsWithoutRef<'a'>
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = 'ListItem';
