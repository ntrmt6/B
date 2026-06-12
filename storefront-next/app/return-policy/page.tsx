import type { Metadata } from 'next';
import { fetchWebsiteConfig } from '../../lib/tenant';
import StaticPageClient from '../StaticPageClient';

/**
 * ISR: Revalidate the return policy page every 300 seconds (5 min).
 * On-demand revalidation handles immediate updates.
 */
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const websiteConfig = await fetchWebsiteConfig();
  const shopName = websiteConfig?.shopName || null;
  const title = shopName ? `Return Policy | ${shopName}` : 'Return Policy';

  return {
    title,
    description: shopName
      ? `Return policy for ${shopName}.`
      : 'Read our return policy.',
  };
}

export default function ReturnPolicyPage() {
  return <StaticPageClient />;
}
