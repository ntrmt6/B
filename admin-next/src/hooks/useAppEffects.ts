import React, { useEffect, useCallback, useRef } from 'react';
import type { FacebookPixelConfig, User, Order, Product, Category, SubCategory, ChildCategory, Brand, Tag, LandingPage, PaymentMethod } from '../types';
import { DataService, joinTenantRoom, leaveTenantRoom } from '../services/DataService';
import { useDataRefreshDebounced } from './useDataRefresh';
import { DEFAULT_CATEGORIES, DEFAULT_SUB_CATEGORIES, DEFAULT_BRANDS, DEFAULT_TAGS } from './useAppState';
import {
  isAdminRole,
  normalizeProductCollection,
  hasCachedData,
  sanitizeSubdomainSlug,
  setCachedTenantIdForSubdomain,
  SESSION_STORAGE_KEY,
  ACTIVE_TENANT_STORAGE_KEY,
} from '../utils/appHelpers';
import { isMainDomain, DEMO_PRODUCTS, DEMO_WEBSITE_CONFIG, DEMO_CATEGORIES, DEMO_BRANDS } from '../utils/demoData';

// Check if we're on the admin subdomain
const isAdminSubdomain = typeof window !== 'undefined' && 
  window.location.hostname.startsWith('admin.');

// Check if we're on the superadmin subdomain
const isSuperAdminSubdomain = typeof window !== 'undefined' && 
  window.location.hostname.startsWith('superadmin.');

interface UseAppEffectsProps {
  // State
  activeTenantId: string;
  hostTenantSlug: string;
  currentView: string;
  user: User | null;
  products: Product[];
  categories: Category[];
  isAdminChatOpen: boolean;
  tenants: any[];
  
  // Setters
  setIsLoading: (loading: boolean) => void;
  setUser: (user: User | null) => void;
  setCurrentView: (view: string) => void;
  setAdminSection: (section: string) => void;
  setActiveTenantId: (id: string) => void;
  setHostTenantId: (id: string) => void;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setOrders: (orders: Order[]) => void;
  setLogo: (logo: string | null) => void;
  setThemeConfig: (config: any) => void;
  setWebsiteConfig: (config: any) => void;
  setDeliveryConfig: (config: any) => void;
  setPaymentMethods: (methods: PaymentMethod[]) => void;
  setCourierConfig: (config: any) => void;
  setFacebookPixelConfig: (config: FacebookPixelConfig) => void;
  setUsers: (users: User[]) => void;
  setRoles: (roles: any[]) => void;
  setCategories: (categories: Category[]) => void;
  setSubCategories: (subCategories: SubCategory[]) => void;
  setChildCategories: (childCategories: ChildCategory[]) => void;
  setBrands: (brands: Brand[]) => void;
  setTags: (tags: Tag[]) => void;
  setLandingPages: (pages: LandingPage[]) => void;
  setChatMessages: (messages: any[]) => void;
  setHasUnreadChat: (hasUnread: boolean) => void;

  // Callbacks
  loadChatMessages: (messages: any[], tenantId: string) => void;
  completeTenantSwitch: (error: Error | null) => void;
  applyTenantList: (tenants: any[]) => void;
  handleCloseAdminChat: () => void;

  // Refs
  refs: any;
  currentViewRef: React.MutableRefObject<string | null>;
  activeTenantIdRef: React.MutableRefObject<string | null>;
  skipNextChatSaveRef: React.MutableRefObject<boolean>;
  chatMessagesRef: React.MutableRefObject<any[]>;
  isAdminChatOpenRef: React.MutableRefObject<boolean>;
}

// Helper to hide preload skeleton
const hidePreloadSkeleton = () => {
  if (typeof window !== 'undefined' && typeof (window as any).__hidePreloadSkeleton__ === 'function') {
    (window as any).__hidePreloadSkeleton__();
  }
};

/**
 * Hook for session restoration on app load
 */
export const useSessionRestoration = ({
  setUser,
  setCurrentView,
  setActiveTenantId,
  refs,
}: Pick<UseAppEffectsProps, 'setUser' | 'setCurrentView' | 'setActiveTenantId' | 'refs'>) => {
  useEffect(() => {
    if (typeof window === 'undefined') {
      refs.sessionRestoredRef.current = true;
      return;
    }

    const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
    
    if (isSuperAdminSubdomain) {
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.role === 'super_admin') {
            setUser(parsed);
            setCurrentView('super-admin');
            refs.sessionRestoredRef.current = true;
            hidePreloadSkeleton();
            return;
          }
        } catch (e) {
          console.error('Session restoration error:', e);
        }
      }
      setCurrentView('admin-login');
      refs.sessionRestoredRef.current = true;
      hidePreloadSkeleton();
      return;
    }
    
    if (!stored) {
      if (isAdminSubdomain) {
        setCurrentView('admin-login');
        hidePreloadSkeleton();
      }
      refs.sessionRestoredRef.current = true;
      return;
    }
    
    try {
      const parsed = JSON.parse(stored);
      if (parsed) {
        setUser(parsed);
        const tenantInfo = (parsed as any).tenant;
        const parsedTenantId = parsed.tenantId || tenantInfo?.id || tenantInfo?._id;
        if (parsedTenantId) setActiveTenantId(parsedTenantId);
        const isOnAdminPath = window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/');
        if ((isAdminSubdomain || isOnAdminPath) && parsed.role && ['super_admin', 'admin', 'tenant_admin', 'staff'].includes(parsed.role)) {
          setCurrentView('admin');
        }
      }
    } catch (error) {
      console.error('Unable to restore session', error);
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      window.localStorage.removeItem(ACTIVE_TENANT_STORAGE_KEY);
    } finally {
      refs.sessionRestoredRef.current = true;
    }
  }, []);
};

/**
 * Hook to persist user session to localStorage
 */
export const useSessionPersistence = ({
  user,
  refs,
}: Pick<UseAppEffectsProps, 'user' | 'refs'>) => {
  // Track if user was ever set during this session (to avoid clearing on initial load)
  const hadUserRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!refs.sessionRestoredRef.current) {
      return;
    }
    if (user) {
      hadUserRef.current = true;
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    } else if (hadUserRef.current) {
      // Only clear localStorage if user was previously set (actual logout)
      // This prevents clearing during initial load when user state hasn't propagated yet
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      window.localStorage.removeItem(ACTIVE_TENANT_STORAGE_KEY);
    }
  }, [user, refs.sessionRestoredRef]);
};

/**
 * Hook to handle user role changes and view transitions
 */
export const useUserRoleEffect = ({
  user,
  activeTenantId,
  currentViewRef,
  refs,
  setActiveTenantId,
  setCurrentView,
  setAdminSection,
}: Pick<UseAppEffectsProps, 'user' | 'activeTenantId' | 'currentViewRef' | 'refs' | 'setActiveTenantId' | 'setCurrentView' | 'setAdminSection'>) => {
  // Track if user was ever set during this session (to avoid redirecting to login on initial load)
  const hadUserRef = useRef<boolean>(false);
  // Use a ref for activeTenantId to avoid re-triggering when we ourselves caused the change
  const activeTenantIdRef = useRef(activeTenantId);
  useEffect(() => { activeTenantIdRef.current = activeTenantId; }, [activeTenantId]);

  useEffect(() => {
    const currentView = currentViewRef.current ?? '';
    if (!user) {
      const isOnAdminPath = typeof window !== 'undefined' &&
        (window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/'));
      // Only redirect to login if:
      // 1. Session restoration is complete
      // 2. User was previously set (actual logout) OR no user was stored
      // This prevents redirecting during initial load race condition
      const storedUser = typeof window !== 'undefined' ? window.localStorage.getItem('admin_auth_user') : null;
      if (refs.sessionRestoredRef.current && currentView.startsWith('admin') && (isAdminSubdomain || isOnAdminPath)) {
        // If there's a stored user but state is null, wait for state to propagate
        if (storedUser && !hadUserRef.current) {
          return; // Wait for user state to be restored
        }
        setCurrentView('admin-login');
        setAdminSection('dashboard');
      }
      return;
    }
    hadUserRef.current = true;
    const currentTenantId = activeTenantIdRef.current;
    const resolvedTenantId = user.tenantId || currentTenantId;
    // Only switch tenant for admin roles — storefront customers stay on the subdomain-resolved tenant.
    // This prevents slug vs UUID oscillation (e.g. 'don' vs '69a7893b...')
    if (resolvedTenantId && resolvedTenantId !== currentTenantId && isAdminRole(user.role)) {
      setActiveTenantId(resolvedTenantId);
    }
    const isOnAdminPath = typeof window !== 'undefined' &&
      (window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/'));
    if (isAdminRole(user.role) && !currentView.startsWith('admin') && !currentView.startsWith('super') && (isAdminSubdomain || isOnAdminPath)) {
      if (user.role === 'super_admin') {
        setCurrentView('super-admin');
      } else {
        setCurrentView('admin');
      }
      setAdminSection('dashboard');
    }
  }, [user, setActiveTenantId, setCurrentView, setAdminSection, currentViewRef, refs.sessionRestoredRef]);
};

/**
 * Hook for socket room management
 */
export const useSocketRoom = (activeTenantId: string) => {
  useEffect(() => {
    if (!activeTenantId) return;
    const timer = setTimeout(() => joinTenantRoom(activeTenantId), 3500);
    return () => {
      clearTimeout(timer);
      leaveTenantRoom(activeTenantId);
    };
  }, [activeTenantId]);
};

/**
 * Hook for initial data loading
 */
export const useInitialDataLoad = ({
  activeTenantId,
  hostTenantSlug,
  loadChatMessages,
  completeTenantSwitch,
  setActiveTenantId,
  setHostTenantId,
  setIsLoading,
  setProducts,
  setOrders,
  setLogo,
  setThemeConfig,
  setWebsiteConfig,
  setDeliveryConfig,
  setPaymentMethods,
  setFacebookPixelConfig,
  setLandingPages,
  setCategories,
  setSubCategories,
  setChildCategories,
  setBrands,
  setTags,
  refs,
}: Pick<UseAppEffectsProps,
  'activeTenantId' | 'hostTenantSlug' | 'loadChatMessages' | 'completeTenantSwitch' |
  'setActiveTenantId' | 'setHostTenantId' | 'setIsLoading' | 'setProducts' | 'setOrders' |
  'setLogo' | 'setThemeConfig' | 'setWebsiteConfig' | 'setDeliveryConfig' | 'setPaymentMethods' | 'setFacebookPixelConfig' | 'setLandingPages' |
  'setCategories' | 'setSubCategories' | 'setChildCategories' | 'setBrands' | 'setTags' | 'refs'
>) => {
  // Track the last successfully loaded tenant to prevent duplicate loads
  const lastLoadedTenantRef = useRef<string>('');

  useEffect(() => {
    // Skip if we already loaded data for this exact tenant
    if (activeTenantId && activeTenantId === lastLoadedTenantRef.current) {
      return;
    }

    let isMounted = true;
    let secondaryTimerId: number | undefined;

    const loadInitialData = async () => {
      // Check if we're on main domain - load marketplace data from all stores
      if (isMainDomain()) {
        console.log('[App] Main domain detected - loading marketplace data');
        try {
          const [marketplaceData, marketplaceCategories] = await Promise.all([
            DataService.getMarketplaceProducts({ limit: 100, sort: 'newest' }),
            DataService.getMarketplaceCategories(),
          ]);
          if (!isMounted) return;

          // Map marketplace categories to Category[] shape
          const cats: Category[] = marketplaceCategories.map((c, i) => ({
            id: String(i + 1),
            name: c.name,
            slug: c.slug,
            image: c.image,
            status: 'Active' as const,
          }));

          setProducts(marketplaceData.products as Product[]);
          setCategories(cats);
          setBrands(DEMO_BRANDS as Brand[]);
          setWebsiteConfig(DEMO_WEBSITE_CONFIG as any);
          setTags([]);
          setOrders([]);
          setLogo('/icons/icon-192x192.png');
          setThemeConfig(null);
          setDeliveryConfig([]);
          setPaymentMethods([]);
          setLandingPages([]);
          setSubCategories([]);
          setChildCategories([]);
        } catch (err) {
          console.error('[App] Marketplace data load failed, falling back to demo:', err);
          // Fallback to demo data if API is unreachable
          setProducts(DEMO_PRODUCTS as Product[]);
          setWebsiteConfig(DEMO_WEBSITE_CONFIG as any);
          setCategories(DEMO_CATEGORIES as Category[]);
          setBrands(DEMO_BRANDS as Brand[]);
          setTags([]);
          setOrders([]);
          setLogo('/icons/icon-192x192.png');
          setThemeConfig(null);
          setDeliveryConfig([]);
          setPaymentMethods([]);
          setLandingPages([]);
          setSubCategories([]);
          setChildCategories([]);
        }
        hidePreloadSkeleton();
        setIsLoading(false);
        return;
      }
      
      const hasCache = hasCachedData();
      if (!hasCache) setIsLoading(true);
      let loadError: Error | null = null;
      
      try {
        let resolvedTenantId = activeTenantId;
        
        if (hostTenantSlug && !isAdminSubdomain && !isSuperAdminSubdomain) {
          const sanitizedSlug = sanitizeSubdomainSlug(hostTenantSlug);
          const resolved = await DataService.resolveTenantBySubdomain(sanitizedSlug);
          if (!isMounted) return;
          
          if (resolved?.id) {
            if (resolvedTenantId && resolvedTenantId !== resolved.id) {
              try {
                ['products', 'theme_config', 'website_config', 'categories', 'brands', 'tags'].forEach(key => {
                  localStorage.removeItem(`ds_cache_${resolvedTenantId}::${key}`);
                });
              } catch {}
            }
            resolvedTenantId = resolved.id;
            setCachedTenantIdForSubdomain(sanitizedSlug, resolved.id);
            // Only update state if the value is actually different to prevent loops
            if (activeTenantId !== resolved.id) {
              setActiveTenantId(resolvedTenantId);
              setHostTenantId(resolved.id);
            }
          }
        }
        
        if (!resolvedTenantId) {
          hidePreloadSkeleton();
          setIsLoading(false);
          return;
        }
        
        const bootstrapData = await DataService.bootstrap(resolvedTenantId);
        if (!isMounted) return;
        
        const normalizedProducts = normalizeProductCollection(bootstrapData.products, resolvedTenantId);
        setProducts(normalizedProducts);
        
        refs.prevThemeConfigRef.current = bootstrapData.themeConfig;
        refs.prevWebsiteConfigRef.current = bootstrapData.websiteConfig;
        refs.prevProductsRef.current = normalizedProducts;
        
        setThemeConfig(bootstrapData.themeConfig);
        setWebsiteConfig(bootstrapData.websiteConfig);

        // Set catalog data immediately from bootstrap so above-fold
        // categories / brands render without waiting for secondary data.
        if (bootstrapData.categories) {
          refs.prevCategoriesRef.current = bootstrapData.categories;
          setCategories(bootstrapData.categories);
        }
        if (bootstrapData.subcategories) {
          refs.prevSubCategoriesRef.current = bootstrapData.subcategories;
          setSubCategories(bootstrapData.subcategories);
        }
        if (bootstrapData.childcategories) {
          refs.prevChildCategoriesRef.current = bootstrapData.childcategories;
          setChildCategories(bootstrapData.childcategories);
        }
        if (bootstrapData.brands) {
          refs.prevBrandsRef.current = bootstrapData.brands;
          setBrands(bootstrapData.brands);
        }
        if (bootstrapData.tags) {
          refs.prevTagsRef.current = bootstrapData.tags;
          setTags(bootstrapData.tags);
        }

        // Defer secondary data loading so the initial render (products, theme, config)
        // paints first without being blocked by orders, chat, categories, etc.
        const loadSecondaryData = async () => {
          if (!isMounted) return;
          try {
            const data = await DataService.getSecondaryData(resolvedTenantId);
            if (!isMounted) return;
            refs.ordersLoadedRef.current = false;
            refs.prevOrdersRef.current = data.orders;
            setOrders(data.orders);
            refs.prevLogoRef.current = data.logo;
            setLogo(data.logo);
            refs.prevDeliveryConfigRef.current = data.deliveryConfig;
            setDeliveryConfig(data.deliveryConfig);
            refs.prevPaymentMethodsRef.current = data.paymentMethods || [];
            setPaymentMethods(data.paymentMethods || []);
            loadChatMessages(data.chatMessages, activeTenantId);
            // Landing pages loaded
            refs.prevLandingPagesRef.current = data.landingPages;
            setLandingPages(data.landingPages);
            refs.prevCategoriesRef.current = data.categories;
            setCategories(data.categories);
            refs.prevSubCategoriesRef.current = data.subcategories;
            setSubCategories(data.subcategories);
            refs.prevChildCategoriesRef.current = data.childcategories;
            setChildCategories(data.childcategories);
            refs.prevBrandsRef.current = data.brands;
            setBrands(data.brands);
            refs.prevTagsRef.current = data.tags;
            setTags(data.tags);
            refs.catalogLoadedRef.current = true;

            // Load Facebook Pixel config for storefront injection
            try {
              const pixelData = await DataService.getFacebookPixelConfig(resolvedTenantId);
              if (isMounted) setFacebookPixelConfig(pixelData);
            } catch {}
          } catch (error) {
            console.warn('Failed to load secondary data', error);
          }

          // Enrich products with review counts (non-blocking)
          try {
            const summaries = await DataService.getReviewSummaries(resolvedTenantId);
            if (!isMounted || !summaries || Object.keys(summaries).length === 0) return;
            setProducts((prev: Product[]) => prev.map(p => {
              const s = summaries[p.id];
              if (!s) return p;
              return { ...p, reviews: s.reviewCount, rating: s.avgRating };
            }));
          } catch (e) {
            // Non-critical, silently ignore
          }
        };
        
        // Defer secondary data so the above-fold content (products, hero, categories)
        // renders first. Use requestIdleCallback when available, otherwise setTimeout.
        if (typeof requestIdleCallback === 'function') {
          secondaryTimerId = requestIdleCallback(() => loadSecondaryData(), { timeout: 1500 }) as unknown as number;
        } else {
          secondaryTimerId = setTimeout(() => loadSecondaryData(), 100) as unknown as number;
        }
      } catch (error) {
        loadError = error as Error;
        console.error('Failed to load data', error);
      } finally {
        if (isMounted) {
          // Mark this tenant as loaded to prevent duplicate loads
          lastLoadedTenantRef.current = activeTenantId;
          setIsLoading(false);
          completeTenantSwitch(loadError);
          hidePreloadSkeleton();
        }
      }
    };

    loadInitialData();
    return () => {
      isMounted = false;
      if (secondaryTimerId !== undefined) {
        if (typeof cancelIdleCallback === 'function') cancelIdleCallback(secondaryTimerId);
        clearTimeout(secondaryTimerId);
      }
    };
  }, [activeTenantId, hostTenantSlug]);
};

/**
 * Hook for admin data loading
 */
export const useAdminDataLoad = ({
  activeTenantId,
  currentView,
  tenants,
  applyTenantList,
  setUsers,
  setRoles,
  setCourierConfig,
  setFacebookPixelConfig,
  setCategories,
  setSubCategories,
  setChildCategories,
  setBrands,
  setTags,
  refs,
}: Pick<UseAppEffectsProps, 
  'activeTenantId' | 'currentView' | 'tenants' | 'applyTenantList' |
  'setUsers' | 'setRoles' | 'setCourierConfig' | 'setFacebookPixelConfig' |
  'setCategories' | 'setSubCategories' | 'setChildCategories' | 'setBrands' | 'setTags' | 'refs'
>) => {
  const loadAdminData = useCallback(async () => {
    if (!activeTenantId) return;
    try {
      if (tenants.length === 0) {
        const tenantList = await DataService.listTenants(true);
        applyTenantListRef.current(tenantList);
      }
      
      const [usersData, rolesData, courierData, facebookPixelData, categoriesData, subCategoriesData, childCategoriesData, brandsData, tagsData] = await Promise.all([
        DataService.getUsers(activeTenantId),
        DataService.getRoles(activeTenantId),
        DataService.getCourierConfig(activeTenantId),
        DataService.getFacebookPixelConfig(activeTenantId),
        DataService.getCatalog('categories', DEFAULT_CATEGORIES, activeTenantId),
        DataService.getCatalog('subcategories', DEFAULT_SUB_CATEGORIES, activeTenantId),
        DataService.getCatalog('childcategories', [], activeTenantId),
        DataService.getCatalog('brands', DEFAULT_BRANDS, activeTenantId),
        DataService.getCatalog('tags', DEFAULT_TAGS, activeTenantId)
      ]);
      
      refs.prevUsersRef.current = usersData;
      setUsers(usersData);
      refs.prevRolesRef.current = rolesData;
      setRoles(rolesData);
      setCourierConfig({ apiKey: courierData?.apiKey || '', secretKey: courierData?.secretKey || '', instruction: courierData?.instruction || '' });
      setFacebookPixelConfig(facebookPixelData);
      
      if (!refs.catalogLoadedRef.current) {
        refs.prevCategoriesRef.current = categoriesData;
        setCategories(categoriesData);
        refs.prevSubCategoriesRef.current = subCategoriesData;
        setSubCategories(subCategoriesData);
        refs.prevChildCategoriesRef.current = childCategoriesData;
        setChildCategories(childCategoriesData);
        refs.prevBrandsRef.current = brandsData;
        setBrands(brandsData);
        refs.prevTagsRef.current = tagsData;
        setTags(tagsData);
        refs.catalogLoadedRef.current = true;
      }
    } catch (error) {
      console.warn('Failed to load admin data', error);
    }
  // Use refs for stable callback - only activeTenantId should trigger reload
  }, [activeTenantId, refs]);

  // Reference to apply tenant list to avoid recreating callback
  const applyTenantListRef = useRef(applyTenantList);
  useEffect(() => { applyTenantListRef.current = applyTenantList; }, [applyTenantList]);

  useEffect(() => {
    if (currentView === 'admin' && !refs.adminDataLoadedRef.current) {
      refs.adminDataLoadedRef.current = true;
      loadAdminData();
    }
  }, [currentView, loadAdminData, refs]);

  useEffect(() => {
    refs.adminDataLoadedRef.current = false;
    refs.prevLogoRef.current = null;
  }, [activeTenantId, refs]);

  return { loadAdminData };
};

/**
 * Hook for real-time data refresh
 */
export const useDataRefresh = ({
  products,
  categories,
  activeTenantIdRef,
  currentViewRef,
  skipNextChatSaveRef,
  chatMessagesRef,
  isAdminChatOpenRef,
  refs,
  setProducts,
  setOrders,
  setLogo,
  setThemeConfig,
  setWebsiteConfig,
  setDeliveryConfig,
  setPaymentMethods,
  setCategories,
  setLandingPages,
  setChatMessages,
  setHasUnreadChat,
}: Pick<UseAppEffectsProps, 
  'products' | 'categories' | 'activeTenantIdRef' | 'currentViewRef' |
  'skipNextChatSaveRef' | 'chatMessagesRef' | 'isAdminChatOpenRef' | 'refs' |
  'setProducts' | 'setOrders' | 'setLogo' | 'setThemeConfig' | 'setWebsiteConfig' |
  'setDeliveryConfig' | 'setPaymentMethods' | 'setCategories' | 'setLandingPages' | 'setChatMessages' | 'setHasUnreadChat'
>) => {
  // Use refs to read current lengths without triggering callback recreation
  const productsLengthRef = useRef(products.length);
  useEffect(() => { productsLengthRef.current = products.length; }, [products.length]);
  const categoriesLengthRef = useRef(categories.length);
  useEffect(() => { categoriesLengthRef.current = categories.length; }, [categories.length]);

  const handleDataRefresh = useCallback(async (key: string, eventTenantId?: string, fromSocket = false) => {
    const currentView = currentViewRef.current ?? '';
    if (currentView.startsWith('admin')) return;
    if (eventTenantId && eventTenantId !== activeTenantIdRef.current) return;

    const tenantId = eventTenantId || activeTenantIdRef.current || undefined;
    if (!tenantId) return;
    try {
      switch (key) {
        case 'products':
          const productsData = await DataService.getProducts(tenantId);
          if (productsData.length > 0 || productsLengthRef.current === 0) {
            refs.isFirstProductUpdateRef.current = true;
            setProducts(normalizeProductCollection(productsData, tenantId));
          }
          break;
        case 'orders':
          setOrders(await DataService.getOrders(tenantId));
          break;
        case 'logo':
          setLogo(await DataService.get<string | null>('logo', null, tenantId));
          break;
        case 'theme':
          setThemeConfig(await DataService.getThemeConfig(tenantId));
          break;
        case 'website':
          const hasUnsavedChanges = typeof window !== 'undefined' &&
            typeof (window as any).__getAdminCustomizationUnsavedChanges === 'function' &&
            (window as any).__getAdminCustomizationUnsavedChanges();
          if (!hasUnsavedChanges) {
            setWebsiteConfig(await DataService.getWebsiteConfig(tenantId));
          }
          break;
        case 'delivery':
          setDeliveryConfig(await DataService.getDeliveryConfig(tenantId));
          break;
        case 'payment_methods':
          setPaymentMethods(await DataService.getPaymentMethods(tenantId));
          break;
        case 'categories':
          const categoriesData = await DataService.getCatalog('categories', DEFAULT_CATEGORIES, tenantId);
          if (categoriesData.length > 0 || categoriesLengthRef.current === 0) {
            setCategories(categoriesData);
          }
          break;
        case 'landing_pages':
          setLandingPages(await DataService.getLandingPages(tenantId));
          break;
        case 'chat_messages':
          const chatData = await DataService.getChatMessages(tenantId);
          const normalized = Array.isArray(chatData) ? [...chatData] : [];
          normalized.sort((a, b) => (a?.timestamp || 0) - (b?.timestamp || 0));
          skipNextChatSaveRef.current = true;
          setChatMessages(normalized);
          const localIds = new Set(chatMessagesRef.current.map(m => m.id));
          const newCustomerMessages = normalized.filter(m => !localIds.has(m.id) && m.sender === 'customer');
          if (newCustomerMessages.length > 0 && !isAdminChatOpenRef.current && isAdminRole(refs.userRef.current?.role)) {
            setHasUnreadChat(true);
          }
          break;
      }
    } catch (error) {
      console.warn(`[DataRefresh] Failed to refresh ${key}:`, error);
    }
  }, [skipNextChatSaveRef, chatMessagesRef, isAdminChatOpenRef, setChatMessages, setHasUnreadChat, activeTenantIdRef, currentViewRef, refs]);

  useDataRefreshDebounced(handleDataRefresh, 500);
};

/**
 * Hook for admin chat visibility management
 */
export const useAdminChatVisibility = ({
  currentView,
  isAdminChatOpen,
  handleCloseAdminChat,
}: Pick<UseAppEffectsProps, 'currentView' | 'isAdminChatOpen' | 'handleCloseAdminChat'>) => {
  useEffect(() => {
    if (!currentView.startsWith('admin') && isAdminChatOpen) handleCloseAdminChat();
  }, [currentView, isAdminChatOpen, handleCloseAdminChat]);
};

