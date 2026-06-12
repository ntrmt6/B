import LandingPageClient from './LandingPageClient';

/**
 * ISR: Revalidate landing pages every 60 seconds.
 * On-demand revalidation refreshes this when landing pages are updated.
 */
export const revalidate = 60;

export default function LandingPage() {
  return <LandingPageClient />;
}
