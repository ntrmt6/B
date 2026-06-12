/**
 * StoreFront1 – Minimal Variant
 * Monochrome, lots of whitespace, thin borders, light font
 */

import React, { memo, useMemo, useState, useCallback, useEffect } from 'react';
import { Package } from 'lucide-react';
import type { Product, WebsiteConfig } from '../../types';
import { normalizeImageUrl } from '../../utils/imageUrlHelper';
import { LazySection } from './LazySection';
import { useActiveProducts } from './storefrontShared';

// ─── Shared Interface ────────────────────────────────────────────────────────
interface StoreFrontThemeProps {
  products: Product[];
  categories: any[];
  brands: any[];
  websiteConfig?: WebsiteConfig;
  logo?: string | null;
  onProductClick: (product: Product) => void;
  onBuyNow?: (product: Product) => void;
  onAddToCart?: (product: Product, quantity: number, variant: any) => void;
  onCategoryClick?: (categorySlug: string) => void;
  onOpenChat?: () => void;
}

// ─── Palette ─────────────────────────────────────────────────────────────────
const M = {
  text: '#111111',
  textMuted: '#999999',
  border: '#eeeeee',
  bg: '#ffffff',
  accent: '#111111',
  font: "'Inter', sans-serif",
} as const;

// ─── Sub-components ──────────────────────────────────────────────────────────
const MinimalProductCard = memo(({ product, onClick, onAddToCart }: {
  product: Product; onClick: () => void; onAddToCart?: () => void;
}) => {
  const img = product.galleryImages?.[0] || product.image;
  const price = product.salePrice || product.price || 0;
  const originalPrice = product.price && product.salePrice && product.price > product.salePrice ? product.price : null;

  return (
    <div className="group cursor-pointer" onClick={onClick}>
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-50 mb-4">
        {img ? (
          <img src={normalizeImageUrl(img)} alt={product.title} className="w-full h-full object-cover group-hover:opacity-90 transition-opacity duration-300" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-200"><Package size={40} /></div>
        )}
        <button onClick={(e) => { e.stopPropagation(); onAddToCart?.(); }}
          className="absolute bottom-4 left-4 right-4 py-2.5 bg-black text-white text-xs text-center tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ fontFamily: M.font }}>
          Add to Cart
        </button>
      </div>
      <h3 className="text-sm font-normal mb-1 line-clamp-1" style={{ fontFamily: M.font, color: M.text }}>{product.title}</h3>
      <div className="flex items-center gap-2">
        <span className="text-sm" style={{ color: M.text, fontFamily: M.font }}>৳{price}</span>
        {originalPrice && <span className="text-xs line-through" style={{ color: M.textMuted }}>৳{originalPrice}</span>}
      </div>
    </div>
  );
});
MinimalProductCard.displayName = 'MinimalProductCard';

const MinimalHero = memo(({ websiteConfig }: { websiteConfig?: WebsiteConfig }) => {
  const items = (websiteConfig?.carouselItems || [])
    .filter(i => String(i.status ?? '').trim().toLowerCase() === 'publish')
    .sort((a, b) => Number(a.serial ?? 0) - Number(b.serial ?? 0));
  const [slide, setSlide] = useState(0);
  const current = items[slide] || null;

  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => setSlide(p => (p + 1) % items.length), 7000);
    return () => clearInterval(t);
  }, [items.length]);

  const heroImage = current?.imageUrl || current?.image || null;

  return (
    <div className="relative" style={{ backgroundColor: '#f5f5f5', minHeight: '400px' }}>
      {heroImage && (
        <img src={normalizeImageUrl(heroImage)} alt="Hero" className="absolute inset-0 w-full h-full object-cover opacity-80" />
      )}
      <div className="relative z-10 max-w-[1000px] mx-auto px-6 py-32 text-center">
        <h1 className="text-3xl md:text-5xl font-light tracking-tight mb-4" style={{ fontFamily: M.font, color: M.text }}>
          {current?.title || 'Less is More'}
        </h1>
        <p className="text-base mb-8" style={{ color: M.textMuted, fontFamily: M.font }}>
          {current?.subtitle || 'Thoughtfully designed, carefully crafted'}
        </p>
        <button className="px-8 py-3 text-xs uppercase tracking-[0.15em] bg-black text-white hover:bg-gray-800 transition-colors" style={{ fontFamily: M.font }}>
          Discover
        </button>
      </div>
      {items.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-10">
          {items.map((_: any, i: number) => (
            <button key={i} onClick={() => setSlide(i)} className="w-6 h-[1px] transition-colors" style={{ backgroundColor: i === slide ? '#111' : '#ccc' }} />
          ))}
        </div>
      )}
    </div>
  );
});
MinimalHero.displayName = 'MinimalHero';

// ─── Main Component ──────────────────────────────────────────────────────────
export const StoreFront1Minimal: React.FC<StoreFrontThemeProps> = memo(({
  products, categories, brands, websiteConfig, logo, onProductClick, onBuyNow, onAddToCart, onCategoryClick, onOpenChat,
}) => {
  const active = useActiveProducts(products);
  const trending = useMemo(() => [...active].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 8), [active]);
  const bestSelling = useMemo(() => [...active].sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0)).slice(0, 8), [active]);
  const newArrivals = useMemo(() => active.slice(0, 6), [active]);
  const handleAddToCart = useCallback((p: Product) => onAddToCart?.(p, 1, {}), [onAddToCart]);

  const activeCategories = useMemo(() => categories.filter(c => c.status === 'Active' || !c.status).slice(0, 6), [categories]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: M.bg, fontFamily: M.font }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />

      <MinimalHero websiteConfig={websiteConfig} />

      {/* Categories – thin underline style */}
      {activeCategories.length > 0 && (
        <section className="max-w-[1000px] mx-auto px-6 py-10 border-b" style={{ borderColor: M.border }}>
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-2">
            {activeCategories.map((cat: any) => (
              <button key={cat.id || cat.name} onClick={() => onCategoryClick?.(cat.slug || cat.name)}
                className="text-xs tracking-widest uppercase hover:underline underline-offset-4 transition-all"
                style={{ color: M.text }}>
                {cat.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* New */}
      {newArrivals.length > 0 && (
        <LazySection fallback={<div style={{ minHeight: '400px' }} />} rootMargin="0px 0px 300px" minHeight="400px">
          <section className="max-w-[1000px] mx-auto px-6 py-14">
            <h2 className="text-2xl font-light text-center mb-10 tracking-tight" style={{ color: M.text }}>New Arrivals</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-10">
              {newArrivals.map(p => (
                <MinimalProductCard key={p.id} product={p} onClick={() => onProductClick(p)} onAddToCart={() => handleAddToCart(p)} />
              ))}
            </div>
          </section>
        </LazySection>
      )}

      {/* Divider + Popular */}
      <LazySection fallback={<div style={{ minHeight: '400px' }} />} rootMargin="0px 0px 300px" minHeight="400px">
        <div className="max-w-[200px] mx-auto border-b" style={{ borderColor: M.border }} />
        {/* Trending */}
        {trending.length > 0 && (
          <section className="max-w-[1000px] mx-auto px-6 py-14">
            <h2 className="text-2xl font-light text-center mb-10 tracking-tight" style={{ color: M.text }}>Popular</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {trending.map(p => (
                <MinimalProductCard key={p.id} product={p} onClick={() => onProductClick(p)} onAddToCart={() => handleAddToCart(p)} />
              ))}
            </div>
          </section>
        )}
      </LazySection>

      {/* Divider + Best Sellers */}
      <LazySection fallback={<div style={{ minHeight: '400px' }} />} rootMargin="0px 0px 300px" minHeight="400px">
        <div className="max-w-[200px] mx-auto border-b" style={{ borderColor: M.border }} />
        {/* Best Sellers */}
        {bestSelling.length > 0 && (
          <section className="max-w-[1000px] mx-auto px-6 py-14">
            <h2 className="text-2xl font-light text-center mb-10 tracking-tight" style={{ color: M.text }}>Best Sellers</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {bestSelling.map(p => (
                <MinimalProductCard key={p.id} product={p} onClick={() => onProductClick(p)} onAddToCart={() => handleAddToCart(p)} />
              ))}
            </div>
          </section>
        )}
      </LazySection>

      {/* Footer */}
      <LazySection fallback={<div style={{ minHeight: '100px' }} />} rootMargin="0px 0px 400px" minHeight="100px">
      <footer className="py-10 border-t" style={{ borderColor: M.border }}>
        <div className="max-w-[1000px] mx-auto px-6 text-center">
          {logo ? (
            <img src={normalizeImageUrl(logo)} alt={websiteConfig?.storeName || 'Store'} className="h-6 object-contain mx-auto mb-4" />
          ) : (
            <span className="text-sm font-medium block mb-4" style={{ color: M.text }}>{websiteConfig?.storeName || 'Store'}</span>
          )}
          <p className="text-xs" style={{ color: M.textMuted }}>© {new Date().getFullYear()} {websiteConfig?.storeName || 'Store'}</p>
        </div>
      </footer>
      </LazySection>
    </div>
  );
});
StoreFront1Minimal.displayName = 'StoreFront1Minimal';

export default StoreFront1Minimal;
