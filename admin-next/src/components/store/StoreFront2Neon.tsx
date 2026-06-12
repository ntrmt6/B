/**
 * StoreFront2 – NEON variant
 * Dark bg + cyan/magenta neon glow, futuristic cards
 */

import React, { memo, useMemo, useState, useCallback, useEffect, lazy, Suspense } from 'react';
import {
  ShoppingCart, Zap, Package, ArrowUpRight,
} from 'lucide-react';
import type { Product, WebsiteConfig } from '../../types';
import { normalizeImageUrl } from '../../utils/imageUrlHelper';
import { LazySection } from './LazySection';
import { slugify, calcDiscount, StarRating, useActiveProducts, useProductSections } from './storefrontShared';

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
const N = {
  bg: '#0a0a0f',
  surface: '#12121a',
  card: '#1a1a28',
  cyan: '#00e5ff',
  magenta: '#e91e8c',
  textMain: '#e8e8f0',
  textMuted: '#6b6b7a',
  border: '#2a2a3a',
  font: "'Space Grotesk', sans-serif",
} as const;

// ─── Sub-components ──────────────────────────────────────────────────────────

const NeonProductCard = memo(({ product, onClick, onAddToCart, onBuyNow }: {
  product: Product; onClick: () => void; onAddToCart?: () => void; onBuyNow?: () => void;
}) => {
  const img = product.galleryImages?.[0] || product.image;
  const price = product.salePrice || product.price || 0;
  const originalPrice = product.price && product.salePrice && product.price > product.salePrice ? product.price : null;
  const discount = originalPrice ? calcDiscount(originalPrice, price) : 0;

  return (
    <div className="group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1"
      style={{ backgroundColor: N.card, border: `1px solid ${N.border}` }} onClick={onClick}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none"
        style={{ boxShadow: `0 0 20px ${N.cyan}30, 0 0 40px ${N.magenta}15` }} />
      <div className="relative aspect-square overflow-hidden">
        {img ? (
          <img src={normalizeImageUrl(img)} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ color: N.textMuted }}><Package size={40} /></div>
        )}
        {discount > 0 && (
          <span className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: N.magenta, color: '#fff' }}>-{discount}%</span>
        )}
        <div className="absolute inset-0 flex items-end justify-between px-3 pb-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onAddToCart?.(); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg" style={{ backgroundColor: N.cyan, color: N.bg }}>
            <ShoppingCart size={12} /> Cart
          </button>
          <button onClick={(e) => { e.stopPropagation(); onBuyNow?.(); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg" style={{ backgroundColor: N.magenta, color: '#fff' }}>
            <Zap size={12} /> Buy
          </button>
        </div>
      </div>
      <div className="p-3">
        <p className="font-semibold text-sm line-clamp-2 leading-snug mb-1" style={{ color: N.textMain }}>{product.title}</p>
        <StarRating rating={product.rating || 4} color={N.cyan} />
        <div className="flex items-center gap-2 mt-2">
          <span className="font-bold text-base" style={{ color: N.cyan }}>৳{price}</span>
          {originalPrice && <span className="text-xs line-through" style={{ color: N.textMuted }}>৳{originalPrice}</span>}
        </div>
      </div>
    </div>
  );
});
NeonProductCard.displayName = 'NeonProductCard';

const NeonHero = memo(({ websiteConfig, products, onProductClick }: {
  websiteConfig?: WebsiteConfig; products: Product[]; onProductClick: (p: Product) => void;
}) => {
  const [slide, setSlide] = useState(0);
  const items = (websiteConfig?.carouselItems || [])
    .filter(i => String(i.status ?? '').trim().toLowerCase() === 'publish')
    .sort((a, b) => Number(a.serial ?? 0) - Number(b.serial ?? 0));
  const current = items[slide] || null;
  const featured = products[0];

  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => setSlide(p => (p + 1) % items.length), 4000);
    return () => clearInterval(t);
  }, [items.length]);

  const heroBg = current?.imageUrl || current?.image || null;

  return (
    <div className="relative overflow-hidden" style={{ backgroundColor: N.bg, minHeight: '480px' }}>
      {heroBg && <div className="absolute inset-0 opacity-15" style={{ backgroundImage: `url(${normalizeImageUrl(heroBg)})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 20% 50%, ${N.cyan}12 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, ${N.magenta}10 0%, transparent 60%)` }} />
      <div className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-8 py-20 md:py-28 flex flex-col md:flex-row gap-12 items-center">
        <div className="flex-1">
          <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded mb-4"
            style={{ border: `1px solid ${N.cyan}`, color: N.cyan }}>✦ THE FUTURE IS NOW</span>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4" style={{ color: N.textMain, fontFamily: N.font }}>
            {current?.title || 'Next-Gen Shopping'}
          </h1>
          <p className="text-lg mb-8" style={{ color: N.textMuted }}>{current?.subtitle || 'Premium products. Unmatched experience.'}</p>
          <div className="flex gap-3">
            <button className="px-7 py-3 rounded-lg font-bold transition-opacity hover:opacity-90 flex items-center gap-2"
              style={{ backgroundColor: N.cyan, color: N.bg, fontFamily: N.font }}>
              Explore <ArrowUpRight size={16} />
            </button>
            <button className="px-7 py-3 rounded-lg font-bold border transition-colors hover:bg-white/5"
              style={{ borderColor: N.magenta, color: N.magenta, fontFamily: N.font }}>
              Flash Deals
            </button>
          </div>
        </div>
        {featured && (
          <div className="flex-shrink-0 w-[260px] md:w-[300px] rounded-2xl overflow-hidden cursor-pointer transition-transform hover:scale-105"
            style={{ backgroundColor: N.card, border: `1px solid ${N.border}`, boxShadow: `0 0 30px ${N.cyan}15` }}
            onClick={() => onProductClick(featured)}>
            {(featured.galleryImages?.[0] || featured.image) && (
              <img src={normalizeImageUrl(featured.galleryImages?.[0] || featured.image!)} alt={featured.title} className="w-full aspect-square object-cover" />
            )}
            <div className="p-4">
              <p className="font-semibold text-sm line-clamp-2 mb-1" style={{ color: N.textMain }}>{featured.title}</p>
              <span className="font-bold text-lg" style={{ color: N.cyan }}>৳{featured.salePrice || featured.price}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
NeonHero.displayName = 'NeonHero';

const NeonDealStrip = memo(({ product, onProductClick, onBuyNow }: {
  product: Product; onProductClick: (p: Product) => void; onBuyNow?: (p: Product) => void;
}) => {
  const [timeLeft, setTimeLeft] = useState({ h: 11, m: 59, s: 59 });
  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft(prev => {
        let { h, m, s } = prev;
        s--; if (s < 0) { s = 59; m--; } if (m < 0) { m = 59; h--; } if (h < 0) return { h: 23, m: 59, s: 59 };
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);
  const pad = (n: number) => String(n).padStart(2, '0');
  const img = product.galleryImages?.[0] || product.image;
  const price = product.salePrice || product.price || 0;

  return (
    <section className="py-10" style={{ background: `linear-gradient(90deg, ${N.bg}, ${N.surface})` }}>
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center gap-8">
        <div className="text-center md:text-left flex-shrink-0">
          <div className="flex items-center gap-2 mb-2"><Zap size={18} style={{ color: N.magenta }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: N.magenta }}>DEAL OF THE DAY</span>
          </div>
          <div className="flex gap-3 mt-3">
            {[{ l: 'HRS', v: timeLeft.h }, { l: 'MIN', v: timeLeft.m }, { l: 'SEC', v: timeLeft.s }].map(({ l, v }) => (
              <div key={l} className="text-center">
                <div className="text-xl font-mono font-extrabold w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ border: `1px solid ${N.cyan}`, color: N.cyan, backgroundColor: N.card }}>{pad(v)}</div>
                <div className="text-xs mt-1 font-bold tracking-widest" style={{ color: N.textMuted }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-5 rounded-xl p-4 cursor-pointer flex-1 max-w-lg transition-colors"
          style={{ backgroundColor: N.card, border: `1px solid ${N.border}` }} onClick={() => onProductClick(product)}>
          {img && <img src={normalizeImageUrl(img)} alt={product.title} className="w-24 h-24 object-cover rounded-lg flex-shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-lg leading-snug mb-1 line-clamp-2" style={{ color: N.textMain }}>{product.title}</p>
            <span className="text-2xl font-extrabold" style={{ color: N.cyan }}>৳{price}</span>
          </div>
        </div>
        <button onClick={() => onBuyNow?.(product)} className="px-7 py-3.5 rounded-lg font-bold text-lg shadow-lg transition-opacity hover:opacity-90"
          style={{ backgroundColor: N.magenta, color: '#fff' }}>Grab Deal</button>
      </div>
    </section>
  );
});
NeonDealStrip.displayName = 'NeonDealStrip';

const NeonCategoryGrid = memo(({ categories, products, onCategoryClick, onProductClick, onAddToCart, onBuyNow }: {
  categories: any[]; products: Product[]; onCategoryClick?: (s: string) => void;
  onProductClick: (p: Product) => void; onAddToCart?: (p: Product) => void; onBuyNow?: (p: Product) => void;
}) => {
  const activeCats = categories.filter(c => c.status === 'Active' || !c.status).slice(0, 8);
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!selected) return products.slice(0, 12);
    return products.filter(p => p.category?.toLowerCase() === selected.toLowerCase() || slugify(p.category || '') === selected).slice(0, 12);
  }, [selected, products]);

  const handleSelect = (name: string) => {
    const slug = slugify(name);
    if (selected === slug) { setSelected(null); onCategoryClick?.(''); }
    else { setSelected(slug); onCategoryClick?.(slug); }
  };

  if (!products.length && !categories.length) return null;

  return (
    <section className="py-12" style={{ backgroundColor: N.surface }}>
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        <h2 className="text-2xl font-extrabold mb-6" style={{ color: N.textMain }}>Browse by Category</h2>
        {activeCats.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button onClick={() => { setSelected(null); onCategoryClick?.(''); }}
              className="px-4 py-1.5 rounded-lg text-sm font-bold transition-colors"
              style={!selected ? { backgroundColor: N.cyan, color: N.bg } : { border: `1px solid ${N.border}`, color: N.textMuted }}>
              All
            </button>
            {activeCats.map(cat => {
              const slug = slugify(cat.name);
              return (
                <button key={cat.id || cat.name} onClick={() => handleSelect(cat.name)}
                  className="px-4 py-1.5 rounded-lg text-sm font-bold transition-colors"
                  style={selected === slug ? { backgroundColor: N.magenta, color: '#fff' } : { border: `1px solid ${N.border}`, color: N.textMuted }}>
                  {cat.name}
                </button>
              );
            })}
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(p => (
            <NeonProductCard key={p.id} product={p} onClick={() => onProductClick(p)} onAddToCart={() => onAddToCart?.(p)} onBuyNow={() => onBuyNow?.(p)} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center" style={{ color: N.textMuted }}><Package size={48} className="mx-auto mb-3 opacity-30" /><p>No products in this category.</p></div>
          )}
        </div>
      </div>
    </section>
  );
});
NeonCategoryGrid.displayName = 'NeonCategoryGrid';

// ─── Main Component ──────────────────────────────────────────────────────────

export const StoreFront2Neon: React.FC<StoreFront2Props> = memo(({
  products, categories, brands, websiteConfig, logo, onProductClick, onBuyNow, onAddToCart, onCategoryClick, onOpenChat,
}) => {
  const active = useActiveProducts(products);
  const { newArrivals, topRated, bestSelling, dealProduct } = useProductSections(active);
  const handleAddToCart = useCallback((p: Product) => onAddToCart?.(p, 1, {}), [onAddToCart]);
  const handleBuyNow = useCallback((p: Product) => onBuyNow?.(p), [onBuyNow]);

  const renderNeonCard = useCallback((p: Product) => (
    <NeonProductCard product={p} onClick={() => onProductClick(p)} onAddToCart={() => handleAddToCart(p)} onBuyNow={() => handleBuyNow(p)} />
  ), [onProductClick, handleAddToCart, handleBuyNow]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: N.bg, fontFamily: N.font, color: N.textMain }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      <NeonHero websiteConfig={websiteConfig} products={active} onProductClick={onProductClick} />

      <LazySection fallback={<div style={{ minHeight: '150px' }} />} rootMargin="0px 0px 300px" minHeight="150px">
        {dealProduct && <NeonDealStrip product={dealProduct} onProductClick={onProductClick} onBuyNow={handleBuyNow} />}
      </LazySection>

      <LazySection fallback={<div style={{ minHeight: '400px' }} />} rootMargin="0px 0px 300px" minHeight="400px">
        <NeonCategoryGrid categories={categories} products={active} onCategoryClick={onCategoryClick}
          onProductClick={onProductClick} onAddToCart={handleAddToCart} onBuyNow={handleBuyNow} />
      </LazySection>

      <LazySection fallback={<div style={{ minHeight: '300px' }} />} rootMargin="0px 0px 300px" minHeight="300px">
        <Suspense fallback={null}>
          <HScrollSection title="New Arrivals" subtitle="Just Dropped" products={newArrivals}
            renderCard={renderNeonCard} accentColor={N.cyan} />
        </Suspense>
      </LazySection>
      <LazySection fallback={<div style={{ minHeight: '300px' }} />} rootMargin="0px 0px 300px" minHeight="300px">
        <Suspense fallback={null}>
          <HScrollSection title="Top Rated" subtitle="Community Picks" products={topRated}
            renderCard={renderNeonCard} accentColor={N.magenta} />
        </Suspense>
      </LazySection>
      <LazySection fallback={<div style={{ minHeight: '300px' }} />} rootMargin="0px 0px 300px" minHeight="300px">
        <Suspense fallback={null}>
          <HScrollSection title="Best Sellers" subtitle="Hot Right Now" products={bestSelling}
            renderCard={renderNeonCard} accentColor={N.cyan} />
        </Suspense>
      </LazySection>

      {/* Footer */}
      <LazySection fallback={<div style={{ minHeight: '100px' }} />} rootMargin="0px 0px 400px" minHeight="100px">
        <footer style={{ backgroundColor: N.surface, borderTop: `1px solid ${N.border}` }}>
          <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
            {logo ? <img src={normalizeImageUrl(logo)} alt={websiteConfig?.storeName || 'Store'} className="h-8 object-contain brightness-0 invert" />
              : <span className="text-xl font-extrabold" style={{ color: N.textMain }}>{websiteConfig?.storeName || 'Store'}</span>}
            <p className="text-xs" style={{ color: N.textMuted }}>© {new Date().getFullYear()} {websiteConfig?.storeName || 'Store'}. All rights reserved.</p>
          </div>
        </footer>
      </LazySection>
    </div>
  );
});
StoreFront2Neon.displayName = 'StoreFront2Neon';

export default StoreFront2Neon;
