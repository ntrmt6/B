'use client';

import { useEffect, useState } from 'react';

/**
 * CanonicalHead - Dynamic canonical URL injection for tenant pages
 *
 * Prevents duplicate content penalties by injecting a strict canonical URL
 * tag based on the current tenant subdomain and path.
 *
 * Format: https://[tenant-slug].allinbangla.com/[current-path]
 *
 * @usage Include this component in your tenant layout's <head> or use Next.js metadata
 */
export default function CanonicalHead() {
  const [canonicalUrl, setCanonicalUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const { protocol, host, pathname } = window.location;
      // Normalize: remove trailing slash except for root
      const normalizedPath = pathname === '/' ? '' : pathname.replace(/\/$/, '');
      const url = `${protocol}//${host}${normalizedPath}`;
      setCanonicalUrl(url);

      // Check if canonical already exists, update or create
      let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (link) {
        link.href = url;
      } else {
        link = document.createElement('link');
        link.rel = 'canonical';
        link.href = url;
        document.head.appendChild(link);
      }
    }
  }, []);

  // SSR: Return null, client will hydrate
  return null;
}

/**
 * Server-side utility to generate canonical URL for Next.js metadata
 * Use this in generateMetadata() for proper SSR canonical tags
 *
 * @example
 * // In page.tsx or layout.tsx
 * export async function generateMetadata({ params }) {
 *   return {
 *     alternates: {
 *       canonical: generateCanonicalUrl(headers(), '/products/my-product')
 *     }
 *   }
 * }
 */
export function generateCanonicalUrl(
  headersList: Headers,
  pathname: string = ''
): string {
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') ||
    (host.startsWith('localhost') ? 'http' : 'https');

  // Normalize path
  const normalizedPath = pathname === '/' ? '' : pathname.replace(/\/$/, '');

  return `${protocol}://${host}${normalizedPath}`;
}
