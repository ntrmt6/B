/**
 * StoreFront1 – Elegant Variant
 * Rose-gold + charcoal, serif font, minimal grid, editorial feel
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
const E = {
  primary: '#3d3029',       // charcoal brown
  accent: '#c9956b',        // rose-gold
  accentLight: '#fdf6f0',   // warm cream
  bg: '#faf8f5',            // off-white
  text: '#2d2420',
  textMuted: '#8c7e75',
  font: "'Playfair Display', 'Georgia', serif",
  fontBody: "'Lato', sans-serif",
} as const;

// ─── Sub-components ──────────────────────────────────────────────────────────
const ElegantProductCard = memo(({ product, onClick, onAddToCart }: {
  product: Product; onClick: () => void; onAddToCart?: () => void;
}) => {
  const img = product.galleryImages?.[0] || product.image;
  const price = product.salePrice || product.price || 0;
  const originalPrice = product.price && product.salePrice && product.price > product.salePrice ? product.price : null;
  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  return (
    <div className="group cursor-pointer" onClick={onClick}>
      <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-gray-100 mb-3">
        {img ? (
          <img src={normalizeImageUrl(img)} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300"><Package size={40} /></div>
        )}
        {discount > 0 && (
          <span className="absolute top-3 left-3 text-white text-xs px-2.5 py-1 tracking-widest uppercase" style={{ backgroundColor: E.accent, fontFamily: E.fontBody, fontSize: '10px', letterSpacing: '0.1em' }}>{discount}% off</span>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button onClick={(e) => { e.stopPropagation(); onAddToCart?.(); }}
            className="w-full py-2.5 text-white text-xs uppercase tracking-[0.15em] border border-white/80 hover:bg-white hover:text-gray-900 transition-colors"
            style={{ fontFamily: E.fontBody }}>
            Add to Bag
          </button>
        </div>
      </div>
      <h3 className="text-sm font-normal tracking-wide line-clamp-1 mb-1" style={{ fontFamily: E.font, color: E.text }}>{product.title}</h3>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold" style={{ color: E.accent, fontFamily: E.fontBody }}>৳{price}</span>
        {originalPrice && <span className="text-xs line-through" style={{ color: E.textMuted }}>৳{originalPrice}</span>}
      </div>
    </div>
  );
});
ElegantProductCard.displayName = 'ElegantProductCard';

const ElegantHero = memo(({ websiteConfig }: { websiteConfig?: WebsiteConfig }) => {
  const [slide, setSlide] = useState(0);
  const items = (websiteConfig?.carouselItems || [])
    .filter(i => String(i.status ?? '').trim().toLowerCase() === 'publish')
    .sort((a, b) => Number(a.serial ?? 0) - Number(b.serial ?? 0));
  const current = items[slide] || null;

  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => setSlide(p => (p + 1) % items.length), 6000);
    return () => clearInterval(t);
  }, [items.length]);

  const heroImage = current?.imageUrl || current?.image || null;

  return (
    <div className="relative overflow-hidden" style={{ backgroundColor: E.primary, minHeight: '480px' }}>
      {heroImage && (
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: `url(${normalizeImageUrl(heroImage)})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      )}
      <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-24 flex flex-col items-center text-center">
        <span className="uppercase text-xs tracking-[0.3em] mb-4" style={{ color: E.accent, fontFamily: E.fontBody }}>New Collection</span>
        <h1 className="text-4xl md:text-6xl text-white leading-tight mb-6" style={{ fontFamily: E.font }}>
          {current?.title || 'Curated Elegance'}
        </h1>
        <p className="text-white/60 text-base max-w-lg mb-8" style={{ fontFamily: E.fontBody }}>
          {current?.subtitle || 'Discover handpicked selections for refined taste'}
        </p>
        <button className="px-10 py-3 text-xs uppercase tracking-[0.2em] border border-white/60 text-white hover:bg-white hover:text-gray-900 transition-colors" style={{ fontFamily: E.fontBody }}>
          Explore Now
        </button>
      </div>
      {items.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-10">
          {items.map((_: any, i: number) => (
            <button key={i} onClick={() => setSlide(i)} className="w-8 h-[2px] transition-colors" style={{ backgroundColor: i === slide ? E.accent : 'rgba(255,255,255,0.3)' }} />
          ))}
        </div>
      )}
    </div>
  );
});
ElegantHero.displayName = 'ElegantHero';

// ─── Main Component ──────────────────────────────────────────────────────────
export const StoreFront1Elegant: React.FC<StoreFrontThemeProps> = memo(({
  products, categories, brands, websiteConfig, logo, onProductClick, onBuyNow, onAddToCart, onCategoryClick, onOpenChat,
}) => {
  const active = useActiveProducts(products);
  const trending = useMemo(() => [...active].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 8), [active]);
  const bestSelling = useMemo(() => [...active].sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0)).slice(0, 8), [active]);
  const newArrivals = useMemo(() => active.slice(0, 6), [active]);
  const handleAddToCart = useCallback((p: Product) => onAddToCart?.(p, 1, {}), [onAddToCart]);

  const activeCategories = useMemo(() => categories.filter(c => c.status === 'Active' || !c.status).slice(0, 6), [categories]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: E.bg, fontFamily: E.fontBody }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Lato:wght@300;400;700&display=swap" rel="stylesheet" />

      <ElegantHero websiteConfig={websiteConfig} />

      {/* Categories as text links */}
      {activeCategories.length > 0 && (
        <section className="max-w-[1200px] mx-auto px-6 py-12 border-b" style={{ borderColor: '#e8e0d8' }}>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
            {activeCategories.map((cat: any) => (
              <button key={cat.id || cat.name} onClick={() => onCategoryClick?.(cat.slug || cat.name)}
                className="uppercase text-xs tracking-[0.2em] hover:opacity-60 transition-opacity" style={{ color: E.primary, fontFamily: E.fontBody }}>
                {cat.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* New Arrivals – 3-column editorial grid */}
      {newArrivals.length > 0 && (
        <LazySection fallback={<div style={{ minHeight: '400px' }} />} rootMargin="0px 0px 300px" minHeight="400px">
          <section className="max-w-[1200px] mx-auto px-6 py-14">
            <div className="text-center mb-10">
              <span className="uppercase text-xs tracking-[0.3em] block mb-2" style={{ color: E.accent }}>Just In</span>
              <h2 className="text-3xl" style={{ fontFamily: E.font, color: E.text }}>New Arrivals</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
              {newArrivals.map(p => (
                <ElegantProductCard key={p.id} product={p} onClick={() => onProductClick(p)} onAddToCart={() => handleAddToCart(p)} />
              ))}
            </div>
          </section>
        </LazySection>
      )}

      {/* Trending – wider spacing, 4-column */}
      {trending.length > 0 && (
        <LazySection fallback={<div style={{ minHeight: '400px' }} />} rootMargin="0px 0px 300px" minHeight="400px">
          <section className="py-14" style={{ backgroundColor: E.accentLight }}>
            <div className="max-w-[1200px] mx-auto px-6">
              <div className="text-center mb-10">
                <span className="uppercase text-xs tracking-[0.3em] block mb-2" style={{ color: E.accent }}>Bestsellers</span>
                <h2 className="text-3xl" style={{ fontFamily: E.font, color: E.text }}>Most Loved</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {trending.map(p => (
                  <ElegantProductCard key={p.id} product={p} onClick={() => onProductClick(p)} onAddToCart={() => handleAddToCart(p)} />
                ))}
              </div>
            </div>
          </section>
        </LazySection>
      )}

      {/* Best Sellers – editorial strip */}
      {bestSelling.length > 0 && (
        <LazySection fallback={<div style={{ minHeight: '400px' }} />} rootMargin="0px 0px 300px" minHeight="400px">
          <section className="max-w-[1200px] mx-auto px-6 py-14">
            <div className="text-center mb-10">
              <span className="uppercase text-xs tracking-[0.3em] block mb-2" style={{ color: E.accent }}>Trending</span>
              <h2 className="text-3xl" style={{ fontFamily: E.font, color: E.text }}>Best Sellers</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {bestSelling.map(p => (
                <ElegantProductCard key={p.id} product={p} onClick={() => onProductClick(p)} onAddToCart={() => handleAddToCart(p)} />
              ))}
            </div>
          </section>
        </LazySection>
      )}

      {/* CTA */}
      <LazySection fallback={<div style={{ minHeight: '200px' }} />} rootMargin="0px 0px 300px" minHeight="200px">
      <section className="py-20 text-center" style={{ backgroundColor: E.primary }}>
        <span className="uppercase text-xs tracking-[0.3em] block mb-3" style={{ color: E.accent, fontFamily: E.fontBody }}>Membership</span>
        <h2 className="text-3xl md:text-4xl text-white mb-4" style={{ fontFamily: E.font }}>Join Our World</h2>
        <p className="text-white/50 max-w-lg mx-auto mb-8 text-sm" style={{ fontFamily: E.fontBody }}>Get early access to new arrivals, exclusive offers, and curated recommendations.</p>
        <button className="px-10 py-3 text-xs uppercase tracking-[0.2em] border border-white/40 text-white hover:bg-white hover:text-gray-900 transition-colors" style={{ fontFamily: E.fontBody }}>
          Sign Up
        </button>
      </section>
      </LazySection>

      {/* Footer */}
      <LazySection fallback={<div style={{ minHeight: '100px' }} />} rootMargin="0px 0px 400px" minHeight="100px">
      <footer className="py-10 border-t" style={{ borderColor: '#e8e0d8', backgroundColor: E.bg }}>
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          {logo ? (
            <img src={normalizeImageUrl(logo)} alt={websiteConfig?.storeName || 'Store'} className="h-7 object-contain" />
          ) : (
            <span className="text-lg" style={{ fontFamily: E.font, color: E.primary }}>{websiteConfig?.storeName || 'Store'}</span>
          )}
          <p className="text-xs" style={{ color: E.textMuted }}>© {new Date().getFullYear()} {websiteConfig?.storeName || 'Store'}. All rights reserved.</p>
        </div>
      </footer>
      </LazySection>
    </div>
  );
});
StoreFront1Elegant.displayName = 'StoreFront1Elegant';

export default StoreFront1Elegant;
