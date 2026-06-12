import React, { memo } from 'react';
import type { Product } from '../../../types';
import { normalizeImageUrl } from '../../../utils/imageUrlHelper';
import { ACCENT } from './constants';

export const PromoGrid = memo(({ products, onProductClick }: { products: Product[]; onProductClick: (p: Product) => void }) => {
  const promoProducts = products.slice(0, 4);
  if (promoProducts.length === 0) return null;

  return (
    <section className="max-w-[1400px] mx-auto px-4 md:px-8 py-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {promoProducts.map((p) => {
          const img = p.galleryImages?.[0] || p.image;
          return (
            <div key={p.id} className="relative rounded-xl overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow cursor-pointer group h-[180px] md:h-[200px]"
              onClick={() => onProductClick(p)}>
              {img && <img src={normalizeImageUrl(img)} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                <p className="text-white text-sm font-bold truncate" style={{ fontFamily: "'Lato', sans-serif" }}>{p.title}</p>
                {p.salePrice && <span className="text-white/90 text-xs font-bold">৳{p.salePrice}</span>}
              </div>
              <button className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full text-white text-xs font-bold shadow-md transition-colors" style={{ backgroundColor: ACCENT }}>
                Shop Now
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
});
PromoGrid.displayName = 'PromoGrid';
