/**
 * Tenant-Aware Branding Helper
 * Ensures logos, favicons, and other branding assets are properly scoped to tenants
 * Prevents asset "leaking" between different tenants
 */

import { normalizeImageUrl } from './imageUrlHelper';
import type { WebsiteConfig } from '../types';

/**
 * Validates if a URL is tenant-specific (includes /branding/{tenantId}/)
 */
export const isTenantSpecificUrl = (url: string | null | undefined, tenantId?: string): boolean => {
  if (!url || !tenantId) return false;
  
  // Check if URL includes tenant-specific branding path
  return url.includes(`/branding/${tenantId}/`) || url.includes(`/branding%2F${tenantId}%2F`);
};

/**
 * Ensures a branding URL is tenant-specific
 * If the URL doesn't include the tenant path, it attempts to convert it
 */
export const ensureTenantSpecificUrl = (
  url: string | null | undefined,
  tenantId: string | undefined,
  fallbackUrl?: string | null
): string | null => {
  if (!url || !tenantId) return fallbackUrl || null;
  
  // Already tenant-specific
  if (isTenantSpecificUrl(url, tenantId)) {
    return url;
  }
  
  // If it's a branding URL but for a different tenant, use fallback
  if (url.includes('/branding/') && !url.includes(`/branding/${tenantId}/`)) {
    console.warn(`[TenantBranding] Logo from different tenant detected, using fallback`);
    return fallbackUrl || null;
  }
  
  // Return the URL as-is (might be a generic non-tenant URL)
  return url;
};

/**
 * Resolves header logo with tenant-specific logic
 * Priority: 1) tenant-specific headerLogo, 2) tenant-specific logo, 3) fallback
 */
export const resolveTenantHeaderLogo = (
  websiteConfig: WebsiteConfig | undefined | null,
  logo: string | null | undefined,
  tenantId: string | undefined
): string | null => {
  if (!tenantId) {
    // No tenant context, return first available
    return websiteConfig?.headerLogo || logo || null;
  }
  
  // Check headerLogo first
  if (websiteConfig?.headerLogo) {
    const headerLogo = websiteConfig.headerLogo;
    
    // If it's tenant-specific and matches our tenant, use it
    if (isTenantSpecificUrl(headerLogo, tenantId)) {
      return headerLogo;
    }
    
    // If it has branding path but different tenant, skip it
    if (headerLogo.includes('/branding/') && !isTenantSpecificUrl(headerLogo, tenantId)) {
      console.warn(`[TenantBranding] headerLogo from different tenant, skipping`);
      // Fall through to check other options
    } else {
      // Not a tenant-specific path at all, could be generic or absolute URL
      return headerLogo;
    }
  }
  
  // Check main logo
  if (logo && isTenantSpecificUrl(logo, tenantId)) {
    return logo;
  }
  
  // Check if logo is from different tenant
  if (logo && logo.includes('/branding/') && !isTenantSpecificUrl(logo, tenantId)) {
    console.warn(`[TenantBranding] Logo from different tenant, returning null`);
    return null;
  }
  
  // Return logo if it exists (might be generic/non-tenant URL)
  return logo || null;
};

/**
 * Resolves footer logo with tenant-specific logic
 * Priority: 1) tenant-specific footerLogo, 2) tenant-specific headerLogo, 3) favicon, 4) logo
 */
export const resolveTenantFooterLogo = (
  websiteConfig: WebsiteConfig | undefined | null,
  logo: string | null | undefined,
  tenantId: string | undefined
): string | null => {
  if (!tenantId) {
    // No tenant context
    return websiteConfig?.footerLogo || websiteConfig?.headerLogo || websiteConfig?.favicon || logo || null;
  }
  
  // Check footerLogo first
  if (websiteConfig?.footerLogo) {
    const footerLogo = websiteConfig.footerLogo;
    if (isTenantSpecificUrl(footerLogo, tenantId)) {
      return footerLogo;
    }
    if (footerLogo.includes('/branding/') && !isTenantSpecificUrl(footerLogo, tenantId)) {
      // Different tenant, skip
      console.warn(`[TenantBranding] footerLogo from different tenant, skipping`);
    } else {
      return footerLogo;
    }
  }
  
  // Check headerLogo
  if (websiteConfig?.headerLogo) {
    const headerLogo = websiteConfig.headerLogo;
    if (isTenantSpecificUrl(headerLogo, tenantId)) {
      return headerLogo;
    }
    if (!headerLogo.includes('/branding/') || isTenantSpecificUrl(headerLogo, tenantId)) {
      return headerLogo;
    }
  }
  
  // Check favicon
  if (websiteConfig?.favicon) {
    const favicon = websiteConfig.favicon;
    if (isTenantSpecificUrl(favicon, tenantId)) {
      return favicon;
    }
    if (!favicon.includes('/branding/') || isTenantSpecificUrl(favicon, tenantId)) {
      return favicon;
    }
  }
  
  // Check main logo
  if (logo && (!logo.includes('/branding/') || isTenantSpecificUrl(logo, tenantId))) {
    return logo;
  }
  
  return null;
};

/**
 * Resolves favicon with tenant-specific logic
 */
export const resolveTenantFavicon = (
  websiteConfig: WebsiteConfig | undefined | null,
  tenantId: string | undefined,
  fallback?: string | null
): string | null => {
  if (!websiteConfig?.favicon) return fallback || null;
  
  const favicon = websiteConfig.favicon;
  
  // If no tenant context, return as-is
  if (!tenantId) return favicon;
  
  // Check if favicon is tenant-specific
  if (isTenantSpecificUrl(favicon, tenantId)) {
    return favicon;
  }
  
  // If it's from a different tenant, use fallback
  if (favicon.includes('/branding/') && !isTenantSpecificUrl(favicon, tenantId)) {
    console.warn(`[TenantBranding] Favicon from different tenant, using fallback`);
    return fallback || null;
  }
  
  // Return favicon (non-tenant-specific path)
  return favicon;
};

/**
 * Gets a normalized and tenant-safe image URL
 */
export const getTenantSafeImageUrl = (
  url: string | null | undefined,
  tenantId: string | undefined
): string => {
  if (!url) return '';
  
  // If no tenant context, normalize and return
  if (!tenantId) {
    return normalizeImageUrl(url);
  }
  
  // Skip URLs from different tenants
  if (url.includes('/branding/') && !isTenantSpecificUrl(url, tenantId)) {
    console.warn(`[TenantBranding] Blocked image from different tenant:`, url);
    return '';
  }
  
  return normalizeImageUrl(url);
};

/**
 * Creates a tenant-aware logo key for React key prop
 * Helps ensure proper re-rendering when tenant changes
 */
export const getTenantLogoKey = (
  url: string | null | undefined,
  tenantId: string | undefined
): string => {
  if (!url) return `no-logo-${tenantId || 'default'}`;
  
  const urlPart = url.slice(-20);
  return `logo-${tenantId || 'default'}-${urlPart}`;
};
