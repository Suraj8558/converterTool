import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service - ConvertIQ',
  description: 'Read the Terms of Service for using ConvertIQ tools.',
};

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline">Terms of Service</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-muted-foreground">
          <p>Last updated: July 29, 2024</p>
          
          <div>
              <h2 className="text-2xl font-semibold mt-6 mb-2 text-foreground">1. Introduction</h2>
              <p>Welcome to ConvertIQ! These Terms of Service ("Terms") govern your use of our website and services. By accessing or using our services, you agree to be bound by these Terms.</p>
          </div>
          
          <div>
              <h2 className="text-2xl font-semibold mt-6 mb-2 text-foreground">2. Use of Services</h2>
              <p>You may use our services only for lawful purposes. You agree not to use the services:</p>
              <ul className="list-disc list-inside space-y-1 mt-2 pl-4">
                  <li>In any way that violates any applicable national or international law or regulation.</li>
                  <li>To upload or convert any file that infringes on any copyright, patent, trademark, or other proprietary rights of any party.</li>
                  <li>To transmit any unsolicited or unauthorized advertising or promotional materials.</li>
              </ul>
          </div>

          <div>
              <h2 className="text-2xl font-semibold mt-6 mb-2 text-foreground">3. File Handling and Privacy</h2>
              <p>We are committed to protecting your privacy. Files you upload for conversion are processed on our servers and are automatically deleted after a few hours. We do not access, view, or store your files for any purpose other than to provide the requested service.</p>
          </div>
          
          <div>
              <h2 className="text-2xl font-semibold mt-6 mb-2 text-foreground">4. Intellectual Property</h2>
              <p>The Service and its original content, features, and functionality are and will remain the exclusive property of ConvertIQ and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of ConvertIQ.</p>
          </div>

          <div>
              <h2 className="text-2xl font-semibold mt-6 mb-2 text-foreground">5. Disclaimer of Warranties</h2>
              <p>Our services are provided "AS IS" and "AS AVAILABLE" without any warranty or representations of any kind, whether express or implied. We do not warrant that the service will be uninterrupted, secure, or error-free.</p>
          </div>

          <div>
              <h2 className="text-2xl font-semibold mt-6 mb-2 text-foreground">6. Limitation of Liability</h2>
              <p>In no event shall ConvertIQ, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.</p>
          </div>
          
          <div>
              <h2 className="text-2xl font-semibold mt-6 mb-2 text-foreground">7. Changes to Terms</h2>
              <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any changes by posting the new Terms on this page.</p>
          </div>

          <div>
              <h2 className="text-2xl font-semibold mt-6 mb-2 text-foreground">8. Contact Us</h2>
              <p>If you have any questions about these Terms, please contact us through our <Link href="/contact" className="text-primary hover:underline">contact page</Link>.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
