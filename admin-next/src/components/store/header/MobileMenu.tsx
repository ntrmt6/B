// MobileMenu - Mobile navigation menu
import React, { useEffect } from 'react';
import { X, Store, ChevronRight, ChevronDown } from 'lucide-react';
import { normalizeImageUrl } from '../../../utils/imageUrlHelper';

type CatalogGroup = {
  key: string;
  label: string;
  items: string[];
};

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
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

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  logo,
  logoKey,
  catalogGroups,
  activeCatalogSection,
  isCatalogDropdownOpen,
  onCatalogDropdownToggle,
  onCatalogSectionToggle,
  onCatalogItemClick,
  onTrackOrder,
}) => {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const totalCatalogItems = catalogGroups.reduce((count, group) => count + group.items.length, 0);
  const quickGroups = [...catalogGroups].sort((a, b) => b.items.length - a.items.length).slice(0, 4);

  return (
    <>
      {/* Overlay with smooth fade */}
      <div 
        className={`fixed inset-0 bg-slate-950/45 backdrop-blur-[3px] transition-all duration-200 ease-out md:hidden z-[98] ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} 
        onClick={onClose} 
      />
      
      {/* Drawer with smooth slide */}
      <aside 
        className={`fixed inset-y-0 left-0 z-[99] w-[88%] max-w-[360px] bg-gradient-to-b from-white via-white to-slate-50/90 shadow-2xl border-r border-slate-200/70 md:hidden flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-transform rounded-r-3xl ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-4 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-slate-100 sticky top-0 z-10 rounded-tr-3xl">
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-3">
              {logo ? (
                <img 
                  key={logoKey} 
                  src={normalizeImageUrl(logo)} 
                  alt="Store Logo" 
                  className="h-[34px] w-auto max-w-[118px] object-contain" 
                />
              ) : null}
              <div className="min-w-0">
                <p className="text-xl leading-none font-black tracking-tight text-slate-900">MENU</p>
                <p className="mt-1 text-[12px] font-medium text-slate-500 truncate">Explore categories and products</p>
              </div>
            </div>
            <button 
              type="button" 
              className="p-2.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 active:scale-95 transition-all duration-200" 
              onClick={onClose}
              aria-label="Close menu"
            >
              <X size={22} strokeWidth={2.5} />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Sections</p>
              <p className="text-base font-bold text-slate-800">{catalogGroups.length}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Items</p>
              <p className="text-base font-bold text-slate-800">{totalCatalogItems}</p>
            </div>
          </div>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Catalog Section */}
          <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-3">
            <button 
              type="button" 
              className={`flex w-full items-center justify-between px-4 py-3.5 rounded-2xl font-semibold transition-all duration-200 border ${isCatalogDropdownOpen ? 'bg-theme-primary/10 text-theme-primary border-theme-primary/30 shadow-sm' : 'bg-white text-slate-800 shadow-sm border-slate-200 hover:border-slate-300'}`}
              onClick={onCatalogDropdownToggle}
              aria-expanded={isCatalogDropdownOpen}
              aria-label="Toggle catalog filters"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isCatalogDropdownOpen ? 'bg-theme-primary/20' : 'bg-slate-100'}`}>
                  <Store size={18} className={isCatalogDropdownOpen ? 'text-theme-primary' : 'text-slate-600'} />
                </div>
                <div className="text-left">
                  <span className="block text-[15px] leading-tight">Browse Catalog</span>
                  <span className="block mt-0.5 text-[11px] font-medium text-slate-500">Tap to open all filters</span>
                </div>
              </div>
              <ChevronDown 
                className={`transition-transform duration-300 ${isCatalogDropdownOpen ? 'rotate-180 text-theme-primary' : 'text-slate-400'}`} 
                size={20} 
              />
            </button>

            {!isCatalogDropdownOpen && quickGroups.length > 0 ? (
              <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Quick Access</p>
                <div className="flex flex-wrap gap-2">
                  {quickGroups.map((group) => (
                  <button
                    key={`quick-${group.key}`}
                    type="button"
                    onClick={() => {
                      if (!isCatalogDropdownOpen) {
                        onCatalogDropdownToggle();
                      }
                      onCatalogSectionToggle(group.key);
                    }}
                    className="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:border-theme-primary/40 hover:text-theme-primary transition-colors"
                  >
                    {group.label}
                  </button>
                  ))}
                </div>
              </div>
            ) : null}
            
            {/* Catalog Dropdown Content */}
            <div 
              className={`rounded-2xl bg-white border border-slate-200 overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${isCatalogDropdownOpen ? 'max-h-[65vh] opacity-100 shadow-sm' : 'max-h-0 opacity-0 border-transparent'}`}
            >
              <div className="divide-y divide-slate-100">
                {catalogGroups.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-slate-500">
                    Catalog is empty right now. Add categories to show menu filters.
                  </div>
                ) : null}
                {catalogGroups.map((group) => (
                  <div key={group.key}>
                    <button 
                      type="button" 
                      className={`flex w-full items-center justify-between px-4 py-3.5 text-sm font-semibold transition-colors duration-200 ${activeCatalogSection === group.key ? 'text-theme-primary bg-theme-primary/5' : 'text-slate-700 hover:bg-slate-50'}`} 
                      onClick={() => onCatalogSectionToggle(group.key)}
                      aria-expanded={activeCatalogSection === group.key}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="truncate">{group.label}</span>
                        <span className="inline-flex items-center justify-center rounded-full bg-slate-100 text-slate-500 text-[11px] px-2 py-0.5">
                          {group.items.length}
                        </span>
                      </div>
                      <ChevronRight
                        size={16}
                        className={`transition-transform duration-200 ${activeCatalogSection === group.key ? 'rotate-90 text-theme-primary' : 'text-slate-400'}`}
                      />
                    </button>
                    
                    {/* Sub-items with smooth animation */}
                    <div 
                      className={`overflow-hidden transition-all duration-300 ease-out ${activeCatalogSection === group.key ? 'max-h-72' : 'max-h-0'}`}
                    >
                      <div className="px-4 pb-3 pt-1.5 space-y-1.5 bg-slate-50/40">
                        {group.items.map((item) => (
                          <button 
                            key={item}
                            type="button" 
                            className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-theme-primary hover:bg-theme-primary/5 rounded-lg transition-colors duration-150" 
                            onClick={() => onCatalogItemClick(item)}
                          >
                            {item.startsWith('tag:') ? item.slice(4) : (item.startsWith('brand:') ? item.slice(6) : item)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {onTrackOrder ? (
              <button
                type="button"
                onClick={onTrackOrder}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors"
              >
                Track My Order
              </button>
            ) : null}
          </div>
        </div>
      </aside>
    </>
  );
};

export default MobileMenu;
