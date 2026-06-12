interface ProductMetaProps {
  category?: string;
  tags?: string[];
  sku?: string;
}

export const ProductMeta = ({ category, tags, sku }: ProductMetaProps) => {
  const categorySlug = category?.toLowerCase().replace(/\s+/g, '-') || '';

  return (
    <div className="box-border caret-transparent my-0 md:my-2.5">
      <div className="box-border caret-transparent gap-x-5 flex gap-y-5 my-0 md:my-5">
        <div className="text-zinc-500 text-sm box-border caret-transparent min-h-[auto] min-w-[auto]">
          {category && (
            <p className="box-border caret-transparent mt-3 md:mt-[15px]">
              {" "}
              Category:{" "}
              <span className="text-lime-500 box-border caret-transparent">
                <a
                  href={`/products?categories=${categorySlug}`}
                  className="box-border caret-transparent hover:underline"
                >
                  {" "}
                  {category}{" "}
                </a>
              </span>
            </p>
          )}
          {tags && tags.length > 0 && (
            <p className="box-border caret-transparent mt-3 md:mt-[15px]">
              {" "}
              Tags:{" "}
              {tags.map((tag, i) => (
                <span key={i}>
                  <a
                    href="/products"
                    className="text-lime-500 box-border caret-transparent hover:underline"
                  >
                    {tag}
                  </a>
                  {i < tags.length - 1 ? ', ' : ''}
                </span>
              ))}
            </p>
          )}
          {sku && (
            <p className="box-border caret-transparent mt-3 md:mt-[15px]">
              {" "}
              SKU:{" "}
              <span className="text-lime-500 box-border caret-transparent">
                {sku}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
