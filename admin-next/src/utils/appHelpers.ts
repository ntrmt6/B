/**
 * App utility functions - extracted from App.tsx for better code splitting
 */

import type { Product, User, ProductVariantSelection } from '../types';
import { slugify } from '../services/slugify';
import { env } from 'process';

// Reserved subdomains that cannot be used for tenants
const RESERVED_TENANT_SLUGS = [
  'www', 'admin', 'adminlogin', 'superadmin', 'login', 'app',
  'api', 'dashboard', 'tenant', 'support', 'cdn', 'static'
];

// Default tenant ID
const DEFAULT_TENANT_ID = '';  // Empty - prevent data leaking to real tenant

// --- Constants ---
export const FALLBACK_VARIANT: ProductVariantSelection = { color: 'Default', size: 'Standard' };
export const SESSION_STORAGE_KEY = 'admin_auth_user';
export const ACTIVE_TENANT_STORAGE_KEY = 'seven-days-active-tenant';
export const CART_STORAGE_KEY = 'seven-days-cart';
export const PRIMARY_TENANT_DOMAIN = normalizeDomainValue(process.env.NEXT_PUBLIC_PRIMARY_DOMAIN);
export const ADDITIONAL_DOMAINS = (process.env.NEXT_PUBLIC_ADDITIONAL_DOMAINS || '').split(',').map((d: string) => normalizeDomainValue(d)).filter(Boolean);
export const ALL_KNOWN_DOMAINS = [PRIMARY_TENANT_DOMAIN, ...ADDITIONAL_DOMAINS].filter(Boolean);
export const DEFAULT_TENANT_SLUG = sanitizeSubdomainSlug(process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG);

// --- Domain/Tenant utilities ---
export function sanitizeSubdomainSlug(value?: string | null): string {
  if (!value) return '';
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);
}

export function normalizeDomainValue(value?: string | null): string {
  if (!value) return '';
  return value
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
}

export function isReservedTenantSlug(slug?: string | null): boolean {
  if (!slug) return false;
  return RESERVED_TENANT_SLUGS.includes(sanitizeSubdomainSlug(slug));
}

export function getHostTenantSlug(): string | null {
  if (typeof window === 'undefined') return null;
  const hostname = window.location.hostname?.toLowerCase() || '';
  const params = new URLSearchParams(window.location.search);
  const forcedSlug = sanitizeSubdomainSlug(params.get('tenant'));
  if (forcedSlug && !isReservedTenantSlug(forcedSlug)) {
    return forcedSlug;
  }

  const hostSegments = hostname.split('.');
  const isLocalhost = hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.startsWith('127.');

  if (isLocalhost) {
    if (hostSegments.length > 1) {
      const candidate = sanitizeSubdomainSlug(hostSegments[0]);
      // Skip reserved subdomains like 'admin', 'www', etc.
      if (!candidate || isReservedTenantSlug(candidate)) return null;
      return candidate;
    }
    return DEFAULT_TENANT_SLUG || null;
  }

  for (const knownDomain of ALL_KNOWN_DOMAINS) {
    if (!knownDomain) continue;
    if (hostname === knownDomain || hostname === `www.${knownDomain}`) {
      return DEFAULT_TENANT_SLUG || null;
    }
    if (hostname.endsWith(`.${knownDomain}`)) {
      const subdomain = hostname.slice(0, hostname.length - (knownDomain.length + 1));
      const candidate = sanitizeSubdomainSlug(subdomain);
      if (!candidate || isReservedTenantSlug(candidate)) return null;
      return candidate;
    }
  }

  // Check for custom domain (not subdomain of any known domain)
  const isKnownDomain = ALL_KNOWN_DOMAINS.some(d => d && (
    hostname === d || hostname === `www.${d}` || hostname.endsWith(`.${d}`)
  ));
  const isCustomDomain = !isKnownDomain &&
                         !isLocalhost &&
                         hostSegments.length >= 2;
  
  if (isCustomDomain) {
    // Check if we have cached tenant info for this custom domain
    try {
      const cached = localStorage.getItem(`custom_domain_${hostname}`);
      if (cached) {
        const info = JSON.parse(cached);
        if (info.ts && (Date.now() - info.ts) < 24 * 60 * 60 * 1000) { // 24 hour cache
          return info.subdomain;
        }
      }
      // Also check window global set by bootstrap script
      if ((window as any).__CUSTOM_DOMAIN_TENANT__?.subdomain) {
        return (window as any).__CUSTOM_DOMAIN_TENANT__.subdomain;
      }
    } catch {}
    // Return null to trigger async resolution
    return null;
  }

  if (hostSegments.length > 2) {
    const candidate = sanitizeSubdomainSlug(hostSegments[0]);
    if (!candidate || isReservedTenantSlug(candidate)) return null;
    return candidate;
  }

  return DEFAULT_TENANT_SLUG || null;
}

// Check if current hostname is a custom domain (not subdomain of primary)
export function isCustomDomain(): boolean {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname?.toLowerCase() || '';
  const isLocalhost = hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.startsWith('127.');
  if (isLocalhost) return false;
  if (!ALL_KNOWN_DOMAINS.length) return false;
  
  return !ALL_KNOWN_DOMAINS.some(d => d && (
    hostname === d || hostname === `www.${d}` || hostname.endsWith(`.${d}`)
  ));
}

// Get cached custom domain tenant info
export function getCustomDomainTenant(): { tenantId: string; subdomain: string } | null {
  if (typeof window === 'undefined') return null;
  const hostname = window.location.hostname?.toLowerCase() || '';
  
  // Check window global first (set by bootstrap script)
  if ((window as any).__CUSTOM_DOMAIN_TENANT__) {
    return (window as any).__CUSTOM_DOMAIN_TENANT__;
  }
  
  // Check localStorage cache
  try {
    const cached = localStorage.getItem(`custom_domain_${hostname}`);
    if (cached) {
      const info = JSON.parse(cached);
      if (info.ts && (Date.now() - info.ts) < 24 * 60 * 60 * 1000) {
        return { tenantId: info.tenantId, subdomain: info.subdomain };
      }
    }
  } catch {}
  
  return null;
}

// --- Store URL utilities ---

/**
 * Get the primary tenant domain from env or by extracting from the current hostname.
 * Used as fallback when PRIMARY_TENANT_DOMAIN env var is not set.
 */
export function getPrimaryDomain(): string {
  if (PRIMARY_TENANT_DOMAIN) return PRIMARY_TENANT_DOMAIN;
  if (typeof window === 'undefined') return '';
  const hostname = window.location.hostname?.toLowerCase() || '';
  const isLocalhost = hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.startsWith('127.');
  if (isLocalhost) return 'localhost';
  const parts = hostname.split('.');
  return parts.length > 2 ? parts.slice(-2).join('.') : hostname;
}

/**
 * Build a storefront URL for a given tenant subdomain.
 * Uses PRIMARY_TENANT_DOMAIN from env, with fallback to current hostname's root domain.
 */
export function getStoreUrl(subdomain?: string): string {
  if (!subdomain) return '';
  if (typeof window === 'undefined') {
    const domain = PRIMARY_TENANT_DOMAIN;
    return domain ? `https://${subdomain}.${domain}` : '';
  }
  const hostname = window.location.hostname?.toLowerCase() || '';
  const isLocalhost = hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.startsWith('127.');
  if (isLocalhost) return `http://${subdomain}.localhost:3000`;
  const domain = getPrimaryDomain();
  return domain ? `https://${subdomain}.${domain}` : '';
}

/**
 * Get the backend API base URL.
 * Uses VITE_API_BASE_URL env var, with fallback to deriving from the current hostname.
 */
export function getApiUrl(): string {
  const envApi = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (envApi && /^https?:\/\/.+/.test(envApi)) {
    const base = envApi.replace(/\/$/, '');
    return base.endsWith('/api') ? base : `${base}/api`;
  }
  if (typeof window === 'undefined') {
    const domain = PRIMARY_TENANT_DOMAIN;
    return domain ? `https://${domain}/api` : '/api';
  }
  const hostname = window.location.hostname?.toLowerCase() || '';
  const isLocalhost = hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.startsWith('127.');
  if (isLocalhost) return 'http://localhost:5001/api';
  const domain = getPrimaryDomain();
  return domain ? `${window.location.protocol}//${domain}/api` : '/api';
}

// --- Color utilities ---
export function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '0, 0, 0';
}

// --- Auth utilities ---
export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Something went wrong. Please try again.';
}

export function isAdminRole(role?: User['role'] | null): boolean {
  return role === 'admin' || role === 'tenant_admin' || role === 'super_admin';
}

export function isPlatformOperator(role?: User['role'] | null): boolean {
  return role === 'super_admin';
}

// --- Product utilities ---
export function ensureUniqueProductSlug(
  desired: string, 
  list: Product[], 
  tenantId?: string, 
  ignoreId?: number
): string {
  const base = slugify(desired || '').replace(/--+/g, '-') || `product-${Date.now()}`;
  let candidate = base;
  let counter = 2;
  const hasConflict = (slugValue: string) => list.some(p => {
    const sameTenant = tenantId ? p.tenantId === tenantId : true;
    return sameTenant && p.slug === slugValue && p.id !== ignoreId;
  });
  while (hasConflict(candidate)) {
    candidate = `${base}-${counter++}`;
  }
  return candidate;
}

export function normalizeProductCollection(items: Product[], tenantId?: string): Product[] {
  const normalized: Product[] = [];
  items.forEach(item => {
    const slugSource = item.slug || item.name || `product-${item.id}`;
    const scopedTenantId = item.tenantId || tenantId;
    const slug = ensureUniqueProductSlug(slugSource, normalized, scopedTenantId, item.id);
    normalized.push({ ...item, slug, tenantId: scopedTenantId });
  });
  return normalized;
}

// --- Cache utilities ---

// Cache key for subdomain -> tenant ID mapping
const SUBDOMAIN_TENANT_CACHE_KEY = 'ds_subdomain_tenant_';

/**
 * Get cached tenant ID for a subdomain - enables instant cache hits on subdomains
 */
export function getCachedTenantIdForSubdomain(subdomain: string): string | null {
  if (typeof window === 'undefined' || !subdomain) return null;
  try {
    const cached = localStorage.getItem(SUBDOMAIN_TENANT_CACHE_KEY + subdomain);
    if (cached) return cached;
  } catch {}
  return null;
}

/**
 * Cache tenant ID for a subdomain - enables instant cache hits on subsequent visits
 */
export function setCachedTenantIdForSubdomain(subdomain: string, tenantId: string): void {
  if (typeof window === 'undefined' || !subdomain || !tenantId) return;
  try {
    localStorage.setItem(SUBDOMAIN_TENANT_CACHE_KEY + subdomain, tenantId);
  } catch {}
}

/**
 * Get the tenant scope for cache keys based on hostname/URL.
 * This must match the logic in DataService.getCacheKey to ensure cache hits.
 */
function getInitialTenantScope(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    // For subdomain-based tenants, check if we have cached tenant ID for this subdomain
    const hostSlug = getHostTenantSlug();
    if (hostSlug && hostSlug !== DEFAULT_TENANT_SLUG) {
      const cachedTenantId = getCachedTenantIdForSubdomain(hostSlug);
      if (cachedTenantId) {
        return cachedTenantId; // Use cached tenant ID for instant cache hit!
      }
      // No cached tenant ID for this subdomain yet - will be cached after first API call
      return null;
    }
    
    // Check localStorage for persisted active tenant (most reliable)
    const cachedTenantId = window.localStorage.getItem(ACTIVE_TENANT_STORAGE_KEY);
    if (cachedTenantId) {
      return cachedTenantId;
    }
    
    // Try to get from session storage (logged in user)
    const sessionData = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      const tenantId = parsed?.tenantId || parsed?.tenant?.id || parsed?.tenant?._id;
      if (tenantId) return tenantId;
    }
    
    // Check URL param (for tenant switching/preview)
    const params = new URLSearchParams(window.location.search);
    const forcedTenant = params.get('tenant');
    if (forcedTenant && !isReservedTenantSlug(forcedTenant)) {
      // URL param might be a slug, need to resolve to ID later
      // For now return null to avoid cache mismatch
      return null;
    }
    
    return DEFAULT_TENANT_ID || 'public';
  } catch {}
  
  return null;
}

export function getInitialCachedData<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const tenantScope = getInitialTenantScope();
    // If we can't determine the tenant scope reliably, don't use cached data
    // This prevents showing wrong tenant's data
    if (!tenantScope) return defaultValue;
    
    // Double-check: if we're on a subdomain, verify cache matches that subdomain's tenant
    const hostSlug = getHostTenantSlug();
    if (hostSlug && hostSlug !== DEFAULT_TENANT_SLUG) {
      const cachedTenantId = getCachedTenantIdForSubdomain(hostSlug);
      // Only use cache if it matches the subdomain's cached tenant ID
      if (!cachedTenantId || cachedTenantId !== tenantScope) {
        return defaultValue;
      }
    }
    
    const stored = localStorage.getItem(`ds_cache_${tenantScope}::${key}`);
    if (stored) {
      const { data, timestamp } = JSON.parse(stored);
      // Use cache if less than 5 minutes old
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        return data as T;
      }
    }
  } catch {}
  return defaultValue;
}

export function hasCachedData(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const tenantScope = getInitialTenantScope();
    // If we can't determine the tenant scope reliably, assume no cache
    if (!tenantScope) return false;
    
    // Double-check: if we're on a subdomain, verify cache matches that subdomain's tenant
    const hostSlug = getHostTenantSlug();
    if (hostSlug && hostSlug !== DEFAULT_TENANT_SLUG) {
      const cachedTenantId = getCachedTenantIdForSubdomain(hostSlug);
      // Only consider cache valid if it matches the subdomain's cached tenant ID
      if (!cachedTenantId || cachedTenantId !== tenantScope) {
        return false;
      }
    }
    
    const stored = localStorage.getItem(`ds_cache_${tenantScope}::products`);
    if (stored) {
      const { data, timestamp } = JSON.parse(stored);
      return Array.isArray(data) && data.length > 0 && Date.now() - timestamp < 5 * 60 * 1000;
    }
  } catch {}
  return false;
}

// --- Variant utilities ---
export function ensureVariantSelection(
  product?: Product | null, 
  variant?: ProductVariantSelection | null
): ProductVariantSelection {
  return {
    color: variant?.color || product?.variantDefaults?.color || product?.colors?.[0] || FALLBACK_VARIANT.color,
    size: variant?.size || product?.variantDefaults?.size || product?.sizes?.[0] || FALLBACK_VARIANT.size,
  };
}
