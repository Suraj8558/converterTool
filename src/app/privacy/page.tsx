import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy - devSuraj',
  description: 'Read the Privacy Policy for using devSuraj tools.',
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline">Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-muted-foreground">
          <p>Last updated: July 29, 2024</p>
          
          <div>
              <h2 className="text-2xl font-semibold mt-6 mb-2 text-foreground">1. Information We Collect</h2>
              <p>We do not collect any personal information from our users. We do not require you to create an account or provide any personal data to use our services.</p>
          </div>
          
          <div>
              <h2 className="text-2xl font-semibold mt-6 mb-2 text-foreground">2. File Handling</h2>
              <p>When you upload a file for conversion, it is temporarily stored on our servers to perform the conversion. We are committed to the security and privacy of your files.</p>
              <ul className="list-disc list-inside space-y-1 mt-2 pl-4">
                  <li>Files are automatically and permanently deleted from our servers a few hours after the conversion is complete.</li>
                  <li>We do not access, copy, or analyze your files in any way. The process is fully automated.</li>
                  <li>All connections to our servers are encrypted using SSL.</li>
              </ul>
          </div>

          <div>
              <h2 className="text-2xl font-semibold mt-6 mb-2 text-foreground">3. Cookies and Analytics</h2>
              <p>We use minimal, privacy-focused analytics to understand how our website is used and to improve our services. This data is aggregated and anonymous. We do not use tracking cookies for advertising purposes.</p>
          </div>
          
          <div>
              <h2 className="text-2xl font-semibold mt-6 mb-2 text-foreground">4. Third-Party Services</h2>
              <p>We do not share your files or any data with third-party services, except as required for the technical operation of the site (e.g., our hosting provider).</p>
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
