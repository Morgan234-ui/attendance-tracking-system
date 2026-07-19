import { SITE_URL } from '@/lib/site';

// Only public pages are crawlable; everything behind auth and all API
// routes are disallowed.
export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login'],
      disallow: ['/admin', '/lecturer', '/student', '/api'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
