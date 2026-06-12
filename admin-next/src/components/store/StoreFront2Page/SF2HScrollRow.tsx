import React, { memo, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '../../../types';
import { SF2ProductCard } from './SF2ProductCard';
import { C } from './constants';

export const HScrollRow = memo(
  ({
    title,
    subtitle,
    products,
    onProductClick,
    onAddToCart,
    onBuyNow,
    accentColor,
  }: {
    title: string;
    subtitle?: string;
    products: Product[];
    onProductClick: (p: Product) => void;
    onAddToCart?: (p: Product) => void;
    onBuyNow?: (p: Product) => void;
    accentColor?: string;
  }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (dir: 'left' | 'right') => {
      if (!scrollRef.current) return;
      scrollRef.current.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
    };

    if (!products.length) return null;

    return (
      <section className="py-10">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8">
          <div className="flex items-end justify-between mb-5">
            <div>
              <div
                className="text-xs font-bold uppercase tracking-widest mb-1"
                style={{ color: accentColor || C.accent }}
              >
                {subtitle}
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">{title}</h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => scroll('left')}
                className="w-9 h-9 rounded-full border flex items-center justify-center hover:bg-gray-50 transition-colors"
                style={{ borderColor: C.borderLight }}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => scroll('right')}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-colors"
                style={{ backgroundColor: C.primary }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {products.map((p) => (
              <div key={p.id} className="flex-none w-[180px] md:w-[220px] snap-start">
                <SF2ProductCard
                  product={p}
                  onClick={() => onProductClick(p)}
                  onAddToCart={() => onAddToCart?.(p)}
                  onBuyNow={() => onBuyNow?.(p)}
                  compact
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
);
HScrollRow.displayName = 'HScrollRow';
