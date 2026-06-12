import React, { memo } from 'react';
import { ChevronRight } from 'lucide-react';
import type { Product } from '../../../types';
import { GadgetTimeCounter } from './GadgetTimeCounter';
import { GadgetProductCard } from './GadgetProductCard';

export const GadgetProductSection = memo(({ title, products, expiresAt, onProductClick, onAddToCart, onBuyNow }: {
  title: string;
  products: Product[];
  expiresAt?: string;
  onProductClick: (p: Product) => void;
  onAddToCart?: (p: Product) => void;
  onBuyNow?: (p: Product) => void;
}) => {
  if (!products.length) return null;
  const showTimer = !!expiresAt && new Date(expiresAt).getTime() > Date.now();

  return (
    <div>
      <div className="items-center flex-col max-w-[1340px] w-full mx-0 px-[10px] md:flex-row md:w-[95%] md:mx-auto md:px-0">
        <div className="items-center flex justify-between mt-2.5 mb-2">
          <div className="items-center gap-x-[5px] flex flex-col justify-center gap-y-[5px] md:gap-x-2 md:flex-row md:gap-y-2">
            <h2 className="text-neutral-900 text-base font-bold leading-[18px] md:text-neutral-700 md:text-[22px] md:font-medium md:leading-[normal] whitespace-nowrap">
              {title}
            </h2>
            {showTimer && <GadgetTimeCounter expiresAt={expiresAt} />}
          </div>
          <a href="/all-products" className="text-black text-[13px] font-medium items-center flex leading-[15px] md:text-zinc-800 md:text-base cursor-pointer hover:text-lime-500">
            View All
            <ChevronRight size={20} className="ml-0 md:ml-2" />
          </a>
        </div>
        <div className="gap-x-[6px] grid grid-cols-[repeat(2,1fr)] gap-y-[6px] mb-3 md:gap-x-[10px] md:grid-cols-[repeat(5,1fr)] md:gap-y-[10px] md:mb-4">
          {products.map((product) => (
            <GadgetProductCard
              key={product.id}
              product={product}
              onClick={() => onProductClick(product)}
              onAddToCart={() => onAddToCart?.(product)}
              onBuyNow={() => onBuyNow?.(product)}
            />
          ))}
        </div>
      </div>
    </div>
  );
});
GadgetProductSection.displayName = 'GadgetProductSection';
