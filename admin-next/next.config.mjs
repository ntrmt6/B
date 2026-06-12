import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Separate build output dirs for dev and production to prevent conflicts
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  async redirects() {
    return [
      { source: '/login', destination: '/admin/login', permanent: false },
      { source: '/dashboard', destination: '/admin/dashboard', permanent: false },
      { source: '/orders', destination: '/admin/orders', permanent: false },
      { source: '/products', destination: '/admin/products', permanent: false },
      { source: '/customers', destination: '/admin/customers', permanent: false },
      { source: '/settings', destination: '/admin/settings', permanent: false },
      { source: '/catalog', destination: '/admin/catalog', permanent: false },
      { source: '/gallery', destination: '/admin/gallery', permanent: false },
      { source: '/landing-pages', destination: '/admin/landing-pages', permanent: false },
      { source: '/billing', destination: '/admin/billing', permanent: false },
      { source: '/analytics', destination: '/admin/analytics', permanent: false },
      { source: '/support', destination: '/admin/support', permanent: false },
      { source: '/superadmin', destination: '/admin/superadmin', permanent: false },
      { source: '/purchase', destination: '/admin/purchase', permanent: false },
      { source: '/expenses', destination: '/admin/expenses', permanent: false },
      { source: '/income', destination: '/admin/income', permanent: false },
      { source: '/notes', destination: '/admin/notes', permanent: false },
      { source: '/inventory', destination: '/admin/inventory', permanent: false },
      { source: '/groups', destination: '/admin/groups', permanent: false },
      { source: '/control', destination: '/admin/control', permanent: false },
      { source: '/activity', destination: '/admin/activity', permanent: false },
    ];
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    missingSuspenseWithCSRBailout: false,
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      '@dnd-kit/utilities',
      'firebase/app',
      'firebase/auth',
    ],
  },
  transpilePackages: ['swiper'],

  webpack: (config, { webpack }) => {
    const srcPath = path.resolve(__dirname, 'src');

    // @ alias points to src/ (where all components/hooks/utils live)
    config.resolve.alias['@'] = srcPath;

    // Replace react-helmet-async with Next.js-compatible shim
    config.resolve.alias['react-helmet-async'] = path.resolve(__dirname, 'lib/helmet-shim.tsx');

    // Replace Vite's import.meta.env with process.env equivalents
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
        'import.meta.env.VITE_CDN_CACHE_DEFAULT': JSON.stringify(process.env.NEXT_PUBLIC_CDN_CACHE_DEFAULT || ''),
        'import.meta.env.VITE_CDN_CACHE_IMAGES': JSON.stringify(process.env.NEXT_PUBLIC_CDN_CACHE_IMAGES || ''),
        'import.meta.env.VITE_CDN_CACHE_STATIC': JSON.stringify(process.env.NEXT_PUBLIC_CDN_CACHE_STATIC || ''),
        'import.meta.env.VITE_CDN_ENABLED': JSON.stringify(process.env.NEXT_PUBLIC_CDN_ENABLED || ''),
        'import.meta.env.VITE_CDN_IMAGE_FIT': JSON.stringify(process.env.NEXT_PUBLIC_CDN_IMAGE_FIT || ''),
        'import.meta.env.VITE_CDN_IMAGE_FORMAT': JSON.stringify(process.env.NEXT_PUBLIC_CDN_IMAGE_FORMAT || ''),
        'import.meta.env.VITE_CDN_IMAGE_QUALITY': JSON.stringify(process.env.NEXT_PUBLIC_CDN_IMAGE_QUALITY || ''),
        'import.meta.env.VITE_CDN_IMAGE_TRANSFORM': JSON.stringify(process.env.NEXT_PUBLIC_CDN_IMAGE_TRANSFORM || ''),
        'import.meta.env.VITE_CDN_IMAGE_URL': JSON.stringify(process.env.NEXT_PUBLIC_CDN_IMAGE_URL || ''),
        'import.meta.env.VITE_CDN_PROVIDER': JSON.stringify(process.env.NEXT_PUBLIC_CDN_PROVIDER || ''),
        'import.meta.env.VITE_CDN_STATIC_URL': JSON.stringify(process.env.NEXT_PUBLIC_CDN_STATIC_URL || ''),
        'import.meta.env.VITE_DEFAULT_TENANT_SLUG': JSON.stringify(process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG || ''),
        'import.meta.env.VITE_PRIMARY_DOMAIN': JSON.stringify(process.env.NEXT_PUBLIC_PRIMARY_DOMAIN || ''),
        'import.meta.env.VITE_ADDITIONAL_DOMAINS': JSON.stringify(process.env.NEXT_PUBLIC_ADDITIONAL_DOMAINS || ''),
        'import.meta.env.VITE_REMOTE_SAVE_DEBOUNCE_MS': JSON.stringify(process.env.NEXT_PUBLIC_REMOTE_SAVE_DEBOUNCE_MS || '1200'),
        'import.meta.env.VITE_DISABLE_REMOTE_SAVE': JSON.stringify(process.env.NEXT_PUBLIC_DISABLE_REMOTE_SAVE || ''),
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
      { protocol: 'https', hostname: 'ik.imagekit.io' },
    ],
  },

  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  },
};

export default nextConfig;
