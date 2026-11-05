import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';
import Link from 'next/link';

export const metadata: Metadata = pageMetadata(
  'Privacy Policy - Converter Tool',
  'Read the Privacy Policy for using Converter Tool.',
  '/privacy'
);

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline">Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-muted-foreground">
          <p>Last updated: November 5, 2026</p>

          <div>
              <h2 className="text-2xl font-semibold mt-6 mb-2 text-foreground">1. Information We Collect</h2>
              <p>You do not need an account or need to give us personal data to use our tools. Like most websites, our hosting provider may process technical request data, such as your IP address and browser type, to deliver the site. If you email us, we receive your email address and whatever you include in your message.</p>
          </div>

          <div>
              <h2 className="text-2xl font-semibold mt-6 mb-2 text-foreground">2. File Handling</h2>
              <p>Our tools process your files directly in your browser. Your files are not uploaded to our servers, and we never receive or store them. This includes photos you use in the Passport Photo Maker: cropping, background removal, brightness and contrast changes, and the print sheets are all created on your device.</p>
              <p className="mt-2">Background removal uses a small machine-learning model that runs in your browser. The model file is downloaded to your device, not your photo to us. It is normally served from this site. If that copy is unavailable, your browser downloads it from Google&apos;s servers instead, which means Google can see your IP address and browser details for that download, but never your photo.</p>
          </div>

          <div>
              <h2 className="text-2xl font-semibold mt-6 mb-2 text-foreground">3. Cookies and Analytics</h2>
              <p>We use Google Tag Manager to load analytics tools that help us understand how the site is used. Through these tools, Google may receive information about your device and visit, including your IP address, and cookies may be set in your browser. Your light or dark theme choice is stored in your browser and is not sent to us.</p>
          </div>

          <div>
              <h2 className="text-2xl font-semibold mt-6 mb-2 text-foreground">4. Third-Party Services</h2>
              <p>We use a hosting provider to run this site and Google for the analytics described above and, only if needed, for downloading the background-removal model. These services handle data under their own privacy policies. Your files are never shared with them because they stay in your browser.</p>
          </div>

          <div>
              <h2 className="text-2xl font-semibold mt-6 mb-2 text-foreground">5. Changes to This Policy</h2>
              <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.</p>
          </div>

          <div>
              <h2 className="text-2xl font-semibold mt-6 mb-2 text-foreground">6. Contact Us</h2>
              <p>If you have any questions about this Privacy Policy, you can contact us via our <Link href="/contact" className="text-primary hover:underline">contact page</Link>.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
