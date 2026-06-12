'use client';

import { useState, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useApp } from '../providers';
import { Search, SlidersHorizontal, X, ChevronDown, Package, ArrowLeft } from 'lucide-react';
import { normalizeImageUrl } from '@/utils/imageUrlHelper';
import { ProductCard } from '@/components/StoreProductComponents';

const MobileBottomNav = dynamic(
  () => import('@/components/store/MobileBottomNav').then(m => ({ default: m.MobileBottomNav })),
  { ssr: false }
);
const LoginModal = dynamic(
  () => import('@/components/store/LoginModal').then(m => ({ default: m.LoginModal })),
  { ssr: false }
);
const StoreChatModal = dynamic(
  () => import('@/components/store/StoreChatModal').then(m => ({ default: m.StoreChatModal })),
  { ssr: false }
);

type SortOption = 'default' | 'price-low' | 'price-high' | 'rating' | 'sold' | 'newest';

const eq = (a?: string | null, b?: string | null) => a?.toLowerCase() === b?.toLowerCase();

export default function AllProductsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const app = useApp();

  // URL-based initial filters
  const urlCategory = searchParams.get('category');
  const urlBrand = searchParams.get('brand');
  const urlTag = searchParams.get('tag');
  const urlSearch = searchParams.get('q');

  // Local state
  const [searchTerm, setSearchTerm] = useState(urlSearch || '');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(urlCategory);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(urlBrand);
  const [selectedTag, setSelectedTag] = useState<string | null>(urlTag);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('categories');

  const themeColor = typeof app.websiteConfig?.themeColors === 'string'
    ? app.websiteConfig.themeColors
    : '#F97316';

  // Active data
  const activeCategories = useMemo(() =>
    (app.categories || []).filter(c => !c.status || c.status === 'Active').sort((a, b) => (a.serial ?? Infinity) - (b.serial ?? Infinity)),
    [app.categories]);

  const activeBrands = useMemo(() =>
    (app.brands || []).filter(b => !b.status || b.status === 'Active').sort((a, b) => (a.serial ?? Infinity) - (b.serial ?? Infinity)),
    [app.brands]);

  const activeTags = useMemo(() =>
    (app.tags || []).filter(t => !t.status || t.status === 'Active').sort((a, b) => (a.serial ?? Infinity) - (b.serial ?? Infinity)),
    [app.tags]);

  const activeProducts = useMemo(() =>
    (app.products || []).filter(p => !p.status || p.status === 'Active'),
    [app.products]);

  // Price range bounds
  const priceBounds = useMemo(() => {
    if (activeProducts.length === 0) return { min: 0, max: 10000 };
    const prices = activeProducts.map(p => p.price || 0).filter(p => p > 0);
    return { min: Math.min(...prices, 0), max: Math.max(...prices, 10000) };
  }, [activeProducts]);

  // Filter products
  const filteredProducts = useMemo(() => {
    let products = activeProducts;

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      products = products.filter(p =>
        p.name?.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term) ||
        p.brand?.toLowerCase().includes(term) ||
        p.tags?.some(t => t.toLowerCase().includes(term)) ||
        p.searchTags?.some(t => t.toLowerCase().includes(term))
      );
    }

    // Category filter
    if (selectedCategory) {
      products = products.filter(p =>
        eq(p.category, selectedCategory) ||
        eq(p.subCategory, selectedCategory) ||
        eq(p.childCategory, selectedCategory) ||
        p.categories?.some(c => eq(c, selectedCategory)) ||
        p.subCategories?.some(c => eq(c, selectedCategory)) ||
        p.childCategories?.some(c => eq(c, selectedCategory))
      );
    }

    // Brand filter
    if (selectedBrand) {
      products = products.filter(p =>
        eq(p.brand, selectedBrand) ||
        p.brands?.some(b => eq(b, selectedBrand))
      );
    }

    // Tag filter
    if (selectedTag) {
      products = products.filter(p =>
        p.tags?.some(t => eq(t, selectedTag))
      );
    }

    // Price range
    if (priceRange) {
      products = products.filter(p => {
        const price = p.price || 0;
        return price >= priceRange[0] && price <= priceRange[1];
      });
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        products = [...products].sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-high':
        products = [...products].sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'rating':
        products = [...products].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'sold':
        products = [...products].sort((a, b) =>
          ((b.initialSoldCount || 0) + (b.soldCount || 0)) -
          ((a.initialSoldCount || 0) + (a.soldCount || 0))
        );
        break;
      case 'newest':
        products = [...products].sort((a, b) => (b.id || 0) - (a.id || 0));
        break;
    }

    return products;
  }, [activeProducts, searchTerm, selectedCategory, selectedBrand, selectedTag, priceRange, sortBy]);

  // Count products per category/brand/tag for showing counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    activeProducts.forEach(p => {
      if (p.category) counts[p.category.toLowerCase()] = (counts[p.category.toLowerCase()] || 0) + 1;
    });
    return counts;
  }, [activeProducts]);

  const brandCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    activeProducts.forEach(p => {
      if (p.brand) counts[p.brand.toLowerCase()] = (counts[p.brand.toLowerCase()] || 0) + 1;
      p.brands?.forEach(b => { counts[b.toLowerCase()] = (counts[b.toLowerCase()] || 0) + 1; });
    });
    return counts;
  }, [activeProducts]);

  const activeFilterCount = [selectedCategory, selectedBrand, selectedTag, priceRange].filter(Boolean).length;

  const clearAllFilters = useCallback(() => {
    setSelectedCategory(null);
    setSelectedBrand(null);
    setSelectedTag(null);
    setPriceRange(null);
    setSearchTerm('');
    setSortBy('default');
  }, []);

  const handleProductClick = useCallback((product: any) => {
    if (product.slug) router.push(`/product-details/${product.slug}`);
  }, [router]);

  if (app.isLoading || !app.activeTenantId) {
    return (
      <div className="min-h-screen bg-gray-50 animate-pulse">
        <div className="sticky top-0 z-30 bg-white border-b h-14" />
        <div className="max-w-[1720px] mx-auto px-2 sm:px-4 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100">
                <div className="bg-gray-200" style={{ aspectRatio: '1/1' }} />
                <div className="p-2 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Sidebar filter section component
  const FilterSection = ({ title, id, children }: { title: string; id: string; children: React.ReactNode }) => (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setExpandedSection(prev => prev === id ? null : id)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
      >
        {title}
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${expandedSection === id ? 'rotate-180' : ''}`} />
      </button>
      {expandedSection === id && <div className="px-4 pb-3">{children}</div>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1720px] mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex items-center gap-2 sm:gap-3 h-14 sm:h-16">
            <button onClick={() => router.push('/')} className="p-1.5 rounded-full hover:bg-gray-100 flex-shrink-0">
              <ArrowLeft size={20} className="text-gray-700" />
            </button>

            {/* Logo */}
            {app.logo && (
              <img
                src={normalizeImageUrl(app.logo)}
                alt="Store"
                className="h-8 sm:h-9 w-auto object-contain cursor-pointer hidden sm:block"
                onClick={() => router.push('/')}
              />
            )}

            {/* Search bar */}
            <div className="flex-1 relative max-w-2xl">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={app.websiteConfig?.searchHints || 'Search products...'}
                className="w-full pl-10 pr-10 py-2 sm:py-2.5 rounded-full border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-gray-400 focus:bg-white transition-colors"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Filter toggle (mobile) */}
            <button
              onClick={() => setShowFilters(prev => !prev)}
              className="lg:hidden relative p-2 rounded-full hover:bg-gray-100"
            >
              <SlidersHorizontal size={20} className="text-gray-700" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                  style={{ backgroundColor: themeColor }}>{activeFilterCount}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sort bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1720px] mx-auto px-2 sm:px-4 lg:px-6 flex items-center justify-between py-2 gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-600 min-w-0">
            <span className="font-medium whitespace-nowrap">{filteredProducts.length} products</span>
            {(selectedCategory || selectedBrand || selectedTag) && (
              <div className="flex items-center gap-1 flex-wrap">
                {selectedCategory && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    {selectedCategory}
                    <button onClick={() => setSelectedCategory(null)}><X size={12} /></button>
                  </span>
                )}
                {selectedBrand && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    {selectedBrand}
                    <button onClick={() => setSelectedBrand(null)}><X size={12} /></button>
                  </span>
                )}
                {selectedTag && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    {selectedTag}
                    <button onClick={() => setSelectedTag(null)}><X size={12} /></button>
                  </span>
                )}
                <button onClick={clearAllFilters} className="text-xs font-medium hover:underline" style={{ color: themeColor }}>
                  Clear all
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-gray-400"
            >
              <option value="default">Sort: Default</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
              <option value="sold">Best Selling</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 flex max-w-[1720px] mx-auto w-full">
        {/* Sidebar filters — desktop always visible, mobile overlay */}
        <aside className={`
          ${showFilters ? 'fixed inset-0 z-50 bg-black/40 lg:static lg:bg-transparent' : 'hidden lg:block'}
          lg:w-[260px] xl:w-[280px] flex-shrink-0
        `}>
          <div className={`
            ${showFilters ? 'absolute right-0 top-0 h-full w-[300px] sm:w-[340px]' : ''}
            lg:sticky lg:top-[57px] lg:h-[calc(100vh-57px)]
            bg-white lg:border-r border-gray-200 overflow-y-auto
          `}>
            {/* Mobile filter header */}
            {showFilters && (
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 lg:hidden">
                <h2 className="font-semibold text-gray-900">Filters</h2>
                <button onClick={() => setShowFilters(false)} className="p-1 rounded-full hover:bg-gray-100">
                  <X size={20} className="text-gray-600" />
                </button>
              </div>
            )}

            {/* Categories */}
            {activeCategories.length > 0 && (
              <FilterSection title="Categories" id="categories">
                <div className="space-y-0.5 max-h-60 overflow-y-auto">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors ${!selectedCategory ? 'font-semibold bg-gray-100' : 'text-gray-600 hover:bg-gray-50'}`}
                    style={!selectedCategory ? { color: themeColor } : undefined}
                  >
                    All Categories
                  </button>
                  {activeCategories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-colors ${eq(selectedCategory, cat.name) ? 'font-semibold bg-gray-100' : 'text-gray-600 hover:bg-gray-50'}`}
                      style={eq(selectedCategory, cat.name) ? { color: themeColor } : undefined}
                    >
                      {cat.image && (
                        <img src={normalizeImageUrl(cat.image)} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                      )}
                      <span className="flex-1 truncate">{cat.name}</span>
                      <span className="text-xs text-gray-400">{categoryCounts[cat.name.toLowerCase()] || 0}</span>
                    </button>
                  ))}
                </div>
              </FilterSection>
            )}

            {/* Brands */}
            {activeBrands.length > 0 && (
              <FilterSection title="Brands" id="brands">
                <div className="space-y-0.5 max-h-60 overflow-y-auto">
                  <button
                    onClick={() => setSelectedBrand(null)}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors ${!selectedBrand ? 'font-semibold bg-gray-100' : 'text-gray-600 hover:bg-gray-50'}`}
                    style={!selectedBrand ? { color: themeColor } : undefined}
                  >
                    All Brands
                  </button>
                  {activeBrands.map(brand => (
                    <button
                      key={brand.id}
                      onClick={() => setSelectedBrand(brand.name)}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-colors ${eq(selectedBrand, brand.name) ? 'font-semibold bg-gray-100' : 'text-gray-600 hover:bg-gray-50'}`}
                      style={eq(selectedBrand, brand.name) ? { color: themeColor } : undefined}
                    >
                      {brand.logo && (
                        <img src={normalizeImageUrl(brand.logo)} alt="" className="w-5 h-5 rounded object-contain flex-shrink-0 bg-gray-50" />
                      )}
                      <span className="flex-1 truncate">{brand.name}</span>
                      <span className="text-xs text-gray-400">{brandCounts[brand.name.toLowerCase()] || 0}</span>
                    </button>
                  ))}
                </div>
              </FilterSection>
            )}

            {/* Tags */}
            {activeTags.length > 0 && (
              <FilterSection title="Tags" id="tags">
                <div className="flex flex-wrap gap-1.5">
                  {activeTags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => setSelectedTag(prev => prev === tag.name ? null : tag.name)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${eq(selectedTag, tag.name) ? 'text-white border-transparent' : 'text-gray-600 border-gray-200 hover:border-gray-300 bg-white'}`}
                      style={eq(selectedTag, tag.name) ? { backgroundColor: themeColor, borderColor: themeColor } : undefined}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </FilterSection>
            )}

            {/* Price Range */}
            <FilterSection title="Price Range" id="price">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange?.[0] ?? ''}
                    onChange={e => {
                      const min = Number(e.target.value) || 0;
                      setPriceRange([min, priceRange?.[1] ?? priceBounds.max]);
                    }}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
                  />
                  <span className="text-gray-400 text-sm">—</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange?.[1] ?? ''}
                    onChange={e => {
                      const max = Number(e.target.value) || priceBounds.max;
                      setPriceRange([priceRange?.[0] ?? 0, max]);
                    }}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
                {priceRange && (
                  <button
                    onClick={() => setPriceRange(null)}
                    className="text-xs font-medium hover:underline"
                    style={{ color: themeColor }}
                  >
                    Clear price filter
                  </button>
                )}
              </div>
            </FilterSection>

            {/* Mobile apply button */}
            {showFilters && (
              <div className="p-4 border-t border-gray-200 lg:hidden">
                <button
                  onClick={() => setShowFilters(false)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ backgroundColor: themeColor }}
                >
                  Show {filteredProducts.length} products
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Product grid */}
        <main className="flex-1 p-2 sm:p-3 lg:p-4 pb-20 lg:pb-4">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2 md:gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredProducts.map((product, idx) => (
                <ProductCard
                  key={`ap-${product.id}-${idx}`}
                  product={product}
                  onClick={handleProductClick}
                  variant={app.websiteConfig?.productCardStyle}
                  onAddToCart={(p: any) => app.handleAddProductToCart(p, 1)}
                  onBuyNow={(p: any) => app.handlers?.handleCheckoutStart?.(p, 1)}
                  wishlist={app.wishlist}
                  onToggleWishlist={(id: number) =>
                    app.handlers?.isInWishlist(id) ? app.handlers.removeFromWishlist(id) : app.handlers?.addToWishlist(id)
                  }
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package size={48} className="text-gray-300 mb-3" />
              <h3 className="text-lg font-semibold text-gray-700 mb-1">No products found</h3>
              <p className="text-sm text-gray-400 mb-4">Try adjusting your filters or search term</p>
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: themeColor }}
              >
                Clear all filters
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Login modal */}
      {app.isLoginOpen && (
        <Suspense fallback={null}>
          <LoginModal
            onClose={() => app.setIsLoginOpen(false)}
            onLogin={app.handleLogin}
            onRegister={app.handleRegister}
            onGoogleLogin={app.handleGoogleLogin}
          />
        </Suspense>
      )}

      {/* Chat modal */}
      <Suspense fallback={null}>
        <StoreChatModal
          isOpen={app.isChatOpen}
          onClose={app.handleCloseChat}
          tenantId={app.activeTenantId}
          websiteConfig={app.websiteConfig}
          user={app.user}
          messages={app.chatMessages}
          onSendMessage={app.handleCustomerSendChat}
          context="customer"
          onEditMessage={app.handleEditChatMessage}
          onDeleteMessage={app.handleDeleteChatMessage}
          onLoginClick={() => app.setIsLoginOpen(true)}
        />
      </Suspense>

      {/* Mobile bottom nav */}
      <Suspense fallback={null}>
        <MobileBottomNav
          onHomeClick={() => router.push('/')}
          onCartClick={() => router.push('/')}
          onAccountClick={() => app.user ? router.push('/profile') : app.setIsLoginOpen(true)}
          onMenuClick={() => router.push('/categories')}
          cartCount={app.cartItems.length}
          websiteConfig={app.websiteConfig}
          onChatClick={app.handleOpenChat}
          user={app.user}
          onLogoutClick={app.handleLogout}
        />
      </Suspense>
    </div>
  );
}
