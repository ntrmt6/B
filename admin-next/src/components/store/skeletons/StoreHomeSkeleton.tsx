import React from 'react';
import { SectionSkeleton, FlashSalesSkeleton, FooterSkeleton } from './StoreSectionSkeletons';

// Bone helper — consistent with StoreSectionSkeletons
const Bone = ({ className = '' }: { className?: string }) => (
  <div className={`bg-gray-200 animate-pulse rounded ${className}`} />
);

/**
 * StoreHomeSkeleton — structural clone of StoreHome + StoreHeader + HeroSection + CategoriesSection
 *
 * Key dimensions matched from actual components:
 *  - Outer: min-h-screen, font-sans, text-slate-900, white background
 *  - Header: w-full, bg-white, shadow-sm, sticky top-0 z-50
 *  - Hero: max-w-[1720px], aspect-ratio 20/6 mobile → 16/4.8 desktop
 *  - Categories: pills with gap-0.5, py-0.5
 *  - Main: max-w-[1720px], px-0.5 sm:px-1 lg:px-1.5, space-y-0.5 sm:space-y-1
 */
export const StoreHomeSkeleton: React.FC = () => (
  <div className="min-h-screen font-sans text-slate-900" style={{ background: '#ffffff' }}>
    {/* Skeleton for StoreHeader — matches sticky top-0 z-50, w-full, bg-white, shadow-sm */}
    <header className="w-full bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-[1720px] mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-14 sm:h-16 animate-pulse">
          {/* Logo */}
          <Bone className="h-8 w-24 sm:w-28 rounded" />
          {/* Search bar — hidden on mobile */}
          <Bone className="h-10 flex-1 max-w-xl rounded-full mx-4 hidden md:block" />
          {/* Action icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Bone className="h-8 w-8 sm:h-9 sm:w-9 rounded-full" />
            <Bone className="h-8 w-8 sm:h-9 sm:w-9 rounded-full" />
            <Bone className="h-8 w-8 sm:h-9 sm:w-9 rounded-full" />
          </div>
        </div>
      </div>
    </header>

    {/* Skeleton for HeroSection — matches max-w-[1720px], aspect-ratio, gap-4, px-2 md:px-4 lg:px-0 */}
    <section className="w-full">
      <div className="flex gap-4 max-w-[1720px] mx-auto pb-1 px-2 md:px-4 lg:px-0 animate-pulse">
        {/* Main carousel — aspect-ratio: 20/6 mobile, 16/4.8 desktop */}
        <div
          className="flex-1 bg-gray-200 rounded-lg sm:rounded-xl overflow-hidden"
          style={{ aspectRatio: '20/6', maxHeight: '500px' }}
        />
        {/* Upcoming campaigns sidebar — desktop only */}
        <div className="hidden lg:flex flex-col w-64 flex-shrink-0">
          <div className="bg-gray-50 rounded-xl p-4 h-full max-h-[400px] space-y-3">
            <Bone className="h-5 w-32" />
            {[...Array(3)].map((_, i) => (
              <Bone key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* Skeleton for CategoriesSection — matches pill carousel with gap-0.5, pt-0.5 pb-0.5 */}
    <section className="relative pt-0.5 sm:pt-0.5 pb-0.5 sm:pb-0.5 overflow-hidden animate-pulse">
      <div className="flex items-center justify-between mb-0.5 sm:mb-1 px-0.5">
        <Bone className="h-5 sm:h-6 w-24" />
      </div>
      <div className="overflow-hidden">
        <div className="flex gap-0.5 px-0.5">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full bg-white border border-gray-100 shadow-sm"
            >
              <Bone className="w-7 h-7 sm:w-9 sm:h-9 rounded-full" />
              <Bone className="h-3 w-12 sm:w-16" />
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Skeletons for Product Sections — matches max-w-[1720px], px-0.5 sm:px-1 lg:px-1.5, space-y-0.5 sm:space-y-1 */}
    <main className="max-w-[1720px] mx-auto px-0.5 sm:px-1 lg:px-1.5 space-y-0.5 sm:space-y-1 pb-4" style={{ minHeight: '680px' }}>
      <FlashSalesSkeleton />
      <SectionSkeleton />
      <SectionSkeleton />
    </main>

    {/* Skeleton for Footer */}
    <FooterSkeleton />
  </div>
);

export default StoreHomeSkeleton;
