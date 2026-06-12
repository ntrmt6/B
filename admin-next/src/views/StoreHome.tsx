import React, { lazy, Suspense, useCallback, useState, useEffect } from 'react';
import type { Product, User, WebsiteConfig, Order, ProductVariantSelection } from '../types';

// Custom hooks
import { useStoreHome, formatSegment } from '../hooks/useStoreHome';
import { useStoreStudioLayout } from '../hooks/useStoreStudioLayout';

// Critical above-the-fold component
import { StoreHeader } from '../components/StoreHeader';

// Scroll-to-top is tiny, keep eager
import { ScrollToTopButton } from '../components/store/ScrollToTopButton';

// Skeletons
import { SectionSkeleton, StoreHomeSkeleton } from '../components/store/skeletons';
import dynamic from 'next/dynamic';

// Lazy loaded components — deferred until needed
const StoreHomeModals = dynamic(() => import('../components/store/StoreHomeModals').then(m => ({ default: m.StoreHomeModals })));
const StoreHomeDefaultLayout = dynamic(() => import('../components/store/StoreHomeDefaultLayout').then(m => ({ default: m.StoreHomeDefaultLayout })));
const VideoStoryBar = dynamic(() => import('../components/store/VideoStoryBar'));
const StoreCategoryProducts = dynamic(() => import('../components/StoreCategoryProducts'));
const StorePopup = dynamic(() => import('../components/StorePopup').then(m => ({ default: m.StorePopup })));
const StoreFrontRenderer = dynamic(() => import('../components/store/StoreFrontRenderer').then(m => ({ default: m.StoreFrontRenderer })));
const StoreFrontThemePage = dynamic(() => import('../components/store/StoreFrontThemePage').then(m => ({ default: m.StoreFrontThemePage })));
const StoreFront2Page = dynamic(() => import('../components/store/StoreFront2Page').then(m => ({ default: m.StoreFront2Page })));

// StoreFront1 Visual Variants (split into individual files for code splitting)
const StoreFront1Elegant = dynamic(() => import('../components/store/StoreFront1Elegant'));
const StoreFront1Bold = dynamic(() => import('../components/store/StoreFront1Bold'));
const StoreFront1Minimal = dynamic(() => import('../components/store/StoreFront1Minimal'));

// Gadgets Theme
const GadgetsThemePage = dynamic(() => import('../components/store/GadgetsThemePage').then(m => ({ default: m.GadgetsThemePage })));

// StoreFront2 Visual Variants (split into individual files for code splitting)
const StoreFront2Neon = dynamic(() => import('../components/store/StoreFront2Neon').then(m => ({ default: m.StoreFront2Neon })));
const StoreFront2Earth = dynamic(() => import('../components/store/StoreFront2Earth').then(m => ({ default: m.StoreFront2Earth })));
const StoreFront2Pastel = dynamic(() => import('../components/store/StoreFront2Pastel').then(m => ({ default: m.StoreFront2Pastel })));

interface StoreHomeProps {
  products?: Product[];
  orders?: Order[];
  tenantId?: string;
  onProductClick: (p: Product) => void;
  onQuickCheckout?: (p: Product, quantity: number, variant: ProductVariantSelection) => void;
  wishlistCount: number;
  wishlist: number[];
  onToggleWishlist: (id: number) => void;
  cart?: number[];
  onToggleCart?: (id: number) => void;
  onCheckoutFromCart?: (productId: number) => void;
  onAddToCart?: (product: Product, quantity: number, variant: ProductVariantSelection) => void;
  user?: User | null;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  onProfileClick?: () => void;
  logo?: string | null;
  websiteConfig?: WebsiteConfig;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onImageSearchClick?: () => void;
  onOpenChat?: () => void;
  categories?: any[];
  subCategories?: any[];
  childCategories?: any[];
  brands?: any[];
  tags?: any[];
  initialCategoryFilter?: string | null;
  onCategoryFilterChange?: (categorySlug: string | null) => void;
  onMobileMenuOpenRef?: (openFn: () => void) => void;
  onCartOpenRef?: (openFn: () => void) => void;
}

const StoreHome: React.FC<StoreHomeProps> = ({ 
  products,
  orders,
  tenantId,
  onProductClick, 
  onQuickCheckout,
  wishlistCount, 
  wishlist, 
  onToggleWishlist,
  cart,
  onToggleCart,
  onCheckoutFromCart,
  onAddToCart,
  user,
  onLoginClick,
  onLogoutClick,
  onProfileClick,
  logo,
  websiteConfig,
  categories = [],
  subCategories,
  childCategories,
  brands,
  tags,
  searchValue,
  onSearchChange,
  onImageSearchClick,
  onOpenChat,
  initialCategoryFilter,
  onCategoryFilterChange,
  onMobileMenuOpenRef,
  onCartOpenRef
}) => {
  // Defer non-critical below-fold components to prioritize above-fold paint
  const [deferredReady, setDeferredReady] = useState(false);
  useEffect(() => {
    const id = typeof requestIdleCallback === 'function'
      ? requestIdleCallback(() => setDeferredReady(true), { timeout: 2000 })
      : setTimeout(() => setDeferredReady(true), 150) as unknown as number;
    return () => {
      if (typeof cancelIdleCallback === 'function') cancelIdleCallback(id);
      else clearTimeout(id);
    };
  }, []);

  // Display skeleton only if products is undefined (still loading)
  if (products === undefined) {
    return <StoreHomeSkeleton />;
  }

  // All state and logic from custom hooks
  const {
    isTrackOrderOpen,
    setIsTrackOrderOpen,
    quickViewProduct,
    setQuickViewProduct,
    sortOption,
    setSortOption,
    activePopup,
    showScrollToTop,
    selectedCategoryView,
    flashTimeLeft,
    searchTerm,
    hasSearchQuery,
    showFlashSaleCounter,
    categoriesSectionRef,
    productsSectionRef,
    categoryScrollRef,
    displayCategories,
    displayProducts,
    activeProducts,
    flashSalesProducts,
    bestSaleProducts,
    popularProducts,
    sortedProducts,
    updateSearchTerm,
    scrollToTop,
    handleClosePopup,
    handlePopupNavigate,
    handleCategoryClick,
    handleClearCategoryFilter,
    handleCategoriesNav,
    handleProductsNav,
  } = useStoreHome({
    products,
    tenantId,
    categories,
    websiteConfig,
    initialCategoryFilter,
    onCategoryFilterChange,
    searchValue,
    onSearchChange
  });

  // Store Studio layout management (custom layout, styles, config)
  const {
    useCustomLayout,
    customLayoutLoading,
    customLayoutData,
    storeStudioEnabled,
    productDisplayOrder,
    effectiveWebsiteConfig,
  } = useStoreStudioLayout({ tenantId, websiteConfig });

  // === HANDLERS ===
  const selectInstantVariant = useCallback((product: Product): ProductVariantSelection => ({
    color: product.variantDefaults?.color || product.colors?.[0] || 'Default',
    size: product.variantDefaults?.size || product.sizes?.[0] || 'Standard'
  }), []);

  const handleBuyNow = useCallback((product: Product) => {
    if (onQuickCheckout) {
      onQuickCheckout(product, 1, selectInstantVariant(product));
    } else {
      onProductClick(product);
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [onQuickCheckout, onProductClick, selectInstantVariant]);

  const handleAddProductToCartFromCard = useCallback((product: Product) => {
    if (onAddToCart) {
      onAddToCart(product, 1, selectInstantVariant(product));
    } else {
      onProductClick(product);
    }
  }, [onAddToCart, onProductClick, selectInstantVariant]);

  const handleQuickViewOrder = useCallback((product: Product, quantity: number, variant: ProductVariantSelection) => {
    if (onQuickCheckout) {
      onQuickCheckout(product, quantity, variant);
    } else {
      onProductClick(product);
    }
    setQuickViewProduct(null);
  }, [onQuickCheckout, onProductClick, setQuickViewProduct]);

  const flashSaleCountdown = [
    { label: 'Hours', value: formatSegment(flashTimeLeft.hours) },
    { label: 'Mins', value: formatSegment(flashTimeLeft.minutes) },
    { label: 'Sec', value: formatSegment(flashTimeLeft.seconds) }
  ];

  // === CATEGORY VIEW ===
  if (selectedCategoryView) {
    return (
      <Suspense fallback={<SectionSkeleton />}>
        <StoreCategoryProducts
          products={displayProducts}
          categories={categories}
          subCategories={subCategories}
          childCategories={childCategories}
          brands={brands}
          tags={tags}
          selectedCategory={selectedCategoryView}
          onCategoryChange={(category) => category ? handleCategoryClick(category) : handleClearCategoryFilter()}
          onBack={handleClearCategoryFilter}
          onHome={handleClearCategoryFilter}
          onProductClick={onProductClick}
          onBuyNow={handleBuyNow}
          onQuickView={setQuickViewProduct}
          onAddToCart={handleAddProductToCartFromCard}
          websiteConfig={websiteConfig}
          logo={logo}
          user={user}
          wishlistCount={wishlistCount}
          wishlist={wishlist}
          onToggleWishlist={onToggleWishlist}
          cart={cart}
          onToggleCart={onToggleCart}
          onCheckoutFromCart={onCheckoutFromCart}
          onLoginClick={onLoginClick}
          onLogoutClick={onLogoutClick}
          onProfileClick={onProfileClick}
          onOpenChat={onOpenChat}
          onImageSearchClick={onImageSearchClick}
          orders={orders}
        />
      </Suspense>
    );
  }

  // === MAIN RENDER ===
  return (
    <div className="min-h-screen font-sans text-slate-900" style={{ background: '#ffffff' }}>
      <StoreHeader 
        onTrackOrder={() => setIsTrackOrderOpen(true)} 
        productCatalog={activeProducts}
        wishlistCount={wishlistCount}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        cart={cart}
        onToggleCart={onToggleCart}
        onCheckoutFromCart={onCheckoutFromCart}
        user={user}
        onLoginClick={onLoginClick}
        onLogoutClick={onLogoutClick}
        onProfileClick={onProfileClick}
        logo={logo}
        websiteConfig={websiteConfig}
        searchValue={searchTerm}
        onSearchChange={updateSearchTerm}
        onCategoriesClick={handleCategoriesNav}
        onProductsClick={handleProductsNav}
        categoriesList={categories.map((cat) => cat.name)}
        onCategorySelect={handleCategoryClick}
        onProductClick={onProductClick}
        categories={categories}
        subCategories={subCategories}
        childCategories={childCategories}
        brands={brands}
        tags={tags}
        onMobileMenuOpenRef={onMobileMenuOpenRef}
        onCartOpenRef={onCartOpenRef}
        tenantId={tenantId}
      />
      
      {/* Modals — lazy loaded, only rendered when a modal is open */}
      {(isTrackOrderOpen || quickViewProduct) && (
        <Suspense fallback={null}>
          <StoreHomeModals
            isTrackOrderOpen={isTrackOrderOpen}
            onCloseTrackOrder={() => setIsTrackOrderOpen(false)}
            orders={orders}
            quickViewProduct={quickViewProduct}
            onCloseQuickView={() => setQuickViewProduct(null)}
            onQuickViewOrder={handleQuickViewOrder}
            onViewDetails={(product) => {
              setQuickViewProduct(null);
              onProductClick(product);
            }}
          />
        </Suspense>
      )}
      
      {/* Video Stories Bar — deferred to not block above-fold rendering */}
      {deferredReady && (
        <section className="max-w-[1340px] w-[92%] mx-auto md:w-[95%]">
          <Suspense fallback={null}>
            <VideoStoryBar
              tenantId={tenantId}
              products={activeProducts}
              onProductClick={onProductClick}
              onAddToCart={handleAddProductToCartFromCard}
            />
          </Suspense>
        </section>
      )}

      {/* Conditional: Custom Layout vs Default Layout */}
      {customLayoutLoading ? (
        <StoreHomeSkeleton />
      ) : useCustomLayout ? (
        <Suspense fallback={<StoreHomeSkeleton />}>
          <StoreFrontRenderer
            tenantId={tenantId || ""}
            products={products}
            categories={categories}
            subCategories={subCategories}
            childCategories={childCategories}
            brands={brands}
            tags={tags}
            websiteConfig={effectiveWebsiteConfig}
            logo={logo}
            onProductClick={onProductClick}
            onBuyNow={handleBuyNow}
            onQuickView={setQuickViewProduct}
            onAddToCart={handleAddProductToCartFromCard}
            wishlist={wishlist}
            onToggleWishlist={onToggleWishlist}
            onCategoryClick={handleCategoryClick}
            onBrandClick={(slug) => handleCategoryClick(`brand:${slug}`)}
            onOpenChat={onOpenChat}
            layoutData={customLayoutData}
            storeStudioEnabled={storeStudioEnabled}
            productDisplayOrder={productDisplayOrder}
          />
          
        </Suspense>
      ) : websiteConfig?.readyTheme?.startsWith('gadgets') ? (
        <Suspense fallback={<StoreHomeSkeleton />}>
          <GadgetsThemePage
            products={products}
            categories={categories}
            brands={brands || []}
            websiteConfig={websiteConfig}
            logo={logo}
            tags={tags}
            onProductClick={onProductClick}
            onBuyNow={handleBuyNow}
            onAddToCart={handleAddProductToCartFromCard}
            onCategoryClick={handleCategoryClick}
            onOpenChat={onOpenChat}
          />
        </Suspense>
      ) : websiteConfig?.readyTheme === 'storefront2' ? (
        <Suspense fallback={<StoreHomeSkeleton />}>
          {/* StoreFront2 variant routing */}
          {websiteConfig?.readyThemeVariant === 'neon' ? (
            <StoreFront2Neon
              products={products}
              categories={categories}
              brands={brands || []}
              websiteConfig={websiteConfig}
              logo={logo}
              onProductClick={onProductClick}
              onBuyNow={handleBuyNow}
              onAddToCart={handleAddProductToCartFromCard}
              onCategoryClick={handleCategoryClick}
              onOpenChat={onOpenChat}
            />
          ) : websiteConfig?.readyThemeVariant === 'earth' ? (
            <StoreFront2Earth
              products={products}
              categories={categories}
              brands={brands || []}
              websiteConfig={websiteConfig}
              logo={logo}
              onProductClick={onProductClick}
              onBuyNow={handleBuyNow}
              onAddToCart={handleAddProductToCartFromCard}
              onCategoryClick={handleCategoryClick}
              onOpenChat={onOpenChat}
            />
          ) : websiteConfig?.readyThemeVariant === 'pastel' ? (
            <StoreFront2Pastel
              products={products}
              categories={categories}
              brands={brands || []}
              websiteConfig={websiteConfig}
              logo={logo}
              onProductClick={onProductClick}
              onBuyNow={handleBuyNow}
              onAddToCart={handleAddProductToCartFromCard}
              onCategoryClick={handleCategoryClick}
              onOpenChat={onOpenChat}
            />
          ) : (
            <StoreFront2Page
              products={products}
              categories={categories}
              brands={brands || []}
              websiteConfig={websiteConfig}
              logo={logo}
              onProductClick={onProductClick}
              onBuyNow={handleBuyNow}
              onAddToCart={handleAddProductToCartFromCard}
              onCategoryClick={handleCategoryClick}
              onOpenChat={onOpenChat}
            />
          )}
        </Suspense>
      ) : websiteConfig?.readyTheme === 'storefront1' || websiteConfig?.readyTheme?.startsWith('storefront') ? (
        <Suspense fallback={<StoreHomeSkeleton />}>
          {/* StoreFront1 variant routing */}
          {websiteConfig?.readyThemeVariant === 'elegant' ? (
            <StoreFront1Elegant
              products={products}
              categories={categories}
              brands={brands || []}
              websiteConfig={websiteConfig}
              logo={logo}
              onProductClick={onProductClick}
              onBuyNow={handleBuyNow}
              onAddToCart={handleAddProductToCartFromCard}
              onCategoryClick={handleCategoryClick}
              onOpenChat={onOpenChat}
            />
          ) : websiteConfig?.readyThemeVariant === 'bold' ? (
            <StoreFront1Bold
              products={products}
              categories={categories}
              brands={brands || []}
              websiteConfig={websiteConfig}
              logo={logo}
              onProductClick={onProductClick}
              onBuyNow={handleBuyNow}
              onAddToCart={handleAddProductToCartFromCard}
              onCategoryClick={handleCategoryClick}
              onOpenChat={onOpenChat}
            />
          ) : websiteConfig?.readyThemeVariant === 'minimal' ? (
            <StoreFront1Minimal
              products={products}
              categories={categories}
              brands={brands || []}
              websiteConfig={websiteConfig}
              logo={logo}
              onProductClick={onProductClick}
              onBuyNow={handleBuyNow}
              onAddToCart={handleAddProductToCartFromCard}
              onCategoryClick={handleCategoryClick}
              onOpenChat={onOpenChat}
            />
          ) : (
            <StoreFrontThemePage
              products={products}
              categories={categories}
              brands={brands || []}
              websiteConfig={websiteConfig}
              logo={logo}
              onProductClick={onProductClick}
              onBuyNow={handleBuyNow}
              onAddToCart={handleAddProductToCartFromCard}
              onCategoryClick={handleCategoryClick}
              onOpenChat={onOpenChat}
            />
          )}
        </Suspense>
      ) : (
        <Suspense fallback={<StoreHomeSkeleton />}>
          <StoreHomeDefaultLayout
            websiteConfig={websiteConfig}
            displayCategories={displayCategories}
            flashSalesProducts={flashSalesProducts}
            bestSaleProducts={bestSaleProducts}
            popularProducts={popularProducts}
            activeProducts={activeProducts}
            sortedProducts={sortedProducts}
            brands={brands}
            tags={tags}
            logo={logo}
            tenantId={tenantId}
            hasSearchQuery={hasSearchQuery}
            searchTerm={searchTerm}
            sortOption={sortOption}
            onSortChange={setSortOption}
            onClearSearch={() => {
              updateSearchTerm('');
              setSortOption('relevance');
            }}
            showFlashSaleCounter={showFlashSaleCounter}
            flashSaleCountdown={flashSaleCountdown}
            categoriesSectionRef={categoriesSectionRef}
            productsSectionRef={productsSectionRef}
            categoryScrollRef={categoryScrollRef as React.RefObject<HTMLDivElement>}
            onProductClick={onProductClick}
            onBuyNow={handleBuyNow}
            onQuickView={setQuickViewProduct}
            onAddToCart={handleAddProductToCartFromCard}
            onCategoryClick={handleCategoryClick}
            wishlist={wishlist}
            onToggleWishlist={onToggleWishlist}
            onOpenChat={onOpenChat}
          />
        </Suspense>
      )}

      {/* Popup */}
      {activePopup && (
        <Suspense fallback={null}>
          <StorePopup
            popup={activePopup}
            onClose={handleClosePopup}
            onNavigate={handlePopupNavigate}
          />
        </Suspense>
      )}

      {/* Scroll to Top Button */}
      <ScrollToTopButton visible={showScrollToTop} onClick={scrollToTop} />
    </div>
    
  );
};

export default StoreHome;
