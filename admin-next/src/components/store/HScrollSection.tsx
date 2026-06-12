/**
 * HScrollSection – Reusable horizontal scroll section for product cards.
 * Used across all StoreFront2 visual variants.
 */

import React, { memo, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '../../types';

export const HScrollSection = memo(({ title, subtitle, products, renderCard, accentColor }: {
  title: string; subtitle?: string; products: Product[];
  renderCard: (p: Product) => React.ReactNode; accentColor?: string;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: 'left' | 'right') => scrollRef.current?.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
  if (!products.length) return null;

  return (
    <section className="py-10">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        <div className="flex items-end justify-between mb-5">
          <div>
            {subtitle && <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: accentColor }}>{subtitle}</div>}
            <h2 className="text-2xl md:text-3xl font-extrabold">{title}</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={() => scroll('left')} className="w-9 h-9 rounded-full border flex items-center justify-center hover:opacity-70 transition-opacity"><ChevronLeft size={18} /></button>
            <button onClick={() => scroll('right')} className="w-9 h-9 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: accentColor || '#333' }}><ChevronRight size={18} /></button>
          </div>
        </div>
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
          {products.map(p => <div key={p.id} className="flex-none w-[180px] md:w-[220px] snap-start">{renderCard(p)}</div>)}
        </div>
      </div>
    </section>
  );
});
HScrollSection.displayName = 'HScrollSection';

export default HScrollSection;
