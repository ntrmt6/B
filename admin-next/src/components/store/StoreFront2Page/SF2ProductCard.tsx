import React, { memo } from 'react';
import { ShoppingCart, Zap, Package } from 'lucide-react';
import type { Product } from '../../../types';
import { normalizeImageUrl } from '../../../utils/imageUrlHelper';
import { StarRating, calcDiscount } from '../storefrontShared';
import { C } from './constants';

export const SF2ProductCard = memo(
  ({
    product,
    onClick,
    onAddToCart,
    onBuyNow,
    compact = false,
  }: {
    product: Product;
    onClick: () => void;
    onAddToCart?: () => void;
    onBuyNow?: () => void;
    compact?: boolean;
  }) => {
    const img = product.galleryImages?.[0] || product.image;
    const price = product.salePrice || product.price || 0;
    const originalPrice =
      product.price && product.salePrice && product.price > product.salePrice
        ? product.price
        : null;
    const discount = originalPrice ? calcDiscount(originalPrice, price) : 0;

    return (
      <div
        className={`group relative bg-white rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${compact ? 'shadow-sm border border-gray-100' : 'shadow-md'}`}
        onClick={onClick}
        style={{ borderColor: C.borderLight }}
      >
        {/* image */}
        <div className={`relative overflow-hidden bg-gray-50 ${compact ? 'aspect-[4/3]' : 'aspect-square'}`}>
          {img ? (
            <img
              src={normalizeImageUrl(img)}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-200">
              <Package size={40} />
            </div>
          )}
          {discount > 0 && (
            <span
              className="absolute top-2 left-2 text-white text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: C.accent }}
            >
              -{discount}%
            </span>
          )}
          {/* hover overlay buttons */}
          <div className="absolute inset-0 flex items-end justify-between px-3 pb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={(e) => { e.stopPropagation(); onAddToCart?.(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-semibold shadow-lg"
              style={{ backgroundColor: C.primary }}
            >
              <ShoppingCart size={13} />
              Cart
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onBuyNow?.(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-semibold shadow-lg"
              style={{ backgroundColor: C.accent }}
            >
              <Zap size={13} />
              Buy
            </button>
          </div>
        </div>

        {/* info */}
        <div className="p-3 flex flex-col flex-1 gap-1.5">
          <p className="font-semibold text-sm text-gray-900 line-clamp-2 leading-snug">
            {product.title}
          </p>
          <StarRating rating={product.rating || 4} />
          <div className="flex items-center gap-2 mt-auto pt-1">
            <span className="font-bold text-base" style={{ color: C.accent }}>
              ৳{price}
            </span>
            {originalPrice && (
              <span className="text-gray-400 text-xs line-through">৳{originalPrice}</span>
            )}
          </div>
        </div>
      </div>
    );
  }
);
SF2ProductCard.displayName = 'SF2ProductCard';
