import React, { memo, useState, useEffect } from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { Product, WebsiteConfig } from '../../../types';
import { normalizeImageUrl } from '../../../utils/imageUrlHelper';
import { slugify } from '../storefrontShared';
import { C } from './constants';

export const SF2Hero = memo(
  ({
    websiteConfig,
    categories,
    products,
    onCategoryClick,
    onProductClick,
  }: {
    websiteConfig?: WebsiteConfig;
    categories: any[];
    products: Product[];
    onCategoryClick?: (slug: string) => void;
    onProductClick: (p: Product) => void;
  }) => {
    const [slide, setSlide] = useState(0);
    const items = websiteConfig?.carouselItems || [];
    const featuredProduct = products[0];

    useEffect(() => {
      if (items.length <= 1) return;
      const t = setInterval(() => setSlide((p) => (p + 1) % items.length), 4000);
      return () => clearInterval(t);
    }, [items.length]);

    const current = items[slide] || null;
    const heroBg =
      current?.imageUrl ||
      current?.image ||
      (featuredProduct?.galleryImages?.[0] || featuredProduct?.image) ||
      null;

    const heroTitle = current?.title || websiteConfig?.storeName || 'Discover Premium Products';
    const heroSub = current?.subtitle || 'Best deals, every day';

    const activeCategories = categories
      .filter((c) => c.status === 'Active' || !c.status)
      .slice(0, 6);

    return (
      <div
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${C.primary} 0%, #312e81 50%, #4338ca 100%)` }}
      >
        {/* Background product image */}
        {heroBg && (
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url(${normalizeImageUrl(heroBg)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}

        <div className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-8 py-16 md:py-24 flex flex-col md:flex-row gap-12 items-center">
          {/* Text side */}
          <div className="flex-1 text-white">
            <span
              className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
              style={{ backgroundColor: C.accent, color: '#fff' }}
            >
              New Season
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4">
              {heroTitle}
            </h1>
            <p className="text-white/70 text-lg mb-8">{heroSub}</p>
            <div className="flex flex-wrap gap-3">
              <button
                className="px-7 py-3 rounded-full font-bold text-white transition-opacity hover:opacity-90 flex items-center gap-2"
                style={{ backgroundColor: C.accent }}
                onClick={() => onCategoryClick?.('')}
              >
                Shop Now <ArrowUpRight size={18} />
              </button>
              <button
                className="px-7 py-3 rounded-full font-bold border-2 border-white/30 text-white hover:bg-white/10 transition-colors"
              >
                Browse Deals
              </button>
            </div>

            {/* Quick category pills */}
            {activeCategories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-8">
                {activeCategories.map((cat) => (
                  <button
                    key={cat.id || cat.name}
                    onClick={() => onCategoryClick?.(slugify(cat.name))}
                    className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/90 text-sm font-medium transition-colors backdrop-blur-sm"
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product showcase */}
          {featuredProduct && (
            <div
              className="flex-shrink-0 w-[260px] md:w-[320px] bg-white/10 backdrop-blur-md rounded-3xl overflow-hidden border border-white/20 cursor-pointer transition-transform hover:scale-105"
              onClick={() => onProductClick(featuredProduct)}
            >
              {(featuredProduct.galleryImages?.[0] || featuredProduct.image) && (
                <img
                  src={normalizeImageUrl(featuredProduct.galleryImages?.[0] || featuredProduct.image!)}
                  alt={featuredProduct.title}
                  className="w-full aspect-square object-cover"
                />
              )}
              <div className="p-4 text-white">
                <p className="font-semibold text-sm line-clamp-2 mb-1">{featuredProduct.title}</p>
                <span className="font-bold text-lg" style={{ color: C.accent }}>
                  ৳{featuredProduct.salePrice || featuredProduct.price}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Slide dots */}
        {items.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {items.map((_: any, i: number) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                className="rounded-full transition-all duration-200"
                style={{
                  width: i === slide ? '24px' : '8px',
                  height: '8px',
                  backgroundColor: i === slide ? C.accent : 'rgba(255,255,255,0.4)',
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);
SF2Hero.displayName = 'SF2Hero';
