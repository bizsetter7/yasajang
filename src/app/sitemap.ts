import { SEO_REGIONS } from '@/lib/regions';
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://yasajang.kr';
  const regionPages = SEO_REGIONS.map(r => ({
    url: `${base}/seo/${r.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));
  return [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/plans`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    ...regionPages,
  ];
}
