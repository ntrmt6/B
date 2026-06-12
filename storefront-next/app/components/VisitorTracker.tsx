'use client';

/**
 * VisitorTracker — lightweight client component that tracks page views
 * and sends periodic heartbeats so the admin dashboard "Online Now"
 * counter reflects real storefront visitors.
 *
 * Mounted once in the storefront providers; tracks every client-side
 * navigation automatically via the Next.js pathname.
 */

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

/** Minimum interval (ms) between tracking calls for the same page. */
const PAGE_VIEW_THROTTLE_MS = 5_000;

/** Heartbeat interval (ms) — keeps the visitor "online" while browsing. */
const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1_000; // 2 minutes

// ── Helpers ──────────────────────────────────────────

function getVisitorId(): string {
  try {
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
  } catch {
    // SSR or storage unavailable — return a transient id
    return `v_${Date.now()}_${Math.random().toString(36).slice(2, 14)}`;
  }
}

function getDeviceType(userAgent: string): string {
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'Tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(userAgent)) return 'Mobile';
  return 'Desktop';
}

function getBrowserName(userAgent: string): string {
  if (userAgent.includes('Edg')) return 'Edge';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Firefox')) return 'Firefox';
  return 'Other';
}

// ── Tracking function ────────────────────────────────

async function trackPageView(tenantId: string, page: string): Promise<void> {
  if (!tenantId || typeof window === 'undefined') return;

  const userAgent = navigator.userAgent;

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    await fetch(`${API_BASE}/api/visitors/${encodeURIComponent(tenantId)}/track`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        visitorId: getVisitorId(),
        page,
        referrer: document.referrer,
        userAgent,
        device: getDeviceType(userAgent),
        browser: getBrowserName(userAgent),
      }),
    });
  } catch {
    // Silently ignore — tracking failures must never affect UX
  }
}

// ── Component ────────────────────────────────────────

interface VisitorTrackerProps {
  tenantId: string;
}

export default function VisitorTracker({ tenantId }: VisitorTrackerProps) {
  const pathname = usePathname();
  const lastTrackedRef = useRef<{ page: string; time: number }>({ page: '', time: 0 });

  // Track on every pathname change (throttled)
  useEffect(() => {
    if (!tenantId) return;

    const now = Date.now();
    const last = lastTrackedRef.current;
    if (last.page === pathname && now - last.time < PAGE_VIEW_THROTTLE_MS) return;

    lastTrackedRef.current = { page: pathname, time: now };
    trackPageView(tenantId, pathname);
  }, [tenantId, pathname]);

  // Heartbeat — re-fires the track call periodically so the visitor stays
  // in the "online" window (backend uses lastVisit >= 5 min ago).
  useEffect(() => {
    if (!tenantId) return;

    const interval = setInterval(() => {
      trackPageView(tenantId, pathname);
    }, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [tenantId, pathname]);

  // This component renders nothing — it only produces side-effects
  return null;
}
