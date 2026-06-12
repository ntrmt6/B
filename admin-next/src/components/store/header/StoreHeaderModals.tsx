import React, { Suspense, lazy } from 'react';
import dynamic from 'next/dynamic';
import type { Product } from '../../../types';
import type { CatalogGroup, HeaderSearchProps } from './headerTypes';
import { DynamicLoadingFallback } from '../skeletons/DynamicLoadingFallback';

const CartModal = dynamic(() => import('./CartModal'), {
  ssr: false,
  loading: () => <DynamicLoadingFallback variant="cart-drawer" />,
});
const Wishlist = lazy(() => import('./Wishlist'));
const MobileMenu = lazy(() => import('./MobileMenu'));
const MobileSearchModal = lazy(() => import('./MobileSearchModal'));

interface StoreHeaderModalsProps {
  onCartToggle: (productId: number) => void;
  onWishlistToggle: (productId: number) => void;
  catalogSource: Product[];
  cartItems: number[];
  wishlistItems: number[];
  isWishlistDrawerOpen: boolean;
  onWishlistClose: () => void;
  onProductClick?: (product: Product) => void;
  onAddToCart?: (id: number) => void;
  isCartDrawerOpen: boolean;
  onCartClose: () => void;
  onCheckoutFromCart: (productId: number) => void;
  isMobileMenuOpen: boolean;
  onMobileMenuClose: () => void;
  isMobileSearchOpen: boolean;
  onMobileSearchClose: () => void;
  searchProps: HeaderSearchProps;
  logo?: string | null;
  logoKey: string;
  catalogGroups: CatalogGroup[];
  activeCatalogSection: string;
  isCatalogDropdownOpen: boolean;
  onCatalogDropdownToggle: () => void;
  onCatalogSectionToggle: (key: string) => void;
  onCatalogItemClick: (item: string) => void;
  onTrackOrder?: () => void;
}

export const StoreHeaderModals: React.FC<StoreHeaderModalsProps> = ({
  onCartToggle,
  onWishlistToggle,
  catalogSource,
  cartItems,
  wishlistItems,
  isWishlistDrawerOpen,
  onWishlistClose,
  onProductClick,
  onAddToCart,
  isCartDrawerOpen,
  onCartClose,
  onCheckoutFromCart,
  isMobileMenuOpen,
  onMobileMenuClose,
  isMobileSearchOpen,
  onMobileSearchClose,
  searchProps,
  logo,
  logoKey,
  catalogGroups,
  activeCatalogSection,
  isCatalogDropdownOpen,
  onCatalogDropdownToggle,
  onCatalogSectionToggle,
  onCatalogItemClick,
  onTrackOrder
}) => (
  <>
    {isWishlistDrawerOpen && (
      <Suspense fallback={null}>
        <Wishlist
          isOpen={isWishlistDrawerOpen}
          onClose={onWishlistClose}
          wishlistItems={wishlistItems}
          catalogSource={catalogSource}
          onRemoveFromWishlist={onWishlistToggle}
          onAddToCart={onAddToCart}
          onProductClick={onProductClick}
        />
      </Suspense>
    )}

    {isCartDrawerOpen && (
        <CartModal
          isOpen={isCartDrawerOpen}
          onClose={onCartClose}
          cartItems={cartItems}
          catalogSource={catalogSource}
          onToggleCart={onCartToggle}
          onCheckout={onCheckoutFromCart}
        />
    )}

    {isMobileMenuOpen && (
      <Suspense fallback={null}>
        <MobileMenu
          isOpen={isMobileMenuOpen}
          onClose={onMobileMenuClose}
          logo={logo}
          logoKey={logoKey}
          catalogGroups={catalogGroups}
          activeCatalogSection={activeCatalogSection}
          isCatalogDropdownOpen={isCatalogDropdownOpen}
          onCatalogDropdownToggle={onCatalogDropdownToggle}
          onCatalogSectionToggle={onCatalogSectionToggle}
          onCatalogItemClick={onCatalogItemClick}
          onTrackOrder={onTrackOrder}
        />
      </Suspense>
    )}

    {isMobileSearchOpen && (
      <Suspense fallback={null}>
        <MobileSearchModal
          isOpen={isMobileSearchOpen}
          onClose={onMobileSearchClose}
          searchProps={searchProps}
        />
      </Suspense>
    )}
  </>
);