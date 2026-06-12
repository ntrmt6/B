// Strip HTML tags for plain text display
const stripHtml = (html: string): string => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
};

interface RecentProductItem {
    id: string;
    title: string;
    description: string;
    price: number;
    oldPrice?: number;
    image: string;
}

interface RecentProductProps {
    products?: RecentProductItem[];
    onProductClick?: (productId: number) => void;
    currency?: string;
}

export default function RecentProduct({ products = [], onProductClick, currency = "\u09F3" }: RecentProductProps) {
    if (products.length === 0) return null;

    const handleClick = (id: string) => {
        if (onProductClick) {
            onProductClick(parseInt(id));
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-3 lg:mb-5">
                <h2 className="text-lg lg:text-2xl font-lato font-bold text-gray-900">Recent Products</h2>
            </div>
            <div className="space-y-2 lg:space-y-4">
                {products.slice(0, 4).map((product) => (
                    <div key={product.id} onClick={() => handleClick(product.id)} className="flex gap-3 items-center py-2 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors -mx-1 px-1 active:scale-[0.99]">
                        <div className="relative w-14 h-14 lg:w-16 lg:h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
                            <img
                                src={product.image}
                                alt={product.title}
                                className="object-contain w-full h-full p-0.5"
                                loading="lazy"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-[13px] lg:text-sm text-gray-800 font-medium line-clamp-1 leading-snug">
                                {product.title}
                            </h3>
                            {product.description && (
                                <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">
                                    {stripHtml(product.description)}
                                </p>
                            )}
                            <div className="flex items-baseline gap-1.5 mt-1">
                                <span className="text-theme-primary font-bold text-[13px] lg:text-sm">
                                    {currency}{product.price?.toLocaleString()}
                                </span>
                                {product.oldPrice && product.oldPrice > product.price && (
                                    <span className="text-gray-400 line-through text-[10px] lg:text-xs">
                                        {currency}{product.oldPrice?.toLocaleString()}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
