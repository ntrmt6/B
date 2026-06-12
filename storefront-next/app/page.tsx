import { Suspense } from 'react';
import type { Metadata } from 'next';
import { fetchWebsiteConfig } from '../lib/tenant';
import StoreHomeClient, { StorePageSkeleton } from './store-home-client';

/**
 * ISR: Revalidate the home page every 60 seconds.
 * On-demand revalidation via /api/revalidate overrides this when
 * the backend notifies of product/theme/config changes.
 */
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const websiteConfig = await fetchWebsiteConfig();
  const googleSiteVerification = websiteConfig?.googleSiteVerification;

  if (!googleSiteVerification) {
    return {};
  }

  return {
    verification: {
      google: googleSiteVerification,
    },
  };
}

export default function HomePage() {
  return (
    <Suspense fallback={<StorePageSkeleton />}>
      <StoreHomeClient />
    </Suspense>
  );
}
