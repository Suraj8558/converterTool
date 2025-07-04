import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Search, ArrowRight } from 'lucide-react';
import { toolCategories } from '@/lib/tools';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <section className="text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 font-headline">
          All-in-One Converter & SEO Tools
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
          Your complete suite of tools to convert files, manage PDFs, and boost your website's SEO.
        </p>
        <div className="max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for a tool (e.g., 'PNG to JPG')"
              className="w-full pl-12 h-12 text-lg rounded-full shadow-sm"
            />
          </div>
        </div>
      </section>

      <section className="mt-16 md:mt-24">
        <div className="grid gap-8 md:grid-cols-2">
          {toolCategories.map((category) => (
            <Card key={category.name} className="flex flex-col hover:shadow-xl transition-shadow duration-300 rounded-xl">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                {category.icon}
                <CardTitle className="font-headline text-2xl">{category.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col pt-2">
                <CardDescription className="mb-4">{category.description}</CardDescription>
                <ul className="space-y-3 mt-auto">
                  {category.tools.map((tool) => (
                    <li key={tool.name}>
                      <Link
                        href={tool.href}
                        className="flex items-center justify-between text-muted-foreground hover:text-foreground transition-colors group"
                      >
                        <span>{tool.name}</span>
                        <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-16 md:mt-24 text-center bg-card py-16 rounded-xl shadow-sm">
        <h2 className="text-3xl font-bold mb-4 font-headline">Why Choose ConvertIQ?</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-12">We provide reliable, fast, and secure tools to make your digital life easier.</p>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-4">
                <h3 className="text-xl font-semibold mb-2 font-headline">Secure & Private</h3>
                <p className="text-muted-foreground">Your files are your own. We automatically delete them from our servers after a few hours.</p>
            </div>
            <div className="text-center p-4">
                <h3 className="text-xl font-semibold mb-2 font-headline">High Quality Conversions</h3>
                <p className="text-muted-foreground">Our tools preserve the quality of your files, so you get the best results every time.</p>
            </div>
            <div className="text-center p-4">
                <h3 className="text-xl font-semibold mb-2 font-headline">Completely Free</h3>
                <p className="text-muted-foreground">All our tools are free to use, with no hidden costs or subscriptions required.</p>
            </div>
        </div>
      </section>
    </div>
  );
}
