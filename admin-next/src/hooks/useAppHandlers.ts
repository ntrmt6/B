/**
 * useAppHandlers.ts - All application handlers extracted from App.tsx
 */
import React, { useCallback, useMemo } from 'react';
import type {
  Product, Order, ThemeConfig, WebsiteConfig, DeliveryConfig,
  ProductVariantSelection, LandingPage, CourierConfig, FacebookPixelConfig, PaymentMethod, Role, User
} from '../types';
import type { LandingCheckoutPayload } from '../components/LandingPageComponents';
import { DataService } from '../services/DataService';
import { ensureUniqueProductSlug, ensureVariantSelection, isAdminRole } from '../utils/appHelpers';

const getTrackVisitorEvent = () => import('./useVisitorStats').then(m => m.trackVisitorEvent);

// Lazy load toast
let toastModule: typeof import('react-hot-toast') | null = null;
const getToast = async () => {
  if (toastModule) return toastModule;
  toastModule = await import('react-hot-toast');
  return toastModule;
};
const toast = {
  success: (msg: string) => getToast().then(m => m.toast.success(msg)),
  error: (msg: string) => getToast().then(m => m.toast.error(msg)),
};

// Generate a unique product ID that doesn't collide with existing IDs
// Uses max existing ID + 1 for true uniqueness
const generateUniqueProductId = (existingProducts: Product[]): number => {
  if (existingProducts.length === 0) {
    return Date.now();
  }
  // Use reduce instead of Math.max(...ids) to safely handle large arrays (spread with Math.max can cause stack overflow)
  const maxId = existingProducts.reduce((max, p) => Math.max(max, p.id), 0);
  // Always use maxId + 1 for consistency to avoid mixing sequential and timestamp-based IDs
  return maxId + 1;
};

interface UseAppHandlersProps {
  activeTenantId: string;
  products: Product[];
  orders: Order[];
  roles: Role[];
  wishlist: number[];
  checkoutQuantity: number;
  selectedProduct: Product | null;
  selectedVariant: ProductVariantSelection | null;
  user: User | null;
  cartItems: any[];
  
  // Setters
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
  setWishlist: React.Dispatch<React.SetStateAction<number[]>>;
  setCheckoutQuantity: React.Dispatch<React.SetStateAction<number>>;
  setSelectedProduct: (product: Product | null) => void;
  setSelectedVariant: React.Dispatch<React.SetStateAction<ProductVariantSelection | null>>;
  setSelectedLandingPage: React.Dispatch<React.SetStateAction<LandingPage | null>>;
  setCurrentView: (view: any) => void;
  setLogo: React.Dispatch<React.SetStateAction<string | null>>;
  setThemeConfig: React.Dispatch<React.SetStateAction<ThemeConfig | null>>;
  setWebsiteConfig: React.Dispatch<React.SetStateAction<WebsiteConfig | undefined>>;
  setDeliveryConfig: React.Dispatch<React.SetStateAction<DeliveryConfig[]>>;
  setPaymentMethods: React.Dispatch<React.SetStateAction<PaymentMethod[]>>;
  setCourierConfig: React.Dispatch<React.SetStateAction<CourierConfig>>;
  setFacebookPixelConfig: React.Dispatch<React.SetStateAction<FacebookPixelConfig>>;
  setCategories: React.Dispatch<React.SetStateAction<any[]>>;
  setSubCategories: React.Dispatch<React.SetStateAction<any[]>>;
  setChildCategories: React.Dispatch<React.SetStateAction<any[]>>;
  setBrands: React.Dispatch<React.SetStateAction<any[]>>;
  setTags: React.Dispatch<React.SetStateAction<any[]>>;
  
  // Functions
  handleAddProductToCart: (product: Product, quantity: number, variant?: ProductVariantSelection, options?: { silent?: boolean }) => void;
  navigate?: (path: string) => void;
}

export function useAppHandlers(props: UseAppHandlersProps) {
  const {
    activeTenantId,
    products,
    orders,
    roles,
    wishlist,
    checkoutQuantity,
    selectedProduct,
    selectedVariant,
    user,
    setProducts,
    setOrders,
    setRoles,
    setWishlist,
    setCheckoutQuantity,
    setSelectedProduct,
    setSelectedVariant,
    setSelectedLandingPage,
    setCurrentView,
    setLogo,
    setThemeConfig,
    setWebsiteConfig,
    setDeliveryConfig,
    setPaymentMethods,
    setCourierConfig,
    setFacebookPixelConfig,
    setCategories,
    setSubCategories,
    setChildCategories,
    setBrands,
    setTags,
    handleAddProductToCart,
    navigate: navigateProp,
  } = props;

  const navigate = useCallback((path: string) => {
    if (navigateProp) navigateProp(path);
    else if (typeof window !== 'undefined') window.location.href = path;
  }, [navigateProp]);

  // === ROLE HANDLERS ===
  const handleAddRole = useCallback((newRole: Role) => {
    const scopedRole = { ...newRole, tenantId: newRole.tenantId || activeTenantId };
    setRoles(prev => [...prev, scopedRole]);
  }, [activeTenantId, setRoles]);

  const handleUpdateRole = useCallback((updatedRole: Role) => {
    const scopedRole = { ...updatedRole, tenantId: updatedRole.tenantId || activeTenantId };
    setRoles(prev => prev.map(r => r.id === scopedRole.id ? scopedRole : r));
  }, [activeTenantId, setRoles]);

  const handleDeleteRole = useCallback((roleId: string) => {
    setRoles(prev => prev.filter(r => r.id !== roleId));
  }, [setRoles]);

  // === PRODUCT HANDLERS ===
  const handleAddProduct = useCallback((newProduct: Product) => {
    const tenantId = newProduct.tenantId || activeTenantId;
    setProducts(prev => {
      // Ensure the product has a unique ID
      let productId = newProduct.id;
      if (!productId || prev.some(p => p.id === productId)) {
        productId = generateUniqueProductId(prev);
      }
      const productWithId = { ...newProduct, id: productId };
      const slug = ensureUniqueProductSlug(productWithId.slug || productWithId.name || `product-${productId}`, prev, tenantId, productId);
      const productToAdd = { ...productWithId, slug, tenantId };
      console.log('[handleAddProduct] Adding product:', productToAdd.name, 'variantGroups:', productToAdd.variantGroups?.length || 0, 'details:', productToAdd.details?.length || 0);
      const updated = [...prev, productToAdd];
      // Save to backend
      DataService.save('products', updated, tenantId);
      return updated;
    });
  }, [activeTenantId, setProducts]);

  // Bulk add products - saves all at once to avoid race conditions
  const handleBulkAddProducts = useCallback((newProducts: Product[]) => {
    const tenantId = newProducts[0]?.tenantId || activeTenantId;
    setProducts(prev => {
      let updated = [...prev];
      const usedIds = new Set(updated.map(p => p.id));
      
      newProducts.forEach(newProduct => {
        // Ensure unique ID
        let productId = newProduct.id;
        if (!productId || usedIds.has(productId)) {
          productId = generateUniqueProductId(updated);
        }
        usedIds.add(productId);
        
        const productWithId = { ...newProduct, id: productId, tenantId };
        const slug = ensureUniqueProductSlug(productWithId.slug || productWithId.name || `product-${productId}`, updated, tenantId, productId);
        updated = [...updated, { ...productWithId, slug }];
      });
      
      // Save all products at once
      DataService.save('products', updated, tenantId);
      return updated;
    });
  }, [activeTenantId, setProducts]);

  const handleUpdateProduct = useCallback((updatedProduct: Product) => {
    const tenantId = updatedProduct.tenantId || activeTenantId;
    const slug = ensureUniqueProductSlug(updatedProduct.slug || updatedProduct.name || `product-${updatedProduct.id}`, products, tenantId, updatedProduct.id);
    setProducts(prev => {
      const productToUpdate = { ...updatedProduct, slug, tenantId };
      console.log('[handleUpdateProduct] Updating product:', productToUpdate.name, 'variantGroups:', productToUpdate.variantGroups?.length || 0, 'details:', productToUpdate.details?.length || 0);
      const updated = prev.map(p => p.id === updatedProduct.id ? productToUpdate : p);
      // Save to backend
      DataService.save('products', updated, tenantId);
      return updated;
    });
  }, [activeTenantId, products, setProducts]);

  const handleDeleteProduct = useCallback((id: number) => {
    setProducts(prev => {
      const updated = prev.filter(p => p.id !== id);
      // Save to backend
      DataService.save('products', updated, activeTenantId);
      return updated;
    });
  }, [setProducts, activeTenantId]);

  const handleBulkDeleteProducts = useCallback(async (ids: number[]) => {
    setProducts(prev => {
      const updated = prev.filter(p => !ids.includes(p.id));
      DataService.saveImmediate('products', updated, activeTenantId);
      return updated;
    });
  }, [setProducts, activeTenantId]);

  const handleBulkUpdateProducts = useCallback(async (ids: number[], updates: Partial<Product>) => {
    const { slug, ...restUpdates } = updates;
    setProducts(prev => {
      const updated = prev.map(p => ids.includes(p.id) ? { ...p, ...restUpdates } : p);
      DataService.saveImmediate('products', updated, activeTenantId);
      return updated;
    });
  }, [setProducts, activeTenantId]);

  const handleBulkFlashSale = useCallback(async (ids: number[], action: 'add' | 'remove') => {
    setProducts(prev => {
      const now = new Date();
      const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const updated = prev.map(p => {
        if (!ids.includes(p.id)) return p;
        if (action === 'add') {
          return {
            ...p,
            flashSale: true,
            flashSaleStartDate: now.toISOString(),
            flashSaleEndDate: endDate.toISOString()
          };
        } else {
          return {
            ...p,
            flashSale: false,
            flashSaleStartDate: undefined,
            flashSaleEndDate: undefined
          };
        }
      });
      DataService.saveImmediate('products', updated, activeTenantId);
      return updated;
    });
  }, [setProducts, activeTenantId]);

  const handleBulkTagAssign = useCallback(async (ids: number[], tagNames: string[]) => {
    setProducts(prev => {
      const updated = prev.map(p => {
        if (!ids.includes(p.id)) return p;
        const existingTags = p.tags || [];
        const mergedTags = Array.from(new Set([...existingTags, ...tagNames]));
        return { ...p, tags: mergedTags };
      });
      DataService.saveImmediate('products', updated, activeTenantId);
      return updated;
    });
    toast.success(`Assigned ${tagNames.length} tag(s) to ${ids.length} products`);
  }, [setProducts, activeTenantId]);

  const handleBulkStockUpdate = useCallback(async (ids: number[], quantity: number, mode: 'set' | 'add') => {
    setProducts(prev => {
      const updated = prev.map(p => {
        if (!ids.includes(p.id)) return p;
        const newStock = mode === 'set' ? quantity : (p.stock || 0) + quantity;
        return { ...p, stock: newStock };
      });
      DataService.saveImmediate('products', updated, activeTenantId);
      return updated;
    });
    toast.success(mode === 'set'
      ? `Set stock to ${quantity} for ${ids.length} products`
      : `Added ${quantity} to stock for ${ids.length} products`
    );
  }, [setProducts, activeTenantId]);

  // Handler to save product display order
  const handleProductOrderChange = useCallback(async (order: number[]) => {
    // Reorder products based on the provided order
    setProducts(prev => {
      // Create a map of product by id
      const productMap = new Map(prev.map(p => [p.id, p]));
      
      // Build ordered array following the new order
      const orderedProducts: Product[] = [];
      order.forEach(id => {
        const product = productMap.get(id);
        if (product) {
          orderedProducts.push(product);
          productMap.delete(id);
        }
      });
      
      // Append any products that weren't in the order (shouldn't happen but just in case)
      productMap.forEach(product => orderedProducts.push(product));
      
      // Save to backend - the order in the array determines display order
      DataService.save('products', orderedProducts, activeTenantId);
      
      return orderedProducts;
    });
  }, [setProducts, activeTenantId]);

  const handleBulkDiscount = useCallback((ids: number[], discountPercent: number) => {
    setProducts(prev => {
      const updated = prev.map(p => {
        if (!ids.includes(p.id)) return p;
        const originalPrice = p.originalPrice || p.price;
        const discountedPrice = Math.round(originalPrice * (1 - discountPercent / 100));
        return {
          ...p,
          originalPrice: originalPrice,
          price: discountedPrice,
          discount: `${discountPercent}%`
        };
      });
      // Save to backend
      DataService.save('products', updated, activeTenantId);
      toast.success(`Applied ${discountPercent}% discount to ${ids.length} products`);
      return updated;
    });
  }, [setProducts, activeTenantId]);

  // === ORDER HANDLERS ===
  const handleUpdateOrder = useCallback((orderId: string, updates: Partial<Order>) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates, tenantId: o.tenantId || activeTenantId } : o));
  }, [activeTenantId, setOrders]);

  const handleAddOrder = useCallback((newOrder: Order) => {
    const scopedOrder = { ...newOrder, tenantId: newOrder.tenantId || activeTenantId };
    setOrders(prev => [scopedOrder, ...prev]);
  }, [activeTenantId, setOrders]);

  // === WISHLIST HANDLERS ===
  const addToWishlist = useCallback((id: number) => {
    setWishlist(prev => prev.includes(id) ? prev : [...prev, id]);
  }, [setWishlist]);

  const removeFromWishlist = useCallback((id: number) => {
    setWishlist(prev => prev.filter(wId => wId !== id));
  }, [setWishlist]);

  const isInWishlist = useCallback((id: number) => wishlist.includes(id), [wishlist]);

  // === CHECKOUT HANDLERS ===
  const handleCheckoutStart = useCallback((product: Product, quantity: number = 1, variant?: ProductVariantSelection) => {
    if (activeTenantId) {
      const productPage = `/product/${product.slug || product.id}`;
      const sourcePage = typeof window !== 'undefined' ? window.location.pathname || '/' : '/';
      getTrackVisitorEvent()
        .then(trackVisitorEvent =>
          trackVisitorEvent(
            activeTenantId,
            'checkout_start',
            {
              productId: product.id,
              productName: product.name,
              productSlug: product.slug || '',
              productPage,
              sourcePage,
              quantity
            },
            `${activeTenantId}:checkout_start:${product.id}:${sourcePage}`
          )
        )
        .catch((error) => {
          console.warn('Failed to track checkout start:', error);
        });
    }

    setSelectedProduct(product);
    setCheckoutQuantity(quantity);
    setSelectedVariant(ensureVariantSelection(product, variant));
    setCurrentView('checkout');
    navigate('/checkout');
    // Preload success page while user is filling checkout form
    import('../views/StoreOrderSuccess').catch(() => {});
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTenantId, setSelectedProduct, setCheckoutQuantity, setSelectedVariant, setCurrentView, navigate]);

  const handleCheckoutFromCart = useCallback((productId: number) => {
    const targetProduct = products.find(p => p.id === productId);
    if (!targetProduct) {
      toast.error('Product unavailable for checkout');
      return;
    }
    handleCheckoutStart(targetProduct, 1, ensureVariantSelection(targetProduct));
  }, [products, handleCheckoutStart]);

  const handlePlaceOrder = useCallback(async (formData: any) => {
    const orderId = `#${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      id: orderId,
      tenantId: activeTenantId,
      customer: formData.fullName,
      location: formData.address,
      amount: formData.amount,
      date: new Date().toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: 'Pending',
      email: formData.email,
      phone: formData.phone,
      division: formData.division,
      district: formData.district,
      promoCode: formData.promoCode,
      promoDiscount: formData.promoDiscount,
      // promoCode: formData.promoCode,
      // promoDiscount: formData.promoDiscount,
      variant: ensureVariantSelection(selectedProduct, formData.variant || selectedVariant),
      productId: selectedProduct?.id,
      productName: selectedProduct?.name,
      quantity: formData.quantity || checkoutQuantity,
      // unit: selectedProduct?.unitName || 'pcs',
      productImage: selectedProduct?.image?.[0] || '',
      sku: selectedProduct?.sku || '',
      deliveryType: formData.deliveryType,
      deliveryCharge: formData.deliveryCharge,
      // Payment method info (for manual MFS payments)
      paymentMethod: formData.paymentMethod,
      paymentMethodId: formData.paymentMethodId,
      transactionId: formData.transactionId,
      customerPaymentPhone: formData.customerPaymentPhone,
      customerPhone: undefined,
      grandTotal: undefined,
      total: undefined,
      createdAt: '',
      items: undefined,
      weight: 0,
      pathaoArea: 0,
      pathaoZone: 0,
      pathaoCity: 0
    };

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001';
      const response = await fetch(`${apiBase}/api/orders/${activeTenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });
      
      if (response.ok) {
        const result = await response.json();
        setOrders(prev => [result.data || newOrder, ...prev]);
      } else {
        setOrders(prev => [newOrder, ...prev]);
      }
    } catch (error) {
      setOrders(prev => [newOrder, ...prev]);
    }

    setCurrentView('success');
    // Clear checkout state from sessionStorage after order
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('checkout_product');
      sessionStorage.removeItem('checkout_qty');
      sessionStorage.removeItem('checkout_variant');
    }
    navigate(`/success-order?orderId=${encodeURIComponent(orderId)}`);
    window.scrollTo(0, 0);
  }, [activeTenantId, selectedProduct, selectedVariant, checkoutQuantity, setOrders, setCurrentView, navigate]);

  const handleLandingOrderSubmit = useCallback(async (payload: LandingCheckoutPayload & { pageId: string; productId: number }) => {
    const product = products.find(p => p.id === payload.productId);
    if (!product) {
      toast.error('Product not found');
      return;
    }
    
    const orderId = `LP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const orderAmount = product.price * payload.quantity;
    const newOrder: Order = {
      id: orderId,
      tenantId: activeTenantId,
      customer: payload.fullName,
      location: payload.address,
      phone: payload.phone,
      amount: orderAmount,
      date: new Date().toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: 'Pending',
      email: payload.email,
      // division: payload.division,
      variant: ensureVariantSelection(product),
      productId: product.id,
      productName: product.name,
      quantity: payload.quantity,
      // unit: product.unitName || 'pcs',
      productImage: product.image?.[0] || '',
      sku: product.sku || '',
      source: 'landing_page',
      landingPageId: payload.pageId,
      customerPhone: undefined,
      grandTotal: undefined,
      total: undefined,
      createdAt: '',
      items: undefined,
      weight: 0,
      pathaoArea: 0,
      pathaoZone: 0,
      pathaoCity: 0
    };

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const response = await fetch(`${apiBase}/api/orders/${activeTenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });
      
      if (response.ok) {
        const result = await response.json();
        setOrders(prev => [result.data || newOrder, ...prev]);
        toast.success(`Order ${orderId} placed successfully! You will be contacted soon.`);
        
        // Show success message and redirect after 2 seconds
        setTimeout(() => {
          window.scrollTo(0, 0);
        }, 100);
      } else {
        setOrders(prev => [newOrder, ...prev]);
        toast.success(`Order ${orderId} placed successfully! You will be contacted soon.`);
      }
    } catch (error) {
      console.error('Order submission error:', error);
      setOrders(prev => [newOrder, ...prev]);
      toast.success(`Order ${orderId} placed successfully! You will be contacted soon.`);
    }
  }, [activeTenantId, products, setOrders]);

  const handleCloseLandingPreview = useCallback(() => {
    setSelectedLandingPage(null);
    setCurrentView(isAdminRole(user?.role) ? 'admin' : 'store');
  }, [user, setSelectedLandingPage, setCurrentView]);

  // === CONFIG HANDLERS ===
  const handleUpdateLogo = useCallback((newLogo: string | null) => {
    setLogo(newLogo);
    if (activeTenantId) {
      DataService.saveImmediate('logo', newLogo, activeTenantId);
    }
  }, [setLogo, activeTenantId]);
  
  const handleUpdateTheme = useCallback(async (newConfig: ThemeConfig) => {
    console.log('[handleUpdateTheme] Updating theme config:', newConfig);
    setThemeConfig(newConfig);
    if (activeTenantId) {
      console.log('[handleUpdateTheme] Saving to DataService for tenant:', activeTenantId);
      await DataService.saveImmediate('theme_config', newConfig, activeTenantId);
      console.log('[handleUpdateTheme] Saved to DataService successfully');
    }
  }, [activeTenantId, setThemeConfig]);

  const handleUpdateWebsiteConfig = useCallback(async (newConfig: WebsiteConfig) => {
    console.log('[handleUpdateWebsiteConfig] Saving website_config for tenant:', activeTenantId, 'productDetailTheme:', newConfig.productDetailTheme, 'readyTheme:', newConfig.readyTheme);
    setWebsiteConfig(newConfig);
    if (activeTenantId) {
      await DataService.saveImmediate('website_config', newConfig, activeTenantId);
      console.log('[handleUpdateWebsiteConfig] Save completed successfully');
    }
  }, [activeTenantId, setWebsiteConfig]);

  const handleUpdateCourierConfig = useCallback((config: CourierConfig) => setCourierConfig(config), [setCourierConfig]);
  const handleUpdateFacebookPixelConfig = useCallback((config: FacebookPixelConfig) => setFacebookPixelConfig(config), [setFacebookPixelConfig]);
  const handleUpdateDeliveryConfig = useCallback(async (configs: DeliveryConfig[]) => {
    setDeliveryConfig(configs);
    if (activeTenantId) {
      try {
        await DataService.save('delivery_config', configs, activeTenantId);
      } catch (error) {
        console.error('Failed to save delivery config:', error);
      }
    }
  }, [activeTenantId, setDeliveryConfig]);
  const handleUpdatePaymentMethods = useCallback(async (methods: PaymentMethod[]) => {
    console.log('[useAppHandlers] handleUpdatePaymentMethods called with', methods.length, 'methods');
    setPaymentMethods(methods);
    // Note: Data is already saved in AdminPaymentSettingsNew, no need to save again
  }, [setPaymentMethods]);

  // === CATALOG CRUD HANDLERS ===
  // Memoize catalog handlers to prevent re-creation loops
  const catHandlers = useMemo(() => ({
    add: (item: any) => {
      setCategories(prev => {
        const updated = [...prev, { ...item, tenantId: item?.tenantId || activeTenantId }];
        DataService.save('categories', updated, activeTenantId);
        return updated;
      });
    },
    update: (item: any) => {
      setCategories(prev => {
        const updated = prev.map((i: any) => i.id === item.id ? { ...item, tenantId: item?.tenantId || activeTenantId } : i);
        DataService.save('categories', updated, activeTenantId);
        return updated;
      });
    },
    delete: (id: string) => {
      setCategories(prev => {
        const updated = prev.filter((i: any) => i.id !== id);
        DataService.save('categories', updated, activeTenantId);
        return updated;
      });
    }
  }), [activeTenantId, setCategories]);

  const subCatHandlers = useMemo(() => ({
    add: (item: any) => {
      setSubCategories(prev => {
        const updated = [...prev, { ...item, tenantId: item?.tenantId || activeTenantId }];
        DataService.save('subcategories', updated, activeTenantId);
        return updated;
      });
    },
    update: (item: any) => {
      setSubCategories(prev => {
        const updated = prev.map((i: any) => i.id === item.id ? { ...item, tenantId: item?.tenantId || activeTenantId } : i);
        DataService.save('subcategories', updated, activeTenantId);
        return updated;
      });
    },
    delete: (id: string) => {
      setSubCategories(prev => {
        const updated = prev.filter((i: any) => i.id !== id);
        DataService.save('subcategories', updated, activeTenantId);
        return updated;
      });
    }
  }), [activeTenantId, setSubCategories]);

  const childCatHandlers = useMemo(() => ({
    add: (item: any) => {
      setChildCategories(prev => {
        const updated = [...prev, { ...item, tenantId: item?.tenantId || activeTenantId }];
        DataService.save('childcategories', updated, activeTenantId);
        return updated;
      });
    },
    update: (item: any) => {
      setChildCategories(prev => {
        const updated = prev.map((i: any) => i.id === item.id ? { ...item, tenantId: item?.tenantId || activeTenantId } : i);
        DataService.save('childcategories', updated, activeTenantId);
        return updated;
      });
    },
    delete: (id: string) => {
      setChildCategories(prev => {
        const updated = prev.filter((i: any) => i.id !== id);
        DataService.save('childcategories', updated, activeTenantId);
        return updated;
      });
    }
  }), [activeTenantId, setChildCategories]);

  const brandHandlers = useMemo(() => ({
    add: (item: any) => {
      setBrands(prev => {
        const updated = [...prev, { ...item, tenantId: item?.tenantId || activeTenantId }];
        DataService.save('brands', updated, activeTenantId);
        return updated;
      });
    },
    update: (item: any) => {
      setBrands(prev => {
        const updated = prev.map((i: any) => i.id === item.id ? { ...item, tenantId: item?.tenantId || activeTenantId } : i);
        DataService.save('brands', updated, activeTenantId);
        return updated;
      });
    },
    delete: (id: string) => {
      setBrands(prev => {
        const updated = prev.filter((i: any) => i.id !== id);
        DataService.save('brands', updated, activeTenantId);
        return updated;
      });
    }
  }), [activeTenantId, setBrands]);

  const tagHandlers = useMemo(() => ({
    add: (item: any) => {
      setTags(prev => {
        const updated = [...prev, { ...item, tenantId: item?.tenantId || activeTenantId }];
        DataService.save('tags', updated, activeTenantId);
        return updated;
      });
    },
    update: (item: any) => {
      setTags(prev => {
        const updated = prev.map((i: any) => i.id === item.id ? { ...item, tenantId: item?.tenantId || activeTenantId } : i);
        DataService.save('tags', updated, activeTenantId);
        return updated;
      });
    },
    delete: (id: string) => {
      setTags(prev => {
        const updated = prev.filter((i: any) => i.id !== id);
        DataService.save('tags', updated, activeTenantId);
        return updated;
      });
    }
  }), [activeTenantId, setTags]);

  return {
    // Role handlers
    handleAddRole,
    handleUpdateRole,
    handleDeleteRole,
    
    // Product handlers
    handleAddProduct,
    handleBulkAddProducts,
    handleUpdateProduct,
    handleDeleteProduct,
    handleBulkDeleteProducts,
    handleBulkUpdateProducts,
    handleBulkFlashSale,
    handleBulkTagAssign,
    handleBulkStockUpdate,
    handleBulkDiscount,
    handleProductOrderChange,
    
    // Order handlers
    handleUpdateOrder,
    handleAddOrder,
    
    // Wishlist handlers
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    
    // Checkout handlers
    handleCheckoutStart,
    handleCheckoutFromCart,
    handlePlaceOrder,
    handleLandingOrderSubmit,
    handleCloseLandingPreview,
    
    // Config handlers
    handleUpdateLogo,
    handleUpdateTheme,
    handleUpdateWebsiteConfig,
    handleUpdateCourierConfig,
    handleUpdateFacebookPixelConfig,
    handleUpdateDeliveryConfig,
    handleUpdatePaymentMethods,
    
    // Catalog handlers
    catHandlers,
    subCatHandlers,
    childCatHandlers,
    brandHandlers,
    tagHandlers,
  };
}

export type AppHandlers = ReturnType<typeof useAppHandlers>;
