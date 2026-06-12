import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { resolveTenantId, fetchSlimBootstrap, isMarketplaceDomain, fetchMarketplaceProducts } from '../lib/tenant';

/**
 * ISR: Revalidate the sitemap every 300 seconds (5 min).
 * Search engines typically re-crawl sitemaps infrequently so a 5-minute
 * window is more than adequate, and on-demand revalidation handles
 * immediate product changes.
 */
export const revalidate = 300;

/**
 * Dynamic sitemap that lists the homepage, static pages, and every active
 * product URL for the current tenant subdomain — or all marketplace products
 * when served from the main domain.
 *
 * Next.js automatically serves this at /sitemap.xml.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
  const baseUrl = `${protocol}://${host}`;

  // Static pages every storefront has
  const staticEntries: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/all-products`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/categories`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  ];

  // ── Marketplace domain — include all products from all stores ──
  const isMarketplace = await isMarketplaceDomain();
  if (isMarketplace) {
    try {
      const mpData = await fetchMarketplaceProducts({ limit: 100 });
      const products: Array<{ slug?: string; tenantSlug?: string }> = mpData?.products || [];

      const productEntries: MetadataRoute.Sitemap = products
        .filter((p) => p.slug)
        .map((p) => ({
          url: `${baseUrl}/product-details/${encodeURIComponent(p.slug!)}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        }));

      // Store profile pages
      const storeSet = new Set<string>();
      for (const p of products) {
        if (p.tenantSlug) storeSet.add(p.tenantSlug);
      }
      const storeEntries: MetadataRoute.Sitemap = [...storeSet].map((slug) => ({
        url: `${baseUrl}/store/${encodeURIComponent(slug)}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      }));

      return [...staticEntries, ...storeEntries, ...productEntries];
    } catch (error) {
      console.error('[Sitemap] Marketplace products error:', error);
      return staticEntries;
    }
  }

  // ── Tenant subdomain — per-tenant products ──
  const tenantId = await resolveTenantId();
  if (!tenantId) {
    return staticEntries;
  }

  try {
    const bootstrapData = await fetchSlimBootstrap();
    const products: Array<{ slug?: string; id?: number; status?: string; updatedAt?: string }> =
      bootstrapData?.products || [];

    const productEntries: MetadataRoute.Sitemap = products
      .filter((p) => p.slug && (!p.status || p.status === 'Active'))
      .map((p) => ({
        url: `${baseUrl}/product-details/${encodeURIComponent(p.slug!)}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));

    return [...staticEntries, ...productEntries];
  } catch (error) {
    console.error('[Sitemap] Error fetching products:', error);
    return staticEntries;
  }
}
