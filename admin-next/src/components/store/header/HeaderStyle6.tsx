import React, { memo, useMemo } from 'react';
import { ShoppingCart, Heart, User, LogOut, ChevronDown, Truck, UserCircle, Camera } from 'lucide-react';
import { normalizeImageUrl } from '../../../utils/imageUrlHelper';
import type { HeaderSearchProps } from './headerTypes';
import { DesktopSearchBar } from './HeaderSearchBar';
import type { User as UserType, WebsiteConfig } from '../../../types';

interface DesktopHeaderBarProps {
  resolvedHeaderLogo: string | null;
  logoKey: string;
  onHomeClick?: () => void;
  searchProps: HeaderSearchProps;
  wishlistBadgeCount: number;
  cartBadgeCount: number;
  onWishlistOpen: () => void;
  onCartOpen: () => void;
  user?: UserType | null;
  onLoginClick?: () => void;
  onProfileClick?: () => void;
  onTrackOrder?: () => void;
  onLogoutClick?: () => void;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  onMenuClose: () => void;
  menuRef: React.RefObject<HTMLDivElement>;
  categoriesList?: string[];
  onCategoriesClick?: () => void;
  onCategorySelect?: (category: string) => void;
  categoryMenuRef: React.RefObject<HTMLDivElement>;
  isCategoryMenuOpen: boolean;
  onCategoryMenuOpen: (open: boolean) => void;
  onProductsClick?: () => void;
  websiteConfig?: WebsiteConfig;
  ImageSearchClick?: () => void;
}

const HeaderStyle6Desktop = memo<DesktopHeaderBarProps>(({
  resolvedHeaderLogo, logoKey, onHomeClick, searchProps,
  wishlistBadgeCount, cartBadgeCount, onWishlistOpen, onCartOpen,
  user, onLoginClick, onProfileClick, onTrackOrder, onLogoutClick,
  isMenuOpen, onMenuToggle, onMenuClose, menuRef,
  categoriesList, onCategoriesClick, onCategorySelect,
  categoryMenuRef, isCategoryMenuOpen, onCategoryMenuOpen,
  onProductsClick, websiteConfig, ImageSearchClick
}) => {
  const menuItems = useMemo(() => [
    { icon: <UserCircle size={16} />, label: 'My Profile', action: onProfileClick },
    { icon: <Truck size={16} />, label: 'My Orders', action: onTrackOrder },
    { icon: <LogOut size={16} />, label: 'Logout', action: onLogoutClick, danger: true }
  ], [onProfileClick, onTrackOrder, onLogoutClick]);
  const handleMenuClick = (action?: () => void) => { onMenuClose(); action?.(); };

  return (
    <header className="hidden md:block bg-white sticky top-0 z-50 border-b border-[#F1F5FF]">
      <div className="max-w-[1720px] mx-auto w-full flex items-center justify-between px-6 py-4">

        {/* Logo */}
        <button type="button" onClick={onHomeClick} className="flex-shrink-0">
          {resolvedHeaderLogo ? (
            <img key={logoKey} src={normalizeImageUrl(resolvedHeaderLogo)} alt={websiteConfig?.websiteName || 'Logo'} className="max-h-[56px] w-auto max-w-[240px] object-contain" />
          ) : (
            <span className="text-xl font-bold text-gray-800">{websiteConfig?.websiteName || 'Store'}</span>
          )}
        </button>

        {/* Middle Section - Camera + Search */}
        <div className="flex items-center justify-center flex-1 mx-10 min-w-0">

          {/* Camera Icon for Image Search */}
          {ImageSearchClick && (
            <button type="button" onClick={ImageSearchClick} className="bg-[#F1F5FF] p-2 rounded-lg flex-shrink-0 hover:bg-[#E5ECFF] transition-colors">
              <Camera size={28} className="text-gray-600" />
            </button>
          )}

          {/* Search Box */}
          <div className="ml-6 w-full max-w-[671px] min-w-0">
            <DesktopSearchBar {...searchProps} />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-6 flex-shrink-0">

          {/* Wishlist */}
          <button type="button" className="relative cursor-pointer p-1" onClick={onWishlistOpen}>
            <Heart size={26} strokeWidth={1.8} className="text-gray-700" />
            {wishlistBadgeCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                {wishlistBadgeCount}
              </span>
            )}
          </button>

          {/* Cart */}
          <button type="button" className="relative cursor-pointer p-1" onClick={onCartOpen}>
            <ShoppingCart size={26} strokeWidth={1.8} className="text-gray-700" />
            {cartBadgeCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                {cartBadgeCount}
              </span>
            )}
          </button>

          {/* User / Login */}
          <div className="relative" ref={menuRef}>
            <button type="button" className="flex items-center gap-2 cursor-pointer" onClick={user ? onMenuToggle : onLoginClick}>
              <User size={28} strokeWidth={1.8} className="text-gray-700" />
              <span className="text-[16px] font-medium text-black">
                {user ? user.name.split(' ')[0] : 'Sign in'}
              </span>
            </button>
            {user && isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                {menuItems.map(({ icon, label, action, danger }) => (
                  <button key={label} type="button" onClick={() => handleMenuClick(action)}
                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 transition-colors ${danger ? 'text-red-500 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'}`}>
                    {icon} {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
});

HeaderStyle6Desktop.displayName = 'HeaderStyle6Desktop';
export default HeaderStyle6Desktop;
