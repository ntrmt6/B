interface MobileProductActionsProps {
  onAddToCart?: () => void;
  onCheckout?: () => void;
  onBack?: () => void;
  isStockOut: boolean;
}

export const MobileProductActions = ({ onAddToCart, onCheckout, onBack, isStockOut }: MobileProductActionsProps) => {
  return (
    <div className="fixed bg-white shadow-[rgba(0,0,0,0.1)_0px_-4px_6px_-1px] box-border caret-transparent block h-[58px] w-full z-[200] bottom-0 md:hidden">
      <div className="box-border caret-transparent max-w-[1340px] w-[95%] mx-auto">
        <div className="items-center box-border caret-transparent gap-x-2.5 flex justify-between gap-y-2.5 w-full px-2.5 py-1.5">
          <div
            onClick={onBack}
            className="items-center box-border caret-transparent flex flex-col min-h-[auto] min-w-[auto] px-2.5 md:min-h-0 md:min-w-0 cursor-pointer"
          >
            <img
              src="https://c.animaapp.com/mmuqu4tvxu5PfK/assets/icon-18.svg"
              alt="Store"
              className="box-border caret-transparent h-6 align-baseline w-6"
            />
            <p className="text-sm font-medium box-border caret-transparent min-h-[auto] min-w-[auto] md:min-h-0 md:min-w-0">
              Store
            </p>
          </div>
          {isStockOut ? (
            <button
              disabled
              aria-label="Product is out of stock"
              className="text-black font-semibold items-center bg-neutral-200 box-border caret-transparent flex h-[45px] justify-center min-h-[auto] min-w-[auto] w-full px-[5px] rounded-[5px] opacity-70 cursor-not-allowed"
            >
              <p className="box-border caret-transparent min-h-[auto] min-w-[auto] text-nowrap md:min-h-0 md:min-w-0">
                Stock Out
              </p>
            </button>
          ) : (
            <>
              <div
                onClick={onAddToCart}
                className="text-white font-bold items-center bg-lime-500 box-border caret-transparent gap-x-[5px] flex h-[45px] justify-center min-h-[auto] min-w-[auto] gap-y-[5px] w-[90%] px-[5px] rounded-[5px] md:min-h-0 md:min-w-0 cursor-pointer"
              >
                <img
                  src="https://c.animaapp.com/mmuqu4tvxu5PfK/assets/icon-19.svg"
                  alt="Cart"
                  className="box-border caret-transparent h-4 align-baseline w-4"
                />
                <p className="box-border caret-transparent min-h-[auto] min-w-[auto] text-nowrap md:min-h-0 md:min-w-0">
                  Add to cart
                </p>
              </div>
              <div
                onClick={onCheckout}
                className="text-white font-bold items-center bg-orange-400 box-border caret-transparent gap-x-[5px] flex h-[45px] justify-center min-h-[auto] min-w-[auto] gap-y-[5px] w-[90%] px-[5px] rounded-[5px] md:min-h-0 md:min-w-0 cursor-pointer"
              >
                <img
                  src="https://c.animaapp.com/mmuqu4tvxu5PfK/assets/icon-20.svg"
                  alt="Buy"
                  className="box-border caret-transparent h-[14.283px] align-baseline w-3.5"
                />
                <p className="box-border caret-transparent min-h-[auto] min-w-[auto] text-nowrap md:min-h-0 md:min-w-0">
                  Buy Now
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
