import { useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

interface VisitorStats {
  totalVisitors: number;
  periodVisitors: number;
  todayVisitors: number;
  totalPageViews: number;
  onlineNow: number;
  dailyStats: { date: string; views: number; visitors: number }[];
  topPages: { page: string; views: number }[];
  devices: { device: string; count: number }[];
}

interface UseVisitorStatsOptions {
  tenantId?: string;
  period?: '24h' | '7d' | '30d' | 'all';
  refreshInterval?: number; // in milliseconds
}

export const useVisitorStats = (options: UseVisitorStatsOptions = {}) => {
  const { tenantId, period = '7d', refreshInterval = 30000 } = options;
  
  const [stats, setStats] = useState<VisitorStats>({
    totalVisitors: 0,
    periodVisitors: 0,
    todayVisitors: 0,
    totalPageViews: 0,
    onlineNow: 0,
    dailyStats: [],
    topPages: [],
    devices: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!tenantId) return;
    
    try {
      // Fetch main stats
      const statsRes = await fetch(`${API_BASE}/api/visitors/${tenantId}/stats?period=${period}`);
      if (!statsRes.ok) throw new Error('Failed to fetch stats');
      const statsContentType = statsRes.headers.get('content-type') || '';
      if (!statsContentType.includes('application/json')) throw new Error('Stats API returned non-JSON response');
      const statsData = await statsRes.json();
      
      // Fetch online count
      const onlineRes = await fetch(`${API_BASE}/api/visitors/${tenantId}/online`);
      if (!onlineRes.ok) throw new Error('Failed to fetch online count');
      const onlineContentType = onlineRes.headers.get('content-type') || '';
      if (!onlineContentType.includes('application/json')) throw new Error('Online API returned non-JSON response');
      const onlineData = await onlineRes.json();
      
      setStats({
        ...statsData,
        onlineNow: onlineData.online || 0
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching visitor stats:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, period]);

  useEffect(() => {
    fetchStats();
    
    // Set up polling for online visitors
    const interval = setInterval(fetchStats, refreshInterval);
    
    return () => clearInterval(interval);
  }, [fetchStats, refreshInterval]);

  return { stats, isLoading, error, refresh: fetchStats };
};

// Track page view (for storefront)
// Throttle tracking to prevent excessive API calls
const lastPageViewTrack = new Map<string, number>();
const PAGE_VIEW_THROTTLE_MS = 5000; // Only track same page once per 5 seconds
const lastEventTrack = new Map<string, number>();
const EVENT_THROTTLE_MS = 8000;
const SUPPORTED_VISITOR_EVENTS = new Set(['search', 'checkout_start']);

const getVisitorId = () => {
  let visitorId = localStorage.getItem('_vid');
  if (!visitorId) {
    const randomSegment =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
        : Math.random().toString(36).slice(2, 14);
    visitorId = `v_${Date.now()}_${randomSegment}`;
    localStorage.setItem('_vid', visitorId);
  }
  return visitorId;
};

const getDeviceType = (userAgent: string) => {
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    return 'Tablet';
  }

  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(userAgent)) {
    return 'Mobile';
  }

  return 'Desktop';
};

const getBrowserName = (userAgent: string) => {
  if (userAgent.includes('Edg')) return 'Edge';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Firefox')) return 'Firefox';
  return 'Other';
};

const buildVisitorContext = () => {
  const userAgent = navigator.userAgent;

  return {
    visitorId: getVisitorId(),
    userAgent,
    device: getDeviceType(userAgent),
    browser: getBrowserName(userAgent)
  };
};

const sanitizeMetadata = (metadata: Record<string, unknown>) =>
  Object.entries(metadata).reduce<Record<string, string | number | boolean>>((accumulator, [key, value]) => {
      const safeKey = key.replace(/[^\w.-]/g, '').slice(0, 40);
      if (!safeKey) return accumulator;

      if (typeof value === 'string') {
        const trimmedValue = value.trim();
        if (trimmedValue) {
          accumulator[safeKey] = trimmedValue.slice(0, 200);
        }
        return accumulator;
      }

      if (typeof value === 'number' && Number.isFinite(value)) {
        accumulator[safeKey] = value;
        return accumulator;
      }

      if (typeof value === 'boolean') {
        accumulator[safeKey] = value;
        return accumulator;
      }

      return accumulator;
    }, {});

export const trackPageView = async (tenantId: string, page: string) => {
  if (!tenantId) return;
  
  // Throttle to prevent excessive tracking
  const throttleKey = `${tenantId}:${page}`;
  const lastTrack = lastPageViewTrack.get(throttleKey) || 0;
  const now = Date.now();
  if (now - lastTrack < PAGE_VIEW_THROTTLE_MS) {
    return; // Skip - already tracked recently
  }
  lastPageViewTrack.set(throttleKey, now);
  
  const { visitorId, userAgent, device, browser } = buildVisitorContext();
  
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    const res = await fetch(`${API_BASE}/api/visitors/${encodeURIComponent(tenantId)}/track`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        visitorId,
        page,
        referrer: document.referrer,
        userAgent,
        device,
        browser
      })
    });
    if (!res.ok && res.status !== 401 && res.status !== 402) {
      console.warn(`Page view tracking returned ${res.status}`);
    }
  } catch {
    // Silently ignore tracking failures — they should not affect user experience
  }
};

export const trackVisitorEvent = async (
  tenantId: string,
  eventType: 'search' | 'checkout_start',
  metadata: Record<string, unknown> = {},
  throttleKey?: string
) => {
  if (!tenantId || typeof window === 'undefined' || !SUPPORTED_VISITOR_EVENTS.has(eventType)) return;

  const now = Date.now();
  const resolvedThrottleKey =
    throttleKey || `${tenantId}:${eventType}:${window.location.pathname}:${JSON.stringify(metadata)}`;
  const lastTrack = lastEventTrack.get(resolvedThrottleKey) || 0;

  if (now - lastTrack < EVENT_THROTTLE_MS) {
    return;
  }

  lastEventTrack.set(resolvedThrottleKey, now);

  try {
    const { visitorId, userAgent, device, browser } = buildVisitorContext();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    const res = await fetch(`${API_BASE}/api/visitors/${encodeURIComponent(tenantId)}/events`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        visitorId,
        eventType,
        page: window.location.pathname || '/',
        referrer: document.referrer,
        userAgent,
        device,
        browser,
        metadata: sanitizeMetadata(metadata)
      })
    });

    if (!res.ok && res.status !== 401 && res.status !== 402) {
      console.warn(`Visitor event tracking returned ${res.status}`);
    }
  } catch {
    // Silently ignore tracking failures
  }
};

export default useVisitorStats;
