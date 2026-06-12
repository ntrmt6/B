import React, { memo } from 'react';
import type { Product } from '../../../types';
import { normalizeImageUrl } from '../../../utils/imageUrlHelper';
import { C } from './constants';

export const FeaturedMasonry = memo(
  ({
    products,
    onProductClick,
  }: {
    products: Product[];
    onProductClick: (p: Product) => void;
  }) => {
    if (products.length < 3) return null;
    const [big, ...rest] = products.slice(0, 5);
    const smallItems = rest.slice(0, 4);

    const renderSmall = (p: Product) => {
      const img = p.galleryImages?.[0] || p.image;
      return (
        <div
          key={p.id}
          className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-[4/3] cursor-pointer group"
          onClick={() => onProductClick(p)}
        >
          {img && (
            <img
              src={normalizeImageUrl(img)}
              alt={p.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <p className="text-white font-semibold text-sm line-clamp-1">{p.title}</p>
            <span className="text-white/90 text-xs font-bold">
              ৳{p.salePrice || p.price}
            </span>
          </div>
          <span
            className="absolute top-2 right-2 text-white text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: C.accent }}
          >
            Shop Now
          </span>
        </div>
      );
    };

    const bigImg = big.galleryImages?.[0] || big.image;

    return (
      <section className="py-10 max-w-[1400px] mx-auto px-4 md:px-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: C.accent }}>
              Featured
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
              Handpicked Picks
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-[200px] md:auto-rows-[220px]">
          {/* Big card spans 2 rows */}
          <div
            className="relative rounded-2xl overflow-hidden bg-gray-100 cursor-pointer group row-span-2 col-span-1"
            onClick={() => onProductClick(big)}
          >
            {bigImg && (
              <img
                src={normalizeImageUrl(bigImg)}
                alt={big.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <p className="text-white font-bold text-lg line-clamp-2 mb-1">{big.title}</p>
              <span className="font-extrabold text-xl" style={{ color: C.accent }}>
                ৳{big.salePrice || big.price}
              </span>
            </div>
          </div>
          {/* Small cards */}
          {smallItems.map(renderSmall)}
        </div>
      </section>
    );
  }
);
FeaturedMasonry.displayName = 'FeaturedMasonry';
