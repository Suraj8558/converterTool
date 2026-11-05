import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';
import { toolCategories } from '@/lib/tools';

export default function sitemap(): MetadataRoute.Sitemap {
  const toolPaths = toolCategories.flatMap((category) => category.tools.map((tool) => tool.href));
  return ['', ...toolPaths, '/contact', '/privacy', '/terms'].map((path) => ({
    url: `${siteUrl}${path}`,
  }));
}
