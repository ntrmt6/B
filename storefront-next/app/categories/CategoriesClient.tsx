'use client';
import { Suspense, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../providers';
import { ArrowLeft, Search, ChevronDown, Package } from 'lucide-react';
import { normalizeImageUrl } from '@/utils/imageUrlHelper';
import { ProductCard } from '@/components/StoreProductComponents';
import dynamic from 'next/dynamic';
import { Button } from '../components/ui/button';

const MobileBottomNav = dynamic(
  () => import('@/components/store/MobileBottomNav').then(m => ({ default: m.MobileBottomNav })),
  { ssr: false }
);

const eq = (a?: string | null, b?: string | null) => a?.toLowerCase() === b?.toLowerCase();

export default function CategoriesClient() {
  const router = useRouter();
  const app = useApp();

  const activeCategories = useMemo(() =>
    (app.categories || []).filter(c => !c.status || c.status === 'Active').sort((a, b) => (a.serial ?? Infinity) - (b.serial ?? Infinity)),
    [app.categories]);
  const activeSubCategories = useMemo(() =>
    (app.subCategories || []).filter(sc => !sc.status || sc.status === 'Active').sort((a, b) => (a.serial ?? Infinity) - (b.serial ?? Infinity)),
    [app.subCategories]);
  const activeChildCategories = useMemo(() =>
    (app.childCategories || []).filter(cc => !cc.status || cc.status === 'Active').sort((a, b) => (a.serial ?? Infinity) - (b.serial ?? Infinity)),
    [app.childCategories]);
  const activeProducts = useMemo(() =>
    (app.products || []).filter(p => !p.status || p.status === 'Active'),
    [app.products]);

  const [expandedCatId, setExpandedCatId] = useState<string | null>(null);
  const [expandedSubCatId, setExpandedSubCatId] = useState<string | null>(null);
  const [filterName, setFilterName] = useState<string | null>(null);
  const [filterLabel, setFilterLabel] = useState<string>('');

  const firstCategory = activeCategories[0] ?? null;
  const effectiveFilterName = filterName || firstCategory?.name || null;
  const effectiveFilterLabel = filterLabel || firstCategory?.name || '';
  const effectiveExpandedCatId = expandedCatId ?? firstCategory?.id ?? null;

  const getSubsForCategory = useCallback((catId: string) =>
    activeSubCategories.filter(sc => sc.categoryId === catId), [activeSubCategories]);
  const getChildrenForSub = useCallback((subId: string) =>
    activeChildCategories.filter(cc => cc.subCategoryId === subId), [activeChildCategories]);

  const handleCategoryClick = useCallback((cat: { id: string; name: string }) => {
    const subs = getSubsForCategory(cat.id);
    if (subs.length > 0) setExpandedCatId(prev => prev === cat.id ? null : cat.id);
    setExpandedSubCatId(null);
    setFilterName(cat.name);
    setFilterLabel(cat.name);
  }, [getSubsForCategory]);

  const handleSubCategoryClick = useCallback((sub: { id: string; name: string }) => {
    const children = getChildrenForSub(sub.id);
    if (children.length > 0) setExpandedSubCatId(prev => prev === sub.id ? null : sub.id);
    setFilterName(sub.name);
    setFilterLabel(sub.name);
  }, [getChildrenForSub]);

  const handleChildCategoryClick = useCallback((child: { name: string }) => {
    setFilterName(child.name);
    setFilterLabel(child.name);
  }, []);

  const filteredProducts = useMemo(() => {
    if (!effectiveFilterName) return [];
    return activeProducts.filter(p =>
      eq(p.category, effectiveFilterName) ||
      eq(p.subCategory, effectiveFilterName) ||
      eq(p.childCategory, effectiveFilterName)
    );
  }, [activeProducts, effectiveFilterName]);

  const themeColor = typeof app.websiteConfig?.themeColors === 'string' 
    ? app.websiteConfig.themeColors 
    : '#F97316';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-3 py-2 flex items-center gap-2">
        <button onClick={() => router.back()} className="p-1 rounded-full hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <h1 className="text-base font-semibold text-gray-800 flex-1">Categories</h1>
        <button onClick={() => router.push('/all-products')} className="p-1 rounded-full hover:bg-gray-100">
          <Search size={20} className="text-gray-700" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden pb-16">
        {/* Sidebar */}
        <div className="w-[110px] sm:w-[140px] flex-shrink-0 overflow-y-auto bg-gray-50 border-r border-gray-200">
          {activeCategories.map((category) => {
            const isExpanded = category.id === effectiveExpandedCatId;
            const isActive = eq(effectiveFilterName, category.name);
            const subs = getSubsForCategory(category.id);
            return (
              <div key={category.id}>
                <button onClick={() => handleCategoryClick(category)}
                  className={`w-full flex items-center gap-1.5 px-2 py-2 text-left transition-all relative ${isActive ? 'bg-white' : 'hover:bg-gray-100'}`}>
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r" style={{ backgroundColor: themeColor }} />}
                  <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden bg-gray-100">
                    {category.image ? (
                      <img src={normalizeImageUrl(category.image)} alt={category.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : <Package size={14} className="text-gray-400" />}
                  </div>
                  <span className={`flex-1 text-[11px] leading-tight line-clamp-2 ${isActive ? 'font-semibold' : 'font-medium text-gray-600'}`}
                    style={isActive ? { color: themeColor } : undefined}>
                    {category.name}
                  </span>
                  {subs.length > 0 && <ChevronDown size={12} className={`flex-shrink-0 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />}
                </button>
                {isExpanded && subs.length > 0 && (
                  <div className="bg-white">
                    {subs.map((sub) => {
                      const isSubActive = eq(effectiveFilterName, sub.name);
                      const children = getChildrenForSub(sub.id);
                      const isSubExpanded = expandedSubCatId === sub.id;
                      return (
                        <div key={sub.id}>
                          <button onClick={() => handleSubCategoryClick(sub)}
                            className={`w-full flex items-center gap-1 pl-6 pr-2 py-1.5 text-left transition-all ${isSubActive ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
                            <span className={`flex-1 text-[10.5px] leading-tight line-clamp-2 ${isSubActive ? 'font-semibold' : 'font-medium text-gray-500'}`}
                              style={isSubActive ? { color: themeColor } : undefined}>{sub.name}</span>
                            {children.length > 0 && <ChevronDown size={10} className={`text-gray-400 transition-transform ${isSubExpanded ? 'rotate-180' : ''}`} />}
                          </button>
                          {isSubExpanded && children.length > 0 && (
                            <div className="bg-gray-50">
                              {children.map((child) => {
                                const isChildActive = eq(effectiveFilterName, child.name);
                                return (
                                  <button key={child.id} onClick={() => handleChildCategoryClick(child)}
                                    className={`w-full text-left pl-10 pr-2 py-1.5 transition-all ${isChildActive ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>
                                    <span className={`text-[10px] leading-tight line-clamp-2 ${isChildActive ? 'font-semibold' : 'font-medium text-gray-500'}`}
                                      style={isChildActive ? { color: themeColor } : undefined}>{child.name}</span>
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
          {activeCategories.length === 0 && <div className="p-3 text-center text-xs text-gray-400">No categories</div>}
        </div>

        {/* Products panel */}
        <div className="flex-1 overflow-y-auto">
          {effectiveFilterLabel && (
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-2 py-1.5 flex items-center justify-between">
              <h2 className="text-xs font-semibold text-gray-800 truncate">{effectiveFilterLabel}</h2>
              <span className="text-[10px] text-gray-400">{filteredProducts.length} items</span>
            </div>
          )}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-0.5 p-0.5 sm:gap-1 sm:p-1 md:grid-cols-3 lg:grid-cols-4">
              {filteredProducts.map((p, idx) => (
                <ProductCard
                  key={`cat-${p.id}-${idx}`}
                  product={p}
                  onClick={(product: any) => product.slug && router.push(`/product-details/${product.slug}`)}
                  variant={app.websiteConfig?.productCardStyle}
                  onAddToCart={(product: any) => app.handleAddProductToCart(product, 1)}
                  onBuyNow={(product: any) => app.handlers?.handleCheckoutStart?.(product, 1)}
                  wishlist={app.wishlist}
                  onToggleWishlist={(id: number) =>
                    app.handlers?.isInWishlist(id) ? app.handlers.removeFromWishlist(id) : app.handlers?.addToWishlist(id)
                  }
                />
              ))}
            </div>
          ) : effectiveFilterName ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Package size={32} className="text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">No products in this category</p>
              <Button
                onClick={() => router.push('/all-products')}
                variant="ghost"
                size="sm"
                className="mt-2 text-xs font-medium"
                style={{ color: themeColor, backgroundColor: `${themeColor}15` }}
              >
                Browse All Products
              </Button>
            </div>
          ) : null}
        </div>
      </div>

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
