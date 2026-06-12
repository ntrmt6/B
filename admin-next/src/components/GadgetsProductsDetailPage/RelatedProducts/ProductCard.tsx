export type ProductCardProps = {
  href: string;
  imageSrc: string;
  title: string;
  price: string;
  rating?: number;
  onClick?: () => void;
};

export const ProductCard = (props: ProductCardProps) => {
  const { href, imageSrc, title, price, rating = 5, onClick } = props;

  return (
    <div className="box-border caret-transparent">
      <div className="box-border caret-transparent">
        <a href={href}
          onClick={(e) => {
            if (onClick) {
              e.preventDefault();
              onClick();
            }
          }}
          className="text-blue-700 box-border caret-transparent"
        >
          <div className="box-border caret-transparent gap-x-2.5 grid grid-cols-[1fr_3fr] gap-y-2.5">
            <div className="box-border caret-transparent h-20 min-h-[auto] min-w-[auto] w-20">
              <img
                alt="Slide"
                src={imageSrc}
                className="box-border caret-transparent inline h-full align-baseline w-full"
              />
            </div>
            <div className="box-border caret-transparent min-h-[auto] min-w-[auto]">
              <h2 className="text-slate-700 text-[13px] font-bold box-border caret-transparent flow-root leading-[15.6px] overflow-hidden hover:text-lime-500 hover:border-lime-500">
                {title}
              </h2>
              <div className="text-zinc-500 items-baseline box-border caret-transparent gap-x-2.5 flex leading-6 gap-y-2.5 mt-1">
                <div className="text-lime-500 font-medium box-border caret-transparent min-h-[auto] min-w-[auto]">
                  {price}
                </div>
              </div>
              <div className="box-border caret-transparent">
                <div className="box-border caret-transparent">
                  <div className="box-border caret-transparent gap-x-1 flex gap-y-1">
                    {Array.from({ length: rating }).map((_, index) => (
                      <img
                        key={index}
                        src="https://c.animaapp.com/mmuqu4tvxu5PfK/assets/icon-21.svg"
                        alt="Icon"
                        className="box-border caret-transparent h-[9px] align-baseline w-[9px] md:h-[13px] md:w-[13px]"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
};
