import { useState, useCallback } from "react";
import { Eye } from "lucide-react";
import { ProductDetailsBanner } from "./ProductDetailsBanner";
import { ProductTabs } from "./ProductTabs";
import { RelatedProducts } from "./RelatedProducts";

export interface GadgetsProductDetailProps {
  product: {
    id: number;
    name: string;
    price: number;
    originalPrice?: number;
    discount?: string | number;
    rating?: number;
    reviews?: number;
    category?: string;
    image: string;
    galleryImages?: string[];
    description?: string;
    videoUrl?: string;
    tags?: string[];
    sku?: string;
    stock?: number;
    colors?: string[];
    sizes?: string[];
    variantGroups?: Array<{
      title: string;
      isMandatory?: boolean;
      options: Array<{ attribute: string; extraPrice: number; image?: string }>;
    }>;
    details?: Array<{ type: string; description: string }>;
    shortDescription?: string;
  };
  relatedProducts?: Array<{
    id: number;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    rating?: number;
    slug?: string;
  }>;
  categories?: Array<{ name: string; slug?: string; image?: string; icon?: string }>;
  currency?: string;
  tenantId?: string;
  user?: { name: string; email: string } | null;
  onLoginClick?: () => void;
  onAddToCart?: () => void;
  onCheckout?: () => void;
  onBack?: () => void;
  onProductClick?: (productId: number) => void;
  onCategoryClick?: (categorySlug: string) => void;
  onVisualPreview?: () => void;
}

export const ProductDetails = ({
  product,
  relatedProducts = [],
  categories = [],
  currency = "৳",
  tenantId,
  user,
  onLoginClick,
  onAddToCart,
  onCheckout,
  onBack,
  onProductClick,
  onCategoryClick,
  onVisualPreview,
}: GadgetsProductDetailProps) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  const isStockOut = product.stock != null && product.stock <= 0;
  const maxQuantity = product.stock != null && product.stock > 0 ? product.stock : undefined;

  const handleQuantityChange = useCallback((delta: number) => {
    setQuantity(prev => {
      const next = Math.max(1, prev + delta);
      if (maxQuantity != null && next > maxQuantity) return prev;
      return next;
    });
  }, [maxQuantity]);

  const handleVariantSelect = useCallback((groupTitle: string, attribute: string) => {
    setSelectedVariants(prev => ({ ...prev, [groupTitle]: attribute }));
  }, []);

  const discountPercent = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const discountAmount = product.originalPrice && product.originalPrice > product.price
    ? product.originalPrice - product.price
    : 0;

  // Synthesize variantGroups from old-style colors/sizes if variantGroups is absent
  const effectiveVariantGroups = product.variantGroups && product.variantGroups.length > 0
    ? product.variantGroups
    : [
        ...(product.colors && product.colors.length > 0 ? [{
          title: 'Colour',
          options: product.colors.map((c: string) => ({ attribute: c, extraPrice: 0 })),
        }] : []),
        ...(product.sizes && product.sizes.length > 0 ? [{
          title: 'Size',
          options: product.sizes.map((s: string) => ({ attribute: s, extraPrice: 0 })),
        }] : []),
      ];

  const productWithVariants = { ...product, variantGroups: effectiveVariantGroups };

  return (
    
     <div>
      <div>
        <div className="max-w-[1340px] w-[95%] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-[3fr_1fr] gap-4 md:gap-5 pt-3 md:pt-6">
            <div>
              <ProductDetailsBanner
                product={productWithVariants}
                currency={currency}
                quantity={quantity}
                onQuantityChange={handleQuantityChange}
                selectedVariants={selectedVariants}
                onVariantSelect={handleVariantSelect}
                discountPercent={discountPercent}
                discountAmount={discountAmount}
                isStockOut={isStockOut}
                onAddToCart={onAddToCart}
                onCheckout={onCheckout}
                onBack={onBack}
              />
              {onVisualPreview && (
                <div className="px-2.5 py-2">
                  <button
                    type="button"
                    onClick={onVisualPreview}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-5 py-2.5 transition-all active:scale-95"
                  >
                    <Eye size={14} strokeWidth={2.5} /> See in my room
                  </button>
                </div>
              )}
              <ProductTabs
                description={product.description}
                videoUrl={product.videoUrl}
                details={product.details}
                productId={product.id}
                productName={product.name}
                tenantId={tenantId}
                user={user}
                onLoginClick={onLoginClick}
                reviewCount={product.reviews}
              />
            </div>
            <RelatedProducts
              products={relatedProducts}
              categories={categories}
              currency={currency}
              onProductClick={onProductClick}
              onCategoryClick={onCategoryClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
