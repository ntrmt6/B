import React from 'react';
import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Product } from '../../types';
import { ProductCard } from '../StoreProductComponents';
import { SectionHeader } from '../StoreComponents';
import { getViewportWidth } from '../../utils/viewportHelpers';
import { ShoppingBag, Flame, TrendingUp, Package, Star } from 'lucide-react';

interface Props { 
  title: string; 
  titleExtra?: React.ReactNode;
  products: Product[]; 
  accentColor?: 'green' | 'purple' | 'orange' | 'blue'; 
  onProductClick: (p: Product) => void; 
  onBuyNow?: (p: Product) => void; 
  onQuickView?: (p: Product) => void; 
  onAddToCart?: (p: Product) => void; 
  // wishlist state/handler passed down to cards
  wishlist?: number[];
  onToggleWishlist?: (id: number) => void;
  productCardStyle?: string; 
  productSectionStyle?: string;
  keyPrefix: string; 
  maxProducts?: number; 
  reverseOrder?: boolean; 
  showSoldCount?: boolean;
}

const colors = { 
  green: 'bg-green-500', 
  purple: 'bg-purple-500', 
  orange: 'bg-orange-500', 
  blue: 'bg-blue-500' 
};

const icons = {
  green: <ShoppingBag size={18} className="text-white" />,
  purple: <TrendingUp size={18} className="text-white" />,
  orange: <Flame size={18} className="text-white" />,
  blue: <Package size={18} className="text-white" />,
};

// Style 1: Classic Clean Grid
const ProductSectionStyle1 = memo(({ title, titleExtra, products, accentColor = 'green', onProductClick, onBuyNow, onQuickView, onAddToCart, wishlist, onToggleWishlist, productCardStyle, keyPrefix, showSoldCount }: Omit<Props, 'productSectionStyle' | 'maxProducts' | 'reverseOrder'> & { products: Product[] }) => {
  return (
    <section className="pt-0.5 pb-0.5">
      <div className="bg-white rounded-lg p-1 md:p-1 mb-0.5 flex items-center gap-1">
        <div className={`h-5 w-1 rounded-full ${colors[accentColor]}`}/>
        <SectionHeader title={title} className="text-base md:text-lg font-bold text-gray-900"/>
        {titleExtra && <div className="ml-1">{titleExtra}</div>}
      </div>
      <div className="grid grid-cols-2 gap-1 sm:gap-1 md:gap-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {products.map((p, idx) => <ProductCard key={`${keyPrefix}-${p.id}-${idx}`} product={p} onClick={onProductClick} onBuyNow={onBuyNow} variant={productCardStyle} onQuickView={onQuickView} onAddToCart={onAddToCart} wishlist={wishlist} onToggleWishlist={onToggleWishlist} showSoldCount={showSoldCount}/>)}
      </div>
    </section>
  );
});
ProductSectionStyle1.displayName = 'ProductSectionStyle1';

// Style 2: Bordered Cards with Icon Header
const ProductSectionStyle2 = memo(({ title, titleExtra, products, accentColor = 'green', onProductClick, onBuyNow, onQuickView, onAddToCart, wishlist, onToggleWishlist, productCardStyle, keyPrefix, showSoldCount }: Omit<Props, 'productSectionStyle' | 'maxProducts' | 'reverseOrder'> & { products: Product[] }) => {
  return (
    <section className="pt-0.5 pb-0.5">
      <div className="flex items-center gap-1 mb-0.5 px-0.5">
        <div className={`p-1 rounded-xl ${colors[accentColor]}`}>
          {icons[accentColor]}
        </div>
        <div>
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">{title}</h2>
          <p className="text-[10px] sm:text-xs text-gray-500">{products.length} products available</p>
        </div>
        {titleExtra && <div className="ml-1">{titleExtra}</div>}
      </div>
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-0.5 sm:p-0.5 md:p-1">
        <div className="grid grid-cols-2 gap-1 sm:gap-1 md:gap-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {products.map((p, idx) => <ProductCard key={`${keyPrefix}-${p.id}-${idx}`} product={p} onClick={onProductClick} onBuyNow={onBuyNow} variant={productCardStyle} onQuickView={onQuickView} onAddToCart={onAddToCart} wishlist={wishlist} onToggleWishlist={onToggleWishlist} showSoldCount={showSoldCount}/>)}
        </div>
      </div>
    </section>
  );
});
ProductSectionStyle2.displayName = 'ProductSectionStyle2';

// Style 3: Gradient Header with Shadow Cards
const ProductSectionStyle3 = memo(({ title, titleExtra, products, accentColor = 'green', onProductClick, onBuyNow, onQuickView, onAddToCart, wishlist, onToggleWishlist, productCardStyle, keyPrefix, showSoldCount }: Omit<Props, 'productSectionStyle' | 'maxProducts' | 'reverseOrder'> & { products: Product[] }) => {
  return (
    <section className="pt-0.5 pb-0.5">
      <div className="bg-gradient-theme-br rounded-t-xl sm:rounded-t-2xl p-1 sm:p-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-1">
            <Star className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="white" />
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-white">{title}</h2>
            {titleExtra && <div className="ml-1">{titleExtra}</div>}
          </div>
          <span className="text-[10px] sm:text-xs text-white/80 bg-white/20 px-1.5 sm:px-2 py-0.5 rounded-full">{products.length} items</span>
        </div>
      </div>
      <div className="bg-gray-50 rounded-b-xl sm:rounded-b-2xl p-0.5 sm:p-0.5 md:p-1 border border-t-0 border-gray-200">
        <div className="grid grid-cols-2 gap-1 sm:gap-1 md:gap-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {products.map((p, idx) => <ProductCard key={`${keyPrefix}-${p.id}-${idx}`} product={p} onClick={onProductClick} onBuyNow={onBuyNow} variant={productCardStyle} onQuickView={onQuickView} onAddToCart={onAddToCart} wishlist={wishlist} onToggleWishlist={onToggleWishlist} showSoldCount={showSoldCount}/>)}
        </div>
      </div>
    </section>
  );
});
ProductSectionStyle3.displayName = 'ProductSectionStyle3';

// Style 4: Minimal with Underline
const ProductSectionStyle4 = memo(({ title, titleExtra, products, accentColor = 'green', onProductClick, onBuyNow, onQuickView, onAddToCart, wishlist, onToggleWishlist, productCardStyle, keyPrefix, showSoldCount }: Omit<Props, 'productSectionStyle' | 'maxProducts' | 'reverseOrder'> & { products: Product[] }) => {
  return (
    <section className="pt-1 pb-1">
      <div className="flex items-center justify-between mb-0.5 pb-0.5 sm:mb-1 sm:pb-0.5 border-b-2 border-gray-100">
        <div className="relative flex items-center gap-1 sm:gap-1">
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">{title}</h2>
          {titleExtra}
          <div className={`absolute -bottom-3 left-0 h-0.5 w-16 rounded-full ${colors[accentColor]}`} />
        </div>
        <span className="text-sm text-gray-500">{products.length} products</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:gap-2 lg:gap-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {products.map((p, idx) => <ProductCard key={`${keyPrefix}-${p.id}-${idx}`} product={p} onClick={onProductClick} onBuyNow={onBuyNow} variant={productCardStyle} onQuickView={onQuickView} onAddToCart={onAddToCart} wishlist={wishlist} onToggleWishlist={onToggleWishlist} showSoldCount={showSoldCount}/>)}
      </div>
    </section>
  );
});
ProductSectionStyle4.displayName = 'ProductSectionStyle4';

// Style 5: Card Container with Badge
const ProductSectionStyle5 = memo(({ title, titleExtra, products, accentColor = 'green', onProductClick, onBuyNow, onQuickView, onAddToCart, wishlist, onToggleWishlist, productCardStyle, keyPrefix, showSoldCount }: Omit<Props, 'productSectionStyle' | 'maxProducts' | 'reverseOrder'> & { products: Product[] }) => {
  return (
    <section className="pt-1 pb-1">
      <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-theme-r" />
        <div className="p-1 sm:p-1 md:p-1.5 pb-0.5 sm:pb-0.5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-1">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${colors[accentColor]} flex items-center justify-center`}>
              {icons[accentColor]}
            </div>
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">{title}</h2>
            {titleExtra && <div className="ml-1">{titleExtra}</div>}
          </div>
          <div className="px-1.5 py-0.5 bg-gray-100 rounded-full">
            <span className="text-xs font-medium text-gray-600">{products.length} items</span>
          </div>
        </div>
        <div className="p-0.5 sm:p-0.5 md:p-1">
          <div className="grid grid-cols-2 gap-2 sm:gap-2 lg:gap-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {products.map((p, idx) => <ProductCard key={`${keyPrefix}-${p.id}-${idx}`} product={p} onClick={onProductClick} onBuyNow={onBuyNow} variant={productCardStyle} onQuickView={onQuickView} onAddToCart={onAddToCart} wishlist={wishlist} onToggleWishlist={onToggleWishlist} showSoldCount={showSoldCount}/>)}
          </div>
        </div>
      </div>
    </section>
  );
});
ProductSectionStyle5.displayName = 'ProductSectionStyle5';

// Main Component
export const ProductGridSection = ({ title, titleExtra, products, accentColor = 'green', onProductClick, onBuyNow, onQuickView, onAddToCart, wishlist, onToggleWishlist, productCardStyle, productSectionStyle = '1', keyPrefix, maxProducts = 10, reverseOrder = false, showSoldCount }: Props) => {
  const display = reverseOrder ? products.slice().reverse().slice(0, maxProducts) : products.slice(0, maxProducts);
  
  const initCount = useCallback(() => {
    const t = display.length;
    if (typeof window === 'undefined') return Math.min(8, t);
    const w = getViewportWidth();
    if (w >= 1536) return Math.min(18, t);
    if (w >= 1280) return Math.min(15, t);
    if (w >= 768) return Math.min(12, t);
    return Math.min(8, t);
  }, [display.length]);

  const [visible, setVisible] = useState(initCount);
  useEffect(() => { setVisible(initCount()); }, [initCount]);
  useEffect(() => {
    if (typeof window === 'undefined' || visible >= display.length) return;
    // Use requestIdleCallback when available for smoother progressive loading
    if (typeof requestIdleCallback === 'function') {
      const id = requestIdleCallback(() => setVisible(display.length), { timeout: 300 });
      return () => { if (typeof cancelIdleCallback === 'function') cancelIdleCallback(id); };
    }
    const t = setTimeout(() => setVisible(display.length), 120);
    return () => clearTimeout(t);
  }, [display.length, visible]);

  const visibleProducts = display.slice(0, visible);
  const commonProps = { title, titleExtra, products: visibleProducts, accentColor, onProductClick, onBuyNow, onQuickView, onAddToCart, wishlist, onToggleWishlist, productCardStyle, keyPrefix, showSoldCount };

  switch (productSectionStyle) {
    case '2': return <ProductSectionStyle2 {...commonProps} />;
    case '3': return <ProductSectionStyle3 {...commonProps} />;
    case '4': return <ProductSectionStyle4 {...commonProps} />;
    case '5': return <ProductSectionStyle5 {...commonProps} />;
    default: return <ProductSectionStyle1 {...commonProps} />;
  }
};

export default ProductGridSection;
