import React from 'react';
import { ShoppingCart, Heart, Star, Package } from 'lucide-react';
import { LazyImage } from '../../utils/performanceOptimization';
import { useLanguage } from '../../context/LanguageContext';
import { ProductCardProps, getImage, showToast } from './types';

// Style 5: Compact - Space-efficient with horizontal layout on larger screens
const ProductCardStyle5: React.FC<ProductCardProps> = ({ product, onClick, onBuyNow, onAddToCart, wishlist = [], onToggleWishlist }) => {
  const { t } = useLanguage();
  const isWishlisted = wishlist.includes(product.id);
  const handleBuyNow = (e?: React.MouseEvent) => { e?.stopPropagation(); onBuyNow ? onBuyNow(product) : onClick(product); };
  const handleCart = (e: React.MouseEvent) => { e.stopPropagation(); onAddToCart?.(product); };
  const handleWishlist = (e: React.MouseEvent) => { e.stopPropagation(); onToggleWishlist?.(product.id); showToast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist ❤️'); };
  const discountPercent = product.originalPrice && product.price ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : null;

  return (
    <div className="group bg-white rounded-lg overflow-hidden flex flex-col relative border border-gray-200 hover:border-theme-primary/30 hover:shadow-lg transition-all duration-300" style={{ contain: 'layout' }}>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-theme-r opacity-0 group-hover:opacity-100 transition-opacity" />
      {(product.discount || discountPercent) && <div className="absolute top-2 left-2 z-10"><span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">{product.discount || `-${discountPercent}%`}</span></div>}
      <button onClick={handleWishlist} className="absolute top-2 right-2 z-10 w-7 h-7 bg-white shadow-md rounded-full flex items-center justify-center hover:scale-110 transition-all"><Heart size={14} fill={isWishlisted ? 'currentColor' : 'none'} className={isWishlisted ? 'text-rose-500' : 'text-gray-400 group-hover:text-rose-500'} /></button>
      <div className="relative cursor-pointer bg-gradient-to-br from-gray-50 to-white overflow-hidden" style={{ aspectRatio: '1/1' }} onClick={() => onClick(product)}>
        <LazyImage src={getImage(product)} alt={product.name} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300" width={300} height={300} />
        <div className="absolute inset-0 bg-theme-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="px-1 pb-1 pt-0.5 flex-1 flex flex-col border-t border-gray-100" style={{ minHeight: '60px' }}>
        <div className="flex items-center justify-between mb-px">
          <div className="flex items-center gap-0.5">{[1, 2, 3, 4, 5].map((s) => <Star key={s} size={9} className={s <= Math.round(product.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />)}</div>
          <span className="text-[9px] text-gray-400 flex items-center gap-0.5"><Package size={9} />{(product.initialSoldCount || 0) + (product.soldCount || 0)}</span>
        </div>
        <h3 className="font-medium text-gray-700 text-[11px] leading-snug mb-px line-clamp-2 cursor-pointer hover:text-theme-primary transition-colors" onClick={() => onClick(product)}>{product.name}</h3>
        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-theme-primary">৳{product.price?.toLocaleString()}</span>
            {product.originalPrice && <span className="text-[9px] text-gray-400 line-through">৳{product.originalPrice?.toLocaleString()}</span>}
          </div>
          <div className="flex gap-1">
            <button className="w-7 h-7 flex items-center justify-center border border-gray-200 text-gray-500 rounded hover:border-theme-primary hover:text-theme-primary transition-all" onClick={handleCart}><ShoppingCart size={12} /></button>
            <button className="px-3 h-7 bg-theme-primary text-white text-[10px] font-semibold rounded hover:bg-theme-primary/90 transition-all" onClick={handleBuyNow}>Buy</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCardStyle5;
