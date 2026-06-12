import React, { Suspense, lazy } from 'react';
import type { Product, ProductVariantSelection } from '../../types';
import { ProductGridSkeleton } from './skeletons';

const ProductGridSection = lazy(() => import('./ProductGridSection').then(m => ({ default: m.ProductGridSection })));
const LazySection = lazy(() => import('./LazySection').then(m => ({ default: m.LazySection })));
const TagCountdownTimer = lazy(() => import('./TagCountdownTimer').then(m => ({ default: m.TagCountdownTimer })));

interface Tag {
  id?: number | string;
  name: string;
  status?: string;
  showCountdown?: boolean;
  expiresAt?: string;
}

interface TagProductSectionsProps {
  tags?: Tag[];
  activeProducts: Product[];
  onProductClick: (p: Product) => void;
  onBuyNow: (p: Product) => void;
  onQuickView: (p: Product | null) => void;
  onAddToCart: (p: Product) => void;
  wishlist: number[];
  onToggleWishlist: (id: number) => void;
  productCardStyle?: string;
  productSectionStyle?: string;
}

const ACCENT_COLORS = ['purple', 'orange', 'blue', 'green', 'purple'] as const;

export const TagProductSections: React.FC<TagProductSectionsProps> = ({
  tags,
  activeProducts,
  onProductClick,
  onBuyNow,
  onQuickView,
  onAddToCart,
  wishlist,
  onToggleWishlist,
  productCardStyle,
  productSectionStyle,
}) => {
  if (!tags) return null;

  return (
    <>
      {tags
        .filter(t => !t.status || t.status === 'Active' || t.status?.toLowerCase() === 'active')
        .map((tag, idx) => {
          const tagProducts = activeProducts.filter(p =>
            Array.isArray(p.tags) && p.tags.some((pt: any) =>
              (typeof pt === 'string' ? pt : pt?.name)?.toLowerCase() === tag.name?.toLowerCase()
            )
          );
          if (!tagProducts.length) return null;

          return (
            <Suspense key={tag.id || tag.name} fallback={<ProductGridSkeleton count={10} />}>
              <LazySection fallback={<ProductGridSkeleton count={10} />} rootMargin="0px 0px 300px" minHeight="400px">
                <ProductGridSection
                  title={tag.name}
                  titleExtra={tag.showCountdown && tag.expiresAt && new Date(tag.expiresAt).getTime() > Date.now() ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-semibold" style={{ color: 'rgb(var(--color-secondary-rgb, 236 72 153))' }}>Ends in</span>
                      <Suspense fallback={<span className="text-xs text-gray-400">...</span>}>
                        <TagCountdownTimer expiresAt={tag.expiresAt} tagName={tag.name} />
                      </Suspense>
                    </div>
                  ) : undefined}
                  products={tagProducts}
                  accentColor={ACCENT_COLORS[idx % ACCENT_COLORS.length] as 'purple' | 'orange' | 'blue' | 'green'}
                  keyPrefix={`tag-${tag.name}`}
                  maxProducts={10}
                  reverseOrder={false}
                  onProductClick={onProductClick}
                  onBuyNow={onBuyNow}
                  onQuickView={onQuickView}
                  onAddToCart={onAddToCart}
                  wishlist={wishlist}
                  onToggleWishlist={onToggleWishlist}
                  productCardStyle={productCardStyle}
                  productSectionStyle={productSectionStyle}
                />
              </LazySection>
            </Suspense>
          );
        })}
    </>
  );
};
