import React, { memo, useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { WebsiteConfig } from '../../../types';
import { normalizeImageUrl } from '../../../utils/imageUrlHelper';
import { G } from './constants';

export const GadgetHero = memo(({ websiteConfig }: { websiteConfig?: WebsiteConfig }) => {
  const items = (websiteConfig?.carouselItems || [])
    .filter(i => String(i.status ?? '').trim().toLowerCase() === 'publish')
    .sort((a, b) => Number(a.serial ?? 0) - Number(b.serial ?? 0));
  const [current, setCurrent] = useState(0);
  const total = items.length;

  useEffect(() => {
    if (total <= 1) return;
    const t = setInterval(() => setCurrent(p => (p + 1) % total), 4000);
    return () => clearInterval(t);
  }, [total]);

  const goPrev = useCallback(() => setCurrent(p => (p - 1 + total) % total), [total]);
  const goNext = useCallback(() => setCurrent(p => (p + 1) % total), [total]);

  if (!total) return null;

  const item = items[current];
  const heroImg = item?.image || item?.imageUrl;

  return (
    <div className="flex-col h-[118px] max-w-[1340px] w-[92%] mt-1 mb-1 mx-auto md:flex-row md:h-[345px] md:w-full md:mb-0">
      <div className="relative bg-neutral-200 h-[118px] w-full overflow-hidden m-auto rounded-lg md:h-[345px] md:rounded-none">
        {/* Slides */}
        <div className="flex h-full transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${current * 100}%)` }}>
          {items.map((itm: any, i: number) => {
            const imgSrc = itm?.image || itm?.imageUrl;
            return (
              <div key={i} className="h-full min-w-full w-full rounded-lg md:rounded-none flex-shrink-0">
                {imgSrc ? (
                  <img alt={itm?.title || `Slide ${i + 1}`} src={normalizeImageUrl(imgSrc)} className="block h-full object-cover w-full rounded-lg md:rounded-none" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-lime-100 to-lime-200 flex items-center justify-center">
                    <span className="text-lime-700 text-xl font-bold">{itm?.title || 'Sale'}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Nav Arrows (desktop only) */}
        {total > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute text-white bg-gray-100 block h-[35px] opacity-0 invisible text-center w-[35px] z-[100] rounded-[50%] left-5 top-1/2 -translate-y-1/2 md:opacity-100 md:visible hover:bg-lime-500 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={goNext}
              className="absolute text-white bg-gray-100 block h-[35px] opacity-0 invisible text-center w-[35px] z-[100] rounded-[50%] right-5 top-1/2 -translate-y-1/2 md:opacity-100 md:visible hover:bg-lime-500 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Dots */}
        {total > 1 && (
          <div className="absolute flex gap-x-2.5 gap-y-2.5 -translate-x-1/2 left-1/2 bottom-[15px]">
            {items.map((_: any, i: number) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="block h-2 w-2 rounded-[50%] md:h-2.5 md:w-2.5 transition-colors"
                style={{ backgroundColor: i === current ? G.accent : 'rgba(255,255,255,0.4)' }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
GadgetHero.displayName = 'GadgetHero';
