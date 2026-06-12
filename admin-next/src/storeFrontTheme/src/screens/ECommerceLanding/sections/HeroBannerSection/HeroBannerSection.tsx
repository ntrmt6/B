import { useState } from "react";

export const HeroBannerSection = (): JSX.Element => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const navigationCategories = [
    "Men",
    "Women",
    "Baby",
    "Grocery & Essentials",
    "Streetwear",
    "Shoes",
    "Accessories",
    "Beauty",
    "Electronics",
    "Industrial equipment",
    "See more",
  ];

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : 0));
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => prev + 1);
  };

  return (
    <section className="absolute top-[161px] left-[calc(50.00%_-_720px)] w-[1440px] h-[494px] bg-[#023337]">
      <img
        className="absolute top-[calc(50.00%_-_247px)] right-0 w-[959px] h-[494px] object-cover"
        alt="Hero banner showcasing latest fashion deals"
        src="https://c.animaapp.com/QpBFwAMQ/img/image-241.png"
      />

      <div className="absolute top-[138px] left-[210px] w-[385px]">
        <h1 className="[text-shadow:4px_4px_4px_#00000080] [font-family:'Lato',Helvetica] font-normal text-white text-[32px] tracking-[0] leading-8">
          <span className="[font-family:'Lato',Helvetica] font-normal text-white text-[32px] tracking-[0]">
            Discover the Latest Deals –{" "}
          </span>
          <span className="font-bold italic text-[45px] leading-[61px]">
            Up to 50% Off!
          </span>
        </h1>
      </div>

      <a
        href="#shop"
        className="flex w-[180px] h-[42px] px-3 py-2 absolute top-[276px] left-[210px] bg-[#eaf8e7] rounded-[200px] items-center justify-center hover:bg-[#d5f0d0] transition-colors focus:outline-none focus:ring-2 focus:ring-[#023337] focus:ring-offset-2"
        aria-label="Shop now for deals up to 50% off"
      >
        <span className="relative w-fit [font-family:'Lato',Helvetica] font-bold text-[#023337] text-base tracking-[0] leading-[normal] whitespace-nowrap">
          Shop Now
        </span>
      </a>

      <button
        onClick={handlePrevSlide}
        className="absolute top-[calc(50.00%_-_27px)] left-[39px] w-[70px] h-[70px] hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#023337]"
        aria-label="Previous slide"
        type="button"
      >
        <img
          className="w-full h-full"
          alt=""
          src="https://c.animaapp.com/QpBFwAMQ/img/arrownarrowright.svg"
        />
      </button>

      <button
        onClick={handleNextSlide}
        className="absolute top-[calc(50.00%_-_27px)] left-[1331px] w-[70px] h-[70px] hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#023337]"
        aria-label="Next slide"
        type="button"
      >
        <img
          className="w-full h-full"
          alt=""
          src="https://c.animaapp.com/QpBFwAMQ/img/arrownarrowright-1.svg"
        />
      </button>

      <nav
        className="flex w-[1440px] items-center px-[83px] py-2 absolute top-0 left-0 bg-white border-t-[0.5px] [border-top-style:solid] border-[#0000001a]"
        aria-label="Product categories"
      >
        {navigationCategories.map((category, index) => (
          <a
            key={index}
            href={`#${category.toLowerCase().replace(/\s+/g, "-")}`}
            className={`inline-flex items-center justify-center gap-2.5 px-4 py-2 relative flex-[0_0_auto] hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-primary-500 focus:ring-inset ${
              category === "See more"
                ? "text-primary-primary-500"
                : "text-[#023337]"
            }`}
          >
            <span
              className={`relative w-fit mt-[-1.00px] [font-family:'Lato',Helvetica] font-normal text-base tracking-[0] leading-[normal] whitespace-nowrap ${
                category === "See more"
                  ? "text-primary-primary-500"
                  : "text-[#023337]"
              }`}
            >
              {category}
            </span>
          </a>
        ))}
      </nav>
    </section>
  );
};
