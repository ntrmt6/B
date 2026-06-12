import { memo, useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Award, Star, Sparkles, Shield, Crown } from 'lucide-react';
import { normalizeImageUrl } from '../../utils/imageUrlHelper';

interface Brand {
  id?: string;
  name: string;
  image?: string;
  logo?: string;
  slug?: string;
}

interface Props {
  brands: Brand[];
  onBrandClick?: (brand: Brand) => void;
  style?: string;
  sectionRef?: React.RefObject<HTMLElement>;
}

// Style 1: Classic Horizontal Scrolling Logos
const BrandStyle1 = memo(({ brands, onBrandClick }: Omit<Props, 'style' | 'sectionRef'>) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const display = useMemo(() => brands.slice(0, 20), [brands]);

  if (!display.length) return null;

  const duplicated = [...display, ...display];

  return (
    <section className="py-1 px-0.5 sm:px-1 overflow-hidden">
      <div className="flex items-center gap-1 mb-1">
        <div className="p-1 rounded-xl bg-gradient-theme-br">
          <Award className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Shop by Brand</h2>
      </div>
      <div 
        ref={scrollRef}
        className="relative overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div 
          className={`flex gap-1.5 items-center ${isPaused ? '' : 'animate-marquee-brand'}`}
          style={{ animationDuration: `${display.length * 3}s`, animationPlayState: isPaused ? 'paused' : 'running' }}
        >
          {duplicated.map((brand, i) => (
            <button
              key={`${brand.name}-${i}`}
              onClick={() => onBrandClick?.(brand)}
              className="flex-shrink-0 w-28 h-20 sm:w-36 sm:h-24 bg-white rounded-xl border border-gray-200 hover:border-theme-primary hover:shadow-lg transition-all flex items-center justify-center p-1 group"
            >
              {brand.image || brand.logo ? (
                <img src={normalizeImageUrl(brand.image || brand.logo || '')} alt={brand.name} className="max-w-full max-h-full object-contain opacity-70 group-hover:opacity-100 transition-opacity" />
              ) : (
                <span className="text-sm font-semibold text-gray-500 group-hover:text-theme-primary transition-colors text-center">{brand.name}</span>
              )}
            </button>
          ))}
        </div>
      </div>
      <style>{`@keyframes marquee-brand{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}.animate-marquee-brand{animation:marquee-brand linear infinite}`}</style>
    </section>
  );
});
BrandStyle1.displayName = 'BrandStyle1';

// Style 2: Grid Cards with Hover Effects
const BrandStyle2 = memo(({ brands, onBrandClick }: Omit<Props, 'style' | 'sectionRef'>) => {
  const display = useMemo(() => brands.slice(0, 8), [brands]);

  if (!display.length) return null;

  return (
    <section className="py-1 px-0.5 sm:px-1">
      <div className="flex items-center gap-1 mb-1">
        <div className="p-1 rounded-xl bg-amber-500">
          <Star className="w-5 h-5 text-white" fill="white" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Popular Brands</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-0.5 sm:gap-1">
        {display.map((brand) => (
          <button
            key={brand.name}
            onClick={() => onBrandClick?.(brand)}
            className="group relative bg-white rounded-2xl border border-gray-200 p-1 sm:p-1.5 h-32 flex items-center justify-center hover:shadow-xl hover:border-theme-primary transition-all overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-theme-br opacity-0 group-hover:opacity-5 transition-opacity" />
            {brand.image || brand.logo ? (
              <img src={normalizeImageUrl(brand.image || brand.logo || '')} alt={brand.name} className="max-w-full max-h-full object-contain opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all" />
            ) : (
              <span className="text-lg font-bold text-gray-400 group-hover:text-theme-primary transition-colors">{brand.name}</span>
            )}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-theme-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
          </button>
        ))}
      </div>
    </section>
  );
});
BrandStyle2.displayName = 'BrandStyle2';

// Style 3: Circular Brand Badges
const BrandStyle3 = memo(({ brands, onBrandClick }: Omit<Props, 'style' | 'sectionRef'>) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const display = useMemo(() => brands.slice(0, 12), [brands]);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'right' ? 200 : -200, behavior: 'smooth' });
  };

  if (!display.length) return null;

  return (
    <section className="py-1 px-0.5 sm:px-1">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Top Brands</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={() => scroll('left')} className="p-2 rounded-full border border-gray-300 hover:bg-gray-100 text-gray-600">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => scroll('right')} className="p-2 rounded-full border border-gray-300 hover:bg-gray-100 text-gray-600">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-1 overflow-x-auto scrollbar-hide pb-0.5" style={{ scrollbarWidth: 'none' }}>
        {display.map((brand) => (
          <button
            key={brand.name}
            onClick={() => onBrandClick?.(brand)}
            className="flex-shrink-0 flex flex-col items-center gap-0.5 group"
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white border-2 border-gray-200 group-hover:border-theme-primary p-1 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
              {brand.image || brand.logo ? (
                <img src={normalizeImageUrl(brand.image || brand.logo || '')} alt={brand.name} className="max-w-full max-h-full object-contain rounded-full" />
              ) : (
                <span className="text-xs font-bold text-gray-500 text-center">{brand.name.slice(0, 3)}</span>
              )}
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-600 group-hover:text-theme-primary transition-colors whitespace-nowrap">{brand.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
});
BrandStyle3.displayName = 'BrandStyle3';

// Style 4: Compact Pills with Logos
const BrandStyle4 = memo(({ brands, onBrandClick }: Omit<Props, 'style' | 'sectionRef'>) => {
  const display = useMemo(() => brands.slice(0, 15), [brands]);

  if (!display.length) return null;

  return (
    <section className="py-1 px-0.5 sm:px-1">
      <div className="flex items-center gap-1 mb-1">
        <div className="p-1 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Trusted Brands</h2>
      </div>
      <div className="flex flex-wrap gap-0.5 sm:gap-0.5">
        {display.map((brand) => (
          <button
            key={brand.name}
            onClick={() => onBrandClick?.(brand)}
            className="inline-flex items-center gap-1 px-1.5 py-1 bg-white rounded-full border border-gray-200 hover:border-theme-primary hover:shadow-md transition-all group"
          >
            {(brand.image || brand.logo) && (
              <img src={normalizeImageUrl(brand.image || brand.logo || '')} alt="" className="w-5 h-5 object-contain" />
            )}
            <span className="text-sm font-medium text-gray-700 group-hover:text-theme-primary transition-colors">{brand.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
});
BrandStyle4.displayName = 'BrandStyle4';

// Style 5: Featured Brand Cards with Info
const BrandStyle5 = memo(({ brands, onBrandClick }: Omit<Props, 'style' | 'sectionRef'>) => {
  const display = useMemo(() => brands.slice(0, 6), [brands]);

  if (!display.length) return null;

  return (
    <section className="py-1 px-0.5 sm:px-1">
      <div className="flex items-center gap-1 mb-1">
        <div className="p-1 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Featured Brands</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
        {display.map((brand, i) => (
          <button
            key={brand.name}
            onClick={() => onBrandClick?.(brand)}
            className={`group relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-1.5 hover:shadow-xl transition-all overflow-hidden ${i === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
          >
            <div className="absolute top-3 right-3 px-2 py-1 bg-theme-primary/10 rounded-full">
              <span className="text-xs font-medium text-theme-primary">Official</span>
            </div>
            <div className={`flex items-center justify-center ${i === 0 ? 'h-40 md:h-60' : 'h-24'} mb-1`}>
              {brand.image || brand.logo ? (
                <img src={normalizeImageUrl(brand.image || brand.logo || '')} alt={brand.name} className="max-w-full max-h-full object-contain opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all" />
              ) : (
                <span className="text-3xl font-bold text-gray-300">{brand.name}</span>
              )}
            </div>
            <div className="text-center">
              <h3 className="font-bold text-gray-900 group-hover:text-theme-primary transition-colors mb-1">{brand.name}</h3>
              <p className="text-xs text-gray-500">Shop Collection →</p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-theme-r opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </section>
  );
});
BrandStyle5.displayName = 'BrandStyle5';

// Main Export
export const BrandSection = memo(({ style = '1', sectionRef, ...props }: Props) => {
  if (!props.brands?.length) return null;

  const content = (() => {
    switch (style) {
      case '2': return <BrandStyle2 {...props} />;
      case '3': return <BrandStyle3 {...props} />;
      case '4': return <BrandStyle4 {...props} />;
      case '5': return <BrandStyle5 {...props} />;
      case 'none': return null;
      default: return <BrandStyle1 {...props} />;
    }
  })();

  if (!content) return null;
  return sectionRef ? <section ref={sectionRef}>{content}</section> : content;
});
BrandSection.displayName = 'BrandSection';

export default BrandSection;
