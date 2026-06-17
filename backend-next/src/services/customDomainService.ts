/**
 * Custom Domain Service
 * Manages a cache of custom domains for CORS validation
 */

import { getTenantByCustomDomain, listTenants } from './tenantsService';

// Cache for custom domains - refreshes every 5 minutes
let customDomainsCache: Set<string> = new Set();
let lastCacheRefresh = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Refresh the custom domains cache from the database
 */
export async function refreshCustomDomainsCache(): Promise<void> {
  try {
    const tenants = await listTenants();
    const domains = new Set<string>();

    for (const tenant of tenants) {
      if (tenant.customDomain) {
        // Add the custom domain (normalized to lowercase)
        const domain = tenant.customDomain.toLowerCase().trim();
        domains.add(domain);
        // Also add www variant
        domains.add(`www.${domain}`);
      }
    }

    customDomainsCache = domains;
    lastCacheRefresh = Date.now();
    console.log(`[CustomDomainService] Refreshed cache with ${domains.size} custom domains`);
  } catch (error) {
    console.error('[CustomDomainService] Failed to refresh custom domains cache:', error);
  }
}

/**
 * Check if a domain is a registered custom domain
 */
export function isCustomDomain(domain: string): boolean {
  if (!domain) return false;
  const normalized = domain.toLowerCase().trim();
  return customDomainsCache.has(normalized);
}

/**
 * Check if an origin is allowed (matches a custom domain)
 */
export function isAllowedCustomDomainOrigin(origin: string): boolean {
  if (!origin) return false;

  try {
    // Extract hostname from origin (e.g., "https://mycustomshop.com" -> "mycustomshop.com")
    const url = new URL(origin);
    const hostname = url.hostname.toLowerCase();

    return customDomainsCache.has(hostname);
  } catch {
    return false;
  }
}

/**
 * Get the cache and refresh if needed
 */
export async function ensureCacheReady(): Promise<void> {
  const now = Date.now();
  if (now - lastCacheRefresh > CACHE_TTL || customDomainsCache.size === 0) {
    await refreshCustomDomainsCache();
  }
}

/**
 * Add a domain to the cache (called when a new custom domain is set)
 */
export function addToCache(domain: string): void {
  if (!domain) return;
  const normalized = domain.toLowerCase().trim();
  customDomainsCache.add(normalized);
  customDomainsCache.add(`www.${normalized}`);
  console.log(`[CustomDomainService] Added ${normalized} to cache`);
}

/**
 * Remove a domain from the cache
 */
export function removeFromCache(domain: string): void {
  if (!domain) return;
  const normalized = domain.toLowerCase().trim();
  customDomainsCache.delete(normalized);
  customDomainsCache.delete(`www.${normalized}`);
  console.log(`[CustomDomainService] Removed ${normalized} from cache`);
}

/**
 * Get all cached custom domains (for debugging)
 */
export function getCachedDomains(): string[] {
  return Array.from(customDomainsCache);
}
