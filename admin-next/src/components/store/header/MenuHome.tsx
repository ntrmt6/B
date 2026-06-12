'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

interface CategoryItem {
    id?: number;
    name: string;
    [key: string]: any;
}

interface SubCategoryItem {
    id?: number;
    name: string;
    categoryId?: number;
    categoryName?: string;
    [key: string]: any;
}

interface ChildCategoryItem {
    id?: number;
    name: string;
    subCategoryId?: number;
    [key: string]: any;
}

interface AnnouncedBarProps {
    text?: string;
    onHomeClick?: () => void;
    onCategoryClick?: () => void;
    categories?: CategoryItem[];
    subCategories?: SubCategoryItem[];
    childCategories?: ChildCategoryItem[];
    onCategorySelect?: (category: string) => void;
}

export default function AnnouncedBar({
    text,
    onHomeClick,
    onCategoryClick,
    categories = [],
    subCategories = [],
    childCategories = [],
    onCategorySelect,
}: AnnouncedBarProps) {
    const router = useRouter();
    const displayText = text || '';
    const [isCatOpen, setIsCatOpen] = useState(false);
    const [hoveredCatId, setHoveredCatId] = useState<number | null>(null);
    const [hoveredSubCatId, setHoveredSubCatId] = useState<number | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearCloseTimer = useCallback(() => {
        if (closeTimer.current) {
            clearTimeout(closeTimer.current);
            closeTimer.current = null;
        }
    }, []);

    const startCloseTimer = useCallback(() => {
        clearCloseTimer();
        closeTimer.current = setTimeout(() => {
            setIsCatOpen(false);
            setHoveredCatId(null);
            setHoveredSubCatId(null);
        }, 200);
    }, [clearCloseTimer]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsCatOpen(false);
                setHoveredCatId(null);
                setHoveredSubCatId(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const onHomeClickHandler = onHomeClick || (() => router.push('/'));

    const handleCategoryNavigate = (categoryName: string) => {
        setIsCatOpen(false);
        setHoveredCatId(null);
        setHoveredSubCatId(null);
        if (onCategorySelect) {
            onCategorySelect(categoryName);
        }
        router.push(`/all-products?category=${encodeURIComponent(categoryName)}`);
    };

    const handleFlashSale = () => {
        const isProductsPage =
            window.location.pathname.includes('all-products') ||
            window.location.pathname.includes('categories');

        if (isProductsPage) {
            window.dispatchEvent(new CustomEvent('storefront:flash-sale-click'));
        } else {
            // Navigate first, then the StoreCategoryProducts component will pick up the event
            router.push('/all-products');
            // Dispatch after a short delay to let the page mount
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('storefront:flash-sale-click'));
            }, 500);
        }
    };

    // Get subcategories for a given category
    const getSubCatsForCategory = (catId: number | undefined) => {
        if (!catId) return [];
        return subCategories.filter((sc) => sc.categoryId === catId);
    };

    // Get child categories for a given subcategory
    const getChildCatsForSubCategory = (subCatId: number | undefined) => {
        if (!subCatId) return [];
        return childCategories.filter((cc) => cc.subCategoryId === subCatId);
    };

    return (
        <div className="max-w-[1720px] mx-auto w-full">
            <div className="flex items-center w-full">
                {/* Mobile Notice */}
                {displayText && (
                    <div className="flex lg:hidden bg-sky-500 text-white text-center py-2 text-xs font-medium px-4 w-full">
                        {displayText}
                    </div>
                )}

                {/* Desktop content */}
                <div className="hidden lg:flex w-full items-stretch border-b border-gray-100">
                    <div className="flex items-center gap-5 px-8 py-3.5 bg-white text-sm flex-shrink-0">
                        {/* Home */}
                        <button
                            onClick={onHomeClickHandler}
                            className="flex items-center gap-1 font-poppins font-medium cursor-pointer text-gray-900 hover:text-blue-600 transition-colors"
                        >
                            <img src="https://details-snit.vercel.app/images/home-09.svg" alt="Home" width={24} height={24} />
                            Home
                        </button>

                        {/* Categories with dropdown */}
                        <div
                            ref={dropdownRef}
                            className="relative"
                            onMouseEnter={() => { clearCloseTimer(); setIsCatOpen(true); }}
                            onMouseLeave={startCloseTimer}
                        >
                            <button
                                className="flex items-center gap-1 font-poppins font-medium cursor-pointer text-gray-900 hover:text-blue-600 transition-colors"
                                onClick={() => setIsCatOpen((prev) => !prev)}
                            >
                                <img
                                    src="https://details-snit.vercel.app/images/category-management.svg"
                                    alt="Categories"
                                    width={24}
                                    height={24}
                                />
                                Categories
                            </button>

                            {/* Dropdown */}
                            {isCatOpen && categories.length > 0 && (
                                <div className="absolute left-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-50 min-w-[220px] py-1">
                                    {categories.map((cat) => {
                                        const subs = getSubCatsForCategory(cat.id);
                                        const isHovered = hoveredCatId === cat.id;

                                        return (
                                            <div
                                                key={cat.id || cat.name}
                                                className="relative"
                                                onMouseEnter={() => { setHoveredCatId(cat.id ?? null); setHoveredSubCatId(null); }}
                                            >
                                                <button
                                                    onClick={() => handleCategoryNavigate(cat.name)}
                                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-between transition-colors"
                                                >
                                                    <span className="truncate">{cat.name}</span>
                                                    {subs.length > 0 && <ChevronRight size={14} className="text-gray-400 flex-shrink-0 ml-2" />}
                                                </button>

                                                {/* Subcategory flyout */}
                                                {isHovered && subs.length > 0 && (
                                                    <div className="absolute left-full top-0 ml-0.5 bg-white rounded-xl shadow-xl border border-gray-100 min-w-[200px] py-1 z-50">
                                                        {subs.map((sub) => {
                                                            const children = getChildCatsForSubCategory(sub.id);
                                                            const isSubHovered = hoveredSubCatId === sub.id;

                                                            return (
                                                                <div
                                                                    key={sub.id || sub.name}
                                                                    className="relative"
                                                                    onMouseEnter={() => setHoveredSubCatId(sub.id ?? null)}
                                                                >
                                                                    <button
                                                                        onClick={() => handleCategoryNavigate(sub.name)}
                                                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-between transition-colors"
                                                                    >
                                                                        <span className="truncate">{sub.name}</span>
                                                                        {children.length > 0 && <ChevronRight size={14} className="text-gray-400 flex-shrink-0 ml-2" />}
                                                                    </button>

                                                                    {/* Child category flyout */}
                                                                    {isSubHovered && children.length > 0 && (
                                                                        <div className="absolute left-full top-0 ml-0.5 bg-white rounded-xl shadow-xl border border-gray-100 min-w-[180px] py-1 z-50">
                                                                            {children.map((child) => (
                                                                                <button
                                                                                    key={child.id || child.name}
                                                                                    onClick={() => handleCategoryNavigate(child.name)}
                                                                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                                                >
                                                                                    <span className="truncate">{child.name}</span>
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Flash Sale */}
                        <button
                            onClick={handleFlashSale}
                            className="flex items-center gap-1 font-poppins font-medium cursor-pointer"
                        >
                            <img src="https://details-snit.vercel.app/images/fire.svg" alt="Flash Sale" width={24} height={24} />
                            <span className="bg-gradient-to-b from-[#FF6A00] to-[#FF9F1C] bg-clip-text text-transparent">
                                Flash Sale
                            </span>
                        </button>
                    </div>

                    {displayText && (
                        <div className="relative overflow-hidden flex-1 border-l-2 border-gray-200 flex items-center min-w-0">
                            <span className="notice-one-ticker absolute whitespace-nowrap text-gray-800 text-[14px] font-medium">
                                {displayText}
                            </span>
                            <style>{`
                                .notice-one-ticker {
                                    animation: one-ticker-anim 18s linear infinite;
                                }
                                @keyframes one-ticker-anim {
                                    from { left: 100%; transform: translateX(0); }
                                    to   { left: 0%;   transform: translateX(-100%); }
                                }
                            `}</style>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
