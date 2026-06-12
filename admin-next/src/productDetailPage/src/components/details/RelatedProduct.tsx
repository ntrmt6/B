import { ChevronRight } from "lucide-react";

// Strip HTML tags for plain text display
const stripHtml = (html: string): string => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
};
// Truncate to N words
const truncateWords = (text: string, maxWords: number = 4): string => {
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(' ') + '..';
};



interface RelatedProductItem {
    id: string;
    title: string;
    description: string;
    price: number;
    oldPrice?: number;
    rating?: number;
    sold?: number;
    image: string;
    isSale?: boolean;
}

interface RelatedProductProps {
    products?: RelatedProductItem[];
    onProductClick?: (productId: number) => void;
    currency?: string;
}

const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
            <svg
                key={i}
                className={`w-2.5 h-2.5 ${i <= Math.round(rating) ? "text-amber-400" : "text-gray-200"}`}
                fill="currentColor"
                viewBox="0 0 20 20"
            >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ))}
    </div>
);

export default function RelatedProduct({ products = [], onProductClick, currency = "\u09F3" }: RelatedProductProps) {
    if (products.length === 0) return null;

    const handleClick = (id: string) => {
        if (onProductClick) {
            onProductClick(parseInt(id));
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-3 lg:mb-6">
                <h2 className="text-lg lg:text-2xl font-lato font-bold text-gray-900">Related Product</h2>
                <a href="#" className="flex gap-0.5 text-xs lg:text-sm items-center text-gray-500 font-lato font-medium hover:text-blue-500 transition-colors">
                    View More
                    <ChevronRight size={14} className="text-blue-500" />
                </a>
            </div>
            <div className="grid grid-cols-2 gap-2 lg:hidden">
                {products.slice(0, 4).map((product) => (
                    <div key={product.id} onClick={() => handleClick(product.id)} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer active:scale-[0.98] transition-transform">
                        <div className="relative w-full aspect-square">
                            {product.isSale && (
                                <span className="absolute top-1.5 left-1.5 z-10 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">SALE</span>
                            )}
                            <img src={product.image} alt={product.title} className="object-cover w-full h-full absolute inset-0" />
                        </div>
                        <div className="p-1.5">
                            <div className="flex items-center gap-1 mb-0.5">
                                {product.rating && <StarRating rating={product.rating} />}
                                {product.sold !== undefined && product.sold > 0 && (
                                    <span className="text-[9px] text-gray-400">{product.sold} sold</span>
                                )}
                            </div>
                            <h3 className="text-[11px] font-medium leading-tight line-clamp-2 mb-1 text-gray-800">{truncateWords(product.title)}</h3>
                            <div className="flex items-baseline gap-1 mb-1">
                                <span className="text-[13px] font-bold text-theme-primary">{currency}{product.price?.toLocaleString()}</span>
                                {product.oldPrice && product.oldPrice > product.price && (
                                    <span className="text-[10px] text-gray-400 line-through">{currency}{product.oldPrice?.toLocaleString()}</span>
                                )}
                            </div>
                            <div className="flex gap-1">
                                <button className="flex-1 flex items-center justify-center gap-0.5 bg-gray-100 text-gray-700 text-[10px] font-semibold py-1.5 rounded-lg hover:bg-gray-200 active:scale-95 transition-all">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    Cart
                                </button>
                                <button className="flex-[1.3] flex items-center justify-center bg-gradient-to-b from-[#FF6A00] to-[#FF9F1C] text-white text-[10px] font-bold py-1.5 rounded-lg active:scale-95 transition-all">
                                    Buy Now
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* desktop */}
            <div className="hidden lg:block space-y-4">
                {products.slice(0, 4).map((product) => (
                    <div key={product.id} onClick={() => handleClick(product.id)} className="flex gap-4 items-start pb-3 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors -mx-2 px-2">
                        <div className="relative w-16 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                            <img src={product.image} alt={product.title} className="object-cover w-full h-full absolute inset-0" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                                <h3 className="text-sm text-gray-900 font-medium line-clamp-2">{truncateWords(product.title)}</h3>
                                {product.isSale && (
                                    <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0">SALE</span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1.5">
                                <span className="text-theme-primary font-bold text-sm">{currency}{product.price?.toLocaleString()}</span>
                                {product.oldPrice && product.oldPrice > product.price && (
                                    <span className="text-gray-400 line-through text-xs">{currency}{product.oldPrice?.toLocaleString()}</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
