import type { Metadata } from 'next';
import { fetchWebsiteConfig } from '../../lib/tenant';
import StaticPageClient from '../StaticPageClient';

/**
 * ISR: Revalidate the about page every 300 seconds (5 min).
 * On-demand revalidation handles immediate updates.
 */
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const websiteConfig = await fetchWebsiteConfig();
  const shopName = websiteConfig?.shopName || null;
  const title = shopName ? `About Us | ${shopName}` : 'About Us';

  return {
    title,
    description: shopName
      ? `Learn more about ${shopName}.`
      : 'Learn more about our store.',
  };
}

export default function AboutPage() {
  return <StaticPageClient />;
}
