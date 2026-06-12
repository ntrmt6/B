export type ProductCardProps = {
  href: string;
  alt: string;
  src: string;
  imgClassName: string;
  discountText: string;
  title: string;
  currentPrice: string;
  originalPrice: string;
  isStockOut?: boolean;
};

export const ProductCard = (props: ProductCardProps) => {
  return (
    <div className="box-border caret-transparent block min-h-[auto] min-w-[auto]">
      <a
        href={props.href}
        className="relative text-blue-700 shadow-[rgba(0,0,0,0.07)_0px_0px_10px_0px] box-border caret-transparent inline-block w-full border border-gray-200 rounded-2xl border-solid hover:text-blue-800 hover:bg-transparent hover:shadow-[rgba(0,0,0,0.07)_0px_0px_10px_0px] hover:outline-offset-0 hover:outline-0 hover:no-underline hover:decoration-solid hover:decoration-auto hover:border hover:border-lime-500 hover:rounded-2xl hover:border-solid"
      >
        <div className="box-border caret-transparent hover:text-blue-700 hover:bg-transparent hover:shadow-none hover:outline-offset-0 hover:outline-0 hover:no-underline hover:decoration-solid hover:decoration-auto hover:border-blue-700 hover:rounded-none hover:border-0 hover:border-none">
          <div className="bg-white box-border caret-transparent max-w-xs w-full overflow-hidden rounded-2xl hover:text-blue-700 hover:bg-neutral-100 hover:shadow-none hover:outline-offset-0 hover:outline-0 hover:no-underline hover:decoration-solid hover:decoration-auto hover:border-blue-700 hover:rounded-2xl hover:border-0 hover:border-none">
            <div className="relative box-border caret-transparent max-h-[50%] hover:text-blue-700 hover:bg-transparent hover:shadow-none hover:outline-offset-0 hover:outline-0 hover:no-underline hover:decoration-solid hover:decoration-auto hover:border-blue-700 hover:rounded-none hover:border-0 hover:border-none">
              <div className="items-center box-border caret-transparent flex justify-center hover:text-blue-700 hover:bg-transparent hover:shadow-none hover:outline-offset-0 hover:outline-0 hover:no-underline hover:decoration-solid hover:decoration-auto hover:border-blue-700 hover:rounded-none hover:border-0 hover:border-none">
                <div className="items-center box-border caret-transparent flex h-[149.25px] justify-center min-h-[auto] min-w-[auto] w-full overflow-hidden md:h-[220px] hover:text-blue-700 hover:bg-transparent hover:shadow-none hover:outline-offset-0 hover:outline-0 hover:no-underline hover:decoration-solid hover:decoration-auto hover:border-blue-700 hover:rounded-none hover:border-0 hover:border-none">
                  <img
                    sizes="(max-width: 599px) 128px, (min-width: 600px) 500px"
                    alt={props.alt}
                    src={props.src}
                    className={`box-border caret-transparent block h-full max-h-full max-w-full min-h-[auto] min-w-[auto] object-cover w-full md:object-contain hover:text-blue-700 hover:bg-transparent hover:shadow-none hover:outline-offset-0 hover:outline-0 hover:no-underline hover:decoration-solid hover:decoration-auto hover:border-blue-700 hover:rounded-none hover:border-0 hover:border-none ${props.imgClassName}`}
                  />
                </div>
              </div>
              <div className="absolute box-border caret-transparent z-[9] left-0 top-0 hover:text-blue-700 hover:bg-transparent hover:shadow-none hover:outline-offset-0 hover:outline-0 hover:no-underline hover:decoration-solid hover:decoration-auto hover:border-blue-700 hover:rounded-none hover:border-0 hover:border-none">
                <span className="text-white text-xs bg-orange-400 box-border caret-transparent inline-block leading-3 px-2.5 py-[7px] rounded-[5px] hover:text-neutral-100 hover:bg-orange-500 hover:shadow-none hover:outline-offset-0 hover:outline-0 hover:no-underline hover:decoration-solid hover:decoration-auto hover:rounded-[5px] hover:border-0 hover:border-none hover:border-white">
                  {props.discountText}
                </span>
              </div>
            </div>
            <div className="box-border caret-transparent pb-4 px-2 hover:text-blue-700 hover:bg-transparent hover:shadow-none hover:outline-offset-0 hover:outline-0 hover:no-underline hover:decoration-solid hover:decoration-auto hover:border-blue-700 hover:rounded-none hover:border-0 hover:border-none">
              <div className="items-center box-border caret-transparent gap-x-[3px] flex flex-col gap-y-[3px] my-2 hover:text-blue-700 hover:bg-transparent hover:shadow-none hover:outline-offset-0 hover:outline-0 hover:no-underline hover:decoration-solid hover:decoration-auto hover:border-blue-700 hover:rounded-none hover:border-0 hover:border-none">
                <div className="box-border caret-transparent min-h-[auto] min-w-[auto] hover:text-blue-700 hover:bg-transparent hover:shadow-none hover:outline-offset-0 hover:outline-0 hover:no-underline hover:decoration-solid hover:decoration-auto hover:border-blue-700 hover:rounded-none hover:border-0 hover:border-none">
                  <p className="text-neutral-900 text-[13px] font-medium box-border caret-transparent flow-root h-[30px] leading-[15px] text-center text-ellipsis break-all overflow-hidden mb-[5px] md:text-black md:text-sm md:h-[39px] md:leading-[normal] md:break-normal hover:text-black hover:bg-transparent hover:shadow-none hover:outline-offset-0 hover:outline-0 hover:no-underline hover:decoration-solid hover:decoration-auto hover:rounded-none hover:border-0 hover:border-none hover:border-black">
                    {props.title}
                  </p>
                </div>
                <div className="box-border caret-transparent min-h-[auto] min-w-[auto] mb-[3px] hover:text-blue-700 hover:bg-transparent hover:shadow-none hover:outline-offset-0 hover:outline-0 hover:no-underline hover:decoration-solid hover:decoration-auto hover:border-blue-700 hover:rounded-none hover:border-0 hover:border-none">
                  <div className="box-border caret-transparent flex pt-[5px] hover:text-blue-700 hover:bg-transparent hover:shadow-none hover:outline-offset-0 hover:outline-0 hover:no-underline hover:decoration-solid hover:decoration-auto hover:border-blue-700 hover:rounded-none hover:border-0 hover:border-none">
                    <span className="text-black text-[15.008px] font-medium box-border caret-transparent flex h-[22px] tracking-[-0.56px] leading-[22px] min-h-[auto] min-w-[auto] hover:text-neutral-900 hover:bg-transparent hover:shadow-none hover:outline-offset-0 hover:outline-0 hover:no-underline hover:decoration-solid hover:decoration-auto hover:rounded-none hover:border-0 hover:border-none hover:border-black">
                      {props.currentPrice}
                    </span>
                    <span className="text-black text-[13.008px] font-medium box-border caret-transparent flex h-[22px] tracking-[-0.56px] leading-[22px] min-h-[auto] min-w-[auto] line-through ml-[7px] hover:text-neutral-900 hover:bg-transparent hover:shadow-none hover:outline-offset-0 hover:outline-0 hover:line-through hover:decoration-solid hover:decoration-auto hover:rounded-none hover:border-0 hover:border-none hover:border-black">
                      {props.originalPrice}
                    </span>
                  </div>
                </div>
              </div>
              <div className="items-center box-border caret-transparent gap-x-2.5 flex gap-y-2.5 mt-2.5 hover:text-blue-700 hover:bg-transparent hover:shadow-none hover:outline-offset-0 hover:outline-0 hover:no-underline hover:decoration-solid hover:decoration-auto hover:border-blue-700 hover:rounded-none hover:border-0 hover:border-none">
                {props.isStockOut ? (
                  <button className="text-black items-center caret-transparent flex justify-center min-h-[auto] min-w-[auto] text-center font-arial hover:outline-offset-0 hover:outline-0 hover:no-underline hover:decoration-solid hover:decoration-auto hover:border-0 hover:border-none text-sm font-semibold bg-neutral-200 h-[38px] opacity-70 w-full p-0 rounded-[5px] hover:text-neutral-900 hover:bg-neutral-300 hover:shadow-none hover:rounded-[5px] hover:border-black">
                    {" "}
                    Stock Out{" "}
                  </button>
                ) : (
                  <>
                    <button className="text-black items-center caret-transparent flex justify-center min-h-[auto] min-w-[auto] text-center font-arial hover:outline-offset-0 hover:outline-0 hover:no-underline hover:decoration-solid hover:decoration-auto hover:border-0 hover:border-none text-xs bg-neutral-400/40 shadow-[rgba(0,0,0,0.07)_0px_2px_8px_0px] gap-x-[5px] basis-[0%] grow h-8 gap-y-[5px] w-[38px] px-px py-0 rounded-bl rounded-br rounded-tl rounded-tr md:text-[13.3333px] md:h-[38px] md:px-0 hover:text-white hover:bg-lime-500 hover:shadow-[rgba(0,0,0,0.07)_0px_2px_8px_0px] hover:rounded-bl hover:rounded-br hover:rounded-tl hover:rounded-tr hover:border-white">
                      <img
                        src="https://c.animaapp.com/mmu22iaoUL3nbW/assets/icon-13.svg"
                        alt="Icon"
                        className="text-xs box-border caret-transparent block h-4 w-4 md:text-[13.3333px]"
                      />
                      <span className="text-xs font-medium box-border caret-transparent block min-h-[auto] min-w-[auto] px-px font-satoshi md:text-sm md:px-0 hover:text-black hover:bg-transparent hover:shadow-none hover:outline-offset-0 hover:outline-0 hover:no-underline hover:decoration-solid hover:decoration-auto hover:rounded-none hover:border-0 hover:border-none hover:border-black">
                        Cart
                      </span>
                    </button>
                    <button className="text-white text-xs font-semibold items-center bg-orange-400 shadow-[rgba(0,0,0,0.07)_0px_2px_8px_0px] caret-transparent flex basis-[0%] grow h-8 justify-center min-h-[auto] min-w-[auto] text-center px-px py-0 rounded-[5px] font-arial md:text-sm md:h-[38px] md:px-[18px] hover:text-neutral-100 hover:bg-orange-500 hover:shadow-[rgba(0,0,0,0.07)_0px_2px_8px_0px] hover:outline-offset-0 hover:outline-0 hover:no-underline hover:decoration-solid hover:decoration-auto hover:rounded-[5px] hover:border-0 hover:border-none hover:border-white">
                      Buy Now
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </a>
      <div className="box-border caret-transparent"></div>
    </div>
  );
};
