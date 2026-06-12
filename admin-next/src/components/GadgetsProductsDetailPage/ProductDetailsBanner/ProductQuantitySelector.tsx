interface ProductQuantitySelectorProps {
  quantity: number;
  onQuantityChange: (delta: number) => void;
  isStockOut: boolean;
  onAddToCart?: () => void;
  onCheckout?: () => void;
}

export const ProductQuantitySelector = ({ quantity, onQuantityChange, isStockOut, onAddToCart, onCheckout }: ProductQuantitySelectorProps) => {
  if (isStockOut) {
    return (
      <div className="items-center box-border caret-transparent gap-x-2.5 flex gap-y-2.5 mt-[35px]">
        <button
          disabled
          aria-label="Product is out of stock"
          className="text-black items-center flex justify-center text-center text-sm font-semibold bg-neutral-200 h-[50px] opacity-70 w-full max-w-[400px] p-0 rounded-[5px] cursor-not-allowed"
        >
          Stock Out
        </button>
      </div>
    );
  }

  return (
    <div className="items-center box-border caret-transparent gap-x-2.5 flex gap-y-2.5 mt-[35px]">
      <div className="items-center box-border caret-transparent gap-x-2.5 flex h-[50px] justify-between min-h-[auto] min-w-[auto] gap-y-2.5 border border-lime-500 px-5 rounded-[5px] border-solid">
        <button
          onClick={() => onQuantityChange(-1)}
          className="text-[13.3333px] bg-transparent caret-transparent block min-h-[auto] min-w-[auto] text-center p-0 font-arial"
        >
          <img
            src="https://c.animaapp.com/mmuqu4tvxu5PfK/assets/icon-14.svg"
            alt="Decrease"
            className="box-border caret-transparent inline h-5 align-baseline w-5"
          />
        </button>
        <div className="box-border caret-transparent min-h-[auto] min-w-[auto]">
          <input
            type="text"
            value={quantity}
            readOnly
            className="text-[15px] bg-white text-zinc-800 box-border caret-transparent h-[35px] text-center w-[45px] p-0"
          />
        </div>
        <button
          onClick={() => onQuantityChange(1)}
          className="text-[13.3333px] bg-transparent caret-transparent block min-h-[auto] min-w-[auto] text-center p-0 font-arial"
        >
          <img
            src="https://c.animaapp.com/mmuqu4tvxu5PfK/assets/icon-15.svg"
            alt="Increase"
            className="box-border caret-transparent inline h-5 align-baseline w-5"
          />
        </button>
      </div>
      <button
        onClick={onAddToCart}
        className="text-white font-bold items-center bg-lime-500 caret-transparent gap-x-[5px] hidden h-[50px] justify-center max-w-[135px] min-h-0 min-w-0 gap-y-[5px] text-center w-full px-[11px] py-0 rounded-[5px] font-arial md:flex md:min-h-[auto] md:min-w-[auto]"
      >
        <p className="box-border caret-transparent gap-x-2.5 flex min-h-0 min-w-0 gap-y-2.5 md:min-h-[auto] md:min-w-[auto]">
          <img
            src="https://c.animaapp.com/mmuqu4tvxu5PfK/assets/icon-16.svg"
            alt="Cart"
            className="box-border caret-transparent h-[14.283px] align-baseline w-3.5"
          />
        </p>
        Add to cart{" "}
      </button>
      <button
        onClick={onCheckout}
        className="text-white text-[15px] font-bold items-center bg-orange-400 caret-transparent gap-x-[5px] hidden h-[50px] justify-center max-w-[135px] min-h-0 min-w-0 gap-y-[5px] text-center w-full px-[11px] py-0 rounded-[5px] font-arial md:flex md:min-h-[auto] md:min-w-[auto]"
      >
        <p className="box-border caret-transparent gap-x-2.5 flex min-h-0 min-w-0 gap-y-2.5 md:min-h-[auto] md:min-w-[auto]">
          <img
            src="https://c.animaapp.com/mmuqu4tvxu5PfK/assets/icon-17.svg"
            alt="Buy"
            className="box-border caret-transparent h-4 align-baseline w-4"
          />
        </p>
        Buy Now{" "}
      </button>
    </div>
  );
};
