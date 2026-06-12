import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from './providers';

export const metadata: Metadata = {
  title: 'Best E-commerce SaaS Platform in Bangladesh | SystemNextIT',
  description: 'Build, manage, and scale your online store with SystemNextIT’s powerful E-commerce SaaS solution. Enjoy seamless payments, inventory management, and 24/7 support.',
  alternates: {
    canonical: process.env.NEXT_PUBLIC_PRIMARY_DOMAIN ? `https://${process.env.NEXT_PUBLIC_PRIMARY_DOMAIN}` : undefined,
  },
  openGraph: {
    title: 'Best E-commerce SaaS Platform in Bangladesh | SystemNextIT',
    description: 'Build, manage, and scale your online store with SystemNextIT’s powerful E-commerce SaaS solution.',
    url: process.env.NEXT_PUBLIC_PRIMARY_DOMAIN ? `https://${process.env.NEXT_PUBLIC_PRIMARY_DOMAIN}` : undefined,
  },
  twitter: {
    card: 'summary_large_image',
  },
};

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const cdnBase = process.env.NEXT_PUBLIC_CDN_BASE_URL || '';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to backend API for faster data fetches */}
        {apiBase && <link rel="preconnect" href={apiBase} />}
        {/* Preconnect to CDN for faster image/asset loads */}
        {cdnBase && <link rel="preconnect" href={cdnBase} />}
        {/* Preconnect to Cloudflare image delivery */}
        <link rel="preconnect" href="https://imagedelivery.net" />
        {/* DNS prefetch for Firebase (loaded lazily on Google sign-in) */}
        <link rel="dns-prefetch" href="https://apis.google.com" />
        <link rel="dns-prefetch" href="https://www.googleapis.com" />
      </head>
      <body className="min-h-screen bg-gray-50 transition-colors duration-300" suppressHydrationWarning>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
