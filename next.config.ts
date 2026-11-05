import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    // Images here are local blob: previews, so the optimizer is never needed.
    unoptimized: true,
  },
  async redirects() {
    // Both names were the same tool: only .docx can be converted in the browser.
    return [{ source: '/doc-to-pdf', destination: '/word-to-pdf', permanent: true }];
  },
};

export default nextConfig;
