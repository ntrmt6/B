import type { Metadata } from 'next';
import { fetchWebsiteConfig } from '../../lib/tenant';
import CheckoutClient from './CheckoutClient';

/**
 * ISR: Revalidate the checkout page shell every 300 seconds (5 min).
 * Checkout content is user-specific (loaded client-side), but the page
 * shell and metadata benefit from static caching.
 */
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const websiteConfig = await fetchWebsiteConfig();
  const shopName = websiteConfig?.shopName || null;
  const title = shopName ? `Checkout | ${shopName}` : 'Checkout';

  return {
    title,
    description: shopName
      ? `Complete your purchase at ${shopName}.`
      : 'Complete your purchase.',
  };
}

export default function CheckoutPage() {
  return <CheckoutClient />;
}
