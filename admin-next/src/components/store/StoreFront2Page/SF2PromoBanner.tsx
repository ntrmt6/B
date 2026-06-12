import React, { memo } from 'react';
import type { Product } from '../../../types';
import { normalizeImageUrl } from '../../../utils/imageUrlHelper';
import { C } from './constants';

export const PromoBanner = memo(({ products, onProductClick }: { products: Product[]; onProductClick: (p: Product) => void }) => {
  const featured = products.slice(0, 3);
  if (featured.length === 0) return null;

  const colors = [
    { bg: '#fdf4ff', accent: '#a855f7', label: 'New Arrival' },
    { bg: '#f0fdf4', accent: '#22c55e', label: 'Top Rated' },
    { bg: '#fff7ed', accent: C.accent, label: 'Flash Deal' },
  ];

  return (
    <section className="py-8 max-w-[1400px] mx-auto px-4 md:px-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {featured.map((p, i) => {
          const img = p.galleryImages?.[0] || p.image;
          const color = colors[i % colors.length];
          return (
            <div
              key={p.id}
              className="rounded-2xl p-5 flex items-center gap-4 cursor-pointer transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: color.bg }}
              onClick={() => onProductClick(p)}
            >
              {img && (
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={normalizeImageUrl(img)} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: color.accent }}
                >
                  {color.label}
                </span>
                <p className="font-bold text-gray-900 text-sm mt-0.5 line-clamp-2">{p.title}</p>
                <p className="font-extrabold mt-1" style={{ color: color.accent }}>
                  ৳{p.salePrice || p.price}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
});
PromoBanner.displayName = 'PromoBanner';
