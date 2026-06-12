import React from 'react';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/format';
import { LazyImage } from '../../utils/performanceOptimization';
import { normalizeImageUrl } from '../../utils/imageUrlHelper';

type MatchType = 'compatible' | 'complementary' | 'behavioral';

interface RelatedProductMatch {
  product: Product;
  matchType: MatchType;
  reason: string;
  stockCount: number;
  score: number;
}

interface RelatedProductsSectionProps {
  relatedProducts: RelatedProductMatch[];
  isLoading: boolean;
  onProductClick: (product: Product) => void;
}

const MATCH_BADGE: Record<MatchType, { label: string; className: string }> = {
  compatible: { label: 'Compatible', className: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
  complementary: { label: 'Complements', className: 'bg-sky-50 text-sky-700 border border-sky-100' },
  behavioral: { label: 'Trending', className: 'bg-gray-50 text-gray-600 border border-gray-100' },
};

export const RelatedProductsSection: React.FC<RelatedProductsSectionProps> = ({
  relatedProducts,
  isLoading,
  onProductClick,
}) => (
  <div className="bg-white/80 backdrop-blur-xl rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 animate-slide-up transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
    <div className="flex items-center justify-between mb-6">
      <h3 className="font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-theme-primary"></span>
        Related Products
      </h3>
      <div className="h-[1px] flex-1 bg-slate-100 ml-4"></div>
    </div>

    <div className="space-y-5">
      {isLoading ? (
        [...Array(3)].map((_, i) => (
          <div key={`skeleton-${i}`} className="flex gap-4 animate-pulse">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-3 bg-slate-100 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
              <div className="h-3 bg-slate-100 rounded w-1/4 mt-4" />
            </div>
          </div>
        ))
      ) : (
        relatedProducts.map(({ product: related, matchType, reason, stockCount }) => (
          <div
            key={related.id}
            onClick={() => onProductClick(related)}
            className="group relative flex gap-4 p-2 -m-2 rounded-[20px] transition-all duration-300 cursor-pointer hover:bg-slate-50 active:scale-[0.98]"
          >
            <div className="relative w-20 h-20 bg-white rounded-2xl border border-slate-100 overflow-hidden flex-shrink-0 group-hover:shadow-lg group-hover:shadow-black/5 transition-all duration-500">
              <LazyImage 
                src={normalizeImageUrl(related.image)} 
                alt={related.name} 
                className="w-full h-full object-contain p-2 transform group-hover:scale-110 transition-transform duration-700" 
              />
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
              <div>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-[13px] font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-theme-primary transition-colors duration-300">
                    {related.name}
                  </h4>
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg whitespace-nowrap shadow-sm border border-black/5 ${MATCH_BADGE[matchType].className}`}>
                    {MATCH_BADGE[matchType].label}
                  </span>
                </div>
                
                <p className="text-[11px] text-slate-400 line-clamp-1 italic group-hover:text-slate-500 transition-colors">
                  {reason}
                </p>
              </div>

              <div className="flex items-center justify-between mt-2">
                <span className="text-slate-900 font-extrabold text-[14px]">
                  ৳ {formatCurrency(related.price)}
                </span>
                
                <div className="flex items-center gap-1.5">
                  <div className={`w-1 h-1 rounded-full ${stockCount > 0 ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    {stockCount > 0 ? `${stockCount} In Stock` : 'Restocking'}
                  </span>
                </div>
              </div>
            </div>

            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
              <div className="p-1 rounded-full bg-white shadow-md text-theme-primary">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);
