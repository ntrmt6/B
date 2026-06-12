import React, { memo } from 'react';
import { ShoppingCart } from 'lucide-react';
import type { Product } from '../../../types';
import { normalizeImageUrl } from '../../../utils/imageUrlHelper';
import { StarRating } from '../storefrontShared';
import { ACCENT } from './constants';

export const SFProductCard = memo(({ product, onClick, onAddToCart }: {
  product: Product;
  onClick: () => void;
  onAddToCart?: () => void;
}) => {
  const img = product.galleryImages?.[0] || product.image;
  const price = product.salePrice || product.price || 0;
  const originalPrice = product.price && product.salePrice && product.price > product.salePrice ? product.price : null;
  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group cursor-pointer flex flex-col" onClick={onClick}>
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {img ? (
          <img src={normalizeImageUrl(img)} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <ShoppingCart size={48} />
          </div>
        )}
        {discount > 0 && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">{discount}% OFF</span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1 gap-2">
        <h3 className="font-bold text-gray-900 text-base line-clamp-1" style={{ fontFamily: "'Lato', sans-serif" }}>{product.title}</h3>
        <p className="text-gray-500 text-sm line-clamp-2" style={{ fontFamily: "'Lato', sans-serif" }}>
          {product.description || product.description?.replace(/<[^>]*>/g, '').slice(0, 80) || ''}
        </p>
        <StarRating rating={product.rating || 4} />
        <div className="flex items-end gap-2 mt-auto">
          <span className="font-bold text-lg" style={{ color: ACCENT, fontFamily: "'Lato', sans-serif" }}>
            ৳{price}
          </span>
          {originalPrice && (
            <span className="text-gray-400 text-sm line-through">৳{originalPrice}</span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-sm" style={{ color: ACCENT, fontFamily: "'Lato', sans-serif" }}>View Details</span>
          <button
            onClick={(e) => { e.stopPropagation(); onAddToCart?.(); }}
            className="ml-auto px-4 py-2 rounded-full text-white text-sm font-bold transition-colors hover:opacity-90"
            style={{ backgroundColor: ACCENT }}
          >
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
});
SFProductCard.displayName = 'SFProductCard';
