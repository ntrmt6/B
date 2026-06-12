import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { WebsiteConfig } from '../types';

const CACHE_KEY_PREFIX = 'store_studio_batch_';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const FETCH_TIMEOUT_MS = 5000; // 5 second timeout

interface CachedBatchData {
  data: BatchResult;
  timestamp: number;
}

interface BatchResult {
  data?: {
    config?: { enabled?: boolean; productDisplayOrder?: number[] };
    layout?: { sections?: any[] };
    styles?: Record<string, string>;
  };
}

type CustomLayoutData = {
  sections: any[];
};

const getCachedBatch = (tenantId: string): CachedBatchData | null => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY_PREFIX + tenantId);
    if (!raw) return null;
    const parsed: CachedBatchData = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
      sessionStorage.removeItem(CACHE_KEY_PREFIX + tenantId);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const setCachedBatch = (tenantId: string, data: BatchResult) => {
  try {
    sessionStorage.setItem(CACHE_KEY_PREFIX + tenantId, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {}
};

interface UseStoreStudioLayoutProps {
  tenantId?: string;
  websiteConfig?: WebsiteConfig;
}

interface UseStoreStudioLayoutReturn {
  useCustomLayout: boolean;
  customLayoutLoading: boolean;
  customLayoutData: CustomLayoutData | null;
  storeStudioEnabled: boolean;
  productDisplayOrder: number[];
  effectiveWebsiteConfig: WebsiteConfig | undefined;
}

export const useStoreStudioLayout = ({
  tenantId,
  websiteConfig,
}: UseStoreStudioLayoutProps): UseStoreStudioLayoutReturn => {
  const [useCustomLayout, setUseCustomLayout] = useState(false);
  const [customLayoutLoading, setCustomLayoutLoading] = useState(true);
  const [customLayoutData, setCustomLayoutData] = useState<CustomLayoutData | null>(null);
  const [storeStudioEnabled, setStoreStudioEnabled] = useState(false);
  const [productDisplayOrder, setProductDisplayOrder] = useState<number[]>([]);
  const [storeStudioStyles, setStoreStudioStyles] = useState<Record<string, string> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const applyBatchResult = useCallback((batchResult: BatchResult, logPrefix = '') => {
    const { config: configData, layout: layoutData, styles: stylesData } = batchResult.data || {};

    const isStoreStudioEnabled = configData?.enabled || false;
    const normalizedLayoutData: CustomLayoutData = {
      sections: Array.isArray(layoutData?.sections) ? layoutData.sections : [],
    };
    const displayOrder = configData?.productDisplayOrder || [];

    setStoreStudioEnabled(isStoreStudioEnabled);
    setProductDisplayOrder(displayOrder);

    if (isStoreStudioEnabled && stylesData && typeof stylesData === 'object') {
      setStoreStudioStyles(stylesData);
    } else {
      setStoreStudioStyles(null);
    }

    if (isStoreStudioEnabled) {
      setCustomLayoutData(normalizedLayoutData);
      setUseCustomLayout(true);
    } else {
      setCustomLayoutData(null);
      setUseCustomLayout(false);
      setStoreStudioStyles(null);
    }
  }, []);

  // Shared function to check and update custom layout state
  const checkAndUpdateCustomLayout = useCallback(async (logPrefix = '') => {
    if (!tenantId) return;

    // Try session cache first for instant load
    const cached = getCachedBatch(tenantId);
    if (cached) {
      applyBatchResult(cached.data, logPrefix + ' (cached)');
      setCustomLayoutLoading(false);
      return;
    }

    try {
      // Abort any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      // Set timeout to prevent hanging
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const batchRes = await fetch(
        `${API_BASE_URL}/api/tenant-data/${tenantId}/store_studio_batch`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      
      if (batchRes.ok) {
        const contentType = batchRes.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          console.warn('[StoreHome] API returned non-JSON response, using default layout');
          setCustomLayoutData(null);
          setUseCustomLayout(false);
          setCustomLayoutLoading(false);
          return;
        }
        const batchResult = await batchRes.json();
        
        // Cache the result for subsequent navigations
        setCachedBatch(tenantId, batchResult);
        applyBatchResult(batchResult, logPrefix);
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') {
        console.warn(`[StoreHome]${logPrefix} Layout fetch timed out, using default layout`);
      } else {
        console.log(`[StoreHome]${logPrefix} Error checking layout, using default:`, e);
      }
      // Fallback to default layout on any error
      setCustomLayoutData(null);
      setUseCustomLayout(false);
    }
  }, [tenantId, applyBatchResult]);

  // Check if tenant has store studio enabled and a custom layout saved (only on mount)
  useEffect(() => {
    const initCustomLayout = async () => {
      if (!tenantId) {
        setCustomLayoutLoading(false);
        return;
      }
      await checkAndUpdateCustomLayout();
      setCustomLayoutLoading(false);
    };
    initCustomLayout();

    return () => {
      abortRef.current?.abort();
    };
  }, [tenantId, checkAndUpdateCustomLayout]);

  // Merge store studio style customizations with websiteConfig when studio is enabled
  const effectiveWebsiteConfig = useMemo<WebsiteConfig | undefined>(() => {
    if (!storeStudioEnabled || !storeStudioStyles) return websiteConfig;
    return { ...websiteConfig, ...storeStudioStyles } as WebsiteConfig;
  }, [websiteConfig, storeStudioStyles, storeStudioEnabled]);

  return {
    useCustomLayout,
    customLayoutLoading,
    customLayoutData,
    storeStudioEnabled,
    productDisplayOrder,
    effectiveWebsiteConfig,
  };
};
