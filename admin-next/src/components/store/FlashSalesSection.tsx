import { useState, useEffect, useRef, RefObject } from 'react';
import { ChevronRight, ChevronLeft, Heart, ShoppingCart, Eye, Star, Flame } from 'lucide-react';
import { Product } from '../../types';
import { normalizeImageUrl } from '../../utils/imageUrlHelper';
import { useLanguage } from '../../context/LanguageContext';

interface Props { 
  products: Product[]; 
  showCounter: boolean; 
  countdown: { label: string; value: string }[]; 
  onProductClick: (p: Product) => void; 
  onBuyNow?: (p: Product) => void; 
  onQuickView?: (p: Product) => void; 
  onAddToCart?: (p: Product) => void; 
  // wishlist props
  wishlist?: number[];
  onToggleWishlist?: (id: number) => void;
  productCardStyle?: string; 
  sectionRef?: RefObject<HTMLElement>;
  onViewAll?: () => void;
}

// Modern Product Card - Same style as regular products
const ProductCard = ({ product, onProductClick, onBuyNow, onAddToCart, onQuickView, wishlist = [], onToggleWishlist }: { 
  product: Product; 
  onProductClick: (p: Product) => void;
  onBuyNow?: (p: Product) => void;
  onAddToCart?: (p: Product) => void;
  onQuickView?: (p: Product) => void;
  wishlist?: number[];
  onToggleWishlist?: (id: number) => void;
}) => {
  const isWishlisted = wishlist.includes(product.id);
  const [isHovered, setIsHovered] = useState(false);
  const imageSrc = normalizeImageUrl(product.galleryImages?.[0] || product.image);
  const discountPercent = product.originalPrice && product.price 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <div 
      className="group bg-white rounded-lg sm:rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col w-[120px] xs:w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px] flex-shrink-0 border border-gray-100"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Section - Compact on Mobile */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {/* Wishlist - Smaller on Mobile */}
        {/* <button 
          onClick={(e) => { e.stopPropagation(); onToggleWishlist?.(product.id); }}
          className="absolute top-1 right-1 sm:to p-2 sm:right-2 z-10 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/90 shadow-sm flex items-center justify-center hover:scale-110 transition-transform"
        >
          <Heart size={12} className={`sm:w-4 sm:h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
        </button> */}
        
        {/* Discount Badge - Compact on Mobile */}
        {/* {discountPercent && discountPercent > 0 && (
          <span className="absolute top-1 left-1 sm:to p-2 sm:left-2 bg-red-500 text-white text-[8px] sm:text-[10px] font-bold px-1 sm:px-2 py-0.5 sm:py-1 rounded sm:rounded-md shadow-sm">
            -{discountPercent}%
          </span> */}
      
        
        <img
          src={imageSrc}
          alt={product.name}
          className="w-full h-full object-contain p-1 sm:p-2 cursor-pointer group-hover:scale-105 transition-transform duration-300"
          onClick={() => onProductClick(product)}
          loading="lazy"
        />
        
        {/* Quick Actions on Hover - Hidden on Mobile Touch, Visible on Desktop */}
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1 sm:p-2 hidden sm:flex justify-center gap-1 sm:gap-2 transition-all duration-300 ${isHovered ? 'sm:opacity-100 sm:translate-y-0' : 'sm:opacity-0 sm:translate-y-2'}`}>
          <button 
            onClick={() => onQuickView?.(product)}
            className="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow-md"
          >
            <Eye size={12} className="sm:w-[14px] sm:h-[14px] text-gray-700" />
          </button>
          <button 
            onClick={() => onAddToCart?.(product)}
            className="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow-md"
          >
            <ShoppingCart size={12} className="sm:w-[14px] sm:h-[14px] text-gray-700" />
          </button>
        </div>
      </div>
      
      {/* Details - Compact on Mobile */}
      <div className="p-0.5 sm:p-1 md:p-1.5 flex flex-col flex-1">
        {/* Rating - Compact on Mobile */}
        <div className="flex items-center gap-0.5 sm:gap-1 mb-0.5 sm:mb-1">
          <Star size={10} className="sm:w-3 sm:h-3 text-amber-400 fill-amber-400" />
          <span className="text-[10px] sm:text-xs text-gray-500">{product.rating || '4.5'} <span className="hidden xs:inline">({product.reviews || 0})</span></span>
        </div>
        
        {/* Name - Compact on Mobile */}
        <h3 
          className="text-[11px] sm:text-xs md:text-sm font-medium text-gray-800 line-clamp-2 mb-1 sm:mb-2 cursor-pointer hover:text-pink-600 transition-colors min-h-[28px] sm:min-h-[32px] md:min-h-[40px]"
          onClick={() => onProductClick(product)}
        >
          {product.name}
        </h3>
        
        {/* Price - Compact on Mobile */}
        <div className="flex items-baseline gap-1 sm:gap-2 mt-auto flex-wrap">
          <span className="text-xs sm:text-sm md:text-base font-bold text-gray-900">৳{product.price?.toLocaleString()}</span>
          {product.originalPrice && (
            <span className="text-[9px] sm:text-[10px] md:text-xs text-gray-400 line-through">৳{product.originalPrice.toLocaleString()}</span>
          )}
        </div>
        
        {/* Buy Now Button - Compact on Mobile */}
        <button 
          onClick={() => onBuyNow?.(product)}
          className="mt-1 sm:mt-2 w-full py-1 sm:py-1.5 md:py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] sm:text-xs font-semibold rounded sm:rounded-lg hover:from-pink-600 hover:to-rose-600 transition-all shadow-sm"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
};

export const FlashSalesSection = ({ products, showCounter, countdown, onProductClick, onBuyNow, onQuickView, onAddToCart, wishlist, onToggleWishlist, productCardStyle, sectionRef, onViewAll }: Props) => {
  const { t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Auto slide effect
  useEffect(() => {
    if (products.length <= 3 || isPaused) return;
    
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const container = scrollRef.current;
        const maxScroll = container.scrollWidth - container.clientWidth;
        
        if (container.scrollLeft >= maxScroll - 10) {
          // Reset to start smoothly
          container.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          container.scrollBy({ left: 210, behavior: 'smooth' });
        }
      }
    }, 3500);
    
    return () => clearInterval(interval);
  }, [products.length, isPaused]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 420;
    const newPos = direction === 'left' 
      ? scrollRef.current.scrollLeft - scrollAmount 
      : scrollRef.current.scrollLeft + scrollAmount;
    scrollRef.current.scrollTo({ left: newPos, behavior: 'smooth' });
  };

  const updateScrollButtons = () => {
    if (!scrollRef.current) return;
    setCanScrollLeft(scrollRef.current.scrollLeft > 0);
    setCanScrollRight(scrollRef.current.scrollLeft < scrollRef.current.scrollWidth - scrollRef.current.clientWidth - 10);
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollButtons);
      updateScrollButtons();
      return () => container.removeEventListener('scroll', updateScrollButtons);
    }
  }, [products]);

  if (!products.length) return null;

  return (
    <section 
      ref={sectionRef} 
      className="pt-0.5 pb-0.5"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Modern Header - Responsive */}
      <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 rounded-xl sm:rounded-2xl p-px sm:p-0.5 shadow-lg">
        <div className="bg-gradient-to-r from-pink-500/90 via-rose-500/90 to-orange-500/90 rounded-lg sm:rounded-xl p-1 sm:p-1.5 md:p-1.5">
          {/* Title Row - Compact on Mobile */}
          <div className="flex items-center justify-between mb-0.5 sm:mb-1">
            <div className="flex items-center gap-0.5 sm:gap-1">
              <div className="w-7 h-7 sm:w-10 sm:h-10 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <Flame className="text-white w-4 h-4 sm:w-5 sm:h-5 md:w-[22px] md:h-[22px]" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-xl md:text-2xl font-bold text-white truncate">{t('flash_deals')}</h2>
                <p className="text-white/80 text-[10px] sm:text-xs md:text-sm hidden xs:block">Limited time offers</p>
              </div>
            </div>
            
            {/* Mobile Countdown - Compact inline */}
            {showCounter && (
              <div className="flex sm:hidden items-center gap-0.5 mx-1" role="timer" aria-label="Deal countdown timer">
                {countdown.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-0.5">
                    <div className="bg-white/20 rounded px-1 py-0.5 min-w-[24px] text-center" aria-label={`${item.value} ${item.label}`}>
                      <span className="text-[11px] font-bold text-white leading-none">{item.value}</span>
                    </div>
                    {idx < countdown.length - 1 && <span className="text-white/80 text-[10px] font-bold" aria-hidden="true">:</span>}
                  </div>
                ))}
              </div>
            )}
            
            {/* Desktop Countdown */}
            {showCounter && (
              <div className="hidden sm:flex items-center gap-1.5">
                {countdown.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <div className="bg-white/20 rounded-lg px-2.5 py-1.5 min-w-[45px] text-center">
                      <span className="text-lg font-bold text-white">{item.value}</span>
                      <p className="text-[9px] text-white/70 uppercase">{item.label}</p>
                    </div>
                    {idx < countdown.length - 1 && <span className="text-white font-bold">:</span>}
                  </div>
                ))}
              </div>
            )}
            
            <button 
              onClick={onViewAll} 
              className="flex items-center gap-0.5 sm:gap-1 bg-white text-pink-600 text-[10px] sm:text-xs md:text-sm font-bold px-2 sm:px-4 py-1 sm:py-2 rounded-full hover:bg-pink-50 transition-all shadow-md flex-shrink-0"
            >
              <span className="hidden xs:inline">View All</span>
              <span className="xs:hidden">All</span>
              <ChevronRight size={12} className="sm:w-4 sm:h-4" />
            </button>
          </div>
          
          {/* Products Slider */}
          <div className="relative">
            {/* Left Arrow - Smaller on Mobile */}
            {canScrollLeft && (
              <button 
                onClick={() => handleScroll('left')}
                className="absolute -left-1 sm:-left-2 md:left-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-all"
              >
                <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
              </button>
            )}
            
            {/* Products Container - Tighter gaps on Mobile */}
            <div 
              ref={scrollRef}
              className="flex gap-0.5 sm:gap-0.5 md:gap-1 overflow-x-auto scrollbar-hide pb-0.5 sm:pb-0.5 scroll-smooth px-px sm:px-0.5"
            >
              {products.map((p, idx) => (
                <ProductCard 
                  key={`flash-${p.id}-${idx}`}
                  product={p} 
                  onProductClick={onProductClick} 
                  onBuyNow={onBuyNow}
                  onAddToCart={onAddToCart}
                  onQuickView={onQuickView}
                  wishlist={wishlist}
                  onToggleWishlist={onToggleWishlist}
                />
              ))}
            </div>
            
            {/* Right Arrow - Smaller on Mobile */}
            {canScrollRight && (
              <button 
                onClick={() => handleScroll('right')}
                className="absolute -right-1 sm:-right-2 md:right-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-all"
              >
                <ChevronRight size={16} className="sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
          
          {/* Progress Dots - Compact on Mobile */}
          {products.length > 4 && (
            <div className="flex justify-center gap-0.5 sm:gap-0.5 mt-0.5 sm:mt-1">
              {Array.from({ length: Math.min(5, Math.ceil(products.length / 2)) }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white/40 hover:bg-white/80 transition-colors cursor-pointer" />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FlashSalesSection;
