import React, { memo, useMemo, useCallback, lazy, Suspense } from 'react';
import type { Product } from '../../../types';
import { LazySection } from '../LazySection';
import { StoreFrontThemeProps } from './constants';
import { HeroBanner } from './SFHeroBanner';
import { PromoGrid } from './SFPromoGrid';
import { SectionHeader } from './SFSectionHeader';
import { SFProductCard } from './SFProductCard';

// Below-fold components: lazy-loaded so their JS only loads when scrolled into view
const FeaturedCategories = lazy(() => import('./SFFeaturedCategories').then(m => ({ default: m.FeaturedCategories })));
const BestSellingSection = lazy(() => import('./SFBestSellingSection').then(m => ({ default: m.BestSellingSection })));
const CustomerReviews = lazy(() => import('./SFCustomerReviews').then(m => ({ default: m.CustomerReviews })));
const CTASection = lazy(() => import('./SFCTASection').then(m => ({ default: m.CTASection })));
const SFFooter = lazy(() => import('./SFFooter').then(m => ({ default: m.SFFooter })));

// Main StoreFront Theme Page
export const StoreFrontThemePage: React.FC<StoreFrontThemeProps> = memo(({
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
  const activeProducts = useMemo(() =>
    products.filter(p => p.status === 'Active' || !p.status)
  , [products]);

  const trendingProducts = useMemo(() =>
    [...activeProducts].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 8)
  , [activeProducts]);

  const bestSelling = useMemo(() =>
    [...activeProducts].sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0)).slice(0, 8)
  , [activeProducts]);

  const newArrivals = useMemo(() =>
    [...activeProducts].slice(0, 4)
  , [activeProducts]);

  const handleAddToCart = useCallback((p: Product) => {
    onAddToCart?.(p, 1, {});
  }, [onAddToCart]);

  return (
    <div className="bg-white min-h-screen" style={{ fontFamily: "'Lato', sans-serif", zoom: 1 }}>
      {/* Google Font */}
      <link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap" rel="stylesheet" />

      {/* Hero Banner */}
      <HeroBanner websiteConfig={websiteConfig} categories={categories} onCategoryClick={onCategoryClick} />

      {/* Promotional Grid */}
      <PromoGrid products={newArrivals} onProductClick={onProductClick} />

      {/* Trending Products */}
      <LazySection fallback={<div style={{ minHeight: '400px' }} />} rootMargin="0px 0px 300px" minHeight="400px">
        {trendingProducts.length > 0 && (
          <section className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
            <SectionHeader title="Trending Product" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {trendingProducts.map(p => (
                <SFProductCard key={p.id} product={p} onClick={() => onProductClick(p)} onAddToCart={() => handleAddToCart(p)} />
              ))}
            </div>
          </section>
        )}
      </LazySection>

      {/* Featured Categories */}
      <LazySection fallback={<div style={{ minHeight: '300px' }} />} rootMargin="0px 0px 300px" minHeight="300px">
        <Suspense fallback={null}>
          <FeaturedCategories categories={categories} onCategoryClick={onCategoryClick} />
        </Suspense>
      </LazySection>

      {/* Best Selling Products */}
      <LazySection fallback={<div style={{ minHeight: '400px' }} />} rootMargin="0px 0px 300px" minHeight="400px">
        <Suspense fallback={null}>
          <BestSellingSection products={bestSelling} onProductClick={onProductClick} />
        </Suspense>
      </LazySection>

      {/* Limited-Time Deal */}
      <LazySection fallback={<div style={{ minHeight: '400px' }} />} rootMargin="0px 0px 300px" minHeight="400px">
        {activeProducts.length > 8 && (
          <section className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
            <SectionHeader title="Limited-Time Deal" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {activeProducts.slice(8, 16).map(p => (
                <SFProductCard key={p.id} product={p} onClick={() => onProductClick(p)} onAddToCart={() => handleAddToCart(p)} />
              ))}
            </div>
          </section>
        )}
      </LazySection>

      {/* Customer Reviews */}
      <LazySection fallback={<div style={{ minHeight: '300px' }} />} rootMargin="0px 0px 300px" minHeight="300px">
        <Suspense fallback={null}>
          <CustomerReviews />
        </Suspense>
      </LazySection>

      {/* Call to Action */}
      <LazySection fallback={<div style={{ minHeight: '200px' }} />} rootMargin="0px 0px 300px" minHeight="200px">
        <Suspense fallback={null}>
          <CTASection />
        </Suspense>
      </LazySection>

      {/* Footer */}
      <LazySection fallback={<div style={{ minHeight: '200px' }} />} rootMargin="0px 0px 400px" minHeight="200px">
        <Suspense fallback={null}>
          <SFFooter logo={logo} websiteConfig={websiteConfig} />
        </Suspense>
      </LazySection>
    </div>
  );
});

StoreFrontThemePage.displayName = 'StoreFrontThemePage';
export default StoreFrontThemePage;
