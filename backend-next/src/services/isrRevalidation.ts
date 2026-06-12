/**
 * ISR Revalidation Service
 *
 * Notifies the storefront Next.js server to regenerate cached pages
 * when tenant data changes (products, theme, website config).
 *
 * This uses on-demand revalidation via the storefront's /api/revalidate
 * endpoint which is secured by a shared REVALIDATION_SECRET.
 *
 * The calls are fire-and-forget with a short timeout so they never
 * block admin API responses.
 */
import { env } from '../config/env';

const STOREFRONT_URL = env.storefrontUrl;
const REVALIDATION_SECRET = env.revalidationSecret;

interface RevalidateOptions {
  /** URL paths to revalidate (e.g. "/", "/product-details/my-slug") */
  paths?: string[];
  /** Cache tags to invalidate (e.g. "products", "config") */
  tags?: string[];
}

/**
 * Trigger on-demand ISR revalidation on the storefront.
 * This is fire-and-forget — errors are logged but never thrown.
 */
export async function triggerRevalidation(options: RevalidateOptions): Promise<void> {
  if (!STOREFRONT_URL || !REVALIDATION_SECRET) {
    // ISR revalidation is not configured — silently skip.
    // This is expected in development environments.
    return;
  }

  const url = `${STOREFRONT_URL}/api/revalidate`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidation-secret': REVALIDATION_SECRET,
      },
      body: JSON.stringify({
        paths: options.paths || [],
        tags: options.tags || [],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.warn(`[ISR] Revalidation failed (${res.status}): ${text}`);
    } else {
      const data = await res.json().catch(() => ({}));
      console.log('[ISR] Revalidation success:', data.revalidated || []);
    }
  } catch (error) {
    // AbortError means timeout — that's fine, the storefront will still
    // pick it up on the next time-based revalidation cycle.
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('[ISR] Revalidation request timed out (non-blocking)');
    } else {
      console.warn('[ISR] Revalidation request failed (non-blocking):', error);
    }
  }
}

/**
 * Convenience: revalidate pages that depend on product data.
 * Called after products are created, updated, or deleted.
 */
export function revalidateProducts(tenantId: string): void {
  triggerRevalidation({
    paths: ['/', '/all-products', '/categories', '/sitemap.xml'],
    tags: ['products', `tenant-${tenantId}-products`],
  }).catch(() => {});
}

/**
 * Convenience: revalidate pages that depend on website config.
 * Called after theme or website configuration changes.
 */
export function revalidateConfig(tenantId: string): void {
  triggerRevalidation({
    paths: ['/'],
    tags: ['config', `tenant-${tenantId}-config`],
  }).catch(() => {});
}

/**
 * Convenience: full revalidation of all storefront pages for a tenant.
 * Used after bulk changes like store studio config saves.
 */
export function revalidateAll(tenantId: string): void {
  triggerRevalidation({
    paths: ['/', '/all-products', '/categories', '/sitemap.xml'],
    tags: [
      'products',
      'config',
      `tenant-${tenantId}-products`,
      `tenant-${tenantId}-config`,
    ],
  }).catch(() => {});
}
