/**
 * useThemeEffects - Theme application and persistence extracted from App.tsx
 */

import { useEffect, useRef } from 'react';
import type { ThemeConfig, WebsiteConfig } from '../types';
import { DataService, isKeyFromSocket, clearSocketFlag } from '../services/DataService';
import { hexToRgb } from '../utils/appHelpers';
import { normalizeImageUrl } from '../utils/imageUrlHelper';
import { resolveTenantFavicon } from '../utils/tenantBrandingHelper';

interface UseThemeEffectsOptions {
  themeConfig: ThemeConfig | null;
  websiteConfig?: WebsiteConfig;
  activeTenantId: string;
  isLoading: boolean;
  currentView: string;
  isTenantSwitching?: boolean;
}

export function useThemeEffects({
  themeConfig,
  websiteConfig,
  activeTenantId,
  isLoading,
  currentView,
  isTenantSwitching = false,
}: UseThemeEffectsOptions) {
  const themeLoadedRef = useRef(false);
  const lastSavedThemeRef = useRef<string>('');
  const websiteConfigLoadedRef = useRef(false);
  const lastSavedWebsiteConfigRef = useRef<string>('');

  // Reset on tenant change
  useEffect(() => {
    websiteConfigLoadedRef.current = false;
    themeLoadedRef.current = false;
    lastSavedThemeRef.current = '';
    lastSavedWebsiteConfigRef.current = '';
  }, [activeTenantId]);

  // Track previous theme config to avoid unnecessary re-renders
  const prevThemeConfigRef = useRef<string>('');

  // Apply theme colors to CSS variables
  useEffect(() => { 
    if(!themeConfig || !activeTenantId) {
      return;
    }
    
    // Compare with previous to avoid loop
    const currentThemeStr = JSON.stringify({
      primaryColor: themeConfig.primaryColor,
      secondaryColor: themeConfig.secondaryColor,
      tertiaryColor: themeConfig.tertiaryColor,
      fontColor: themeConfig.fontColor,
      hoverColor: themeConfig.hoverColor
    });
    if (prevThemeConfigRef.current === currentThemeStr) {
      return; // No change, skip
    }
    prevThemeConfigRef.current = currentThemeStr;
    
    const root = document.documentElement;

    console.log('[useThemeEffects] Applying theme colors:', {
      primaryColor: themeConfig.primaryColor,
      secondaryColor: themeConfig.secondaryColor,
      tertiaryColor: themeConfig.tertiaryColor,
      fontColor: themeConfig.fontColor,
      hoverColor: themeConfig.hoverColor,
      surfaceColor: themeConfig.surfaceColor
    });

    // Store theme colors - apply for ALL views (store needs these too)
    const primaryRgb = hexToRgb(themeConfig.primaryColor || '#22c55e');
    const secondaryRgb = hexToRgb(themeConfig.secondaryColor || '#ec4899');
    const tertiaryRgb = hexToRgb(themeConfig.tertiaryColor || '#9333ea');
    const fontRgb = hexToRgb(themeConfig.fontColor || '#0f172a');
    const hoverRgb = hexToRgb(themeConfig.hoverColor || '#f97316');
    const surfaceRgb = hexToRgb(themeConfig.surfaceColor || '#e2e8f0');
    
    root.style.setProperty('--color-primary-rgb', primaryRgb);
    root.style.setProperty('--color-secondary-rgb', secondaryRgb);
    root.style.setProperty('--color-tertiary-rgb', tertiaryRgb);
    root.style.setProperty('--color-font-rgb', fontRgb);
    root.style.setProperty('--color-hover-rgb', hoverRgb);
    root.style.setProperty('--color-surface-rgb', surfaceRgb);
    root.style.setProperty('--primary', primaryRgb);
    root.style.setProperty('--secondary', secondaryRgb);
    root.style.setProperty('--accent', tertiaryRgb);
    root.style.setProperty('--ring', primaryRgb);

    // Theme applied successfully

    // Admin-only theme tokens - only apply when admin shell is active
    const isAdminView = currentView === 'admin' || currentView === 'admin-login';
    if (!isAdminView) {
      ['--admin-bg','--admin-bg-input','--admin-border-rgb','--admin-focus-rgb']
        .forEach((key) => root.style.removeProperty(key));
      // Note: Dark mode is now handled by DarkModeContext - don't override here
    } else {
      if (themeConfig.adminBgColor) {
        root.style.setProperty('--admin-bg', hexToRgb(themeConfig.adminBgColor));
      }
      if (themeConfig.adminInputBgColor) {
        root.style.setProperty('--admin-bg-input', hexToRgb(themeConfig.adminInputBgColor));
      }
      if (themeConfig.adminBorderColor) {
        root.style.setProperty('--admin-border-rgb', hexToRgb(themeConfig.adminBorderColor));
      }
      if (themeConfig.adminFocusColor) {
        root.style.setProperty('--admin-focus-rgb', hexToRgb(themeConfig.adminFocusColor));
      }
      // Note: Dark mode is now handled by DarkModeContext - don't override here
    }
    
    // Track when theme is loaded (saves are handled by App.tsx)
    if(!isLoading && !isTenantSwitching && !themeLoadedRef.current) {
      themeLoadedRef.current = true;
      lastSavedThemeRef.current = JSON.stringify(themeConfig);
    }
  }, [themeConfig, isLoading, isTenantSwitching, activeTenantId, currentView]);

  // Website config - only handle favicon (saves are handled by App.tsx)
  useEffect(() => { 
    if(!isLoading && !isTenantSwitching && websiteConfig && activeTenantId) {
      if (!websiteConfigLoadedRef.current) {
        websiteConfigLoadedRef.current = true;
        lastSavedWebsiteConfigRef.current = JSON.stringify(websiteConfig);
      }
      
      // Apply favicon per tenant with tenant-specific validation
      const tenantFavicon = resolveTenantFavicon(websiteConfig, activeTenantId);
      if (tenantFavicon) {
        // Only remove our previously-injected favicons (marked with data-tenant-favicon)
        document.querySelectorAll("link[data-tenant-favicon]").forEach(el => el.remove());
        
        // Also remove the default Next.js favicon so we don't show duplicates
        document.querySelectorAll("link[rel='icon'][href='/favicon.ico']").forEach(el => {
          (el as HTMLElement).setAttribute('data-hidden', 'true');
          (el as HTMLLinkElement).href = '';
        });
        
        // Create new favicon link
        const link = document.createElement('link');
        link.rel = 'icon';
        link.type = tenantFavicon.startsWith('data:image/png') || tenantFavicon.includes('.png') ? 'image/png' : 'image/x-icon';
        link.href = normalizeImageUrl(tenantFavicon);
        link.setAttribute('data-tenant-favicon', 'true');
        document.head.appendChild(link);
        
        // Also add apple-touch-icon for mobile
        const appleLink = document.createElement('link');
        appleLink.rel = 'apple-touch-icon';
        appleLink.href = normalizeImageUrl(tenantFavicon);
        appleLink.setAttribute('data-tenant-favicon', 'true');
        document.head.appendChild(appleLink);
      }
    }
  }, [websiteConfig, isLoading, isTenantSwitching, activeTenantId]);

  return {
    websiteConfigLoadedRef,
  };
}
