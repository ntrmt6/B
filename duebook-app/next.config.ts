import type { NextConfig } from 'next';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '');

// GitHub Pages build: `GITHUB_PAGES=true npm run build` produces a static
// export in `out/`, served from https://<user>.github.io/<repo>/.
const isGithubPages = process.env.GITHUB_PAGES === 'true';
// Project pages live under /<repo>. Override with GH_PAGES_BASE_PATH if the
// repo is renamed or a custom domain (served at root) is used.
const basePath = isGithubPages ? (process.env.GH_PAGES_BASE_PATH ?? '/B') : '';

const nextConfig: NextConfig = {
  // Pin the workspace root to this app so Next doesn't infer the parent
  // monorepo directory (multiple lockfiles) and mis-scope file tracing.
  turbopack: { root: dirname(fileURLToPath(import.meta.url)) },
  // Expose the basePath to client code (share links, redirects, service worker).
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  ...(isGithubPages
    ? {
        // Static export for GitHub Pages — no Node server, so no rewrites.
        // The app calls the backend directly via NEXT_PUBLIC_API_BASE_URL (CORS).
        output: 'export' as const,
        basePath,
        assetPrefix: basePath || undefined,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {
        // Server/standalone build (VPS / Vercel). Proxy /api to the backend so
        // browser requests stay same-origin (no CORS).
        output: 'standalone' as const,
        async rewrites() {
          if (!apiBaseUrl) return [];
          return [
            {
              source: '/api/:path*',
              destination: `${apiBaseUrl}/api/:path*`,
            },
          ];
        },
      }),
};

export default nextConfig;
