// Central place for deploy-target-dependent URLs.
//
// Two hosting modes are supported from one codebase:
//   1. Server host (VPS / Vercel): NEXT_PUBLIC_API_BASE_URL may be empty and
//      requests go to same-origin "/api" (proxied by next.config rewrites).
//      basePath is "".
//   2. Static host (GitHub Pages): the app is exported statically under a
//      basePath ("/B") and calls the backend directly at its full URL, so
//      NEXT_PUBLIC_API_BASE_URL must be set at build time.

// basePath the app is served under (e.g. "/B" on GitHub Pages, "" elsewhere).
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

// Backend origin without a trailing slash. Empty means "same origin".
export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');

// Build a URL to a backend API path. When API_BASE is empty this yields a
// same-origin path (works with the /api proxy); otherwise an absolute URL to
// the backend (works from a static host via CORS).
export const apiUrl = (path: string): string => {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${p}`;
};

// Absolute, shareable public URL (for QR codes / copy-link). Client-only —
// uses window.location.origin and includes the basePath.
export const shareUrl = (path: string): string => {
  const p = path.startsWith('/') ? path : `/${path}`;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}${BASE_PATH}${p}`;
};
