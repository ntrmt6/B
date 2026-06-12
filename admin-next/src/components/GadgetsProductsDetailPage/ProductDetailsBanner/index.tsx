import { useState, useCallback, useEffect } from "react";
import { ProductImageGallery } from "./ProductImageGallery";
import { ProductInfo } from "./ProductInfo";
import { MobileProductActions } from "./MobileProductActions";

interface ProductDetailsBannerProps {
  product: {
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    galleryImages?: string[];
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
  discountPercent: number;
  discountAmount: number;
  isStockOut: boolean;
  onAddToCart?: () => void;
  onCheckout?: () => void;
  onBack?: () => void;
}

export const ProductDetailsBanner = ({
  product,
  currency,
  quantity,
  onQuantityChange,
  selectedVariants,
  onVariantSelect,
  discountPercent,
  discountAmount,
  isStockOut,
  onAddToCart,
  onCheckout,
  onBack,
}: ProductDetailsBannerProps) => {
  const allImages = [product.image, ...(product.galleryImages || [])].filter(Boolean);
  const discountLabel = discountPercent > 0 ? `-${discountPercent}% OFF` : undefined;
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const handleThumbnailHover = useCallback((index: number) => {
    setSelectedImageIndex(index);
  }, []);

  const handleThumbnailClick = useCallback((index: number) => {
    setSelectedImageIndex(index);
  }, []);

  const handleMainImageClick = useCallback(() => {
    setLightboxIndex(selectedImageIndex);
    setIsLightboxOpen(true);
  }, [selectedImageIndex]);

  const handleLightboxPrev = useCallback(() => {
    setLightboxIndex(prev => (prev - 1 + allImages.length) % allImages.length);
  }, [allImages.length]);

  const handleLightboxNext = useCallback(() => {
    setLightboxIndex(prev => (prev + 1) % allImages.length);
  }, [allImages.length]);

  const handleLightboxClose = useCallback(() => {
    setIsLightboxOpen(false);
  }, []);

  useEffect(() => {
    if (!isLightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handleLightboxPrev();
      else if (e.key === 'ArrowRight') handleLightboxNext();
      else if (e.key === 'Escape') handleLightboxClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isLightboxOpen, handleLightboxPrev, handleLightboxNext, handleLightboxClose]);

  // When a variant with an image is selected, update the main image
  const displayImage = allImages[selectedImageIndex] || product.image;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
        <div>
          <ProductImageGallery
            variant="single"
            mainImageSrc={displayImage}
            mainImageAlt={product.name}
            discountLabel={discountLabel}
            iconSrc="https://c.animaapp.com/mmuqu4tvxu5PfK/assets/icon-12.svg"
            outerClassVariant=""
            innerContainerClass=""
            onMainImageClick={handleMainImageClick}
          />
          {allImages.length > 1 && (
            <ProductImageGallery
              variant="gallery"
              mainImageSrc=""
              mainImageAlt=""
              outerClassVariant=""
              innerContainerClass=""
              galleryImages={allImages.map((src, i) => ({ src, alt: `${product.name} ${i + 1}` }))}
              selectedImageIndex={selectedImageIndex}
              onThumbnailHover={handleThumbnailHover}
              onThumbnailClick={handleThumbnailClick}
            />
          )}
        </div>
        <ProductInfo
          product={product}
          currency={currency}
          quantity={quantity}
          onQuantityChange={onQuantityChange}
          selectedVariants={selectedVariants}
          onVariantSelect={onVariantSelect}
          discountAmount={discountAmount}
          isStockOut={isStockOut}
          onAddToCart={onAddToCart}
          onCheckout={onCheckout}
        />
      </div>
      <MobileProductActions onAddToCart={onAddToCart} onCheckout={onCheckout} onBack={onBack} isStockOut={isStockOut} />

      {/* Lightbox */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center"
          onClick={handleLightboxClose}
        >
          <div
            className="relative flex flex-col items-center w-full max-w-4xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleLightboxClose}
              className="absolute -top-10 right-0 text-white text-3xl leading-none hover:text-lime-400 transition-colors z-10"
              aria-label="Close"
            >
              ✕
            </button>

            {/* Image + nav */}
            <div className="relative flex items-center justify-center w-full">
              {allImages.length > 1 && (
                <button
                  onClick={handleLightboxPrev}
                  className="absolute left-0 -translate-x-12 bg-black/50 hover:bg-lime-500/80 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl transition-colors z-10"
                  aria-label="Previous"
                >
                  ❮
                </button>
              )}
              <img
                src={allImages[lightboxIndex]}
                alt={product.name}
                className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl"
              />
              {allImages.length > 1 && (
                <button
                  onClick={handleLightboxNext}
                  className="absolute right-0 translate-x-12 bg-black/50 hover:bg-lime-500/80 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl transition-colors z-10"
                  aria-label="Next"
                >
                  ❯
                </button>
              )}
            </div>

            {/* Counter */}
            {allImages.length > 1 && (
              <div className="mt-3 text-white/60 text-sm">
                {lightboxIndex + 1} / {allImages.length}
              </div>
            )}

            {/* Thumbnail strip */}
            {allImages.length > 1 && (
              <div className="mt-4 flex gap-2 flex-wrap justify-center">
                {allImages.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setLightboxIndex(i)}
                    className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                      i === lightboxIndex ? 'border-lime-500 scale-105' : 'border-white/20 hover:border-white/60'
                    }`}
                  >
                    <img src={src} alt={`${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
