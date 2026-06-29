'use client';

import { ReactNode } from 'react';
import PoweredByFooter from './PoweredByFooter';
import CanonicalHead from './CanonicalHead';

interface TenantSeoLayoutProps {
  children: ReactNode;
  showPoweredBy?: boolean;
}

/**
 * TenantSeoLayout - Wrapper component for tenant storefront pages
 *
 * Automatically includes:
 * - Dynamic canonical URL tag for the current page
 * - "Powered by AllInBangla" footer with backlink
 *
 * @usage Wrap your tenant page content with this component
 *
 * @example
 * // In a tenant page or layout
 * import { TenantSeoLayout } from '@/app/components/seo';
 *
 * export default function TenantPage() {
 *   return (
 *     <TenantSeoLayout>
 *       <Header />
 *       <main>Your content here</main>
 *     </TenantSeoLayout>
 *   );
 * }
 */
export default function TenantSeoLayout({
  children,
  showPoweredBy = true,
}: TenantSeoLayoutProps) {
  return (
    <>
      {/* Inject dynamic canonical URL */}
      <CanonicalHead />

      {/* Page content */}
      <div className="min-h-screen flex flex-col">
        <div className="flex-1">{children}</div>

        {/* Platform backlink footer */}
        {showPoweredBy && <PoweredByFooter />}
      </div>
    </>
  );
}
