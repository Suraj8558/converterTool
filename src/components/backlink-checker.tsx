'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { checkBacklinks, type BacklinkOutput } from '@/ai/flows/backlink-checker-flow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Link as LinkIcon } from 'lucide-react';

const formSchema = z.object({
  domain: z.string().min(3, 'Please enter a valid domain.').refine((val) => /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val), {
    message: 'Please enter a valid domain name (e.g., example.com)',
  }),
});

type FormValues = z.infer<typeof formSchema>;

export function BacklinkChecker() {
  const [results, setResults] = useState<BacklinkOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      domain: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setResults(null);
    try {
      const result = await checkBacklinks(values);
      setResults(result);
    } catch (error) {
      console.error('Failed to check backlinks:', error);
      toast({
        title: 'Error',
        description: 'Failed to analyze backlinks. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
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
                name="domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-lg">Domain Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., example.com" {...field} className="h-12 text-base" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full h-12 text-lg font-bold text-primary-foreground bg-gradient-to-r from-primary to-tertiary hover:saturate-150 transition-all duration-300">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                    <>
                    <LinkIcon className="mr-2 h-5 w-5" />
                    Check Backlinks
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
            <p className="mt-2 text-muted-foreground">Analyzing backlink profile...</p>
        </div>
      )}

      {results && (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <Card>
                    <CardHeader><CardTitle>Domain Authority</CardTitle></CardHeader>
                    <CardContent><p className="text-3xl font-bold text-primary">{results.domainAuthority}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Total Backlinks</CardTitle></CardHeader>
                    <CardContent><p className="text-3xl font-bold text-primary">{results.totalBacklinks.toLocaleString()}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Referring Domains</CardTitle></CardHeader>
                    <CardContent><p className="text-3xl font-bold text-primary">{results.referringDomains.toLocaleString()}</p></CardContent>
                </Card>
            </div>
            <Card>
            <CardHeader>
                <CardTitle>Top Backlinks</CardTitle>
                <CardDescription>
                    A sample of the top backlinks found for "{form.getValues('domain')}".
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Source URL</TableHead>
                    <TableHead>Anchor Text</TableHead>
                    <TableHead className="text-right">DA</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {results.backlinks.map((link, index) => (
                    <TableRow key={index}>
                        <TableCell className="font-medium max-w-xs truncate">
                            <a href={link.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">{link.sourceUrl}</a>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{link.anchorText}</TableCell>
                        <TableCell className="text-right font-semibold">{link.domainAuthority}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}
