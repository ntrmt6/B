import type { Metadata } from 'next';
import { fetchWebsiteConfig } from '../../lib/tenant';
import StaticPageClient from '../StaticPageClient';

/**
 * ISR: Revalidate policy pages every 300 seconds (5 min).
 * Policy content changes infrequently, on-demand revalidation handles
 * immediate updates when the admin edits these pages.
 */
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const websiteConfig = await fetchWebsiteConfig();
  const shopName = websiteConfig?.shopName || null;
  const title = shopName ? `Privacy Policy | ${shopName}` : 'Privacy Policy';

  return {
    title,
    description: shopName
      ? `Privacy policy for ${shopName}.`
      : 'Read our privacy policy.',
  };
}

export default function PrivacyPage() {
  return <StaticPageClient />;
}
