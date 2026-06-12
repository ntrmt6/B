import React, { memo } from 'react';
import { ShoppingCart } from 'lucide-react';
import type { Product } from '../../../types';
import { normalizeImageUrl } from '../../../utils/imageUrlHelper';
import { SectionHeader } from './SFSectionHeader';

export const BestSellingSection = memo(({ products, onProductClick }: { products: Product[]; onProductClick: (p: Product) => void }) => {
  const best = products.slice(0, 5);
  if (best.length === 0) return null;

  return (
    <section className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
      <SectionHeader title="Best selling product" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[200px]">
        {best.map((p, i) => {
          const img = p.galleryImages?.[0] || p.image;
          const isLarge = i === best.length - 1;
          return (
            <div key={p.id} onClick={() => onProductClick(p)}
              className={`relative rounded-xl overflow-hidden cursor-pointer group ${isLarge ? 'md:col-span-1 md:row-span-2' : ''}`}>
              {img ? (
                <img src={normalizeImageUrl(img)} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center"><ShoppingCart size={36} className="text-gray-300" /></div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 flex items-end justify-between">
                <span className="text-white font-bold text-sm" style={{ fontFamily: "'Lato', sans-serif" }}>৳{p.salePrice || p.price || 0}</span>
                <button className="px-3 py-1.5 bg-white rounded-full text-xs font-medium text-gray-900 hover:bg-gray-100 transition-colors shadow-sm">
                  Visit store
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
});
BestSellingSection.displayName = 'BestSellingSection';
