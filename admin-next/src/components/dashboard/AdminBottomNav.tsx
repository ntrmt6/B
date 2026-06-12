import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Menu, Search, Plus, ShoppingCart, ArrowLeft, X } from 'lucide-react';

interface SearchMenuItem {
  id: string;
  label: string;
  keywords: string[];
  category: string;
}

const SEARCHABLE_MENU_ITEMS: SearchMenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', keywords: ['home', 'overview', 'stats', 'analytics'], category: 'Main Menu' },
  { id: 'orders', label: 'Orders', keywords: ['order', 'purchase', 'sales', 'invoice'], category: 'Main Menu' },
  { id: 'products', label: 'All Products', keywords: ['product', 'item', 'listing', 'merchandise'], category: 'Products' },
  { id: 'product-upload', label: 'Add New Product', keywords: ['add product', 'upload', 'new product', 'create product'], category: 'Products' },
  { id: 'inventory', label: 'Inventory', keywords: ['stock', 'warehouse', 'quantity'], category: 'Main Menu' },
  { id: 'purchases', label: 'Purchase', keywords: ['purchase', 'buy', 'supplier', 'purchase book', 'procurement'], category: 'Main Menu' },
  { id: 'customers_reviews', label: 'Customers & Reviews', keywords: ['customer', 'review', 'feedback', 'user'], category: 'Main Menu' },
  { id: 'catalog_categories', label: 'Categories', keywords: ['category', 'product category'], category: 'Catalog' },
  { id: 'catalog_subcategories', label: 'Sub Categories', keywords: ['subcategory', 'sub category'], category: 'Catalog' },
  { id: 'catalog_brands', label: 'Brands', keywords: ['brand', 'manufacturer'], category: 'Catalog' },
  { id: 'catalog_tags', label: 'Tags', keywords: ['tag', 'label', 'keyword'], category: 'Catalog' },
  { id: 'customization', label: 'Customization', keywords: ['customize', 'theme', 'design', 'appearance'], category: 'Configuration' },
  { id: 'store_studio', label: 'Store Studio', keywords: ['studio', 'builder', 'page builder'], category: 'Configuration' },
  { id: 'gallery', label: 'Gallery', keywords: ['image', 'photo', 'media', 'upload image', 'files'], category: 'Configuration' },
  { id: 'business_report', label: 'Business Report', keywords: ['report', 'analytics', 'expense', 'income'], category: 'Reports' },
  { id: 'settings', label: 'Settings', keywords: ['settings', 'configuration', 'preferences'], category: 'System' },
  { id: 'admin_control', label: 'Admin Control', keywords: ['admin', 'control', 'staff', 'roles'], category: 'System' },
  { id: 'billing', label: 'Billing & Subscription', keywords: ['billing', 'subscription', 'payment', 'plan'], category: 'System' },
  { id: 'support', label: 'Support', keywords: ['help', 'support', 'ticket'], category: 'System' },
];

interface AdminBottomNavProps {
  activeItem?: string;
  onNavigate?: (page: string) => void;
  onMenuClick?: () => void;
}

export const AdminBottomNav: React.FC<AdminBottomNavProps> = ({
  activeItem = 'dashboard',
  onNavigate,
  onMenuClick,
}) => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return SEARCHABLE_MENU_ITEMS.filter(item =>
      item.label.toLowerCase().includes(query) ||
      item.keywords.some(keyword => keyword.toLowerCase().includes(query))
    ).slice(0, 8);
  }, [searchQuery]);

  useEffect(() => {
    if (showSearch) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showSearch]);

  // Close search modal on Escape key press (document-level)
  useEffect(() => {
    if (!showSearch) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSearch(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showSearch]);

  const handleSearchItemClick = (pageId: string) => {
    setShowSearch(false);
    setSearchQuery('');
    onNavigate?.(pageId);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredItems.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < filteredItems.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredItems.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleSearchItemClick(filteredItems[selectedIndex].id);
        }
        break;
      case 'Escape':
        setShowSearch(false);
        setSearchQuery('');
        break;
    }
  };

  const isActive = (id: string) => {
    if (id === 'orders') return activeItem === 'orders' || activeItem === 'all_orders' || activeItem === 'incomplete_orders';
    return activeItem === id;
  };

  return (
    <>
      {/* Bottom Navigation Bar - mobile only */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-around h-16 px-1 max-w-lg mx-auto">
            {/* Menu Button */}
            <button
              onClick={onMenuClick}
              className="flex flex-col items-center justify-center gap-0.5 min-w-[3rem] py-1 px-2 rounded-lg transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 font-['Roboto']">Menu</span>
            </button>

            {/* Search Button */}
            <button
              onClick={() => setShowSearch(true)}
              className="flex flex-col items-center justify-center gap-0.5 min-w-[3rem] py-1 px-2 rounded-lg transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 font-['Roboto']">Search</span>
            </button>

            {/* Add Product Button (centered, elevated) */}
            <button
              onClick={() => onNavigate?.('product-upload')}
              className="flex items-center justify-center w-12 h-12 -mt-4 rounded-full bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-lg shadow-blue-500/30 transition-transform active:scale-95"
              aria-label="Add product"
            >
              <Plus className="w-6 h-6" />
            </button>

            {/* Orders Button */}
            <button
              onClick={() => onNavigate?.('orders')}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[3rem] py-1 px-2 rounded-lg transition-colors ${
                isActive('orders') ? 'text-sky-500' : ''
              }`}
              aria-label="Orders"
            >
              <ShoppingCart className={`w-5 h-5 ${isActive('orders') ? 'text-sky-500' : 'text-gray-500 dark:text-gray-400'}`} />
              <span className={`text-[10px] font-medium font-['Roboto'] ${isActive('orders') ? 'text-sky-500' : 'text-gray-500 dark:text-gray-400'}`}>Orders</span>
            </button>

            {/* Back Button */}
            <button
              onClick={() => window.history.back()}
              className="flex flex-col items-center justify-center gap-0.5 min-w-[3rem] py-1 px-2 rounded-lg transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <span className="text-[10px] font-medium font-['Roboto'] text-gray-500 dark:text-gray-400">Back</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search Modal Overlay */}
      {showSearch && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" role="button" tabIndex={-1} aria-label="Close search" onClick={() => { setShowSearch(false); setSearchQuery(''); }} />
          <div className="relative flex flex-col h-full">
            {/* Search Header */}
            <div className="bg-white dark:bg-gray-800 p-4 shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-2.5 border border-gray-200 dark:border-gray-600">
                  <Search className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search pages..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setSelectedIndex(0); }}
                    onKeyDown={handleKeyDown}
                    className="bg-transparent flex-1 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none font-['Roboto']"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                  className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-['Roboto']"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800">
              {searchQuery.trim() && filteredItems.length > 0 ? (
                <div className="p-2">
                  {filteredItems.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => handleSearchItemClick(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-['Roboto'] ${
                        index === selectedIndex
                          ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-gray-400">{item.category}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchQuery.trim() && filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Search className="w-10 h-10 mb-3 opacity-50" />
                  <p className="text-sm font-['Roboto']">No results found</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Search className="w-10 h-10 mb-3 opacity-50" />
                  <p className="text-sm font-['Roboto']">Search for pages, settings, and more</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminBottomNav;
