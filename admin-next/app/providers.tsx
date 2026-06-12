'use client';

/**
 * AppProvider - Client-side state management provider
 * Replaces the monolithic App.tsx state by wrapping all hooks in a context.
 * All pages consume state via useApp() hook.
 */
import React, { createContext, useContext, useCallback, useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAppState } from '@/hooks/useAppState';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useChat } from '@/hooks/useChat';
import { useTenant } from '@/hooks/useTenant';
import { useAppHandlers } from '@/hooks/useAppHandlers';
import { useThemeEffects } from '@/hooks/useThemeEffects';
import { useFacebookPixel } from '@/hooks/useFacebookPixel';
import { useDataPersistence } from '@/hooks/useDataPersistence';
import {
  useSessionRestoration,
  useSessionPersistence,
  useUserRoleEffect,
  useSocketRoom,
  useInitialDataLoad,
  useAdminDataLoad,
  useDataRefresh,
  useAdminChatVisibility,
} from '@/hooks/useAppEffects';
import { DataService } from '@/services/DataService';
import { isAdminRole, isPlatformOperator } from '@/utils/appHelpers';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { DarkModeProvider } from '@/context/DarkModeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import type {
  Product, Order, ThemeConfig, WebsiteConfig, DeliveryConfig,
  ProductVariantSelection, LandingPage, FacebookPixelConfig, CourierConfig,
  Category, SubCategory, ChildCategory, Brand, Tag, User, ChatMessage, PaymentMethod
} from '@/types';

const Toaster = dynamic(
  () => import('react-hot-toast').then(m => ({ default: m.Toaster })),
  { ssr: false }
);

// ── Context type ──
interface AppContextType {
  // State
  isLoading: boolean;
  products: Product[];
  // Checkout state
  selectedProduct: Product | null;
  checkoutQuantity: number;
  selectedVariant: ProductVariantSelection | null;
  orders: Order[];
  logo: string | null;
  themeConfig: ThemeConfig | null;
  websiteConfig: WebsiteConfig | undefined;
  deliveryConfig: DeliveryConfig[];
  paymentMethods: PaymentMethod[];
  facebookPixelConfig: FacebookPixelConfig;
  categories: Category[];
  subCategories: SubCategory[];
  childCategories: ChildCategory[];
  brands: Brand[];
  tags: Tag[];
  courierConfig: CourierConfig;
  user: User | null;
  wishlist: number[];
  cartItems: any[];
  chatMessages: ChatMessage[];
  isChatOpen: boolean;
  isAdminChatOpen: boolean;
  hasUnreadChat: boolean;
  landingPages: LandingPage[];
  selectedLandingPage: LandingPage | null;
  isLoginOpen: boolean;

  // Tenant
  activeTenantId: string;
  tenants: any[];
  isTenantSwitching: boolean;
  isTenantSeeding: boolean;
  deletingTenantId: string | null;

  // Setters
  setUser: (user: User | null) => void;
  setIsLoginOpen: (open: boolean) => void;
  setSelectedProduct: (product: Product | null) => void;

  // Auth handlers
  handleLogin: (email: string, password: string) => Promise<any>;
  handleRegister: (user: User) => Promise<boolean>;
  handleGoogleLogin: () => Promise<any>;
  handleLogout: () => void;
  handleUpdateProfile: (user: User) => void;

  // Product/order handlers
  handlers: ReturnType<typeof useAppHandlers>;

  // Cart
  handleCartToggle: (productId: number, options?: any) => void;
  handleAddProductToCart: (product: Product, quantity: number, variant?: ProductVariantSelection, options?: { silent?: boolean }) => void;

  // Chat
  handleOpenChat: () => void;
  handleCloseChat: () => void;
  handleOpenAdminChat: () => void;
  handleCloseAdminChat: () => void;
  handleCustomerSendChat: (msg: string) => void;
  handleAdminSendChat: (msg: string, replyTarget?: any) => void;
  handleEditChatMessage: (id: string, text: string) => void;
  handleDeleteChatMessage: (id: string) => void;

  // Tenant
  handleTenantChange: (id: string) => void;
  handleCreateTenant: (payload: any, options?: any) => Promise<any>;
  handleDeleteTenant: (id: string) => Promise<void>;
  refreshTenants: () => Promise<any>;

  // Landing pages
  handleCreateLandingPage: (page: any) => void;
  handleUpsertLandingPage: (page: any) => void;
  handleToggleLandingPublish: (pageId: string, status: string) => void;

  // Computed
  canAccessAdminChat: boolean;
  headerTenants: any[];
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// ── Provider component ──
export function AppProvider({ children }: { children: React.ReactNode }) {
  // === CORE STATE ===
  const appState = useAppState();
  const {
    isLoading, setIsLoading,
    orders, setOrders,
    products, setProducts,
    logo, setLogo,
    themeConfig, setThemeConfig,
    websiteConfig, setWebsiteConfig,
    deliveryConfig, setDeliveryConfig,
    paymentMethods, setPaymentMethods,
    facebookPixelConfig, setFacebookPixelConfig,
    roles, setRoles,
    users, setUsers,
    categories, setCategories,
    subCategories, setSubCategories,
    childCategories, setChildCategories,
    brands, setBrands,
    tags, setTags,
    courierConfig, setCourierConfig,
    user, setUser,
    isLoginOpen, setIsLoginOpen,
    wishlist, setWishlist,
    checkoutQuantity, setCheckoutQuantity,
    selectedVariant, setSelectedVariant,
    landingPages, setLandingPages,
    selectedLandingPage, setSelectedLandingPage,
    refs,
    handleMobileMenuOpenRef,
  } = appState;

  // === TENANT ===
  const tenant = useTenant();
  const {
    tenants, activeTenantId, setActiveTenantId,
    hostTenantId, setHostTenantId, hostTenantSlug,
    isTenantSwitching, isTenantSeeding, deletingTenantId,
    applyTenantList, refreshTenants, completeTenantSwitch,
    tenantsRef, activeTenantIdRef,
  } = tenant;

  // === CHAT ===
  const chat = useChat({ activeTenantId, isLoading, user, websiteConfig, isTenantSwitching });

  // === CART ===
  const cart = useCart({ user, products, tenantId: activeTenantId });

  // === AUTH ===
  const auth = useAuth({
    tenants, users, activeTenantId,
    setUser, setUsers, setActiveTenantId,
    setCurrentView: () => {}, // No-op — Next.js uses router
    setAdminSection: () => {},
    setSelectedVariant: () => setSelectedVariant(null),
  });

  // === CHECKOUT STATE (persisted via sessionStorage for page navigation) ===
  const [selectedProduct, setSelectedProductState] = useState<Product | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = sessionStorage.getItem('checkout_product');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const setSelectedProduct = useCallback((product: Product | null) => {
    setSelectedProductState(product);
    if (typeof window !== 'undefined') {
      if (product) {
        sessionStorage.setItem('checkout_product', JSON.stringify(product));
      } else {
        sessionStorage.removeItem('checkout_product');
      }
    }
  }, []);

  // Persist checkout quantity & variant to sessionStorage too
  const setCheckoutQuantityPersisted = useCallback((val: React.SetStateAction<number>) => {
    setCheckoutQuantity(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      if (typeof window !== 'undefined') sessionStorage.setItem('checkout_qty', String(next));
      return next;
    });
  }, [setCheckoutQuantity]);

  const setSelectedVariantPersisted = useCallback((val: React.SetStateAction<ProductVariantSelection | null>) => {
    setSelectedVariant(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      if (typeof window !== 'undefined') {
        if (next) sessionStorage.setItem('checkout_variant', JSON.stringify(next));
        else sessionStorage.removeItem('checkout_variant');
      }
      return next;
    });
  }, [setSelectedVariant]);

  // Restore checkout quantity & variant from sessionStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
     const qty = sessionStorage.getItem('checkout_qty');
    if (qty) setCheckoutQuantity(Number(qty));
      const variant = sessionStorage.getItem('checkout_variant');
      if (variant) setSelectedVariant(JSON.parse(variant));
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const router = useRouter();

  // Navigation function for handlers to use instead of window.location.href
  const navigate = useCallback((path: string) => {
    router.push(path);
  }, [router]);

  // === HANDLERS ===
  const handlers = useAppHandlers({
    activeTenantId, products, orders, roles,
    wishlist, checkoutQuantity, selectedProduct,
    selectedVariant, user, cartItems: cart.cartItems,
    setProducts, setOrders, setRoles, setWishlist,
    setCheckoutQuantity: setCheckoutQuantityPersisted, setSelectedProduct,
    setSelectedVariant: setSelectedVariantPersisted, setSelectedLandingPage,
    setCurrentView: () => {},
    navigate,
    setLogo, setThemeConfig, setWebsiteConfig,
    setDeliveryConfig, setPaymentMethods, setCourierConfig,
    setFacebookPixelConfig, setCategories, setSubCategories,
    setChildCategories, setBrands, setTags,
    handleAddProductToCart: cart.handleAddProductToCart,
  });

  // === EFFECTS ===
  useThemeEffects({ themeConfig, websiteConfig, activeTenantId, isLoading, currentView: 'store', isTenantSwitching });
  useFacebookPixel(facebookPixelConfig);
  useSessionRestoration({ setUser, setCurrentView: () => {}, setActiveTenantId, refs });
  useSessionPersistence({ user, refs });
  useSocketRoom(activeTenantId);

  useInitialDataLoad({
    activeTenantId,
    hostTenantSlug: hostTenantSlug || '',
    loadChatMessages: chat.loadChatMessages,
    completeTenantSwitch,
    setActiveTenantId, setHostTenantId, setIsLoading,
    setProducts, setOrders, setLogo, setThemeConfig,
    setWebsiteConfig, setDeliveryConfig, setPaymentMethods,
    setFacebookPixelConfig, setLandingPages,
    setCategories, setSubCategories, setChildCategories,
    setBrands, setTags, refs,
  });

  useDataRefresh({
    products, categories, activeTenantIdRef,
    currentViewRef: { current: 'store' } as any,
    skipNextChatSaveRef: chat.skipNextChatSaveRef,
    chatMessagesRef: chat.chatMessagesRef,
    isAdminChatOpenRef: chat.isAdminChatOpenRef,
    refs,
    setProducts, setOrders, setLogo, setThemeConfig,
    setWebsiteConfig, setDeliveryConfig, setPaymentMethods,
    setCategories, setLandingPages,
    setChatMessages: chat.setChatMessages,
    setHasUnreadChat: chat.setHasUnreadChat,
  });

  useDataPersistence({
    activeTenantId, isLoading, isTenantSwitching,
    orders, products, logo, themeConfig, websiteConfig,
    deliveryConfig, courierConfig, facebookPixelConfig,
    roles, users, categories, subCategories, childCategories,
    brands, tags, landingPages, refs,
  });

  useEffect(() => { refs.userRef.current = user; }, [user, refs]);

  // === TENANT HANDLERS ===
  const handleTenantChange = useCallback((tenantId: string) => {
    tenant.handleTenantChange(tenantId, {
      onResetChat: chat.resetChatLoaded,
      setUser: (fn: any) => setUser(fn(user)),
      setCurrentView: () => {},
      setAdminSection: () => {},
      setSelectedProduct: () => {},
      setSelectedLandingPage: () => setSelectedLandingPage(null),
    });
  }, [tenant, chat.resetChatLoaded, user, setSelectedLandingPage, setUser]);

  const handleCreateTenant = useCallback(async (payload: any, options?: any) => {
    return tenant.handleCreateTenant(payload, options, handleTenantChange);
  }, [tenant, handleTenantChange]);

  const handleDeleteTenant = useCallback(async (id: string) => {
    return tenant.handleDeleteTenant(id, handleTenantChange);
  }, [tenant, handleTenantChange]);

  // === LANDING PAGES ===
  const handleCreateLandingPage = useCallback(async (page: any) => {
    const scopedPage = { ...page, tenantId: page.tenantId || activeTenantId };
    setLandingPages((prev: any[]) => [scopedPage, ...prev]);
    try {
      await DataService.saveImmediate('landing_pages', [scopedPage, ...refs.landingPagesRef.current], activeTenantId);
    } catch (error) {
      setLandingPages((prev: any[]) => prev.filter((p: any) => p.id !== scopedPage.id));
      throw error;
    }
  }, [activeTenantId, setLandingPages, refs]);

  const handleUpsertLandingPage = useCallback(async (page: any) => {
    const scopedPage = { ...page, tenantId: page.tenantId || activeTenantId };
    let newPages: any[] = [];
    setLandingPages((prev: any[]) => {
      const exists = prev.some((lp: any) => lp.id === scopedPage.id);
      newPages = exists ? prev.map((lp: any) => lp.id === scopedPage.id ? scopedPage : lp) : [scopedPage, ...prev];
      return newPages;
    });
    await DataService.saveImmediate('landing_pages', newPages, activeTenantId);
  }, [activeTenantId, setLandingPages]);

  const handleToggleLandingPublish = useCallback(async (pageId: string, status: string) => {
    const timestamp = new Date().toISOString();
    let newPages: any[] = [];
    setLandingPages((prev: any[]) => {
      newPages = prev.map((lp: any) => lp.id === pageId ? {
        ...lp, status, updatedAt: timestamp,
        publishedAt: status === 'published' ? timestamp : undefined
      } : lp);
      return newPages;
    });
    await DataService.saveImmediate('landing_pages', newPages, activeTenantId);
  }, [setLandingPages, activeTenantId]);

  // === COMPUTED ===
  const canAccessAdminChat = isAdminRole(user?.role);
  const platformOperator = isPlatformOperator(user?.role);
  const selectedTenantRecord = tenants.find((t: any) => t.id === activeTenantId) || null;
  const isTenantLockedByHost = Boolean(hostTenantId);
  const scopedTenants = isTenantLockedByHost ? tenants.filter((t: any) => t.id === hostTenantId) : tenants;
  const headerTenants = platformOperator ? scopedTenants : (selectedTenantRecord ? [selectedTenantRecord] : []);

  const value: AppContextType = {
    isLoading, products, orders, logo, themeConfig, websiteConfig,
    deliveryConfig, paymentMethods, facebookPixelConfig,
    categories, subCategories, childCategories, brands, tags,
    courierConfig, user, wishlist, cartItems: cart.cartItems,
    chatMessages: chat.chatMessages, isChatOpen: chat.isChatOpen,
    isAdminChatOpen: chat.isAdminChatOpen, hasUnreadChat: chat.hasUnreadChat,
    selectedProduct, checkoutQuantity, selectedVariant,
    landingPages, selectedLandingPage, isLoginOpen,
    activeTenantId, tenants, isTenantSwitching, isTenantSeeding, deletingTenantId,
    setUser, setIsLoginOpen, setSelectedProduct,
    handleLogin: auth.handleLogin, handleRegister: auth.handleRegister,
    handleGoogleLogin: auth.handleGoogleLogin, handleLogout: auth.handleLogout,
    handleUpdateProfile: auth.handleUpdateProfile,
    handlers,
    handleCartToggle: cart.handleCartToggle,
    handleAddProductToCart: cart.handleAddProductToCart,
    handleOpenChat: chat.handleOpenChat, handleCloseChat: chat.handleCloseChat,
    handleOpenAdminChat: chat.handleOpenAdminChat, handleCloseAdminChat: chat.handleCloseAdminChat,
    handleCustomerSendChat: chat.handleCustomerSendChat, handleAdminSendChat: chat.handleAdminSendChat,
    handleEditChatMessage: chat.handleEditChatMessage, handleDeleteChatMessage: chat.handleDeleteChatMessage,
    handleTenantChange, handleCreateTenant, handleDeleteTenant, refreshTenants,
    handleCreateLandingPage, handleUpsertLandingPage, handleToggleLandingPublish,
    canAccessAdminChat, headerTenants,
  };

  return (
    <AppContext.Provider value={value}>
      <AuthProvider>
        <LanguageProvider tenantId={activeTenantId}>
          <DarkModeProvider>
            <ThemeProvider themeConfig={themeConfig || undefined}>
              <Suspense fallback={null}>
                <Toaster position="top-right" toastOptions={{ duration: 2500 }} />
              </Suspense>
              {children}
            </ThemeProvider>
          </DarkModeProvider>
        </LanguageProvider>
      </AuthProvider>
    </AppContext.Provider>
  );
}
