// Language Context and Hook for managing application language
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'bn'; // English and Bangla

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
  tenantId?: string;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children, tenantId }) => {
  const [language, setLanguageState] = useState<Language>('en');

  // Load language preference from localStorage on mount
  useEffect(() => {
    const savedLang = localStorage.getItem(`language_${tenantId || 'default'}`) as Language;
    if (savedLang === 'en' || savedLang === 'bn') {
      setLanguageState(savedLang);
    }
  }, [tenantId]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(`language_${tenantId || 'default'}`, lang);
    
    // Update HTML lang attribute for accessibility
    document.documentElement.lang = lang === 'bn' ? 'bn' : 'en';
  };

  const t = (key: string): string => {
    const translations = language === 'bn' ? translationsBn : translationsEn;
    return translations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// English Translations
const translationsEn: Record<string, string> = {
  // Dashboard Header
  'dashboard': 'Dashboard',
  'welcome': 'Welcome back',
  'overview': 'Business Overview',
  
  // Metrics
  'total_products': 'Total Products',
  'total_orders': 'Total Orders',
  'total_amount': 'Total Amount',
  'total_stock': 'Total Stock',
  'products_on_hand': 'Products on Hand',
  'pending_orders': 'Pending Orders',
  'confirmed_orders': 'Confirmed Orders',
  'low_stock': 'Low Stock',
  'visits': 'Visits',
  'revenue': 'Revenue',
  'language': 'Language',
  'reserved_price': 'Reserved Price',
  'to_be_reviewed': 'To be Reviewed',
  
  // Order Status
  'pending': 'Pending',
  'confirmed': 'Confirmed',
  'processing': 'Processing',
  'shipped': 'Shipped',
  'delivered': 'Delivered',
  'cancelled': 'Cancelled',
  'returned': 'Returned',
  'on_hold': 'On Hold',
  'sent_to_courier': 'Sent to Courier',
  
  // Products
  'products': 'Products',
  'add_product': 'Add Product',
  'product_name': 'Product Name',
  'price': 'Price',
  'stock': 'Stock',
  'category': 'Category',
  'in_stock': 'In Stock',
  'out_of_stock': 'Out of Stock',
  
  // Orders
  'orders': 'Orders',
  'order_id': 'Order ID',
  'customer': 'Customer',
  'date': 'Date',
  'status': 'Status',
  'total': 'Total',
  'actions': 'Actions',
  'view_details': 'View Details',
  
  // Common
  'search': 'Search',
  'filter': 'Filter',
  'export': 'Export',
  'print': 'Print',
  'edit': 'Edit',
  'delete': 'Delete',
  'save': 'Save',
  'cancel': 'Cancel',
  'submit': 'Submit',
  'close': 'Close',
  'loading': 'Loading...',
  'no_data': 'No data available',
  
  // Business Report
  'business_report': 'Business Report',
  'expenses': 'Expenses',
  'income': 'Income',
  'profit_loss': 'Profit / Loss',
  'total_expense': 'Total Expense',
  'total_income': 'Total Income',
  
  // Store
  'home': 'Home',
  'shop': 'Shop',
  'cart': 'Cart',
  'checkout': 'Checkout',
  'my_account': 'My Account',
  'contact': 'Contact',
  'about_us': 'About Us',
  'all_categories': 'All Categories',
  'search_products': 'Search products',
  'flash_deals': 'Flash Deals',
  'best_sale': 'Best Sale Products',
  'popular_products': 'Popular Products',
  'all_products': 'All Products',
  'add_to_cart': 'Add to Cart',
  'buy_now': 'Buy Now',
  'quick_view': 'Quick View',
  'wishlist': 'Wishlist',
  'track_order': 'Track Order',
  'sign_in': 'Sign in',
  'login': 'Login',
  'logout': 'Logout',
  'register': 'Register',
  'my_profile': 'My Profile',
  'my_orders': 'My Orders',

  'search_in_store': 'Search in store',
  'no_products_found': 'No products found',
  'showing_results': 'Showing results',
  'sort_by': 'Sort by',
 
  'brand': 'Brand',
  'rating': 'Rating',
  'stock_status': 'Stock Status',

  'customer_reviews': 'Customer Reviews',
  'write_review': 'Write a Review',
  'powered_by': 'Powered by',
  
  // Dates
  'today': 'Today',
  'yesterday': 'Yesterday',
  'this_week': 'This Week',
  'this_month': 'This Month',
  'this_year': 'This Year',
  
  // Messages
  'success': 'Success',
  'error': 'Error',
  'warning': 'Warning',
  'info': 'Info',
  // Sidebar Menu
  'main_menu': 'Main Menu',
  'inventory': 'Inventory',
  'customers_reviews': 'Customers & Review',
  'customization': 'Customization',
  'store_studio': 'Store Studio',
  'landing_pages': 'Landing Page',
  'popups': 'Popups',
  'gallery': 'Gallery',
  'purchases': 'Purchase Info',
  'due_book': 'Due Book',
  'activity_log': 'Activity Log',
  'support': 'Support',
  'tutorial': 'Tutorial',
  'profile': 'Profile',
  'settings': 'Settings',
  'catalog': 'Catalog',
  'categories': 'Categories',
  'subcategories': 'Sub Categories',
  'child_categories': 'Child Categories',
  'brands': 'Brand',
  'tags': 'Tags',
  'manage_products': 'Manage Products',
  'add_new_product': 'Add New Product',
  'media_center': 'Media Center',
  'configuration': 'Configuration',
  'system': 'System',
  'website_content': 'Website Content',
  'website_info': 'Website',
  'carousel': 'Carousel',
  'campaigns': 'Campaigns',
  'chat': 'Chat',
  'admin_control': 'Admin Control',
  'billing': 'Billing & Subscription',
  'sub_category': 'Sub Category',
  'child_category': 'Child Category',
};

// Bangla Translations
const translationsBn: Record<string, string> = {
  // Dashboard Header
  'dashboard': 'ড্যাশবোর্ড',
  'welcome': 'স্বাগতম',
  'overview': 'ব্যবসায়িক সংক্ষিপ্ত বিবরণ',
  
  // Metrics
  'total_products': 'মোট পণ্য',
  'total_orders': 'মোট অর্ডার',
  'total_amount': 'মোট মূল্য',
  'total_stock': 'মোট স্টক',
  'products_on_hand': 'মজুদ পণ্য',
  'pending_orders': 'অপেক্ষমাণ অর্ডার',
  'confirmed_orders': 'নিশ্চিত অর্ডার',
  'low_stock': 'কম স্টক',
  'visits': 'ভিজিট',
  'revenue': 'আয়',
  'language': 'ভাষা',
  'reserved_price': 'সংরক্ষিত মূল্য',
  'to_be_reviewed': 'পর্যালোচনা করতে হবে',
  
  // Order Status
  'pending': 'অপেক্ষমাণ',
  'confirmed': 'নিশ্চিত',
  'processing': 'প্রক্রিয়াধীন',
  'shipped': 'পাঠানো হয়েছে',
  'delivered': 'ডেলিভারি সম্পন্ন',
  'cancelled': 'বাতিল',
  'returned': 'ফেরত',
  'on_hold': 'আটকে আছে',
  'sent_to_courier': 'কুরিয়ারে পাঠানো',
  
  // Products
  'products': 'পণ্য',
  'add_product': 'পণ্য যোগ করুন',
  'product_name': 'পণ্যের নাম',
  'price': 'মূল্য',
  'stock': 'স্টক',
  'category': 'ক্যাটাগরি',
  'in_stock': 'স্টকে আছে',
  'out_of_stock': 'স্টক নেই',
  
  // Orders
  'orders': 'অর্ডার',
  'order_id': 'অর্ডার আইডি',
  'customer': 'ক্রেতা',
  'date': 'তারিখ',
  'status': 'অবস্থা',
  'total': 'মোট',
  'actions': 'কার্যক্রম',
  'view_details': 'বিস্তারিত দেখুন',
  
  // Common
  'search': 'খুঁজুন',
  'filter': 'ফিল্টার',
  'export': 'রপ্তানি',
  'print': 'প্রিন্ট',
  'edit': 'সম্পাদনা',
  'delete': 'মুছুন',
  'save': 'সংরক্ষণ',
  'cancel': 'বাতিল',
  'submit': 'জমা দিন',
  'close': 'বন্ধ করুন',
  'loading': 'লোড হচ্ছে...',
  'no_data': 'কোনো তথ্য নেই',
  
  // Business Report
  'business_report': 'ব্যবসায়িক রিপোর্ট',
  'expenses': 'খরচ',
  'income': 'আয়',
  'profit_loss': 'লাভ / ক্ষতি',
  'total_expense': 'মোট খরচ',
  'total_income': 'মোট আয়',
  
  // Store
  'home': 'হোম',
  'shop': 'দোকান',
  'cart': 'কার্ট',
  'checkout': 'চেকআউট',
  'my_account': 'আমার অ্যাকাউন্ট',
  'contact': 'যোগাযোগ',
  'about_us': 'আমাদের সম্পর্কে',
  'all_categories': 'সব ক্যাটাগরি',
  'search_products': 'পণ্য খুঁজুন',
  'flash_deals': 'ফ্ল্যাশ ডিল',
  'best_sale': 'সেরা বিক্রিত পণ্য',
  'popular_products': 'জনপ্রিয় পণ্য',
  'all_products': 'সকল পণ্য',
  'add_to_cart': 'কার্টে যোগ করুন',
  'buy_now': 'কিনুন',
  'quick_view': 'দ্রুত দেখুন',
  'wishlist': 'পছন্দের তালিকা',
  'track_order': 'অর্ডার ট্র্যাক করুন',
  'sign_in': 'সাইন ইন',
  'login': 'লগইন',
  'logout': 'লগআউট',
  'register': 'নিবন্ধন',
  'my_profile': 'আমার প্রোফাইল',
  'my_orders': 'আমার অর্ডার',

  'search_in_store': 'স্টোরে খুঁজুন',
  'no_products_found': 'কোন পণ্য পাওয়া যায়নি',
  'showing_results': 'ফলাফল দেখানো হচ্ছে',
  'sort_by': 'সাজান',
  'brand': 'ব্র্যান্ড',
  'rating': 'রেটিং',
  'stock_status': 'স্টক অবস্থা',

  'customer_reviews': 'গ্রাহক রিভিউ',
  'write_review': 'রিভিউ লিখুন',
  'powered_by': 'পরিচালিত',
  
  // Dates
  'today': 'আজ',
  'yesterday': 'গতকাল',
  'this_week': 'এই সপ্তাহ',
  'this_month': 'এই মাস',
  'this_year': 'এই বছর',
  
  // Messages
  'success': 'সফল',
  'error': 'ত্রুটি',
  'warning': 'সতর্কতা',
  'info': 'তথ্য',
  // Sidebar Menu
  'main_menu': 'প্রধান মেনু',
  'inventory': 'স্টক',
  'customers_reviews': 'গ্রাহক ও রিভিউ',
  'customization': 'কাস্টমাইজেশন',
  'store_studio': 'স্টোর স্টুডিও',
  'landing_pages': 'ল্যান্ডিং পেজ',
  'popups': 'পপআপ',
  'gallery': 'গ্যালারি',
  'purchases': 'ক্রয় তথ্য',
  'due_book': 'বাকির খাতা',
  'activity_log': 'কার্যকলাপ লগ',
  'support': 'সাপোর্ট',
  'tutorial': 'টিউটোরিয়াল',
  'profile': 'প্রোফাইল',
  'settings': 'সেটিংস',
  'catalog': 'ক্যাটালগ',
  'categories': 'ক্যাটাগরি',
  'subcategories': 'সাব ক্যাটাগরি',
  'child_categories': 'চাইল্ড ক্যাটাগরি',
  'brands': 'ব্র্যান্ড',
  'tags': 'ট্যাগ',
  'manage_products': 'পণ্য ব্যবস্থাপনা',
  'add_new_product': 'নতুন পণ্য যোগ করুন',
  'media_center': 'মিডিয়া সেন্টার',
  'configuration': 'কনফিগারেশন',
  'system': 'সিস্টেম',
  'website_content': 'ওয়েবসাইট কন্টেন্ট',
  'website_info': 'ওয়েবসাইট',
  'carousel': 'ক্যারোসেল',
  'campaigns': 'ক্যাম্পেইন',
  'chat': 'চ্যাট',
  'admin_control': 'অ্যাডমিন কন্ট্রোল',
  'billing': 'বিলিং ও সাবস্ক্রিপশন',
  'sub_category': 'সাব ক্যাটাগরি',
  'child_category': 'চাইল্ড ক্যাটাগরি',
};

// Helper function for number formatting
export const formatNumber = (num: number, lang: Language): string => {
  if (lang === 'bn') {
    // Convert to Bangla numerals
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().split('').map(d => d === '.' ? '.' : d === ',' ? ',' : banglaDigits[parseInt(d)] || d).join('');
  }
  return num.toLocaleString('en-US');
};

// Helper function for currency formatting
export const formatCurrency = (amount: number, lang: Language): string => {
  const formatted = amount.toFixed(2);
  const symbol = '৳';
  
  if (lang === 'bn') {
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    const banglaNumber = formatted.split('').map(d => 
      d === '.' ? '.' : d === ',' ? ',' : banglaDigits[parseInt(d)] || d
    ).join('');
    return `${symbol}${banglaNumber}`;
  }
  
  return `${symbol}${formatted}`;
};
