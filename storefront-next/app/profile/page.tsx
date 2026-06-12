import type { Metadata } from 'next';
import { fetchWebsiteConfig } from '../../lib/tenant';
import ProfileClient from './ProfileClient';

/**
 * ISR: Revalidate the profile page shell every 300 seconds (5 min).
 * Profile content is user-specific (loaded client-side), but the page
 * shell and metadata benefit from static caching.
 */
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const websiteConfig = await fetchWebsiteConfig();
  const shopName = websiteConfig?.shopName || null;
  const title = shopName ? `My Profile | ${shopName}` : 'My Profile';

  return {
    title,
    description: shopName
      ? `Manage your account at ${shopName}.`
      : 'Manage your account.',
  };
}

export default function ProfilePage() {
  return <ProfileClient />;
}
