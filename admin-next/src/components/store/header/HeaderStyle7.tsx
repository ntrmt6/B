import React, { memo, useMemo, useEffect, useState } from 'react';
import { ShoppingCart, User, LogOut, Truck, UserCircle, Volume2 } from 'lucide-react';
import { normalizeImageUrl } from '../../../utils/imageUrlHelper';
import type { HeaderSearchProps } from './headerTypes';
import { DesktopSearchBar } from './HeaderSearchBar';
import type { User as UserType, WebsiteConfig } from '../../../types';

interface HeaderStyle7Props {
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

// ─── Admin Notice Ticker (continuous marquee loop) ───────────────────────────
const AdminNoticeTicker = memo<{ text: string }>(({ text }) => (
  <div className="border-b border-stone-300 hidden h-[41px] overflow-hidden md:block">
    <div className="max-w-[1340px] w-[95%] mx-auto h-full">
      <div className="items-center flex h-full py-[7px]">
        <div className="items-center gap-x-5 flex gap-y-5 shrink-0">
          <span className="text-zinc-900 text-sm font-medium items-center flex">
            <Volume2 size={20} className="mr-[5px] text-zinc-700" />
            <span>Admin Notice:</span>
          </span>
        </div>
        <div className="basis-[0%] grow ml-2.5 overflow-hidden">
          <div className="header7-marquee-track text-sm">
            <span className="header7-marquee-item">{text}</span>
            <span className="header7-marquee-item" aria-hidden="true">{text}</span>
          </div>
        </div>
      </div>
    </div>
    <style>{`
      .header7-marquee-track {
        display: flex;
        align-items: center;
        width: max-content;
        min-width: 100%;
        animation: header7-marquee 20s linear infinite;
      }
      .header7-marquee-item {
        white-space: nowrap;
        display: inline-block;
        padding-right: 900px;
      }
      @keyframes header7-marquee {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
    `}</style>
  </div>
));
AdminNoticeTicker.displayName = 'AdminNoticeTicker';

// ─── Desktop Header Style 7 (Gadgets Theme - exact Figma design) ─────────────
const HeaderStyle7Desktop = memo<HeaderStyle7Props>(({
  resolvedHeaderLogo, logoKey, onHomeClick, searchProps,
  wishlistBadgeCount, cartBadgeCount, onWishlistOpen, onCartOpen,
  user, onLoginClick, onProfileClick, onTrackOrder, onLogoutClick,
  isMenuOpen, onMenuToggle, onMenuClose, menuRef,
  websiteConfig, ImageSearchClick
}) => {
  const menuItems = useMemo(() => [
    { icon: <UserCircle size={16} />, label: 'My Profile', action: onProfileClick },
    { icon: <Truck size={16} />, label: 'My Orders', action: onTrackOrder },
    { icon: <LogOut size={16} />, label: 'Logout', action: onLogoutClick, danger: true }
  ], [onProfileClick, onTrackOrder, onLogoutClick]);
  const handleMenuClick = (action?: () => void) => { onMenuClose(); action?.(); };

  const noticeText = websiteConfig?.adminNoticeText || 'Easy return policy and complete cash on delivery, ease of shopping!';

  // Search hints rotation (matches Figma animated placeholder)
  const hints = useMemo(() => {
    const raw = websiteConfig?.searchHints || 'gadget item,gift,educational toy';
    return raw.split(',').map(h => h.trim()).filter(Boolean);
  }, [websiteConfig?.searchHints]);
  const [hintIdx, setHintIdx] = useState(0);
  useEffect(() => {
    if (hints.length <= 1) return;
    const t = setInterval(() => setHintIdx(p => (p + 1) % hints.length), 3000);
    return () => clearInterval(t);
  }, [hints.length]);

  return (
    <header className="hidden md:block bg-white sticky top-0 z-[999] border-b border-stone-300 w-full">
      {/* Top Bar - Admin Notice */}
      <AdminNoticeTicker text={noticeText} />

      {/* Main Nav */}
      <div className="max-w-[1340px] w-[95%] mx-auto">
        <div className="items-center gap-x-2.5 flex justify-between gap-y-2.5 w-full py-5">
          {/* Logo */}
          <button type="button" onClick={onHomeClick} className="items-center flex justify-start max-w-[180px] w-full">
            {resolvedHeaderLogo ? (
              <img
                key={logoKey}
                src={normalizeImageUrl(resolvedHeaderLogo)}
                alt={websiteConfig?.websiteName || 'Store'}
                className="block h-full max-h-[50px] max-w-[180px] object-contain w-full"
              />
            ) : (
              <span className="text-xl font-bold text-gray-800">{websiteConfig?.websiteName || 'Store'}</span>
            )}
          </button>

          {/* Search Bar */}
          <div className="block max-w-[650px] w-full">
            <div className="relative">
              <div className="relative items-center bg-white flex h-10 w-full border-lime-500 rounded border-2 border-solid">
                <div className="relative h-full w-full">
                  <DesktopSearchBar {...searchProps} />
                </div>
                {/* Image search */}
                {searchProps.onVisualSearch && (
                  <button type="button" onClick={searchProps.onVisualSearch} className="text-center mr-1 pt-1 px-[5px] rounded-[7px] hover:bg-gray-100 transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Cart + User */}
          <div className="items-center gap-x-2.5 flex min-w-[183px] gap-y-2.5">
            {/* Cart */}
            <button type="button" onClick={onCartOpen} className="relative text-center pt-[5px] pb-px px-2.5 rounded-[5px]">
              <ShoppingCart size={24} className="text-gray-700" />
              <span className="absolute text-white text-xs font-medium bg-lime-500 block h-5 leading-5 top-[-3px] w-5 rounded-full -right-px">
                {cartBadgeCount}
              </span>
            </button>

            {/* User */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={user ? onMenuToggle : onLoginClick}
                className="text-zinc-900 items-center bg-white gap-x-[5px] flex gap-y-[5px] px-2.5 py-[5px] rounded-[20px] hover:bg-neutral-100 transition-colors"
              >
                <User size={22} className="text-gray-700 mt-[2px]" />
                <span className="text-xs font-bold whitespace-nowrap">
                  {user ? user.name.split(' ')[0] : 'Login'}
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
      </div>
    </header>
  );
});

HeaderStyle7Desktop.displayName = 'HeaderStyle7Desktop';
export default HeaderStyle7Desktop;
