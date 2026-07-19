import { SITE_URL } from '@/lib/site';

// Only publicly accessible, indexable pages belong here — dashboard routes
// live behind authentication and are intentionally excluded.
export default function sitemap() {
  const lastModified = new Date();
  return [
    {
      url: `${SITE_URL}/`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/login`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];
}
