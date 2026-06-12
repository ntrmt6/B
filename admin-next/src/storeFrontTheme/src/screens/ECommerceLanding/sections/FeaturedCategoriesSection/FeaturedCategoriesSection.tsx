export const FeaturedCategoriesSection = (): JSX.Element => {
  return (
    <section
      className="absolute top-[574px] left-11 w-[464px] h-[328px] bg-white rounded-xl overflow-hidden shadow-1dp-ambient"
      aria-labelledby="featured-category-title"
    >
      <h2
        id="featured-category-title"
        className="absolute top-6 left-6 [font-family:'Lato',Helvetica] font-normal text-black text-[22px] tracking-[0] leading-[normal] whitespace-nowrap"
      >
        New Year! New Fashion
      </h2>

      <div
        className="absolute top-[65px] left-[calc(50.00%_-_208px)] w-[416px] h-56 rounded-lg bg-[url(https://c.animaapp.com/QpBFwAMQ/img/image-242@2x.png)] bg-cover bg-[50%_50%]"
        role="img"
        aria-label="New Year Fashion Collection"
      />

      <a
        href="#shop-new-fashion"
        className="flex w-[180px] h-[42px] px-3 py-2 absolute top-[266px] left-[calc(50.00%_-_90px)] bg-[#eaf8e7] rounded-[200px] shadow-6dp-ambient items-center justify-center cursor-pointer transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#023337] focus:ring-offset-2"
        aria-label="Shop New Year Fashion Collection"
      >
        <span className="relative w-fit [font-family:'Lato',Helvetica] font-bold text-[#023337] text-base tracking-[0] leading-[normal] whitespace-nowrap">
          Shop Now
        </span>
      </a>
    </section>
  );
};
