import type { Metadata } from 'next';
import { fetchWebsiteConfig } from '../../../lib/tenant';
import OfferClient from './OfferClient';

/**
 * ISR: Revalidate offer pages every 60 seconds.
 * On-demand revalidation refreshes this when offers change.
 */
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const websiteConfig = await fetchWebsiteConfig();
  const shopName = websiteConfig?.shopName || null;
  const title = shopName ? `Offer | ${shopName}` : 'Special Offer';

  return {
    title,
    description: shopName
      ? `Check out this special offer from ${shopName}.`
      : 'Check out this special offer.',
  };
}

export default function OfferPage() {
  return <OfferClient />;
}
