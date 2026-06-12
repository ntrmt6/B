/**
 * StoreFront2 – EARTH variant
 * Warm olive/terracotta, organic shapes, nature-inspired
 */

import React, { memo, useMemo, useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { Package } from 'lucide-react';
import type { Product, WebsiteConfig } from '../../types';
import { normalizeImageUrl } from '../../utils/imageUrlHelper';
import { LazySection } from './LazySection';
import { calcDiscount, StarRating, useActiveProducts, useProductSections } from './storefrontShared';

// Below-fold: lazy-loaded so its JS only loads when scrolled into view
const HScrollSection = lazy(() => import('./HScrollSection').then(m => ({ default: m.HScrollSection })));

// ─── Shared Interface ────────────────────────────────────────────────────────
interface StoreFront2Props {
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
const EE = {
  primary: '#3d4f2f',       // olive green
  accent: '#c4693d',        // terracotta
  accentLight: '#f9f2ea',   // warm cream
  bg: '#f7f4ef',            // off-white warm
  card: '#ffffff',
  border: '#e5ddd0',
  text: '#2d3124',
  textMuted: '#8a8274',
  font: "'DM Serif Display', serif",
  fontBody: "'Nunito', sans-serif",
} as const;

// ─── Sub-components ──────────────────────────────────────────────────────────

const EarthProductCard = memo(({ product, onClick, onAddToCart, onBuyNow }: {
  product: Product; onClick: () => void; onAddToCart?: () => void; onBuyNow?: () => void;
}) => {
  const img = product.galleryImages?.[0] || product.image;
  const price = product.salePrice || product.price || 0;
  const originalPrice = product.price && product.salePrice && product.price > product.salePrice ? product.price : null;
  const discount = originalPrice ? calcDiscount(originalPrice, price) : 0;

  return (
    <div className="group cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg"
      style={{ backgroundColor: EE.card, border: `1px solid ${EE.border}` }} onClick={onClick}>
      <div className="relative aspect-[4/5] overflow-hidden">
        {img ? (
          <img src={normalizeImageUrl(img)} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50" style={{ color: EE.textMuted }}><Package size={40} /></div>
        )}
        {discount > 0 && (
          <span className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: EE.accent }}>-{discount}%</span>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/30 to-transparent p-3 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onAddToCart?.(); }}
            className="px-3 py-1.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: EE.primary }}>Add to Cart</button>
          <button onClick={(e) => { e.stopPropagation(); onBuyNow?.(); }}
            className="px-3 py-1.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: EE.accent }}>Buy Now</button>
        </div>
      </div>
      <div className="p-3.5">
        <p className="font-semibold text-sm line-clamp-2 leading-snug mb-1.5" style={{ color: EE.text, fontFamily: EE.fontBody }}>{product.title}</p>
        <StarRating rating={product.rating || 4} color={EE.accent} />
        <div className="flex items-center gap-2 mt-2">
          <span className="font-bold text-base" style={{ color: EE.accent, fontFamily: EE.fontBody }}>৳{price}</span>
          {originalPrice && <span className="text-xs line-through" style={{ color: EE.textMuted }}>৳{originalPrice}</span>}
        </div>
      </div>
    </div>
  );
});
EarthProductCard.displayName = 'EarthProductCard';

const EarthHero = memo(({ websiteConfig, products, onProductClick }: {
  websiteConfig?: WebsiteConfig; products: Product[]; onProductClick: (p: Product) => void;
}) => {
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

  const heroBg = current?.imageUrl || current?.image || null;

  return (
    <div className="relative overflow-hidden" style={{ backgroundColor: EE.primary, minHeight: '460px' }}>
      {heroBg && <div className="absolute inset-0 opacity-30" style={{ backgroundImage: `url(${normalizeImageUrl(heroBg)})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
      <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${EE.primary}ee 0%, ${EE.primary}88 50%, ${EE.accent}44 100%)` }} />
      <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-24 md:py-32 text-center">
        <span className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5"
          style={{ backgroundColor: EE.accentLight, color: EE.accent, fontFamily: EE.fontBody }}>🌿 Naturally Curated</span>
        <h1 className="text-4xl md:text-6xl leading-tight mb-4 text-white" style={{ fontFamily: EE.font }}>
          {current?.title || 'Timeless Comfort'}
        </h1>
        <p className="text-white/60 text-base max-w-md mx-auto mb-8" style={{ fontFamily: EE.fontBody }}>
          {current?.subtitle || 'Products crafted with care, inspired by nature'}
        </p>
        <button className="px-8 py-3 rounded-full font-bold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: EE.accent, fontFamily: EE.fontBody }}>
          Shop Collection
        </button>
      </div>
      {items.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {items.map((_: any, i: number) => (
            <button key={i} onClick={() => setSlide(i)} className="w-2.5 h-2.5 rounded-full transition-colors"
              style={{ backgroundColor: i === slide ? EE.accent : 'rgba(255,255,255,0.3)' }} />
          ))}
        </div>
      )}
    </div>
  );
});
EarthHero.displayName = 'EarthHero';

// ─── Main Component ──────────────────────────────────────────────────────────

export const StoreFront2Earth: React.FC<StoreFront2Props> = memo(({
  products, categories, brands, websiteConfig, logo, onProductClick, onBuyNow, onAddToCart, onCategoryClick, onOpenChat,
}) => {
  const active = useActiveProducts(products);
  const { newArrivals, topRated, bestSelling, dealProduct } = useProductSections(active);
  const handleAddToCart = useCallback((p: Product) => onAddToCart?.(p, 1, {}), [onAddToCart]);
  const handleBuyNow = useCallback((p: Product) => onBuyNow?.(p), [onBuyNow]);

  const activeCategories = useMemo(() => categories.filter(c => c.status === 'Active' || !c.status).slice(0, 6), [categories]);

  const renderEarthCard = useCallback((p: Product) => (
    <EarthProductCard product={p} onClick={() => onProductClick(p)} onAddToCart={() => handleAddToCart(p)} onBuyNow={() => handleBuyNow(p)} />
  ), [onProductClick, handleAddToCart, handleBuyNow]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: EE.bg, fontFamily: EE.fontBody }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet" />

      <EarthHero websiteConfig={websiteConfig} products={active} onProductClick={onProductClick} />

      {/* Trust strip */}
      <section className="py-5 border-b" style={{ backgroundColor: EE.accentLight, borderColor: EE.border }}>
        <div className="max-w-[1200px] mx-auto px-6 flex flex-wrap justify-center gap-8 text-sm" style={{ color: EE.text }}>
          {['🌱 Eco Friendly', '🚚 Free Delivery 999+', '🔄 Easy Returns', '❤️ 10K+ Happy Customers'].map(t => (
            <span key={t} className="font-bold">{t}</span>
          ))}
        </div>
      </section>

      {/* Categories as organic cards */}
      <LazySection fallback={<div style={{ minHeight: '200px' }} />} rootMargin="0px 0px 300px" minHeight="200px">
        {activeCategories.length > 0 && (
          <section className="max-w-[1200px] mx-auto px-6 py-10">
            <h2 className="text-2xl md:text-3xl text-center mb-8" style={{ fontFamily: EE.font, color: EE.text }}>Shop by Category</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {activeCategories.map((cat: any) => (
                <button key={cat.id || cat.name} onClick={() => onCategoryClick?.(cat.slug || cat.name)}
                  className="px-5 py-2.5 rounded-full text-sm font-bold transition-colors hover:text-white"
                  style={{ border: `2px solid ${EE.primary}`, color: EE.primary }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.backgroundColor = EE.primary; }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.backgroundColor = 'transparent'; (e.target as HTMLElement).style.color = EE.primary; }}>
                  {cat.name}
                </button>
              ))}
            </div>
          </section>
        )}
      </LazySection>

      {/* Featured grid */}
      <LazySection fallback={<div style={{ minHeight: '400px' }} />} rootMargin="0px 0px 300px" minHeight="400px">
        {newArrivals.length > 0 && (
          <section className="max-w-[1200px] mx-auto px-6 py-10">
            <div className="text-center mb-8">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: EE.accent }}>Fresh Picks</span>
              <h2 className="text-2xl md:text-3xl mt-1" style={{ fontFamily: EE.font, color: EE.text }}>New Arrivals</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {newArrivals.slice(0, 8).map(p => (
                <EarthProductCard key={p.id} product={p} onClick={() => onProductClick(p)} onAddToCart={() => handleAddToCart(p)} onBuyNow={() => handleBuyNow(p)} />
              ))}
            </div>
          </section>
        )}
      </LazySection>

      {/* Deal banner */}
      <LazySection fallback={<div style={{ minHeight: '200px' }} />} rootMargin="0px 0px 300px" minHeight="200px">
        {dealProduct && (
          <section className="py-10" style={{ backgroundColor: EE.primary }}>
            <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-center gap-8">
              <div className="text-white flex-1">
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: EE.accent }}>🔥 Today's Deal</span>
                <h2 className="text-3xl mt-2 mb-2" style={{ fontFamily: EE.font }}>{dealProduct.title}</h2>
                <span className="text-2xl font-extrabold" style={{ color: EE.accent }}>৳{dealProduct.salePrice || dealProduct.price}</span>
              </div>
              <button onClick={() => onBuyNow?.(dealProduct)} className="px-8 py-3 rounded-full font-bold text-white"
                style={{ backgroundColor: EE.accent }}>Shop Now</button>
            </div>
          </section>
        )}
      </LazySection>

      <LazySection fallback={<div style={{ minHeight: '300px' }} />} rootMargin="0px 0px 300px" minHeight="300px">
        <Suspense fallback={null}>
          <HScrollSection title="Top Rated" subtitle="Customer Favorites" products={topRated}
            renderCard={renderEarthCard} accentColor={EE.accent} />
        </Suspense>
      </LazySection>
      <LazySection fallback={<div style={{ minHeight: '300px' }} />} rootMargin="0px 0px 300px" minHeight="300px">
        <Suspense fallback={null}>
          <HScrollSection title="Best Sellers" subtitle="Most Popular" products={bestSelling}
            renderCard={renderEarthCard} accentColor={EE.primary} />
        </Suspense>
      </LazySection>

      {/* Footer */}
      <LazySection fallback={<div style={{ minHeight: '100px' }} />} rootMargin="0px 0px 400px" minHeight="100px">
        <footer className="py-10 border-t" style={{ borderColor: EE.border, backgroundColor: EE.accentLight }}>
          <div className="max-w-[1200px] mx-auto px-6 text-center">
            {logo ? <img src={normalizeImageUrl(logo)} alt={websiteConfig?.storeName || 'Store'} className="h-7 object-contain mx-auto mb-4" />
              : <span className="text-xl block mb-4" style={{ fontFamily: EE.font, color: EE.primary }}>{websiteConfig?.storeName || 'Store'}</span>}
            <p className="text-xs" style={{ color: EE.textMuted }}>© {new Date().getFullYear()} {websiteConfig?.storeName || 'Store'}. All rights reserved.</p>
          </div>
        </footer>
      </LazySection>
    </div>
  );
});
StoreFront2Earth.displayName = 'StoreFront2Earth';

export default StoreFront2Earth;
