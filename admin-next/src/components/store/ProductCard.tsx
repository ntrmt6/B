import React, { useState, memo } from 'react';
import { ShoppingCart, Star, Eye, Heart } from 'lucide-react';
import { Product } from '../../types';
import { getCurrencySymbol } from '../../utils/currencyHelper';
import { normalizeImageUrl } from '../../utils/imageUrlHelper';
import { OptimizedImage } from '../OptimizedImage';

export interface ProductCardProps {
    product: Product;
    onClick: (product: Product) => void;
    onBuyNow?: (product: Product) => void;
    onAddToCart?: (product: Product) => void;
    showSoldCount?: boolean;
    wishlist?: number[];
    onToggleWishlist?: (id: number) => void;
    
}

const ProductCardComponent: React.FC<ProductCardProps> = ({ 
    product, 
    onClick, 
    onBuyNow, 
    onAddToCart,
    showSoldCount,
    wishlist = [],
    onToggleWishlist
}) => {
    const isWishlisted = wishlist.includes(product.id);
    const [isHovered, setIsHovered] = useState(false);
    const imageSrc = normalizeImageUrl(product.galleryImages?.[0] || product.image);
    
    const handleBuyNow = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        onBuyNow ? onBuyNow(product) : onClick(product);
    };

    const handleAddToCartClick = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!isOutOfStock) onAddToCart?.(product);
    };

    const discountPercent = product.originalPrice && product.price 
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : null;

    const isOutOfStock = product.stock === 0;
    const soldCount = (product.initialSoldCount || 0) + (product.soldCount || 0);

    return (
        <div 
            className="group bg-white rounded-xl overflow-hidden flex flex-col relative border border-gray-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.1)] hover:border-gray-200 transition-all duration-300 hover:-translate-y-1 active:scale-[0.98]"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Badges */}
            <div className="absolute top-1.5 left-1.5 z-10 flex flex-col gap-1">
                {(product.discount || discountPercent) && (
                    <span className="inline-flex items-center bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                        {product.discount || `-${discountPercent}%`}
                    </span>
                )}
                {isOutOfStock && (
                    <span className="inline-flex items-center bg-gray-800 text-white text-[9px] font-medium px-1.5 py-0.5 rounded-md">
                        Sold Out
                    </span>
                )}
            </div>

            {/* Wishlist Button */}
            <button
                onClick={(e) => { e.stopPropagation(); onToggleWishlist?.(product.id); }}
                className="absolute top-1.5 right-1.5 z-10 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full shadow-sm flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200"
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
                <Heart size={14} className={isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400 group-hover:text-gray-600'} />
            </button>

            {/* Image */}
            <div
                className="relative aspect-square cursor-pointer overflow-hidden bg-gray-50/50"
                onClick={() => onClick(product)}
            >
                <OptimizedImage
                    src={imageSrc}
                    alt={product.name}
                    width={400}
                    height={400}
                    placeholder="blur"
                    className={`w-full h-full object-contain p-1 transition-transform duration-500 group-hover:scale-105 ${isOutOfStock ? 'opacity-40 grayscale-[30%]' : ''}`}
                />
                
                {/* Hover Quick Actions Overlay */}
                <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2 flex justify-center gap-2 transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
                    <button
                        onClick={(e) => { e.stopPropagation(); onClick(product); }}
                        className="w-8 h-8 bg-white/95 rounded-full shadow flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-200"
                        aria-label="Quick view"
                    >
                        <Eye size={14} className="text-gray-700" />
                    </button>
                    <button
                        onClick={handleAddToCartClick}
                        className={`w-8 h-8 bg-white/95 rounded-full shadow flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-200 ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                        aria-label="Add to cart"
                        disabled={isOutOfStock}
                    >
                        <ShoppingCart size={14} className="text-gray-700" />
                    </button>
                </div>
            </div>

            {/* Details */}
            <div className="px-2 md:px-3 pb-2 md:pb-3 pt-1.5 flex-1 flex flex-col gap-0.5">
                {/* Rating & Sold */}
                <div className="flex items-center justify-between">
                    {product.rating !== undefined && product.rating > 0 ? (
                        <div className="flex items-center gap-0.5">
                            <Star size={11} className="text-amber-400 fill-amber-400" strokeWidth={1.5} />
                            <span className="text-[10px] font-semibold text-amber-700">{product.rating?.toFixed(1)}</span>
                            {product.reviews !== undefined && product.reviews > 0 && (
                                <span className="text-[9px] text-gray-400">({product.reviews})</span>
                            )}
                        </div>
                    ) : (
                        <span className="text-[10px] text-gray-300">★ New</span>
                    )}
                    {soldCount > 0 && (
                        <span className="text-[9px] font-medium text-gray-400">
                            {soldCount > 999 ? `${(soldCount / 1000).toFixed(1)}k` : soldCount} sold
                        </span>
                    )}
                </div>

                <h3
                    className="font-medium text-gray-800 text-[11px] md:text-[13px] leading-[1.3] line-clamp-2 cursor-pointer hover:text-theme-primary transition-colors"
                    onClick={() => onClick(product)}
                >
                    {product.name}
                </h3>

                {/* Marketplace: Sold by Store badge */}
                {product.tenantName && (
                    <span className="text-[9px] md:text-[10px] text-gray-400 truncate">
                        Sold by <span className="font-semibold text-[#FF8C00]">{product.tenantName}</span>
                    </span>
                )}

                {/* Pricing Section */}
                <div className="flex items-baseline gap-1.5 mt-auto">
                    <span className="text-[15px] md:text-lg font-bold text-theme-primary leading-none">৳{product.price?.toLocaleString()}</span>
                    {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-[10px] md:text-xs text-gray-400 line-through leading-none">৳{product.originalPrice?.toLocaleString()}</span>
                    )}
                </div>

                {/* Action Buttons — visible only on hover */}
                <div className={`flex gap-1.5 overflow-hidden transition-all duration-300 ${isHovered ? 'max-h-12 opacity-100 mt-1.5' : 'max-h-0 opacity-0 mt-0'}`}>
                    <button
                        className={`flex-1 py-1.5 md:py-2 font-semibold rounded-lg text-[11px] md:text-xs flex items-center justify-center gap-1 transition-all duration-200 ${
                            isOutOfStock
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-[0.97]'
                        }`}
                        onClick={handleAddToCartClick}
                        disabled={isOutOfStock}
                        aria-label="Add to cart"
                    >
                        <ShoppingCart size={13} strokeWidth={2} />
                        <span className="hidden xxs:inline">Cart</span>
                    </button>
                    <button
                        className={`flex-[1.4] py-1.5 md:py-2 font-semibold rounded-lg text-[11px] md:text-xs transition-all duration-200 ${
                            isOutOfStock
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-theme-primary text-white hover:brightness-110 active:scale-[0.97] shadow-sm shadow-theme-primary/20'
                        }`}
                        onClick={handleBuyNow}
                        disabled={isOutOfStock}
                    >
                        {isOutOfStock ? 'Sold Out' : 'Buy Now'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Memoize ProductCard — re-render only on meaningful data changes
export const ProductCard = memo(ProductCardComponent, (prevProps, nextProps) => {
    return (
        prevProps.product.id === nextProps.product.id &&
        prevProps.product.price === nextProps.product.price &&
        prevProps.product.stock === nextProps.product.stock &&
        prevProps.showSoldCount === nextProps.showSoldCount &&
        (prevProps.wishlist || []).includes(prevProps.product.id) === (nextProps.wishlist || []).includes(nextProps.product.id)
    );
});