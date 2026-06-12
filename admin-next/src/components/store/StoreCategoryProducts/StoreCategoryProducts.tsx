import { useState, useMemo, Suspense, lazy, useLayoutEffect, useRef, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Package, Tag as TagIcon, X, SlidersHorizontal, Hash, Home, Search, Sparkles, Layers, GitBranch } from 'lucide-react';
import { Product, Category, SubCategory, ChildCategory, Brand, WebsiteConfig, User, Order, Tag } from '../../../types';
import { ProductCard } from '../../StoreProductComponents';
import { normalizeImageUrl } from '../../../utils/imageUrlHelper';
import { ProductFilter, SortOption } from '../../ProductFilter';

const LazyStoreHeader = lazy(() => import('../../StoreHeader').then(m => ({ default: m.StoreHeader })));
const StoreFooter = lazy(() => import('../StoreFooter').then(m => ({ default: m.StoreFooter })));
const TrackOrderModal = lazy(() => import('../TrackOrderModal').then(m => ({ default: m.TrackOrderModal })));

export interface StoreCategoryProductsProps {
  products: Product[]; categories?: Category[]; subCategories?: any[]; childCategories?: any[];
  brands?: Brand[]; tags?: Tag[]; selectedCategory: string; websiteConfig?: WebsiteConfig;
  onCategoryChange: (c: string | null) => void; onBack: () => void; onHome?: () => void; onProductClick: (p: Product) => void;
  onBuyNow?: (p: Product) => void; onQuickView?: (p: Product) => void; onAddToCart?: (p: Product) => void;
  logo?: string | null; user?: User | null; wishlistCount?: number; wishlist?: number[]; cart?: number[];
  onToggleWishlist?: (id: number) => void; onToggleCart?: (id: number) => void;
  onCheckoutFromCart?: (id: number) => void; onLoginClick?: () => void; onLogoutClick?: () => void;
  onProfileClick?: () => void; onOpenChat?: () => void; onImageSearchClick?: () => void; orders?: Order[];
}

const eq = (a?: string, b?: string) => a?.toLowerCase() === b?.toLowerCase();

const hasTag = (product: Product, tagName: string): boolean => {
  if (!product.tags || !Array.isArray(product.tags)) return false;
  return product.tags.some(t => t.toLowerCase() === tagName.toLowerCase());
};

export const StoreCategoryProducts = ({ products, categories, subCategories, childCategories, brands, tags,
  selectedCategory, onCategoryChange, onBack, onHome, onProductClick, onBuyNow, onQuickView, onAddToCart, websiteConfig,
  logo, user, wishlistCount = 0, wishlist = [], onToggleWishlist, cart = [], onToggleCart, onCheckoutFromCart,
  onLoginClick, onLogoutClick, onProfileClick, onOpenChat, onImageSearchClick, orders = [] }: StoreCategoryProductsProps) => {

  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('relevance');
  const [mobileFilter, setMobileFilter] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);

  const scrollPosRef = useRef(0);

  useLayoutEffect(() => {
    if (scrollPosRef.current > 0) {
      window.scrollTo(0, scrollPosRef.current);
    }
  }, [selectedCategory]);

  const handleCategoryChangeWithScroll = (categoryName: string | null) => {
    scrollPosRef.current = window.scrollY;
    onCategoryChange(categoryName);
  };

  const isAll = selectedCategory === '__all__';
  const isBrandFilter = selectedCategory.startsWith('brand:');
  const isTagFilter = selectedCategory.startsWith('tag:');
  const brandFromUrl = isBrandFilter ? selectedCategory.slice(6) : null;
  const tagFromUrl = isTagFilter ? selectedCategory.slice(4) : null;

  const activeCats = useMemo(() => categories?.filter(c => c.status === 'Active') || [], [categories]);
  const activeSubCats = useMemo(() => (subCategories as SubCategory[] | undefined)?.filter(s => s.status === 'Active') || [], [subCategories]);
  const activeChildCats = useMemo(() => (childCategories as ChildCategory[] | undefined)?.filter(c => c.status === 'Active') || [], [childCategories]);
  const activeBrands = useMemo(() => brands?.filter(b => b.status === 'Active') || [], [brands]);
  const activeTags = useMemo(() => tags?.filter(t => t.status === 'Active') || [], [tags]);

  const activeProducts = useMemo(() =>
    products.filter(p => !p.status || p.status === 'Active'),
    [products]
  );

  const filtered = useMemo(() => activeProducts.filter(p => {
    const brandOk = !selectedBrand || eq(p.brand, selectedBrand);
    const tagOk = !selectedTag || hasTag(p, selectedTag);
    if (isAll) return brandOk && tagOk;
    if (isBrandFilter) return eq(p.brand, brandFromUrl!) && tagOk;
    if (isTagFilter) return hasTag(p, tagFromUrl!) && brandOk;
    const matchesCategory = eq(p.category, selectedCategory);
    const matchesSubCategory = eq(p.subCategory, selectedCategory);
    const matchesChildCategory = eq(p.childCategory, selectedCategory);
    const matchesTag = hasTag(p, selectedCategory);
    return (matchesCategory || matchesSubCategory || matchesChildCategory || matchesTag) && brandOk && tagOk;
  }), [activeProducts, selectedCategory, selectedBrand, selectedTag, isAll, isBrandFilter, isTagFilter, brandFromUrl, tagFromUrl]);

  const sorted = useMemo(() => {
    const s = [...filtered];
    const sorts: Record<string, () => Product[]> = {
      'price-low': () => s.sort((a, b) => (a.price || 0) - (b.price || 0)),
      'price-high': () => s.sort((a, b) => (b.price || 0) - (a.price || 0)),
      'rating': () => s.sort((a, b) => (b.rating || 0) - (a.rating || 0)),
      'newest': () => s.sort((a, b) => (b.id || 0) - (a.id || 0)),
    };
    return sorts[sortOption]?.() || s;
  }, [filtered, sortOption]);

  const catBrands = useMemo(() => {
    if (isAll) return activeBrands;
    if (isTagFilter && tagFromUrl) {
      const names = new Set(activeProducts.filter(p => hasTag(p, tagFromUrl)).map(p => p.brand).filter(Boolean));
      return activeBrands.filter(b => names.has(b.name));
    }
    const names = new Set(activeProducts.filter(p => eq(p.category, selectedCategory) || hasTag(p, selectedCategory)).map(p => p.brand).filter(Boolean));
    return activeBrands.filter(b => names.has(b.name));
  }, [activeProducts, selectedCategory, activeBrands, isAll, isTagFilter, tagFromUrl]);

  const catTags = useMemo(() => {
    if (isAll) return activeTags;
    if (isTagFilter) return [];
    const tagNames = new Set<string>();
    activeProducts.forEach(p => {
      if (eq(p.category, selectedCategory) || isBrandFilter) {
        if (Array.isArray(p.tags)) p.tags.forEach(t => tagNames.add(t));
      }
    });
    return activeTags.filter(t => tagNames.has(t.name));
  }, [activeProducts, selectedCategory, activeTags, isAll, isTagFilter, isBrandFilter]);

  const currentCatObj = useMemo(() =>
    activeCats.find(c => eq(c.name, selectedCategory)),
    [activeCats, selectedCategory]
  );

  const catCounts = useMemo(() => {
    const m: Record<string, number> = {};
    activeProducts.forEach(p => { if (p.category) m[p.category] = (m[p.category] || 0) + 1; });
    return m;
  }, [activeProducts]);

  const subCatCounts = useMemo(() => {
    const m: Record<string, number> = {};
    activeProducts.forEach(p => { if (p.subCategory) m[p.subCategory] = (m[p.subCategory] || 0) + 1; });
    return m;
  }, [activeProducts]);

  const childCatCounts = useMemo(() => {
    const m: Record<string, number> = {};
    activeProducts.forEach(p => { if (p.childCategory) m[p.childCategory] = (m[p.childCategory] || 0) + 1; });
    return m;
  }, [activeProducts]);

  // Flash Sale header click — fired by MenuHome via custom event
  useEffect(() => {
    const handler = () => handleCategoryChangeWithScroll('tag:Flash Sale');
    window.addEventListener('storefront:flash-sale-click', handler);
    return () => window.removeEventListener('storefront:flash-sale-click', handler);
  }, []);

  const title = isAll ? 'All Products' : (isTagFilter ? tagFromUrl : (brandFromUrl || selectedCategory));
  const clearFilters = () => { setSelectedBrand(null); setSelectedTag(null); setSortOption('relevance'); };
  const closeFilter = () => setMobileFilter(false);
  const hasActiveFilters = !!(selectedBrand || selectedTag);

  const Sidebar = () => (
    <div className="space-y-4">
      {/* Categories Card */}
      <div className="rounded-2xl overflow-hidden border border-sky-100/80 shadow-sm" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(240,249,255,0.7) 100%)' }}>
        <div className="px-4 py-3.5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 50%, #0369A1 100%)' }}>
          <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-white/10 blur-lg pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-10 h-10 rounded-full bg-white/8 blur-md pointer-events-none" />
          <h3 className="relative text-white font-bold text-sm flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Package size={12} />
            </div>
            Categories
            <span className="ml-auto bg-white/25 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">{activeCats.length}</span>
          </h3>
        </div>
        <div className="divide-y divide-sky-50/80">
          <button
            onClick={() => { handleCategoryChangeWithScroll('__all__'); setSelectedBrand(null); setSelectedTag(null); closeFilter(); }}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-all duration-200 group ${isAll ? 'text-sky-800 font-semibold' : 'text-gray-600 hover:text-sky-700'}`}
            style={isAll ? { background: 'linear-gradient(90deg, rgba(56,189,248,0.12) 0%, rgba(14,165,233,0.06) 100%)' } : {}}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${isAll ? 'bg-gradient-to-br from-sky-400 to-blue-500 shadow-sm shadow-sky-200' : 'bg-gray-100/80 group-hover:bg-sky-100/60'}`}>
                <Sparkles size={14} className={isAll ? 'text-white' : 'text-gray-400 group-hover:text-sky-500'} />
              </div>
              <span>All Products</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all ${isAll ? 'bg-sky-500/15 text-sky-700' : 'bg-gray-100 text-gray-400'}`}>{activeProducts.length}</span>
              <ChevronRight size={13} className={`transition-all duration-200 ${isAll ? 'rotate-90 text-sky-500' : 'text-gray-300 group-hover:text-sky-400 group-hover:translate-x-0.5'}`} />
            </div>
          </button>
          {activeCats.map(c => {
            const active = !isAll && eq(selectedCategory, c.name);
            const count = catCounts[c.name] || 0;
            return (
              <button key={c.id} onClick={() => { handleCategoryChangeWithScroll(c.name); setSelectedBrand(null); setSelectedTag(null); closeFilter(); }}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-all duration-200 group ${active ? 'text-sky-800 font-semibold' : 'text-gray-600 hover:text-sky-700'}`}
                style={active ? { background: 'linear-gradient(90deg, rgba(56,189,248,0.12) 0%, rgba(14,165,233,0.06) 100%)' } : {}}>
                <div className="flex items-center gap-3">
                  {c.image
                    ? <img src={normalizeImageUrl(c.image)} alt={c.name} className={`w-8 h-8 rounded-xl object-cover border-2 transition-all duration-200 ${active ? 'border-sky-300 ring-2 ring-sky-200/50 shadow-sm' : 'border-gray-100 group-hover:border-sky-200'}`} />
                    : <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${active ? 'bg-gradient-to-br from-sky-400 to-blue-500 shadow-sm shadow-sky-200' : 'bg-gray-100/80 group-hover:bg-sky-100/60'}`}>
                        <Package size={14} className={active ? 'text-white' : 'text-gray-400 group-hover:text-sky-500'} />
                      </div>}
                  <span className="truncate">{c.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {count > 0 && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all ${active ? 'bg-sky-500/15 text-sky-700' : 'bg-gray-100 text-gray-400'}`}>{count}</span>}
                  <ChevronRight size={13} className={`transition-all duration-200 ${active ? 'rotate-90 text-sky-500' : 'text-gray-300 group-hover:text-sky-400 group-hover:translate-x-0.5'}`} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-Categories Card */}
      {activeSubCats.length > 0 && (
        <div className="rounded-2xl overflow-hidden border border-indigo-100/80 shadow-sm" style={{ background: 'rgba(255,255,255,0.95)' }}>
          <div className="px-4 py-3.5 relative overflow-hidden bg-indigo-500">
            <div className="absolute -top-3 -right-3 w-14 h-14 rounded-full bg-white/10 blur-lg pointer-events-none" />
            <h3 className="relative text-white font-bold text-sm flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Layers size={12} />
              </div>
              Sub Categories
              <span className="ml-auto bg-white/25 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">{activeSubCats.length}</span>
            </h3>
          </div>
          <div className="divide-y divide-indigo-50/80">
            {activeSubCats.map(sc => {
              const active = eq(selectedCategory, sc.name);
              const count = subCatCounts[sc.name] || 0;
              return (
                <button key={sc.id} onClick={() => { handleCategoryChangeWithScroll(sc.name); setSelectedBrand(null); setSelectedTag(null); closeFilter(); }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-all duration-200 group ${active ? 'text-indigo-800 font-semibold bg-indigo-50' : 'text-gray-600 hover:text-indigo-700 hover:bg-indigo-50/50'}`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${active ? 'bg-indigo-500 shadow-sm' : 'bg-gray-100/80 group-hover:bg-indigo-100/60'}`}>
                      <Layers size={12} className={active ? 'text-white' : 'text-gray-400 group-hover:text-indigo-500'} />
                    </div>
                    <span className="truncate">{sc.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {count > 0 && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${active ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-400'}`}>{count}</span>}
                    <ChevronRight size={13} className={`transition-all duration-200 ${active ? 'rotate-90 text-indigo-500' : 'text-gray-300 group-hover:text-indigo-400'}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Child Categories Card */}
      {activeChildCats.length > 0 && (
        <div className="rounded-2xl overflow-hidden border border-violet-100/80 shadow-sm" style={{ background: 'rgba(255,255,255,0.95)' }}>
          <div className="px-4 py-3.5 relative overflow-hidden bg-violet-500">
            <div className="absolute -top-3 -right-3 w-14 h-14 rounded-full bg-white/10 blur-lg pointer-events-none" />
            <h3 className="relative text-white font-bold text-sm flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <GitBranch size={12} />
              </div>
              Child Categories
              <span className="ml-auto bg-white/25 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">{activeChildCats.length}</span>
            </h3>
          </div>
          <div className="divide-y divide-violet-50/80">
            {activeChildCats.map(cc => {
              const active = eq(selectedCategory, cc.name);
              const count = childCatCounts[cc.name] || 0;
              return (
                <button key={cc.id} onClick={() => { handleCategoryChangeWithScroll(cc.name); setSelectedBrand(null); setSelectedTag(null); closeFilter(); }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-all duration-200 group ${active ? 'text-violet-800 font-semibold bg-violet-50' : 'text-gray-600 hover:text-violet-700 hover:bg-violet-50/50'}`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${active ? 'bg-violet-500 shadow-sm' : 'bg-gray-100/80 group-hover:bg-violet-100/60'}`}>
                      <GitBranch size={12} className={active ? 'text-white' : 'text-gray-400 group-hover:text-violet-500'} />
                    </div>
                    <span className="truncate">{cc.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {count > 0 && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${active ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-400'}`}>{count}</span>}
                    <ChevronRight size={13} className={`transition-all duration-200 ${active ? 'rotate-90 text-violet-500' : 'text-gray-300 group-hover:text-violet-400'}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tags Card */}
      {activeTags.length > 0 && (
        <div className="rounded-2xl overflow-hidden border border-orange-100/80 shadow-sm" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,247,237,0.7) 100%)' }}>
          <div className="px-4 py-3.5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #FB923C 0%, #F97316 50%, #EA580C 100%)' }}>
            <div className="absolute -top-3 -right-3 w-14 h-14 rounded-full bg-white/10 blur-lg pointer-events-none" />
            <h3 className="relative text-white font-bold text-sm flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Hash size={12} />
              </div>
              Tags
              <span className="ml-auto bg-white/25 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">{activeTags.length}</span>
            </h3>
          </div>
          <div className="p-3 flex flex-wrap gap-2">
            {activeTags.map(t => {
              const active = isTagFilter ? eq(tagFromUrl || undefined, t.name) : selectedTag === t.name;
              return (
                <button key={t.id} onClick={() => { if (isTagFilter) { handleCategoryChangeWithScroll(`tag:${t.name}`); } else { setSelectedTag(prev => prev === t.name ? null : t.name); } closeFilter(); }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${active ? 'text-white shadow-md shadow-orange-200/50' : 'bg-orange-50/80 text-orange-600 hover:bg-orange-100 hover:text-orange-700 border border-orange-100/60'}`}
                  style={active ? { background: 'linear-gradient(135deg, #FB923C 0%, #EA580C 100%)' } : {}}>
                  <Hash size={10} />{t.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Brands Card */}
      {catBrands.length > 0 && (
        <div className="rounded-2xl overflow-hidden border border-sky-100/60 shadow-sm" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(240,249,255,0.5) 100%)' }}>
          <div className="px-4 py-3.5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 50%, #0369A1 100%)' }}>
            <div className="absolute -bottom-2 -left-2 w-12 h-12 rounded-full bg-white/10 blur-md pointer-events-none" />
            <h3 className="relative text-white font-bold text-sm flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <TagIcon size={12} />
              </div>
              Brands
              <span className="ml-auto bg-white/25 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">{catBrands.length}</span>
            </h3>
          </div>
          <div className="divide-y divide-sky-50/60">
            {catBrands.map(b => (
              <button key={b.id} onClick={() => { setSelectedBrand(p => p === b.name ? null : b.name); closeFilter(); }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200 group ${selectedBrand === b.name ? 'text-sky-800 font-semibold' : 'text-gray-600 hover:text-sky-700'}`}
                style={selectedBrand === b.name ? { background: 'linear-gradient(90deg, rgba(56,189,248,0.12) 0%, rgba(14,165,233,0.04) 100%)' } : {}}>
                {b.logo
                  ? <img src={normalizeImageUrl(b.logo)} alt={b.name} className={`w-8 h-8 rounded-xl object-contain border-2 bg-white p-1 transition-all duration-200 ${selectedBrand === b.name ? 'border-sky-300 ring-2 ring-sky-200/50 shadow-sm' : 'border-gray-100 group-hover:border-sky-200'}`} />
                  : <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${selectedBrand === b.name ? 'bg-gradient-to-br from-sky-400 to-blue-500 shadow-sm' : 'bg-gray-100/80 group-hover:bg-sky-100/60'}`}>
                      <TagIcon size={13} className={selectedBrand === b.name ? 'text-white' : 'text-gray-400 group-hover:text-sky-500'} />
                    </div>}
                <span className="flex-1 truncate text-left">{b.name}</span>
                {selectedBrand === b.name && (
                  <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}>
                    <X size={10} className="text-white" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button onClick={() => { clearFilters(); closeFilter(); }}
          className="w-full py-3 px-4 rounded-2xl text-white text-sm font-bold shadow-lg shadow-orange-200/40 hover:shadow-xl hover:shadow-orange-200/50 transition-all duration-200 flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #FB923C 0%, #EA580C 100%)' }}>
          <X size={14} /> Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #f0f9ff 0%, #f8fafc 60%, #f8fafc 100%)' }}>
      <Suspense fallback={null}>
        <LazyStoreHeader onTrackOrder={() => setIsTrackOrderOpen(true)} onHomeClick={onHome || onBack} ImageSearchClick={onImageSearchClick} productCatalog={activeProducts}
          wishlistCount={wishlistCount} wishlist={wishlist} onToggleWishlist={onToggleWishlist} cart={cart}
          onToggleCart={onToggleCart} onCheckoutFromCart={onCheckoutFromCart} user={user} onLoginClick={onLoginClick}
          onLogoutClick={onLogoutClick} onProfileClick={onProfileClick} logo={logo} websiteConfig={websiteConfig}
          searchValue={searchTerm} onSearchChange={setSearchTerm} onCategoriesClick={onBack} onProductsClick={onBack}
          categoriesList={activeCats.map(c => c.name)} onCategorySelect={handleCategoryChangeWithScroll} onProductClick={onProductClick}
          categories={categories} subCategories={subCategories} childCategories={childCategories} brands={brands} tags={tags} />
      </Suspense>

      {/* Hero Header */}
    
      {/* Sticky Toolbar */}
      <div className="sticky top-[60px] z-20 border-b border-gray-200/80" style={{ background: 'rgba(255,255,255,0.93)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center gap-2 sm:gap-3">
          {selectedBrand && (
            <span className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
              <TagIcon size={11} />{selectedBrand}
              <button onClick={() => setSelectedBrand(null)} className="ml-0.5 w-4 h-4 rounded-full bg-blue-200 hover:bg-blue-300 flex items-center justify-center transition"><X size={9} /></button>
            </span>
          )}
          {selectedTag && (
            <span className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-semibold">
              <Hash size={11} />{selectedTag}
              <button onClick={() => setSelectedTag(null)} className="ml-0.5 w-4 h-4 rounded-full bg-violet-200 hover:bg-violet-300 flex items-center justify-center transition"><X size={9} /></button>
            </span>
          )}
          <div className="flex-1" />
          <ProductFilter products={sorted} sortBy={sortOption} onSortChange={(s, _) => setSortOption(s)} />
          <button onClick={() => setMobileFilter(true)}
            className={`lg:hidden flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${hasActiveFilters ? 'bg-sky-500 text-white shadow-sm shadow-sky-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            <SlidersHorizontal size={15} /><span>Filters</span>
            {hasActiveFilters && <span className="w-4 h-4 rounded-full bg-white/30 text-white text-[10px] font-bold flex items-center justify-center">{(selectedBrand ? 1 : 0) + (selectedTag ? 1 : 0)}</span>}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
          <div className="flex gap-4 lg:gap-7">
            <aside className="hidden lg:block w-60 xl:w-64 flex-shrink-0">
              <div className="sticky top-[114px]"><Sidebar /></div>
            </aside>
            <div className="flex-1 min-w-0">
              {sorted.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {sorted.map(p => <ProductCard key={`cat-${p.id}`} product={p} onClick={onProductClick} onBuyNow={onBuyNow} variant={websiteConfig?.productCardStyle} onQuickView={onQuickView} onAddToCart={onAddToCart} wishlist={wishlist} onToggleWishlist={onToggleWishlist} />)}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                  <div className="relative mb-6">
                    <div className="w-28 h-28 rounded-3xl flex items-center justify-center shadow-inner" style={{ background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)' }}>
                      <Package size={52} className="text-sky-300" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shadow-sm">
                      <Search size={18} className="text-orange-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-1">No products found</h3>
                  <p className="text-gray-400 text-sm max-w-xs">
                    {hasActiveFilters ? 'No products match the selected filters. Try clearing or changing them.' : `No products in "${title}" yet.`}
                  </p>
                  {hasActiveFilters && (
                    <button onClick={clearFilters}
                      className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:shadow-md"
                      style={{ background: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)' }}>
                      <X size={14} /> Clear Filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile filter — bottom sheet */}
      {mobileFilter && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={closeFilter} />
          <div className="relative bg-gray-50 rounded-t-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300 max-h-[85vh] flex flex-col">
            <div className="flex-shrink-0 flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-gray-300" /></div>
            <div className="flex-shrink-0 px-5 py-3 flex items-center justify-between border-b border-gray-200/60">
              <div>
                <h2 className="font-bold text-gray-900 text-base">Filters</h2>
                {hasActiveFilters && <p className="text-xs text-sky-600 font-medium">{(selectedBrand ? 1 : 0) + (selectedTag ? 1 : 0)} active</p>}
              </div>
              <button onClick={closeFilter} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition"><X size={16} className="text-gray-700" /></button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain p-4"><Sidebar /></div>
          </div>
        </div>
      )}

      <Suspense fallback={null}><StoreFooter websiteConfig={websiteConfig} logo={logo} onOpenChat={onOpenChat} /></Suspense>

      {isTrackOrderOpen && (
        <Suspense fallback={null}>
          <TrackOrderModal onClose={() => setIsTrackOrderOpen(false)} orders={orders} />
        </Suspense>
      )}
    </div>
  );
};

export default StoreCategoryProducts;
