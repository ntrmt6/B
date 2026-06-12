import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Multi-tenant middleware
 * Detects the tenant from subdomain/custom domain and injects it as a header.
 * Pages read the tenant from the x-tenant-id header or cookie.
 */

// Build known base domains from env var + defaults
const primaryDomain = process.env.NEXT_PUBLIC_PRIMARY_DOMAIN || '';
const additionalDomains = (process.env.NEXT_PUBLIC_ADDITIONAL_DOMAINS || '').split(',').map(d => d.trim()).filter(Boolean);
const KNOWN_BASE_DOMAINS = [
  ...(primaryDomain ? [primaryDomain] : []),
  ...additionalDomains,
  'localhost:3000',
].filter(Boolean);
const SYSTEM_SUBDOMAINS = ['admin', 'superadmin', 'www', 'api'];

export function middleware(request: NextRequest) {
  const rawHost = request.headers.get('host') ?? request.headers.get('x-forwarded-host') ?? '';
  const hostnameWithoutPort = (rawHost.split(':')[0] || '').toLowerCase();

  // Bail out early if hostname is empty (e.g. health-check probes)
  if (!hostnameWithoutPort) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();

  // Detect tenant from subdomain
  let tenantId = '';
  let isAdminSubdomain = false;
  let isSuperAdminSubdomain = false;

  // Check system subdomains
  if (hostnameWithoutPort.startsWith('admin.')) {
    isAdminSubdomain = true;
  } else if (hostnameWithoutPort.startsWith('superadmin.')) {
    isSuperAdminSubdomain = true;
  }

  // Extract tenant subdomain
  const isKnownBase = KNOWN_BASE_DOMAINS.some(
    (base) => base && (hostnameWithoutPort === base || hostnameWithoutPort.endsWith('.' + base))
  );

  if (isKnownBase) {
    const parts = hostnameWithoutPort.split('.');
    if (parts.length >= 2) {
      const subdomain = parts[0];
      if (subdomain && !SYSTEM_SUBDOMAINS.includes(subdomain)) {
        tenantId = subdomain;
      }
    }
  } else {
    // Custom domain - will be resolved by the app via API
    tenantId = '__custom_domain__';
  }

  // Set headers for downstream use
  const requestHeaders = new Headers(request.headers);
  if (tenantId) {
    requestHeaders.set('x-tenant-id', tenantId);
  }
  requestHeaders.set('x-is-admin', String(isAdminSubdomain));
  requestHeaders.set('x-is-superadmin', String(isSuperAdminSubdomain));
  requestHeaders.set('x-hostname', hostnameWithoutPort);

  // Rewrite admin subdomain requests to /admin routes
  if (isAdminSubdomain && !url.pathname.startsWith('/admin')) {
    url.pathname = `/admin${url.pathname === '/' ? '/login' : url.pathname}`;
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }

  // Rewrite superadmin subdomain requests
  if (isSuperAdminSubdomain && !url.pathname.startsWith('/admin')) {
    url.pathname = `/admin${url.pathname === '/' ? '/login' : url.pathname}`;
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // Match all routes except static files and API
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
