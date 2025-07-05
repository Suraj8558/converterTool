'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { researchKeywords, type KeywordResearchOutput } from '@/ai/flows/keyword-research-flow';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search } from 'lucide-react';

const formSchema = z.object({
  topic: z.string().min(3, 'Please enter a topic with at least 3 characters.'),
});

type FormValues = z.infer<typeof formSchema>;

export function KeywordResearchTool() {
  const [results, setResults] = useState<KeywordResearchOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setResults(null);
    try {
      const result = await researchKeywords(values);
      setResults(result);
    } catch (error) {
      console.error('Failed to research keywords:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate keyword ideas. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyClass = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'low':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/50';
      case 'high':
        return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/50';
      case 'very high':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/50';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div className="space-y-8">
      <Card className="rounded-xl shadow-lg">
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-lg">Topic or Seed Keyword</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 'healthy breakfast ideas'" {...field} className="h-12 text-base" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full h-12 text-lg font-bold text-primary-foreground bg-gradient-to-r from-primary to-tertiary hover:saturate-150 transition-all duration-300">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Researching...
                  </>
                ) : (
                    <>
                    <Search className="mr-2 h-5 w-5" />
                    Find Keywords
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 text-primary animate-spin" />
            <p className="mt-2 text-muted-foreground">Gathering keyword ideas...</p>
        </div>
      )}

      {results && results.keywords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Keyword Ideas</CardTitle>
            <CardDescription>
                Showing {results.keywords.length} keyword ideas related to "{form.getValues('topic')}".
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-2/5">Keyword</TableHead>
                  <TableHead className="text-right">Est. Search Volume</TableHead>
                  <TableHead className="text-right">SEO Difficulty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.keywords.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.keyword}</TableCell>
                    <TableCell className="text-right">{item.volume}</TableCell>
                    <TableCell className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyClass(item.difficulty)}`}>
                            {item.difficulty}
                        </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
