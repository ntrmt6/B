'use client';

/**
 * Categories Page
 * Route: /categories
 *
 * Compact mobile-first category browser with accordion sidebar
 * (categories → subcategories → child categories dropdown) and
 * right panel showing filtered products for the selected level.
 */
import { Suspense, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../providers';
import { ArrowLeft, Search, ChevronDown, Package } from 'lucide-react';
import { normalizeImageUrl } from '@/utils/imageUrlHelper';
import { ProductCard } from '@/components/StoreProductComponents';
import dynamic from 'next/dynamic';

const MobileBottomNav = dynamic(
  () => import('@/components/store/MobileBottomNav').then(m => ({ default: m.MobileBottomNav })),
  { ssr: false }
);

const eq = (a?: string, b?: string) => a?.toLowerCase() === b?.toLowerCase();

export default function CategoriesPage() {
  const router = useRouter();
  const app = useApp();

  // --- data ---
  const activeCategories = useMemo(() => {
    return (app.categories || [])
      .filter(c => !c.status || c.status === 'Active')
      .sort((a, b) => (a.serial ?? Infinity) - (b.serial ?? Infinity));
  }, [app.categories]);

  const activeSubCategories = useMemo(() => {
    return (app.subCategories || [])
      .filter(sc => !sc.status || sc.status === 'Active')
      .sort((a, b) => (a.serial ?? Infinity) - (b.serial ?? Infinity));
  }, [app.subCategories]);

  const activeChildCategories = useMemo(() => {
    return (app.childCategories || [])
      .filter(cc => !cc.status || cc.status === 'Active')
      .sort((a, b) => (a.serial ?? Infinity) - (b.serial ?? Infinity));
  }, [app.childCategories]);

  const activeProducts = useMemo(() => {
    return (app.products || []).filter(p => !p.status || p.status === 'Active');
  }, [app.products]);

  // --- sidebar expand/collapse state ---
  const [expandedCatId, setExpandedCatId] = useState<string | null>(null);
  const [expandedSubCatId, setExpandedSubCatId] = useState<string | null>(null);

  // The filter name used to match products (category / subcategory / child-category name)
  const [filterName, setFilterName] = useState<string | null>(null);
  const [filterLabel, setFilterLabel] = useState<string>('');

  // Auto-select first category on mount
  const firstCategory = activeCategories.length > 0 ? activeCategories[0] : null;
  const effectiveFilterName = filterName || firstCategory?.name || null;
  const effectiveFilterLabel = filterLabel || firstCategory?.name || '';
  const effectiveExpandedCatId = expandedCatId ?? firstCategory?.id ?? null;

  // --- helpers ---
  const getSubsForCategory = useCallback((catId: string) => {
    return activeSubCategories.filter(sc => sc.categoryId === catId);
  }, [activeSubCategories]);

  const getChildrenForSub = useCallback((subId: string) => {
    return activeChildCategories.filter(cc => cc.subCategoryId === subId);
  }, [activeChildCategories]);

  // --- handlers ---
  const handleCategoryClick = useCallback((cat: { id: string; name: string }) => {
    const subs = getSubsForCategory(cat.id);
    if (subs.length > 0) {
      // Toggle expand; if already expanded, collapse
      setExpandedCatId(prev => prev === cat.id ? null : cat.id);
      setExpandedSubCatId(null);
    }
    // Always select the category for product display
    setFilterName(cat.name);
    setFilterLabel(cat.name);
  }, [getSubsForCategory]);

  const handleSubCategoryClick = useCallback((sub: { id: string; name: string }) => {
    const children = getChildrenForSub(sub.id);
    if (children.length > 0) {
      setExpandedSubCatId(prev => prev === sub.id ? null : sub.id);
    }
    setFilterName(sub.name);
    setFilterLabel(sub.name);
  }, [getChildrenForSub]);

  const handleChildCategoryClick = useCallback((child: { name: string }) => {
    setFilterName(child.name);
    setFilterLabel(child.name);
  }, []);

  const handleProductClick = useCallback((product: any) => {
    if (product.slug) router.push(`/product-details/${product.slug}`);
  }, [router]);

  // --- filtered products ---
  const filteredProducts = useMemo(() => {
    if (!effectiveFilterName) return [];
    return activeProducts.filter(p =>
      eq(p.category, effectiveFilterName) ||
      eq(p.subCategory, effectiveFilterName) ||
      eq(p.childCategory, effectiveFilterName)
    );
  }, [activeProducts, effectiveFilterName]);

  const themeColor = app.websiteConfig?.themeColor || '#F97316';

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      {/* Header – compact */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 py-2 flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={20} className="text-gray-700 dark:text-gray-200" />
        </button>
        <h1 className="text-base font-semibold text-gray-800 dark:text-gray-100 flex-1">
          Categories
        </h1>
        <button
          onClick={() => router.push('/all-products')}
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Search products"
        >
          <Search size={20} className="text-gray-700 dark:text-gray-200" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden pb-16">
        {/* Left Sidebar – accordion categories */}
        <div className="w-[110px] sm:w-[140px] flex-shrink-0 overflow-y-auto bg-gray-50 dark:bg-gray-800/50 border-r border-gray-200 dark:border-gray-700">
          {activeCategories.map((category) => {
            const isExpanded = category.id === effectiveExpandedCatId;
            const isActive = eq(effectiveFilterName, category.name);
            const subs = getSubsForCategory(category.id);
            const hasSubs = subs.length > 0;

            return (
              <div key={category.id}>
                {/* Category row */}
                <button
                  onClick={() => handleCategoryClick(category)}
                  className={`w-full flex items-center gap-1.5 px-2 py-2 text-left transition-all relative ${
                    isActive && !expandedSubCatId
                      ? 'bg-white dark:bg-gray-900'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  }`}
                >
                  {isActive && (
                    <div
                      className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r"
                      style={{ backgroundColor: themeColor }}
                    />
                  )}
                  {/* Category image */}
                  <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-700">
                    {category.image ? (
                      <img src={normalizeImageUrl(category.image)} alt={category.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : category.icon ? (
                      <img src={normalizeImageUrl(category.icon)} alt={category.name} className="w-4 h-4 object-contain" loading="lazy" />
                    ) : (
                      <Package size={14} className="text-gray-400" />
                    )}
                  </div>
                  <span
                    className={`flex-1 text-[11px] leading-tight line-clamp-2 ${
                      isActive ? 'font-semibold' : 'font-medium text-gray-600 dark:text-gray-400'
                    }`}
                    style={isActive ? { color: themeColor } : undefined}
                  >
                    {category.name}
                  </span>
                  {hasSubs && (
                    <ChevronDown
                      size={12}
                      className={`flex-shrink-0 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  )}
                </button>

                {/* Subcategory dropdown */}
                {isExpanded && hasSubs && (
                  <div className="bg-white dark:bg-gray-900">
                    {subs.map((sub) => {
                      const isSubActive = eq(effectiveFilterName, sub.name);
                      const children = getChildrenForSub(sub.id);
                      const hasChildren = children.length > 0;
                      const isSubExpanded = expandedSubCatId === sub.id;

                      return (
                        <div key={sub.id}>
                          <button
                            onClick={() => handleSubCategoryClick(sub)}
                            className={`w-full flex items-center gap-1 pl-6 pr-2 py-1.5 text-left transition-all ${
                              isSubActive ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                            }`}
                          >
                            <span
                              className={`flex-1 text-[10.5px] leading-tight line-clamp-2 ${
                                isSubActive ? 'font-semibold' : 'font-medium text-gray-500 dark:text-gray-400'
                              }`}
                              style={isSubActive ? { color: themeColor } : undefined}
                            >
                              {sub.name}
                            </span>
                            {hasChildren && (
                              <ChevronDown
                                size={10}
                                className={`flex-shrink-0 text-gray-400 transition-transform ${isSubExpanded ? 'rotate-180' : ''}`}
                              />
                            )}
                          </button>

                          {/* Child-category dropdown */}
                          {isSubExpanded && hasChildren && (
                            <div className="bg-gray-50 dark:bg-gray-800/70">
                              {children.map((child) => {
                                const isChildActive = eq(effectiveFilterName, child.name);
                                return (
                                  <button
                                    key={child.id}
                                    onClick={() => handleChildCategoryClick(child)}
                                    className={`w-full text-left pl-10 pr-2 py-1.5 transition-all ${
                                      isChildActive ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                    }`}
                                  >
                                    <span
                                      className={`text-[10px] leading-tight line-clamp-2 ${
                                        isChildActive ? 'font-semibold' : 'font-medium text-gray-500 dark:text-gray-400'
                                      }`}
                                      style={isChildActive ? { color: themeColor } : undefined}
                                    >
                                      {child.name}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {activeCategories.length === 0 && (
            <div className="p-3 text-center text-xs text-gray-400">No categories</div>
          )}
        </div>

        {/* Right Panel – products */}
        <div className="flex-1 overflow-y-auto">
          {/* Section header */}
          {effectiveFilterLabel && (
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-2 py-1.5 flex items-center justify-between">
              <h2 className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">
                {effectiveFilterLabel}
              </h2>
              <span className="text-[10px] text-gray-400">{filteredProducts.length} items</span>
            </div>
          )}

          {/* Product grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-0.5 p-0.5 sm:gap-1 sm:p-1 md:grid-cols-3 lg:grid-cols-4">
              {filteredProducts.map((p, idx) => (
                <ProductCard
                  key={`cat-${p.id}-${idx}`}
                  product={p}
                  onClick={handleProductClick}
                  variant={app.websiteConfig?.productCardStyle}
                  onAddToCart={(product) => app.handleAddProductToCart(product, 1)}
                  onBuyNow={(product) => {
                    if (app.handlers?.handleCheckoutStart) {
                      app.handlers.handleCheckoutStart(product, 1);
                    }
                  }}
                  wishlist={app.wishlist}
                  onToggleWishlist={(id: number) =>
                    app.handlers?.isInWishlist(id)
                      ? app.handlers.removeFromWishlist(id)
                      : app.handlers?.addToWishlist(id)
                  }
                />
              ))}
            </div>
          ) : effectiveFilterName ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Package size={32} className="text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">No products in this category</p>
              <button
                onClick={() => router.push('/all-products')}
                className="mt-2 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: themeColor, backgroundColor: `${themeColor}15` }}
              >
                Browse All Products
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <Suspense fallback={null}>
        <MobileBottomNav
          onHomeClick={() => router.push('/')}
          onCartClick={() => router.push('/')}
          onAccountClick={() => app.user ? router.push('/profile') : app.setIsLoginOpen(true)}
          onMenuClick={() => { window.scrollTo(0, 0); }}
          cartCount={app.cartItems.length}
          websiteConfig={app.websiteConfig}
          onChatClick={app.handleOpenChat}
          user={app.user}
          onLogoutClick={app.handleLogout}
          activeTab="menu"
        />
      </Suspense>
    </div>
  );
}
