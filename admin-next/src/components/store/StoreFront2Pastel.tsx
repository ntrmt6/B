/**
 * StoreFront2 – PASTEL variant
 * Soft lavender/mint/peach, rounded bubbles, playful
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
const P = {
  primary: '#6c5ce7',       // lavender purple
  accent: '#fd79a8',        // soft pink
  mint: '#55efc4',          // mint
  peach: '#fab1a0',         // peach
  bg: '#fefefe',
  cardBg: '#ffffff',
  softBg: '#f8f6ff',       // very light lavender
  text: '#2d3436',
  textMuted: '#a29baf',
  border: '#ede8f5',
  font: "'Nunito', sans-serif",
} as const;

// ─── Sub-components ──────────────────────────────────────────────────────────

const PastelProductCard = memo(({ product, onClick, onAddToCart, onBuyNow }: {
  product: Product; onClick: () => void; onAddToCart?: () => void; onBuyNow?: () => void;
}) => {
  const img = product.galleryImages?.[0] || product.image;
  const price = product.salePrice || product.price || 0;
  const originalPrice = product.price && product.salePrice && product.price > product.salePrice ? product.price : null;
  const discount = originalPrice ? calcDiscount(originalPrice, price) : 0;
  const bgColors = ['#f8f6ff', '#f0fff4', '#fff5f5', '#fef9e7'];
  const cardBg = bgColors[product.id ? product.id % bgColors.length : 0];

  return (
    <div className="group cursor-pointer rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      style={{ backgroundColor: cardBg, border: `1px solid ${P.border}` }} onClick={onClick}>
      <div className="relative aspect-square overflow-hidden">
        {img ? (
          <img src={normalizeImageUrl(img)} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ color: P.textMuted }}><Package size={40} /></div>
        )}
        {discount > 0 && (
          <span className="absolute top-3 left-3 text-xs font-extrabold px-3 py-1 rounded-full text-white" style={{ backgroundColor: P.accent }}>-{discount}%</span>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-3 flex gap-2 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onAddToCart?.(); }}
            className="px-4 py-2 rounded-full text-xs font-bold text-white shadow-md" style={{ backgroundColor: P.primary }}>
            🛒 Cart
          </button>
          <button onClick={(e) => { e.stopPropagation(); onBuyNow?.(); }}
            className="px-4 py-2 rounded-full text-xs font-bold text-white shadow-md" style={{ backgroundColor: P.accent }}>
            ⚡ Buy
          </button>
        </div>
      </div>
      <div className="p-3.5 text-center">
        <p className="font-bold text-sm line-clamp-2 mb-1" style={{ color: P.text }}>{product.title}</p>
        <StarRating rating={product.rating || 4} color={P.accent} />
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="font-extrabold text-base" style={{ color: P.primary }}>৳{price}</span>
          {originalPrice && <span className="text-xs line-through" style={{ color: P.textMuted }}>৳{originalPrice}</span>}
        </div>
      </div>
    </div>
  );
});
PastelProductCard.displayName = 'PastelProductCard';

const PastelHero = memo(({ websiteConfig }: { websiteConfig?: WebsiteConfig }) => {
  const [slide, setSlide] = useState(0);
  const items = (websiteConfig?.carouselItems || [])
    .filter(i => String(i.status ?? '').trim().toLowerCase() === 'publish')
    .sort((a, b) => Number(a.serial ?? 0) - Number(b.serial ?? 0));
  const current = items[slide] || null;

  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => setSlide(prev => (prev + 1) % items.length), 5000);
    return () => clearInterval(t);
  }, [items.length]);

  const heroBg = current?.imageUrl || current?.image || null;

  return (
    <div className="relative overflow-hidden" style={{ minHeight: '440px', background: `linear-gradient(135deg, ${P.primary}15, ${P.accent}15, ${P.mint}15)` }}>
      {heroBg && <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url(${normalizeImageUrl(heroBg)})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
      {/* Decorative blobs */}
      <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full opacity-20" style={{ backgroundColor: P.primary }} />
      <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full opacity-20" style={{ backgroundColor: P.accent }} />
      <div className="absolute top-1/3 right-1/4 w-32 h-32 rounded-full opacity-15" style={{ backgroundColor: P.mint }} />

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-24 md:py-32 text-center">
        <span className="inline-block text-sm font-extrabold px-5 py-2 rounded-full mb-6"
          style={{ backgroundColor: P.primary, color: '#fff', fontFamily: P.font }}>✨ New Season!</span>
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4" style={{ fontFamily: P.font, color: P.text }}>
          {current?.title || 'Shop Happy!'}
        </h1>
        <p className="text-lg max-w-md mx-auto mb-8" style={{ color: P.textMuted, fontFamily: P.font }}>
          {current?.subtitle || 'Bright products for bright days'}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button className="px-8 py-3 rounded-full font-extrabold text-white transition-transform hover:scale-105 shadow-lg"
            style={{ backgroundColor: P.primary, fontFamily: P.font }}>
            Shop Now 🛍️
          </button>
          <button className="px-8 py-3 rounded-full font-extrabold transition-transform hover:scale-105 shadow-lg"
            style={{ backgroundColor: P.accent, color: '#fff', fontFamily: P.font }}>
            View Deals 🔥
          </button>
        </div>
      </div>
      {items.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {items.map((_: any, i: number) => (
            <button key={i} onClick={() => setSlide(i)} className="w-3 h-3 rounded-full transition-all"
              style={{ backgroundColor: i === slide ? P.primary : P.border, transform: i === slide ? 'scale(1.3)' : 'scale(1)' }} />
          ))}
        </div>
      )}
    </div>
  );
});
PastelHero.displayName = 'PastelHero';

// ─── Main Component ──────────────────────────────────────────────────────────

export const StoreFront2Pastel: React.FC<StoreFront2Props> = memo(({
  products, categories, brands, websiteConfig, logo, onProductClick, onBuyNow, onAddToCart, onCategoryClick, onOpenChat,
}) => {
  const active = useActiveProducts(products);
  const { newArrivals, topRated, bestSelling, dealProduct } = useProductSections(active);
  const handleAddToCart = useCallback((p: Product) => onAddToCart?.(p, 1, {}), [onAddToCart]);
  const handleBuyNow = useCallback((p: Product) => onBuyNow?.(p), [onBuyNow]);

  const activeCategories = useMemo(() => categories.filter(c => c.status === 'Active' || !c.status).slice(0, 8), [categories]);

  const renderPastelCard = useCallback((p: Product) => (
    <PastelProductCard product={p} onClick={() => onProductClick(p)} onAddToCart={() => handleAddToCart(p)} onBuyNow={() => handleBuyNow(p)} />
  ), [onProductClick, handleAddToCart, handleBuyNow]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: P.bg, fontFamily: P.font }}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

      <PastelHero websiteConfig={websiteConfig} />

      {/* Category bubbles */}
      <LazySection fallback={<div style={{ minHeight: '150px' }} />} rootMargin="0px 0px 300px" minHeight="150px">
        {activeCategories.length > 0 && (
          <section className="max-w-[1200px] mx-auto px-6 py-8">
            <h2 className="text-xl font-extrabold text-center mb-5" style={{ color: P.text }}>Browse Categories 🏷️</h2>
            <div className="flex flex-wrap justify-center gap-2">
              {activeCategories.map((cat: any, i: number) => {
                const colors = [P.primary, P.accent, P.mint, P.peach];
                return (
                  <button key={cat.id || cat.name} onClick={() => onCategoryClick?.(cat.slug || cat.name)}
                    className="px-5 py-2 rounded-full text-sm font-bold text-white transition-transform hover:scale-105 shadow-sm"
                    style={{ backgroundColor: colors[i % colors.length] }}>
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </LazySection>

      {/* New Arrivals grid */}
      <LazySection fallback={<div style={{ minHeight: '400px' }} />} rootMargin="0px 0px 300px" minHeight="400px">
        {newArrivals.length > 0 && (
          <section className="py-10" style={{ backgroundColor: P.softBg }}>
            <div className="max-w-[1200px] mx-auto px-6">
              <div className="text-center mb-8">
                <span className="text-xs font-extrabold uppercase tracking-widest" style={{ color: P.accent }}>✨ Fresh</span>
                <h2 className="text-2xl md:text-3xl font-extrabold mt-1" style={{ color: P.text }}>New Arrivals</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {newArrivals.slice(0, 8).map(p => (
                  <PastelProductCard key={p.id} product={p} onClick={() => onProductClick(p)} onAddToCart={() => handleAddToCart(p)} onBuyNow={() => handleBuyNow(p)} />
                ))}
              </div>
            </div>
          </section>
        )}
      </LazySection>

      {/* Deal banner */}
      <LazySection fallback={<div style={{ minHeight: '200px' }} />} rootMargin="0px 0px 300px" minHeight="200px">
        {dealProduct && (
          <section className="py-8 max-w-[1200px] mx-auto px-6">
            <div className="rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6 text-center md:text-left"
              style={{ background: `linear-gradient(135deg, ${P.primary}, ${P.accent})` }}>
              <div className="flex-1 text-white">
                <span className="text-xs font-extrabold uppercase tracking-widest opacity-80">⚡ Deal of the Day</span>
                <h3 className="text-2xl font-extrabold mt-2 mb-1">{dealProduct.title}</h3>
                <span className="text-3xl font-extrabold" style={{ color: P.mint }}>৳{dealProduct.salePrice || dealProduct.price}</span>
              </div>
              <button onClick={() => onBuyNow?.(dealProduct)} className="px-8 py-3 rounded-full font-extrabold text-white shadow-lg transition-transform hover:scale-105"
                style={{ backgroundColor: '#fff', color: P.primary }}>
                Grab Deal 🎁
              </button>
            </div>
          </section>
        )}
      </LazySection>

      <LazySection fallback={<div style={{ minHeight: '300px' }} />} rootMargin="0px 0px 300px" minHeight="300px">
        <Suspense fallback={null}>
          <HScrollSection title="Top Rated ⭐" subtitle="Loved by Many" products={topRated}
            renderCard={renderPastelCard} accentColor={P.primary} />
        </Suspense>
      </LazySection>
      <LazySection fallback={<div style={{ minHeight: '300px' }} />} rootMargin="0px 0px 300px" minHeight="300px">
        <Suspense fallback={null}>
          <HScrollSection title="Best Sellers 🏆" subtitle="Hot Picks" products={bestSelling}
            renderCard={renderPastelCard} accentColor={P.accent} />
        </Suspense>
      </LazySection>

      {/* Footer */}
      <LazySection fallback={<div style={{ minHeight: '100px' }} />} rootMargin="0px 0px 400px" minHeight="100px">
        <footer className="py-10 border-t" style={{ borderColor: P.border, backgroundColor: P.softBg }}>
          <div className="max-w-[1200px] mx-auto px-6 text-center">
            {logo ? <img src={normalizeImageUrl(logo)} alt={websiteConfig?.storeName || 'Store'} className="h-7 object-contain mx-auto mb-4" />
              : <span className="text-xl font-extrabold block mb-4" style={{ color: P.primary }}>{websiteConfig?.storeName || 'Store'}</span>}
            <p className="text-xs" style={{ color: P.textMuted }}>© {new Date().getFullYear()} {websiteConfig?.storeName || 'Store'}. Made with 💜</p>
          </div>
        </footer>
      </LazySection>
    </div>
  );
});
StoreFront2Pastel.displayName = 'StoreFront2Pastel';

export default StoreFront2Pastel;
