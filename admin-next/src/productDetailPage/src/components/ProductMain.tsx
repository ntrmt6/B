import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Thumbs } from "swiper/modules";
// @ts-ignore
import "swiper/css";

import Reviwicon from "./details/Reviwicon";
import MetaData from "./details/MetaData";
import QTY from "./details/QTY";
import Price from "./details/Price";
import Color from "./details/Color";
import Size from "./details/Size";
import CallOrderBar from "./details/CallOrderBar";
import { Heart, ChevronLeft, ChevronRight, ZoomIn, ShoppingCart as ShoppingCartIcon, Eye } from 'lucide-react';


interface VariantOption {
    attribute: string;
    extraPrice: number;
    image?: string;
}

interface VariantGroup {
    title: string;
    isMandatory?: boolean;
    options: VariantOption[];
}

interface ProductMainProduct {
    title: string;
    titleBn?: string;
    price: number;
    originalPrice: number;
    discount: number;
    rating: number;
    reviewCount: number;
    category: string;
    images: string[];
    colors: string[];
    sizes: string[];
    brand?: string;
    description?: string;
    material?: string;
    features?: string[];
    modelNumber?: string;
    origin?: string;
    stock?: number;
    totalSold?: number;
    variantGroups?: VariantGroup[];
    details?: Array<{ type: string; description: string }>;
    shortDescription?: string;
}

interface ProductMainProps {
    product: ProductMainProduct;
    quantity: number;
    setQuantity: (q: number) => void;
    onAddToCart?: () => void;
    onCheckout?: () => void;
    onShare?: () => void;
    phoneNumber?: string;
    currency?: string;
    onVisualPreview?: () => void;
}

export default function ProductMain({
    product,
    quantity,
    setQuantity,
    onAddToCart,
    onCheckout,
    onShare,
    phoneNumber = "",
    currency = "\u09F3",
    onVisualPreview,
}: ProductMainProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [thumbsSwiper, setThumbsSwiper] = React.useState<any>(null);
    const [selectedVariants, setSelectedVariants] = React.useState<Record<string, number>>({});
    const [zoomPosition, setZoomPosition] = React.useState({ x: 0, y: 0 });
    const [isZooming, setIsZooming] = React.useState(false);
    const [isHovering, setIsHovering] = React.useState(false);
    const [activeImageIndex, setActiveImageIndex] = React.useState(0);
    const mainImageRef = React.useRef<HTMLDivElement>(null);
    const thumbnailScrollRef = React.useRef<HTMLDivElement>(null);
    
    const imagesToShow = product.images?.length ? product.images : [];
    
    // Get all variant images for swiper (selected variant images prepended)
    const getDisplayImages = () => {
        const variantImages: string[] = [];
        if (product.variantGroups) {
            for (const group of product.variantGroups) {
                const selectedIdx = selectedVariants[group.title];
                if (selectedIdx !== undefined && group.options[selectedIdx]?.image) {
                    variantImages.push(group.options[selectedIdx].image!);
                }
            }
        }
        if (variantImages.length > 0) {
            return [...variantImages, ...imagesToShow.filter(img => !variantImages.includes(img))];
        }
        return imagesToShow;
    };
    
    const displayImages = getDisplayImages();
    
    // Calculate extra price from selected variants
    const getExtraPrice = () => {
        let extra = 0;
        if (product.variantGroups) {
            for (const group of product.variantGroups) {
                const selectedIdx = selectedVariants[group.title];
                if (selectedIdx !== undefined && group.options[selectedIdx]) {
                    extra += group.options[selectedIdx].extraPrice || 0;
                }
            }
        }
        return extra;
    };
    
    const extraPrice = getExtraPrice();
    
    const handleVariantSelect = (groupTitle: string, optionIndex: number) => {
        setSelectedVariants(prev => ({ ...prev, [groupTitle]: optionIndex }));
    };
    
    // Zoom functionality handlers
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!mainImageRef.current) return;
        
        const rect = mainImageRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const moveX = (x / rect.width) * 100;
        const moveY = (y / rect.height) * 100;
        
        setZoomPosition({ x: moveX, y: moveY });
    };
    
    const handleMouseEnter = () => {
        setIsZooming(true);
    };
    
    const handleMouseLeave = () => {
        setIsZooming(false);
    };
    
    // Handle thumbnail click/hover to change main image
    const handleThumbnailClick = (index: number) => {
        setActiveImageIndex(index);
        if (thumbsSwiper) {
            thumbsSwiper.slideTo(index);
        }
    };
    
    const handleThumbnailHover = (index: number) => {
        setActiveImageIndex(index);
        if (thumbsSwiper) {
            thumbsSwiper.slideTo(index);
        }
    };
    
    // Check if variant groups have data
    const hasVariantGroups = product.variantGroups && product.variantGroups.length > 0 && 
        product.variantGroups.some(g => g.options.some(o => o.attribute.trim()));

    return (
        <div className="bg-white rounded-xl p-0 lg:p-6 mb-2 lg:mb-4">
            <div className="lg:flex lg:gap-6">
                <div className="lg:basis-1/2 flex-shrink-0 mb-2 lg:mb-0 min-w-0">
                    {displayImages.length > 0 ? (
                        <>
                            {/* Main Product Image with Zoom */}
                            <div className="relative mb-4">
                                <div
                                    className="aspect-square bg-white rounded-2xl overflow-hidden relative group border border-gray-200 cursor-crosshair"
                                    onMouseEnter={() => setIsHovering(true)}
                                    onMouseLeave={() => setIsHovering(false)}
                                    onMouseMove={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const x = ((e.clientX - rect.left) / rect.width) * 100;
                                        const y = ((e.clientY - rect.top) / rect.height) * 100;
                                        setZoomPosition({ x, y });
                                    }}
                                >
                                    <Swiper
                                        modules={[Thumbs]}
                                        thumbs={{
                                            swiper:
                                                thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
                                        }}
                                        spaceBetween={12}
                                        className="h-full w-full main-image-swiper"
                                        grabCursor
                                        onSlideChange={(swiper) => setActiveImageIndex(swiper.activeIndex)}
                                    >
                                        {displayImages.map((img, i) => (
                                            <SwiperSlide key={i} style={{ height: '100%' }}>
                                                <img
                                                    src={img}
                                                    alt={product.title}
                                                    className="object-contain w-full h-full"
                                                />
                                            </SwiperSlide>
                                        ))}
                                    </Swiper>

                                    {/* Zoomed Preview Panel (Desktop Only) - Right Side */}
                                    {isHovering && (
                                        <div className="hidden lg:block absolute left-[calc(100%+16px)] top-0 w-72 h-72 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden z-50">
                                            <div
                                                className="w-full h-full"
                                                style={{
                                                    backgroundImage: `url(${displayImages[activeImageIndex]})`,
                                                    backgroundSize: '250%',
                                                    backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                                                    backgroundRepeat: 'no-repeat',
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Thumbnail Gallery - Bottom */}
                            <div className="relative px-0">
                                <div
                                    ref={thumbnailScrollRef}
                                    className="flex gap-3 overflow-x-auto scrollbar-hide py-2 scroll-smooth"
                                >
                                    {displayImages.map((img, i) => (
                                        <button
                                            key={i}
                                            onMouseEnter={() => handleThumbnailClick(i)}
                                            onClick={() => handleThumbnailClick(i)}
                                            className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 p-1 transition-all overflow-hidden transform hover:scale-105 ${
                                                activeImageIndex === i
                                                    ? 'border-blue-500 shadow-md'
                                                    : 'border-gray-200 hover:border-blue-300'
                                            }`}
                                            aria-label={`View image ${i + 1}`}
                                            aria-pressed={activeImageIndex === i}
                                        >
                                            <img src={img} alt={`Thumb ${i + 1}`} className="w-full h-full object-contain" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="bg-gray-200 rounded-2xl aspect-square flex items-center justify-center text-gray-400">
                            No images available
                        </div>
                    )}
                </div>


                <div className="lg:basis-1/2 min-w-0 font-inter px-3 lg:px-0">

                    <h1 className="text-lg lg:text-3xl font-bold font-lato text-black leading-snug mb-2 lg:mb-6 mt-2 lg:mt-0">
                        {product.titleBn && product.titleBn !== product.title
                            ? `${product.titleBn} | ${product.title}`
                            : product.title}
                    </h1>

                    {/* Badges: discount, stock, sold */}
                    <div className="flex items-center flex-wrap gap-2 mb-2 lg:mb-4">
                        {product.discount > 0 && (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md text-xs font-semibold">
                                Save {product.discount}%
                            </span>
                        )}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${product.stock && product.stock > 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
                            {product.stock && product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                        </span>
                        {product.totalSold ? (
                            <span className="text-xs text-gray-500">Sold: {product.totalSold}</span>
                        ) : null}
                    </div>

                    {/* Category & Ratings desktop */}
                    <div className="hidden lg:flex flex-wrap items-center justify-between gap-x-3 font-lato gap-y-1 mb-4 text-sm">
                        <div className="flex items-center gap-3">
                            <span className="text-gray-600 text-sm">Category:</span>
                            <span
                                className="font-lato text-sm font-bold leading-[125%] tracking-[0.32px] bg-gradient-to-b from-[#FF6A00] to-[#FF9F1C] bg-clip-text text-transparent cursor-pointer hover:underline">
                                {product.category}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-gray-600 text-sm">Ratings:</span>
                            <div className="flex items-center gap-1">
                                <Reviwicon rating={product.rating} />
                                <span className="text-black text-sm">({product.reviewCount})</span>
                            </div>
                        </div>
                    </div>

                    {/* MetaData desktop  */}
                    <div className="hidden lg:block">
                        <MetaData product={product} />
                    </div>

                    {/* Price, rating, and qty */}
                    <div className="flex items-center flex-wrap justify-between gap-y-1 mb-2 lg:mb-6">
                        <Price product={product} currency={currency} />
                        {/* Ratings mobile */}
                        <div className="flex lg:hidden items-center gap-1">
                            <Reviwicon rating={product.rating} />
                            <span className="text-black text-xs">({product.reviewCount})</span>
                        </div>
                        <QTY quantity={quantity} setQuantity={setQuantity} />
                    </div>

                    {/* Variant Groups */}
                    {hasVariantGroups ? (
                        <div className="flex items-start justify-between flex-wrap mb-4 lg:mb-0">
                            {product.variantGroups!.filter(g => g.options.some(o => o.attribute.trim())).map((group, gi) => {
                                const hasImages = group.options.some(o => o.image);
                                return (
                                    <div key={gi} className="pb-4 lg:pb-9 w-full sm:w-auto">
                                        <h2 className="mb-3 text-[16px] font-lato font-normal text-black leading-[125%]">{group.title}{group.isMandatory && <span className="text-red-500 ml-1">*</span>}</h2>
                                        <div className="flex gap-2 flex-wrap">
                                            {group.options.filter(o => o.attribute.trim()).map((option, oi) => (
                                                hasImages && option.image ? (
                                                    <button
                                                        key={oi}
                                                        onClick={() => handleVariantSelect(group.title, oi)}
                                                        className={`relative h-[60px] w-[60px] overflow-hidden rounded-sm transition-all duration-200 ${selectedVariants[group.title] === oi ? 'ring-2 ring-[#FF6A00]' : 'border border-gray-200'}`}
                                                    >
                                                        <img src={option.image} alt={option.attribute} className="object-cover w-full h-full absolute inset-0" />
                                                        {selectedVariants[group.title] === oi && (
                                                            <div className="absolute left-1 top-1">
                                                                <img src="https://details-snit.vercel.app/images/check.svg" alt="check" width={12} height={12} />
                                                            </div>
                                                        )}
                                                        <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-0.5 truncate">{option.attribute}</span>
                                                    </button>
                                                ) : (
                                                    <button
                                                        key={oi}
                                                        onClick={() => handleVariantSelect(group.title, oi)}
                                                        className={`px-4 py-2 rounded-[8px] text-sm font-lato transition-all duration-200 cursor-pointer ${selectedVariants[group.title] === oi ? 'bg-gradient-to-b from-[#FF6A00] to-[#FF9F1C] text-white font-bold' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                                    >
                                                        {option.attribute}
                                                        {option.extraPrice > 0 && <span className="ml-1 text-xs">(+{option.extraPrice})</span>}
                                                    </button>
                                                )
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex items-start justify-between flex-wrap mb-4 lg:mb-0">
                            {product.colors?.length > 0 && (
                                <div className="pb-4 lg:pb-9">
                                    <Color images={displayImages} />
                                </div>
                            )}
                            {product.sizes?.length > 0 && (
                                <div className="pb-4 lg:pb-9">
                                    <Size sizes={product.sizes} />
                                </div>
                            )}
                        </div>
                    )}

                    {/* BUTTONS — Desktop/Tablet */}
                    <div className="hidden lg:flex gap-3 mb-4">
                        <button
                            onClick={onAddToCart}
                            aria-label="Add to cart"
                            disabled={product.stock !== undefined && product.stock <= 0}
                            className={`flex-1 font-lato text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.97] ${product.stock !== undefined && product.stock <= 0 ? 'opacity-60 cursor-not-allowed bg-gray-400' : 'bg-gradient-to-b from-[#38BDF8] to-[#1E90FF] hover:shadow-lg hover:shadow-blue-500/25'}`}
                        >
                            <img src="https://details-snit.vercel.app/images/shopping.svg" width={22} height={22} alt="cart" />
                            কার্ট
                        </button>
                        <button
                            onClick={onCheckout}
                            aria-label="Buy now"
                            disabled={product.stock !== undefined && product.stock <= 0}
                            className={`flex-1 font-lato text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.97] ${product.stock !== undefined && product.stock <= 0 ? 'opacity-60 cursor-not-allowed bg-gray-400' : 'bg-gradient-to-b from-[#FF6A00] to-[#FF9F1C] hover:shadow-lg hover:shadow-orange-500/25'}`}
                        >
                            <img src="https://details-snit.vercel.app/images/atc.svg" width={22} height={22} alt="order" />
                            অর্ডার করুন
                        </button>
                    </div>

                    <CallOrderBar phoneNumber={phoneNumber} onShare={onShare} />
                    {onVisualPreview && (
                        <button
                            type="button"
                            onClick={onVisualPreview}
                            className="mt-2 inline-flex items-center gap-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-5 py-2.5 transition-all active:scale-95"
                        >
                            <Eye size={14} strokeWidth={2.5} /> See in my room
                        </button>
                    )}
                </div>
            </div>
            {/* Mobile sticky action bar — positioned above MobileBottomNav (bottom-[60px]) */}
            <div className="lg:hidden fixed bottom-[60px] left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 px-3 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
                <div className="flex items-center gap-2 max-w-[560px] mx-auto">
                    <div className="flex-1 min-w-0">
                        <div className="text-[11px] text-gray-500 truncate leading-tight">{product.title}</div>
                        <div className="font-bold text-base text-gray-900 leading-tight">{currency}{(product.price + extraPrice).toLocaleString()}</div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        <button
                            onClick={onAddToCart}
                            aria-label="Add to cart mobile"
                            disabled={product.stock !== undefined && product.stock <= 0}
                            className={`h-10 px-4 rounded-lg font-semibold text-sm flex items-center gap-1.5 transition-all active:scale-95 ${product.stock !== undefined && product.stock <= 0 ? 'opacity-50 bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-600 border-2 border-blue-500 hover:bg-blue-50'}`}
                        >
                            <ShoppingCartIcon size={16} />
                            Cart
                        </button>
                        <button
                            onClick={onCheckout}
                            aria-label="Buy now mobile"
                            disabled={product.stock !== undefined && product.stock <= 0}
                            className={`h-10 px-5 rounded-lg font-bold text-sm text-white flex items-center gap-1.5 transition-all active:scale-95 ${product.stock !== undefined && product.stock <= 0 ? 'opacity-50 bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-[#FF6A00] to-[#FF9F1C] hover:shadow-lg hover:shadow-orange-400/30'}`}
                        >
                            Buy Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
