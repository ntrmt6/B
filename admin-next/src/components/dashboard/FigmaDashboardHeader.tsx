import React, { useState, useRef, useEffect } from 'react'; 
import {
  Globe,
  PlayCircle,
  Search,
  Moon,
  Sun,
  MessageCircle,
  Bell,
  CheckCheck,
  Package,
  Star,
  Users,
  AlertCircle,
  Settings,
  X,
  ChevronDown,
  Building2,
  Check,
  Loader2,
  User,
  LogOut
} from 'lucide-react';
import { useDarkMode } from '../../context/DarkModeContext';
import { DashboardHeaderProps } from './types';
import { getStoreUrl, getPrimaryDomain } from '../../utils/appHelpers';

// Notification icon by type
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'order': return <Package className="w-4 h-4 text-blue-500" />;
    case 'review': return <Star className="w-4 h-4 text-yellow-500" />;
    case 'customer': return <Users className="w-4 h-4 text-green-500" />;
    case 'inventory': return <AlertCircle className="w-4 h-4 text-orange-500" />;
    case 'system': return <Settings className="w-4 h-4 text-gray-500" />;
    default: return <Bell className="w-4 h-4 text-gray-500" />;
  }
};

// Format time ago
const formatTimeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

// Tutorial video URLs by page
const TUTORIAL_VIDEOS: Record<string, string> = {
  'dashboard': 'https://www.youtube.com/watch?v=59b9ptwx0Js',
  'orders': 'https://www.youtube.com/watch?v=xxxxxxxxx',
  'products': 'https://www.youtube.com/watch?v=xxxxxxxxx',
  'inventory': 'https://www.youtube.com/watch?v=xxxxxxxxx',
  'customers_reviews': 'https://www.youtube.com/watch?v=xxxxxxxxx',
  'customization': 'https://www.youtube.com/watch?v=xxxxxxxxx',
  'landing_pages': 'https://www.youtube.com/watch?v=xxxxxxxxx',
  'store_studio': 'https://www.youtube.com/watch?v=xxxxxxxxx',
  'gallery': 'https://www.youtube.com/watch?v=xxxxxxxxx',
  'admin_control': 'https://www.youtube.com/watch?v=xxxxxxxxx',
  'business_report': 'https://www.youtube.com/watch?v=xxxxxxxxx',
  'activity_log': 'https://www.youtube.com/watch?v=xxxxxxxxx',
  'support': 'https://www.youtube.com/watch?v=xxxxxxxxx',
  'settings': 'https://www.youtube.com/watch?v=xxxxxxxxx',
  'default': 'https://www.youtube.com/watch?v=59b9ptwx0Js'
};

// Get store URL for tenant (uses centralized getStoreUrl from appHelpers)

// Searchable admin menu items
interface SearchMenuItem {
  id: string;
  label: string;
  keywords: string[]; // Additional search terms
  category: string;
}

const SEARCHABLE_MENU_ITEMS: SearchMenuItem[] = [
  // Main Menu
  { id: 'dashboard', label: 'Dashboard', keywords: ['home', 'overview', 'stats', 'analytics'], category: 'Main Menu' },
  { id: 'orders', label: 'Orders', keywords: ['order', 'purchase', 'sales', 'invoice'], category: 'Main Menu' },
  { id: 'products', label: 'All Products', keywords: ['product', 'item', 'listing', 'merchandise'], category: 'Products' },
  { id: 'product-upload', label: 'Add New Product', keywords: ['add product', 'upload', 'new product', 'create product', 'insert product'], category: 'Products' },
  { id: 'inventory', label: 'Inventory', keywords: ['stock', 'warehouse', 'quantity', 'manage stock'], category: 'Main Menu' },
  { id: 'customers_reviews', label: 'Customers & Reviews', keywords: ['customer', 'review', 'feedback', 'user', 'buyer', 'rating'], category: 'Main Menu' },
  
  // Catalog
  { id: 'catalog_categories', label: 'Categories', keywords: ['category', 'product category', 'section'], category: 'Catalog' },
  { id: 'catalog_subcategories', label: 'Sub Categories', keywords: ['subcategory', 'sub category', 'child category'], category: 'Catalog' },
  { id: 'catalog_childcategories', label: 'Child Categories', keywords: ['child category', 'nested category'], category: 'Catalog' },
  { id: 'catalog_brands', label: 'Brands', keywords: ['brand', 'manufacturer', 'company'], category: 'Catalog' },
  { id: 'catalog_tags', label: 'Tags', keywords: ['tag', 'label', 'keyword'], category: 'Catalog' },
  
  // Configuration
  { id: 'customization', label: 'Customization', keywords: ['customize', 'theme', 'design', 'appearance', 'look'], category: 'Configuration' },
  { id: 'store_studio', label: 'Store Studio', keywords: ['studio', 'builder', 'page builder', 'design'], category: 'Configuration' },
  { id: 'landing_pages', label: 'Landing Pages', keywords: ['landing', 'page', 'offer page', 'promo page', 'campaign'], category: 'Configuration' },
  { id: 'popups', label: 'Popups', keywords: ['popup', 'modal', 'notification popup', 'announcement'], category: 'Configuration' },
  { id: 'gallery', label: 'Gallery', keywords: ['image', 'photo', 'media', 'upload image', 'files'], category: 'Configuration' },
  
  // Business Report
  { id: 'business_report_expense', label: 'Business Report', keywords: ['report', 'analytics', 'expense', 'income', 'profit', 'loss'], category: 'Reports' },
  { id: 'business_report_purchase', label: 'Purchase Report', keywords: ['purchase', 'buy', 'procurement'], category: 'Reports' },
  { id: 'business_report_income', label: 'Income Report', keywords: ['income', 'revenue', 'earning'], category: 'Reports' },
  { id: 'business_report_due_book', label: 'Due Book', keywords: ['due', 'pending', 'receivable', 'payable'], category: 'Reports' },
  { id: 'business_report_profit_loss', label: 'Profit & Loss', keywords: ['profit', 'loss', 'margin', 'earning'], category: 'Reports' },
  
  // System
  { id: 'activity_log', label: '', keywords: ['activity', 'log', 'history', 'audit', 'actions'], category: 'System' },
  { id: 'support', label: 'Support', keywords: ['help', 'support', 'ticket', 'contact', 'assistance'], category: 'System' },
  { id: 'tutorial', label: 'Tutorial', keywords: ['tutorial', 'guide', 'help', 'learn', 'video'], category: 'System' },
  { id: 'profile', label: 'Profile', keywords: ['profile', 'account', 'my account', 'user info'], category: 'System' },
  { id: 'settings', label: 'Settings', keywords: ['settings', 'configuration', 'preferences', 'setup'], category: 'System' },
  { id: 'admin_control', label: 'Admin Control', keywords: ['admin', 'control', 'staff', 'roles', 'permissions'], category: 'System' },
  { id: 'billing', label: 'Billing & Subscription', keywords: ['billing', 'subscription', 'payment', 'plan', 'upgrade'], category: 'System' },

  // Analytics
  { id: 'online_now', label: 'Online Now / Visitors Analysis', keywords: ['online', 'visitors', 'traffic', 'sources', 'referrer', 'analytics', 'facebook', 'google', 'live'], category: 'Analytics' },
];



// Dark Mode Toggle Button Component
const DarkModeToggle: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  
  return (
    <button 
      onClick={toggleDarkMode}
      className="p-1.5 sm:p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md sm:rounded-lg transition-all"
      title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDarkMode ? (
        <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
      ) : (
        <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
      )}
    </button>
  );
};

const FigmaDashboardHeader: React.FC<DashboardHeaderProps> = ({
  tenantId,
  tenantSubdomain,
  currentPage = 'dashboard',
  user,
  searchQuery,
  onSearchChange,
  onSearch,
  onNavigate,
  onLogout,
  // Notification props
  notificationCount = 0,
  onNotificationClick,
  notifications = [],
  onMarkNotificationRead,
  onOrderNotificationClick,
  // Chat props
  unreadChatCount = 0,
  onChatClick,
  // Tenant switcher props
  tenants = [],
  activeTenantId,
  onTenantChange,
  isTenantSwitching,
  userRole
}) => {
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showTenantDropdown, setShowTenantDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [tenantSearch, setTenantSearch] = useState('');
  const notificationRef = useRef<HTMLDivElement>(null);
  const tenantDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const isSuperAdmin = userRole === 'super_admin';
  const selectedTenant = tenants.find(t => t.id === activeTenantId || t._id === activeTenantId);
  const filteredTenants = tenantSearch.trim()
    ? tenants.filter(t => t.name.toLowerCase().includes(tenantSearch.toLowerCase()) || t.subdomain.toLowerCase().includes(tenantSearch.toLowerCase()))
    : tenants;

  // Close tenant dropdown on outside click
  useEffect(() => {
    if (!showTenantDropdown) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (tenantDropdownRef.current && !tenantDropdownRef.current.contains(event.target as Node)) {
        setShowTenantDropdown(false);
        setTenantSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTenantDropdown]);
  useEffect(() => {
    if (!showProfileDropdown) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileDropdown]);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const profileImage = user?.image || user?.avatar;

  const handleProfileAction = (action: 'profile' | 'settings' | 'logout') => {
    setShowProfileDropdown(false);
    if (action === 'logout') {
      onLogout?.();
      return;
    }
    onNavigate?.(action === 'profile' ? 'settings_profile' : action);
  };

  // Filter menu items based on search query
  const filteredItems = React.useMemo(() => {
    if (!localSearchQuery.trim()) return [];
    const query = localSearchQuery.toLowerCase();
    return SEARCHABLE_MENU_ITEMS.filter(item => 
      item.label.toLowerCase().includes(query) ||
      item.keywords.some(keyword => keyword.toLowerCase().includes(query))
    ).slice(0, 8); // Limit to 8 results
  }, [localSearchQuery]);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };

    if (showSearchDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSearchDropdown]);

  // Handle search input change
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchQuery(value);
    setShowSearchDropdown(value.length > 0);
    setSelectedIndex(0);
    onSearchChange?.(value);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSearchDropdown || filteredItems.length === 0) return;
    
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
        setShowSearchDropdown(false);
        searchInputRef.current?.blur();
        break;
    }
  };

  // Handle search item click
  const handleSearchItemClick = (pageId: string) => {
    setShowSearchDropdown(false);
    setLocalSearchQuery('');
    onNavigate?.(pageId);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotificationDropdown(false);
      }
    };

    if (showNotificationDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotificationDropdown]);

  const handleNotificationBellClick = () => {
    setShowNotificationDropdown(!showNotificationDropdown);
    onNotificationClick?.();
  };

  const handleMarkAllRead = () => {
    onMarkNotificationRead?.();
    setShowNotificationDropdown(false);
  };

  return (
    <div className="w-full bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 transition-colors duration-300">
      <div className="flex items-center justify-between gap-1 xs:gap-2">
        {/* Welcome Section - Compact on mobile, expanded on desktop */}
        <div className="flex-1 min-w-0">
          <h1 className="text-xs xs:text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white truncate font-['Roboto']">
            Welcome, {user?.name || 'Yuvraj'}
          </h1>
          <p className="text-[9px] xs:text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 hidden xs:block font-['Roboto']">
            Monitor your business.
          </p>
        </div>

        {/* Super Admin Tenant Switcher */}
        {isSuperAdmin && tenants.length > 0 && onTenantChange && (
          <div className="relative flex-shrink-0 hidden sm:block" ref={tenantDropdownRef}>
            <button
              type="button"
              onClick={() => { setShowTenantDropdown(prev => !prev); setTenantSearch(''); }}
              disabled={isTenantSwitching}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-all min-w-[180px] max-w-[280px]"
              style={{ cursor: isTenantSwitching ? 'wait' : 'pointer' }}
            >
              <Building2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <div className="text-left flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500">Switch Tenant</p>
                <p className="text-sm font-semibold truncate text-gray-900 dark:text-white">
                  {selectedTenant?.name || 'Select Tenant'}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {isTenantSwitching && <Loader2 size={14} className="animate-spin text-blue-500" />}
                <ChevronDown size={14} className={`text-gray-400 transition-transform ${showTenantDropdown ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {showTenantDropdown && (
              <div className="absolute left-0 sm:left-0 top-full mt-1 w-[calc(100vw-2rem)] sm:w-[320px] max-w-[320px] rounded-xl z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-2xl right-0 sm:right-auto">
                {/* Search */}
                <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search tenants..."
                      value={tenantSearch}
                      onChange={(e) => setTenantSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 outline-none text-gray-900 dark:text-white placeholder-gray-400"
                      autoFocus
                    />
                  </div>
                </div>
                {/* Tenant List */}
                <div className="max-h-[300px] overflow-y-auto p-1.5">
                  {filteredTenants.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No tenants found</p>
                  ) : (
                    filteredTenants.map((tenant) => {
                      const isActive = tenant.id === activeTenantId || tenant._id === activeTenantId;
                      return (
                        <button
                          key={tenant.id || tenant._id}
                          type="button"
                          onClick={() => {
                            if (!isActive) onTenantChange(tenant.id || tenant._id || '');
                            setShowTenantDropdown(false);
                            setTenantSearch('');
                          }}
                          disabled={isTenantSwitching}
                          className={`w-full text-left rounded-lg px-3 py-2.5 transition flex items-center justify-between gap-2 ${
                            isActive
                              ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-semibold truncate ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
                              {tenant.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{tenant.subdomain}.{getPrimaryDomain()}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              {tenant.plan && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                  tenant.plan === 'enterprise' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                                  tenant.plan === 'growth' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' :
                                  'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                }`}>{tenant.plan}</span>
                              )}
                              {tenant.status && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                  tenant.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
                                  tenant.status === 'trialing' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' :
                                  'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                }`}>{tenant.status}</span>
                              )}
                            </div>
                          </div>
                          {isActive && <Check size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
                {/* Footer */}
                <div className="p-2 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">{tenants.length} tenant{tenants.length !== 1 ? 's' : ''} available</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-1 sm:flex-none justify-end">
        
          {/* View Website Button */}
          {tenantSubdomain ? (
            <a
              href={getStoreUrl(tenantSubdomain)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-sky-400 to-blue-500 text-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg hover:opacity-90 transition-opacity shadow-sm"
            >
              <Globe className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-medium hidden xs:inline font-['Roboto']">View Website</span>
            </a>
          ) : (
            <span 
              className="flex items-center gap-1 sm:gap-2 bg-gray-300 text-gray-500 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg cursor-not-allowed"
              title="Loading store..."
            >
              <Globe className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-medium hidden xs:inline font-['Roboto']">Loading...</span>
            </span>
          )}

          {/* Tutorials Button */}
          <button 
            onClick={() => setShowTutorialModal(true)}
            className="flex items-center gap-1 sm:gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <PlayCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
            <span className="text-xs sm:text-sm font-medium hidden sm:inline font-['Roboto']">Tutorials</span>
          </button>

          {/* Search Bar with Dropdown - visible on all screens */}
          <div className="relative hidden xs:block md:block" ref={searchRef}>
            <div className={`relative flex items-center bg-gray-50 dark:bg-gray-700 rounded-md sm:rounded-lg px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 w-8 xs:w-28 sm:w-36 md:w-40 lg:w-64 xl:w-72 border ${showSearchDropdown && filteredItems.length > 0 ? 'border-blue-300 ring-2 ring-blue-100 dark:ring-blue-900' : 'border-gray-100 dark:border-gray-600'} transition-all focus-within:w-40 xs:focus-within:w-40 sm:focus-within:w-48`}>
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-400 mr-2 sm:mr-3" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search pages..."
                value={localSearchQuery}
                onChange={handleSearchInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => localSearchQuery && setShowSearchDropdown(true)}
                className="bg-transparent flex-1 text-xs sm:text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none font-['Roboto']"
              />
              {localSearchQuery && (
                <button 
                  onClick={() => { setLocalSearchQuery(''); setShowSearchDropdown(false); }}
                  className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              )}
            </div>
            
            {/* Search Dropdown Results */}
            {showSearchDropdown && filteredItems.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden max-h-80 overflow-y-auto">
                {/* Group by category */}
                {(() => {
                  const grouped: Record<string, typeof filteredItems> = {};
                  filteredItems.forEach(item => {
                    if (!grouped[item.category]) grouped[item.category] = [];
                    grouped[item.category].push(item);
                  });
                  
                  let globalIndex = 0;
                  return Object.entries(grouped).map(([category, items]) => (
                    <div key={category}>
                      <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-900">
                        {category}
                      </div>
                      {items.map((item) => {
                        const currentIndex = globalIndex++;
                        return (
                          <div
                            key={currentIndex}
                            onClick={() => handleSearchItemClick(item.id)}
                            className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                              selectedIndex === currentIndex 
                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-lg flex items-center justify-center">
                              <Search className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm font-medium truncate ${selectedIndex === currentIndex ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'}`}>
                                {item.label}
                              </div>
                            </div>
                            {selectedIndex === currentIndex && (
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">Enter</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ));
                })()}
                
                {/* Footer hint */}
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500">
                  <span>↑↓ to navigate</span>
                  <span>Enter to select</span>
                  <span>Esc to close</span>
                </div>
              </div>
            )}
            
            {/* No results message */}
            {showSearchDropdown && localSearchQuery && filteredItems.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 z-50 p-4 text-center">
                <Search className="w-6 h-6 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No pages found for "{localSearchQuery}"</p>
              </div>
            )}
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-0.5 sm:gap-1 md:gap-1 xs:gap-2">
            <DarkModeToggle />
            
            {/* Chat Button */}
            <button 
              onClick={onChatClick}
              className="p-1.5 sm:p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md sm:rounded-lg transition-all relative"
              title="Messages"
            >
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadChatCount > 0 && (
                <span className="absolute -top-0.5 sm:-top-1 -right-0.5 sm:-right-1 w-3 h-3 sm:w-4 sm:h-4 bg-red-500 text-white text-[8px] sm:text-[10px] rounded-full flex items-center justify-center">
                  {unreadChatCount > 9 ? '9+' : unreadChatCount}
                </span>
              )}
            </button>
            
            {/* Notification Button with Dropdown */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={handleNotificationBellClick}
                className="p-1.5 sm:p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md sm:rounded-lg transition-all relative"
                title="Notifications"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-0.5 sm:-top-1 -right-0.5 sm:-right-1 w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 text-white text-[8px] sm:text-[10px] rounded-full flex items-center justify-center">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>
              
              {/* Notification Dropdown */}
              {showNotificationDropdown && (
                <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] xs:w-80 max-w-[320px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
                  <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Notifications</h3>
                    {notificationCount > 0 && (
                      <button 
                        onClick={handleMarkAllRead}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <CheckCheck className="w-3 h-3" />
                        Mark all read
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                        <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                        No notifications yet
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((notification) => (
                        <div 
                          key={notification._id}
                          className={`p-3 border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                            !notification.isRead ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                          }`}
                          onClick={() => {
                            // Mark as read
                            onMarkNotificationRead?.([notification._id]);
                            // If it's an order notification, open order details
                            if (notification.type === 'order' && notification.data?.orderId && onOrderNotificationClick) {
                              onOrderNotificationClick(notification.data.orderId);
                              setShowNotificationDropdown(false);
                            }
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${!notification.isRead ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                {formatTimeAgo(notification.createdAt)}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {notifications.length > 10 && (
                    <div className="p-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-center">
                      <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                        View all notifications
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* User Profile */}
          <div className="relative ml-1 sm:ml-2 pl-2 sm:pl-3 md:pl-4 border-l border-gray-200 dark:border-gray-700" ref={profileDropdownRef}>
            <button
              type="button"
              onClick={() => setShowProfileDropdown(prev => !prev)}
              className="flex items-center gap-1.5 sm:gap-2 md:gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg px-1.5 py-1 transition-colors"
            >
              <div className="text-right hidden sm:block">
                <div className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 font-['Roboto']">Admin</div>
                <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate max-w-[60px] sm:max-w-[80px] md:max-w-none font-['Roboto']">{user?.name || 'Yuvraj'}</div>
              </div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center overflow-hidden">
                {profileImage ? (
                  <img src={profileImage} alt={user?.name || 'Profile'} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs sm:text-sm font-bold text-white">
                    {(user?.name || 'Y').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-500 dark:text-gray-400 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showProfileDropdown && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
                <button
                  onClick={() => handleProfileAction('profile')}
                  className="w-full px-3 py-2.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Go to Profile
                </button>
                <button
                  onClick={() => handleProfileAction('settings')}
                  className="w-full px-3 py-2.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Update Info
                </button>
                <button
                  onClick={() => handleProfileAction('logout')}
                  className="w-full px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 border-t border-gray-100 dark:border-gray-700"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Tutorial Video Modal */}
      {showTutorialModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-2 sm:p-4" onClick={() => setShowTutorialModal(false)}>
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-7xl overflow-hidden max-h-[95vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 dark:bg-red-900/30 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white">Tutorial Video</h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden xs:block">Learn how to use this feature</p>
                </div>
              </div>
              <button 
                onClick={() => setShowTutorialModal(false)}
                className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Video Container - Responsive */}
            <div className="w-full bg-black flex-1" style={{ minHeight: '200px', maxHeight: '70vh' }}>
              <iframe
                width="100%"
                height="100%"
                src={(() => {
                  const videoUrl = TUTORIAL_VIDEOS[currentPage] || TUTORIAL_VIDEOS['default'];
                  // Convert watch URL to embed URL
                  const videoId = videoUrl.includes('watch?v=') 
                    ? videoUrl.split('watch?v=')[1]?.split('&')[0]
                    : videoUrl.split('/').pop();
                  return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
                })()}
                title="Tutorial Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ width: '100%', height: '100%' }}
              />
            </div>
            
            {/* Modal Footer */}
            <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 flex items-center justify-between flex-shrink-0">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Need more help? Visit our <a href="#" className="text-blue-600 hover:underline">Help Center</a>
              </p>
              <button 
                onClick={() => setShowTutorialModal(false)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium text-xs sm:text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FigmaDashboardHeader;
