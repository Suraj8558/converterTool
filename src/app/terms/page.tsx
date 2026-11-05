import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';
import Link from 'next/link';

export const metadata: Metadata = pageMetadata(
  'Terms of Service - Converter Tool',
  'Read the Terms of Service for using Converter Tool.',
  '/terms'
);

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline">Terms of Service</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-muted-foreground">
          <p>Last updated: November 5, 2026</p>
          
          <p>Please read these Terms of Service (&quot;Terms&quot;, &quot;Terms of Service&quot;) carefully before using the Converter Tool website (the &quot;Service&quot;) operated by us.</p>
          
          <p>Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms. These Terms apply to all visitors, users, and others who access or use the Service. By accessing or using the Service you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.</p>

          <div>
              <h2 className="text-2xl font-semibold mt-6 mb-2 text-foreground">1. Use of Services</h2>
              <p>You agree to use our services for lawful purposes only. You are prohibited from using the Service:</p>
              <ul className="list-disc list-inside space-y-1 mt-2 pl-4">
                  <li>To upload, convert, or generate any content that is illegal, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or otherwise objectionable.</li>
                  <li>To infringe on any patent, trademark, trade secret, copyright, or other proprietary rights of any party. You must have the legal right to use any file you upload.</li>
                  <li>To transmit any material that contains software viruses or any other computer code, files, or programs designed to interrupt, destroy, or limit the functionality of any computer software or hardware.</li>
              </ul>
          </div>

          <div>
              <h2 className="text-2xl font-semibold mt-6 mb-2 text-foreground">2. File Handling and Privacy</h2>
              <p>We prioritize your privacy. As detailed in our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>, files are processed in your browser and are not uploaded to our servers.</p>
          </div>

          <div>
              <h2 className="text-2xl font-semibold mt-6 mb-2 text-foreground">3. Intellectual Property</h2>
              <p>The Service and its original content (excluding content provided by users), features, and functionality are and will remain the exclusive property of Converter Tool and its licensors. Our trademarks may not be used in connection with any product or service without our prior written consent.</p>
          </div>

          <div>
              <h2 className="text-2xl font-semibold mt-6 mb-2 text-foreground">4. Disclaimer of Warranties</h2>
              <p>The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. Converter Tool makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights. We do not warrant that the service will be uninterrupted, secure, or error-free.</p>
          </div>

          <div>
              <h2 className="text-2xl font-semibold mt-6 mb-2 text-foreground">5. Limitation of Liability</h2>
              <p>In no event shall Converter Tool or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our website, even if we have been notified orally or in writing of the possibility of such damage.</p>
          </div>
          
          <div>
              <h2 className="text-2xl font-semibold mt-6 mb-2 text-foreground">6. Changes to Terms</h2>
              <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion. We will provide notice of any changes by posting the new Terms on this page.</p>
          </div>

          <div>
              <h2 className="text-2xl font-semibold mt-6 mb-2 text-foreground">7. Contact Us</h2>
              <p>If you have any questions about these Terms, please contact us through our <Link href="/contact" className="text-primary hover:underline">contact page</Link>.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
