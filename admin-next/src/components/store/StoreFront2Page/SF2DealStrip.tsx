import React, { memo, useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import type { Product } from '../../../types';
import { normalizeImageUrl } from '../../../utils/imageUrlHelper';
import { calcDiscount } from '../storefrontShared';
import { C } from './constants';

export const DealStrip = memo(
  ({
    dealProduct,
    onProductClick,
    onBuyNow,
  }: {
    dealProduct: Product;
    onProductClick: (p: Product) => void;
    onBuyNow?: (p: Product) => void;
  }) => {
    const [timeLeft, setTimeLeft] = useState({ h: 11, m: 59, s: 59 });

    useEffect(() => {
      const t = setInterval(() => {
        setTimeLeft((prev) => {
          let { h, m, s } = prev;
          s--;
          if (s < 0) { s = 59; m--; }
          if (m < 0) { m = 59; h--; }
          if (h < 0) return { h: 23, m: 59, s: 59 };
          return { h, m, s };
        });
      }, 1000);
      return () => clearInterval(t);
    }, []);

    const pad = (n: number) => String(n).padStart(2, '0');
    const img = dealProduct.galleryImages?.[0] || dealProduct.image;
    const price = dealProduct.salePrice || dealProduct.price || 0;
    const originalPrice = dealProduct.price && dealProduct.salePrice && dealProduct.price > dealProduct.salePrice ? dealProduct.price : null;

    return (
      <section
        className="py-8 md:py-12"
        style={{ background: `linear-gradient(135deg, ${C.primary} 0%, #1e3a5f 100%)` }}
      >
        <div className="max-w-[1400px] mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Timer */}
            <div className="text-white text-center md:text-left flex-shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={20} style={{ color: C.accent }} />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: C.accent }}>
                  Deal of the Day
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold mb-4">
                Limited Time Offer
              </h2>
              <div className="flex gap-3">
                {[
                  { label: 'HRS', value: timeLeft.h },
                  { label: 'MIN', value: timeLeft.m },
                  { label: 'SEC', value: timeLeft.s },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <div
                      className="text-2xl font-mono font-extrabold w-14 h-14 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: C.accent, color: '#fff' }}
                    >
                      {pad(value)}
                    </div>
                    <div className="text-white/60 text-xs mt-1 font-bold tracking-widest">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Product */}
            <div
              className="flex items-center gap-6 bg-white/10 backdrop-blur-md rounded-2xl p-5 cursor-pointer flex-1 max-w-lg hover:bg-white/15 transition-colors border border-white/10"
              onClick={() => onProductClick(dealProduct)}
            >
              {img && (
                <img
                  src={normalizeImageUrl(img)}
                  alt={dealProduct.title}
                  className="w-28 h-28 object-cover rounded-xl flex-shrink-0"
                />
              )}
              <div className="text-white flex-1 min-w-0">
                <p className="font-bold text-lg leading-snug mb-2 line-clamp-2">{dealProduct.title}</p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-extrabold" style={{ color: C.accent }}>
                    ৳{price}
                  </span>
                  {originalPrice && (
                    <span className="text-white/50 text-sm line-through">৳{originalPrice}</span>
                  )}
                </div>
                {originalPrice && (
                  <span
                    className="inline-block text-xs font-bold px-2 py-0.5 rounded-full mt-2"
                    style={{ backgroundColor: C.accent }}
                  >
                    {calcDiscount(originalPrice, price)}% OFF
                  </span>
                )}
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={(e) => { e.stopPropagation(); onBuyNow?.(dealProduct); }}
              className="flex-shrink-0 px-8 py-4 rounded-full font-bold text-white transition-opacity hover:opacity-90 text-lg shadow-lg"
              style={{ backgroundColor: C.accent }}
            >
              Grab Deal
            </button>
          </div>
        </div>
      </section>
    );
  }
);
DealStrip.displayName = 'DealStrip';
