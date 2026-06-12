import React from 'react';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { LazyImage } from '../../utils/performanceOptimization';
import { useLanguage } from '../../context/LanguageContext';
import { ProductCardProps, getImage, showToast } from './types';

// Style 3: Elegant - Rounded corners with soft shadows and elegant typography
const ProductCardStyle3: React.FC<ProductCardProps> = ({ product, onClick, onBuyNow, onAddToCart, wishlist = [], onToggleWishlist }) => {
  const { t } = useLanguage();
  const isWishlisted = wishlist.includes(product.id);
  const handleBuyNow = (e?: React.MouseEvent) => { e?.stopPropagation(); onBuyNow ? onBuyNow(product) : onClick(product); };
  const handleCart = (e: React.MouseEvent) => { e.stopPropagation(); onAddToCart?.(product); };
  const handleWishlist = (e: React.MouseEvent) => { e.stopPropagation(); onToggleWishlist?.(product.id); showToast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist ❤️'); };
  const discountPercent = product.originalPrice && product.price ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : null;

  return (
    <div className="group bg-gradient-to-b from-white to-gray-50/50 rounded-2xl overflow-hidden flex flex-col relative shadow-md hover:shadow-2xl transition-all duration-500 border border-gray-100" style={{ contain: 'layout' }}>
      {(product.discount || discountPercent) && <div className="absolute top-3 left-3 z-10"><span className="bg-gradient-to-br from-amber-400 to-orange-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">{product.discount || `-${discountPercent}%`}</span></div>}
      <button onClick={handleWishlist} className="absolute top-3 right-3 z-10 w-9 h-9 bg-white/80 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center hover:scale-110 hover:bg-rose-50 transition-all"><Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} className={isWishlisted ? 'text-rose-500' : 'text-gray-400 group-hover:text-rose-500 transition-colors'} /></button>
      <div className="relative cursor-pointer bg-white m-2 rounded-xl overflow-hidden" style={{ aspectRatio: '1/1' }} onClick={() => onClick(product)}>
        <LazyImage src={getImage(product)} alt={product.name} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" width={300} height={300} />
      </div>
      <div className="px-1 pb-1 pt-0.5 flex-1 flex flex-col" style={{ minHeight: '80px' }}>
        <div className="flex items-center gap-0.5 mb-0.5">
          {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={12} className={s <= Math.round(product.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />)}
          <span className="text-[10px] text-gray-400 ml-1">({product.reviews || 0})</span>
        </div>
        <h3 className="font-semibold text-gray-800 text-sm leading-snug mb-0.5 line-clamp-2 cursor-pointer hover:text-theme-primary transition-colors" onClick={() => onClick(product)}>{product.name}</h3>
        <div className="flex items-baseline gap-1 mb-0.5 mt-auto">
          <span className="text-lg font-bold text-theme-primary">৳{product.price?.toLocaleString()}</span>
          {product.originalPrice && <span className="text-xs text-gray-400 line-through">৳{product.originalPrice?.toLocaleString()}</span>}
        </div>
        <div className="flex gap-0.5">
          <button className="flex items-center justify-center w-10 h-10 border-2 border-theme-primary/30 text-theme-primary rounded-xl hover:bg-theme-primary hover:text-white hover:border-theme-primary transition-all" onClick={handleCart}><ShoppingCart size={16} /></button>
          <button className="flex-1 text-white text-sm font-semibold py-1.5 rounded-xl transition-all btn-order" onClick={handleBuyNow}>{t('buy_now')}</button>
        </div>
      </div>
    </div>
  );
};

export default ProductCardStyle3;
