import { memo, useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { Hash, ChevronRight, ChevronLeft } from 'lucide-react';

interface Tag {
  id?: string;
  name: string;
  status?: string;
  color?: string;
}

interface Props {
  tags: Tag[];
  onTagClick: (tagName: string) => void;
  style?: 'style1' | 'style2' | 'style3';
}

// Style 1: Pill Tags - Horizontal scrolling pills
const TagStyle1 = memo(({ tags, onTagClick }: Omit<Props, 'style'>) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll, tags]);

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = dir === 'left' ? -200 : 200;
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const activeTags = useMemo(() => 
    tags?.filter(t => !t.status || t.status === 'Active' || t.status?.toLowerCase() === 'active')
      .sort((a: any, b: any) => (a.serial ?? Infinity) - (b.serial ?? Infinity)) || []
  , [tags]);

  if (!activeTags.length) return null;

  return (
    <div className="py-1.5 sm:py-3">
      <div className="flex items-center justify-between mb-1.5 sm:mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Hash size={14} className="text-white" strokeWidth={2.5} />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-gray-800">Popular Tags</h2>
        </div>
        <div className="flex items-center gap-1">
          {canScrollLeft && (
            <button onClick={() => scroll('left')} className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition">
              <ChevronLeft size={16} />
            </button>
          )}
          {canScrollRight && (
            <button onClick={() => scroll('right')} className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition">
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
      <div ref={scrollRef} onScroll={checkScroll} className="flex gap-2 overflow-x-auto scrollbar-hide pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {activeTags.map((tag, i) => (
          <button key={tag.id || i} onClick={() => onTagClick(tag.name)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 text-purple-700 hover:from-purple-100 hover:to-pink-100 hover:border-purple-200 hover:shadow-sm active:scale-[0.98] transition-all duration-200 group">
            <Hash size={12} className="text-purple-500 group-hover:text-purple-600" />
            <span className="text-xs sm:text-sm font-medium whitespace-nowrap">{tag.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
});
TagStyle1.displayName = 'TagStyle1';

// Style 2: Compact Cloud - Tag cloud layout
const TagStyle2 = memo(({ tags, onTagClick }: Omit<Props, 'style'>) => {
  const activeTags = useMemo(() => 
    tags?.filter(t => !t.status || t.status === 'Active' || t.status?.toLowerCase() === 'active')
      .sort((a: any, b: any) => (a.serial ?? Infinity) - (b.serial ?? Infinity))?.slice(0, 20) || []
  , [tags]);

  if (!activeTags.length) return null;

  const colors = ['from-purple-500 to-pink-500', 'from-blue-500 to-cyan-500', 'from-green-500 to-emerald-500', 'from-orange-500 to-amber-500', 'from-rose-500 to-red-500'];

  return (
    <div className="py-1.5 sm:py-3">
      <div className="flex items-center gap-2 mb-1.5 sm:mb-3">
        <Hash size={16} className="text-purple-600" />
        <h2 className="text-sm sm:text-base font-semibold text-gray-700">Browse by Tags</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {activeTags.map((tag, i) => (
          <button key={tag.id || i} onClick={() => onTagClick(tag.name)}
            className="group relative px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg bg-white border border-gray-200 hover:border-transparent hover:shadow-md transition-all duration-200 overflow-hidden">
            <span className={`absolute inset-0 bg-gradient-to-r ${colors[i % colors.length]} opacity-0 group-hover:opacity-100 transition-opacity`} />
            <span className="relative flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-700 group-hover:text-white transition-colors">
              <Hash size={10} className="opacity-60" />
              {tag.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
});
TagStyle2.displayName = 'TagStyle2';

// Style 3: Minimal Inline - Simple inline text tags
const TagStyle3 = memo(({ tags, onTagClick }: Omit<Props, 'style'>) => {
  const activeTags = useMemo(() => 
    tags?.filter(t => !t.status || t.status === 'Active' || t.status?.toLowerCase() === 'active')
      .sort((a: any, b: any) => (a.serial ?? Infinity) - (b.serial ?? Infinity))?.slice(0, 15) || []
  , [tags]);

  if (!activeTags.length) return null;

  return (
    <div className="py-1 sm:py-2 flex items-center gap-2 flex-wrap">
      <span className="text-xs sm:text-sm text-gray-500 font-medium">Popular:</span>
      {activeTags.map((tag, i) => (
        <button key={tag.id || i} onClick={() => onTagClick(tag.name)}
          className="text-xs sm:text-sm text-purple-600 hover:text-purple-800 hover:underline underline-offset-2 transition-colors">
          #{tag.name}
        </button>
      ))}
    </div>
  );
});
TagStyle3.displayName = 'TagStyle3';

export const TagsSection = memo(({ tags, onTagClick, style = 'style1' }: Props) => {
  const StyleComponent = style === 'style1' ? TagStyle1 : style === 'style2' ? TagStyle2 : TagStyle3;
  return <StyleComponent tags={tags} onTagClick={onTagClick} />;
});
TagsSection.displayName = 'TagsSection';
