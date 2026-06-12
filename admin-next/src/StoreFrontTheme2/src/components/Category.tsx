type CategoryItem = {
  href: string;
  alt: string;
  src: string;
  label: string;
  imgAspect: string;
};

const CategoryStyle7: CategoryItem[] = [
  { href: "/products?categories=gadget-items", alt: "Gadget Items", src: "https://c.animaapp.com/mmu22iaoUL3nbW/assets/80.webp", label: "Gadget Items", imgAspect: "aspect-[auto_3000_/_3000]" },
  { href: "/products?categories=gift-items", alt: "Gift items", src: "https://c.animaapp.com/mmu22iaoUL3nbW/assets/52.webp", label: "Gift items", imgAspect: "aspect-[auto_1000_/_1000]" },
  { href: "/products?categories=toy-corner", alt: "Toy Corner", src: "https://c.animaapp.com/mmu22iaoUL3nbW/assets/51.webp", label: "Toy Corner", imgAspect: "aspect-[auto_3000_/_3000]" },
  { href: "/products?categories=home-decor", alt: "Home Decor", src: "https://c.animaapp.com/mmu22iaoUL3nbW/assets/60.webp", label: "Home Decor", imgAspect: "aspect-[auto_512_/_512]" },
  { href: "/products?categories=mobile-accessories", alt: "Mobile Accessories", src: "https://c.animaapp.com/mmu22iaoUL3nbW/assets/76.webp", label: "Mobile Accessories", imgAspect: "aspect-[auto_3000_/_3000]" },
  { href: "/products?categories=gaming", alt: "Gaming", src: "https://c.animaapp.com/mmu22iaoUL3nbW/assets/72.webp", label: "Gaming", imgAspect: "aspect-[auto_3000_/_3000]" },
  { href: "/products?categories=speaker---headphone", alt: "Speaker & Headphone", src: "https://c.animaapp.com/mmu22iaoUL3nbW/assets/48.webp", label: "Speaker & Headphone", imgAspect: "aspect-[auto_2000_/_2000]" },
  { href: "/products?categories=silver-fashion-wear-sfw", alt: "Silver Fashion Wear (SFW)", src: "https://c.animaapp.com/mmu22iaoUL3nbW/assets/79.webp", label: "Silver Fashion Wear (SFW)", imgAspect: "aspect-[auto_3000_/_3000]" },
];

export const Category = () => {
  return (
    <div className="box-border caret-transparent">
      <div className="bg-white box-border caret-transparent max-w-[1340px] w-[92%] mt-0 mx-auto pt-0 pb-[9.75px] px-[11.25px] rounded-[10px] md:bg-transparent md:w-[95%] md:mt-2.5 md:pt-3.5 md:pb-0 md:px-0 md:rounded-none">
        <div className="items-center box-border caret-transparent flex h-[38px] justify-between leading-[38px]">
          <h2 className="text-neutral-900 text-base font-bold box-border caret-transparent leading-[18px] min-h-[auto] min-w-[auto] text-ellipsis text-nowrap overflow-hidden md:text-neutral-700 md:text-[22px] md:font-medium md:leading-[38px]">
            Categories
          </h2>
          <a
            href="/product-categories"
            className="text-black text-[13px] font-medium items-center box-border caret-transparent flex leading-[15px] min-h-[auto] min-w-[auto] md:text-zinc-800 md:text-base md:leading-[38px] hover:text-lime-500 hover:no-underline"
          >
            View All
            <img
              src="https://c.animaapp.com/mmu22iaoUL3nbW/assets/icon-11.svg"
              alt="Icon"
              className="box-border caret-transparent block h-6 w-6 ml-0 md:ml-2"
            />
          </a>
        </div>
        <div className="box-border caret-transparent gap-x-[9px] grid grid-cols-[repeat(2,1fr)] gap-y-[9px] md:gap-x-[15px] md:grid-cols-[repeat(8,1fr)] md:gap-y-[15px]">
          {CategoryStyle7.map((cat) => (
            <div key={cat.href} className="box-border caret-transparent block min-h-[auto] min-w-[auto]">
              <a
                href={cat.href}
                className="text-blue-700 items-center box-border caret-transparent flex flex-col h-[96.25px] justify-center w-full border border-neutral-200 pt-1.5 rounded-[10px] border-solid md:inline-block md:h-full md:pt-4 hover:text-blue-800 hover:shadow-[rgba(0,0,0,0.1)_1px_5px_10px_0px] hover:border-zinc-500/60 hover:no-underline"
              >
                <div className="bg-white box-border caret-transparent h-[45px] min-h-[auto] min-w-[auto] w-[45px] overflow-hidden mx-auto rounded-md md:h-20 md:min-h-0 md:min-w-0 md:w-20 md:rounded-[5px]">
                  <img
                    sizes="(max-width: 599px) 48px, (min-width: 600px) 200px"
                    alt={cat.alt}
                    src={cat.src}
                    className={`box-border caret-transparent inline-block h-full object-contain w-full ${cat.imgAspect}`}
                  />
                </div>
                <div className="box-border caret-transparent min-h-[auto] min-w-[auto] text-center md:min-h-0 md:min-w-0">
                  <div className="text-neutral-900 text-[13px] font-medium box-border caret-transparent flow-root h-auto leading-[15px] overflow-hidden mx-0 my-1.5 px-[9px] md:text-black md:text-sm md:block md:h-[37px] md:leading-[18px] md:mt-2 md:mb-0 md:mx-3 md:px-0">
                    {cat.label}
                  </div>
                </div>
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryStyle7;