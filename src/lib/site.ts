import type { Metadata } from 'next';

// Absolute URLs in the sitemap and sharing tags come from NEXT_PUBLIC_SITE_URL, which
// must be set for production builds, such as https://example.com.
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:9002').replace(/\/$/, '');
export const siteName = 'Converter Tool';

const shareImage = '/og.png';

// A page's sharing tags replace the root layout's instead of merging with them, so
// every page needs the complete set.
export function pageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName, type: 'website', images: [shareImage] },
    twitter: { card: 'summary_large_image', images: [shareImage] },
  };
}
