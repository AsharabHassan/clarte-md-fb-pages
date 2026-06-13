// app/sitemap.ts
import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo/site';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/quiz`, changeFrequency: 'weekly', priority: 0.8 },
  ];
}
