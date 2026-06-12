export const TrendingProductSection = (): JSX.Element => {
  const products = [
    {
      id: 1,
      image: "https://c.animaapp.com/QpBFwAMQ/img/image-255@2x.png",
      price: "$25.95",
      discount: "20% off",
      hasDiscount: true,
      imageStyle:
        "absolute top-[calc(50.00%_-_60px)] left-[calc(50.00%_-_64px)] w-32 h-[145px] object-cover",
      position: "absolute top-[53px] left-5",
    },
    {
      id: 2,
      image: "https://c.animaapp.com/QpBFwAMQ/img/image-256@2x.png",
      price: null,
      discount: null,
      hasDiscount: false,
      imageStyle: null,
      position: "absolute top-[53px] left-[206px]",
      backgroundImage: true,
    },
    {
      id: 3,
      image: "https://c.animaapp.com/QpBFwAMQ/img/image-257@2x.png",
      price: "$104.0",
      discount: null,
      hasDiscount: false,
      imageStyle: null,
      position: "absolute top-[244px] left-5",
      backgroundImage: true,
    },
    {
      id: 4,
      image: "https://c.animaapp.com/QpBFwAMQ/img/image-258@2x.png",
      price: "$10.56",
      discount: null,
      hasDiscount: false,
      imageStyle:
        "absolute top-[calc(50.00%_-_74px)] left-[calc(50.00%_-_74px)] w-[149px] h-[149px] object-cover",
      position: "absolute top-[244px] left-[206px]",
    },
  ];

  return (
    <section className="absolute top-[1257px] left-[1010px] w-[392px] h-[435px] bg-white rounded-xl overflow-hidden shadow-6dp-ambient">
      <h2 className="absolute top-3 left-5 [font-family:'Lato',Helvetica] font-normal text-black text-[22px] tracking-[0] leading-[normal] whitespace-nowrap">
        Trennd collection for men
      </h2>

      {products.map((product, index) => {
        if (index === 0) {
          return (
            <article
              key={product.id}
              className={`${product.position} w-[166px] h-[171px] rounded-[10px] overflow-hidden border border-solid border-primary-neutal-200`}
            >
              {product.hasDiscount && (
                <div className="flex w-[65px] items-center justify-center gap-2.5 p-2.5 absolute top-0 left-0 bg-white">
                  <span className="relative w-fit mt-[-1.00px] [font-family:'Lato',Helvetica] font-normal text-black text-xs tracking-[0] leading-[normal] whitespace-nowrap">
                    {product.discount}
                  </span>
                </div>
              )}

              <img
                className={product.imageStyle}
                alt="Product"
                src={product.image}
              />

              {product.price && (
                <div className="absolute top-2.5 left-[120px] [font-family:'Lato',Helvetica] font-bold text-[#4ea674] text-xs tracking-[0] leading-[normal] whitespace-nowrap">
                  {product.price}
                </div>
              )}

              <button
                className="flex w-[86px] h-5 items-center justify-center px-[5.71px] py-[3.81px] absolute top-[141px] left-[calc(50.00%_-_43px)] bg-[#eaf8e7] rounded-[95.24px] shadow-[0px_1.43px_2.38px_#00000033]"
                aria-label={`Buy product for ${product.price}`}
              >
                <span className="relative w-fit [font-family:'Lato',Helvetica] font-bold text-[#023337] text-[7.6px] tracking-[0] leading-[normal] whitespace-nowrap">
                  Buy Now
                </span>
              </button>
            </article>
          );
        }

        if (index === 1) {
          return (
            <article
              key={product.id}
              className={`${product.position} w-[166px] h-[171px] flex justify-center rounded-[10px] overflow-hidden border border-solid border-primary-neutal-200 bg-cover bg-[50%_50%]`}
              style={{ backgroundImage: `url(${product.image})` }}
            >
              <button
                className="flex mt-[141px] w-[85.71px] h-5 ml-0 relative px-[5.71px] py-[3.81px] bg-[#eaf8e7] rounded-[95.24px] shadow-[0px_1.43px_2.38px_#00000033] items-center justify-center"
                aria-label="Buy product"
              >
                <span className="relative w-fit [font-family:'Lato',Helvetica] font-bold text-[#023337] text-[7.6px] tracking-[0] leading-[normal] whitespace-nowrap">
                  Buy Now
                </span>
              </button>
            </article>
          );
        }

        if (index === 2) {
          return (
            <article
              key={product.id}
              className={`${product.position} w-[166px] h-[171px] flex flex-col gap-[117px] rounded-[10px] overflow-hidden border border-solid border-primary-neutal-200 bg-cover bg-[50%_50%]`}
              style={{ backgroundImage: `url(${product.image})` }}
            >
              {product.price && (
                <div className="ml-[120px] w-[38px] h-3.5 mt-2.5 font-bold text-[#4ea674] text-xs leading-[normal] whitespace-nowrap [font-family:'Lato',Helvetica] tracking-[0]">
                  {product.price}
                </div>
              )}

              <button
                className="flex ml-0 h-5 w-[85.71px] self-center relative px-[5.71px] py-[3.81px] bg-[#eaf8e7] rounded-[95.24px] shadow-[0px_1.43px_2.38px_#00000033] items-center justify-center"
                aria-label={`Buy product for ${product.price}`}
              >
                <span className="relative w-fit [font-family:'Lato',Helvetica] font-bold text-[#023337] text-[7.6px] tracking-[0] leading-[normal] whitespace-nowrap">
                  Buy Now
                </span>
              </button>
            </article>
          );
        }

        if (index === 3) {
          return (
            <article
              key={product.id}
              className={`${product.position} w-[166px] h-[171px] rounded-[10px] overflow-hidden border border-solid border-primary-neutal-200`}
            >
              <img
                className={product.imageStyle}
                alt="Product"
                src={product.image}
              />

              {product.price && (
                <div className="absolute top-2.5 left-[120px] [font-family:'Lato',Helvetica] font-bold text-[#4ea674] text-xs tracking-[0] leading-[normal] whitespace-nowrap">
                  {product.price}
                </div>
              )}

              <button
                className="flex w-[86px] h-5 items-center justify-center px-[5.71px] py-[3.81px] absolute top-[141px] left-[calc(50.00%_-_43px)] bg-[#eaf8e7] rounded-[95.24px] shadow-[0px_1.43px_2.38px_#00000033]"
                aria-label={`Buy product for ${product.price}`}
              >
                <span className="relative w-fit [font-family:'Lato',Helvetica] font-bold text-[#023337] text-[7.6px] tracking-[0] leading-[normal] whitespace-nowrap">
                  Buy Now
                </span>
              </button>
            </article>
          );
        }

        return null;
      })}
    </section>
  );
};
