import ProductMain from "./ProductMain";
import RelatedProduct from "./details/RelatedProduct";
import RecentProduct from "./details/RecentProduct";
import Description from "./details/Description";
import Footer from "./Footer";
import MobileCategories from "./details/Mobilecategories";
import React, { useState, useRef } from "react";
import { normalizeImageUrl } from "@/utils/imageUrlHelper";
import StoreHeader from "../../../components/StoreHeader/StoreHeader";
import MobileBottomNav from "../../../components/store/MobileBottomNav";
import { WebsiteConfig } from "../../../types";

export interface ModernProductDetailProps {
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
        colors?: string[];
        sizes?: string[];
        brand?: string;
        description?: string;
        videoUrl?: string;
        totalSold?: number;
        tags?: string[];
        stock?: number;
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
        totalSold?: number;
        description?: string;
        discount?: string | number;
    }>;
    recentProducts?: Array<{
        id: number;
        name: string;
        price: number;
        originalPrice?: number;
        image: string;
        description?: string;
    }>;
    categories?: Array<{ id?: number | string; name: string; slug?: string; image?: string; icon?: string }>;
    websiteConfig?: WebsiteConfig;
    logo?: string | null;
    onBack?: () => void;
    onProductClick?: (productId: number) => void;
    onAddToCart?: () => void;
    onCheckout?: () => void;
    onShare?: () => void;
    cart?: number[];
    onToggleCart?: (id: number) => void;
    currency?: string;
    tenantId?: string;
    user?: { name: string; email: string } | null;
    onLoginClick?: () => void;
    onChatClick?: () => void;
    onCategoryClick?: (categorySlug: string) => void;
    onVisualPreview?: () => void;
}

export default function ProductDetailsPage({
    product,
    relatedProducts = [],
    recentProducts = [],
    categories = [],
    websiteConfig,
    logo,
    onBack,
    onProductClick,
    onAddToCart,
    onCheckout,
    onShare,
    cart,
    onToggleCart,
    currency = "\u09F3",
    tenantId,
    user,
    onLoginClick,
    onChatClick,
    onCategoryClick,
    onVisualPreview,
}: ModernProductDetailProps) {
    const [quantity, setQuantity] = useState(1);
    const cartOpenRef = useRef<(() => void) | null>(null);

    // Build images array from product (normalize for correct domain)
    const images = (product?.galleryImages?.length
        ? product.galleryImages
        : product?.image
        ? [product.image]
        : []).map(img => normalizeImageUrl(img));

    // Map product data for child components
    const mappedProduct = {
        id: product?.id || 0,
        title: product?.name || "",
        titleBn: product?.name || "",
        price: product?.price || 0,
        originalPrice: product?.originalPrice || product?.price || 0,
        discount: typeof product?.discount === "string" ? parseInt(product.discount) || 0 : product?.discount || 0,
        rating: product?.rating || 0,
        reviewCount: product?.reviews || 0,
        category: product?.category || "",
        images,
            stock: product?.stock || 0,
            totalSold: product?.totalSold || 0,
            tags: product?.tags || [],
        colors: product?.colors || [],
        sizes: product?.sizes || [],
        brand: product?.brand || "",
        description: product?.description || "",
        videoUrl: product?.videoUrl || "",
        material: "",
        features: [] as string[],
        modelNumber: "",
        origin: "",
        dimensions: "",
        weight: "",
        variantGroups: product?.variantGroups || [],
        details: product?.details || [],
        shortDescription: product?.shortDescription || "",
    };

    // Construct tenant-specific logo URL
    // Priority: 1) websiteConfig headerLogo with tenant path, 2) websiteConfig footerLogo with tenant path, 
    // 3) generic logo prop, 4) fallback to any websiteConfig logo
    const logoUrl = (() => {
        // First, check if websiteConfig has headerLogo with tenant-specific branding path
        if (websiteConfig?.headerLogo) {
            const headerLogo = websiteConfig.headerLogo;
            // If it's already a tenant-specific branding URL, use it
            if (headerLogo.includes('/branding/')) {
                return normalizeImageUrl(headerLogo);
            }
            // If we have a tenantId and the logo isn't tenant-specific, check if it should be
            // This handles cases where the websiteConfig is from the active tenant but we need the product's tenant logo
            if (tenantId && headerLogo.includes('/uploads/images/')) {
                // Check if the logo path matches the product's tenant
                if (headerLogo.includes(`/branding/${tenantId}/`)) {
                    return normalizeImageUrl(headerLogo);
                }
            }
        }
        
        // Check if websiteConfig has footerLogo with tenant-specific path
        if (websiteConfig?.footerLogo) {
            const footerLogo = websiteConfig.footerLogo;
            if (footerLogo.includes('/branding/')) {
                return normalizeImageUrl(footerLogo);
            }
            if (tenantId && footerLogo.includes('/uploads/images/')) {
                if (footerLogo.includes(`/branding/${tenantId}/`)) {
                    return normalizeImageUrl(footerLogo);
                }
            }
        }
        
        // Fallback to generic logo prop or any websiteConfig logo
        return normalizeImageUrl(logo || websiteConfig?.headerLogo || websiteConfig?.footerLogo || "");
    })();
    const announcementText = websiteConfig?.adminNoticeText || websiteConfig?.headerSliderText || "";
    const phoneNumber = websiteConfig?.whatsappNumber || websiteConfig?.phones?.[0] || "";

    // Map related products for display
    const mappedRelated = relatedProducts.map((p) => ({
        id: String(p.id),
        title: p.name,
        description: p.description || "",
        price: p.price,
        oldPrice: p.originalPrice,
        rating: p.rating,
        sold: p.totalSold,
        image: normalizeImageUrl(p.image),
        isSale: !!(p.discount || (p.originalPrice && p.originalPrice > p.price)),
    }));

    const mappedRecent = recentProducts.map((p) => ({
        id: String(p.id),
        title: p.name,
        description: p.description || "",
        price: p.price,
        oldPrice: p.originalPrice,
        image: normalizeImageUrl(p.image),
    }));

    const mappedCategories = categories.map((c) => ({
        id: String(c.id || ""),
        name: c.name,
        slug: c.slug || "",
        image: normalizeImageUrl(c.image || ""),
        iconUrl: c.icon && c.icon.startsWith('http') ? normalizeImageUrl(c.icon) : "",
    }));

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-[120px] lg:pb-0">
            <StoreHeader
                logo={logoUrl}
              websiteConfig={websiteConfig as WebsiteConfig}
                user={user}
                onLoginClick={onLoginClick}
                onHomeClick={onBack}
                cart={cart}
                onCartOpenRef={(fn) => { cartOpenRef.current = fn; }}
            />

            {/*Section 1 */}
            <main className="max-w-[1720px] mx-auto px-0 lg:px-8 py-2 lg:py-6">
                <div className="lg:flex lg:gap-6">
                    <div className="flex-1 min-w-0">
                        <ProductMain
                            product={mappedProduct}
                            quantity={quantity}
                            setQuantity={setQuantity}
                            onAddToCart={onAddToCart}
                            onCheckout={onCheckout}
                            onShare={onShare}
                            phoneNumber={phoneNumber}
                            currency={currency}
                            onVisualPreview={onVisualPreview}
                        />
                    </div>
                    {/* Related product desktop*/}
                    <div className="hidden lg:block h-fit w-72 xl:w-80 bg-white px-4 py-6 rounded-2xl flex-shrink-0">
                        <RelatedProduct products={mappedRelated} onProductClick={onProductClick} currency={currency} />
                    </div>
                </div>
            </main>

            {/* sidebar */}
            <main className="max-w-[1720px] mx-auto px-3 lg:px-8 py-0 lg:py-6 text-gray-900">
                <div className="lg:flex lg:gap-6">
                    <div className="w-full lg:flex-1 min-w-0">
                        <Description product={mappedProduct} tenantId={tenantId} user={user} onLoginClick={onLoginClick} />
                    </div>
                    {/* Recent product */}
                    <div className="hidden lg:block h-fit w-72 xl:w-80 bg-white px-4 py-0 rounded-2xl flex-shrink-0">
                        <RecentProduct products={mappedRecent} onProductClick={onProductClick} currency={currency} />
                    </div>
                </div>
            </main>

            {/*mobile related & recent products - combined to remove gap */}
            <section className="lg:hidden max-w-[1720px] mx-auto px-3 pt-2">
                <RelatedProduct products={mappedRelated} onProductClick={onProductClick} currency={currency} />
                <div className="-mt-2">
                    <RecentProduct products={mappedRecent} onProductClick={onProductClick} currency={currency} />
                </div>
            </section>

            {/* mobile categories*/}
            <section className="lg:hidden max-w-[1720px] mx-auto py-2 pb-4">
                <MobileCategories categories={mappedCategories} onCategoryClick={onCategoryClick} />
            </section>

            {/* Mobile tab bar */}
            <MobileBottomNav
                onHomeClick={onBack || (() => {})}
                onCartClick={() => cartOpenRef.current?.()}
                onMenuClick={onBack}
                onAccountClick={onLoginClick || (() => {})}
                onChatClick={onChatClick}
                cartCount={cart?.length}
                websiteConfig={websiteConfig as WebsiteConfig}
                user={user}
            />

            {/* Footer */}
            <Footer
                logo={normalizeImageUrl(websiteConfig?.footerLogo || logoUrl)}
                websiteName={websiteConfig?.websiteName}
                addresses={websiteConfig?.addresses}
                footerQuickLinks={websiteConfig?.footerQuickLinks}
                footerUsefulLinks={websiteConfig?.footerUsefulLinks}
                socialLinks={websiteConfig?.socialLinks}
            />
        </div>
    );
}
