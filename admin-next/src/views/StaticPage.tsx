import React, { Suspense, lazy } from 'react';
import type { Product, User, WebsiteConfig, Order, ProductVariantSelection } from '../types';
import { StoreHeader } from '../components/StoreHeader';

// Lazy load components
const StoreFooter = lazy(() => import('../components/store/StoreFooter').then(m => ({ default: m.StoreFooter })));
const StaticPageContent = lazy(() => import('../components/store/StaticPageContent').then(m => ({ default: m.StaticPageContent })));

interface StaticPageProps {
  products?: Product[];
  orders?: Order[];
  user?: User | null;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  onProfileClick?: () => void;
  logo?: string | null;
  websiteConfig?: WebsiteConfig;
  tenantId?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onOpenChat?: () => void;
  onProductClick?: (product: Product) => void;
  wishlistCount?: number;
  wishlist?: number[];
  onToggleWishlist?: (id: number) => void;
  cart?: number[];
  onToggleCart?: (id: number) => void;
  onCheckoutFromCart?: (productId: number) => void;
  categories?: any[];
  subCategories?: any[];
  childCategories?: any[];
  brands?: any[];
  tags?: any[];
}

const StaticPage: React.FC<StaticPageProps> = ({
  products = [],
  orders = [],
  user,
  onLoginClick,
  onLogoutClick,
  onProfileClick,
  logo,
  websiteConfig,
  tenantId,
  searchValue = '',
  onSearchChange,
  onOpenChat,
  onProductClick,
  wishlistCount = 0,
  wishlist = [],
  onToggleWishlist,
  cart = [],
  onToggleCart,
  onCheckoutFromCart,
  categories = [],
  subCategories = [],
  childCategories = [],
  brands = [],
  tags = [],
}) => {
  return (
    <div className="min-h-screen font-sans text-slate-900 bg-[#F3F9FF]">
      <StoreHeader
        productCatalog={products}
        wishlistCount={wishlistCount}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        cart={cart}
        onToggleCart={onToggleCart}
        onCheckoutFromCart={onCheckoutFromCart}
        user={user}
        onLoginClick={onLoginClick}
        onLogoutClick={onLogoutClick}
        onProfileClick={onProfileClick}
        logo={logo}
        websiteConfig={websiteConfig}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        onProductClick={onProductClick}
        categories={categories}
        subCategories={subCategories}
        childCategories={childCategories}
        brands={brands}
        tags={tags}
      />
      
      <Suspense fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-theme-primary border-t-transparent rounded-full" />
        </div>
      }>
        <StaticPageContent websiteConfig={websiteConfig} />
      </Suspense>
      
      <Suspense fallback={<div className="h-64 bg-gray-100" />}>
        <StoreFooter websiteConfig={websiteConfig} logo={logo} tenantId={tenantId} onOpenChat={onOpenChat} />
      </Suspense>
    </div>
  );
};

export default StaticPage;
