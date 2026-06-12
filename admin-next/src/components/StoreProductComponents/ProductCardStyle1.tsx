import React, { useState } from 'react';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { LazyImage } from '../../utils/performanceOptimization';
import { useLanguage } from '../../context/LanguageContext';
import { ProductCardProps, getImage, showToast } from './types';

// Style 1: Default - Clean modern card with gradient top bar
const ProductCardStyle1: React.FC<ProductCardProps> = ({ product, onClick, onBuyNow, onAddToCart, wishlist = [], onToggleWishlist, showSoldCount }) => {
  const { t } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);
  const isWishlisted = wishlist.includes(product.id);
  const isOutOfStock = product.stock === 0;
  const handleBuyNow = (e?: React.MouseEvent) => { e?.stopPropagation(); if (!isOutOfStock) { onBuyNow ? onBuyNow(product) : onClick(product); } };
  const handleCart = (e: React.MouseEvent) => { e.stopPropagation(); if (!isOutOfStock) onAddToCart?.(product); };
  const handleWishlist = (e: React.MouseEvent) => { e.stopPropagation(); onToggleWishlist?.(product.id); showToast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist ❤️'); };
  const discountPercent = product.originalPrice && product.price ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : null;
  const soldCount = (product.initialSoldCount || 0) + (product.soldCount || 0);

  return (
    <div className="group bg-white rounded-xl overflow-hidden flex flex-col relative border border-gray-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.1)] hover:border-gray-200 transition-all duration-300 hover:-translate-y-1 active:scale-[0.98]" style={{ contain: 'layout' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >

      <button
        className="absolute top-1.5 left-1.5 z-10 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-pink-500 hover:scale-110 active:scale-95 transition-all"
        onClick={handleWishlist}
        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart size={14} fill={isWishlisted ? 'currentColor' : 'none'} strokeWidth={2} />
      </button>

      <div className="absolute top-1.5 right-1.5 z-10 flex flex-col gap-0.5">
        {(product.discount || discountPercent) && (
          <span className="text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-sm bg-rose-500">
            {product.discount || `-${discountPercent}%`}
          </span>
        )}
        {isOutOfStock && (
          <span className="text-white text-[9px] font-medium px-1.5 py-0.5 rounded-md bg-gray-800">
            Sold Out
          </span>
        )}
      </div>

      <div className={`relative cursor-pointer bg-gray-50/50 overflow-hidden ${isOutOfStock ? 'opacity-40 grayscale-[30%]' : ''}`} style={{ aspectRatio: '1/1' }} onClick={() => onClick(product)}>
        <LazyImage
          src={getImage(product)}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          width={400}
          height={400}
        />
      </div>

      <div className="px-1 pb-1 pt-0.5 md:px-1 md:pb-1 flex-1 flex flex-col gap-0.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-0.5 text-[9px] md:text-[10px] text-amber-600 font-semibold">
            <Star size={10} className="fill-amber-400 text-amber-400" />
            <span>{product.rating || 5}</span>
            <span className="text-gray-400 font-normal">({product.reviews || 0})</span>
          </div>
          {(showSoldCount || soldCount > 0) && (
            <span className="text-[8px] md:text-[9px] text-gray-400 font-medium">
              {soldCount > 999 ? `${(soldCount / 1000).toFixed(1)}k` : soldCount} sold
            </span>
          )}
        </div>

        <h3 className="font-medium text-gray-800 text-[10px] md:text-[13px] leading-[1.3] line-clamp-1 md:line-clamp-2 cursor-pointer hover:text-theme-primary transition-colors" onClick={() => onClick(product)}>
          {product.name}
        </h3>

        <div className="flex items-baseline gap-1.5 mt-auto">
          <span className="text-[14px] md:text-base font-bold text-[#FF6F00] leading-none">৳{product.price?.toLocaleString()}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-[10px] md:text-[11px] text-gray-400 line-through font-medium leading-none">৳{product.originalPrice?.toLocaleString()}</span>
          )}
        </div>

        <div className={`flex gap-0.5 overflow-hidden transition-all duration-300 ${isHovered ? 'max-h-12 opacity-100 mt-0.5' : 'max-h-0 opacity-0 mt-0'}`}>
          <button
            className={`flex items-center justify-center w-8 h-7 md:h-8 border rounded-lg transition-all active:scale-95 ${isOutOfStock ? 'border-gray-100 text-gray-300 cursor-not-allowed' : 'border-[#FFB74D] bg-[#FFB74D] text-white hover:brightness-110'}`}
            onClick={handleCart}
            title={t('add_to_cart')}
            disabled={isOutOfStock}
          >
            <ShoppingCart size={14} />
          </button>
          <button
            className={`flex-1 text-[11px] md:text-xs font-bold rounded-lg h-7 md:h-8 transition-all active:scale-95 flex items-center justify-center gap-1 ${isOutOfStock ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#4FC3F7] text-white hover:brightness-110 shadow-sm shadow-[#4FC3F7]/20'}`}
            onClick={handleBuyNow}
            disabled={isOutOfStock}
          >
            {isOutOfStock ? 'Sold Out' : t('buy_now')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCardStyle1;
