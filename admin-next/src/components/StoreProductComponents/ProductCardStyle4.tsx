import React from 'react';
import { ShoppingCart, Heart, Star, Zap } from 'lucide-react';
import { LazyImage } from '../../utils/performanceOptimization';
import { useLanguage } from '../../context/LanguageContext';
import { ProductCardProps, getImage, showToast } from './types';

// Style 4: Bold - Dark theme with vibrant accents
const ProductCardStyle4: React.FC<ProductCardProps> = ({ product, onClick, onBuyNow, onAddToCart, wishlist = [], onToggleWishlist }) => {
  const { t } = useLanguage();
  const isWishlisted = wishlist.includes(product.id);
  const handleBuyNow = (e?: React.MouseEvent) => { e?.stopPropagation(); onBuyNow ? onBuyNow(product) : onClick(product); };
  const handleCart = (e: React.MouseEvent) => { e.stopPropagation(); onAddToCart?.(product); };
  const handleWishlist = (e: React.MouseEvent) => { e.stopPropagation(); onToggleWishlist?.(product.id); showToast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist ❤️'); };
  const discountPercent = product.originalPrice && product.price ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : null;

  return (
    <div className="group bg-gray-900 rounded-xl overflow-hidden flex flex-col relative shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-800" style={{ contain: 'layout' }}>
      {(product.discount || discountPercent) && <div className="absolute top-3 left-3 z-10"><span className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1"><Zap size={10} />{product.discount || `-${discountPercent}%`}</span></div>}
      <button onClick={handleWishlist} className="absolute top-3 right-3 z-10 w-8 h-8 bg-gray-800/80 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-rose-500 transition-all"><Heart size={14} fill={isWishlisted ? 'currentColor' : 'none'} className={isWishlisted ? 'text-white' : 'text-gray-400 group-hover:text-white'} /></button>
      <div className="relative cursor-pointer bg-gray-800 m-2 rounded-lg overflow-hidden" style={{ aspectRatio: '1/1' }} onClick={() => onClick(product)}>
        <LazyImage src={getImage(product)} alt={product.name} className="w-full h-full object-contain p-3 group-hover:scale-110 transition-transform duration-300" width={300} height={300} />
      </div>
      <div className="px-1 pb-1 flex-1 flex flex-col" style={{ minHeight: '70px' }}>
        <div className="flex items-center gap-0.5 mb-0.5">
          {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={10} className={s <= Math.round(product.rating || 0) ? 'text-cyan-400 fill-cyan-400' : 'text-gray-600'} />)}
          <span className="text-[10px] text-gray-500 ml-1">{product.reviews || 0}</span>
        </div>
        <h3 className="font-medium text-white text-xs leading-snug mb-0.5 line-clamp-2 cursor-pointer hover:text-cyan-400 transition-colors" onClick={() => onClick(product)}>{product.name}</h3>
        <div className="flex items-baseline gap-1 mb-0.5 mt-auto">
          <span className="text-base font-bold text-cyan-400">৳{product.price?.toLocaleString()}</span>
          {product.originalPrice && <span className="text-[10px] text-gray-500 line-through">৳{product.originalPrice?.toLocaleString()}</span>}
        </div>
        <div className="flex gap-0.5">
          <button className="flex items-center justify-center w-9 h-9 bg-gray-800 border border-cyan-500/30 text-cyan-400 rounded-lg hover:bg-cyan-500 hover:text-white transition-all" onClick={handleCart}><ShoppingCart size={14} /></button>
          <button className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold py-1 rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all" onClick={handleBuyNow}>{t('buy_now')}</button>
        </div>
      </div>
    </div>
  );
};

export default ProductCardStyle4;
