import type { Metadata } from 'next';
import { fetchWebsiteConfig } from '../../lib/tenant';
import CategoriesClient from './CategoriesClient';

/**
 * ISR: Revalidate the categories page every 60 seconds.
 * On-demand revalidation refreshes this when categories or products change.
 */
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const websiteConfig = await fetchWebsiteConfig();
  const shopName = websiteConfig?.shopName || null;
  const title = shopName ? `Categories | ${shopName}` : 'Categories';

  return {
    title,
    description: shopName
      ? `Browse product categories at ${shopName}.`
      : 'Browse all product categories.',
  };
}

export default function CategoriesPage() {
  return <CategoriesClient />;
}
