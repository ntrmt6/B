export const FeaturedDealsSection = (): JSX.Element => {
  const categories = [
    {
      id: 1,
      name: "Headsets",
      image: "https://c.animaapp.com/QpBFwAMQ/img/image-243@2x.png",
      imageClass: "absolute top-0 left-11 w-[117px] h-[116px] object-cover",
    },
    {
      id: 2,
      name: "Mouse",
      image: "https://c.animaapp.com/QpBFwAMQ/img/image-244@2x.png",
      imageClass: "absolute top-0 left-11 w-[117px] h-[116px] object-cover",
    },
    {
      id: 3,
      name: "Controller",
      image: "https://c.animaapp.com/QpBFwAMQ/img/image-245@2x.png",
      imageClass:
        "absolute top-[calc(50.00%_-_43px)] left-[calc(50.00%_-_65px)] w-[130px] h-[87px] object-cover",
    },
    {
      id: 4,
      name: "Chair",
      image: "https://c.animaapp.com/QpBFwAMQ/img/image-246@2x.png",
      imageClass: "mt-[9px] w-[81.82px] h-[100px] object-cover",
      isFlexLayout: true,
    },
  ];

  return (
    <section
      className="absolute top-[574px] left-[526px] w-[464px] h-[328px] bg-white rounded-xl overflow-hidden shadow-1dp-ambient"
      aria-labelledby="gaming-accessories-heading"
    >
      <header className="absolute top-6 left-6 flex items-center justify-between w-[418px]">
        <h2
          id="gaming-accessories-heading"
          className="[font-family:'Lato',Helvetica] font-normal text-black text-[22px] tracking-[0] leading-[normal] whitespace-nowrap"
        >
          Gaming accessories
        </h2>
        <a
          href="#"
          className="absolute top-[6px] left-[370px] text-primary-primary-500 underline [font-family:'Lato',Helvetica] font-normal text-xs tracking-[0] leading-[normal] whitespace-nowrap hover:no-underline focus:outline-none focus:ring-2 focus:ring-primary-primary-500 focus:ring-offset-2 rounded"
          aria-label="See more gaming accessories"
        >
          See more
        </a>
      </header>

      <div className="absolute top-[65px] left-5 w-[206px] h-[117px] bg-white rounded-xl overflow-hidden shadow-1dp-ambient">
        <a
          href="#"
          className="block w-full h-full focus:outline-none focus:ring-2 focus:ring-primary-primary-500 focus:ring-inset rounded-xl"
          aria-label={`View ${categories[0].name}`}
        >
          <img
            className={categories[0].imageClass}
            alt={categories[0].name}
            src={categories[0].image}
          />
          <div className="absolute top-[93px] left-2.5 [font-family:'Lato',Helvetica] font-normal text-black text-xs tracking-[0] leading-[normal] whitespace-nowrap">
            {categories[0].name}
          </div>
        </a>
      </div>

      <div className="absolute top-[65px] right-5 w-[206px] h-[117px] bg-white rounded-xl overflow-hidden shadow-1dp-ambient">
        <a
          href="#"
          className="block w-full h-full focus:outline-none focus:ring-2 focus:ring-primary-primary-500 focus:ring-inset rounded-xl"
          aria-label={`View ${categories[1].name}`}
        >
          <img
            className={categories[1].imageClass}
            alt={categories[1].name}
            src={categories[1].image}
          />
          <div className="absolute top-[93px] left-2.5 [font-family:'Lato',Helvetica] font-normal text-black text-xs tracking-[0] leading-[normal] whitespace-nowrap">
            {categories[1].name}
          </div>
        </a>
      </div>

      <div className="absolute top-[194px] left-5 w-[206px] h-[117px] bg-white rounded-xl overflow-hidden shadow-1dp-ambient">
        <a
          href="#"
          className="block w-full h-full focus:outline-none focus:ring-2 focus:ring-primary-primary-500 focus:ring-inset rounded-xl"
          aria-label={`View ${categories[2].name}`}
        >
          <img
            className={categories[2].imageClass}
            alt={categories[2].name}
            src={categories[2].image}
          />
          <div className="absolute top-[93px] left-2.5 [font-family:'Lato',Helvetica] font-normal text-black text-xs tracking-[0] leading-[normal] whitespace-nowrap">
            {categories[2].name}
          </div>
        </a>
      </div>

      <div className="absolute right-5 bottom-[17px] w-[206px] h-[117px] bg-white rounded-xl overflow-hidden shadow-1dp-ambient">
        <a
          href="#"
          className="flex gap-[24.1px] w-full h-full focus:outline-none focus:ring-2 focus:ring-primary-primary-500 focus:ring-inset rounded-xl"
          aria-label={`View ${categories[3].name}`}
        >
          <div className="mt-[93px] w-7 h-3.5 ml-2.5 [font-family:'Lato',Helvetica] font-normal text-black text-xs tracking-[0] leading-[normal] whitespace-nowrap">
            {categories[3].name}
          </div>
          <img
            className={categories[3].imageClass}
            alt={categories[3].name}
            src={categories[3].image}
          />
        </a>
      </div>
    </section>
  );
};
