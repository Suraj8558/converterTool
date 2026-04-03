'use client';

import { Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

interface ComingSoonProps {
  title: string;
  description: string;
  reason?: string;
}

export function ComingSoon({ title, description, reason }: ComingSoonProps) {
  return (
    <div className="container mx-auto max-w-2xl py-16 px-4">
      <Card className="rounded-xl shadow-lg border-dashed">
        <CardContent className="p-10 text-center space-y-6">
          <div className="flex items-center justify-center h-20 w-20 rounded-full bg-primary/10 mx-auto">
            <Clock className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-headline mb-2">{title}</h1>
            <p className="text-muted-foreground text-lg">{description}</p>
          </div>
          {reason && (
            <div className="bg-muted rounded-lg p-4 text-sm text-muted-foreground text-left">
              <span className="font-semibold text-foreground">Why is this disabled?</span>
              <p className="mt-1">{reason}</p>
            </div>
          )}
          <div className="pt-2">
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Tools
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
