/**
 * StoreFront1 – Bold Variant
 * Electric blue + neon-yellow, chunky cards, dark hero, bold type
 */

import React, { memo, useMemo, useState, useCallback, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import type { Product, WebsiteConfig } from '../../types';
import { normalizeImageUrl } from '../../utils/imageUrlHelper';
import { LazySection } from './LazySection';
import { useActiveProducts, StarRating } from './storefrontShared';

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
const B = {
  primary: '#0f172a',       // deep navy
  accent: '#3b82f6',        // electric blue
  highlight: '#facc15',     // neon yellow
  surface: '#1e293b',       // dark card bg
  bg: '#f8fafc',
  text: '#0f172a',
  textLight: '#94a3b8',
  font: "'Space Grotesk', sans-serif",
} as const;

// ─── Sub-components ──────────────────────────────────────────────────────────
const BoldProductCard = memo(({ product, onClick, onAddToCart }: {
  product: Product; onClick: () => void; onAddToCart?: () => void;
}) => {
  const img = product.galleryImages?.[0] || product.image;
  const price = product.salePrice || product.price || 0;
  const originalPrice = product.price && product.salePrice && product.price > product.salePrice ? product.price : null;
  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer flex flex-col border-2 border-transparent hover:border-blue-500"
      onClick={onClick}>
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {img ? (
          <img src={normalizeImageUrl(img)} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300"><ShoppingCart size={48} /></div>
        )}
        {discount > 0 && (
          <span className="absolute top-3 right-3 text-xs font-black px-3 py-1.5 rounded-lg" style={{ backgroundColor: B.highlight, color: B.primary }}>
            -{discount}%
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1 gap-2" style={{ fontFamily: B.font }}>
        <h3 className="font-bold text-base line-clamp-1" style={{ color: B.text }}>{product.title}</h3>
        <StarRating rating={product.rating || 4} color={B.highlight} size={13} />
        <div className="flex items-end gap-2 mt-auto">
          <span className="font-black text-xl" style={{ color: B.accent }}>৳{price}</span>
          {originalPrice && <span className="text-sm line-through" style={{ color: B.textLight }}>৳{originalPrice}</span>}
        </div>
        <button onClick={(e) => { e.stopPropagation(); onAddToCart?.(); }}
          className="mt-2 py-2.5 rounded-xl text-white font-bold text-sm transition-colors hover:opacity-90"
          style={{ backgroundColor: B.accent }}>
          🛒 Add to Cart
        </button>
      </div>
    </div>
  );
});
BoldProductCard.displayName = 'BoldProductCard';

const BoldHero = memo(({ websiteConfig }: { websiteConfig?: WebsiteConfig }) => {
  const [slide, setSlide] = useState(0);
  const items = (websiteConfig?.carouselItems || [])
    .filter(i => String(i.status ?? '').trim().toLowerCase() === 'publish')
    .sort((a, b) => Number(a.serial ?? 0) - Number(b.serial ?? 0));
  const current = items[slide] || null;

  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => setSlide(p => (p + 1) % items.length), 4500);
    return () => clearInterval(t);
  }, [items.length]);

  const heroImage = current?.imageUrl || current?.image || null;

  return (
    <div className="relative overflow-hidden" style={{ backgroundColor: B.primary, minHeight: '420px' }}>
      {heroImage && (
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: `url(${normalizeImageUrl(heroImage)})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      )}
      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${B.primary} 40%, ${B.accent}33 100%)` }} />
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-12 py-20 md:py-28">
        <div className="inline-block px-4 py-1.5 rounded-full text-xs font-bold mb-6" style={{ backgroundColor: B.highlight, color: B.primary, fontFamily: B.font }}>
          🔥 HOT DEALS
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4" style={{ fontFamily: B.font }}>
          {current?.title || 'MEGA SALE'}
        </h1>
        <p className="text-white/60 text-lg mb-8 max-w-lg" style={{ fontFamily: B.font }}>
          {current?.subtitle || 'Unbeatable prices. Limited time offers.'}
        </p>
        <div className="flex gap-4">
          <button className="px-8 py-3.5 rounded-xl font-bold text-white transition-transform hover:scale-105"
            style={{ backgroundColor: B.accent, fontFamily: B.font }}>
            Shop Now →
          </button>
          <button className="px-8 py-3.5 rounded-xl font-bold transition-transform hover:scale-105 border-2"
            style={{ borderColor: B.highlight, color: B.highlight, fontFamily: B.font }}>
            View Deals
          </button>
        </div>
      </div>
      {items.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {items.map((_: any, i: number) => (
            <button key={i} onClick={() => setSlide(i)} className="w-3 h-3 rounded-full transition-colors" style={{ backgroundColor: i === slide ? B.highlight : 'rgba(255,255,255,0.25)' }} />
          ))}
        </div>
      )}
    </div>
  );
});
BoldHero.displayName = 'BoldHero';

// ─── Main Component ──────────────────────────────────────────────────────────
export const StoreFront1Bold: React.FC<StoreFrontThemeProps> = memo(({
  products, categories, brands, websiteConfig, logo, onProductClick, onBuyNow, onAddToCart, onCategoryClick, onOpenChat,
}) => {
  const active = useActiveProducts(products);
  const trending = useMemo(() => [...active].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 8), [active]);
  const bestSelling = useMemo(() => [...active].sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0)).slice(0, 8), [active]);
  const newArrivals = useMemo(() => active.slice(0, 6), [active]);
  const handleAddToCart = useCallback((p: Product) => onAddToCart?.(p, 1, {}), [onAddToCart]);

  const activeCategories = useMemo(() => categories.filter(c => c.status === 'Active' || !c.status).slice(0, 8), [categories]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: B.bg, fontFamily: B.font }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <BoldHero websiteConfig={websiteConfig} />

      {/* Category pills */}
      {activeCategories.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-4 md:px-8 py-6">
          <div className="flex flex-wrap gap-2">
            {activeCategories.map((cat: any) => (
              <button key={cat.id || cat.name} onClick={() => onCategoryClick?.(cat.slug || cat.name)}
                className="px-5 py-2 rounded-xl text-sm font-bold border-2 hover:border-blue-500 hover:text-blue-600 transition-colors"
                style={{ borderColor: '#e2e8f0', color: B.text }}>
                {cat.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Flash Deal Banner */}
      <LazySection fallback={<div style={{ minHeight: '150px' }} />} rootMargin="0px 0px 300px" minHeight="150px">
      <section className="max-w-[1400px] mx-auto px-4 md:px-8 py-4">
        <div className="rounded-2xl p-6 flex items-center justify-between" style={{ background: `linear-gradient(90deg, ${B.primary}, ${B.accent})` }}>
          <div>
            <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: B.highlight, color: B.primary }}>⚡ FLASH SALE</span>
            <h3 className="text-xl font-black text-white mt-2">Up to 50% OFF — Limited Stock!</h3>
          </div>
          <button className="hidden md:block px-6 py-2.5 rounded-xl font-bold text-sm" style={{ backgroundColor: B.highlight, color: B.primary }}>
            Shop Deals
          </button>
        </div>
      </section>
      </LazySection>

      {/* Trending – chunky 4-col grid */}
      {trending.length > 0 && (
        <LazySection fallback={<div style={{ minHeight: '400px' }} />} rootMargin="0px 0px 300px" minHeight="400px">
          <section className="max-w-[1400px] mx-auto px-4 md:px-8 py-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: B.accent }} />
              <h2 className="text-2xl md:text-3xl font-black" style={{ color: B.text }}>Trending Now 🔥</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {trending.map(p => (
                <BoldProductCard key={p.id} product={p} onClick={() => onProductClick(p)} onAddToCart={() => handleAddToCart(p)} />
              ))}
            </div>
          </section>
        </LazySection>
      )}

      {/* Best Sellers */}
      {bestSelling.length > 0 && (
        <LazySection fallback={<div style={{ minHeight: '400px' }} />} rootMargin="0px 0px 300px" minHeight="400px">
          <section className="py-10" style={{ backgroundColor: '#eef2ff' }}>
            <div className="max-w-[1400px] mx-auto px-4 md:px-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: B.highlight }} />
                <h2 className="text-2xl md:text-3xl font-black" style={{ color: B.text }}>Best Sellers 🏆</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {bestSelling.map(p => (
                  <BoldProductCard key={p.id} product={p} onClick={() => onProductClick(p)} onAddToCart={() => handleAddToCart(p)} />
                ))}
              </div>
            </div>
          </section>
        </LazySection>
      )}

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <LazySection fallback={<div style={{ minHeight: '400px' }} />} rootMargin="0px 0px 300px" minHeight="400px">
          <section className="max-w-[1400px] mx-auto px-4 md:px-8 py-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: B.accent }} />
              <h2 className="text-2xl md:text-3xl font-black" style={{ color: B.text }}>Just Dropped 🆕</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {newArrivals.map(p => (
                <BoldProductCard key={p.id} product={p} onClick={() => onProductClick(p)} onAddToCart={() => handleAddToCart(p)} />
              ))}
            </div>
          </section>
        </LazySection>
      )}

      {/* Footer */}
      <LazySection fallback={<div style={{ minHeight: '100px' }} />} rootMargin="0px 0px 400px" minHeight="100px">
      <footer className="py-10" style={{ backgroundColor: B.primary }}>
        <div className="max-w-[1400px] mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {logo ? (
              <img src={normalizeImageUrl(logo)} alt={websiteConfig?.storeName || 'Store'} className="h-8 object-contain brightness-0 invert" />
            ) : (
              <span className="text-xl font-black text-white">{websiteConfig?.storeName || 'Store'}</span>
            )}
            <p className="text-white/40 text-xs">© {new Date().getFullYear()} {websiteConfig?.storeName || 'Store'}. All rights reserved.</p>
          </div>
        </div>
      </footer>
      </LazySection>
    </div>
  );
});
StoreFront1Bold.displayName = 'StoreFront1Bold';

export default StoreFront1Bold;
