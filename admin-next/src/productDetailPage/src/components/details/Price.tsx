type ProductPricing = {
    price: number;
    originalPrice: number;
    discount: number;
};

type PriceProps = {
    product: ProductPricing;
    currency?: string;
};

export default function Price({ product, currency = "\u09F3" }: PriceProps) {
    return (
        <div>
            <div className="flex items-center gap-1.5">
                <span className="text-2xl md:text-3xl font-urbanist font-bold text-black">
                    {currency}{product.price}
                </span>
                {product.originalPrice > product.price && (
                    <span className="text-[16px] md:text-2xl font-urbanist text-[#B3B3B3] line-through">
                        {currency}{product.originalPrice}
                    </span>
                )}
                {product.discount > 0 && (
                    <span className="bg-[#FF9F1C] font-lato text-white text-[10px] md:text-xs font-bold px-1 py-0.5 rounded-full">
                        {product.discount}% OFF
                    </span>
                )}
            </div>
        </div>
    )
}
