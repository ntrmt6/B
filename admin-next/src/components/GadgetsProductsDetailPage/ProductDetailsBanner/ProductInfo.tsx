import { ProductVariants } from "./ProductVariants";
import { ProductQuantitySelector } from "./ProductQuantitySelector";
import { ProductMeta } from "./ProductMeta";

interface ProductInfoProps {
  product: {
    name: string;
    price: number;
    originalPrice?: number;
    rating?: number;
    reviews?: number;
    category?: string;
    tags?: string[];
    sku?: string;
    stock?: number;
    variantGroups?: Array<{
      title: string;
      isMandatory?: boolean;
      options: Array<{ attribute: string; extraPrice: number; image?: string }>;
    }>;
  };
  currency: string;
  quantity: number;
  onQuantityChange: (delta: number) => void;
  selectedVariants: Record<string, string>;
  onVariantSelect: (groupTitle: string, attribute: string) => void;
  discountAmount: number;
  isStockOut: boolean;
  onAddToCart?: () => void;
  onCheckout?: () => void;
}

export const ProductInfo = ({
  product,
  currency,
  quantity,
  onQuantityChange,
  selectedVariants,
  onVariantSelect,
  discountAmount,
  isStockOut,
  onAddToCart,
  onCheckout,
}: ProductInfoProps) => {
  const rating = product.rating || 0;
  const reviewCount = product.reviews || 0;
  const formattedPrice = `${currency} ${product.price.toLocaleString()}`;
  const formattedOriginal = product.originalPrice ? `${currency} ${product.originalPrice.toLocaleString()}` : '';
  const formattedDiscount = discountAmount > 0 ? `${currency} ${discountAmount.toLocaleString()} Off` : '';

  return (
    <div className="w-full">
      <div className="bg-white border border-neutral-200 p-3 sm:p-4 rounded-2xl md:bg-transparent md:p-0 md:rounded-none md:border-0">
        <div>
          <h2 className="text-zinc-800 text-lg sm:text-xl md:text-2xl font-bold leading-snug">
            {product.name}
          </h2>
          <div className="flex items-center gap-1.5 mt-1.5 mb-3">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <img
                  key={star}
                  src="https://c.animaapp.com/mmuqu4tvxu5PfK/assets/icon-13.svg"
                  alt="Star"
                  className="h-3.5 w-3.5 md:h-4 md:w-4"
                  style={star > rating ? { opacity: 0.3 } : undefined}
                />
              ))}
            </div>
            <span className="text-neutral-400 text-sm">
              ({reviewCount} reviews)
            </span>
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <p className="text-lime-500 text-3xl sm:text-4xl md:text-[42px] font-black leading-tight">
              {formattedPrice}
            </p>
            {discountAmount > 0 && (
              <div className="flex items-baseline gap-2">
                <span className="text-amber-400 text-xs font-semibold bg-amber-50 px-2 py-0.5 rounded-md">
                  {formattedDiscount}
                </span>
                <del className="text-neutral-400 text-lg font-medium">
                  {formattedOriginal}
                </del>
              </div>
            )}
          </div>
          {product.stock != null && (
            <div className="mt-2">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${isStockOut ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                {isStockOut ? 'Out of Stock' : `${product.stock} in stock`}
              </span>
            </div>
          )}
          {product.variantGroups && product.variantGroups.length > 0 && (
            <ProductVariants
              variantGroups={product.variantGroups}
              selectedVariants={selectedVariants}
              onVariantSelect={onVariantSelect}
            />
          )}
          <ProductQuantitySelector
            quantity={quantity}
            onQuantityChange={onQuantityChange}
            isStockOut={isStockOut}
            onAddToCart={onAddToCart}
            onCheckout={onCheckout}
          />
          <ProductMeta
            category={product.category}
            tags={product.tags}
            sku={product.sku}
          />
        </div>
      </div>
    </div>
  );
};
