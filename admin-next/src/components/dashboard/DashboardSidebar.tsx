import React, { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  ChevronRight,
  Palette,
  FileText,
  Bell,
  CreditCard,
  Truck,
  Image,
  Target,
  Boxes,
  ClipboardList,
  Globe,
  Shield,
  Activity,
  GraduationCap,
  Sparkles,
  Play,
  Store
} from 'lucide-react';
import { PermissionMap } from './types';
import { useLanguage } from '../../context/LanguageContext';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  badge?: string | number;
  hasDropdown?: boolean;
  children?: SidebarItem[];
  resource?: string; // Resource name for permission checking
}

interface DashboardSidebarProps {
  activeItem?: string;
  onNavigate?: (item: string) => void;
  onLogoutClick?: () => void;
  className?: string;
  userRole?: string;
  permissions?: PermissionMap;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Map menu item IDs to permission resources
const itemResourceMap: Record<string, string> = {
  'dashboard': 'dashboard',
  'orders': 'orders',
  'products': 'products',
  'product-upload': 'products',
  'product-media': 'products',
  'catalog': 'catalog',
  'catalog_categories': 'catalog',
  'catalog_subcategories': 'catalog',
  'catalog_childcategories': 'catalog',
  'catalog_brands': 'catalog',
  'catalog_tags': 'catalog',
  'inventory': 'inventory',
  // 'purchases': 'business_report',
  'vendors': 'vendors',
  'customers_reviews': 'customers',
  'customization': 'customization',
  'website_content': 'customization',
  'website_info': 'customization',
  'website_content_carousel': 'customization',
  'website_content_banners': 'customization',
  'website_content_popups': 'landing_pages',
  'website_content_landing_page': 'landing_pages',
  'chat_settings': 'customization',
  'gallery': 'gallery',
  'business_report': 'business_report',
  'settings': 'settings',
  'admin_control': 'admin_control',
  'activity_log': 'settings',
  'billing': 'settings',
  'incomplete_orders': 'orders',
  'all_orders': 'orders',
  'store_studio': 'customization',
  'store_stories': 'customization',
};

const menuItems: SidebarItem[] = [
  // Main Menu
  { id: 'dashboard', label: 'Dashboard', icon: <img src="https://res.cloudinary.com/dvierzkzj/image/upload/v1778855167/dashboard-square-01_elirua.svg" alt="Dashboard" className="w-5 h-5 object-contain" /> },
  { 
    id: 'orders', 
    label: 'Orders', 
    icon: <img src="https://res.cloudinary.com/dvierzkzj/image/upload/v1778855398/invoice_corzfo.svg" alt="Orders" className="w-5 h-5 object-contain" />,
    hasDropdown: true,
    children: [
      { id: 'all_orders', label: 'All Orders', icon: <ChevronRight className="w-4 h-4" /> },
      { id: 'incomplete_orders', label: 'Incomplete Orders', icon: <ChevronRight className="w-4 h-4" /> },
    ]
  },
  {
    id: 'products',
    label: 'Products',
    icon: <img src="https://res.cloudinary.com/dvierzkzj/image/upload/v1778855518/icon-park_ad-product_h0adix.svg" alt="Products" className="w-5 h-5 object-contain" />,
    hasDropdown: true,
    children: [
      { id: 'products', label: 'Manage Products', icon: <ChevronRight className="w-4 h-4" /> },
      { id: 'product-upload', label: 'Add New Product', icon: <ChevronRight className="w-4 h-4" /> },
      { id: 'product-media', label: 'Media Center', icon: <ChevronRight className="w-4 h-4" /> },
    ]
  },
  { 
    id: 'catalog', 
    label: 'Catalog', 
    icon: <img src="https://res.cloudinary.com/dvierzkzj/image/upload/v1778855600/hugeicons_catalogue_mgkmo6.svg" alt="Catalog" className="w-5 h-5 object-contain" />, 
    hasDropdown: true,
    children: [
      { id: 'catalog_categories', label: 'Category', icon: <ChevronRight className="w-4 h-4" /> },
      { id: 'catalog_subcategories', label: 'Sub Category', icon: <ChevronRight className="w-4 h-4" /> },
      { id: 'catalog_childcategories', label: 'Child Category', icon: <ChevronRight className="w-4 h-4" /> },
      { id: 'catalog_brands', label: 'Brands', icon: <ChevronRight className="w-4 h-4" /> },
      { id: 'catalog_tags', label: 'Tags', icon: <ChevronRight className="w-4 h-4" /> },
    ]
  },
  { id: 'inventory', label: 'Inventory', icon: <img src="https://res.cloudinary.com/dvierzkzj/image/upload/v1778855699/note_1_hqs7wa.svg" alt="Inventory" className="w-5 h-5 object-contain" /> },
  // { id: 'purchases', label: 'Purchase', icon: <ShoppingCart className="w-5 h-5" /> },
  { id: 'vendors', label: 'Vendors', icon: <Store className="w-5 h-5" /> },
  { id: 'customers_reviews', label: 'Customers & review', icon: <img src="https://res.cloudinary.com/dvierzkzj/image/upload/v1778855783/user-group_kg9fdn.svg" alt="Customers & review" className="w-5 h-5 object-contain" /> },
  
  // Configuration
  { id: 'customization', label: 'Customization', icon: <img src="https://res.cloudinary.com/dvierzkzj/image/upload/v1778856629/arcticons_galaxy-themes_nkkvrg.svg" alt="Customization" className="w-5 h-5 object-contain" /> },
  { 
    id: 'website_content', 
    label: 'Website Content', 
    icon: <img src="https://res.cloudinary.com/dvierzkzj/image/upload/v1779298721/c66e3f42-9e1a-4cf0-9eca-5755f6286d6a.png" alt="Website Content" className="w-5 h-5 object-contain" />, 
    hasDropdown: true,
    children: [
      { id: 'website_info', label: 'Website', icon: <ChevronRight className="w-4 h-4" /> },
      { id: 'website_content_carousel', label: 'Carousel', icon: <ChevronRight className="w-4 h-4" /> },
      { id: 'website_content_banners', label: 'Campaigns', icon: <ChevronRight className="w-4 h-4" /> },
      { id: 'website_content_popups', label: 'Popups', icon: <ChevronRight className="w-4 h-4" /> },
      { id: 'chat_settings', label: 'Chat', icon: <ChevronRight className="w-4 h-4" /> },
      { id: 'website_content_landing_page', label: 'Landing Page', icon: <ChevronRight className="w-4 h-4" /> },
    ]
  },
  { id: 'gallery', label: 'Gallery', icon: <img src="https://res.cloudinary.com/dvierzkzj/image/upload/v1779298742/9def97a7-5490-49cb-b52d-8f278493d7d8.png" alt="Gallery" className="w-5 h-5 object-contain" /> },
  { id: 'business_report', label: 'Business Report', icon: <img src="https://res.cloudinary.com/dvierzkzj/image/upload/v1779298857/8ee7bd93-71f6-436c-8a92-986bc8650ac7.png" alt="Business Report" className="w-5 h-5 object-contain" /> },
  { id: 'store_studio', label: 'Store Studio Beta', icon: <Sparkles className="w-5 h-5" /> },
  { id: 'store_stories', label: 'Video Stories', icon: <Play className="w-5 h-5" /> },
  
  // System
  { id: 'settings', label: 'Settings', icon: <img src="https://res.cloudinary.com/dvierzkzj/image/upload/v1779298909/b524b491-479d-4541-90d5-899468d6c4d6.png" alt="Settings" className="w-5 h-5 object-contain" /> },
  { id: 'admin_control', label: 'Admin Control', icon:<img src="https://res.cloudinary.com/dvierzkzj/image/upload/v1779298927/45a61b9d-c826-4bfe-a48b-8ac5b65cf3e9.png" alt="Admin Control" className="w-5 h-5 object-contain" /> },
  { id: 'activity_log', label: 'Activity Log', icon: <img src="https://res.cloudinary.com/dvierzkzj/image/upload/v1779298979/1b5daab2-6541-488c-90ff-8196f4a189e7.png" alt="Activity Log" className="w-5 h-5 object-contain" /> },
  { id: 'billing', label: 'Billing & Subscription', icon: <img src="https://res.cloudinary.com/dvierzkzj/image/upload/v1779299004/b35c29e8-33cf-46db-ae9a-304fc0144d9c.png" alt="Billing & Subscription" className="w-5 h-5 object-contain" /> },
  { id: 'support', label: 'Support', icon: <img src="https://res.cloudinary.com/dvierzkzj/image/upload/v1779299018/53086426-3d6c-42df-8d16-eccff4eb037f.png" alt="Support" className="w-5 h-5 object-contain" /> },
  { id: 'tutorial', label: 'Tutorial', icon: <img src="https://res.cloudinary.com/dvierzkzj/image/upload/v1779299023/f6992110-02a9-413a-ac49-a2fa2f825d2e.png" alt="Tutorial" className="w-5 h-5 object-contain" /> },
];

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  activeItem = 'dashboard',
  onNavigate,
  onLogoutClick,
  className = '',
  userRole,
  permissions
}) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { t } = useLanguage();

  // Check if user can access a menu item
  const canAccess = (itemId: string): boolean => {
    // Support, tutorial are always accessible
    if (['support', 'tutorial'].includes(itemId)) return true;

    // If no role specified, show all items (assume admin access)
    // Real security is enforced on backend
    if (!userRole) return true;

    // Super admin can access everything
    if (userRole === 'super_admin') return true;

    // Admin can access everything (they manage their own site)
    if (userRole === 'admin') return true;

    // Tenant admin can access everything for their tenant
    if (userRole === 'tenant_admin') return true;

    // Staff - check permissions
    if (userRole === 'staff') {
      const resource = itemResourceMap[itemId];
      if (!resource) return false; // Hide items without explicit resource mapping
      
      if (permissions && permissions[resource]) {
        return permissions[resource].includes('read');
      }
      return false;
    }

    // For any other role (e.g., customer shouldn't be in admin), hide restricted items
    return false;
  };

  // Create translated menu items
  const translatedMenuItems: SidebarItem[] = useMemo(() => [
    { id: 'dashboard', label: t('dashboard'), icon: <img src="https://res.cloudinary.com/dvierzkzj/image/upload/v1778855167/dashboard-square-01_elirua.svg" alt="Dashboard" className="w-5 h-5 object-contain" /> },
    { 
      id: 'orders', 
      label: t('orders'), 
      icon: <img src="https://res.cloudinary.com/dvierzkzj/image/upload/v1778855398/invoice_corzfo.svg" alt="Orders" className="w-5 h-5 object-contain" />,
      hasDropdown: true,
      children: [
        { id: 'all_orders', label: 'All Orders', icon: <ChevronRight className="w-4 h-4" /> },
        { id: 'incomplete_orders', label: 'Incomplete Orders', icon: <ChevronRight className="w-4 h-4" /> },
      ]
    },
    {
      id: 'products',
      label: t('products'),
      icon: <img src="https://res.cloudinary.com/dvierzkzj/image/upload/v1778855518/icon-park_ad-product_h0adix.svg" alt="Products" className="w-5 h-5 object-contain" />,
      hasDropdown: true,
      children: [
        { id: 'products', label: t('manage_products'), icon: <ChevronRight className="w-4 h-4" /> },
        { id: 'product-upload', label: t('add_new_product'), icon: <ChevronRight className="w-4 h-4" /> },
        { id: 'product-media', label: t('media_center'), icon: <ChevronRight className="w-4 h-4" /> },
      ]
    },
    { 
      id: 'catalog', 
      label: t('catalog'), 
      icon: <img src="https://res.cloudinary.com/dvierzkzj/image/upload/v1778855600/hugeicons_catalogue_mgkmo6.svg" alt="Catalog" className="w-5 h-5 object-contain" />,
      hasDropdown: true,
      children: [
        { id: 'catalog_categories', label: t('category'), icon: <ChevronRight className="w-4 h-4" /> },
        { id: 'catalog_subcategories', label: t('sub_category'), icon: <ChevronRight className="w-4 h-4" /> },
        { id: 'catalog_childcategories', label: t('child_category'), icon: <ChevronRight className="w-4 h-4" /> },
        { id: 'catalog_brands', label: t('brands'), icon: <ChevronRight className="w-4 h-4" /> },
        { id: 'catalog_tags', label: t('tags'), icon: <ChevronRight className="w-4 h-4" /> },
      ]
    },
    { id: 'inventory', label: t('inventory'), icon: <img src="https://res.cloudinary.com/dvierzkzj/image/upload/v1778855699/note_1_hqs7wa.svg" alt="Inventory" className="w-5 h-5 object-contain" /> },
    // { id: 'purchases', label: t('purchase') || 'Purchase', icon: <ShoppingCart className="w-5 h-5" /> },
    { id: 'customers_reviews', label: t('customers_reviews'), icon: <img src="https://res.cloudinary.com/dvierzkzj/image/upload/v1778855783/user-group_kg9fdn.svg" alt="Customers & review" className="w-5 h-5 object-contain" /> },
    { id: 'customization', label: t('customization'), icon: <img src="https://res.cloudinary.com/dyvpha1zp/image/upload/v1779281468/arcticons_galaxy-themes_lfa6nf.svg" alt="Customization" className="w-5 h-5 object-contain" /> },
    { 
      id: 'website_content', 
      label: t('website_content'), 
      icon: <img src="https://res.cloudinary.com/dvierzkzj/image/upload/v1779298721/c66e3f42-9e1a-4cf0-9eca-5755f6286d6a.png" alt="Website Content" className="w-5 h-5 object-contain" />,
      hasDropdown: true,
      children: [
        { id: 'website_info', label: t('website_info'), icon: <ChevronRight className="w-4 h-4" /> },
        { id: 'website_content_carousel', label: t('carousel'), icon: <ChevronRight className="w-4 h-4" /> },
        { id: 'website_content_banners', label: t('campaigns'), icon: <ChevronRight className="w-4 h-4" /> },
        { id: 'website_content_popups', label: t('popups'), icon: <ChevronRight className="w-4 h-4" /> },
        { id: 'chat_settings', label: t('chat'), icon: <ChevronRight className="w-4 h-4" /> },
        { id: 'website_content_landing_page', label: t('landing_pages'), icon: <ChevronRight className="w-4 h-4" /> },
      ]
    },
    { id: 'gallery', label: t('gallery'), icon: <img src="https://res.cloudinary.com/dvierzkzj/image/upload/v1779298742/9def97a7-5490-49cb-b52d-8f278493d7d8.png" alt="Gallery" className="w-5 h-5 object-contain" /> },
    { id: 'business_report', label: t('business_report'), icon: <img src="https://res.cloudinary.com/dvierzkzj/image/upload/v1779298857/8ee7bd93-71f6-436c-8a92-986bc8650ac7.png" alt="Business Report" className="w-5 h-5 object-contain" /> },
    { id: 'store_studio', label: 'Store Studio Beta', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'store_stories', label: t('video_stories') || 'Video Stories', icon: <Play className="w-5 h-5" /> },
    { id: 'settings', label: t('settings'), icon: <img src="https://res.cloudinary.com/dvierzkzj/image/upload/v1779298909/b524b491-479d-4541-90d5-899468d6c4d6.png" alt="Settings" className="w-5 h-5 object-contain" /> },
    { id: 'admin_control', label: t('admin_control'), icon:<img src="https://res.cloudinary.com/dvierzkzj/image/upload/v1779298927/45a61b9d-c826-4bfe-a48b-8ac5b65cf3e9.png" alt="Admin Control" className="w-5 h-5 object-contain" /> },
    { id: 'activity_log', label: t('activity_log'), icon: <img src="https://res.cloudinary.com/dvierzkzj/image/upload/v1779298979/1b5daab2-6541-488c-90ff-8196f4a189e7.png" alt="Activity Log" className="w-5 h-5 object-contain" /> },
    { id: 'billing', label: t('billing'), icon: <img src="https://res.cloudinary.com/dvierzkzj/image/upload/v1779299004/b35c29e8-33cf-46db-ae9a-304fc0144d9c.png" alt="Billing & Subscription" className="w-5 h-5 object-contain" /> },
    { id: 'support', label: t('support'), icon: <img src="https://res.cloudinary.com/dvierzkzj/image/upload/v1779299018/53086426-3d6c-42df-8d16-eccff4eb037f.png" alt="Support" className="w-5 h-5 object-contain" /> },
    { id: 'tutorial', label: t('tutorial'), icon: <img src="https://res.cloudinary.com/dvierzkzj/image/upload/v1779299023/f6992110-02a9-413a-ac49-a2fa2f825d2e.png" alt="Tutorial" className="w-5 h-5 object-contain" /> },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [t]);

  useEffect(() => {
    const parentByChild: Record<string, string> = {
      products: 'products',
      all_orders: 'orders',
      incomplete_orders: 'orders',
      'product-upload': 'products',
      'product-media': 'products',
      catalog_categories: 'catalog',
      catalog_subcategories: 'catalog',
      catalog_childcategories: 'catalog',
      catalog_brands: 'catalog',
      catalog_tags: 'catalog',
      website_info: 'website_content',
      website_content_carousel: 'website_content',
      website_content_banners: 'website_content',
      website_content_popups: 'website_content',
      chat_settings: 'website_content',
      website_content_landing_page: 'website_content',
    };

    const parentId = parentByChild[activeItem];
    if (!parentId) {
      return;
    }

    setExpandedItems((prev) => (prev.includes(parentId) ? prev : [...prev, parentId]));
  }, [activeItem]);

  // Filter menu items based on permissions
  const filteredMenuItems = useMemo(() => {
    return translatedMenuItems.filter(item => {
      // Check if user can access this item
      if (!canAccess(item.id)) return false;

      // For items with children, filter children and only show if at least one child is accessible
      if (item.children && item.children.length > 0) {
        const accessibleChildren = item.children.filter(child => canAccess(child.id));
        if (accessibleChildren.length === 0) return false;
        // Return new item with filtered children (don't mutate original)
        return true;
      }

      return true;
    }).map(item => {
      // Return items with filtered children
      if (item.children && item.children.length > 0) {
        return {
          ...item,
          children: item.children.filter(child => canAccess(child.id))
        };
      }
      return item;
    });
  }, [userRole, permissions]);

  // Define menu categories by item IDs
  const mainMenuIds = ['dashboard', 'orders', 'products', 'catalog', 'inventory', 'purchases', 'customers_reviews'];
  const configIds = ['customization', 'website_content', 'gallery', 'business_report', 'store_studio', 'store_stories'];
  const systemIds = ['settings', 'admin_control', 'activity_log', 'billing', 'support', 'tutorial'];

  // Group filtered items by category
  const mainMenuItems = filteredMenuItems.filter(item => mainMenuIds.includes(item.id));
  const configMenuItems = filteredMenuItems.filter(item => configIds.includes(item.id));
  const systemMenuItems = filteredMenuItems.filter(item => systemIds.includes(item.id));

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleItemClick = (itemId: string, hasDropdown?: boolean, children?: SidebarItem[]) => {
    // If item has dropdown with children, toggle expansion
    if (hasDropdown && children && children.length > 0) {
      toggleExpanded(itemId);
      return;
    }
    
    onNavigate?.(itemId);
  };

  const renderMenuItem = (item: SidebarItem) => {
    // For catalog, check if activeItem starts with 'catalog_'
    // For website_content, check if activeItem starts with 'website_content_'
    // For orders, check if activeItem is 'orders', 'all_orders', or 'incomplete_orders'
    // For products, check if activeItem is 'products', 'product-upload', or 'product-media'
    const isActive = item.id === 'catalog' 
      ? activeItem.startsWith('catalog_') 
      : item.id === 'website_content'
        ? activeItem.startsWith('website_content_')
        : item.id === 'orders'
          ? activeItem === 'orders' || activeItem === 'all_orders' || activeItem === 'incomplete_orders'
          : item.id === 'products'
            ? activeItem === 'products' || activeItem === 'product-upload' || activeItem === 'product-media'
          : activeItem === item.id;
    
    const isExpanded = expandedItems.includes(item.id);
    const hasChildren = item.children && item.children.length > 0;
    
    return (
      <div key={item.id}>
        <button
          onClick={() => handleItemClick(item.id, item.hasDropdown, item.children)}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 group font-['Roboto'] ${
            isActive 
              ? 'bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-sm' 
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <span className={isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'}>
            {item.icon}
          </span>
          <span className="flex-1 text-left text-[13px] font-medium">{item.label}</span>
          {item.badge && (
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
              isActive ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600'
            }`}>
              {item.badge}
            </span>
          )}
          {hasChildren && (
            <ChevronDown 
              className={`w-4 h-4 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              } ${isActive ? 'text-white' : 'text-gray-400'}`} 
            />
          )}
        </button>
        
        {/* Dropdown children */}
        {hasChildren && isExpanded && (
          <div className="ml-3 mt-0.5 space-y-0.5 border-l-2 border-gray-100 dark:border-gray-700">
            {item.children!.map(child => {
              const isChildActive = activeItem === child.id;
              return (
                <button
                  key={child.id}
                  onClick={() => onNavigate?.(child.id)}
                  className={`w-full flex items-center gap-2 pl-3 pr-3 py-1.5 rounded-r-lg transition-all duration-200 font-['Roboto'] ${
                    isChildActive 
                      ? 'text-sky-500 bg-sky-50 dark:bg-sky-900/20 font-medium' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className={isChildActive ? 'text-sky-500' : 'text-gray-400'}>
                    {child.icon}
                  </span>
                  <span className="text-[12px]">{child.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className={`space-y-1 ${className}`}>
      {/* Main Menu Section */}
      {mainMenuItems.length > 0 && (
        <div className="mb-4">
          <p className="px-3 mb-1.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider font-['Roboto']">
            Main Menu
          </p>
          <div className="space-y-0.5">
            {mainMenuItems.map(renderMenuItem)}
          </div>
        </div>
      )}
      
      {/* Configuration Section */}
      {configMenuItems.length > 0 && (
        <div className="mb-4">
          <p className="px-3 mb-1.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider font-['Roboto']">
            Configuration
          </p>
          <div className="space-y-0.5">
            {configMenuItems.map(renderMenuItem)}
          </div>
        </div>
      )}

      {/* System Section */}
      {systemMenuItems.length > 0 && (
        <div className="mb-4">
          <p className="px-3 mb-1.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider font-['Roboto']">
            System
          </p>
          <div className="space-y-0.5">
            {systemMenuItems.map(renderMenuItem)}
          </div>
        </div>
      )}

      
      {/* Logout */}
      <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={() => onLogoutClick?.()}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-['Roboto']"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-[13px] font-medium">Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default DashboardSidebar;