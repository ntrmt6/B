import React, { memo, useMemo, useState, useEffect } from 'react';
import { ShoppingCart, User, LogOut, ChevronDown, Truck, UserCircle, Menu, Phone, Mail, ArrowRight, Globe, Heart, MapPin, Headphones } from 'lucide-react';
import { normalizeImageUrl } from '../../../utils/imageUrlHelper';
import type { HeaderSearchProps } from './headerTypes';
import { DesktopSearchBar } from './HeaderSearchBar';
import { SearchSuggestions } from './SearchBar';
import type { User as UserType, WebsiteConfig } from '../../../types';
import HeaderStyle6Desktop from './HeaderStyle6';
import HeaderStyle7Desktop from './HeaderStyle7';
import MenuHome from './MenuHome';
import { useLanguage } from '../../../context/LanguageContext';


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
  ImageSearchClick: () => void;
  categories?: any[];
  subCategories?: any[];
  childCategories?: any[];
}

const Badge = memo<{ count: number }>(({ count }) => 
  count > 0 ? <span className="absolute -top-2 -right-2 bg-theme-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{count}</span> : null
);

// Style 1: Default - Clean Modern Navigation
const HeaderStyle1 = memo<DesktopHeaderBarProps>(({
  resolvedHeaderLogo, logoKey, onHomeClick, searchProps,
  wishlistBadgeCount, cartBadgeCount, onWishlistOpen, onCartOpen,
  user, onLoginClick, onProfileClick, onTrackOrder, onLogoutClick,
  isMenuOpen, onMenuToggle, onMenuClose, menuRef,
  categoriesList, onCategoriesClick, onCategorySelect,
  categoryMenuRef, isCategoryMenuOpen, onCategoryMenuOpen,
  onProductsClick, websiteConfig, ImageSearchClick,
  categories, subCategories, childCategories
}) => {
  const { language, setLanguage } = useLanguage();
  const menuItems = useMemo(() => [
    { icon: <UserCircle size={16} />, label: 'My Profile', action: onProfileClick },
    { icon: <Truck size={16} />, label: 'My Orders', action: onTrackOrder },
    { icon: <Heart size={16} />, label: 'Wishlist', action: onWishlistOpen },
    { icon: <LogOut size={16} />, label: 'Logout', action: onLogoutClick, danger: true }
  ], [onProfileClick, onTrackOrder, onWishlistOpen, onLogoutClick]);
  const handleMenuClick = (action?: () => void) => { onMenuClose(); action?.(); };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'bn' : 'en');
  };

   const onHomeClickHandler = onHomeClick || (() => {
        window.location.href = "/";
    });

  return (
        <nav className="hidden lg:block bg-white sticky top-0 z-40 border-b border-[#F1F5FF]">
      <div className="max-w-[1720px] mx-auto w-full flex items-center justify-between px-6 py-2">
        
        {/* Logo */}
        <button type="button" className="flex-shrink-0" onClick={onHomeClickHandler}>
          {resolvedHeaderLogo ? (
            <img key={logoKey} src={normalizeImageUrl(resolvedHeaderLogo)} alt={websiteConfig?.websiteName || 'Logo'} className="max-h-[40px] w-auto object-contain" />
          ) : (
            <h2 className="text-xl font-bold text-gray-900">{websiteConfig?.websiteName || 'Logo'}</h2>
          )}
        </button>

        {/* Middle Section */}
        <div className="flex items-center justify-center flex-1 mx-10 min-w-0">
          <button type="button" onClick={searchProps.onVisualSearch} className="bg-[#f0f7ff] border border-[#cce3ff] text-blue-500 p-2 rounded-lg flex-shrink-0 hover:bg-blue-100 transition-colors" title="AI Image Search">
            <img className="cursor-pointer" src="https://theme-home-snit.vercel.app/images/cameraIcon.svg" alt="Image Search" />
          </button>

          {/* Search Box */}
          <div className="flex items-center bg-[#f0f7ff] rounded-xl relative ml-3 w-full max-w-[671px] min-w-0">
            <button type="button" onClick={searchProps.onVoiceSearch} className="p-2 flex-shrink-0">
              <img className="cursor-pointer" src="https://theme-home-snit.vercel.app/images/mic-02.svg" alt="Mic" />
            </button>
            <input
              className="flex-1 min-w-0 bg-white border-0 outline-none focus:outline-none focus:ring-0 font-inter text-base text-gray-900 placeholder-gray-400 py-2 px-3 rounded-l-lg pr-28"
              name="site-search"
              placeholder="Search in Cart and Get"
              value={searchProps.activeSearchValue}
              onChange={e => searchProps.onInputChange(e.target.value)}
            />
            <button
              type="button"
              onClick={() => searchProps.onInputChange(searchProps.activeSearchValue)}
              className="
                font-inter cursor-pointer absolute right-0 top-0 bottom-0
                px-6 rounded-r-xl
                bg-gradient-to-r from-[#38BDF8] to-[#1E90FF]
                bg-[length:200%_200%] bg-left
                hover:bg-right
                transition-all duration-500 ease-in-out
                text-white font-semibold text-[16px]
              "
            >
              Search
            </button>
            {/* Search suggestions dropdown */}
            {searchProps.isSuggestionsOpen && searchProps.suggestions && searchProps.suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-50">
                <SearchSuggestions
                  suggestions={searchProps.suggestions}
                  onSuggestionClick={searchProps.onSuggestionClick}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-6 flex-shrink-0">
          <button
            type="button"
            onClick={toggleLanguage}
            className="hover:opacity-70 transition-opacity flex items-center gap-1.5 group"
            title={language === 'en' ? 'বাংলা তে দেখুন' : 'Switch to English'}
          >
            <img src="https://theme-home-snit.vercel.app/images/translate.svg" alt="Translate" className="w-8 h-8" />
            <span className="text-sm font-semibold text-gray-700 group-hover:text-theme-primary transition-colors">
              {language === 'en' ? 'বাংলা' : 'English'}
            </span>
          </button>
          
          <button type="button" onClick={onCartOpen} className="hover:opacity-70 transition-opacity relative">
            <img src="https://theme-home-snit.vercel.app/images/shopping-cart-02.svg" alt="Cart" className="w-8 h-8" />
            {cartBadgeCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-theme-primary text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center text-[10px]">
                {cartBadgeCount}
              </span>
            )}
          </button>

          <div 
            className="relative"
            ref={menuRef}
          >
            <button 
              type="button" 
              className="flex items-center gap-1.5 cursor-pointer hover:opacity-70 transition-opacity"
              onClick={user ? onMenuToggle : onLoginClick}
            >
              {user?.image ? <img src={user.image} alt="User" className="w-8 h-8 rounded-full object-cover"/> : <img src="https://theme-home-snit.vercel.app/images/user-circle.svg" alt="User" className="w-8 h-8"/>}
              <span className="text-[14px] font-medium text-black">
                {user ? user.name.split(' ')[0] : 'Sign in'}
              </span>
            </button>
            
            {/* User Menu Dropdown */}
            {user && isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
                </div>
                {menuItems.map(({ icon, label, action, danger }) => (
                  <button 
                    key={label} 
                    type="button" 
                    onClick={() => handleMenuClick(action)} 
                    className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-all ${danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50 hover:text-theme-primary'}`}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>
              
            )}
            
          </div>
          
        </div>
      </div>
      {/* // Announcement Bar */}
                          <MenuHome
                            text={websiteConfig?.adminNoticeText}
                            onHomeClick={onHomeClickHandler}
                            categories={categories}
                            subCategories={subCategories}
                            childCategories={childCategories}
                            onCategorySelect={onCategorySelect}
                          />

    </nav>
  );
});
// Style 2: Compact - Single row minimal header
const HeaderStyle2 = memo<DesktopHeaderBarProps>(({
  resolvedHeaderLogo, logoKey, onHomeClick, searchProps,
  wishlistBadgeCount, cartBadgeCount, onWishlistOpen, onCartOpen,
  user, onLoginClick, onProfileClick, onTrackOrder, onLogoutClick,
  isMenuOpen, onMenuToggle, onMenuClose, menuRef, websiteConfig
}) => {
  const { language, setLanguage } = useLanguage();
  const menuItems = useMemo(() => [
    { icon: <UserCircle size={16} />, label: 'My Profile', action: onProfileClick },
    { icon: <Truck size={16} />, label: 'My Orders', action: onTrackOrder },
    { icon: <Heart size={16} />, label: 'Wishlist', action: onWishlistOpen },
    { icon: <LogOut size={16} />, label: 'Logout', action: onLogoutClick, danger: true }
  ], [onProfileClick, onTrackOrder, onWishlistOpen, onLogoutClick]);
  const handleMenuClick = (action?: () => void) => { onMenuClose(); action?.(); };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'bn' : 'en');
  };

  return (
    <header className="hidden md:block bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-[1500px] mx-auto px-3 sm:px-4 lg:px-6 py-3 flex items-center gap-8">
        <button type="button" className="flex-shrink-0" onClick={onHomeClick}>
          {resolvedHeaderLogo ? <img key={logoKey} src={normalizeImageUrl(resolvedHeaderLogo)} alt={websiteConfig?.websiteName || 'Logo'} className="max-h-[56px] w-auto max-w-[240px] object-contain" /> : <h2 className="text-xl font-bold text-gray-900">{websiteConfig?.websiteName || 'Store'}</h2>}
        </button>
        <nav className="flex items-center gap-1">
          <button type="button" onClick={onHomeClick} className="px-3 py-2 text-sm text-gray-600 hover:text-theme-primary transition-colors">Home</button>
          <button type="button" className="px-3 py-2 text-sm text-gray-600 hover:text-theme-primary transition-colors">Shop</button>
          <button type="button" className="px-3 py-2 text-sm text-gray-600 hover:text-theme-primary transition-colors">Categories</button>
        </nav>
        <div className="flex-1"><DesktopSearchBar {...searchProps} /></div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleLanguage}
            className="p-2 text-gray-600 hover:text-theme-primary transition-colors"
            title={language === 'en' ? 'বাংলা তে দেখুন' : 'Switch to English'}
          >
            <Globe size={20} strokeWidth={1.5} />
          </button>
          {/* <button type="button" className="relative p-2 text-gray-600 hover:text-theme-primary" onClick={onWishlistOpen}>
            <Heart size={22} strokeWidth={1.5} />
            {wishlistBadgeCount > 0 && <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{wishlistBadgeCount}</span>}
          </button> */}
          <button type="button" className="relative p-2 text-gray-600 hover:text-theme-primary" onClick={onCartOpen}>
            <ShoppingCart size={22} strokeWidth={1.5} />
            {cartBadgeCount > 0 && <span className="absolute -top-1 -right-1 bg-theme-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{cartBadgeCount}</span>}
          </button>
          <div className="relative" ref={menuRef}>
            <button type="button" className="p-2 text-gray-600 hover:text-theme-primary" onClick={user ? onMenuToggle : onLoginClick}>
              {user?.image ? <img src={user.image} alt="User" className="w-[22px] h-[22px] rounded-full object-cover"/> : <User size={22} strokeWidth={1.5} />}
              
              {/* px-4 py-2.5 rounded-xl hover:bg-white/80 hover:text-theme-primary hover:shadow-sm transition-all flex items-center gap-1.5 */}

            </button>
            {user && isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100"><p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p></div>
                {menuItems.map(({ icon, label, action, danger }) => (
                  <button key={label} type="button" onClick={() => handleMenuClick(action)} className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 ${danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'}`}>{icon} {label}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
});

// Style 3: Gradient - Colorful header with gradient
const HeaderStyle3 = memo<DesktopHeaderBarProps>(({
  resolvedHeaderLogo, logoKey, onHomeClick, searchProps,
  wishlistBadgeCount, cartBadgeCount, onWishlistOpen, onCartOpen,
  user, onLoginClick, onProfileClick, onTrackOrder, onLogoutClick,
  isMenuOpen, onMenuToggle, onMenuClose, menuRef,
  categoriesList, onCategoriesClick, onCategorySelect,
  categoryMenuRef, isCategoryMenuOpen, onCategoryMenuOpen, websiteConfig
}) => {
  const { language, setLanguage } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuItems = useMemo(() => [
    { icon: <UserCircle size={16} />, label: 'My Profile', action: onProfileClick },
    { icon: <Truck size={16} />, label: 'My Orders', action: onTrackOrder },
    { icon: <Heart size={16} />, label: 'Wishlist', action: onWishlistOpen },
    { icon: <LogOut size={16} />, label: 'Logout', action: onLogoutClick, danger: true }
  ], [onProfileClick, onTrackOrder, onWishlistOpen, onLogoutClick]);
  const handleMenuClick = (action?: () => void) => { onMenuClose(); action?.(); };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'bn' : 'en');
  };

  return (
    <header className="hidden md:block sticky top-0 z-50 select-none font-sans">

      {/* --- Main Navigation Hub: Clean & Minimalist --- */}
      <div className={`transition-all duration-500 ease-in-out bg-white ${
        isScrolled ? 'py-3 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] border-b border-slate-100' : 'py-6'
      }`}>
        <div className="max-w-[1440px] mx-auto px-10 flex items-center justify-between gap-12">
          
          {/* Brand Identity: Elegant Centering/Alignment */}
          <button 
            type="button" 
            className="flex items-center flex-shrink-0 relative group outline-none" 
            onClick={onHomeClick}
          >
            {resolvedHeaderLogo ? (
              <img 
                key={logoKey} 
                src={normalizeImageUrl(resolvedHeaderLogo)} 
                alt={websiteConfig?.websiteName || 'Logo'} 
                className={`w-auto object-contain transition-all duration-500 group-hover:opacity-80 ${
                  isScrolled ? 'max-h-[38px]' : 'max-h-[50px]'
                }`} 
              />
            ) : (
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">
                {websiteConfig?.websiteName || 'Store'}
              </h2>
            )}
          </button>

          {/* Search Hub: Clean & Integrated */}
          <div className="flex-1 max-w-2xl relative">
            <div className="bg-slate-100/80 rounded-2xl transition-all duration-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-theme-primary/10">
              <DesktopSearchBar {...searchProps} />
            </div>
          </div>

          {/* Action Center: Refined Luxury Icons */}
          <div className="flex items-center gap-1 lg:gap-1">

            {/* Language Toggle */}
            <button
              type="button"
              className="relative p-3 rounded-2xl text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all group active:scale-95"
              onClick={toggleLanguage}
              title={language === 'en' ? 'বাংলা তে দেখুন' : 'Switch to English'}
            >
              <Globe size={22} strokeWidth={1.5} />
            </button>

            {/* Shopping Cart: Elegant Indicator */}
            <button 
              type="button" 
              className="relative p-3 rounded-2xl text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all group active:scale-95" 
              onClick={onCartOpen}
            >
              <ShoppingCart size={22} strokeWidth={1.5} />
              {cartBadgeCount > 0 && (
                <span className="absolute top-2 right-2 bg-theme-primary text-white text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center ring-4 ring-white">
                  {cartBadgeCount}
                </span>
              )}
            </button>

            <div className="h-8 w-px bg-slate-200 mx-2" />

            {/* Profile Pillar: Modern Minimalist */}
            <div className="relative" ref={menuRef}>
              <button 
                type="button" 
                className={`flex items-center gap-3 pl-1.5 pr-4 py-1.5 rounded-2xl transition-all duration-300 ${
                  isMenuOpen 
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}
                onClick={user ? onMenuToggle : onLoginClick}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors overflow-hidden ${isMenuOpen ? 'bg-theme-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {user?.image ? <img src={user.image} alt="User" className="w-full h-full object-cover"/> : <User size={16} strokeWidth={2} />}
                </div>
                <div className="text-left leading-none">
                  <p className={`text-[13px] font-bold truncate max-w-[80px]`}>
                    {user ? user.name.split(' ')[0] : 'Account'}
                  </p>
                </div>
                <ChevronDown size={14} className={`transition-transform duration-500 opacity-40 ${isMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* User Menu: Clean White Card */}
              {user && isMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+12px)] w-60 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="px-5 py-4 mb-1 border-b border-slate-50">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Signed in as</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                  </div>
                  <div className="p-1 space-y-0.5">
                    {menuItems.map(({ icon, label, action, danger }) => (
                      <button 
                        key={label} 
                        type="button" 
                        onClick={() => handleMenuClick(action)} 
                        className={`w-full text-left px-4 py-2.5 text-[13px] font-semibold rounded-xl flex items-center gap-3 transition-all group ${
                          danger 
                            ? 'text-red-500 hover:bg-red-50' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-theme-primary'
                        }`}
                      >
                        <span className="opacity-50 group-hover:opacity-100 transition-opacity">{icon}</span> 
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- Tertiary Nav: Minimal Underline Navigation --- */}
      <nav className={`bg-white transition-all duration-300 ${
        isScrolled ? 'border-b border-slate-100' : ''
      }`}>
        <div className="max-w-[1440px] mx-auto px-10 flex items-center justify-between">
          <div className="flex items-center gap-4 py-1">
            <button 
              onClick={onHomeClick} 
              className="px-4 py-4 text-[13px] font-bold text-slate-500 hover:text-slate-900 transition-all relative group"
            >
              HOME
              <span className="absolute bottom-3 left-4 right-4 h-0.5 bg-theme-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-center duration-300" />
            </button>

            {websiteConfig?.showMobileHeaderCategory && (
              <div 
                ref={categoryMenuRef} 
                className="relative flex items-center" 
                onMouseEnter={() => onCategoryMenuOpen(true)} 
                onMouseLeave={() => onCategoryMenuOpen(false)}
              >
                <button 
                  onClick={onCategoriesClick} 
                  className={`px-4 py-4 text-[13px] font-bold transition-all flex items-center gap-2 relative group ${
                    isCategoryMenuOpen ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  COLLECTIONS
                  <ChevronDown size={14} className={`transition-transform duration-500 ${isCategoryMenuOpen ? 'rotate-180' : 'opacity-40'}`} />
                  <span className={`absolute bottom-3 left-4 right-8 h-0.5 bg-theme-primary transition-transform origin-center duration-300 ${isCategoryMenuOpen ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
                </button>

                {/* Categories Mega Dropdown: Minimalist Clean Grid */}
                {isCategoryMenuOpen && categoriesList?.length ? (
                  <div className="absolute left-0 top-full mt-0 w-[500px] rounded-2xl bg-white p-6 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.12)] border border-slate-100 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                      <div className="col-span-2 mb-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Browse by Category</h4>
                      </div>
                      {categoriesList.map(cat => (
                        <button 
                          key={cat} 
                          type="button" 
                          onClick={() => { onCategorySelect?.(cat); onCategoryMenuOpen(false); }} 
                          className="flex items-center justify-between w-full py-3 text-left text-[13px] font-bold text-slate-600 hover:text-theme-primary transition-all group"
                        >
                          {cat}
                          <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            <button className="px-4 py-4 text-[13px] font-bold text-slate-500 hover:text-slate-900 transition-all relative group">
              Cominng Soon
              <span className="absolute bottom-3 left-4 right-4 h-0.5 bg-theme-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-center duration-300" />
            </button>
            <button className="px-4 py-4 text-[13px] font-bold text-slate-500 hover:text-slate-900 transition-all relative group">
              Cominng Soon
              <span className="absolute bottom-3 left-4 right-4 h-0.5 bg-theme-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-center duration-300" />
            </button>
          </div>

          {/* Secondary Action: Order Tracking */}
          <div className="flex items-center gap-4">
            <button 
              onClick={onTrackOrder} 
              className="group flex items-center gap-2 px-5 py-2 rounded-xl bg-white text-slate-700 border border-slate-200 hover:border-slate-900 hover:text-slate-900 transition-all duration-300 text-[11px] font-bold tracking-tight"
            >
              <Truck size={14} className="text-slate-400 group-hover:text-slate-900 transition-colors" /> 
              TRACK ORDER
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
});

// Style 4: E-commerce Pro - With top bar and categories mega menu
const HeaderStyle4 = memo<DesktopHeaderBarProps>(({
  resolvedHeaderLogo, logoKey, onHomeClick, searchProps,
  wishlistBadgeCount, cartBadgeCount, onWishlistOpen, onCartOpen,
  user, onLoginClick, onProfileClick, onTrackOrder, onLogoutClick,
  isMenuOpen, onMenuToggle, onMenuClose, menuRef,
  categoriesList, onCategorySelect,
  categoryMenuRef, isCategoryMenuOpen, onCategoryMenuOpen, websiteConfig
}) => {
  const { language, setLanguage } = useLanguage();
  const menuItems = useMemo(() => [
    { icon: <UserCircle size={16} />, label: 'My Profile', action: onProfileClick },
    { icon: <Truck size={16} />, label: 'My Orders', action: onTrackOrder },
    { icon: <Heart size={16} />, label: 'Wishlist', action: onWishlistOpen },
    { icon: <LogOut size={16} />, label: 'Logout', action: onLogoutClick, danger: true }
  ], [onProfileClick, onTrackOrder, onWishlistOpen, onLogoutClick]);
  const handleMenuClick = (action?: () => void) => { onMenuClose(); action?.(); };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'bn' : 'en');
  };

  return (
    <header className="hidden md:block sticky top-0 z-50">
      <div className="bg-gray-900 text-white/80 text-xs">
        <div className="max-w-[1500px] mx-auto px-3 sm:px-4 lg:px-6 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {websiteConfig?.phones?.[0] && <span className="flex items-center gap-1"><Phone size={12} /> {websiteConfig.phones[0]}</span>}
            {websiteConfig?.emails?.[0] && <span className="flex items-center gap-1"><Mail size={12} /> {websiteConfig.emails[0]}</span>}
          </div>
          <div className="flex items-center gap-4">
            <button type="button" onClick={onTrackOrder} className="hover:text-white transition-colors flex items-center gap-1"><Truck size={12} /> Track Order</button>
            <button type="button" onClick={user ? onProfileClick : onLoginClick} className="hover:text-white transition-colors">{user ? 'My Account' : 'Login / Register'}</button>
          </div>
        </div>
      </div>
      <div className="bg-white shadow-sm">
        <div className="max-w-[1500px] mx-auto px-3 sm:px-4 lg:px-6 py-3 flex items-center gap-8">
          <button type="button" className="flex-shrink-0" onClick={onHomeClick}>
            {resolvedHeaderLogo ? <img key={logoKey} src={normalizeImageUrl(resolvedHeaderLogo)} alt={websiteConfig?.websiteName || 'Logo'} className="max-h-[56px] w-auto max-w-[240px] object-contain" /> : <h2 className="text-xl font-bold text-theme-primary">{websiteConfig?.websiteName || 'Store'}</h2>}
          </button>
          <div ref={categoryMenuRef} className="relative" onMouseEnter={() => onCategoryMenuOpen(true)} onMouseLeave={() => onCategoryMenuOpen(false)}>
            <button type="button" className="flex items-center gap-2 px-4 py-2.5 bg-theme-primary text-white rounded-lg font-medium text-sm hover:bg-theme-primary/90 transition-all">
              <Menu size={18} /> All Categories <ChevronDown size={14} />
            </button>
            {isCategoryMenuOpen && categoriesList?.length ? (
              <div className="absolute left-0 top-full mt-0 w-64 rounded-xl bg-white py-2 shadow-2xl border z-50">
                {categoriesList.map(cat => <button key={cat} type="button" onClick={() => { onCategorySelect?.(cat); onCategoryMenuOpen(false); }} className="block w-full px-4 py-3 text-left text-sm hover:bg-theme-primary/10 hover:text-theme-primary transition-all">{cat}</button>)}
              </div>
            ) : null}
          </div>
          <div className="flex-1"><DesktopSearchBar {...searchProps} /></div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="flex flex-col items-center text-gray-600 hover:text-theme-primary transition-colors"
              onClick={toggleLanguage}
              title={language === 'en' ? 'বাংলা তে দেখুন' : 'Switch to English'}
            >
              <Globe size={22} />
              <span className="text-[10px] mt-0.5">{language === 'en' ? 'বাংলা' : 'English'}</span>
            </button>
            {/* <button type="button" className="flex flex-col items-center text-gray-600 hover:text-theme-primary transition-colors" onClick={onWishlistOpen}>
              <div className="relative"><Heart size={22} />{wishlistBadgeCount > 0 && <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{wishlistBadgeCount}</span>}</div>
              <span className="text-[10px] mt-0.5">Wishlist</span>
            </button> */}
            <button type="button" className="flex flex-col items-center text-gray-600 hover:text-theme-primary transition-colors" onClick={onCartOpen}>
              <div className="relative"><ShoppingCart size={22} />{cartBadgeCount > 0 && <span className="absolute -top-1 -right-1 bg-theme-primary text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{cartBadgeCount}</span>}</div>
              <span className="text-[10px] mt-0.5">Cart</span>
            </button>
            <div className="relative" ref={menuRef}>
              <button type="button" className="flex flex-col items-center text-gray-600 hover:text-theme-primary transition-colors" onClick={user ? onMenuToggle : onLoginClick}>
                {user?.image ? <img src={user.image} alt="User" className="w-[22px] h-[22px] rounded-full object-cover"/> : <User size={22} />}<span className="text-[10px] mt-0.5">{user ? 'Account' : 'Login'}</span>
              </button>
              {user && isMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border py-2 z-50">
                  <div className="px-4 py-3 border-b"><p className="text-sm font-semibold truncate">{user.name}</p></div>
                  {menuItems.map(({ icon, label, action, danger }) => (
                    <button key={label} type="button" onClick={() => handleMenuClick(action)} className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 ${danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'}`}>{icon} {label}</button>
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

// Style 5: Dark Mode - Sleek dark theme header
const HeaderStyle5 = memo<DesktopHeaderBarProps>(({
  resolvedHeaderLogo, logoKey, onHomeClick, searchProps,
  wishlistBadgeCount, cartBadgeCount, onWishlistOpen, onCartOpen,
  user, onLoginClick, onProfileClick, onTrackOrder, onLogoutClick,
  isMenuOpen, onMenuToggle, onMenuClose, menuRef,
  categoriesList, onCategoriesClick, onCategorySelect,
  categoryMenuRef, isCategoryMenuOpen, onCategoryMenuOpen,
  onProductsClick, websiteConfig
}) => {
  const { language, setLanguage } = useLanguage();
  const menuItems = useMemo(() => [
    { icon: <UserCircle size={16} />, label: 'My Profile', action: onProfileClick },
    { icon: <Truck size={16} />, label: 'My Orders', action: onTrackOrder },
    { icon: <Heart size={16} />, label: 'Wishlist', action: onWishlistOpen },
    { icon: <LogOut size={16} />, label: 'Logout', action: onLogoutClick, danger: true }
  ], [onProfileClick, onTrackOrder, onWishlistOpen, onLogoutClick]);
  const handleMenuClick = (action?: () => void) => { onMenuClose(); action?.(); };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'bn' : 'en');
  };

  return (
    <header className="hidden md:block bg-gray-900 sticky top-0 z-50 shadow-xl">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-3 sm:gap-4 lg:gap-6">
        <button type="button" className="flex items-center flex-shrink-0" onClick={onHomeClick}>
          {resolvedHeaderLogo ? <img key={logoKey} src={normalizeImageUrl(resolvedHeaderLogo)} alt={websiteConfig?.websiteName || 'Logo'} className="max-h-[56px] w-auto max-w-[240px] object-contain brightness-0 invert" /> : <h2 className="text-2xl font-bold text-white">{websiteConfig?.websiteName || 'Store'}</h2>}
        </button>
        <nav className="flex items-center gap-1 text-sm font-medium">
          <button type="button" onClick={onHomeClick} className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-all">Home</button>
          {websiteConfig?.showMobileHeaderCategory && (
            <div ref={categoryMenuRef} className="relative" onMouseEnter={() => onCategoryMenuOpen(true)} onMouseLeave={() => onCategoryMenuOpen(false)}>
              <button type="button" onClick={onCategoriesClick} className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-all flex items-center gap-1">Categories <ChevronDown size={14} /></button>
              {isCategoryMenuOpen && categoriesList?.length ? (
                <div className="absolute left-0 top-full mt-0 w-56 rounded-xl bg-gray-800 py-2 shadow-xl border border-gray-700 z-50">
                  {categoriesList.map(cat => <button key={cat} type="button" onClick={() => { onCategorySelect?.(cat); onCategoryMenuOpen(false); }} className="block w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:text-white hover:bg-gray-700">{cat}</button>)}
                </div>
              ) : null}
            </div>
          )}
          <button type="button" onClick={onProductsClick} className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-all">Products</button>
          <button type="button" onClick={onTrackOrder} className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-all flex items-center gap-1.5"><Truck size={15} /> Track</button>
        </nav>
        <div className="flex-1 max-w-xl"><DesktopSearchBar {...searchProps} /></div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="relative p-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-all"
            onClick={toggleLanguage}
            title={language === 'en' ? 'বাংলা তে দেখুন' : 'Switch to English'}
          >
            <Globe size={22} strokeWidth={1.8} />
          </button>
          {/* <button type="button" className="relative p-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-all" onClick={onWishlistOpen}>
            <Heart size={22} strokeWidth={1.8} />
            {wishlistBadgeCount > 0 && <span className="absolute top-1 right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{wishlistBadgeCount}</span>}
          </button> */}
          <button type="button" className="relative p-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-all" onClick={onCartOpen}>
            <ShoppingCart size={22} strokeWidth={1.8} />
            {cartBadgeCount > 0 && <span className="absolute top-1 right-1 bg-cyan-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{cartBadgeCount}</span>}
          </button>
          <div className="relative" ref={menuRef}>
            <button type="button" className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-all" onClick={user ? onMenuToggle : onLoginClick}>
              {user?.image ? <img src={user.image} alt="User" className="w-5 h-5 rounded-full object-cover"/> : <User size={20} strokeWidth={1.8} />}
              <span className="text-sm font-medium">{user ? user.name.split(' ')[0] : 'Login'}</span>
            </button>
            {user && isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-gray-800 rounded-xl shadow-xl border border-gray-700 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-700"><p className="text-sm font-semibold text-white truncate">{user.name}</p></div>
                {menuItems.map(({ icon, label, action, danger }) => (
                  <button key={label} type="button" onClick={() => handleMenuClick(action)} className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 ${danger ? 'text-red-400 hover:bg-red-900/30' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}>{icon} {label}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
});

export const DesktopHeaderBar = memo<DesktopHeaderBarProps>((props) => {
  const style = props.websiteConfig?.headerStyle || 'style1';
  
  switch (style) {
    case 'style2':
      return <HeaderStyle2 {...props} />;
    case 'style3':
      return <HeaderStyle3 {...props} />;
    case 'style4':
      return <HeaderStyle4 {...props} />;
    case 'style5':
      return <HeaderStyle5 {...props} />;
    case 'style6':
      return <HeaderStyle6Desktop {...props} />;
    case 'style7':
      return <HeaderStyle7Desktop {...props} />;
    case 'style1':
    default:
      return <HeaderStyle1 {...props} />;
  }
});