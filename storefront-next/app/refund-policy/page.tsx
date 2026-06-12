import type { Metadata } from 'next';
import { fetchWebsiteConfig } from '../../lib/tenant';
import StaticPageClient from '../StaticPageClient';

/**
 * ISR: Revalidate the refund policy page every 300 seconds (5 min).
 * On-demand revalidation handles immediate updates.
 */
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const websiteConfig = await fetchWebsiteConfig();
  const shopName = websiteConfig?.shopName || null;
  const title = shopName ? `Refund Policy | ${shopName}` : 'Refund Policy';

  return {
    title,
    description: shopName
      ? `Refund policy for ${shopName}.`
      : 'Read our refund policy.',
  };
}

export default function RefundPolicyPage() {
  return <StaticPageClient />;
}
