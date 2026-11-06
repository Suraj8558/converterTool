'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolCard } from '@/components/tool-card';
import { Search, X, ShieldCheck, Star, BadgePercent, Frown, Zap, FileUp, MousePointerClick, Download } from 'lucide-react';
import { toolCategories } from '@/lib/tools';

const trustPoints = [
  { icon: ShieldCheck, label: 'Files never leave your device' },
  { icon: Zap, label: 'Instant, no sign-up' },
  { icon: BadgePercent, label: '100% free' },
];

const steps = [
  { icon: MousePointerClick, title: 'Pick a tool', text: 'Search or browse by category.' },
  { icon: FileUp, title: 'Add your file', text: 'Drag it in or choose it from your device.' },
  { icon: Download, title: 'Download', text: 'Your result is ready in seconds.' },
];

const benefits = [
  { icon: ShieldCheck, title: 'Secure & Private', text: 'Your files are processed in your browser and are never uploaded to our servers.' },
  { icon: Star, title: 'High-Quality Results', text: 'Our tools are designed to preserve the quality of your files, ensuring you get the best output every time.' },
  { icon: BadgePercent, title: 'Completely Free', text: 'All our tools are free to use. No hidden fees, no subscriptions, just powerful tools at your fingertips.' },
];

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) {
      return toolCategories;
    }

    const lowercasedTerm = searchTerm.toLowerCase();

    return toolCategories
      .map(category => ({
        ...category,
        tools: category.tools.filter(
          tool =>
            tool.name.toLowerCase().includes(lowercasedTerm) ||
            tool.description.toLowerCase().includes(lowercasedTerm)
        ),
      }))
      .filter(category => category.tools.length > 0);
  }, [searchTerm]);

  const toolCount = toolCategories.reduce((total, category) => total + category.tools.length, 0);
  const matchCount = filteredCategories.reduce((total, category) => total + category.tools.length, 0);

  return (
    <>
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-dots [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" aria-hidden="true" />
        <div className="absolute -top-24 left-1/2 h-72 w-[40rem] max-w-full -translate-x-1/2 rounded-full bg-gradient-to-r from-primary/20 to-tertiary/20 blur-3xl" aria-hidden="true" />
        <div className="container relative py-12 text-center sm:py-16 md:py-24">
          <p className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur sm:text-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
            {toolCount} free tools · Runs in your browser
          </p>
          <h1 className="mx-auto max-w-4xl pb-2 font-headline text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Your Digital Toolkit, <span className="text-gradient">Perfected.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg md:text-xl">
            The ultimate suite of tools for file conversion, PDF management, and image optimization. Fast, free, and designed for you.
          </p>

          <div className="mx-auto mt-8 max-w-xl">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                type="search"
                aria-label="Search tools"
                placeholder="Search tools, e.g. PNG to JPG"
                className="h-12 w-full rounded-full border-2 bg-background pl-12 pr-12 text-base shadow-soft transition-shadow focus-visible:border-primary focus-visible:shadow-lift sm:h-14 sm:text-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full"
                  aria-label="Clear search"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <nav aria-label="Tool categories" className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {toolCategories.map((category) => (
                <Button key={category.id} asChild variant="outline" size="sm" className="rounded-full">
                  <a href={`#${category.id}`}>{category.name}</a>
                </Button>
              ))}
            </nav>
          </div>

          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground sm:gap-x-8 sm:text-sm">
            {trustPoints.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="container py-12 md:py-16">
        <section aria-label="Tools" className="space-y-14 md:space-y-20">
          {searchTerm.trim() && matchCount > 0 && (
            <p className="text-sm text-muted-foreground" role="status">
              Showing {matchCount} {matchCount === 1 ? 'tool' : 'tools'} for &quot;{searchTerm.trim()}&quot;
            </p>
          )}
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category) => (
              <div key={category.name} id={category.id} className="scroll-mt-24">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 rounded-2xl bg-primary/10 p-3 [&_svg]:h-7 [&_svg]:w-7">{category.icon}</div>
                  <div>
                    <h2 className="font-headline text-2xl font-bold sm:text-3xl">{category.name}</h2>
                    <p className="mt-1 max-w-2xl text-muted-foreground">{category.description}</p>
                  </div>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                  {category.tools.map((tool) => (
                    <ToolCard
                      key={tool.name}
                      name={tool.name}
                      href={tool.href}
                      description={tool.description}
                      visual={tool.visual}
                      tone={category.tone}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center">
              <Frown className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden="true" />
              <h3 className="mt-4 text-2xl font-semibold">No Tools Found</h3>
              <p className="mt-1 text-muted-foreground">Your search for &quot;{searchTerm}&quot; did not match any tools.</p>
              <Button variant="outline" className="mt-6" onClick={() => setSearchTerm('')}>
                Show all tools
              </Button>
            </div>
          )}
        </section>

        <section className="mt-16 md:mt-24" aria-labelledby="how-it-works">
          <h2 id="how-it-works" className="text-center font-headline text-2xl font-bold sm:text-3xl">How it works</h2>
          <ol className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-3">
            {steps.map(({ icon: Icon, title, text }, index) => (
              <li key={title} className="flex items-start gap-4 rounded-2xl border bg-card p-5 shadow-soft sm:flex-col sm:items-center sm:text-center">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold">
                  {index + 1}
                </span>
                <div>
                  <h3 className="flex items-center gap-2 font-headline font-semibold sm:justify-center">
                    <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                    {title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-16 rounded-3xl border bg-gradient-to-br from-primary/5 via-card to-tertiary/5 px-5 py-12 text-center shadow-soft sm:px-8 md:mt-24 md:py-16">
          <h2 className="font-headline text-2xl font-bold sm:text-3xl">Why Choose Converter Tool?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">We provide reliable, fast, and secure tools to make your digital life easier.</p>
          <div className="mx-auto mt-10 grid max-w-5xl gap-8 md:grid-cols-3">
            {benefits.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex flex-col items-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mb-2 font-headline text-lg font-semibold sm:text-xl">{title}</h3>
                <p className="text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
          <Button asChild size="lg" className="mt-10 rounded-full bg-brand-gradient px-8 shadow-lg hover:saturate-150">
            <a href="#images">Browse all tools</a>
          </Button>
        </section>
      </div>
    </>
  );
}
