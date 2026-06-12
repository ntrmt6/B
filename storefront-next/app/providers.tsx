'use client';

/**
 * Storefront AppProvider — storefront-only state
 * Copied from admin-next/app/providers.tsx with admin-specific parts removed.
 * Pages consume state via useApp() hook.
 */
import React, { createContext, useContext, useCallback, useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import VisitorTracker from './components/VisitorTracker';
import { useAppState } from '@/hooks/useAppState';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useChat } from '@/hooks/useChat';
import { useTenant } from '@/hooks/useTenant';
import { useAppHandlers } from '@/hooks/useAppHandlers';
import { useThemeEffects } from '@/hooks/useThemeEffects';
import { useFacebookPixel } from '@/hooks/useFacebookPixel';
import { useDataPersistence } from '@/hooks/useDataPersistence';
import { applyThemeToRoot } from '../lib/theme';
import {
  useSessionRestoration,
  useSessionPersistence,
  useSocketRoom,
  useInitialDataLoad,
  useDataRefresh,
} from '@/hooks/useAppEffects';
import { DataService } from '@/services/DataService';
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
  isLoading: boolean;
  products: Product[];
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
  hasUnreadChat: boolean;
  landingPages: LandingPage[];
  selectedLandingPage: LandingPage | null;
  isLoginOpen: boolean;
  activeTenantId: string;
  tenants: any[];
  isTenantSwitching: boolean;
  isTenantSeeding: boolean;
  deletingTenantId: string | null;

  setUser: (user: User | null) => void;
  setIsLoginOpen: (open: boolean) => void;
  setSelectedProduct: (product: Product | null) => void;

  handleLogin: (email: string, password: string) => Promise<any>;
  handleRegister: (user: User) => Promise<boolean>;
  handleGoogleLogin: () => Promise<any>;
  handleLogout: () => void;
  handleUpdateProfile: (user: User) => void;

  handlers: ReturnType<typeof useAppHandlers>;

  handleCartToggle: (productId: number, options?: any) => void;
  handleAddProductToCart: (product: Product, quantity: number, variant?: ProductVariantSelection, options?: { silent?: boolean }) => void;

  handleOpenChat: () => void;
  handleCloseChat: () => void;
  handleCustomerSendChat: (msg: string) => void;
  handleEditChatMessage: (id: string, text: string) => void;
  handleDeleteChatMessage: (id: string) => void;

  handleTenantChange: (id: string) => void;
  refreshTenants: () => Promise<any>;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
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

  const tenant = useTenant();
  const {
    tenants, activeTenantId, setActiveTenantId,
    hostTenantId, setHostTenantId, hostTenantSlug,
    isTenantSwitching, isTenantSeeding, deletingTenantId,
    refreshTenants, completeTenantSwitch,
    tenantsRef, activeTenantIdRef,
  } = tenant;

  const chat = useChat({ activeTenantId, isLoading, user, websiteConfig, isTenantSwitching });
  const cart = useCart({ user, products, tenantId: activeTenantId });

  const auth = useAuth({
    tenants, users, activeTenantId,
    setUser, setUsers, setActiveTenantId,
    setCurrentView: () => {},
    setAdminSection: () => {},
    setSelectedVariant: () => setSelectedVariant(null),
  });

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
      if (product) sessionStorage.setItem('checkout_product', JSON.stringify(product));
      else sessionStorage.removeItem('checkout_product');
    }
  }, []);

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
  const navigate = useCallback((path: string) => { router.push(path); }, [router]);

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

  useEffect(() => {
    applyThemeToRoot(themeConfig);
  }, [themeConfig]);

  useEffect(() => { refs.userRef.current = user; }, [user, refs]);

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

  const value: AppContextType = {
    isLoading, products, orders, logo, themeConfig, websiteConfig,
    deliveryConfig, paymentMethods, facebookPixelConfig,
    categories, subCategories, childCategories, brands, tags,
    courierConfig, user, wishlist, cartItems: cart.cartItems,
    chatMessages: chat.chatMessages, isChatOpen: chat.isChatOpen,
    hasUnreadChat: chat.hasUnreadChat,
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
    handleCustomerSendChat: chat.handleCustomerSendChat,
    handleEditChatMessage: chat.handleEditChatMessage,
    handleDeleteChatMessage: chat.handleDeleteChatMessage,
    handleTenantChange, refreshTenants,
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
              <VisitorTracker tenantId={activeTenantId} />
              {children}
            </ThemeProvider>
          </DarkModeProvider>
        </LanguageProvider>
      </AuthProvider>
    </AppContext.Provider>
  );
}
