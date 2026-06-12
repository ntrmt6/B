import React, { memo } from 'react';
import { ShoppingCart, Package } from 'lucide-react';
import type { Product } from '../../../types';
import { normalizeImageUrl } from '../../../utils/imageUrlHelper';
import { formatPrice, calcDiscount } from './constants';

export const GadgetProductCard = memo(({ product, onClick, onAddToCart, onBuyNow }: {
  product: Product; onClick: () => void; onAddToCart?: () => void; onBuyNow?: () => void;
}) => {
  const img = product.galleryImages?.[0] || product.image;
  const basePrice = Number(product.price) || 0;
  const salePrice = Number(product.salePrice) || 0;
  const originalFromData = Number(product.originalPrice) || 0;

  const price = salePrice > 0 ? salePrice : basePrice;
  const displayOriginalPrice = originalFromData > price
    ? originalFromData
    : (salePrice > 0 && basePrice > salePrice ? basePrice : null);

  const parsedDiscount = Number(String(product.discount || '').replace(/[^0-9.]/g, '')) || 0;
  const discount = displayOriginalPrice
    ? calcDiscount(displayOriginalPrice, price)
    : parsedDiscount;
  const isStockOut = product.stock != null && product.stock <= 0;

  return (
    <div className="block">
      <div
        onClick={onClick}
        className="relative shadow-[rgba(0,0,0,0.07)_0px_0px_10px_0px] inline-block w-full border border-gray-200 rounded-2xl border-solid cursor-pointer hover:shadow-[rgba(0,0,0,0.07)_0px_0px_10px_0px] hover:border hover:border-lime-500 hover:rounded-2xl hover:border-solid transition-all"
      >
        <div className="bg-white max-w-xs w-full overflow-hidden rounded-2xl">
          {/* Image */}
          <div className="relative max-h-[50%]">
            <div className="items-center flex justify-center">
              <div className="items-center flex h-[149.25px] justify-center w-full overflow-hidden md:h-[220px]">
                {img ? (
                  <img
                    alt={product.title}
                    src={normalizeImageUrl(img)}
                    className="block h-full max-h-full max-w-full object-cover w-full md:object-contain"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                    <Package size={40} />
                  </div>
                )}
              </div>
            </div>
            {/* Discount Badge */}
            {discount > 0 && (
              <div className="absolute z-[9] left-0 top-0">
                <span className="text-white text-[11px] bg-orange-400 inline-block leading-3 px-2 py-[5px] rounded-[5px]">
                  -{discount}% OFF
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="px-1.5 pb-2 md:px-2 md:pb-2.5">
            <div className="items-center gap-x-[3px] flex flex-col gap-y-0.5 my-1">
              <div>
                <p className="text-neutral-900 text-[13px] font-medium flow-root h-7 leading-[15px] text-center text-ellipsis break-all overflow-hidden mb-0.5 md:text-black md:text-sm md:h-[34px] md:leading-[17px] md:break-normal">
                 {String(product?.name || 'Unknown Product')}
                </p>
              </div>
              <div className="mb-0.5">
                <div className="flex items-center pt-0.5">
                  <span className="text-black text-[15px] font-medium flex h-[22px] tracking-[-0.56px] leading-[22px]">
                    {formatPrice(price)}
                  </span>
                  {displayOriginalPrice && (
                    <span className="text-black text-[13px] font-medium flex h-[22px] tracking-[-0.56px] leading-[22px] line-through ml-[7px]">
                      {formatPrice(displayOriginalPrice)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="items-center gap-x-1.5 flex gap-y-1.5 mt-1.5">
              {isStockOut ? (
                <button className="text-black items-center flex justify-center text-center text-sm font-semibold bg-neutral-200 h-9 opacity-70 w-full p-0 rounded-[5px] cursor-not-allowed md:h-[38px]">
                  Stock Out
                </button>
              ) : (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); onAddToCart?.(); }}
                    className="text-black items-center flex justify-center text-center text-xs bg-neutral-400/40 shadow-[rgba(0,0,0,0.07)_0px_2px_8px_0px] gap-x-1 basis-[0%] grow h-9 gap-y-1 w-[38px] px-1 py-0 rounded md:text-[13px] md:h-[38px] md:px-0 hover:text-white hover:bg-lime-500 hover:shadow-[rgba(0,0,0,0.07)_0px_2px_8px_0px] hover:rounded transition-colors"
                  >
                    <ShoppingCart size={16} />
                    <span className="text-xs font-medium block px-px md:text-sm md:px-0">
                      Cart
                    </span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onBuyNow?.(); }}
                    className="text-white text-xs font-semibold items-center bg-orange-400 shadow-[rgba(0,0,0,0.07)_0px_2px_8px_0px] flex basis-[0%] grow h-9 justify-center text-center px-2 py-0 rounded-[5px] md:text-sm md:h-[38px] md:px-4 hover:bg-orange-500 hover:shadow-[rgba(0,0,0,0.07)_0px_2px_8px_0px] hover:rounded-[5px] transition-colors"
                  >
                    Buy Now
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
GadgetProductCard.displayName = 'GadgetProductCard';
