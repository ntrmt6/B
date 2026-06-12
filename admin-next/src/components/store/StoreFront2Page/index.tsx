/**
 * StoreFront2Page – Visual Variant #2
 * Same data engine as StoreFront1, completely different layout & style.
 *
 * Design language:
 *  - Deep indigo (#1e1b4b) + coral-orange (#f97316) accent
 *  - Sidebar category nav on desktop, top pill-scroll on mobile
 *  - Wide hero with gradient overlay + split content
 *  - Masonry-style featured grid
 *  - Horizontal scroll product rows
 *  - Countdown "Deal of the Day" strip
 *  - Minimalist card with hover lift
 *  - Clean footer with newsletter CTA
 */

import React, { memo, useMemo, useCallback, lazy, Suspense } from 'react';
import type { Product } from '../../../types';
import { LazySection } from '../LazySection';
import { calcDiscount } from '../storefrontShared';
import { StoreFront2Props } from './constants';
// Above-fold: keep eager
import { SF2Hero } from './SF2Hero';
import { TrustBanner } from './SF2TrustBanner';
import { PromoBanner } from './SF2PromoBanner';

// Below-fold components: lazy-loaded so their JS only loads when scrolled into view
const DealStrip = lazy(() => import('./SF2DealStrip').then(m => ({ default: m.DealStrip })));
const FeaturedMasonry = lazy(() => import('./SF2FeaturedMasonry').then(m => ({ default: m.FeaturedMasonry })));
const CategorySection = lazy(() => import('./SF2CategorySection').then(m => ({ default: m.CategorySection })));
const HScrollRow = lazy(() => import('./SF2HScrollRow').then(m => ({ default: m.HScrollRow })));
const SF2Footer = lazy(() => import('./SF2Footer').then(m => ({ default: m.SF2Footer })));

// ─── Main Component ────────────────────────────────────────────────────────────
export const StoreFront2Page: React.FC<StoreFront2Props> = memo(({
  products,
  categories,
  brands,
  websiteConfig,
  logo,
  onProductClick,
  onBuyNow,
  onAddToCart,
  onCategoryClick,
  onOpenChat,
}) => {
  const activeProducts = useMemo(
    () => products.filter((p) => p.status === 'Active' || !p.status),
    [products]
  );

  // Product sections
  const newArrivals = useMemo(() => [...activeProducts].slice(0, 10), [activeProducts]);
  const topRated = useMemo(
    () => [...activeProducts].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 10),
    [activeProducts]
  );
  const bestSelling = useMemo(
    () => [...activeProducts].sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0)).slice(0, 10),
    [activeProducts]
  );
  const dealProduct = useMemo(() => {
    // Pick product with highest discount
    return [...activeProducts].sort((a, b) => {
      const discA = a.price && a.salePrice ? calcDiscount(a.price, a.salePrice) : 0;
      const discB = b.price && b.salePrice ? calcDiscount(b.price, b.salePrice) : 0;
      return discB - discA;
    })[0] || activeProducts[0];
  }, [activeProducts]);

  const handleAddToCart = useCallback(
    (p: Product) => { onAddToCart?.(p, 1, {}); },
    [onAddToCart]
  );
  const handleBuyNow = useCallback(
    (p: Product) => { onBuyNow?.(p); },
    [onBuyNow]
  );

  return (
    <div
      className="bg-white min-h-screen"
      style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
    >
      {/* Inter font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
        rel="stylesheet"
      />

      {/* Hero */}
      <SF2Hero
        websiteConfig={websiteConfig}
        categories={categories}
        products={activeProducts}
        onCategoryClick={onCategoryClick}
        onProductClick={onProductClick}
      />

      {/* Trust Banner */}
      <TrustBanner />

      {/* Promo banners (new arrivals highlight) */}
      <PromoBanner products={activeProducts.slice(1, 4)} onProductClick={onProductClick} />

      {/* Deal of the Day */}
      <LazySection fallback={<div style={{ minHeight: '200px' }} />} rootMargin="0px 0px 300px" minHeight="200px">
        <Suspense fallback={null}>
          {dealProduct && (
            <DealStrip
              dealProduct={dealProduct}
              onProductClick={onProductClick}
              onBuyNow={handleBuyNow}
            />
          )}
        </Suspense>
      </LazySection>

      {/* Featured Masonry */}
      <LazySection fallback={<div style={{ minHeight: '400px' }} />} rootMargin="0px 0px 300px" minHeight="400px">
        <Suspense fallback={null}>
          <FeaturedMasonry
            products={activeProducts.slice(0, 5)}
            onProductClick={onProductClick}
          />
        </Suspense>
      </LazySection>

      {/* Category Sidebar + Grid */}
      <LazySection fallback={<div style={{ minHeight: '400px' }} />} rootMargin="0px 0px 300px" minHeight="400px">
        <Suspense fallback={null}>
          <CategorySection
            categories={categories}
            products={activeProducts}
            onCategoryClick={onCategoryClick}
            onProductClick={onProductClick}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
          />
        </Suspense>
      </LazySection>

      {/* New Arrivals horizontal row */}
      <LazySection fallback={<div style={{ minHeight: '300px' }} />} rootMargin="0px 0px 300px" minHeight="300px">
        <Suspense fallback={null}>
          <HScrollRow
            title="New Arrivals"
            subtitle="Just Dropped"
            products={newArrivals}
            onProductClick={onProductClick}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            accentColor="#a855f7"
          />
        </Suspense>
      </LazySection>

      {/* Top Rated horizontal row */}
      <LazySection fallback={<div style={{ minHeight: '300px' }} />} rootMargin="0px 0px 300px" minHeight="300px">
        <Suspense fallback={null}>
          <HScrollRow
            title="Top Rated"
            subtitle="Customer Favourites"
            products={topRated}
            onProductClick={onProductClick}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            accentColor="#22c55e"
          />
        </Suspense>
      </LazySection>

      {/* Best Selling horizontal row */}
      <LazySection fallback={<div style={{ minHeight: '300px' }} />} rootMargin="0px 0px 300px" minHeight="300px">
        <Suspense fallback={null}>
          <HScrollRow
            title="Best Sellers"
            subtitle="Flying off the shelves"
            products={bestSelling}
            onProductClick={onProductClick}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
          />
        </Suspense>
      </LazySection>

      {/* Footer */}
      <LazySection fallback={<div style={{ minHeight: '200px' }} />} rootMargin="0px 0px 400px" minHeight="200px">
        <Suspense fallback={null}>
          <SF2Footer logo={logo} websiteConfig={websiteConfig} />
        </Suspense>
      </LazySection>
    </div>
  );
});

StoreFront2Page.displayName = 'StoreFront2Page';
export default StoreFront2Page;
