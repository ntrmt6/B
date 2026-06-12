/**
 * GadgetsThemePage – Dynamic version of StoreFrontTheme2 (Gadgets Theme)
 * 
 * Exact same Figma design (lime-green accent, orange buy-now, rounded cards,
 * category grid, time counter, View All links, desktop/mobile responsive),
 * but powered by the shared data engine (products, categories, websiteConfig).
 */

import React, { memo, useMemo, useCallback, lazy, Suspense } from 'react';
import { ChevronRight } from 'lucide-react';
import type { Product } from '../../../types';
import { LazySection } from '../LazySection';
import { GadgetsThemeProps, slugify } from './constants';
// Above-fold: keep eager
import { GadgetHero } from './GadgetHero';
import { GadgetCategoryCard } from './GadgetCategoryCard';

// Below-fold components: lazy-loaded so their JS only loads when scrolled into view
const GadgetProductSection = lazy(() => import('./GadgetProductSection').then(m => ({ default: m.GadgetProductSection })));
const GadgetFooter = lazy(() => import('./GadgetFooter').then(m => ({ default: m.GadgetFooter })));

export const GadgetsThemePage: React.FC<GadgetsThemeProps> = memo(({
  products,
  categories,
  brands,
  websiteConfig,
  logo,
  tags,
  onProductClick,
  onBuyNow,
  onAddToCart,
  onCategoryClick,
  onOpenChat,
}) => {
  const active = useMemo(() => products.filter(p => p.status === 'Active' || !p.status), [products]);

  const flashSaleProducts = useMemo(() =>
    active.filter(p => p.flashSale).slice(0, 10),
  [active]);

  // Active tags from admin — each shows its own product section with optional countdown
  const activeTags = useMemo(() =>
    (tags || []).filter(t => !t.status || t.status === 'Active' || t.status?.toLowerCase() === 'active'),
  [tags]);

  const activeCategories = useMemo(() =>
    categories.filter(c => c.status === 'Active' || !c.status).slice(0, 8),
  [categories]);

  const handleAddToCart = useCallback((p: Product) => onAddToCart?.(p, 1, {}), [onAddToCart]);
  const handleBuyNow = useCallback((p: Product) => onBuyNow?.(p), [onBuyNow]);

  return (
    <main className="text-black text-base font-normal bg-gray-100 overflow-x-hidden scroll-smooth w-full font-sans md:bg-transparent">
      <div>
        {/* Hero Carousel */}
        <div className="min-h-[118px] mb-3 md:min-h-0 md:mb-0">
          <GadgetHero websiteConfig={websiteConfig} />

          {/* Categories */}
          {activeCategories.length > 0 && (
            <div>
              <div className="bg-white max-w-[1340px] w-[92%] mt-0 mx-auto pt-0 pb-[6px] px-[8px] rounded-[10px] md:bg-transparent md:w-[95%] md:mt-1 md:pt-1 md:pb-0 md:px-0 md:rounded-none">
                <div className="items-center flex h-[38px] justify-between leading-[38px]">
                  <h2 className="text-neutral-900 text-base font-bold leading-[18px] md:text-neutral-700 md:text-[22px] md:font-medium md:leading-[38px] whitespace-nowrap">
                    Categories
                  </h2>
                  <a href="/categories" className="text-black text-[13px] font-medium items-center flex leading-[15px] md:text-zinc-800 md:text-base md:leading-[38px] cursor-pointer hover:text-lime-500">
                    View All
                    <ChevronRight size={20} className="ml-0 md:ml-2" />
                  </a>
                </div>
                <div className="gap-x-[6px] grid grid-cols-[repeat(2,1fr)] gap-y-[6px] md:gap-x-[10px] md:grid-cols-[repeat(8,1fr)] md:gap-y-[10px]">
                  {activeCategories.map((cat: any) => (
                    <GadgetCategoryCard
                      key={cat.id || cat.name}
                      category={cat}
                      onClick={() => onCategoryClick?.(cat.slug || slugify(cat.name))}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Admin-created tag sections (appear first) ── */}
          <LazySection fallback={<div style={{ minHeight: '400px' }} />} rootMargin="0px 0px 300px" minHeight="400px">
            <Suspense fallback={null}>
              {activeTags.map(tag => {
                const tagProducts = active.filter(p =>
                  Array.isArray(p.tags) && p.tags.some((pt: any) =>
                    (typeof pt === 'string' ? pt : pt?.name)?.toLowerCase() === tag.name?.toLowerCase()
                  )
                ).slice(0, 10);
                if (!tagProducts.length) return null;
                return (
                  <GadgetProductSection
                    key={tag.id || tag.name}
                    title={tag.name}
                    products={tagProducts}
                    expiresAt={tag.showCountdown && tag.expiresAt ? tag.expiresAt : undefined}
                    onProductClick={onProductClick}
                    onAddToCart={handleAddToCart}
                    onBuyNow={handleBuyNow}
                  />
                );
              })}
            </Suspense>
          </LazySection>

          {/* ── Flash Sale (only when shop owner explicitly marks products) ── */}
          <LazySection fallback={<div style={{ minHeight: '400px' }} />} rootMargin="0px 0px 300px" minHeight="400px">
            <Suspense fallback={null}>
              {flashSaleProducts.length > 0 && (
                <GadgetProductSection
                  title="Flash Sale"
                  products={flashSaleProducts}
                  onProductClick={onProductClick}
                  onAddToCart={handleAddToCart}
                  onBuyNow={handleBuyNow}
                />
              )}
            </Suspense>
          </LazySection>

        </div>

        {/* Footer */}
        <LazySection fallback={<div style={{ minHeight: '200px' }} />} rootMargin="0px 0px 400px" minHeight="200px">
          <Suspense fallback={null}>
            <GadgetFooter websiteConfig={websiteConfig} logo={logo} onOpenChat={onOpenChat} />
          </Suspense>
        </LazySection>
      </div>
    </main>
  );
});
GadgetsThemePage.displayName = 'GadgetsThemePage';
