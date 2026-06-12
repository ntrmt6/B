import React, { Suspense, lazy } from 'react';
import type { Product, WebsiteConfig } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import type { SortOption } from '../ProductFilter';
import { HeroSection } from './HeroSection';
import { CategoriesSection } from './CategoriesSection';
import {
  FooterSkeleton,
  FlashSalesSkeleton,
  ShowcaseSkeleton,
  BrandSkeleton,
  ProductGridSkeleton,
  SearchResultsSkeleton,
} from './skeletons';

// Near-fold lazy components
const FlashSalesSection = lazy(() => import('./FlashSalesSection').then(m => ({ default: m.FlashSalesSection })));
const ProductGridSection = lazy(() => import('./ProductGridSection').then(m => ({ default: m.ProductGridSection })));
const ShowcaseSection = lazy(() => import('./ShowcaseSection').then(m => ({ default: m.ShowcaseSection })));
const BrandSection = lazy(() => import('./BrandSection').then(m => ({ default: m.BrandSection })));
const LazySection = lazy(() => import('./LazySection').then(m => ({ default: m.LazySection })));
const StoreFooter = lazy(() => import('./StoreFooter').then(m => ({ default: m.StoreFooter })));
const SearchResultsSection = lazy(() => import('./SearchResultsSection').then(m => ({ default: m.SearchResultsSection })));
const TagProductSections = lazy(() => import('./TagProductSections').then(m => ({ default: m.TagProductSections })));

interface StoreHomeDefaultLayoutProps {
  // Data
  websiteConfig?: WebsiteConfig;
  displayCategories: any[];
  flashSalesProducts: Product[];
  bestSaleProducts: Product[];
  popularProducts: Product[];
  activeProducts: Product[];
  sortedProducts: Product[];
  brands?: any[];
  tags?: any[];
  logo?: string | null;
  tenantId?: string;

  // Search
  hasSearchQuery: boolean;
  searchTerm: string;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
  onClearSearch: () => void;

  // Flash sale
  showFlashSaleCounter: boolean;
  flashSaleCountdown: { label: string; value: string }[];

  // Refs
  categoriesSectionRef: React.RefObject<HTMLElement>;
  productsSectionRef: React.RefObject<HTMLElement>;
  categoryScrollRef: React.RefObject<HTMLDivElement>;

  // Handlers
  onProductClick: (p: Product) => void;
  onBuyNow: (p: Product) => void;
  onQuickView: (p: Product | null) => void;
  onAddToCart: (p: Product) => void;
  onCategoryClick: (category: string) => void;
  wishlist: number[];
  onToggleWishlist: (id: number) => void;
  onOpenChat?: () => void;
}

export const StoreHomeDefaultLayout: React.FC<StoreHomeDefaultLayoutProps> = ({
  websiteConfig,
  displayCategories,
  flashSalesProducts,
  bestSaleProducts,
  popularProducts,
  activeProducts,
  sortedProducts,
  brands,
  tags,
  logo,
  tenantId,
  hasSearchQuery,
  searchTerm,
  sortOption,
  onSortChange,
  onClearSearch,
  showFlashSaleCounter,
  flashSaleCountdown,
  categoriesSectionRef,
  productsSectionRef,
  categoryScrollRef,
  onProductClick,
  onBuyNow,
  onQuickView,
  onAddToCart,
  onCategoryClick,
  wishlist,
  onToggleWishlist,
  onOpenChat,
}) => {
  const { t } = useLanguage();

  return (
    <>
      {/* Hero Section */}
      <section className="max-w-[1720px] mx-auto px-0.5 sm:px-1 lg:px-1.5 pt-0.5">
        <HeroSection carouselItems={websiteConfig?.carouselItems} websiteConfig={websiteConfig} />
      </section>

      {/* Categories Section */}
      {displayCategories.length > 0 && (
        <section ref={categoriesSectionRef} className="max-w-[1720px] mx-auto px-0.5 sm:px-1 lg:px-1.5">
          <CategoriesSection
            style={(websiteConfig?.categorySectionStyle as any) || 'style6'}
            categories={displayCategories}
            onCategoryClick={onCategoryClick}
            categoryScrollRef={categoryScrollRef as React.RefObject<HTMLDivElement>}
          />
        </section>
      )}

      {/* Main Content */}
      <main className="max-w-[1720px] mx-auto px-0.5 sm:px-1 lg:px-1.5 space-y-0.5 sm:space-y-1 pb-20 md:pb-1" style={{ minHeight: '680px', contain: 'layout' }}>
        {hasSearchQuery ? (
          <Suspense fallback={<SearchResultsSkeleton />}>
            <SearchResultsSection
              searchTerm={searchTerm.trim()}
              products={sortedProducts}
              sortOption={sortOption}
              onSortChange={onSortChange}
              onClearSearch={onClearSearch}
              onProductClick={onProductClick}
              onBuyNow={onBuyNow}
              onQuickView={onQuickView}
              onAddToCart={onAddToCart}
              productCardStyle={websiteConfig?.productCardStyle}
              wishlist={wishlist}
              onToggleWishlist={onToggleWishlist}
            />
          </Suspense>
        ) : (
          <>
            {/* Flash Deals */}
            {flashSalesProducts.length > 0 && (
              <Suspense fallback={<FlashSalesSkeleton />}>
                <LazySection fallback={<FlashSalesSkeleton />} rootMargin="0px 0px 200px" minHeight="300px">
                  <FlashSalesSection
                    products={flashSalesProducts}
                    showCounter={showFlashSaleCounter}
                    countdown={flashSaleCountdown}
                    onProductClick={onProductClick}
                    onBuyNow={onBuyNow}
                    onQuickView={onQuickView}
                    onAddToCart={onAddToCart}
                    wishlist={wishlist}
                    onToggleWishlist={onToggleWishlist}
                    productCardStyle={websiteConfig?.productCardStyle}
                    sectionRef={productsSectionRef as React.RefObject<HTMLElement>}
                  />
                </LazySection>
              </Suspense>
            )}

            {/* Showcase Section */}
            {bestSaleProducts.length > 0 && websiteConfig?.showcaseSectionStyle && websiteConfig.showcaseSectionStyle !== 'none' && (
              <Suspense fallback={<ShowcaseSkeleton />}>
                <LazySection fallback={<ShowcaseSkeleton />} rootMargin="0px 0px 300px" minHeight="400px">
                  <ShowcaseSection
                    products={bestSaleProducts.slice(0, 12)}
                    onProductClick={onProductClick}
                    onBuyNow={onBuyNow}
                    onQuickView={onQuickView}
                    onAddToCart={onAddToCart}
                    wishlist={wishlist}
                    onToggleWishlist={onToggleWishlist}
                    productCardStyle={websiteConfig?.productCardStyle}
                    style={websiteConfig?.showcaseSectionStyle}
                  />
                </LazySection>
              </Suspense>
            )}

            {/* Brand Section */}
            {brands && brands.length > 0 && websiteConfig?.brandSectionStyle && websiteConfig.brandSectionStyle !== 'none' && (
              <Suspense fallback={<BrandSkeleton />}>
                <LazySection fallback={<BrandSkeleton />} rootMargin="0px 0px 300px" minHeight="200px">
                  <BrandSection
                    brands={brands}
                    onBrandClick={(brand) => onCategoryClick(`brand:${brand.slug || brand.name}`)}
                    style={websiteConfig?.brandSectionStyle}
                  />
                </LazySection>
              </Suspense>
            )}

            {/* Best Sale Products */}
            {bestSaleProducts.length > 0 && (
              <Suspense fallback={<ProductGridSkeleton count={10} />}>
                <LazySection fallback={<ProductGridSkeleton count={10} />} rootMargin="0px 0px 300px" minHeight="400px">
                  <ProductGridSection
                    title={t('best_sale')}
                    products={bestSaleProducts}
                    accentColor="green"
                    keyPrefix="best"
                    maxProducts={10}
                    reverseOrder={true}
                    onProductClick={onProductClick}
                    onBuyNow={onBuyNow}
                    onQuickView={onQuickView}
                    onAddToCart={onAddToCart}
                    wishlist={wishlist}
                    onToggleWishlist={onToggleWishlist}
                    productCardStyle={websiteConfig?.productCardStyle}
                    productSectionStyle={websiteConfig?.productSectionStyle}
                  />
                </LazySection>
              </Suspense>
            )}

            {/* Popular Products */}
            {popularProducts.length > 0 && (
              <Suspense fallback={<ProductGridSkeleton count={10} />}>
                <LazySection fallback={<ProductGridSkeleton count={10} />} rootMargin="0px 0px 300px" minHeight="400px">
                  <ProductGridSection
                    title={t('popular_products')}
                    products={popularProducts}
                    accentColor="purple"
                    keyPrefix="pop"
                    maxProducts={10}
                    reverseOrder={false}
                    onProductClick={onProductClick}
                    onBuyNow={onBuyNow}
                    onQuickView={onQuickView}
                    onAddToCart={onAddToCart}
                    wishlist={wishlist}
                    onToggleWishlist={onToggleWishlist}
                    productCardStyle={websiteConfig?.productCardStyle}
                    productSectionStyle={websiteConfig?.productSectionStyle}
                  />
                </LazySection>
              </Suspense>
            )}

            {/* Tag-based Product Sections */}
            <Suspense fallback={<ProductGridSkeleton count={10} />}>
              <LazySection fallback={<ProductGridSkeleton count={10} />} rootMargin="0px 0px 300px" minHeight="400px">
                <TagProductSections
                  tags={tags}
                  activeProducts={activeProducts}
                  onProductClick={onProductClick}
                  onBuyNow={onBuyNow}
                  onQuickView={onQuickView}
                  onAddToCart={onAddToCart}
                  wishlist={wishlist}
                  onToggleWishlist={onToggleWishlist}
                  productCardStyle={websiteConfig?.productCardStyle}
                  productSectionStyle={websiteConfig?.productSectionStyle}
                />
              </LazySection>
            </Suspense>

            {/* All Products */}
            {activeProducts.length > 0 && (
              <Suspense fallback={<ProductGridSkeleton count={10} />}>
                <LazySection fallback={<ProductGridSkeleton count={10} />} rootMargin="0px 0px 300px" minHeight="500px">
                  <ProductGridSection
                    title={t('all_products')}
                    products={activeProducts}
                    accentColor="blue"
                    keyPrefix="all"
                    maxProducts={50}
                    reverseOrder={false}
                    onProductClick={onProductClick}
                    onBuyNow={onBuyNow}
                    onQuickView={onQuickView}
                    onAddToCart={onAddToCart}
                    wishlist={wishlist}
                    onToggleWishlist={onToggleWishlist}
                    productCardStyle={websiteConfig?.productCardStyle}
                    productSectionStyle={websiteConfig?.productSectionStyle}
                  />
                </LazySection>
              </Suspense>
            )}
          </>
        )}
      </main>

      {/* Footer — deferred until scrolled near */}
      <Suspense fallback={<FooterSkeleton />}>
        <LazySection fallback={<FooterSkeleton />} rootMargin="0px 0px 400px" minHeight="200px">
          <StoreFooter websiteConfig={websiteConfig} logo={logo} tenantId={tenantId} onOpenChat={onOpenChat} />
        </LazySection>
      </Suspense>
    </>
  );
};
