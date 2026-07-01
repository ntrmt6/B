'use client';

/**
 * PoweredByFooter - Global footer component for tenant storefronts
 *
 * Provides a clean backlink to the root platform (allinbangla.com)
 * for SEO domain equity distribution across all tenant stores.
 *
 * @usage Include this component in your tenant layout files
 */
export default function PoweredByFooter() {
  return (
    <footer className="w-full border-t border-gray-200 bg-gray-50 py-4 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-gray-600">
          <span>E-commerce platform</span>
          <a
            href="https://allinbangla.com"
            rel="noopener noreferrer"
            target="_blank"
            className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
          >
            Powered by AllInBangla
          </a>
          <span className="hidden sm:inline">|</span>
          <a
            href="https://free-ecommerce.allinbangla.com/"
            title="Create Free E-Commerce Website in Bangladesh"
            className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
          >
            Free E-Commerce Builder
          </a>
        </div>
      </div>
    </footer>
  );
}
