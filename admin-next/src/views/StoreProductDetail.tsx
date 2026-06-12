
import React, { useState, useEffect, useMemo, lazy, Suspense, memo, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Product, User, WebsiteConfig, Order, ProductVariantSelection, Category, ProductVariantGroup, ProductVariantOption } from '../types';
import { DynamicLoadingFallback } from '../components/store/skeletons/DynamicLoadingFallback';

// Lazy load heavy layout components and modals from individual files
const StoreHeader = dynamic(() => import('../components/StoreHeader').then(m => ({ default: m.StoreHeader })));
const StoreFooter = dynamic(() => import('../components/store/StoreFooter').then(m => ({ default: m.StoreFooter })));
const AddToCartSuccessModal = dynamic(() => import('../components/store/AddToCartSuccessModal').then(m => ({ default: m.AddToCartSuccessModal })));
const MobileBottomNav = dynamic(() => import('../components/store/MobileBottomNav').then(m => ({ default: m.MobileBottomNav })));

// Dynamic imports with next/dynamic for better code splitting and Core Web Vitals
const ProductReviews = dynamic(
  () => import('../components/store/ProductReviews').then(m => ({ default: m.ProductReviews })),
  { ssr: false, loading: () => <DynamicLoadingFallback variant="reviews" /> }
);
const RelatedProductsSection = dynamic(
  () => import('../components/store/RelatedProductsSection').then(m => ({ default: m.RelatedProductsSection })),
  { ssr: false, loading: () => <DynamicLoadingFallback variant="related-products" /> }
);

// Lazy load visitor tracking
const getTrackPageView = () => import('../hooks/useVisitorStats').then(m => m.trackPageView);

// Skeleton loaders removed for faster initial render

import { Heart, Star, ShoppingCart, ShoppingBag, Smartphone, Watch, BatteryCharging, Headphones, Zap, Bluetooth, Gamepad2, Camera, ArrowLeft, Share2, AlertCircle, ZoomIn, X, ChevronLeft, ChevronRight, Grid, Home, Shirt, Baby, Gift, Laptop, Tv, Cable, Package, Sparkles, Tag, Layers, Play, Eye } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { LazyImage } from '../utils/performanceOptimization';
import { normalizeImageUrl } from '../utils/imageUrlHelper';

// Lazy load heavy modals from individual files
const TrackOrderModal = lazy(() => import('../components/store/TrackOrderModal').then(m => ({ default: m.TrackOrderModal })));

// Lightweight skeleton loader
const ProductDetailSkeleton = lazy(() => import('../components/SkeletonLoaders').then(m => ({ default: m.ProductDetailSkeleton })));

// Modern product detail page theme (ready-made theme)
const ModernProductDetailsPage = dynamic(() => import('@/productDetailPage/src/components/ProductDetails'));

// Gadgets product detail page theme
const GadgetsProductDetailsPage = dynamic(() => import('@/components/GadgetsProductsDetailPage').then(m => ({ default: m.ProductDetails })));

// Visual Preview Modal — 2D "In-Your-Space" room visualizer
const VisualPreviewModal = dynamic(() => import('../components/store/VisualPreviewModal').then(m => ({ default: m.VisualPreviewModal })), { ssr: false });

// Modal loading fallback
const ModalLoadingFallback = () => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
  </div>
);

// Helper for stars
const StarRating = ({ rating, count }: { rating: number, count?: number }) => (
  <div className="flex items-center gap-1">
    <div className="flex text-yellow-400">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={14} fill={s <= rating ? "currentColor" : "none"} className={s <= rating ? "text-yellow-400" : "text-gray-300"} />
      ))}
    </div>
    {count !== undefined && <span className="text-xs text-gray-400">({count} reviews)</span>}
  </div>
);

const iconMap: Record<string, React.ReactNode> = {
  smartphone: <Smartphone size={20} strokeWidth={1.5} />,
  mobile: <Smartphone size={20} strokeWidth={1.5} />,
  phone: <Smartphone size={20} strokeWidth={1.5} />,
  watch: <Watch size={20} strokeWidth={1.5} />,
  'battery-charging': <BatteryCharging size={20} strokeWidth={1.5} />,
  charger: <BatteryCharging size={20} strokeWidth={1.5} />,
  headphones: <Headphones size={20} strokeWidth={1.5} />,
  headphone: <Headphones size={20} strokeWidth={1.5} />,
  audio: <Headphones size={20} strokeWidth={1.5} />,
  zap: <Zap size={20} strokeWidth={1.5} />,
  bluetooth: <Bluetooth size={20} strokeWidth={1.5} />,
  'gamepad-2': <Gamepad2 size={20} strokeWidth={1.5} />,
  gaming: <Gamepad2 size={20} strokeWidth={1.5} />,
  gadget: <Gamepad2 size={20} strokeWidth={1.5} />,
  gadgets: <Gamepad2 size={20} strokeWidth={1.5} />,
  camera: <Camera size={20} strokeWidth={1.5} />,
  home: <Home size={20} strokeWidth={1.5} />,
  'home supply': <Home size={20} strokeWidth={1.5} />,
  fashion: <Shirt size={20} strokeWidth={1.5} />,
  fasion: <Shirt size={20} strokeWidth={1.5} />,
  clothing: <Shirt size={20} strokeWidth={1.5} />,
  baby: <Baby size={20} strokeWidth={1.5} />,
  gift: <Gift size={20} strokeWidth={1.5} />,
  laptop: <Laptop size={20} strokeWidth={1.5} />,
  computer: <Laptop size={20} strokeWidth={1.5} />,
  tv: <Tv size={20} strokeWidth={1.5} />,
  television: <Tv size={20} strokeWidth={1.5} />,
  cable: <Cable size={20} strokeWidth={1.5} />,
  'must have': <Sparkles size={20} strokeWidth={1.5} />,
  musthave: <Sparkles size={20} strokeWidth={1.5} />,
  essential: <Sparkles size={20} strokeWidth={1.5} />,
  grid: <Grid size={20} strokeWidth={1.5} />,
};

// Auto-detect icon from category name
const getCategoryIcon = (categoryName: string, iconKey?: string): React.ReactNode => {
  const nameLower = categoryName.toLowerCase().trim();
  // First check if icon key matches
  if (iconKey && iconMap[iconKey.toLowerCase()]) {
    return iconMap[iconKey.toLowerCase()];
  }
  // Then try exact match on name
  if (iconMap[nameLower]) {
    return iconMap[nameLower];
  }
  // Try partial match
  for (const [key, icon] of Object.entries(iconMap)) {
    if (nameLower.includes(key) || key.includes(nameLower)) {
      return icon;
    }
  }
  // Default
  return <Layers size={20} strokeWidth={1.5} />;
};

type MatchType = 'compatible' | 'complementary' | 'behavioral';

interface RelatedProductMatch {
  product: Product;
  matchType: MatchType;
  reason: string;
  stockCount: number;
  score: number;
}

const MATCH_PRIORITY: Record<MatchType, number> = {
  compatible: 3,
  complementary: 2,
  behavioral: 1,
};

const COMPLEMENTARY_CATEGORY_MAP: Record<string, string[]> = {
  Phones: ['Charger', 'Power Bank', 'Audio', 'Earbuds'],
  Watches: ['Charger', 'Audio', 'Phones'],
  Audio: ['Phones', 'Power Bank', 'Gaming'],
  Gaming: ['Audio', 'Accessories', 'Phones'],
  Charger: ['Phones', 'Power Bank', 'Audio'],
  'Power Bank': ['Phones', 'Audio', 'Watches'],
};

const capitalize = (value?: string) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : '');

const getProductBrandToken = (name?: string) => (name ? name.split(' ')[0].toLowerCase() : '');

const getProductStockCount = (product: Product) => {
  if (product.variantStock?.length) {
    return product.variantStock.reduce((total, variant) => total + (variant.stock || 0), 0);
  }
  return product.stock ?? 0;
};

const buildBehavioralReason = (tags?: string[]) => {
  if (tags?.length) {
    return `Customers eyeing ${tags[0]} accessories often grab this too.`;
  }
  return 'Frequently bought after viewing this item.';
};

const selectRelatedProducts = (current: Product, catalog: Product[]): RelatedProductMatch[] => {
  const baseBrand = getProductBrandToken(current.name);
  const baseCategory = current.category || '';
  const baseTags = [...(current.tags || []), ...(current.searchTags || [])];
  const complementCategories = COMPLEMENTARY_CATEGORY_MAP[baseCategory] || [];

  const candidates = catalog.filter(
    (candidate) => candidate.id !== current.id && candidate.tenantId === current.tenantId
  );

  const scored: RelatedProductMatch[] = candidates.map((candidate) => {
    const candidateBrand = getProductBrandToken(candidate.name);
    const sameBrand = baseBrand && candidateBrand && baseBrand === candidateBrand;
    const sameCategory = baseCategory && candidate.category === baseCategory;
    const isComplement = complementCategories.includes(candidate.category || '');
    const candidateAllTags = [...(candidate.tags || []), ...(candidate.searchTags || [])];
    const tagOverlap = baseTags.filter((tag) => candidateAllTags.includes(tag)).length;
    const stockCount = getProductStockCount(candidate);
    const inStock = stockCount > 0;

    let matchType: MatchType = 'behavioral';
    let reason = buildBehavioralReason(candidate.tags);
    let score = (candidate.rating || 0) * 6 + (candidate.reviews || 0) * 0.08;

    if (sameBrand) {
      matchType = 'compatible';
      score += 60;
      reason = `Complete your ${capitalize(baseBrand)} ecosystem.`;
    } else if (sameCategory) {
      matchType = 'compatible';
      score += 40;
      reason = `Explore more top-rated ${(candidate.category || 'tech').toLowerCase()} gear.`;
    } else if (isComplement) {
      matchType = 'complementary';
      score += 45;
      const formattedCategory = candidate.category || 'Accessory';
      const baseLabel = baseCategory ? baseCategory.toLowerCase() : 'setup';
      reason = `${capitalize(formattedCategory)} that pairs with your ${baseLabel}.`;
    }

    if (tagOverlap > 0) {
      score += tagOverlap * 8;
      if (matchType === 'behavioral') {
        reason = `Shoppers interested in ${baseTags.slice(0, 2).join(', ')} also add this.`;
      }
    }

    if (inStock) {
      score += Math.min(stockCount, 80) * 0.4;
    } else {
      score -= 200;
    }

    return { product: candidate, matchType, reason, stockCount, score };
  });

  const sortByPriority = (a: RelatedProductMatch, b: RelatedProductMatch) => {
    if (MATCH_PRIORITY[b.matchType] !== MATCH_PRIORITY[a.matchType]) {
      return MATCH_PRIORITY[b.matchType] - MATCH_PRIORITY[a.matchType];
    }
    if (b.score === a.score) {
      return b.stockCount - a.stockCount;
    }
    return b.score - a.score;
  };

  const compatibilityFirst = scored.filter((item) => item.matchType !== 'behavioral').sort(sortByPriority);
  const behavioralFallback = scored.filter((item) => item.matchType === 'behavioral').sort(sortByPriority);
  const combined = [...compatibilityFirst, ...behavioralFallback];
  return combined.slice(0, 6);
};

interface StoreProductDetailProps {
  product: Product;
  orders?: Order[];
  tenantId?: string;
  onBack?: () => void;
  onProductClick: (p: Product) => void;
  wishlistCount: number;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
  onCheckout: (p: Product, quantity: number, variant: ProductVariantSelection) => void;
  onAddToCart?: (p: Product, quantity: number, variant: ProductVariantSelection) => void;
  user?: User | null;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  onProfileClick?: () => void;
  logo?: string | null;
  websiteConfig?: WebsiteConfig;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onImageSearchClick?: () => void;
  onOpenChat?: () => void;
  cart?: number[];
  onToggleCart?: (id: number) => void;
  onCheckoutFromCart?: (productId: number) => void;
  productCatalog?: Product[];
  categories?: Category[];
  onCategoryClick?: (categoryName: string) => void;
}

const StoreProductDetail = ({
  product,
  orders,
  tenantId,
  onBack: onBackProp,
  onProductClick,
  wishlistCount,
  isWishlisted,
  onToggleWishlist,
  onCheckout,
  onAddToCart,
  user,
  onLoginClick,
  onLogoutClick,
  onProfileClick,
  logo,
  websiteConfig,
  searchValue,
  onSearchChange,
  onImageSearchClick,
  onOpenChat,
  cart,
  onToggleCart,
  onCheckoutFromCart,
  productCatalog,
  categories,
  onCategoryClick
}: StoreProductDetailProps) => {
  // Navigation handlers for header buttons
  const onBack = () => {
    if (onBackProp) {
      onBackProp();
      return;
    }
    if (typeof window !== 'undefined') window.location.href = '/';
  };

  const handleCategoriesNav = () => {
    if (typeof window !== 'undefined') window.location.href = '/all-products';
  };

  const handleProductsNav = useCallback(() => {
    if (typeof window !== 'undefined') window.location.href = '/all-products';
  }, []);

  const handleCategorySelect = useCallback((categoryName: string) => {
    if (onCategoryClick) {
      onCategoryClick(categoryName);
    }
  }, [onCategoryClick]);

  const categoriesList = useMemo(() => {
    return categories?.map(cat => cat.name) || [];
  }, [categories]);

  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
  const [showCartSuccess, setShowCartSuccess] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');
  const [isLoading, setIsLoading] = useState(true);
  const [isVisualPreviewOpen, setIsVisualPreviewOpen] = useState(false);
  const thumbnailScrollRef = useRef<HTMLDivElement>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Track product page view
  useEffect(() => {
    if (!tenantId || !product) return;
    const trackVisit = async () => {
      try {
        const trackPageView = await getTrackPageView();
        const page = `/product/${product.slug || product.id}`;
        trackPageView(tenantId, page);
      } catch (err) {
        console.warn('Failed to track page view:', err);
      }
    };
    trackVisit();
  }, [tenantId, product?.id]);

  // Simulate initial data loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, [product.id]);
  const galleryImages = product.galleryImages && product.galleryImages.length ? product.galleryImages.map(url => normalizeImageUrl(url)) : [normalizeImageUrl(product.image)];
  // Helper function to extract YouTube video ID
  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Get YouTube video ID if available
  const youtubeVideoId = product.videoUrl ? getYouTubeVideoId(product.videoUrl) : null;
  const [showVideo, setShowVideo] = useState(youtubeVideoId ? true : false);
  const [selectedImage, setSelectedImage] = useState(galleryImages[0]);
  const fallbackColor = product.variantDefaults?.color || 'Default';
  const fallbackSize = product.variantDefaults?.size || 'Standard';
  const colorOptions = product.colors && product.colors.length ? product.colors : [fallbackColor];
  const sizeOptions = product.sizes && product.sizes.length ? product.sizes : [fallbackSize];
  const showColorSelector = (product.colors?.length || 0) > 0;
  const showSizeSelector = (product.sizes?.length || 0) > 0;
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);
  const [selectedSize, setSelectedSize] = useState(sizeOptions[0]);
  const [variantError, setVariantError] = useState<string | null>(null);
  const [lastAddedVariant, setLastAddedVariant] = useState<ProductVariantSelection | null>(null);
  
  // Enhanced variant group selections
  const [selectedVariantOptions, setSelectedVariantOptions] = useState<Record<string, ProductVariantOption>>({});
  const hasVariantGroups = product.variantGroups && product.variantGroups.length > 0;
  
  // Initialize variant selections when product changes
  useEffect(() => {
    if (product.variantGroups) {
      const initialSelections: Record<string, ProductVariantOption> = {};
      product.variantGroups.forEach(group => {
        if (group.options.length > 0) {
          initialSelections[group.title] = group.options[0];
        }
      });
      setSelectedVariantOptions(initialSelections);
    }
  }, [product.id]);
  
  // Handle variant option selection with image update
  const handleVariantOptionSelect = (groupTitle: string, option: ProductVariantOption) => {
    setSelectedVariantOptions(prev => ({ ...prev, [groupTitle]: option }));
    // If the option has an image, update the main displayed image
    if (option.image) {
      setSelectedImage(normalizeImageUrl(option.image));
    }
  };
  
  // Calculate extra price from selected variants
  const variantExtraPrice = useMemo(() => {
    return Object.values(selectedVariantOptions).reduce((sum, opt) => sum + (opt?.extraPrice || 0), 0);
  }, [selectedVariantOptions]);
  
  // Display price with variant extras
  const displayPrice = useMemo(() => {
    return product.price + variantExtraPrice;
  }, [product.price, variantExtraPrice]);
  const shareBase = typeof window !== 'undefined' ? window.location.origin : 'https://mydomain.com';
  const shareUrl = `${shareBase}/product-details/${product.slug || product.id}`;

  useEffect(() => {
    const refreshGallery = product.galleryImages && product.galleryImages.length ? product.galleryImages.map(url => normalizeImageUrl(url)) : [normalizeImageUrl(product.image)];
    setSelectedImage(refreshGallery[0]);
    setSelectedImageIndex(0);
    setSelectedColor(colorOptions[0]);
    setSelectedSize(sizeOptions[0]);
    setQuantity(1);
    setVariantError(null);
  }, [product.id]);

  // Thumbnail navigation helpers
  const scrollThumbnails = (direction: 'left' | 'right') => {
    if (thumbnailScrollRef.current) {
      const scrollAmount = 100;
      thumbnailScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleThumbnailSelect = (img: string, index: number) => {
    setSelectedImage(img);
    setSelectedImageIndex(index);
    setShowVideo(false);
  };

  const handlePrevImage = () => {
    const newIndex = selectedImageIndex > 0 ? selectedImageIndex - 1 : galleryImages.length - 1;
    setSelectedImageIndex(newIndex);
    setSelectedImage(galleryImages[newIndex]);
  };

  const handleNextImage = () => {
    const newIndex = selectedImageIndex < galleryImages.length - 1 ? selectedImageIndex + 1 : 0;
    setSelectedImageIndex(newIndex);
    setSelectedImage(galleryImages[newIndex]);
  };

  useEffect(() => {
    if (variantError) {
      setVariantError(null);
    }
  }, [selectedColor, selectedSize, quantity, variantError]);

  const additionalImages = galleryImages;

  // Filter only Active products for store display
  const catalogProducts = useMemo(() => {
    const allProducts = Array.isArray(productCatalog) && productCatalog.length ? productCatalog : [];
    return allProducts.filter(p => !p.status || p.status === 'Active');
  }, [productCatalog]);

  const relatedProducts = useMemo(() => selectRelatedProducts(product, catalogProducts), [product, catalogProducts]);

  const currentVariant: ProductVariantSelection = useMemo(() => ({
    color: selectedColor || fallbackColor,
    size: selectedSize || fallbackSize,
  }), [selectedColor, selectedSize, fallbackColor, fallbackSize]);

  const variantStockEntry = product.variantStock?.find(v => v.color === currentVariant.color && v.size === currentVariant.size);
  const availableStock = variantStockEntry?.stock ?? product.stock ?? Infinity;
  const isOutOfStock = !Number.isFinite(availableStock) ? false : availableStock <= 0;
  const atStockLimit = Number.isFinite(availableStock) && quantity >= (availableStock as number);

  // Use displayPrice which includes variant extras
  const formattedPrice = formatCurrency(hasVariantGroups ? displayPrice : product.price);
  const formattedOriginalPrice = formatCurrency(product.originalPrice, null);

  const decreaseQuantity = () => setQuantity(prev => Math.max(1, prev - 1));
  const increaseQuantity = () => {
    if (!Number.isFinite(availableStock) || quantity < (availableStock as number)) {
      setQuantity(prev => prev + 1);
    }
  };

  const validateVariant = () => {
    if ((showColorSelector && !selectedColor) || (showSizeSelector && !selectedSize)) {
      setVariantError('Please choose a color and size option.');
      return false;
    }
    if (isOutOfStock) {
      setVariantError('Selected variant is currently out of stock.');
      return false;
    }
    if (Number.isFinite(availableStock) && quantity > (availableStock as number)) {
      setVariantError('Reduce quantity to match available stock.');
      return false;
    }
    setVariantError(null);
    return true;
  };

  const handleAddToCart = () => {
    if (!validateVariant()) return;
    onAddToCart?.(product, quantity, currentVariant);
    setLastAddedVariant(currentVariant);
    setShowCartSuccess(true);
  };

  const handleBuyNow = () => {
    if (!validateVariant()) return;
    onCheckout(product, quantity, currentVariant);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleShareLink = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url: shareUrl });
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        alert('Product link copied to clipboard');
        return;
      }
      window.prompt('Copy this product link', shareUrl);
    } catch (error) {
      console.warn('Share cancelled', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 font-sans text-slate-900 pb-20 md:pb-0">
        <Suspense fallback={null}>
          <ProductDetailSkeleton />
        </Suspense>
      </div>
    );
  }

  const activeProductDetailTheme = websiteConfig?.productDetailTheme || 'modern';

  // Render modern product detail theme by default unless classic/default is explicitly selected
  if (activeProductDetailTheme === 'modern') {
    return (
      <>
        <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" /></div>}>
          <ModernProductDetailsPage
            product={{
              ...product,
              galleryImages: galleryImages,
            }}
            relatedProducts={relatedProducts.map(r => r.product)}
            recentProducts={catalogProducts.slice(0, 8)}
            categories={categories}
            websiteConfig={websiteConfig}
            logo={logo}
            onBack={onBack}
            onProductClick={(id) => {
              const p = catalogProducts.find(cp => cp.id === id);
              if (p) onProductClick(p);
            }}
            onAddToCart={handleAddToCart}
            onCheckout={handleBuyNow}
            onShare={handleShareLink}
            cart={cart}
            onToggleCart={onToggleCart}
            currency={websiteConfig?.shopCurrency === 'USD' ? '$' : '৳'}
            tenantId={tenantId}
            user={user ? { name: user.name || user.email, email: user.email } : null}
            onLoginClick={onLoginClick}
            onChatClick={onOpenChat}
            onCategoryClick={handleCategorySelect}
            onVisualPreview={() => setIsVisualPreviewOpen(true)}
          />
        </Suspense>
        {isVisualPreviewOpen && (
          <Suspense fallback={<ModalLoadingFallback />}>
            <VisualPreviewModal product={product} onClose={() => setIsVisualPreviewOpen(false)} />
          </Suspense>
        )}
      </>
    );
  }

  // Render gadgets product detail theme
  if (activeProductDetailTheme === 'gadgets') {
    const currencySymbol = websiteConfig?.shopCurrency === 'USD' ? '$' : '৳';
    return (
      <div className="min-h-screen bg-white font-sans text-slate-900">
        <Suspense fallback={null}>
          <StoreHeader
            onTrackOrder={() => setIsTrackOrderOpen(true)}
            onHomeClick={onBack}
            wishlistCount={wishlistCount}
            cart={cart}
            onToggleCart={onToggleCart}
            onCheckoutFromCart={onCheckoutFromCart}
            productCatalog={catalogProducts}
            user={user}
            onLoginClick={onLoginClick}
            onLogoutClick={onLogoutClick}
            onProfileClick={onProfileClick}
            logo={logo}
            websiteConfig={websiteConfig}
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            onProductClick={onProductClick}
            tenantId={tenantId}
            onCategoriesClick={handleCategoriesNav}
            onProductsClick={handleProductsNav}
            categoriesList={categoriesList}
            onCategorySelect={handleCategorySelect}
            categories={categories}
          />
        </Suspense>

        {isTrackOrderOpen && (
          <Suspense fallback={<ModalLoadingFallback />}>
            <TrackOrderModal onClose={() => setIsTrackOrderOpen(false)} orders={orders} />
          </Suspense>
        )}
        {showCartSuccess && (
          <AddToCartSuccessModal
            product={product}
            variant={lastAddedVariant || currentVariant}
            quantity={quantity}
            onClose={() => setShowCartSuccess(false)}
            onCheckout={() => onCheckout(product, quantity, lastAddedVariant || currentVariant)}
          />
        )}

        <GadgetsProductDetailsPage
          product={{
            ...product,
            galleryImages: galleryImages,
          }}
          relatedProducts={relatedProducts.map(r => ({
            id: r.product.id,
            name: r.product.name,
            price: r.product.price,
            originalPrice: r.product.originalPrice,
            image: r.product.image,
            rating: r.product.rating,
            slug: r.product.slug,
          }))}
          categories={categories}
          currency={currencySymbol}
          tenantId={tenantId}
          user={user ? { name: user.name || user.email, email: user.email } : null}
          onLoginClick={onLoginClick}
          onAddToCart={handleAddToCart}
          onCheckout={handleBuyNow}
          onBack={onBack}
          onProductClick={(id) => {
            const p = catalogProducts.find(cp => cp.id === id);
            if (p) onProductClick(p);
          }}
          onCategoryClick={handleCategorySelect}
          onVisualPreview={() => setIsVisualPreviewOpen(true)}
        />

        <Suspense fallback={null}>
          <StoreFooter websiteConfig={websiteConfig} logo={logo} tenantId={tenantId} onOpenChat={onOpenChat} />
        </Suspense>

        {isVisualPreviewOpen && (
          <Suspense fallback={<ModalLoadingFallback />}>
            <VisualPreviewModal product={product} onClose={() => setIsVisualPreviewOpen(false)} />
          </Suspense>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-slate-900 pb-28 md:pb-0 animate-fadeIn mobile-smooth-scroll" style={{ animation: 'fadeIn 0.2s ease-out', background: 'linear-gradient(to bottom, #f0f4f8, #e8ecf1)' }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <Suspense fallback={null}>
        <StoreHeader
          onTrackOrder={() => setIsTrackOrderOpen(true)}
          onHomeClick={onBack}
          wishlistCount={wishlistCount}
          cart={cart}
          onToggleCart={onToggleCart}
          onCheckoutFromCart={onCheckoutFromCart}
          productCatalog={catalogProducts}
          user={user}
          onLoginClick={onLoginClick}
          onLogoutClick={onLogoutClick}
          onProfileClick={onProfileClick}
          logo={logo}
          websiteConfig={websiteConfig}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          onProductClick={onProductClick}
          tenantId={tenantId}
          onCategoriesClick={handleCategoriesNav}
          onProductsClick={handleProductsNav}
          categoriesList={categoriesList}
          onCategorySelect={handleCategorySelect}
          categories={categories}
        />
      </Suspense>

      {isTrackOrderOpen && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <TrackOrderModal onClose={() => setIsTrackOrderOpen(false)} orders={orders} />
        </Suspense>
      )}
      {showCartSuccess && (
        <AddToCartSuccessModal
          product={product}
          variant={lastAddedVariant || currentVariant}
          quantity={quantity}
          onClose={() => setShowCartSuccess(false)}
          onCheckout={() => onCheckout(product, quantity, lastAddedVariant || currentVariant)}
        />
      )}

      {/* Image Zoom Modal */}
      {isZoomOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl max-h-[90vh]">
            <button
              onClick={() => setIsZoomOpen(false)}
              className="absolute -to p-10 right-0 text-white hover:text-gray-300 transition p-2"
              aria-label="Close zoom"
            >
              <X size={28} />
            </button>

            <div className="w-full h-full max-h-[90vh] overflow-auto bg-black rounded-lg">
              <div className="relative w-full bg-black flex items-center justify-center min-h-[90vh]">
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>

            {/* Thumbnail Gallery in Zoom Modal */}
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              {additionalImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`flex-shrink-0 w-12 h-12 rounded border-2 p-0.5 transition-all ${selectedImage === img
                    ? 'border-theme-primary bg-theme-primary/10'
                    : 'border-gray-600 hover:border-theme-primary/70'
                    }`}
                  aria-label={`View image ${idx + 1}`}
                >
                  <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-4">
        <div className="flex flex-col lg:flex-row gap-4">

          {/* Main Content: Product Details */}
          <div className="flex-1">
            {/* Product Hero Block */}

<div className="bg-white/90 backdrop-blur-xl rounded-2xl md:rounded-[32px] p-4 md:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col md:flex-row gap-4 md:gap-10 animate-slide-up">

  {/* --- Image Section: Enhanced Boutique Gallery --- */}
  <div className="w-full md:w-1/2 flex flex-col gap-6">
    <div className="relative group/main">
      {showVideo && youtubeVideoId ? (
        <div className="aspect-square bg-slate-950 rounded-[24px] overflow-hidden relative shadow-2xl border border-slate-200">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&mute=1&rel=0`}
            title="Product Video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>
      ) : (
        <div className="flex gap-4 mb-4">
          {/* Main Image Container */}
          <div className="flex-1 min-w-0">
            <div
              className="aspect-square bg-white rounded-[24px] overflow-hidden relative border border-slate-100 cursor-zoom-in group shadow-sm transition-all duration-500 hover:shadow-xl"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                setZoomPosition({ x, y });
              }}
              onClick={() => setIsZoomOpen(true)}
            >
              <LazyImage
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
              />

              {/* Enhanced Badges */}
              <div className="absolute top-5 left-5 flex flex-col gap-2">
                {product.discount && (
                  <span className="bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg tracking-widest uppercase">
                    {product.discount} OFF
                  </span>
                )}
              </div>

              {/* Wishlist Icon */}
              <button
                onClick={(e) => { e.stopPropagation(); onToggleWishlist(); }}
                className={`absolute top-5 right-5 p-3 rounded-full transition-all duration-300 transform active:scale-75 shadow-lg ${
                  isWishlisted ? 'bg-rose-500 text-white' : 'bg-white text-slate-400 hover:text-rose-500 hover:bg-rose-50'
                }`}
              >
                <Heart size={20} fill={isWishlisted ? "currentColor" : "none"} strokeWidth={2} />
              </button>

              {/* Main Gallery Arrows */}
              {galleryImages.length > 1 && (
                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <button onClick={(e) => { e.stopPropagation(); handlePrevImage(); }} className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-slate-900 hover:bg-white transition-all transform active:scale-90">
                    <ChevronLeft size={20} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleNextImage(); }} className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-slate-900 hover:bg-white transition-all transform active:scale-90">
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Zoom Preview - Right Side */}
          {isHovering && (
            <div className="hidden lg:block w-48 h-auto">
              <div 
                className="bg-slate-100 rounded-[24px] aspect-square overflow-hidden border-2 border-slate-300 shadow-xl"
                style={{
                  backgroundImage: `url(${selectedImage})`,
                  backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  backgroundSize: '250%',
                  backgroundRepeat: 'no-repeat'
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>

    {/* Enhanced Thumbnail Gallery */}
    <div className="relative px-2">
      <div
        ref={thumbnailScrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide py-2 scroll-smooth"
      >
        {youtubeVideoId && (
          <button
            onClick={() => { setShowVideo(true); setSelectedImageIndex(-1); }}
            className={`flex-shrink-0 w-20 h-20 rounded-xl border-2 transition-all overflow-hidden relative group/vid ${
              showVideo ? 'border-theme-primary ring-4 ring-theme-primary/10 shadow-lg' : 'border-slate-100 hover:border-theme-primary/40'
            }`}
          >
            <img src={`https://img.youtube.com/vi/${youtubeVideoId}/mqdefault.jpg`} alt="Video" className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 group-hover/vid:bg-slate-900/20 transition-all">
              <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-theme-primary shadow-sm"><Play size={16} fill="currentColor" /></div>
            </div>
          </button>
        )}
        {additionalImages.map((img, idx) => (
          <button
            key={idx}
            onClick={() => handleThumbnailSelect(img, idx)}
            onMouseEnter={() => handleThumbnailSelect(img, idx)}
            className={`flex-shrink-0 w-20 h-20 rounded-xl border-2 transition-all overflow-hidden group/thumb ${
              selectedImageIndex === idx ? 'border-theme-primary ring-4 ring-theme-primary/10 shadow-lg' : 'border-slate-100 hover:border-theme-primary/40'
            }`}
          >
            <LazyImage src={img} alt="Thumb" className="w-full h-full object-contain transition-transform duration-500 group-hover/thumb:scale-110" />
          </button>
        ))}
      </div>
    </div>
  </div>

  {/* --- Info Section: Clean & Structured Typography --- */}
  <div className="w-full md:w-1/2 flex flex-col">
    <div className="mb-3 md:mb-6 space-y-2">
      <h1 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight leading-snug">{product.name}</h1>
      {product.vendorName && (
        <p className="text-xs font-medium text-slate-500">
          Sold by <span className="text-[#FF8C00] font-semibold">{product.vendorName}</span>
        </p>
      )}
      {product.tenantName && (
        <p className="text-xs font-medium text-slate-500">
          Store: <a href={`/store/${product.tenantSlug || ''}`} className="text-indigo-600 font-semibold hover:underline">{product.tenantName}</a>
        </p>
      )}
      <div className="flex items-center gap-3">
        <StarRating rating={product.rating || 0} count={product.reviews} />
        <div className="h-3 w-px bg-slate-200" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.sku}</span>
      </div>
    </div>

    <div className="flex items-baseline gap-3 mb-4 md:mb-8">
      <span className="text-2xl md:text-4xl font-black text-slate-900">৳ {formattedPrice}</span>
      {formattedOriginalPrice && (
        <span className="text-base md:text-xl text-slate-300 line-through font-medium">৳ {formattedOriginalPrice}</span>
      )}
    </div>

    {/* Share Button Section */}
    <div className="mb-4 md:mb-10 flex items-center gap-4">
      <button
        type="button"
        onClick={handleShareLink}
        className="inline-flex items-center gap-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] md:text-xs font-black uppercase tracking-widest px-4 md:px-6 py-2 md:py-3 transition-all active:scale-95"
      >
        <Share2 size={14} strokeWidth={2.5} /> Share
      </button>
      <button
        type="button"
        onClick={() => setIsVisualPreviewOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] md:text-xs font-black uppercase tracking-widest px-4 md:px-6 py-2 md:py-3 transition-all active:scale-95"
      >
        <Eye size={14} strokeWidth={2.5} /> See in my room
      </button>
    </div>

    <div className="space-y-4 md:space-y-8 mb-4 md:mb-10">
      {/* Quantity Selector */}
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Quantity</p>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-0.5">
            <button onClick={decreaseQuantity} className="w-9 h-9 flex items-center justify-center text-slate-900 font-bold hover:bg-white hover:shadow-sm rounded-lg transition-all text-lg">-</button>
            <span className="w-10 text-center font-black text-slate-900 text-sm">{quantity}</span>
            <button onClick={increaseQuantity} disabled={atStockLimit} className={`w-9 h-9 flex items-center justify-center font-bold rounded-lg transition-all text-lg ${atStockLimit ? 'text-slate-300' : 'text-slate-900 hover:bg-white hover:shadow-sm'}`}>+</button>
          </div>
          {Number.isFinite(availableStock) && (
            <span className={`text-[10px] font-bold uppercase tracking-tight ${isOutOfStock ? 'text-red-500' : 'text-slate-400'}`}>
              {isOutOfStock ? 'Sold Out' : `${availableStock} left`}
            </span>
          )}
        </div>
      </div>

      {/* Variant Selectors: Modern Pill Buttons */}
      <div className="space-y-3 md:space-y-6">
        {showColorSelector && (
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Color: <span className="text-slate-900 ml-1">{selectedColor}</span></label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map(color => (
                <button key={color} onClick={() => setSelectedColor(color)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border-2 ${selectedColor === color ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300'}`}>{color}</button>
              ))}
            </div>
          </div>
        )}

        {showSizeSelector && (
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Size: <span className="text-slate-900 ml-1">{selectedSize}</span></label>
            <div className="flex flex-wrap gap-2">
              {sizeOptions.map(size => (
                <button key={size} onClick={() => setSelectedSize(size)} className={`min-w-[44px] h-10 flex items-center justify-center rounded-lg text-xs font-bold transition-all border-2 ${selectedSize === size ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300'}`}>{size}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Primary Action Buttons */}
    <div className="hidden md:flex gap-3 mb-6">
      <button
        onClick={handleAddToCart}
        disabled={isOutOfStock}
        className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-2.5 transition-all active:scale-[0.97] ${isOutOfStock ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-200'}`}
      >
        <ShoppingCart size={16} strokeWidth={2.5} /> Add to Cart
      </button>
      <button
        onClick={handleBuyNow}
        disabled={isOutOfStock}
        className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-2.5 transition-all active:scale-[0.97] ${isOutOfStock ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-theme-primary text-white hover:brightness-110 shadow-xl shadow-theme-primary/20'}`}
      >
        <Zap size={16} strokeWidth={2.5} fill="currentColor" /> Buy Now
      </button>
    </div>

    {/* Product Meta Data: Elegant List */}
    <div className="grid grid-cols-2 gap-y-4 pt-8 border-t border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-slate-300 tracking-[0.2em]">Category</span>
        <span className="text-slate-900">{product.category || 'Lifestyle'}</span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-slate-300 tracking-[0.2em]">Warranty</span>
        <span className="text-slate-900">{product.warranty || 'No Warranty'}</span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-slate-300 tracking-[0.2em]">Shipping</span>
        <span className="text-green-600">Free Delivery</span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-slate-300 tracking-[0.2em]">Popularity</span>
        <span className="text-slate-900">{(product.initialSoldCount || 0) + (product.soldCount || 0)}+ Sold</span>
      </div>
    </div>
  </div>
</div>
              

            {/* Tabs Section */}
            <div className="mt-2 glass-card rounded-xl overflow-hidden animate-slide-up">
              <div className="mobile-tab-nav flex border-b border-gray-100">
                <button
                  onClick={() => setActiveTab('description')}
                  className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition whitespace-nowrap border-emerald-500 text-emerald-600 flex-1 mobile-touch-feedback ${activeTab === 'description' ? 'active' : 'text-gray-600'
                    }`}
                  aria-selected={activeTab === 'description'}
                  role="tab"
                >
                  Description
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition whitespace-nowrap border-emerald-500 text-emerald-600 flex-1 mobile-touch-feedback ${activeTab === 'reviews' ? 'active' : 'text-gray-600'
                    }`}
                  aria-selected={activeTab === 'reviews'}
                  role="tab"
                >
                  Reviews
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-theme-primary/15 text-xs font-bold text-theme-primary">
                    {product.reviews || 0}
                  </span>
                </button>
              </div>
              <div className="p-4 min-h-[100px]">
                {activeTab === 'description' ? (
                  <div className="text-gray-600 leading-relaxed space-y-4">
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: product.description || "No description available for this product."
                      }}
                    />
                    <p className="text-sm italic text-gray-500">Experience premium quality with our latest collection. This product features state-of-the-art technology, ergonomic design for comfort, and durable materials that last. Perfect for daily use or special occasions.</p>
                  </div>
                ) : (
                  <ProductReviews
                      productId={product.id}
                      productName={product.name}
                      tenantId={tenantId || ''}
                      user={user || null}
                      onLoginClick={onLoginClick || (() => {})}
                    />
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="w-full lg:w-80 space-y-4">

            {/* Related Products Widget */}
            <RelatedProductsSection
              relatedProducts={relatedProducts}
              isLoading={isLoading}
              onProductClick={onProductClick}
            />

            {/* Category Widget */}
            <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500">
  {/* হেডার সেকশন */}
  <div className="flex items-center justify-between mb-6">
    <h3 className="font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-theme-primary animate-pulse"></span>
      Categories
    </h3>
    <div className="h-[1px] flex-1 bg-slate-100 ml-4"></div>
  </div>

  <div className="space-y-1.5">
    {(categories && categories.length > 0 
      ? categories.filter(c => c.status === 'Active').slice(0, 6) 
      : []
    ).map((cat, idx) => (
      <div
        key={idx}
        onClick={() => onCategoryClick?.(cat.slug || cat.name)}
        className="group relative flex items-center gap-4 p-3 rounded-[16px] hover:bg-theme-primary/5 transition-all duration-300 cursor-pointer overflow-hidden active:scale-[0.98]"
      >
        {/* একটি সূক্ষ্ম লেফট বর্ডার ইন্ডিকেটর যা হোভারে দেখা যাবে */}
        <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-theme-primary rounded-r-full -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>

        {/* আইকন/ইমেজ কন্টেইনার */}
        <div className="relative w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:bg-white group-hover:border-theme-primary/20 group-hover:shadow-lg group-hover:shadow-theme-primary/10">
          {cat.image || (cat.icon && cat.icon.startsWith('http')) ? (
            <img
              src={normalizeImageUrl(cat.image || cat.icon || '')}
              alt={cat.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <span className="text-slate-400 group-hover:text-theme-primary transition-colors duration-300 transform group-hover:scale-110">
              {getCategoryIcon(cat.name, cat.icon)}
            </span>
          )}
        </div>

        {/* টেক্সট কন্টেন্ট */}
        <div className="flex flex-col flex-1">
          <span className="text-[13px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
            {cat.name}
          </span>
        </div>

        {/* অ্যারো ইন্ডিকেটর যা হোভারে স্লাইড করবে */}
        <div className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 text-theme-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
      </div>
    ))}
              </div>
            </div>

          </aside>

        </div>
      </main>
      {/* Mobile Sticky Action Bar — positioned above MobileBottomNav */}
      <div
        className="fixed bottom-0 left-0 right-0 md:hidden z-40 flex items-center gap-2 px-3 py-2"
        style={{
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid #e5e7eb',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)'
        }}
      >
        <button
          onClick={onBack}
          className="h-10 w-10 flex items-center justify-center rounded-xl text-gray-600 hover:text-gray-900 active:scale-95 transition-all bg-gray-100"
          aria-label="Go back"
        >
          <ArrowLeft size={18} strokeWidth={2.5} />
        </button>
        <div className="flex-1 grid grid-cols-2 gap-1.5">
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`h-11 flex items-center justify-center gap-1.5 rounded-xl font-semibold text-sm active:scale-[0.97] transition-all ${isOutOfStock ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400' : 'bg-white border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50'}`}
          >
            <ShoppingCart size={16} strokeWidth={2} />
            <span>Cart</span>
          </button>
          <button
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            className={`h-11 flex items-center justify-center gap-1.5 rounded-xl font-bold text-sm active:scale-[0.97] transition-all ${isOutOfStock ? 'opacity-50 cursor-not-allowed bg-gray-300 text-gray-500' : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40'}`}
          >
            <ShoppingBag size={16} strokeWidth={2} />
            <span>Buy Now</span>
          </button>
        </div>
      </div>
      <div className="hidden md:block">
        <Suspense fallback={null}>
          <StoreFooter websiteConfig={websiteConfig} logo={logo} tenantId={tenantId} onOpenChat={onOpenChat} />
        </Suspense>
      </div>

      {/* Visual Preview Modal — 2D "In-Your-Space" */}
      {isVisualPreviewOpen && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <VisualPreviewModal product={product} onClose={() => setIsVisualPreviewOpen(false)} />
        </Suspense>
      )}
    </div>
  );
};

export default StoreProductDetail;
