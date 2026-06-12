import React, { memo, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { WebsiteConfig } from '../../../types';
import { normalizeImageUrl } from '../../../utils/imageUrlHelper';
import { DARK, LIGHT_GREEN } from './constants';

export const HeroBanner = memo(({ websiteConfig, categories, onCategoryClick }: {
  websiteConfig?: WebsiteConfig;
  categories: any[];
  onCategoryClick?: (slug: string) => void;
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselItems = websiteConfig?.carouselItems || [];
  const currentItem = carouselItems[currentSlide] || null;

  useEffect(() => {
    if (carouselItems.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % carouselItems.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [carouselItems.length]);

  const heroImage = currentItem?.imageUrl || currentItem?.image || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80';

  return (
    <div className="relative">
      {/* Hero Banner */}
      <div className="relative overflow-hidden" style={{ backgroundColor: DARK }}>
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center min-h-[300px] md:min-h-[420px]">
          <div className="relative z-10 px-6 md:px-12 py-10 md:py-0 flex-1 max-w-xl">
            <h1 className="text-white text-3xl md:text-4xl lg:text-5xl leading-tight mb-6" style={{ fontFamily: "'Lato', sans-serif", textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
              {currentItem?.title || 'Discover the Latest Deals –'}{' '}
              <span className="font-bold italic">{currentItem?.subtitle || 'Up to 50% Off!'}</span>
            </h1>
            <a href="#" className="inline-flex items-center justify-center px-8 py-3 rounded-full font-bold text-base transition-colors hover:opacity-90" style={{ backgroundColor: LIGHT_GREEN, color: DARK }}>
              Shop Now
            </a>
          </div>
          <div className="flex-1 relative w-full md:w-auto">
            <img src={normalizeImageUrl(heroImage)} alt="Hero" className="w-full h-[250px] md:h-[420px] object-cover" loading="eager" />
          </div>
        </div>

        {carouselItems.length > 1 && (
          <>
            <button onClick={() => setCurrentSlide(p => (p - 1 + carouselItems.length) % carouselItems.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors">
              <ChevronLeft size={24} className="text-white" />
            </button>
            <button onClick={() => setCurrentSlide(p => (p + 1) % carouselItems.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors">
              <ChevronRight size={24} className="text-white" />
            </button>
          </>
        )}

        {/* Dots */}
        {carouselItems.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {carouselItems.map((_: any, i: number) => (
              <button key={i} onClick={() => setCurrentSlide(i)} className={`w-2.5 h-2.5 rounded-full transition-colors ${i === currentSlide ? 'bg-white' : 'bg-white/40'}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
HeroBanner.displayName = 'HeroBanner';
