import { useState, useEffect, useCallback } from 'react';
import { getAuthHeader } from '../services/authService';

const API_BASE_URL = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_BASE_URL || '') : '';

/** Feature access status for a single section */
export type FeatureStatus = 'enabled' | 'disabled' | 'premium';

/** Configuration for a single section */
interface SectionConfig {
  enabled: boolean;
  premium: boolean;
}

/** Full tenant features config from the API */
interface TenantFeaturesConfig {
  sections: Record<string, SectionConfig>;
}

interface UseFeatureAccessOptions {
  tenantId: string;
  /** If true, the feature access system is active. Set to false for super_admin users. */
  enabled?: boolean;
}

interface UseFeatureAccessReturn {
  /** Check the access status of a section. Returns 'enabled' if not configured. */
  getStatus: (sectionKey: string) => FeatureStatus;
  /** Whether the feature config has been loaded */
  isLoaded: boolean;
  /** Whether the feature config is loading */
  isLoading: boolean;
  /** Force reload the feature config */
  reload: () => void;
}

/**
 * Hook to check feature access for the current tenant's dashboard sections.
 * Returns a function that checks whether a given admin section is enabled, disabled, or premium.
 * 
 * Usage:
 * ```tsx
 * const { getStatus } = useFeatureAccess({ tenantId });
 * const status = getStatus('sms_marketing'); // 'enabled' | 'disabled' | 'premium'
 * ```
 */
export function useFeatureAccess({
  tenantId,
  enabled = true,
}: UseFeatureAccessOptions): UseFeatureAccessReturn {
  const [config, setConfig] = useState<TenantFeaturesConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchConfig = useCallback(async () => {
    if (!tenantId || !enabled) return;

    setIsLoading(true);
    try {
      const headers = getAuthHeader();
      const tenantHeader = { ...headers, 'X-Tenant-Id': tenantId };
      const response = await fetch(`${API_BASE_URL}/api/tenant-features/my-config`, {
        headers: tenantHeader,
      });

      if (!response.ok) {
        // If the endpoint returns an error, default to all enabled
        setConfig({ sections: {} });
        return;
      }

      const result = await response.json();
      setConfig(result.data || { sections: {} });
    } catch (error) {
      console.error('[useFeatureAccess] Failed to fetch feature config:', error);
      // Default to all enabled on error so we don't accidentally lock tenants out
      setConfig({ sections: {} });
    } finally {
      setIsLoading(false);
      setIsLoaded(true);
    }
  }, [tenantId, enabled]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const getStatus = useCallback(
    (sectionKey: string): FeatureStatus => {
      // Super admins or if feature access is disabled, everything is enabled
      if (!enabled) return 'enabled';

      // If config hasn't loaded yet, default to enabled
      if (!config) return 'enabled';

      const sectionConfig = config.sections[sectionKey];

      // If no config for this section, it's enabled by default
      if (!sectionConfig) return 'enabled';

      // Check premium first (premium sections are technically "enabled" but gated)
      if (sectionConfig.premium) return 'premium';

      // Check enabled/disabled
      return sectionConfig.enabled ? 'enabled' : 'disabled';
    },
    [config, enabled]
  );

  const reload = useCallback(() => {
    fetchConfig();
  }, [fetchConfig]);

  return {
    getStatus,
    isLoaded,
    isLoading,
    reload,
  };
}
