'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateMetaTags, type AiMetaTagOutput } from '@/ai/flows/ai-meta-tag-generator';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Copy, Check } from 'lucide-react';

const formSchema = z.object({
  keywords: z.string().min(3, 'Please enter at least one keyword.'),
  websiteContent: z.string().min(50, 'Please provide at least 50 characters of website content.'),
});

type FormValues = z.infer<typeof formSchema>;

export function MetaTagGenerator() {
  const [generatedTags, setGeneratedTags] = useState<AiMetaTagOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const [copied, setCopied] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      keywords: '',
      websiteContent: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setGeneratedTags(null);
    try {
      const result = await generateMetaTags(values);
      setGeneratedTags(result);
    } catch (error) {
      console.error('Failed to generate meta tags:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate meta tags. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-8">
      <Card className="rounded-xl shadow-lg">
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="keywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Keywords</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., image converter, seo tools, free pdf editor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="websiteContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Website Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste a snippet or describe your website content here..."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full h-12 text-lg font-bold text-primary-foreground bg-gradient-to-r from-primary to-tertiary hover:saturate-150 transition-all duration-300">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Meta Tags'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {generatedTags && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center font-headline">Generated Meta Tags</h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center text-lg font-headline">
                    <span>Meta Title</span>
                    <Button variant="ghost" size="icon" onClick={() => handleCopy(generatedTags.title, 'title')}>
                        {copied === 'title' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground bg-muted p-4 rounded-md">{generatedTags.title}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                 <CardTitle className="flex justify-between items-center text-lg font-headline">
                    <span>Meta Description</span>
                    <Button variant="ghost" size="icon" onClick={() => handleCopy(generatedTags.description, 'description')}>
                        {copied === 'description' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground bg-muted p-4 rounded-md">{generatedTags.description}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                 <CardTitle className="flex justify-between items-center text-lg font-headline">
                    <span>Meta Keywords</span>
                    <Button variant="ghost" size="icon" onClick={() => handleCopy(generatedTags.keywords, 'keywords')}>
                        {copied === 'keywords' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground bg-muted p-4 rounded-md">{generatedTags.keywords}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
