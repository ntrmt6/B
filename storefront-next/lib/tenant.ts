/**
 * Shared server-side tenant resolution helpers.
 *
 * React `cache()` deduplicates calls within a single server request so that
 * `generateMetadata()` and the page component never resolve the same subdomain
 * or fetch the same config twice.
 *
 * ISR strategy:
 * - Tenant resolution is cached for 1 hour (tenants rarely change).
 * - Website config is cached for 5 minutes (theme/SEO changes are infrequent).
 * - Bootstrap data is cached for 60 seconds (products change more often).
 * - On-demand revalidation via /api/revalidate purges caches immediately when
 *   the backend notifies that data changed.
 * - Cache tags (e.g. "tenant-<id>-config") allow targeted invalidation.
 */
import { cache } from 'react';
import { headers } from 'next/headers';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001';

/** Extract the tenant subdomain from the incoming request host header. */
export const getSubdomain = cache(async (): Promise<string> => {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const hostname = host.split(':')[0];
  const parts = hostname.split('.');

  let subdomain = '';
  if (hostname.endsWith('.localhost') && parts.length > 1) {
    subdomain = parts[0];
  } else if (parts.length > 2) {
    subdomain = parts[0];
  }

  if (!subdomain || ['www', 'admin', 'superadmin'].includes(subdomain)) {
    return '';
  }

  return subdomain;
});

/** Resolve a subdomain to a tenant ID. Cached per-request. */
export const resolveTenantId = cache(async (): Promise<string | null> => {
  const subdomain = await getSubdomain();
  if (!subdomain) return null;

  try {
    const tenantRes = await fetch(
      `${BACKEND_URL}/api/tenants/resolve/${encodeURIComponent(subdomain)}`,
      { next: { revalidate: 3600, tags: [`tenant-resolve-${subdomain}`] } },
    );
    if (!tenantRes.ok) return null;

    const tenantData = await tenantRes.json();
    return tenantData?.data?.id || tenantData?.data?._id || null;
  } catch {
    return null;
  }
});

/**
 * Fetch only website_config for the current tenant.
 * Uses the lightweight `/website-config` endpoint which is much faster
 * than the full bootstrap (no products / theme data transferred).
 * Cached per-request so generateMetadata() and page() share the result.
 *
 * ISR: revalidates every 300s (5 min) and via on-demand tag "config".
 */
export const fetchWebsiteConfig = cache(async () => {
  const tenantId = await resolveTenantId();
  if (!tenantId) return null;

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/tenant-data/${encodeURIComponent(tenantId)}/website-config`,
      { next: { revalidate: 300, tags: ['config', `tenant-${tenantId}-config`] } },
    );
    if (!res.ok) return null;

    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
});

/**
 * Fetch slim bootstrap data (products with stripped admin-only fields).
 * Used for product metadata lookups on product detail pages.
 * Cached per-request.
 *
 * ISR: revalidates every 60s and via on-demand tag "products".
 */
export const fetchSlimBootstrap = cache(async () => {
  const tenantId = await resolveTenantId();
  if (!tenantId) return null;

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/tenant-data/${encodeURIComponent(tenantId)}/bootstrap?slim=true`,
      { next: { revalidate: 60, tags: ['products', `tenant-${tenantId}-products`] } },
    );
    if (!res.ok) return null;

    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
});

/** Check if the current request is for the main/marketplace domain (no tenant subdomain). */
export const isMarketplaceDomain = cache(async (): Promise<boolean> => {
  const subdomain = await getSubdomain();
  return !subdomain;
});

/**
 * Fetch aggregated marketplace products from all active stores.
 * Used on the main domain (allinbangla.com) to show all vendor products.
 * ISR: revalidates every 60s, tagged "marketplace" for on-demand purge.
 */
export const fetchMarketplaceProducts = cache(async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  brand?: string;
  sort?: string;
}) => {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.search) qs.set('search', params.search);
  if (params?.category) qs.set('category', params.category);
  if (params?.brand) qs.set('brand', params.brand);
  if (params?.sort) qs.set('sort', params.sort);

  const qsStr = qs.toString();
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/marketplace/products${qsStr ? `?${qsStr}` : ''}`,
      { next: { revalidate: 60, tags: ['marketplace', 'marketplace-products'] } },
    );
    if (!res.ok) return null;

    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
});

/**
 * Fetch marketplace store list (all active tenants).
 * ISR: revalidates every 120s.
 */
export const fetchMarketplaceStores = cache(async () => {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/marketplace/stores`,
      { next: { revalidate: 120, tags: ['marketplace', 'marketplace-stores'] } },
    );
    if (!res.ok) return null;

    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
});

/**
 * Fetch aggregated marketplace categories.
 * ISR: revalidates every 120s.
 */
export const fetchMarketplaceCategories = cache(async () => {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/marketplace/categories`,
      { next: { revalidate: 120, tags: ['marketplace', 'marketplace-categories'] } },
    );
    if (!res.ok) return null;

    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
});
