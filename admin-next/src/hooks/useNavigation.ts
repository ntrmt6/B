/**
 * useNavigation - URL routing and view navigation extracted from App.tsx
 * Now powered by react-router-dom for proper URL management.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Product, User, LandingPage } from '../types';
import { isAdminRole, SESSION_STORAGE_KEY } from '../utils/appHelpers';

export type ViewState = 'store' | 'detail' | 'checkout' | 'success' | 'profile' | 'admin' | 'landing_preview' | 'offer_preview' | 'admin-login' | 'visual-search' | 'super-admin' | 'register' | 'static-page';

// Parse order ID from URL for success page
export function getOrderIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('orderId');
}

// Check if we're on the admin subdomain (including localhost)
const isAdminSubdomain = typeof window !== 'undefined' && 
  (window.location.hostname.startsWith('admin.') ||
   window.location.hostname === 'admin.localhost');

// Check if we're on the superadmin subdomain (including localhost)
const isSuperAdminSubdomain = typeof window !== 'undefined' && 
  (window.location.hostname.startsWith('superadmin.') ||
   window.location.hostname === 'superadmin.localhost');

// Check if we're on the tenant login portal (systemnextit.website)
const isTenantLoginPortal = typeof window !== 'undefined' &&
  (window.location.hostname === 'systemnextit.website' ||
   window.location.hostname === 'www.systemnextit.website');

// Check if URL path is /admin (for tenant subdomain admin access)
const isAdminPath = typeof window !== 'undefined' && 
  (window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/'));

// Check if URL path is /register (for tenant self-registration)
const isRegisterPath = typeof window !== 'undefined' && 
  (window.location.pathname === '/register' || window.location.pathname.startsWith('/register'));

// Get initial view based on stored session
function getInitialView(): ViewState {
  if (typeof window === 'undefined') return 'store';
  
  // Check if /register path on main domain
  if (isRegisterPath) {
    return 'register';
  }
  
  // Tenant login portal (systemnextit.website) - show admin login/dashboard
  if (isTenantLoginPortal) {
    try {
      const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const user = JSON.parse(stored);
        if (user && user.role) {
          if (['admin', 'tenant_admin', 'staff'].includes(user.role)) {
            return 'admin';
          }
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
    return 'admin-login';
  }
  
  // Super admin subdomain - always show super-admin dashboard (requires login)
  if (isSuperAdminSubdomain) {
    try {
      const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const user = JSON.parse(stored);
        if (user && user.role === 'super_admin') {
          return 'super-admin';
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
    return 'admin-login'; // Show login for super admin
  }
  
  // Admin subdomain - show admin login/dashboard
  if (isAdminSubdomain) {
    // Check for stored user session
    try {
      const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const user = JSON.parse(stored);
        if (user && user.role) {
          if (['super_admin', 'admin', 'tenant_admin', 'staff'].includes(user.role)) {
            return 'admin';
          }
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
    return 'admin-login';
  }
  
  // Tenant subdomain with /admin path - show admin login/dashboard
  if (isAdminPath && !isAdminSubdomain && !isSuperAdminSubdomain) {
    try {
      const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const user = JSON.parse(stored);
        if (user && user.role) {
          if (['super_admin', 'admin', 'tenant_admin', 'staff'].includes(user.role)) {
            return 'admin';
          }
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
    return 'admin-login';
  }
  
  // Check for /offer/ path - show offer page preview
  const pathname = window.location.pathname.replace(/^\/+|\/+$/g, '');
  if (pathname.startsWith('offer/')) {
    return 'offer_preview';
  }
  
  // Check for /p/ path - show landing page preview
  if (pathname.startsWith('p/')) {
    return 'landing_preview';
  }
  
  return 'store';
}

export { isAdminSubdomain, isSuperAdminSubdomain, isTenantLoginPortal };

interface UseNavigationOptions {
  products: Product[];
  user: User | null;
  landingPages: LandingPage[];
  setSelectedLandingPage: (page: LandingPage | null) => void;
}

// Get initial admin section from sessionStorage to prevent flashing
const getInitialAdminSection = (): string => {
  if (typeof window === 'undefined') return 'dashboard';
  try {
    const stored = window.sessionStorage.getItem('adminSection');
    if (stored) return stored;
  } catch (e) {
    // Ignore errors
  }
  return 'dashboard';
};

export function useNavigation({ products, user, landingPages, setSelectedLandingPage }: UseNavigationOptions) {
  // React Router hooks
  const navigate = useNavigate();
  const location = useLocation();
  const navigateRef = useRef(navigate);
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);

  // Start with correct view based on stored session
  const [currentView, setCurrentViewState] = useState<ViewState>(getInitialView);
  const [adminSection, setAdminSectionInternal] = useState(getInitialAdminSection);

  // Wrapper to persist adminSection to sessionStorage
  const setAdminSection = (section: string) => {
    setAdminSectionInternal(section);
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.setItem('adminSection', section);
      } catch (e) {
        // Ignore storage errors
      }
    }
  };
  const [urlCategoryFilter, setUrlCategoryFilter] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [selectedOfferSlug, setSelectedOfferSlug] = useState<string | null>(null);

  const currentViewRef = useRef<ViewState>(currentView);
  const userRef = useRef<User | null>(user);
  const landingPagesRef = useRef<LandingPage[]>(landingPages);
  const productsRef = useRef<Product[]>(products);

  useEffect(() => { currentViewRef.current = currentView; }, [currentView]);
  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { landingPagesRef.current = landingPages; }, [landingPages]);
  useEffect(() => { productsRef.current = products; }, [products]);

  // setCurrentView wrapper - updates state AND auto-navigates for views with known URLs
  const setCurrentView = useCallback((view: ViewState) => {
    setCurrentViewState(view);
    // Auto-navigate for views with fixed URLs
    if (typeof window === 'undefined') return;
    const currentPath = window.location.pathname;
    switch (view) {
      case 'store':
        if (currentPath !== '/' && !currentPath.startsWith('/all-products')) {
          navigateRef.current('/');
        }
        break;
      case 'profile':
        if (currentPath !== '/profile') navigateRef.current('/profile');
        break;
      case 'checkout':
        if (currentPath !== '/checkout') navigateRef.current('/checkout');
        break;
      case 'admin-login':
        if (currentPath !== '/admin/login') navigateRef.current('/admin/login');
        break;
      case 'register':
        if (currentPath !== '/register') navigateRef.current('/register');
        break;
      case 'visual-search':
        if (currentPath !== '/visual-search' && currentPath !== '/search') {
          navigateRef.current('/visual-search');
        }
        break;
      case 'admin':
        if (!currentPath.startsWith('/admin') || currentPath === '/admin/login') {
          navigateRef.current('/admin/dashboard');
        }
        break;
      case 'super-admin':
        if (isSuperAdminSubdomain && currentPath !== '/') {
          navigateRef.current('/');
        }
        break;
      // 'detail', 'success', 'landing_preview', 'offer_preview', 'static-page'
      // require specific URLs with slugs/params - navigated explicitly by callers
    }
  }, []);

  const handleStoreSearchChange = useCallback((value: string) => {
    setStoreSearchQuery(value);
    if (currentViewRef.current !== 'store') {
      setSelectedProduct(null);
      setCurrentView('store');
    }
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, []);

  const syncViewWithLocation = useCallback((path?: string) => {
    const trimmedPath = (path ?? window.location.pathname).replace(/^\/+|\/+$/g, '');
    const activeView = currentViewRef.current;
    const activeUser = userRef.current;

    // Handle register route (public tenant registration)
    if (trimmedPath === 'register') {
      if (activeView !== 'register') {
        setCurrentView('register');
      }
      return;
    }

    // Handle admin login route FIRST
    if (trimmedPath === 'admin/login') {
      if (activeView !== 'admin-login') {
        setCurrentView('admin-login');
      }
      return;
    }

    // Handle checkout route
    if (trimmedPath === 'checkout') {
      if (activeView !== 'checkout') {
        setCurrentView('checkout');
      }
      return;
    }

    // Handle visual-search route
    if (trimmedPath === 'visual-search' || trimmedPath === 'search') {
      if (activeView !== 'visual-search') {
        setCurrentView('visual-search');
      }
      return;
    }

    // Handle success-order route
    if (trimmedPath === 'success-order') {
      if (activeView !== 'success') {
        setCurrentView('success');
      }
      return;
    }

    // Handle /all-products route
    if (trimmedPath === 'all-products') {
      const searchParams = new URLSearchParams(window.location.search);
      const categorySlug = searchParams.get('category');
      const brandSlug = searchParams.get('brand');
      if (categorySlug) {
        setUrlCategoryFilter(categorySlug);
      } else if (brandSlug) {
        setUrlCategoryFilter(`brand:${brandSlug}`);
      } else {
        setUrlCategoryFilter('all');
      }
      if (!activeView.startsWith('admin')) {
        setSelectedProduct(null);
        setCurrentView('store');
      }
      return;
    }

    // Handle /product-details/slug or /product-details/id route
    if (trimmedPath.startsWith('product-details/')) {
      const slugOrId = trimmedPath.replace('product-details/', '');
      const currentProducts = productsRef.current;
      // First try to find by slug
      let matchedProduct = currentProducts.find(p => p.slug === slugOrId);
      // If not found, try to find by ID (if slugOrId is a number)
      if (!matchedProduct && !isNaN(Number(slugOrId))) {
        matchedProduct = currentProducts.find(p => p.id === Number(slugOrId));
      }
      if (matchedProduct) {
        setSelectedProduct(matchedProduct);
        setCurrentView('detail');
        return;
      }
    }

    // Handle /p/slug-id landing page route
    if (trimmedPath.startsWith('p/')) {
      const urlSlug = trimmedPath.replace('p/', '');
      const matchedPage = landingPagesRef.current.find(lp => lp.urlSlug === urlSlug && lp.status === 'published');
      if (matchedPage) {
        setSelectedLandingPage(matchedPage);
        setCurrentView('landing_preview');
        return;
      } else {
        // Don't navigate away - wait for landing pages to load
        return;
      }
    }
    // Handle /offer/slug offer page route (legacy support)
    if (trimmedPath.startsWith('offer/')) {
      const urlSlug = trimmedPath.replace('offer/', '');
      setSelectedOfferSlug(urlSlug);
      setCurrentView('offer_preview');
      return;
    }
    
    // Known static routes that should NOT be treated as offer pages
    // Static content pages - these show dedicated content from websiteConfig
    const staticContentPages = [
      'privacy', 'privacy-policy', 'about', 'about-us', 'terms', 'terms-and-conditions',
      'termsnconditions', 'returnpolicy', 'return-policy', 'refund', 'refund-policy'
    ];
    
    // Check if it is a static content page
    if (staticContentPages.includes(trimmedPath.toLowerCase())) {
      if (!activeView.startsWith('admin')) {
        setCurrentView('static-page');
      }
      return;
    }

    const staticRoutes = [
      'privacy', 'privacy-policy', 'about', 'about-us', 'terms', 'terms-and-conditions',
      'contact', 'contact-us', 'profile', 'categories', 'track', 'track-order',
      'faq', 'help', 'support', 'blog', 'cart', 'wishlist', 'orders', 'my-orders',
      'account', 'login', 'signup', 'sign-up', 'signin', 'sign-in', 'forgot-password',
      'reset-password', 'returns', 'return-policy', 'refund', 'refund-policy',
      'shipping', 'shipping-policy', 'delivery', 'delivery-policy'
    ];
    
    // Handle root-level landing page slugs (new format: /slug-uniqueid)
    // This should be checked after all other routes
    if (trimmedPath && !trimmedPath.includes('/') && /^[a-z0-9-]+$/i.test(trimmedPath)) {
      // Skip known static routes - these should go to store with the appropriate page
      if (staticRoutes.includes(trimmedPath.toLowerCase())) {
        // Let it fall through to the store/default handling
        if (!activeView.startsWith('admin')) {
          setSelectedProduct(null);
          setCurrentView('store');
        }
        return;
      }

      // First check if it's a landing page from the landing_pages collection
      const matchedLandingPage = landingPagesRef.current.find(lp => lp.urlSlug === trimmedPath && lp.status === 'published');
      if (matchedLandingPage) {
        setSelectedLandingPage(matchedLandingPage);
        setCurrentView('landing_preview');
        return;
      }

      // Don't blindly treat as offer page - let it fall through to default store
      if (!activeView.startsWith('admin')) {
        setSelectedProduct(null);
        setCurrentView('store');
      }
      return;
    }
    if (trimmedPath === 'products') {
      const searchParams = new URLSearchParams(window.location.search);
      const categorySlug = searchParams.get('categories');
      if (categorySlug) {
        setUrlCategoryFilter(categorySlug);
        if (!activeView.startsWith('admin')) {
          setSelectedProduct(null);
          setCurrentView('store');
        }
        return;
      } else {
        navigateRef.current('/', { replace: true });
        setUrlCategoryFilter(null);
        if (!activeView.startsWith('admin')) {
          setSelectedProduct(null);
          setCurrentView('store');
        }
        return;
      }
    }

    if (!trimmedPath) {
      setUrlCategoryFilter(null);

      // Tenant login portal (systemnextit.website) - always show admin login
      if (isTenantLoginPortal) {
        if (isAdminRole(activeUser?.role)) {
          if (activeView !== 'admin') {
            setCurrentView('admin');
          }
        } else if (activeView !== 'admin-login') {
          setCurrentView('admin-login');
        }
        return;
      }

      if (isSuperAdminSubdomain) {
        // Super admin subdomain should never show store content
        if (activeUser?.role === 'super_admin') {
          if (activeView !== 'super-admin') {
            setCurrentView('super-admin');
          }
        } else if (activeView !== 'admin-login') {
          setCurrentView('admin-login');
        }
        return;
      }

      // On admin subdomain, stay on admin-login if not logged in
      if (isAdminSubdomain) {
        if (!activeView.startsWith('admin') && activeView !== 'admin-login') {
          setCurrentView('admin-login');
        }
        return;
      }

      if (!activeView.startsWith('admin')) {
        setSelectedProduct(null);
        setCurrentView('store');
      }
      return;
    }

    if (trimmedPath === 'admin') {
      // Allow admin access on admin subdomain OR any tenant subdomain with /admin path
      if (isAdminRole(activeUser?.role)) {
        // User is logged in with admin role - show admin panel
        setCurrentView('admin');
      } else {
        // Not logged in or not admin - show login
        setCurrentView('admin-login');
      }
      return;
    }

    const matchedProduct = productsRef.current.find(p => p.slug === trimmedPath);
    if (matchedProduct) {
      setSelectedProduct(matchedProduct);
      setCurrentView('detail');
      return;
    }

    if (activeView === 'admin-login') {
      return;
    }

    if (isSuperAdminSubdomain) {
      // Keep super admin context even if URL is unexpected
      if (activeUser?.role === 'super_admin') {
        if (activeView !== 'super-admin') {
          setCurrentView('super-admin');
        }
      } else {
        setCurrentView('admin-login');
      }
      return;
    }

    // Tenant login portal - keep admin context
    if (isTenantLoginPortal) {
      if (isAdminRole(activeUser?.role)) {
        if (activeView !== 'admin') {
          setCurrentView('admin');
        }
      } else {
        setCurrentView('admin-login');
      }
      return;
    }

    // Don't reset URL if it's a product-details route - wait for products to load
    if (trimmedPath.startsWith('product-details/')) {
      return;
    }

    // Don't interfere with /landingpage path - this is served as static files
    if (trimmedPath === 'landingpage' || trimmedPath.startsWith('landingpage/')) {
      return;
    }

    navigateRef.current('/', { replace: true });
    if (!activeView.startsWith('admin')) {
      setSelectedProduct(null);
      setCurrentView('store');
    }
  }, [setCurrentView]);

  // React Router location change handler (replaces popstate listener)
  useEffect(() => {
    syncViewWithLocation(location.pathname);
  }, [location, syncViewWithLocation]);

  // Re-sync when products first load (for product-details routes waiting on data)
  const productsLoadedOnceRef = useRef(false);
  useEffect(() => {
    if (products.length > 0 && !productsLoadedOnceRef.current) {
      productsLoadedOnceRef.current = true;
      const path = location.pathname.replace(/^\/+|\/+$/g, '');
      if (path.startsWith('product-details/') || products.some(p => p.slug === path)) {
        syncViewWithLocation(location.pathname);
      }
    }
  }, [products, location.pathname, syncViewWithLocation]);

  // Ensure URL matches view
  useEffect(() => {
    const path = location.pathname.replace(/^\/+|\/+$/g, '');
    if (path === 'admin/login') return;
    if (path === 'register') return;
    if (path === 'visual-search' || path === 'search') return;
    if (path === 'amit') return ;
    
    // Don't reset URL on tenant login portal
    if (isTenantLoginPortal) return;    
    // Don't reset URL if it's a valid product slug, landing page, or other valid route
    if (path.startsWith('p/')) return; // Landing page
    if (path.startsWith('offer/')) return; // Offer page (legacy)
    if (path === 'landingpage' || path.startsWith('landingpage/')) return; // Static landingpage folder
    if (/^[a-z0-9-]+$/i.test(path) && !['admin', 'register', 'checkout', 'cart', 'wishlist', 'profile', 'orders', 'tracking'].includes(path)) return; // Root-level landing page slug
    if (path.startsWith('product-details/')) return; // Product detail page
    if (path === 'all-products') return; // All products page
    if (path === 'products') return; // Products with filter
    if (productsRef.current.find(p => p.slug === path)) return; // Direct product slug

    if (currentView === 'store' && location.pathname !== '/' && !location.pathname.includes('checkout') && !location.pathname.includes('success-order') && !location.pathname.includes('register')) {
      navigateRef.current('/', { replace: true });
    }
  }, [currentView, location.pathname]);

  // Handle notification navigation
  useEffect(() => {
    const handleNavigateToOrder = (event: CustomEvent<{ orderId: string; tenantId?: string }>) => {
      const { orderId } = event.detail;
      console.log('[App] Navigate to order:', orderId);
      setCurrentView('admin');
      setAdminSection('orders');
      window.sessionStorage.setItem('highlightOrderId', orderId);
    };
    
    window.addEventListener('navigate-to-order', handleNavigateToOrder as EventListener);
    return () => {
      window.removeEventListener('navigate-to-order', handleNavigateToOrder as EventListener);
    };
  }, []);

  const handleProductClick = useCallback((product: Product) => {
    // Start transition immediately for smoother UX
    setCurrentView('detail');
    setSelectedProduct(product);
    
    if (product.slug) {
      navigateRef.current(`/product-details/${product.slug}`);
    }
    
    // Smooth scroll with slight delay for view transition
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
  }, [setCurrentView]);

  const handleCategoryFilterChange = useCallback((categorySlug: string | null) => {
    // Apply filter immediately for instant feedback
    setUrlCategoryFilter(categorySlug);
    
    requestAnimationFrame(() => {
      if (categorySlug) {
        if (categorySlug === 'all') {
          navigateRef.current('/all-products');
        } else if (categorySlug.startsWith('brand:')) {
          navigateRef.current(`/all-products?brand=${categorySlug.replace('brand:', '')}`);
        } else {
          navigateRef.current(`/all-products?category=${categorySlug}`);
        }
      } else {
        navigateRef.current('/');
      }
    });
  }, []);

  return {
    // State
    currentView,
    setCurrentView,
    adminSection,
    setAdminSection,
    urlCategoryFilter,
    setUrlCategoryFilter,
    selectedProduct,
    setSelectedProduct,
    storeSearchQuery,
    setStoreSearchQuery,
    selectedOfferSlug,
    setSelectedOfferSlug,
    // Handlers
    handleStoreSearchChange,
    syncViewWithLocation,
    handleProductClick,
    handleCategoryFilterChange,
    // React Router
    navigate,
    location,
    // Refs
    currentViewRef,
  };
}
