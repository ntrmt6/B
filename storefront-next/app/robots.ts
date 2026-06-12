import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';

/**
 * Dynamic robots.txt that points search engine crawlers to the sitemap
 * using the current tenant's subdomain host.
 *
 * Next.js automatically serves this at /robots.txt.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
  const baseUrl = `${protocol}://${host}`;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/checkout', '/profile', '/register', '/success-order'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
