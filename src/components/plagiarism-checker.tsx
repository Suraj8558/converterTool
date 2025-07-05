'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { checkPlagiarism, type PlagiarismOutput } from '@/ai/flows/plagiarism-checker-flow';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const formSchema = z.object({
  text: z.string().min(50, 'Please enter at least 50 characters to check.').max(5000, 'Text cannot exceed 5000 characters.'),
});

type FormValues = z.infer<typeof formSchema>;

export function PlagiarismChecker() {
  const [results, setResults] = useState<PlagiarismOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setResults(null);
    try {
      const result = await checkPlagiarism(values);
      setResults(result);
    } catch (error) {
      console.error('Failed to check plagiarism:', error);
      toast({
        title: 'Error',
        description: 'Failed to perform plagiarism check. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const uniquenessColor = results ? (results.uniquenessScore > 80 ? 'text-green-500' : results.uniquenessScore > 50 ? 'text-yellow-500' : 'text-red-500') : '';

  return (
    <div className="space-y-8">
      <Card className="rounded-xl shadow-lg">
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-lg">Text to Check</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste your text here to check for plagiarism..."
                        className="min-h-[250px]"
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
                    Checking...
                  </>
                ) : (
                    <>
                    <Search className="mr-2 h-5 w-5" />
                    Check for Plagiarism
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
            <p className="mt-2 text-muted-foreground">Scanning the web for matches...</p>
        </div>
      )}

      {results && (
        <Card>
            <CardContent className="p-6 space-y-6">
                <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold font-headline">Results</h3>
                    <p className={`text-6xl font-bold ${uniquenessColor}`}>{results.uniquenessScore}%</p>
                    <p className="text-muted-foreground">Uniqueness Score</p>
                    <Progress value={results.uniquenessScore} className="mx-auto max-w-sm" />
                </div>
                
                {results.matches.length > 0 ? (
                    <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2 text-lg"><ShieldAlert className="h-5 w-5 text-red-500" /> Potential Matches Found</h4>
                        {results.matches.map((match, index) => (
                            <div key={index} className="p-4 border rounded-lg bg-muted/50">
                                <p className="italic">"...{match.text}..."</p>
                                <div className="text-sm mt-2 flex justify-between items-center">
                                    <a href={match.source} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                                        Source: {match.source}
                                    </a>
                                    <span className="font-semibold text-red-500 ml-4 flex-shrink-0">{match.similarity}% Similar</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-6 text-center border-dashed border rounded-lg bg-muted/50">
                        <ShieldCheck className="mx-auto h-12 w-12 text-green-500 mb-2" />
                        <h4 className="font-semibold text-lg">No Matches Found</h4>
                        <p className="text-muted-foreground">Your text appears to be unique.</p>
                    </div>
                )}
            </CardContent>
        </Card>
      )}
    </div>
  );
}
