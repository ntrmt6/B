import type { NextConfig } from 'next';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '');

const nextConfig: NextConfig = {
  output: 'standalone',
  // Pin the workspace root to this app so Next doesn't infer the parent
  // monorepo directory (multiple lockfiles) and mis-scope file tracing.
  turbopack: { root: dirname(fileURLToPath(import.meta.url)) },
  async rewrites() {
    // Proxy /api/* to the backend so browser requests stay same-origin (no CORS).
    // Skipped when NEXT_PUBLIC_API_BASE_URL is unset so the build never emits an
    // invalid "undefined/:path*" destination.
    if (!apiBaseUrl) return [];
    return [
      {
        source: '/api/:path*',
        destination: `${apiBaseUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
