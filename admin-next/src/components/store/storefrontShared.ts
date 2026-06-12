/**
 * Shared storefront utilities, hooks, and components used across all theme variants.
 * Extracted to reduce duplication and enable better tree-shaking.
 */

import React, { memo, useMemo, useRef, useCallback } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '../../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const slugify = (s: string) =>
  s?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || '';

export const calcDiscount = (price: number, sale: number) =>
  Math.round(((price - sale) / price) * 100);

// ─── StarRating ───────────────────────────────────────────────────────────────
export const StarRating = memo(({ rating, color, size = 12 }: { rating: number; color?: string; size?: number }) => {
  const stars = Array.from({ length: 5 });
  return React.createElement('div', { className: 'flex items-center gap-0.5' },
    stars.map((_, i) =>
      React.createElement(Star, {
        key: i,
        size,
        className: i < Math.floor(rating) ? 'fill-current' : 'text-gray-300 fill-gray-300',
        style: i < Math.floor(rating) ? { color: color || '#f59e0b' } : {},
      })
    )
  );
});
StarRating.displayName = 'StarRating';

// ─── Hooks ────────────────────────────────────────────────────────────────────
export const useActiveProducts = (products: Product[]) =>
  useMemo(() => products.filter(p => p.status === 'Active' || !p.status), [products]);

export const useProductSections = (active: Product[]) => ({
  newArrivals: useMemo(() => active.slice(0, 10), [active]),
  topRated: useMemo(() => [...active].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 10), [active]),
  bestSelling: useMemo(() => [...active].sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0)).slice(0, 10), [active]),
  dealProduct: useMemo(() =>
    [...active].sort((a, b) => {
      const dA = a.price && a.salePrice ? calcDiscount(a.price, a.salePrice) : 0;
      const dB = b.price && b.salePrice ? calcDiscount(b.price, b.salePrice) : 0;
      return dB - dA;
    })[0] || active[0],
  [active]),
  trending: useMemo(() => [...active].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 8), [active]),
});
