import React from 'react';

// Reusable bone component for consistent skeleton styling
const Bone = ({ className = '' }: { className?: string }) => (
  <div className={`bg-gray-200 animate-pulse rounded ${className}`} />
);

// Product card skeleton — structural clone of ProductCardStyle1
// Matches: rounded-xl, border-gray-100/80, aspect-square image, px-1 pb-1 pt-0.5 info, gap-0.5
const ProductCardSkeleton = () => (
  <div
    className="bg-white rounded-xl overflow-hidden flex flex-col border border-gray-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
    style={{ contain: 'layout' }}
  >
    {/* Image — aspect-ratio 1:1 matching actual */}
    <div className="relative bg-gray-50/50 overflow-hidden" style={{ aspectRatio: '1/1' }}>
      <Bone className="w-full h-full rounded-none" />
    </div>
    {/* Info section — matches px-1 pb-1 pt-0.5 gap-0.5 */}
    <div className="px-1 pb-1 pt-0.5 md:px-1 md:pb-1 flex-1 flex flex-col gap-0.5">
      {/* Rating row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-0.5">
          <Bone className="h-2.5 w-2.5 rounded-full" />
          <Bone className="h-2.5 w-6" />
          <Bone className="h-2.5 w-8" />
        </div>
        <Bone className="h-2 w-10" />
      </div>
      {/* Product name — min-h matches actual min-h-[28px] sm:min-h-[32px] md:min-h-[40px] */}
      <div className="min-h-[28px] sm:min-h-[32px] md:min-h-[40px]">
        <Bone className="h-3 md:h-3.5 w-full" />
        <Bone className="h-3 md:h-3.5 w-2/3 mt-0.5 hidden md:block" />
      </div>
      {/* Price row */}
      <div className="flex items-baseline gap-1.5 mt-auto">
        <Bone className="h-4 md:h-5 w-14" />
        <Bone className="h-3 w-10" />
      </div>
      {/* Action buttons placeholder — h-7 md:h-8 */}
      <div className="flex gap-0.5 mt-0.5">
        <Bone className="w-8 h-7 md:h-8 rounded-lg" />
        <Bone className="flex-1 h-7 md:h-8 rounded-lg" />
      </div>
    </div>
  </div>
);

// Generic section skeleton (legacy - still used as fallback)
export const SectionSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-2 py-2">
    <Bone className="h-5 w-40" />
    <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {[...Array(5)].map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

// Flash Sales Section Skeleton — structural clone of FlashSalesSection
// Matches: gradient from-pink-500 via-rose-500 to-orange-500, p-1 sm:p-1.5, gap-0.5
export const FlashSalesSkeleton: React.FC = () => (
  <section className="pt-0.5 pb-0.5 animate-pulse">
    <div className="bg-gradient-to-r from-pink-500/30 via-rose-500/30 to-orange-500/30 rounded-xl sm:rounded-2xl p-px sm:p-0.5 shadow-lg">
      <div className="bg-gray-100 rounded-lg sm:rounded-xl p-1 sm:p-1.5 md:p-1.5">
        {/* Header Row — matches mb-0.5 sm:mb-1 */}
        <div className="flex items-center justify-between mb-0.5 sm:mb-1">
          <div className="flex items-center gap-0.5 sm:gap-1">
            <Bone className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl" />
            <div>
              <Bone className="h-4 sm:h-5 w-20 sm:w-36 mb-0.5" />
              <Bone className="h-3 w-16 hidden sm:block" />
            </div>
          </div>
          {/* Countdown skeleton — mobile */}
          <div className="flex sm:hidden items-center gap-0.5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-0.5">
                <Bone className="h-5 w-6 rounded px-1 py-0.5" />
                {i < 2 && <span className="text-gray-300 text-[9px]">:</span>}
              </div>
            ))}
          </div>
          {/* Countdown skeleton — desktop */}
          <div className="hidden sm:flex items-center gap-1.5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <Bone className="h-10 w-11 rounded-lg" />
                {i < 2 && <span className="text-gray-300 text-xs">:</span>}
              </div>
            ))}
          </div>
          <Bone className="h-6 sm:h-8 w-10 sm:w-16 rounded-full" />
        </div>
        {/* Product Cards Horizontal Scroll — matches gap-0.5 sm:gap-0.5 md:gap-1 */}
        <div className="flex gap-0.5 sm:gap-0.5 md:gap-1 overflow-hidden pb-0.5 sm:pb-0.5 px-px sm:px-0.5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[120px] xs:w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px]">
              <div className="bg-white rounded-lg sm:rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                <Bone className="aspect-square rounded-none" />
                <div className="p-0.5 sm:p-1 md:p-1.5 space-y-0.5 sm:space-y-1">
                  <Bone className="h-2.5 w-10" />
                  <Bone className="h-3 sm:h-3.5 w-full" />
                  <Bone className="h-3 sm:h-3.5 w-2/3" />
                  <Bone className="h-6 sm:h-7 w-full rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Progress dots — matches gap-0.5 */}
        <div className="flex justify-center gap-0.5 sm:gap-0.5 mt-1">
          {[...Array(4)].map((_, i) => (
            <Bone key={i} className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${i === 0 ? 'bg-gray-300' : ''}`} />
          ))}
        </div>
      </div>
    </div>
  </section>
);

// Showcase Section Skeleton - matches carousel/featured products layout
export const ShowcaseSkeleton: React.FC = () => (
  <section className="py-2 px-0.5 sm:px-1 animate-pulse">
    {/* Header */}
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <Bone className="w-8 h-8 rounded-xl" />
        <Bone className="h-5 w-36" />
      </div>
      <div className="flex gap-1.5">
        <Bone className="w-8 h-8 rounded-full" />
        <Bone className="w-8 h-8 rounded-full" />
      </div>
    </div>
    {/* Carousel */}
    <div className="flex gap-2 sm:gap-3 overflow-hidden pb-1">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex-shrink-0 w-[160px] sm:w-[200px] md:w-[220px]">
          <ProductCardSkeleton />
        </div>
      ))}
    </div>
  </section>
);

// Brand Section Skeleton - matches horizontal brand logos/cards
export const BrandSkeleton: React.FC = () => (
  <section className="py-2 px-0.5 sm:px-1 animate-pulse">
    {/* Header */}
    <div className="flex items-center gap-2 mb-2">
      <Bone className="w-8 h-8 rounded-xl" />
      <Bone className="h-5 w-32" />
    </div>
    {/* Brand Logos Horizontal Scroll */}
    <div className="flex gap-2 sm:gap-3 lg:gap-4 overflow-hidden">
      {[...Array(8)].map((_, i) => (
        <Bone key={i} className="flex-shrink-0 w-24 h-16 sm:w-32 sm:h-20 rounded-xl" />
      ))}
    </div>
  </section>
);

// Product Grid Section Skeleton — matches product grid with header bar
export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 10 }) => (
  <section className="py-2 animate-pulse">
    {/* Header bar — matches actual bg-white/80 backdrop-blur */}
    <div className="bg-white/80 backdrop-blur-lg border border-gray-100 rounded-xl p-2.5 md:p-3 mb-2 shadow-sm flex items-center gap-2">
      <Bone className="h-5 w-1 rounded-full" />
      <Bone className="h-4 w-36" />
    </div>
    {/* Product Grid — matches grid-cols-2 gap-2 sm:gap-3 md:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 */}
    <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {[...Array(count)].map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  </section>
);

// Search Results Section Skeleton - matches search results with filter header
export const SearchResultsSkeleton: React.FC = () => (
  <section className="rounded-2xl border border-gray-100 bg-white p-3 sm:p-5 shadow-sm animate-pulse">
    {/* Header */}
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1 min-w-0 space-y-1.5">
        <Bone className="h-3 w-12" />
        <Bone className="h-5 w-44 sm:w-56" />
        <Bone className="h-3.5 w-48" />
      </div>
      <div className="flex items-center gap-2">
        <Bone className="h-9 w-28 rounded-lg" />
        <Bone className="h-9 w-18 rounded-full" />
      </div>
    </div>
    {/* Product Grid */}
    <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-5">
      {[...Array(10)].map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  </section>
);

// Footer skeleton — structural clone of StoreFooter (dark theme, rounded-t)
// Matches: bg-black, rounded-t-[112px] desktop / rounded-t-[48px] mobile, max-w-[1720px]
export const FooterSkeleton: React.FC = () => (
  <footer className="w-full mt-auto">
    <div className="mx-auto max-w-[1720px] bg-gray-900 rounded-t-[48px] md:rounded-t-[112px] px-6 md:px-20 pt-10 md:pt-14 pb-6 animate-pulse">
      {/* Top row — logo + link columns */}
      <div className="hidden md:flex flex-row items-start justify-between gap-8">
        {/* Logo / brand */}
        <div className="flex flex-col gap-4 max-w-[220px]">
          <Bone className="h-8 w-[140px] rounded bg-gray-700" />
          <Bone className="h-3 w-full rounded bg-gray-800" />
          <Bone className="h-3 w-4/5 rounded bg-gray-800" />
          <div className="flex gap-2 mt-2">
            {[...Array(4)].map((_, i) => (
              <Bone key={i} className="w-8 h-8 rounded-full bg-gray-700" />
            ))}
          </div>
        </div>
        {/* Link columns */}
        {[...Array(3)].map((_, col) => (
          <div key={col} className="space-y-3">
            <Bone className="h-4 w-24 rounded bg-gray-700" />
            {[...Array(4)].map((_, j) => (
              <Bone key={j} className="h-3 w-20 rounded bg-gray-800" />
            ))}
          </div>
        ))}
      </div>
      {/* Mobile layout */}
      <div className="md:hidden space-y-4">
        <Bone className="h-8 w-[120px] rounded bg-gray-700 mx-auto" />
        <Bone className="h-3 w-3/4 rounded bg-gray-800 mx-auto" />
        <div className="flex justify-center gap-2">
          {[...Array(4)].map((_, i) => (
            <Bone key={i} className="w-8 h-8 rounded-full bg-gray-700" />
          ))}
        </div>
      </div>
      {/* Bottom divider + copyright */}
      <div className="mt-8 pt-4 border-t border-gray-800">
        <Bone className="h-3 w-48 rounded bg-gray-800 mx-auto" />
      </div>
    </div>
  </footer>
);
