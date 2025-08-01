'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Search, ArrowRight, ShieldCheck, Star, BadgePercent, Frown } from 'lucide-react';
import { toolCategories } from '@/lib/tools';

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

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <section className="text-center">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4 font-headline bg-gradient-to-r from-primary to-tertiary text-transparent bg-clip-text">
          Your Digital Toolkit, Perfected.
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto mb-8">
          The ultimate suite of tools for file conversion, PDF management, and image optimization. Fast, free, and designed for you.
        </p>
        <div className="max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for a tool (e.g., 'PNG to JPG')"
              className="w-full pl-12 h-12 text-lg rounded-full shadow-lg focus:shadow-primary/20 transition-shadow"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="mt-16 md:mt-24 space-y-20">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((category) => (
            <div key={category.name}>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-muted rounded-full">{category.icon}</div>
                <div>
                  <h2 className="text-4xl font-bold font-headline">{category.name}</h2>
                  <p className="text-muted-foreground mt-1 max-w-2xl">{category.description}</p>
                </div>
              </div>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {category.tools.map((tool) => (
                  <Link href={tool.href} key={tool.name} className="block group">
                     <Card className="h-full rounded-xl flex flex-col bg-card border transition-all duration-300 hover:border-primary hover:shadow-lg hover:-translate-y-1">
                      <CardHeader className="flex-row items-center gap-4 space-y-0">
                         <div className="p-3 bg-muted rounded-lg text-primary">
                          {tool.icon}
                        </div>
                        <CardTitle className="text-lg font-headline">{tool.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow pt-0">
                        <p className="text-sm text-muted-foreground">{tool.description}</p>
                      </CardContent>
                      <CardFooter className="pt-4 justify-end">
                        <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </CardFooter>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16">
            <Frown className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-2xl font-semibold">No Tools Found</h3>
            <p className="mt-1 text-muted-foreground">Your search for "{searchTerm}" did not match any tools.</p>
          </div>
        )}
      </section>

      <section className="mt-16 md:mt-24 text-center bg-card py-16 rounded-2xl shadow-sm border">
        <h2 className="text-3xl font-bold mb-4 font-headline">Why Choose ConvertIQ?</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-12">We provide reliable, fast, and secure tools to make your digital life easier.</p>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-4 flex flex-col items-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary mb-4">
                    <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2 font-headline">Secure & Private</h3>
                <p className="text-muted-foreground">Your privacy is paramount. Files are processed in your browser or deleted from servers within hours.</p>
            </div>
            <div className="text-center p-4 flex flex-col items-center">
                 <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary mb-4">
                    <Star className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2 font-headline">High-Quality Results</h3>
                <p className="text-muted-foreground">Our tools are designed to preserve the quality of your files, ensuring you get the best output every time.</p>
            </div>
            <div className="text-center p-4 flex flex-col items-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary mb-4">
                    <BadgePercent className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2 font-headline">Completely Free</h3>
                <p className="text-muted-foreground">All our tools are free to use. No hidden fees, no subscriptions, just powerful tools at your fingertips.</p>
            </div>
        </div>
      </section>
    </div>
  );
}
