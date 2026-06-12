import React, { memo, useRef } from 'react';
import { ChevronRight, ShoppingCart } from 'lucide-react';
import { normalizeImageUrl } from '../../../utils/imageUrlHelper';
import { SectionHeader } from './SFSectionHeader';

export const FeaturedCategories = memo(({ categories, onCategoryClick }: { categories: any[]; onCategoryClick?: (slug: string) => void }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeCategories = categories.filter(c => c.status === 'Active' || !c.status).slice(0, 8);
  if (activeCategories.length === 0) return null;

  return (
    <section className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
      <SectionHeader title="Start exploring now" />
      <div className="relative">
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none' }}>
          {activeCategories.map((cat: any) => {
            const img = cat.image || cat.icon;
            return (
              <button key={cat.id || cat.name} onClick={() => onCategoryClick?.(cat.slug || cat.name)}
                className="flex-shrink-0 w-[160px] md:w-[180px] flex flex-col items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-md transition-all group">
                <div className="w-full h-[120px] md:h-[140px] rounded-lg overflow-hidden bg-gray-50">
                  {img ? (
                    <img src={normalizeImageUrl(img)} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <ShoppingCart size={36} />
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-900 text-center line-clamp-1" style={{ fontFamily: "'Lato', sans-serif" }}>{cat.name}</span>
              </button>
            );
          })}
        </div>
        {activeCategories.length > 5 && (
          <button onClick={() => scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' })}
            className="absolute -right-2 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition z-10">
            <ChevronRight size={28} className="text-gray-700" />
          </button>
        )}
      </div>
    </section>
  );
});
FeaturedCategories.displayName = 'FeaturedCategories';
