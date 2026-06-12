import { memo, useMemo, RefObject, useState, useCallback, useEffect, useRef } from 'react';
import { Grid, ChevronRight, ChevronLeft, Sparkles, ShoppingBag, Star, Layers, ArrowRight } from 'lucide-react';
import { Category } from '../../types';
import { normalizeImageUrl } from '../../utils/imageUrlHelper';

const isImageUrl = (icon?: string) => {
  if (!icon) return false;
  return icon.startsWith('http') || icon.startsWith('/') || icon.startsWith('data:');
};

interface Props {
  categories?: Category[];
  onCategoryClick: (name: string) => void;
  sectionRef?: RefObject<HTMLDivElement>;
  categoryScrollRef?: RefObject<HTMLDivElement>;
  style?: string;
}

// ============================================================================
// Style 1: Classic Pill Carousel (Default) - Horizontal scrolling pills
// ============================================================================
const CategoryStyle1 = memo(({ categories, onCategoryClick, sectionRef }: Omit<Props, 'style'>) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [animationDuration, setAnimationDuration] = useState(30);

  const processed = useMemo(() => 
    categories?.filter(c => !c.status || c.status === 'Active' || c.status?.toLowerCase() === 'active')
      .sort((a: any, b: any) => (a.serial ?? Infinity) - (b.serial ?? Infinity))
      .slice(0, 30)
      .map(c => ({ name: c.name, icon: c.icon || 'grid', image: c.image, slug: c.slug })) || []
  , [categories]);

  useEffect(() => {
    const baseSpeed = 20;
    const itemCount = processed.length;
    const duration = Math.max(15, (itemCount / 10) * baseSpeed);
    setAnimationDuration(duration);
  }, [processed.length]);

  const handleClick = useCallback((slug: string) => onCategoryClick(slug), [onCategoryClick]);

  const handleManualScroll = useCallback((direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    setIsPaused(true);
    container.scrollBy({ left: direction === 'right' ? 300 : -300, behavior: 'smooth' });
    setTimeout(() => setIsPaused(false), 3000);
  }, []);

  if (!processed.length) return null;

  const duplicatedItems = [...processed, ...processed];

  return (
    <div ref={sectionRef} className="relative pt-0.5 sm:pt-0.5 pb-0.5 sm:pb-0.5 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)} onTouchEnd={() => setTimeout(() => setIsPaused(false), 3000)}>
      <div className="flex items-center justify-between mb-0.5 sm:mb-1 px-0.5">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-bold text-gray-900">
            Categories
            </h2>
          {/* <div className="h-[3px] w-8 sm:w-12 bg-gradient-theme-r rounded-full mt-1"></div> */}
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5">
            <button onClick={() => handleManualScroll('left')} className="p-1.5 rounded-full bg-gray-100 hover:bg-theme-primary/10 text-gray-500 hover:text-theme-primary transition-all shadow-sm" aria-label="Scroll left">
              <ChevronLeft size={18} strokeWidth={2.5} />
            </button>
            <button onClick={() => handleManualScroll('right')} className="p-1.5 rounded-full bg-gray-100 hover:bg-theme-primary/10 text-gray-500 hover:text-theme-primary transition-all shadow-sm" aria-label="Scroll right">
              <ChevronRight size={18} strokeWidth={2.5} />
            </button>
          </div>
          <button className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-gray-900 hover:text-theme-secondary transition-colors px-2 py-1 rounded-full hover:bg-theme-primary/10" onClick={() => onCategoryClick('__all__')}>
            View All <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
      
      <div ref={scrollContainerRef} className="overflow-hidden">
        <div className={`flex gap-0.5 w-max ${isPaused ? '' : 'animate-marquee-cat'}`}
          style={{ animationDuration: `${animationDuration}s`, animationPlayState: isPaused ? 'paused' : 'running' }}>
          {duplicatedItems.map((category, index) => {
            const iconSrc = category.image || category.icon;
            const hasImage = iconSrc && isImageUrl(iconSrc);
            return (
              <button key={`${category.name}-${index}`} onClick={() => handleClick(category.slug || category.name)}
                className="flex-shrink-0 flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full bg-white border border-gray-100 text-gray-700 hover:bg-gray-50 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 shadow-sm group touch-manipulation">
                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 bg-gray-50 group-hover:bg-gray-100 transition-colors duration-200">
                  {hasImage ? <img src={normalizeImageUrl(iconSrc)} alt={category.name} className="w-full h-full object-cover rounded-full" loading="eager" decoding="sync" />
                    : <Grid size={18} className="text-theme-primary" strokeWidth={1.5} />}
                </div>
                <span className="text-xs sm:text-sm font-medium whitespace-nowrap text-gray-700 group-hover:text-gray-900 transition-colors">{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>
      <style>{`@keyframes marquee-cat{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}.animate-marquee-cat{animation:marquee-cat linear infinite}`}</style>
    </div>
  );
});
CategoryStyle1.displayName = 'CategoryStyle1';

// ============================================================================
// Style 2: Grid Cards - Modern card grid layout with hover effects
// ============================================================================
const CategoryStyle2 = memo(({ categories, onCategoryClick, sectionRef }: Omit<Props, 'style'>) => {
  const processed = useMemo(() => 
    categories?.filter(c => !c.status || c.status === 'Active' || c.status?.toLowerCase() === 'active')
      .sort((a: any, b: any) => (a.serial ?? Infinity) - (b.serial ?? Infinity))
      .slice(0, 12)
      .map(c => ({ name: c.name, icon: c.icon || 'grid', image: c.image, slug: c.slug })) || []
  , [categories]);

  if (!processed.length) return null;

  return (
    <div ref={sectionRef} className="py-0.5 sm:py-0.5 px-0 sm:px-0">
      <div className="flex items-center justify-between mb-0.5 sm:mb-0.5">

        <h2 className="text-lg font-bold text-gray-900">Categories</h2>
        {/* Category text */}
        <button className="flex items-center gap-1 text-sm font-semibold text-theme-primary hover:text-theme-secondary transition-colors px-3 py-1.5 rounded-lg hover:bg-theme-primary/10" onClick={() => onCategoryClick('__all__')}>
          See All <ChevronRight size={18} />
        </button>
      </div>
      
      <div className="grid grid-cols-6 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-0.5 sm:gap-1">
        {processed.map((category, index) => {
          const iconSrc = category.image || category.icon;
          const hasImage = iconSrc && isImageUrl(iconSrc);
          return (
            <button key={`${category.name}-${index}`} onClick={() => onCategoryClick(category.slug || category.name)}
              className="group flex flex-col items-center p-0.5 sm:p-0.5 rounded-2xl bg-white transition-all duration-300">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-theme-primary/10 group-hover:to-theme-secondary/10 flex items-center justify-center overflow-hidden mb-0.5 sm:mb-0.5 transition-all duration-300 shadow-inner">  
                {hasImage ? <img src={normalizeImageUrl(iconSrc)} alt={category.name} className="w-full h-full object-cover rounded-xl" loading="lazy" />
                  : <ShoppingBag size={24} className="text-gray-400 group-hover:text-theme-primary transition-colors" />}
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-700 group-hover:text-theme-primary text-center line-clamp-2 transition-colors">{category.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
CategoryStyle2.displayName = 'CategoryStyle2';

// ============================================================================
// Style 3: Circular Icons with Labels - Instagram-style circular layout
// ============================================================================
const CategoryStyle3 = memo(({ categories, onCategoryClick, sectionRef }: Omit<Props, 'style'>) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const processed = useMemo(() => 
    categories?.filter(c => !c.status || c.status === 'Active' || c.status?.toLowerCase() === 'active')
      .sort((a: any, b: any) => (a.serial ?? Infinity) - (b.serial ?? Infinity))
      .slice(0, 20)
      .map(c => ({ name: c.name, icon: c.icon || 'grid', image: c.image, slug: c.slug })) || []
  , [categories]);

  const scroll = useCallback((dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 200 : -200, behavior: 'smooth' });
  }, []);

  if (!processed.length) return null;

  return (
    <div ref={sectionRef} className="py-0.5 sm:py-1 bg-gradient-to-b from-gray-50 to-white">
      <div className="flex items-center justify-between mb-0.5 px-0.5 sm:px-1">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
          <Sparkles size={18} className="text-theme-primary" /> Categories
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={() => scroll('left')} className="hidden sm:flex p-1.5 rounded-full bg-white shadow-md hover:shadow-lg text-gray-500 hover:text-theme-primary transition-all" aria-label="Scroll left">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => scroll('right')} className="hidden sm:flex p-1.5 rounded-full bg-white shadow-md hover:shadow-lg text-gray-500 hover:text-theme-primary transition-all" aria-label="Scroll right">
            <ChevronRight size={18} />
          </button>
          <button className="text-xs sm:text-sm font-semibold text-theme-primary" onClick={() => onCategoryClick('__all__')}>View All</button>
        </div>
      </div>
      
      <div ref={scrollRef} className="flex gap-1 sm:gap-1.5 overflow-x-auto px-0.5 sm:px-1 pb-0.5 scrollbar-hide snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {processed.map((category, index) => {
          const iconSrc = category.image || category.icon;
          const hasImage = iconSrc && isImageUrl(iconSrc);
          return (
            <button key={`${category.name}-${index}`} onClick={() => onCategoryClick(category.slug || category.name)}
              className="flex-shrink-0 flex flex-col items-center gap-0.5 group snap-start active:scale-95 transition-transform">
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-0.5 bg-gradient-theme-tr group-hover:shadow-lg group-hover:shadow-theme-primary/30 transition-shadow">
                  <div className="w-full h-full rounded-full bg-white p-1 overflow-hidden">
                    {hasImage ? <img src={normalizeImageUrl(iconSrc)} alt={category.name} className="w-full h-full object-cover rounded-full" loading="lazy" />
                      : <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <Grid size={24} className="text-gray-400" />
                        </div>}
                  </div>
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-theme-primary flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight size={14} className="text-white" />
                </div>
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-700 group-hover:text-theme-primary text-center max-w-[72px] sm:max-w-[88px] truncate transition-colors">{category.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
CategoryStyle3.displayName = 'CategoryStyle3';

// ============================================================================
// Style 4: Compact List with Icons - Elegant list layout for many categories
// ============================================================================
const CategoryStyle4 = memo(({ categories, onCategoryClick, sectionRef }: Omit<Props, 'style'>) => {
  const [showAll, setShowAll] = useState(false);
  
  const processed = useMemo(() => 
    categories?.filter(c => !c.status || c.status === 'Active' || c.status?.toLowerCase() === 'active')
      .sort((a: any, b: any) => (a.serial ?? Infinity) - (b.serial ?? Infinity))
      .slice(0, 16)
      .map(c => ({ name: c.name, icon: c.icon || 'grid', image: c.image, slug: c.slug })) || []
  , [categories]);

  const visible = showAll ? processed : processed.slice(0, 8);

  if (!processed.length) return null;

  return (
    <div ref={sectionRef} className="py-0.5 sm:py-1 px-0.5 sm:px-1">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-theme-r p-1 sm:p-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Layers size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">Categories</h2>
                <p className="text-xs text-white/70">{processed.length} collections</p>
              </div>
            </div>
            <button onClick={() => onCategoryClick('__all__')} className="text-xs sm:text-sm font-medium text-white/90 hover:text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-all">
              View All
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-gray-100">
          {visible.map((category, index) => {
            const iconSrc = category.image || category.icon;
            const hasImage = iconSrc && isImageUrl(iconSrc);
            return (
              <button key={`${category.name}-${index}`} onClick={() => onCategoryClick(category.slug || category.name)}
                className="flex items-center gap-1 p-1 sm:p-1 hover:bg-gradient-to-r hover:from-theme-primary/5 hover:to-theme-secondary/5 transition-all group">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-100 group-hover:bg-theme-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0 transition-colors">
                  {hasImage ? <img src={normalizeImageUrl(iconSrc)} alt={category.name} className="w-full h-full object-cover" loading="lazy" />
                    : <Grid size={18} className="text-gray-400 group-hover:text-theme-primary transition-colors" />}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <span className="text-sm font-medium text-gray-700 group-hover:text-theme-primary truncate block transition-colors">{category.name}</span>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-theme-primary flex-shrink-0 transition-colors" />
              </button>
            );
          })}
        </div>
        
        {processed.length > 8 && (
          <button onClick={() => setShowAll(!showAll)} className="w-full py-3 text-sm font-semibold text-theme-primary hover:bg-theme-primary/5 border-t border-gray-100 transition-colors flex items-center justify-center gap-1">
            {showAll ? 'Show Less' : `Show ${processed.length - 8} More`}
            <ChevronRight size={16} className={`transition-transform ${showAll ? 'rotate-90' : ''}`} />
          </button>
        )}
      </div>
    </div>
  );
});
CategoryStyle4.displayName = 'CategoryStyle4';

// ============================================================================
// Style 5: Featured Cards - Large featured cards with gradient overlays
// ============================================================================
const CategoryStyle5 = memo(({ categories, onCategoryClick, sectionRef }: Omit<Props, 'style'>) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const processed = useMemo(() => 
    categories?.filter(c => !c.status || c.status === 'Active' || c.status?.toLowerCase() === 'active')
      .sort((a: any, b: any) => (a.serial ?? Infinity) - (b.serial ?? Infinity))
      .slice(0, 10)
      .map(c => ({ name: c.name, icon: c.icon || 'grid', image: c.image, slug: c.slug })) || []
  , [categories]);

  const scroll = useCallback((dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 250 : -250, behavior: 'smooth' });
  }, []);

  if (!processed.length) return null;

  const gradients = [
    'from-rose-500 to-pink-600', 'from-blue-500 to-cyan-600', 'from-amber-500 to-orange-600',
    'from-emerald-500 to-teal-600', 'from-violet-500 to-purple-600', 'from-red-500 to-rose-600',
    'from-sky-500 to-blue-600', 'from-lime-500 to-green-600', 'from-fuchsia-500 to-pink-600', 'from-indigo-500 to-violet-600'
  ];

  return (
    <div ref={sectionRef} className="py-0.5 sm:py-1">
      <div className="flex items-center justify-between mb-0.5 px-0.5 sm:px-1">
        <div className="flex items-center gap-2">
          <Star size={20} className="text-theme-primary fill-theme-primary" />
          <h2 className="text-base sm:text-lg font-bold text-gray-900">Featured Categories</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => scroll('left')} className="hidden sm:flex p-2 rounded-full bg-gray-100 hover:bg-theme-primary hover:text-white text-gray-500 transition-all shadow-sm" aria-label="Scroll left">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => scroll('right')} className="hidden sm:flex p-2 rounded-full bg-gray-100 hover:bg-theme-primary hover:text-white text-gray-500 transition-all shadow-sm" aria-label="Scroll right">
            <ChevronRight size={18} />
          </button>
          <button className="text-sm font-semibold text-theme-primary hover:underline" onClick={() => onCategoryClick('__all__')}>All</button>
        </div>
      </div>
      
      <div ref={scrollRef} className="flex gap-0.5 sm:gap-1 overflow-x-auto px-0.5 sm:px-1 pb-0.5 snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {processed.map((category, index) => {
          const iconSrc = category.image || category.icon;
          const hasImage = iconSrc && isImageUrl(iconSrc);
          const gradient = gradients[index % gradients.length];
          return (
            <button key={`${category.name}-${index}`} onClick={() => onCategoryClick(category.slug || category.name)}
              className="flex-shrink-0 relative w-32 h-40 sm:w-40 sm:h-48 rounded-2xl overflow-hidden group snap-start active:scale-95 transition-transform">
              {hasImage ? (
                <>
                  <img src={normalizeImageUrl(iconSrc)} alt={category.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </>
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} group-hover:scale-110 transition-transform duration-500`}>
                  <div className="absolute inset-0 flex items-center justify-center opacity-20">
                    <ShoppingBag size={64} className="text-white" />
                  </div>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                <span className="text-sm sm:text-base font-bold text-white drop-shadow-lg line-clamp-2">{category.name}</span>
                <div className="mt-1 flex items-center gap-1 text-white/80 text-xs font-medium group-hover:text-white transition-colors">
                  <span>Shop Now</span>
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});
CategoryStyle5.displayName = 'CategoryStyle5';


// ========================================================================
// Style 6: Colorful Cards - Large colorful cards with positioned images
// ========================================================================
const STYLE6_COLOR_SCHEMES = [
  { bgColor: '#EDEDED', textColor: '#717171', titleColor: '#808080', buttonColor: '#4B4B4B' },
  { bgColor: '#D9EFF9', textColor: '#3297C5', titleColor: '#809FB0', buttonColor: '#3297C5' },
  { bgColor: '#FEF9C4', textColor: '#DDC14C', titleColor: '#9A9573', buttonColor: '#DDC14C' },
  { bgColor: '#F2E7E3', textColor: '#BCA299', titleColor: '#8F817D', buttonColor: '#BCA299' },
  { bgColor: '#E3F2E6', textColor: '#27B342', titleColor: '#7AA283', buttonColor: '#27B342' },
  { bgColor: '#FAE8E8', textColor: '#C53D41', titleColor: '#918181', buttonColor: '#C53D41' },
];

const CategoryStyle6 = memo(({ categories, onCategoryClick, sectionRef }: Omit<Props, 'style'>) => {
  const processed = useMemo(() =>
    categories?.filter(c => !c.status || c.status === 'Active' || c.status?.toLowerCase() === 'active')
      .sort((a: any, b: any) => (a.serial ?? Infinity) - (b.serial ?? Infinity))
      .slice(0, 6)
      .map((c, i) => ({
        name: c.name,
        icon: c.icon || '',
        image: c.image,
        slug: c.slug,
        colorScheme: STYLE6_COLOR_SCHEMES[i % STYLE6_COLOR_SCHEMES.length],
        width: (i === 0 || i === 5) ? 'large' as const : 'small' as const,
        hasButton: (i === 0 || i === 5),
      })) || []
  , [categories]);

  if (!processed.length) return null;

  const topRow = processed.slice(0, 3);
  const bottomRow = processed.slice(3, 6);

  const renderCard = (cat: typeof processed[0], index: number) => {
    const iconSrc = cat.image || cat.icon;
    const hasImage = iconSrc && isImageUrl(iconSrc);
    const isLarge = cat.width === 'large';
    const scheme = cat.colorScheme;

    return (
    <button
      key={`${cat.name}-${index}`}
      onClick={() => onCategoryClick(cat.slug || cat.name)}
      className={`group relative overflow-hidden rounded-[32px] h-[300px] sm:h-[400px] flex-shrink-0 transition-all duration-500 ease-out text-left border border-black/5 hover:shadow-2xl hover:shadow-black/10
        ${isLarge ? 'w-full lg:flex-[2]' : 'w-full lg:flex-1'}`}
      style={{ 
        backgroundColor: scheme.bgColor, 
        fontFamily: "'Montserrat', sans-serif" 
      }}
    >
      {/* Background Subtle Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

      {/* Product Image Section */}
      {hasImage && (
        <div className="absolute z-10 pointer-events-none bottom-0 right-[-5%] sm:right-0 w-[65%] sm:w-[60%] max-w-[420px] transition-all duration-700 ease-in-out group-hover:scale-110 group-hover:-rotate-2 group-hover:translate-x-2">
          <img
            src={normalizeImageUrl(iconSrc)}
            alt={cat.name}
            className="w-full h-auto object-contain filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.15)] group-hover:drop-shadow-[0_30px_50px_rgba(0,0,0,0.25)]"
            loading="lazy"
          />
        </div>
      )}

      {/* Content Section */}
      <div className="relative z-20 p-2 sm:p-3 h-full flex flex-col justify-between">
        <div className="space-y-1 sm:space-y-2">
          {/* Top Label */}
          <h3 
            className="font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em] opacity-80" 
            style={{ color: scheme.textColor }}
          >
            {cat.name}
          </h3>
          
          {/* Hero Title */}
          <p 
            className="font-black text-4xl sm:text-5xl md:text-7xl tracking-tighter leading-[0.9] uppercase transition-transform duration-500 group-hover:translate-x-1"
            style={{ color: scheme.titleColor }}
          >
            {cat.name}
          </p>
        </div>

        {/* Action Button */}
        {cat.hasButton && (
          <div className="flex flex-col gap-4">
             {/* Decorative Line */}
             <div className="w-12 h-1 bg-current opacity-20 rounded-full" style={{ color: scheme.buttonColor }}></div>
             
             <span
              className="w-fit flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-full text-white font-black text-[11px] sm:text-xs tracking-widest transition-all duration-300 hover:brightness-110 shadow-xl active:scale-95 group/btn"
              style={{ backgroundColor: scheme.buttonColor }}
            >
              SHOP NOW
              <ArrowRight 
                size={16} 
                className="transition-transform duration-300 group-hover/btn:translate-x-2" 
              />
            </span>
          </div>
        )}
      </div>

      {/* Glossy Reflection Effect */}
      <div className="absolute top-0 -inset-full h-full w-1/2 z-30 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          100% { left: 150%; }
        }
      `}} />
    </button>
  );
  };

  return (
    <div ref={sectionRef} className="py-1 sm:py-2 px-1 md:px-2 flex flex-col items-center">
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <header className="mb-1 sm:mb-2 text-center">
        <h2 className="text-3xl sm:text-5xl md:text-[64px] font-bold text-[#4B4B4B] tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          Product Categories
        </h2>
      </header>
      <div className="max-w-[1360px] w-full flex flex-col gap-1 sm:gap-1.5 items-center">
        {topRow.length > 0 && (
          <div className="flex flex-col lg:flex-row gap-1 sm:gap-1.5 w-full">
            {topRow.map((card, i) => renderCard(card, i))}
          </div>
        )}
        {bottomRow.length > 0 && (
          <div className="flex flex-col lg:flex-row gap-1 sm:gap-1.5 w-full">
            {bottomRow.map((card, i) => renderCard(card, i + 3))}
          </div>
        )}
      </div>
    </div>
  );
});
CategoryStyle6.displayName = 'CategoryStyle6';

// ============================================================================
// Style 7: Gadgets Theme - Figma design with rounded cards, 2-col mobile / 8-col desktop
// ============================================================================
const CategoryStyle7 = memo(({ categories, onCategoryClick, sectionRef }: Omit<Props, 'style'>) => {
  const processed = useMemo(() =>
    categories?.filter(c => !c.status || c.status === 'Active' || c.status?.toLowerCase() === 'active')
      .sort((a: any, b: any) => (a.serial ?? Infinity) - (b.serial ?? Infinity))
      .slice(0, 8)
      .map(c => ({ name: c.name, icon: c.icon || 'grid', image: c.image, slug: c.slug })) || []
  , [categories]);

  if (!processed.length) return null;

  return (
    <div ref={sectionRef}>
      <div className="bg-white max-w-[1340px] w-[92%] mt-0 mx-auto pt-0 pb-[9.75px] px-[11.25px] rounded-[10px] md:bg-transparent md:w-[95%] md:mt-2.5 md:pt-3.5 md:pb-0 md:px-0 md:rounded-none">
        <div className="items-center flex h-[38px] justify-between leading-[38px]">
          <h2 className="text-neutral-900 text-base font-bold leading-[18px] whitespace-nowrap md:text-neutral-700 md:text-[22px] md:font-medium md:leading-[38px]">
            Categories
          </h2>
          <button
            onClick={() => onCategoryClick('__all__')}
            className="text-black text-[13px] font-medium items-center flex leading-[15px] md:text-zinc-800 md:text-base md:leading-[38px] hover:text-lime-500 transition-colors"
          >
            View All
            <ChevronRight size={20} className="ml-0 md:ml-2" />
          </button>
        </div>
        <div className="gap-x-[9px] grid grid-cols-[repeat(2,1fr)] gap-y-[9px] md:gap-x-[15px] md:grid-cols-[repeat(8,1fr)] md:gap-y-[15px]">
          {processed.map((cat, idx) => {
            const iconSrc = cat.image || cat.icon;
            const hasImage = iconSrc && isImageUrl(iconSrc);
            return (
              <div key={`${cat.name}-${idx}`} className="block">
                <button
                  onClick={() => onCategoryClick(cat.slug || cat.name)}
                  className="w-full items-center flex flex-col h-[96.25px] justify-center border border-neutral-200 pt-1.5 rounded-[10px] border-solid cursor-pointer md:h-full md:pt-4 hover:shadow-[rgba(0,0,0,0.1)_1px_5px_10px_0px] hover:border-zinc-500/60 transition-shadow"
                >
                  <div className="bg-white h-[45px] w-[45px] overflow-hidden mx-auto rounded-md md:h-20 md:w-20 md:rounded-[5px]">
                    {hasImage ? (
                      <img
                        alt={cat.name}
                        src={normalizeImageUrl(iconSrc)}
                        className="inline-block h-full object-contain w-full"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                        <Grid size={24} />
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-neutral-900 text-[13px] font-medium flow-root h-auto leading-[15px] overflow-hidden mx-0 my-1.5 px-[9px] md:text-black md:text-sm md:block md:h-[37px] md:leading-[18px] md:mt-2 md:mb-0 md:mx-3 md:px-0">
                      {cat.name}
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
CategoryStyle7.displayName = 'CategoryStyle7';

// ============================================================================
// Main Component with Style Switch
// ============================================================================
export const CategoriesSection = memo(({ categories, onCategoryClick, sectionRef, categoryScrollRef, style }: Props) => {
  const ref = categoryScrollRef || sectionRef;
  const styleNum = style || 'style1';

  switch (styleNum) {
    case 'style2':
      return <CategoryStyle2 categories={categories} onCategoryClick={onCategoryClick} sectionRef={ref} />;
    case 'style3':
      return <CategoryStyle3 categories={categories} onCategoryClick={onCategoryClick} sectionRef={ref} />;
    case 'style4':
      return <CategoryStyle4 categories={categories} onCategoryClick={onCategoryClick} sectionRef={ref} />;
    case 'style5':
      return <CategoryStyle5 categories={categories} onCategoryClick={onCategoryClick} sectionRef={ref} />;
    case 'style6':
      return <CategoryStyle6 categories={categories} onCategoryClick={onCategoryClick} sectionRef={ref} />;
    case 'style7':
      return <CategoryStyle7 categories={categories} onCategoryClick={onCategoryClick} sectionRef={ref} />;
    case 'none':
      return null;
    case 'style1':
    default:
      return <CategoryStyle1 categories={categories} onCategoryClick={onCategoryClick} sectionRef={ref} />;
  }
});

CategoriesSection.displayName = 'CategoriesSection';
export default CategoriesSection;
