import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  outputFileTracingRoot: path.resolve(__dirname, '..'),
  turbopack: {
    root: path.resolve(__dirname, '..'),
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    externalDir: true,
    optimizePackageImports: [
      'lucide-react',
      'firebase/app',
      'firebase/auth',
      'socket.io-client',
      'swiper',
      'uuid',
      'zod',
      'react-hot-toast',
    ],
  },
  transpilePackages: ['swiper'],

  webpack: (config, { webpack }) => {
    const srcPath = path.resolve(__dirname, '../admin-next/src');
    config.resolve.alias['@'] = srcPath;
    config.resolve.alias['react-helmet-async'] = path.resolve(__dirname, 'lib/helmet-shim.tsx');

    // Ensure modules from admin-next/src resolve against storefront-next's node_modules
    config.resolve.modules = [
      path.resolve(__dirname, 'node_modules'),
      'node_modules',
    ];

    config.plugins.push(
      new webpack.DefinePlugin({
        'import.meta.env.VITE_API_BASE_URL': JSON.stringify(process.env.NEXT_PUBLIC_API_BASE_URL || ''),
        'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ''),
        'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || ''),
        'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ''),
        'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ''),
        'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || ''),
        'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''),
        'import.meta.env.VITE_FIREBASE_MEASUREMENT_ID': JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ''),
        'import.meta.env.VITE_CDN_BASE_URL': JSON.stringify(process.env.NEXT_PUBLIC_CDN_BASE_URL || ''),
        'import.meta.env.VITE_CDN_ENABLED': JSON.stringify(process.env.NEXT_PUBLIC_CDN_ENABLED || ''),
        'import.meta.env.VITE_CDN_IMAGE_URL': JSON.stringify(process.env.NEXT_PUBLIC_CDN_IMAGE_URL || ''),
        'import.meta.env.VITE_CDN_PROVIDER': JSON.stringify(process.env.NEXT_PUBLIC_CDN_PROVIDER || ''),
        'import.meta.env.VITE_CDN_STATIC_URL': JSON.stringify(process.env.NEXT_PUBLIC_CDN_STATIC_URL || ''),
        'import.meta.env.VITE_DEFAULT_TENANT_SLUG': JSON.stringify(process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG || ''),
        'import.meta.env.VITE_PRIMARY_DOMAIN': JSON.stringify(process.env.NEXT_PUBLIC_PRIMARY_DOMAIN || ''),
        'import.meta.env.VITE_ADDITIONAL_DOMAINS': JSON.stringify(process.env.NEXT_PUBLIC_ADDITIONAL_DOMAINS || ''),
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''),
        'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV || 'development'),
        'import.meta.env.DEV': JSON.stringify(process.env.NODE_ENV !== 'production'),
        'import.meta.env.PROD': JSON.stringify(process.env.NODE_ENV === 'production'),
        'import.meta.env.SSR': JSON.stringify(false),
      })
    );

    return config;
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.cloudflare.com' },
      ...(process.env.NEXT_PUBLIC_PRIMARY_DOMAIN
        ? [{ protocol: 'https', hostname: `**.${process.env.NEXT_PUBLIC_PRIMARY_DOMAIN}` }]
        : []),
      ...((process.env.NEXT_PUBLIC_ADDITIONAL_DOMAINS || '').split(',').filter(Boolean).map(d => ({ protocol: 'https', hostname: `**.${d.trim()}` }))),
      { protocol: 'https', hostname: 'imagedelivery.net' },
    ],
  },

  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  },

  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/_next/image/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/(.*)\\.(jpg|jpeg|png|webp|avif|svg|gif)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800, s-maxage=604800' },
        ],
      },
    ];
  },
};

export default nextConfig;
