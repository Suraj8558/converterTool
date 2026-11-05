'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Send } from 'lucide-react';


const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  message: z.string().min(10, 'Message must be at least 10 characters.'),
});

type FormValues = z.infer<typeof formSchema>;

// There is no backend, so messages are sent from the visitor's own email app.
const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

export function ContactForm() {
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      message: '',
    },
  });

  const onSubmit = (values: FormValues) => {
    if (!contactEmail) return;
    const subject = encodeURIComponent(`Message from ${values.name}`);
    const body = encodeURIComponent(values.message);
    // Show this first: some browsers stop running the page's code once the handoff starts.
    toast({
      title: 'Opening your email app',
      description: 'Your message is not sent until you press send there.',
    });
    window.location.assign(`mailto:${contactEmail}?subject=${subject}&body=${body}`);
  };

  return (
    <div className="container mx-auto max-w-2xl py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline">Contact Us</CardTitle>
          <CardDescription>
            {contactEmail
              ? 'Have a question or feedback? Fill out the form below to start an email to us.'
              : 'Our contact form is temporarily unavailable. Please check back soon.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Your message..."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={!contactEmail} className="w-full h-12 text-lg text-primary-foreground bg-gradient-to-r from-primary to-tertiary hover:saturate-150 transition-all duration-300">
                <Send className="mr-2 h-5 w-5" />
                Continue in Email App
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
