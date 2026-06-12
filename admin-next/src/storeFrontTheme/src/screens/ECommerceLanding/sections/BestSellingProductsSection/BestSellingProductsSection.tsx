export const BestSellingProductsSection = (): JSX.Element => {
  return (
    <section
      className="absolute top-[2472px] left-[100px] w-[640px] h-[200px] rounded-xl overflow-hidden border border-solid border-primary-neutal-200"
      aria-label="Best Selling Product"
    >
      <img
        className="absolute top-0 left-px w-[381px] h-[200px] object-cover"
        alt="Product showcase image"
        src="https://c.animaapp.com/QpBFwAMQ/img/image-262@2x.png"
      />

      <div className="absolute top-0 left-[381px] w-[259px] h-[200px] flex">
        <img
          className="mt-px w-[259px] h-[199px] object-cover"
          alt="Product detail image"
          src="https://c.animaapp.com/QpBFwAMQ/img/image-263@2x.png"
        />
      </div>

      <a
        href="#"
        className="inline-flex h-7 items-center justify-center gap-1 pl-3 pr-2 py-1 absolute top-[156px] left-[calc(50.00%_-_47px)] bg-white rounded-[200px] hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-primary-500 focus:ring-offset-2"
        aria-label="Visit store"
      >
        <span className="relative w-fit mt-[-0.50px] [font-family:'Lato',Helvetica] font-normal text-black text-xs tracking-[0] leading-[19px] whitespace-nowrap">
          Visit store
        </span>

        <img
          className="relative w-4 h-4"
          alt=""
          src="https://c.animaapp.com/QpBFwAMQ/img/arrow-down-right-sm-1.svg"
          aria-hidden="true"
        />
      </a>

      <div
        className="absolute top-3 right-3 font-bold text-white text-[22px] leading-[19px] whitespace-nowrap [font-family:'Lato',Helvetica] tracking-[0]"
        aria-label="Price: $420"
      >
        $420
      </div>
    </section>
  );
};
