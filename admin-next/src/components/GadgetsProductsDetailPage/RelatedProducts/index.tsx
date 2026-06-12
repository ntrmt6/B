import { ProductCard } from "./ProductCard";

interface RelatedProductsProps {
  products: Array<{
    id: number;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    rating?: number;
    slug?: string;
  }>;
  categories: Array<{ name: string; slug?: string; image?: string; icon?: string }>;
  currency: string;
  onProductClick?: (productId: number) => void;
  onCategoryClick?: (categorySlug: string) => void;
}

export const RelatedProducts = ({
  products,
  categories,
  currency,
  onProductClick,
  onCategoryClick,
}: RelatedProductsProps) => {
  return (
    <div className="box-border caret-transparent min-h-[auto] min-w-[auto] pb-[60px] md:pb-0">
      {products.length > 0 && (
        <div className="bg-white shadow-[rgba(0,0,0,0.05)_5px_5px_15px_0px] box-border caret-transparent border border-neutral-200 mb-[15px] pt-[15px] px-[15px] rounded-[15px] border-solid md:bg-transparent md:mb-0 md:pt-5 md:px-5">
          <div className="box-border caret-transparent">
            <h2 className="relative text-neutral-900 text-base font-bold box-border caret-transparent leading-[18px] text-ellipsis text-nowrap overflow-hidden mt-0 mb-5 pb-[15px] md:text-black md:text-2xl md:leading-[normal] md:text-clip md:text-wrap md:overflow-visible md:mt-2.5 md:pb-5 after:accent-auto after:bg-lime-500 after:caret-transparent after:text-neutral-900 after:block after:text-base after:not-italic after:normal-nums after:font-bold after:h-[3px] after:tracking-[normal] after:leading-[18px] after:list-outside after:list-disc after:pointer-events-auto after:absolute after:text-start after:no-underline after:indent-[0px] after:normal-case after:text-nowrap after:visible after:w-20 after:border-separate after:left-0 after:bottom-0 after:font-satoshi after:md:text-black after:md:text-2xl after:md:leading-[normal] after:md:text-wrap">
              Related Products
            </h2>
          </div>
          {products.map((product, index) => (
            <div
              key={product.id}
              className={`${index < products.length - 1 ? 'border-b-neutral-700 border-b' : ''} box-border caret-transparent mb-2.5 pb-2.5`}
            >
              <ProductCard
                href={`/product-details/${product.slug || product.id}`}
                imageSrc={product.image}
                title={product.name}
                price={`${currency} ${product.price.toLocaleString()}`}
                rating={product.rating || 5}
                onClick={() => onProductClick?.(product.id)}
              />
            </div>
          ))}
        </div>
      )}
      {categories.length > 0 && (
        <div className="box-border caret-transparent mt-0 mb-[70px] md:mt-10 md:mb-0">
          <div className="box-border caret-transparent">
            <section className="box-border caret-transparent">
              <div className="box-border caret-transparent flex basis-[0%] grow">
                <div className="bg-white shadow-[rgba(0,0,0,0.05)_5px_5px_15px_0px] box-border caret-transparent h-auto min-h-[auto] min-w-[auto] w-full border border-neutral-200 px-[15px] rounded-[15px] border-solid md:h-[440px] md:px-5">
                  <h2 className="relative text-neutral-900 text-base font-bold box-border caret-transparent leading-[18px] text-ellipsis text-nowrap overflow-hidden mb-[25px] py-[15px] font-quicksand md:text-zinc-800 md:text-2xl md:leading-[normal] md:text-clip md:text-wrap md:overflow-visible md:py-5 after:accent-auto after:bg-lime-500 after:caret-transparent after:text-neutral-900 after:block after:text-base after:not-italic after:normal-nums after:font-bold after:h-[3px] after:tracking-[normal] after:leading-[18px] after:list-outside after:list-disc after:pointer-events-auto after:absolute after:text-start after:no-underline after:indent-[0px] after:normal-case after:text-nowrap after:visible after:w-20 after:border-separate after:left-0 after:bottom-0 after:font-quicksand after:md:text-zinc-800 after:md:text-2xl after:md:leading-[normal] after:md:text-wrap">
                    Category
                  </h2>
                  <ul className="box-border caret-transparent gap-x-2.5 flex flex-col list-none max-h-none gap-y-2.5 overflow-visible mb-[15px] pl-0 md:max-h-[324px] md:overflow-auto md:mb-5">
                    {categories.map((cat) => {
                      const slug = cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-');
                      return (
                        <li
                          key={slug}
                          className="items-center border-b-neutral-200 box-border caret-transparent flex justify-between min-h-[auto] min-w-[auto] border-b"
                        >
                          <a
                            href={`/products?categories=${slug}`}
                            onClick={(e) => {
                              if (onCategoryClick) {
                                e.preventDefault();
                                onCategoryClick(slug);
                              }
                            }}
                            className="text-black text-[13px] items-center box-border caret-transparent gap-x-[15px] flex leading-[15px] min-h-[auto] min-w-[auto] gap-y-[15px] w-full mr-2.5 p-2.5 md:text-blue-700 md:text-base md:leading-[normal]"
                          >
                            {(cat.image || cat.icon) && (
                              <div className="text-black text-[13px] items-center box-border caret-transparent flex justify-center leading-[15px] min-h-[auto] min-w-[auto] border border-neutral-200 p-1 rounded-[5px] border-solid md:text-blue-700 md:text-base md:leading-[normal]">
                                <img
                                  alt={cat.name}
                                  src={cat.image || cat.icon}
                                  className="text-black text-[13px] box-border caret-transparent h-[26px] leading-[15px] min-h-[auto] min-w-[auto] align-baseline w-[26px] rounded-[5px] md:text-blue-700 md:text-base md:leading-[normal]"
                                />
                              </div>
                            )}
                            <span className="text-slate-700 text-sm font-medium box-border caret-transparent block leading-[15px] min-h-[auto] min-w-[auto] font-lato md:leading-[normal]">
                              {cat.name}
                            </span>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};
