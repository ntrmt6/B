import React, { useState } from 'react';
import { ShoppingCart, Heart, Tag } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { ProductCardProps, getImage, showToast } from './types';

// Style 6: Overlay - Clean card with gradient overlay and floating badges
const ProductCardStyle6: React.FC<ProductCardProps> = ({ product, onClick, onBuyNow, onAddToCart, wishlist = [], onToggleWishlist, showSoldCount }) => {
  const { t } = useLanguage();
  const [isHovered, setIsHovered] = useState(true);
  const isWishlisted = wishlist.includes(product.id);
  const isOutOfStock = product.stock === 0;
  const handleBuyNow = (e?: React.MouseEvent) => { e?.stopPropagation(); if (!isOutOfStock) { onBuyNow ? onBuyNow(product) : onClick(product); } };
  const handleCart = (e: React.MouseEvent) => { e.stopPropagation(); if (!isOutOfStock) onAddToCart?.(product); };
  const handleWishlist = (e: React.MouseEvent) => { e.stopPropagation(); onToggleWishlist?.(product.id); showToast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist ❤️'); };
  const discountPercent = product.originalPrice && product.price ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : null;
  const price = product.price || 0;
  const originalPrice = product.originalPrice || 0;
  const soldCount = (product.initialSoldCount || 0) + (product.soldCount || 0);
  const soldOutLabel = t('sold_out');

  return (
    <div
      className="relative inline-flex h-full w-full cursor-pointer flex-col rounded-lg sm:rounded-xl border border-[#ebebeb] bg-white shadow-[0_0_10px_rgba(0,0,0,0.07)] transition-all duration-500 ease-in-out no-underline"
      style={{ contain: 'layout' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(true)}
    >
      {/* Image Section */}
      <div
        className={`relative overflow-hidden rounded-t-lg sm:rounded-t-xl bg-[#f8f8f8] transition-opacity ${isOutOfStock ? 'opacity-40 grayscale-[30%]' : ''}`}
        style={{ aspectRatio: '1.2/1' }}
        onClick={() => onClick(product)}
      >
        {/* Gradient Overlay */}
        <div className={`absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent z-[1] transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />

        {/* Discount Badge */}
        {(product.discount || (discountPercent && discountPercent > 0)) && (
          <div className="absolute top-2 left-2 z-10">
            <span className="bg-[#FF3C3C] text-white text-[10px] md:text-sm font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-md">
              <Tag size={10} className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" />{product.discount || `-${discountPercent}%`}
            </span>
          </div>
        )}

        {/* Out of Stock Badge */}
        {isOutOfStock && (
          <div className="absolute top-2 right-12 z-10">
            <span className="text-white text-[9px] font-medium px-1.5 py-0.5 rounded-md bg-gray-800">
              Sold Out
            </span>
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={(e) => { e.stopPropagation(); handleWishlist(e); }}
          className="absolute top-0 right-0 z-10 w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center cursor-pointer bg-white/80 backdrop-blur-sm rounded-full transition-transform active:scale-90"
        >
          <Heart
            fill={isWishlisted ? '#E72960' : 'transparent'}
            color="#E72960"
            className="w-4 h-4 lg:h-6 lg:w-6 transition-colors"
          />
        </button>

        <div className="w-full overflow-hidden">
          <img
            src={getImage(product)}
            alt={product?.name || 'Product'}
            className="w-full h-auto object-contain"
            loading="lazy"
          />
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col px-0.5 pt-0.5 pb-0.5 sm:px-1 sm:pt-0.5 sm:pb-1 md:px-1.5 md:pt-0.5 md:pb-1">
        {/* Rating & Sold Count */}
        <div className="mb-0.5">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 13 13" fill="none">
                  <path d="M6.04449 0.207218C6.13429 -0.0691755 6.52532 -0.0691763 6.61512 0.207217L7.90372 4.17312C7.94388 4.29673 8.05907 4.38042 8.18904 4.38042H12.359C12.6497 4.38042 12.7705 4.7523 12.5354 4.92312L9.16177 7.37419C9.05663 7.45058 9.01263 7.58599 9.05279 7.7096L10.3414 11.6755C10.4312 11.9519 10.1149 12.1817 9.87974 12.0109L6.50614 9.55985C6.40099 9.48346 6.25862 9.48346 6.15347 9.55985L2.77987 12.0109C2.54475 12.1817 2.22841 11.9519 2.31821 11.6755L3.60682 7.7096C3.64698 7.58599 3.60298 7.45058 3.49783 7.37419L0.124234 4.92312C-0.11088 4.7523 0.00995171 4.38042 0.300569 4.38042H4.47057C4.60054 4.38042 4.71572 4.29673 4.75589 4.17312L6.04449 0.207218Z" fill="#15A4EC" />
                </svg>
              </span>
              <h4 className="text-[#1AA5EB] font-medium text-xs lg:text-base">
                {product.rating || 0} <span className="text-[#727272]">({product.reviews || 0})</span>
              </h4>
            </div>
            {(showSoldCount || soldCount > 0) && (
              <>
                <div className="h-3 w-[1px] bg-[#E72960]/30" />
                <div>
                  <h4 className="text-[#727272] text-xs lg:text-base">
                    {soldCount > 999 ? `${(soldCount / 1000).toFixed(1)}k` : soldCount} Sold
                  </h4>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Product Name */}
        <h3
          className="mb-0.5 overflow-hidden text-ellipsis text-left text-[11px] sm:text-[13px] font-medium leading-[1.25] text-black line-clamp-1 md:line-clamp-2"
          onClick={() => onClick(product)}
        >
          {String(product?.name || 'Unknown Product')}
        </h3>

        {/* Price Section */}
        <div className="mt-auto flex flex-col items-left justify-center space-y-0.5 sm:space-y-0.5">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-[#FF6F00] font-bold text-[16px] text-center font-roboto">
              ৳{Number(price).toLocaleString()}
            </span>
            {originalPrice > 0 && originalPrice !== price && (
              <span className="text-[#666] text-xs lg:text-base line-through opacity-70">
                ৳{Number(originalPrice).toLocaleString()}
              </span>
            )}
            {(product.coins !== undefined && product.coins !== null && Number(product.coins) > 0) && (
              <span className="text-[#15A4EC] text-[10px] lg:text-sm font-semibold bg-[#15A4EC]/10 px-2 py-0.5 rounded-full">
                Get {product.coins} Coins
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className={`flex w-full items-center gap-1.5 overflow-hidden transition-all duration-300 ${isHovered ? 'max-h-14 opacity-100 mt-0.5' : 'max-h-0 opacity-0 mt-0'}`}>
            {/* Add to Cart Button */}
            <button
              className={`flex h-8 sm:h-9 flex-1 items-center justify-center gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl px-1.5 sm:px-2 text-[11px] sm:text-xs font-bold text-white shadow-sm transition-all active:translate-y-0.5 lg:text-sm ${
                isOutOfStock
                  ? 'cursor-not-allowed bg-gray-300'
                  : 'bg-gradient-to-b from-[#FF9D1B] to-[#FF6C01] hover:brightness-110'
              }`}
              onClick={(e) => { e.stopPropagation(); handleCart(e); }}
              title={t('add_to_cart')}
              disabled={isOutOfStock}
            >
              <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-5 lg:h-5" />
              <span className="whitespace-nowrap">{t('cart')}</span>
            </button>

            {/* Buy Now Button */}
            <button
              className={`flex h-8 sm:h-9 flex-1 items-center justify-center gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl px-1.5 sm:px-2 text-[11px] sm:text-xs font-bold text-white shadow-sm transition-all active:translate-y-0.5 lg:text-sm ${
                isOutOfStock
                  ? 'cursor-not-allowed bg-gray-300'
                  : 'bg-gradient-to-b from-[#38BDF8] to-[#1E90FF] hover:brightness-110'
              }`}
              onClick={(e) => { e.stopPropagation(); handleBuyNow(); }}
              disabled={isOutOfStock}
            >
              <span className="whitespace-nowrap">{isOutOfStock ? (soldOutLabel === 'sold_out' ? 'Sold Out' : soldOutLabel) : t('buy_now')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCardStyle6;
