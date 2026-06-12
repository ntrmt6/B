import { memo, useMemo, useRef, useState, useEffect } from 'react';
import { Product } from '../../types';
import { ProductCard } from '../StoreProductComponents';
import { ChevronLeft, ChevronRight, Sparkles, Star, Zap, Gift, Crown } from 'lucide-react';
import { normalizeImageUrl } from '../../utils/imageUrlHelper';

interface Props {
  products: Product[];
  onProductClick: (p: Product) => void;
  onBuyNow: (p: Product) => void;
  onQuickView: (p: Product) => void;
  onAddToCart: (p: Product) => void;
  // wishlist support
  wishlist?: number[];
  onToggleWishlist?: (id: number) => void;
  productCardStyle?: string;
  style?: string;
  sectionRef?: React.RefObject<HTMLElement>;
}

// Style 1: Classic Carousel with Large Hero Cards
const ShowcaseStyle1 = memo(({ products, onProductClick, onBuyNow, onQuickView, onAddToCart, wishlist, onToggleWishlist, productCardStyle }: Omit<Props, 'style' | 'sectionRef'>) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const display = useMemo(() => products.slice(0, 12), [products]);

  const updateScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'right' ? 320 : -320, behavior: 'smooth' });
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) { el.addEventListener('scroll', updateScroll); updateScroll(); }
    return () => el?.removeEventListener('scroll', updateScroll);
  }, []);

  if (!display.length) return null;

  return (
    <section className="pt-0.5 pb-0.5 px-0.5 sm:px-1">
      <div className="flex items-center justify-between mb-0.5 sm:mb-1">
        <div className="flex items-center gap-1 sm:gap-1">
          <div className="p-0.5 sm:p-1 rounded-xl bg-gradient-theme-br">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Featured Products</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={() => scroll('left')} disabled={!canScrollLeft} className={`p-2 rounded-full border ${canScrollLeft ? 'border-gray-300 hover:bg-gray-100 text-gray-700' : 'border-gray-200 text-gray-300 cursor-not-allowed'}`}>
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => scroll('right')} disabled={!canScrollRight} className={`p-2 rounded-full border ${canScrollRight ? 'border-gray-300 hover:bg-gray-100 text-gray-700' : 'border-gray-200 text-gray-300 cursor-not-allowed'}`}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-0.5 sm:gap-0.5 md:gap-1 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-0.5 sm:pb-0.5" style={{ scrollbarWidth: 'none' }}>
        {display.map(p => (
          <div key={p.id} className="flex-shrink-0 w-[280px] sm:w-[300px] snap-start">
            <ProductCard product={p} onClick={onProductClick} onBuyNow={onBuyNow} variant={productCardStyle} onQuickView={onQuickView} onAddToCart={onAddToCart} wishlist={wishlist} onToggleWishlist={onToggleWishlist} />
          </div>
        ))}
      </div>
    </section>
  );
});
ShowcaseStyle1.displayName = 'ShowcaseStyle1';

// Style 2: Hero Banner + Side Products Grid
const ShowcaseStyle2 = memo(({ products, onProductClick, onBuyNow, onQuickView, onAddToCart, wishlist, onToggleWishlist, productCardStyle }: Omit<Props, 'style' | 'sectionRef'>) => {
  const display = useMemo(() => products.slice(0, 5), [products]);
  const [hero, ...sides] = display;

  if (!hero) return null;

  const heroImg = hero.image?.[0] || hero.image || '';

  return (
    <section className="pt-0.5 pb-0.5 px-0.5 sm:px-1">
      <div className="flex items-center gap-1 mb-1">
        <div className="p-1 rounded-xl bg-amber-500">
          <Star className="w-5 h-5 text-white" fill="white" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Top Picks</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-1">
        {/* Hero Product */}
        <div onClick={() => onProductClick(hero)} className="group relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden cursor-pointer border border-gray-200 hover:shadow-xl transition-all duration-300">
          <div className="aspect-[4/3] p-4 sm:p-6 flex items-center justify-center">
            <img src={normalizeImageUrl(heroImg)} alt={hero.name} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 sm:p-6">
            <span className="inline-block px-3 py-1 bg-theme-primary text-white text-xs font-semibold rounded-full mb-2">Featured</span>
            <h3 className="text-xl font-bold text-white mb-1 line-clamp-2">{hero.name}</h3>
            <p className="text-2xl font-bold text-white">{hero.salePrice ? `৳${hero.salePrice}` : `৳${hero.price}`}</p>
          </div>
        </div>
        {/* Side Products */}
        <div className="grid grid-cols-2 gap-0.5">
          {sides.map(p => (
            <div key={p.id} className="h-full">
              <ProductCard product={p} onClick={onProductClick} onBuyNow={onBuyNow} variant={productCardStyle} onQuickView={onQuickView} onAddToCart={onAddToCart} wishlist={wishlist} onToggleWishlist={onToggleWishlist} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
ShowcaseStyle2.displayName = 'ShowcaseStyle2';

// Style 3: Masonry Grid with Featured Badges
const ShowcaseStyle3 = memo(({ products, onProductClick, onBuyNow, onQuickView, onAddToCart, wishlist, onToggleWishlist, productCardStyle }: Omit<Props, 'style' | 'sectionRef'>) => {
  const display = useMemo(() => products.slice(0, 6), [products]);

  if (!display.length) return null;

  return (
    <section className="pt-0.5 pb-0.5 px-0.5 sm:px-1">
      <div className="flex items-center gap-1 mb-1">
        <div className="p-1 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Trending Now</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-0.5 sm:gap-1">
        {display.map((p, i) => (
          <div key={p.id} className={`${i === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}>
            <div className="h-full relative">
              {i === 0 && (
                <div className="absolute top-3 left-3 z-10 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-lg">
                  <Crown size={12} /> Most Popular
                </div>
              )}
              <ProductCard product={p} onClick={onProductClick} onBuyNow={onBuyNow} variant={productCardStyle} onQuickView={onQuickView} onAddToCart={onAddToCart} wishlist={wishlist} onToggleWishlist={onToggleWishlist} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
});
ShowcaseStyle3.displayName = 'ShowcaseStyle3';

// Style 4: Horizontal Cards with Large Images
const ShowcaseStyle4 = memo(({ products, onProductClick, onBuyNow, onQuickView, onAddToCart }: Omit<Props, 'style' | 'sectionRef' | 'productCardStyle'>) => {
  const display = useMemo(() => products.slice(0, 4), [products]);

  if (!display.length) return null;

  return (
    <section className="pt-0.5 pb-0.5 px-0.5 sm:px-1">
      <div className="flex items-center gap-1 mb-1">
        <div className="p-1 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
          <Gift className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Special Offers</h2>
      </div>
      <div className="space-y-0.5">
        {display.map((p) => {
          const img = p.image?.[0] || p.image || '';
          const discount = p.salePrice && p.price ? Math.round((1 - p.salePrice / p.price) * 100) : 0;
          return (
            <div key={p.id} onClick={() => onProductClick(p)} className="group flex items-center gap-1 bg-white rounded-2xl border border-gray-200 p-1 sm:p-1 hover:shadow-lg hover:border-theme-primary/30 transition-all cursor-pointer">
              <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden">
                <img src={normalizeImageUrl(img)} alt={p.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-theme-primary transition-colors">{p.name}</h3>
                <div className="flex items-center gap-1 mb-0.5">
                  {p.salePrice ? (
                    <>
                      <span className="text-lg font-bold text-theme-primary">৳{p.salePrice}</span>
                      <span className="text-sm text-gray-400 line-through">৳{p.price}</span>
                      {discount > 0 && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">-{discount}%</span>}
                    </>
                  ) : (
                    <span className="text-lg font-bold text-gray-900">৳{p.price}</span>
                  )}
                </div>
                <div className="flex gap-0.5">
                  <button onClick={(e) => { e.stopPropagation(); onAddToCart(p); }} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors">Add to Cart</button>
                  <button onClick={(e) => { e.stopPropagation(); onBuyNow(p); }} className="px-4 py-2 bg-theme-primary hover:bg-theme-secondary text-white text-sm font-medium rounded-lg transition-colors">Buy Now</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
});
ShowcaseStyle4.displayName = 'ShowcaseStyle4';

// Style 5: Magazine Style with Full-Width Hero
const ShowcaseStyle5 = memo(({ products, onProductClick, onBuyNow, onQuickView, onAddToCart, productCardStyle }: Omit<Props, 'style' | 'sectionRef'>) => {
  const display = useMemo(() => products.slice(0, 5), [products]);
  const [activeIdx, setActiveIdx] = useState(0);
  const activeProduct = display[activeIdx];

  useEffect(() => {
    if (display.length <= 1) return;
    const timer = setInterval(() => setActiveIdx(i => (i + 1) % display.length), 5000);
    return () => clearInterval(timer);
  }, [display.length]);

  if (!activeProduct) return null;

  const img = activeProduct.image?.[0] || activeProduct.image || '';

  return (
    <section className="pt-0.5 pb-0.5 px-0.5 sm:px-1">
      <div className="flex items-center gap-1 mb-1">
        <div className="p-1 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Spotlight</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-1">
        {/* Main Hero */}
        <div className="lg:col-span-2 relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden min-h-[400px]">
          <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 30% 50%, rgba(99,102,241,0.4), transparent 60%)' }} />
          <div className="relative h-full p-4 sm:p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur text-white text-xs font-medium rounded-full mb-4">✨ Featured</span>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 line-clamp-2">{activeProduct.name}</h3>
              <p className="text-white/70 line-clamp-2 mb-4 max-w-md">{activeProduct.description || 'Premium quality product at an amazing price.'}</p>
              <div className="flex items-center gap-3 mb-6">
                {activeProduct.salePrice ? (
                  <>
                    <span className="text-3xl font-bold text-white">৳{activeProduct.salePrice}</span>
                    <span className="text-lg text-white/50 line-through">৳{activeProduct.price}</span>
                  </>
                ) : (
                  <span className="text-3xl font-bold text-white">৳{activeProduct.price}</span>
                )}
              </div>
              <button onClick={() => onBuyNow(activeProduct)} className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors">Shop Now</button>
            </div>
            <div className="flex gap-2 mt-4">
              {display.map((_, i) => (
                <button key={i} onClick={() => setActiveIdx(i)} className={`w-2 h-2 rounded-full transition-all ${i === activeIdx ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/60'}`} />
              ))}
            </div>
          </div>
          <img src={normalizeImageUrl(img)} alt={activeProduct.name} className="absolute right-0 bottom-0 w-1/2 h-4/5 object-contain opacity-90" />
        </div>
        {/* Side Products */}
        <div className="space-y-0.5">
          {display.slice(0, 3).map((p, i) => (
            <div key={p.id} onClick={() => { setActiveIdx(i); onProductClick(p); }} className={`flex items-center gap-1 p-1 rounded-xl cursor-pointer transition-all ${i === activeIdx ? 'bg-theme-primary/10 border-2 border-theme-primary' : 'bg-white border border-gray-200 hover:border-gray-300'}`}>
              <img src={normalizeImageUrl(p.image?.[0] || p.image || '')} alt={p.name} className="w-16 h-16 object-contain rounded-lg bg-gray-50" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 line-clamp-1 text-sm">{p.name}</h4>
                <p className="font-bold text-theme-primary">৳{p.salePrice || p.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
ShowcaseStyle5.displayName = 'ShowcaseStyle5';

// Main Export
export const ShowcaseSection = memo(({ style = '1', sectionRef, ...props }: Props) => {
  const content = (() => {
    switch (style) {
      case '2': return <ShowcaseStyle2 {...props} />;
      case '3': return <ShowcaseStyle3 {...props} />;
      case '4': return <ShowcaseStyle4 {...props} />;
      case '5': return <ShowcaseStyle5 {...props} />;
      default: return <ShowcaseStyle1 {...props} />;
    }
  })();

  return sectionRef ? <section ref={sectionRef}>{content}</section> : content;
});
ShowcaseSection.displayName = 'ShowcaseSection';

export default ShowcaseSection;
