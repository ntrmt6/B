import type { Metadata } from 'next';
import { fetchWebsiteConfig } from '../../lib/tenant';
import StaticPageClient from '../StaticPageClient';

/**
 * ISR: Revalidate the terms page every 300 seconds (5 min).
 * On-demand revalidation handles immediate updates.
 */
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const websiteConfig = await fetchWebsiteConfig();
  const shopName = websiteConfig?.shopName || null;
  const title = shopName ? `Terms & Conditions | ${shopName}` : 'Terms & Conditions';

  return {
    title,
    description: shopName
      ? `Terms and conditions for ${shopName}.`
      : 'Read our terms and conditions.',
  };
}

export default function TermsPage() {
  return <StaticPageClient />;
}
