import { BestSellingProductsSection } from "./sections/BestSellingProductsSection";
import { CallToActionSection } from "./sections/CallToActionSection";
import { FeaturedCategoriesSection } from "./sections/FeaturedCategoriesSection";
import { FeaturedDealsSection } from "./sections/FeaturedDealsSection";
import { FooterSection } from "./sections/FooterSection";
import { HeroBannerSection } from "./sections/HeroBannerSection";
import { TrendingProductSection } from "./sections/TrendingProductSection";
import dynamic from 'next/dynamic';
import { DynamicLoadingFallback } from '../../../../components/store/skeletons/DynamicLoadingFallback';

const CustomerReviewsSection = dynamic(
  () => import('./sections/CustomerReviewsSection').then(m => ({ default: m.CustomerReviewsSection })),
  { ssr: false, loading: () => <DynamicLoadingFallback variant="reviews" /> }
);

const navigationLinks = [
  { label: "Home", active: true },
  { label: "Product", active: false },
  { label: "About Us", active: false },
  { label: "Contact", active: false },
];

const sidebarLinks = [
  { label: "Menu", icon: "https://c.animaapp.com/QpBFwAMQ/img/menu.svg" },
  { label: "Explore" },
  { label: "Deals" },
  { label: "Saved" },
];

const trendingProducts = [
  {
    id: 1,
    image: "https://c.animaapp.com/QpBFwAMQ/img/frame-4170.svg",
    title: "Radiant Glow Hydrating Serum",
    description: "Gentle yet effective, our Radiance Boosting Foaming......",
    rating: 4,
    reviews: 342,
    price: 29.99,
    originalPrice: 39.99,
    discount: "20% Off",
  },
  {
    id: 2,
    image: "https://c.animaapp.com/QpBFwAMQ/img/frame-4170-6.svg",
    title: "Modern Minimalist Vase",
    description: "Gentle yet effective, our Radiance Boosting Foaming......",
    rating: 4,
    reviews: 342,
    price: 40.99,
    originalPrice: null,
    discount: null,
  },
  {
    id: 3,
    image: "https://c.animaapp.com/QpBFwAMQ/img/frame-4170-7.svg",
    title: "FitPro 3000 Smartwatch",
    description: "Gentle yet effective, our Radiance Boosting Foaming......",
    rating: 4.5,
    reviews: 342,
    price: 119.99,
    originalPrice: null,
    discount: null,
  },
];

const bestSellingProducts = [
  {
    id: 1,
    image: "https://c.animaapp.com/QpBFwAMQ/img/frame-4170-1.svg",
    title: "Samsung Galaxy S24",
    description: "Gentle yet effective, our Radiance Boosting Foaming......",
    rating: 4,
    reviews: 342,
    price: 799.99,
    originalPrice: 1100.99,
    discount: "20% Off",
  },
  {
    id: 2,
    image: "https://c.animaapp.com/QpBFwAMQ/img/frame-4170-2.svg",
    title: "Ui Tws 7002 Earbud",
    description: "Gentle yet effective, our Radiance Boosting Foaming......",
    rating: 5,
    reviews: 342,
    price: 149,
    originalPrice: 200,
    discount: "35% Off",
  },
  {
    id: 3,
    image: "https://c.animaapp.com/QpBFwAMQ/img/frame-4170-3.svg",
    title: "Winter fashion jacket",
    description: "Gentle yet effective, our Radiance Boosting Foaming......",
    rating: 5,
    reviews: 342,
    price: 250.99,
    originalPrice: 500,
    discount: "50% Off",
  },
  {
    id: 4,
    image: "https://c.animaapp.com/QpBFwAMQ/img/frame-4170-4.svg",
    title: "New Balance 574 Senekers",
    description: "Gentle yet effective, our Radiance Boosting Foaming......",
    rating: 5,
    reviews: 342,
    price: 300,
    originalPrice: 400,
    discount: "35% Off",
  },
  {
    id: 5,
    image: "https://c.animaapp.com/QpBFwAMQ/img/frame-4170-5.svg",
    title: "Ui Tws 7002 Earbud",
    description: "Gentle yet effective, our Radiance Boosting Foaming......",
    rating: 5,
    reviews: 342,
    price: 49.99,
    originalPrice: 70,
    discount: "35% Off",
  },
];

const categories = [
  {
    id: 1,
    image: "https://c.animaapp.com/QpBFwAMQ/img/image-259@2x.png",
    name: "Grocery",
  },
  {
    id: 2,
    image: "https://c.animaapp.com/QpBFwAMQ/img/image-1@2x.png",
    name: "Home",
  },
  {
    id: 3,
    image: "https://c.animaapp.com/QpBFwAMQ/img/image-2@2x.png",
    name: "Fashion",
  },
  {
    id: 4,
    image: "https://c.animaapp.com/QpBFwAMQ/img/image-3@2x.png",
    name: "Electronic",
  },
  {
    id: 5,
    image: "https://c.animaapp.com/QpBFwAMQ/img/image-4@2x.png",
    name: "Toys",
  },
  {
    id: 6,
    image: "https://c.animaapp.com/QpBFwAMQ/img/image-259-1@2x.png",
    name: "Grocery",
  },
];

const customerReviews = [
  {
    id: 1,
    name: "Emily R.",
    avatar: "https://c.animaapp.com/QpBFwAMQ/img/10-picture-@2x.png",
    rating: 5,
    review:
      '"Fast delivery and fantastic quality! The customer support team was quick to resolve my query. Dealport has earned a loyal customer."',
  },
  {
    id: 2,
    name: "Ahmed M.",
    avatar: "https://c.animaapp.com/QpBFwAMQ/img/11-picture-@2x.png",
    rating: 5,
    review:
      '"Fast delivery and fantastic quality! The customer support team was quick to resolve my query. Dealport has earned a loyal customer."',
  },
  {
    id: 3,
    name: "Alex T",
    avatar: "https://c.animaapp.com/QpBFwAMQ/img/15-picture-@2x.png",
    rating: 5,
    review:
      '"Fast delivery and fantastic quality! The customer support team was quick to resolve my query. Dealport has earned a loyal customer."',
  },
  {
    id: 4,
    name: "David H",
    avatar: "https://c.animaapp.com/QpBFwAMQ/img/24-picture-@2x.png",
    rating: 5,
    review:
      '"Fast delivery and fantastic quality! The customer support team was quick to resolve my query. Dealport has earned a loyal customer."',
  },
];

const ProductCard = ({
  product,
}: { product: (typeof trendingProducts)[0] }) => {
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      if (i < Math.floor(rating)) {
        stars.push(
          <img
            key={i}
            className="relative w-[15.22px] h-[14.47px]"
            alt="Star"
            src="https://c.animaapp.com/QpBFwAMQ/img/star-4-7.svg"
          />,
        );
      } else if (i < rating) {
        stars.push(
          <img
            key={i}
            className="relative w-[15.22px] h-[14.47px]"
            alt="Star"
            src="https://c.animaapp.com/QpBFwAMQ/img/star-5-7.svg"
          />,
        );
      } else {
        stars.push(
          <img
            key={i}
            className="relative w-[15.22px] h-[14.47px]"
            alt="Star"
            src="https://c.animaapp.com/QpBFwAMQ/img/star-2-2.svg"
          />,
        );
      }
    }
    return stars;
  };

  return (
    <div className="inline-flex flex-col items-start gap-1.5 pt-3 pb-4 px-3 bg-white rounded-xl shadow-6dp-ambient">
      <img
        className="relative self-stretch w-full h-[180px]"
        alt={product.title}
        src={product.image}
      />

      <div className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex flex-col items-start gap-1 relative self-stretch w-full flex-[0_0_auto]">
            <div className="relative self-stretch mt-[-1.00px] [font-family:'Lato',Helvetica] font-bold text-black text-[22px] tracking-[0] leading-[normal]">
              {product.title}
            </div>

            <p className="relative w-[248px] [font-family:'Lato',Helvetica] font-normal text-[#00000099] text-base tracking-[0] leading-[22px]">
              {product.description}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
            <div className="inline-flex items-start gap-1.5 relative flex-[0_0_auto]">
              {renderStars(product.rating)}
            </div>

            <div className="relative w-fit mt-[-1.00px] [font-family:'Lato',Helvetica] font-bold text-gray-500 text-sm tracking-[0] leading-5 whitespace-nowrap">
              ({product.reviews} reviews).
            </div>
          </div>

          <div className="inline-flex items-end gap-3 relative flex-[0_0_auto]">
            <p className="relative w-fit mt-[-1.00px] [font-family:'Lato',Helvetica] font-normal text-transparent text-[22px] tracking-[0] leading-[normal] whitespace-nowrap">
              <span className="font-bold text-[#4ea674]">${product.price}</span>
              {product.originalPrice && (
                <>
                  <span className="font-bold text-black">&nbsp;</span>
                  <span className="text-[#00000099] text-base"> ($</span>
                  <span className="text-[#00000099] text-base line-through">
                    {product.originalPrice}
                  </span>
                  <span className="text-[#00000099] text-base">).</span>
                </>
              )}
            </p>

            {product.discount && (
              <div className="font-bold text-black tracking-[0] relative w-fit [font-family:'Lato',Helvetica] text-base leading-[normal] whitespace-nowrap">
                {product.discount}
              </div>
            )}
          </div>
        </div>

        <div className="flex w-[248px] items-center gap-[38px] relative flex-[0_0_auto]">
          <div className="flex-1 text-primary-primary-500 relative [font-family:'Lato',Helvetica] font-normal text-base tracking-[0] leading-[normal]">
            View Details
          </div>

          <div className="inline-flex items-center justify-center gap-2.5 px-5 py-2.5 relative flex-[0_0_auto] bg-[#4ea674] rounded-[200px]">
            <div className="relative w-fit mt-[-1.00px] [font-family:'Lato',Helvetica] font-bold text-white text-base tracking-[0] leading-[normal] whitespace-nowrap">
              Add to cart
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ECommerceLanding = (): JSX.Element => {
  return (
    <div
      className="bg-white overflow-hidden w-full min-w-[1440px] min-h-[4561px] relative"
      data-model-id="3:1698"
    >
      <header>
        <img
          className="absolute top-[37px] left-[100px] w-40 h-[34px]"
          alt="Frame"
          src="https://c.animaapp.com/QpBFwAMQ/img/frame-4121.svg"
        />

        <div className="inline-flex items-center gap-4 absolute top-[30px] right-[100px]">
          <div className="inline-flex h-12 items-center gap-1.5 p-1.5 relative flex-[0_0_auto] bg-[#eaf8e7] rounded-[200px]">
            <div className="flex w-[295px] items-center gap-2.5 px-6 py-2.5 relative self-stretch rounded-[200px]">
              <div className="mt-[-2.50px] mb-[-0.50px] font-normal text-[#00000099] tracking-[0.08px] relative w-fit [font-family:'Lato',Helvetica] text-base leading-[normal] whitespace-nowrap">
                What you&#39;re looking for
              </div>
            </div>

            <button className="flex w-[140px] items-center justify-center gap-2 px-[19px] py-6 relative self-stretch bg-white rounded-[200px]">
              <img
                className="relative w-5 h-5 mt-[-16.00px] mb-[-16.00px]"
                alt="Search"
                src="https://c.animaapp.com/QpBFwAMQ/img/search-01.svg"
              />

              <div className="relative w-fit mt-[-16.50px] mb-[-14.50px] [font-family:'Lato',Helvetica] font-normal text-black text-base tracking-[0.08px] leading-[normal] whitespace-nowrap">
                Search
              </div>
            </button>
          </div>

          <button aria-label="User account">
            <img
              className="relative w-5 h-5"
              alt="User"
              src="https://c.animaapp.com/QpBFwAMQ/img/user.svg"
            />
          </button>

          <button className="inline-flex flex-wrap items-center justify-center gap-[4px_4px] relative flex-[0_0_auto]">
            <img
              className="relative w-5 h-5"
              alt="Cart"
              src="https://c.animaapp.com/QpBFwAMQ/img/cart.svg"
            />

            <div className="relative w-fit mt-[-0.50px] [font-family:'Lato',Helvetica] font-bold text-black text-base tracking-[0] leading-[normal] whitespace-nowrap">
              Cart
            </div>
          </button>
        </div>

        <nav className="flex w-[400px] items-center absolute top-[102px] left-[calc(50.00%_+_244px)]">
          {navigationLinks.map((link, index) => (
            <div
              key={index}
              className="flex items-center justify-center gap-2.5 p-2.5 relative flex-1 grow"
            >
              <div
                className={`relative w-fit mt-[-1.00px] [font-family:'Lato',Helvetica] ${
                  link.active
                    ? "font-bold text-[#4ea674]"
                    : "font-normal text-black"
                } text-base tracking-[0] leading-[normal] whitespace-nowrap`}
              >
                {link.label}
              </div>

              {link.active && (
                <img
                  className="absolute top-8 left-[calc(50.00%_-_15px)] w-[30px] h-0.5"
                  alt="Vector"
                  src="https://c.animaapp.com/QpBFwAMQ/img/vector-5.svg"
                />
              )}
            </div>
          ))}
        </nav>

        <div className="inline-flex h-9 items-center gap-1 px-3 py-0 absolute top-[35px] left-[280px] border-r [border-right-style:solid] border-l [border-left-style:solid] border-[#00000099]">
          <img
            className="relative w-8 h-8"
            alt="Gridicons location"
            src="https://c.animaapp.com/QpBFwAMQ/img/gridicons-location.svg"
          />

          <div className="flex flex-col w-[90px] items-start gap-1 relative">
            <div className="relative self-stretch mt-[-1.00px] [font-family:'Lato',Helvetica] font-normal text-[#000000cc] text-xs tracking-[0] leading-[normal]">
              Deliver to
            </div>

            <div className="relative self-stretch [font-family:'Lato',Helvetica] font-normal text-black text-sm tracking-[0] leading-[normal]">
              Your address
            </div>
          </div>
        </div>

        <div className="flex w-14 items-center gap-1 absolute top-11 left-[442px]">
          <img
            className="relative w-5 h-[14.29px]"
            alt="Icon united states"
            src="https://c.animaapp.com/QpBFwAMQ/img/---icon--united-states-@2x.png"
          />

          <div className="relative w-fit mt-[-1.00px] [font-family:'Lato',Helvetica] font-bold text-black text-base tracking-[0] leading-[18px] whitespace-nowrap">
            EN
          </div>

          <img
            className="relative w-[6.67px] h-[3.33px] mr-[-0.67px]"
            alt="Vector"
            src="https://c.animaapp.com/QpBFwAMQ/img/vector.svg"
          />
        </div>

        <img
          className="absolute top-[90px] left-[calc(50.00%_-_720px)] w-[1440px] h-px"
          alt="Vector"
          src="https://c.animaapp.com/QpBFwAMQ/img/vector-6.svg"
        />

        <nav className="inline-flex h-9 items-center gap-3 absolute top-[102px] left-[87px]">
          {sidebarLinks.map((link, index) => (
            <div key={index}>
              {index === 0 ? (
                <div className="inline-flex h-9 items-center justify-center gap-1.5 p-2.5 relative flex-[0_0_auto]">
                  <img
                    className="relative w-5 h-5 mt-[-2.00px] mb-[-2.00px]"
                    alt="Menu"
                    src={link.icon}
                  />

                  <div className="relative w-fit mt-[-2.50px] mb-[-0.50px] [font-family:'Lato',Helvetica] font-normal text-[#000000cc] text-base tracking-[0] leading-[normal] whitespace-nowrap">
                    {link.label}
                  </div>
                </div>
              ) : (
                <>
                  {index === 1 && (
                    <img
                      className="relative w-px h-4"
                      alt="Vector"
                      src="https://c.animaapp.com/QpBFwAMQ/img/vector-7.svg"
                    />
                  )}
                  <div className="inline-flex items-center justify-center gap-2.5 p-2 relative flex-[0_0_auto]">
                    <div className="relative w-fit mt-[-1.00px] [font-family:'Lato',Helvetica] font-normal text-[#000000cc] text-base tracking-[0] leading-[normal] whitespace-nowrap">
                      {link.label}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </nav>
      </header>

      <HeroBannerSection />

      <section>
        <h2 className="absolute top-[1187px] left-[100px] [font-family:'Lato',Helvetica] font-bold text-black text-[32px] tracking-[0] leading-[normal] whitespace-nowrap">
          Trending Product
        </h2>

        <div className="absolute top-[1257px] left-[100px]">
          {trendingProducts.map((product, index) => (
            <div
              key={product.id}
              className="absolute"
              style={{ left: `${index * 304}px` }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        <button className="inline-flex items-center justify-center gap-2.5 px-6 py-3 absolute top-[1184px] left-[1234px] rounded-[200px] border border-solid border-black">
          <div className="w-fit mt-[-1.00px] text-black whitespace-nowrap relative [font-family:'Lato',Helvetica] font-normal text-base tracking-[0] leading-[normal]">
            View All
          </div>
        </button>
      </section>

      <FeaturedDealsSection />

      <FeaturedCategoriesSection />

      <div className="absolute top-[575px] left-[1008px] w-[188px] h-[146px] bg-white rounded-xl overflow-hidden shadow-1dp-ambient">
        <img
          className="absolute top-[calc(50.00%_-_73px)] left-[calc(50.00%_-_94px)] w-[188px] h-[146px] object-cover"
          alt="Image"
          src="https://c.animaapp.com/QpBFwAMQ/img/image@2x.png"
        />

        <a
          href="#"
          className="absolute top-[126px] left-2 [font-family:'Lato',Helvetica] font-normal text-white text-[10px] tracking-[0] leading-[normal] underline whitespace-nowrap"
        >
          More details
        </a>
      </div>

      <div className="absolute top-[737px] left-[1008px] w-[392px] h-[165px] bg-white rounded-xl overflow-hidden shadow-1dp-ambient">
        <img
          className="absolute top-[calc(50.00%_-_82px)] left-0 w-[209px] h-[159px] object-cover"
          alt="Image"
          src="https://c.animaapp.com/QpBFwAMQ/img/image-248@2x.png"
        />

        <div className="absolute top-[18px] left-[182px] w-[60px] h-3.5 flex justify-center bg-[url(https://c.animaapp.com/QpBFwAMQ/img/rectangle-359.svg)] bg-[100%_100%]">
          <div className="mt-[2.7px] w-[27px] h-2 ml-[1.3px] [font-family:'Lato',Helvetica] font-bold text-white text-[6.4px] tracking-[0] leading-[normal]">
            $250 Off
          </div>
        </div>

        <div className="absolute top-[46px] left-[196px] [font-family:'Lato',Helvetica] font-medium text-black text-base tracking-[0] leading-[normal] whitespace-nowrap">
          Philips 4K Ambilight TV
        </div>

        <div className="absolute top-[73px] left-[196px] font-bold text-black text-sm leading-[normal] [font-family:'Lato',Helvetica] tracking-[0]">
          $750.99
        </div>

        <button className="flex w-[120px] h-7 px-2 py-[5.33px] absolute top-[117px] left-[calc(50.00%_+_56px)] bg-[#eaf8e7] rounded-[133.33px] shadow-[0px_2px_3.33px_#00000033] items-center justify-center">
          <div className="text-[#023337] text-[10.7px] relative w-fit [font-family:'Lato',Helvetica] font-bold tracking-[0] leading-[normal]">
            Shop Now
          </div>
        </button>
      </div>

      <div className="absolute top-[575px] left-[1212px] w-[188px] h-[146px] bg-white rounded-xl overflow-hidden shadow-1dp-ambient">
        <img
          className="absolute top-0 left-0 w-[188px] h-[146px] object-cover"
          alt="Image"
          src="https://c.animaapp.com/QpBFwAMQ/img/image-247@2x.png"
        />

        <button className="flex w-[81px] h-5 px-[5.33px] py-[3.56px] absolute left-2.5 bottom-2.5 rounded-[88.89px] border-[none] shadow-[0px_1.33px_2.22px_#00000033] bg-[linear-gradient(90deg,rgba(23,63,171,1)_0%,rgba(142,58,154,1)_100%)] items-center justify-center before:content-[''] before:absolute before:inset-0 before:p-[0.5px] before:rounded-[88.89px] before:[background:linear-gradient(90deg,rgba(95,138,255,1)_0%,rgba(231,63,255,1)_100%)] before:[-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] before:[-webkit-mask-composite:xor] before:[mask-composite:exclude] before:z-[1] before:pointer-events-none">
          <div className="text-white text-[7.1px] relative w-fit [font-family:'Lato',Helvetica] font-bold tracking-[0] leading-[normal]">
            Shop Now
          </div>
        </button>
      </div>

      <div className="absolute top-[918px] left-11 w-[327px] h-[190px] flex bg-white rounded-xl overflow-hidden shadow-1dp-ambient">
        <img
          className="w-[326.75px] h-[190px] ml-[0.5px] object-cover"
          alt="Image"
          src="https://c.animaapp.com/QpBFwAMQ/img/image-249@2x.png"
        />
      </div>

      <div className="absolute top-[918px] left-[387px] w-[327px] h-[190px] bg-white rounded-xl overflow-hidden shadow-1dp-ambient">
        <img
          className="absolute top-[calc(50.00%_-_95px)] left-[calc(50.00%_-_164px)] w-[327px] h-[190px] object-cover"
          alt="Image"
          src="https://c.animaapp.com/QpBFwAMQ/img/image-250@2x.png"
        />

        <button className="flex w-[120px] h-7 px-2 py-[5.33px] absolute top-[133px] left-[calc(50.00%_-_132px)] bg-[#8b8b8b] rounded-[133.33px] border-[none] shadow-[0px_2px_3.33px_#00000033] items-center justify-center before:content-[''] before:absolute before:inset-0 before:p-px before:rounded-[133.33px] before:[background:linear-gradient(306deg,rgba(255,255,255,0.2)_0%,rgba(234,248,231,1)_100%)] before:[-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] before:[-webkit-mask-composite:xor] before:[mask-composite:exclude] before:z-[1] before:pointer-events-none">
          <div className="text-white text-xs whitespace-nowrap relative w-fit [font-family:'Lato',Helvetica] font-bold tracking-[0] leading-[normal]">
            Shop Now
          </div>
        </button>
      </div>

      <div className="absolute top-[918px] left-[730px] w-[327px] h-[190px] bg-white rounded-xl overflow-hidden shadow-1dp-ambient">
        <img
          className="absolute top-0 left-px w-[327px] h-[190px] object-cover"
          alt="Image"
          src="https://c.animaapp.com/QpBFwAMQ/img/image-251@2x.png"
        />

        <button className="flex w-[327px] h-[33px] items-center justify-center gap-2.5 px-2.5 py-1 absolute top-[157px] left-px bg-[#ffffff03] backdrop-blur-[2px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(2px)_brightness(100%)]">
          <div className="relative w-fit text-white [font-family:'Lato',Helvetica] font-normal text-xs tracking-[0] leading-[normal] whitespace-nowrap">
            See more
          </div>
        </button>
      </div>

      <div className="absolute top-[918px] left-[1074px] w-[327px] h-[190px] bg-white rounded-xl overflow-hidden shadow-1dp-ambient">
        <img
          className="absolute top-0 left-0 w-[327px] h-[190px] object-cover"
          alt="Image"
          src="https://c.animaapp.com/QpBFwAMQ/img/image-252@2x.png"
        />

        <button className="flex w-[140px] h-[33px] px-[9.33px] py-[6.22px] absolute left-[calc(50.00%_-_70px)] bottom-[15px] bg-[#303030] rounded-[155.56px] border-[none] shadow-[0px_2.33px_3.89px_#00000033] items-center justify-center before:content-[''] before:absolute before:inset-0 before:p-px before:rounded-[155.56px] before:[background:linear-gradient(304deg,rgba(0,0,0,0.1)_0%,rgba(255,255,255,1)_100%)] before:[-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] before:[-webkit-mask-composite:xor] before:[mask-composite:exclude] before:z-[1] before:pointer-events-none">
          <div className="text-white text-[12.4px] relative w-fit [font-family:'Lato',Helvetica] font-bold tracking-[0] leading-[normal]">
            Shop Now
          </div>
        </button>
      </div>

      <TrendingProductSection />

      <section>
        <h2 className="absolute top-[1792px] left-[100px] [font-family:'Lato',Helvetica] font-bold text-black text-[32px] tracking-[0] leading-[normal] whitespace-nowrap">
          Start exploring now
        </h2>

        <div className="absolute top-[1862px] left-[100px]">
          {categories.map((category, index) => (
            <div
              key={category.id}
              className={`${
                index === 1
                  ? "absolute top-0 left-[236px] w-[180px] h-[220px] flex flex-col gap-[2.5px] rounded-xl border border-solid border-primary-neutal-200"
                  : "flex flex-col w-[180px] h-[220px] items-center justify-center gap-4 p-4 absolute rounded-xl border border-solid border-primary-neutal-200"
              }`}
              style={
                index !== 1 ? { left: `${index * 236}px`, top: 0 } : undefined
              }
            >
              {index === 1 ? (
                <>
                  <img
                    className="ml-[-5px] w-[190px] h-[180.73px] relative mt-[-4.4px] object-cover"
                    alt="Image"
                    src={category.image}
                  />
                  <div className="ml-4 w-[148px] h-[19px] font-normal text-black text-base text-center relative [font-family:'Lato',Helvetica] tracking-[0] leading-[normal]">
                    {category.name}
                  </div>
                </>
              ) : (
                <>
                  <img
                    className={`relative self-stretch w-full h-[140.78px] ${
                      index === 0 || index === 3 || index === 4 || index === 5
                        ? "object-cover"
                        : ""
                    }`}
                    alt="Image"
                    src={category.image}
                  />
                  <div className="relative self-stretch [font-family:'Lato',Helvetica] font-normal text-black text-base text-center tracking-[0] leading-[normal]">
                    {category.name}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="absolute top-[1823px] left-[1355px] w-[105px] h-[335px] bg-white blur-[22px]" />

        <button aria-label="Next category">
          <img
            className="top-[1945px] left-[1332px] absolute w-[70px] h-[70px]"
            alt="Arrow narrow right"
            src="https://c.animaapp.com/QpBFwAMQ/img/arrownarrowright-2.svg"
          />
        </button>

        <button className="inline-flex items-center justify-center gap-2.5 px-6 py-3 absolute top-[1790px] left-[1234px] rounded-[200px] border border-solid border-black">
          <div className="relative w-fit mt-[-1.00px] [font-family:'Lato',Helvetica] font-normal text-black text-base tracking-[0] leading-[normal] whitespace-nowrap">
            View All
          </div>
        </button>
      </section>

      <section>
        <h2 className="absolute top-[2182px] left-[100px] [font-family:'Lato',Helvetica] font-bold text-black text-[32px] tracking-[0] leading-[normal] whitespace-nowrap">
          Best selling product
        </h2>

        <img
          className="absolute top-[2252px] left-[100px] w-[310px] h-[200px] object-cover"
          alt="Image"
          src="https://c.animaapp.com/QpBFwAMQ/img/image-5@2x.png"
        />

        <div className="absolute top-[2252px] left-[430px] w-[310px] h-[200px] rounded-xl overflow-hidden border border-solid border-primary-neutal-200">
          <img
            className="absolute top-0 left-0 w-[310px] h-[200px] object-cover"
            alt="Image"
            src="https://c.animaapp.com/QpBFwAMQ/img/image-260@2x.png"
          />

          <div className="absolute right-2.5 bottom-[13px] font-bold text-white text-[22px] leading-[normal] whitespace-nowrap [font-family:'Lato',Helvetica] tracking-[0]">
            $200
          </div>

          <button className="inline-flex h-7 items-center justify-center gap-1 pl-3 pr-2 py-1 absolute top-40 left-[calc(50.00%_-_47px)] bg-white rounded-[200px]">
            <div className="relative w-fit mt-[-0.50px] [font-family:'Lato',Helvetica] font-normal text-black text-xs tracking-[0] leading-[19px] whitespace-nowrap">
              Visit store
            </div>

            <img
              className="relative w-4 h-4"
              alt="Arrow down right sm"
              src="https://c.animaapp.com/QpBFwAMQ/img/arrow-down-right-sm.svg"
            />
          </button>
        </div>

        <div className="absolute top-[2252px] left-[760px] w-[310px] h-[200px] flex flex-col gap-[118px] bg-[#d9d9d9] rounded-xl overflow-hidden border border-solid border-primary-neutal-200 bg-[url(https://c.animaapp.com/QpBFwAMQ/img/image-261@2x.png)] bg-[100%_100%]">
          <div className="self-end mr-3 w-[39px] h-[26px] mt-3 font-bold text-[#bd130f] text-[22px] leading-[normal] whitespace-nowrap [font-family:'Lato',Helvetica] tracking-[0]">
            $49
          </div>

          <button className="flex h-7 w-[90px] self-center relative items-center justify-center gap-2.5 px-2.5 py-1 bg-white rounded-[200px] border-[none] shadow-ambient-shadow before:content-[''] before:absolute before:inset-0 before:p-px before:rounded-[200px] before:[background:linear-gradient(275deg,rgba(255,172,195,0.5)_0%,rgba(255,201,214,1)_100%)] before:[-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] before:[-webkit-mask-composite:xor] before:[mask-composite:exclude] before:z-[1] before:pointer-events-none">
            <div className="font-normal text-[#c00308] text-xs text-center leading-4 whitespace-nowrap relative w-fit [font-family:'Lato',Helvetica] tracking-[0]">
              Buy now
            </div>
          </button>
        </div>

        <div className="absolute top-[2252px] left-[1090px] w-[310px] h-[420px] flex items-end justify-end bg-[#d9d9d9] rounded-xl overflow-hidden border border-solid border-primary-neutal-200 bg-[url(https://c.animaapp.com/QpBFwAMQ/img/image-6@2x.png)] bg-cover bg-[50%_50%]">
          <button className="flex mb-[34px] w-[180px] h-[42px] mr-[18px] relative px-3 py-2 bg-[#0569b5] rounded-[200px] shadow-6dp-ambient items-center justify-center">
            <div className="text-white text-base whitespace-nowrap relative w-fit [font-family:'Lato',Helvetica] font-bold tracking-[0] leading-[normal]">
              Shop Now
            </div>
          </button>
        </div>

        <div className="absolute top-[2472px] left-[760px] w-[310px] h-[200px] flex flex-col justify-end gap-[9px] bg-[url(https://c.animaapp.com/QpBFwAMQ/img/image-7@2x.png)] bg-cover bg-[50%_50%]">
          <div className="self-end mr-[18px] w-[52px] h-[19px] font-bold text-white text-[22px] leading-[19px] whitespace-nowrap [font-family:'Lato',Helvetica] tracking-[0]">
            $149
          </div>

          <button className="flex ml-[170px] h-7 w-[120px] self-center relative mb-2.5 px-2 py-[5.33px] bg-white rounded-[133.33px] shadow-[0px_2px_3.33px_#00000033] items-center justify-center">
            <div className="font-bold text-black text-[10.7px] leading-[normal] relative w-fit [font-family:'Lato',Helvetica] tracking-[0]">
              Buy Now
            </div>
          </button>
        </div>

        <button className="inline-flex items-center justify-center gap-2.5 px-6 py-3 absolute top-[2180px] left-[1234px] rounded-[200px] border border-solid border-black">
          <div className="relative w-fit mt-[-1.00px] [font-family:'Lato',Helvetica] font-normal text-black text-base tracking-[0] leading-[normal] whitespace-nowrap">
            View All
          </div>
        </button>
      </section>

      <BestSellingProductsSection />

      <section>
        <h2 className="absolute top-[2772px] left-[100px] [font-family:'Lato',Helvetica] font-bold text-black text-[32px] tracking-[0] leading-[normal] whitespace-nowrap">
          Limited-Time Deal
        </h2>

        <div className="absolute top-[2842px] left-[100px]">
          {bestSellingProducts.map((product, index) => (
            <div
              key={product.id}
              className="absolute"
              style={{ left: `${index * 304}px` }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        <img
          className="absolute top-[2828px] left-[87px] w-[127px] h-[127px] object-cover"
          alt="Image"
          src="https://c.animaapp.com/QpBFwAMQ/img/image-264@2x.png"
        />

        <button className="inline-flex items-center justify-center gap-2.5 px-6 py-3 absolute top-[2770px] left-[1234px] rounded-[200px] border border-solid border-black">
          <div className="relative w-fit mt-[-1.00px] [font-family:'Lato',Helvetica] font-normal text-black text-base tracking-[0] leading-[normal] whitespace-nowrap">
            View All
          </div>
        </button>
      </section>

      <section>
        <h2 className="absolute top-[3351px] left-[calc(50.00%_-_158px)] [font-family:'Lato',Helvetica] font-bold text-[#4ea674] text-[32px] tracking-[0] leading-[normal] whitespace-nowrap">
          Our Happy Customers
        </h2>

        <p className="absolute top-[3401px] left-[calc(50.00%_-_321px)] w-[642px] [font-family:'Lato',Helvetica] font-normal text-black text-base text-center tracking-[0] leading-[normal]">
          Don&apos;t just take our word for it – see how our products and
          services have delighted customers across the globe, one experience at
          a time.
        </p>

        <CustomerReviewsSection />

        <div className="flex flex-col w-[385px] items-start justify-center gap-2 p-5 absolute top-[3481px] left-[calc(50.00%_-_627px)] bg-white rounded-xl border border-solid border-primary-neutal-200">
          <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
            <div className="inline-flex items-center gap-3 relative flex-[0_0_auto]">
              <div className="w-12 h-12 rounded-xl bg-[url(https://c.animaapp.com/QpBFwAMQ/img/10-picture-@2x.png)] relative bg-cover bg-[50%_50%]" />

              <div className="relative w-fit [font-family:'Lato',Helvetica] font-bold text-[#023337] text-[22px] tracking-[0] leading-[normal] whitespace-nowrap">
                Emily R.
              </div>
            </div>

            <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
              <img
                className="relative flex-[0_0_auto]"
                alt="Frame"
                src="https://c.animaapp.com/QpBFwAMQ/img/frame-730-5.svg"
              />
            </div>
          </div>

          <p className="relative self-stretch [font-family:'Lato',Helvetica] font-normal text-black text-base tracking-[0] leading-[23px]">
            &quot;Fast delivery and fantastic quality! The customer support team
            was quick to resolve my query. Dealport has earned a loyal
            customer.&quot;
          </p>
        </div>

        <div className="flex flex-col w-[385px] items-start justify-center gap-2 p-5 absolute top-[3688px] left-[calc(50.00%_-_767px)] bg-white rounded-xl border border-solid border-primary-neutal-200">
          <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
            <div className="inline-flex items-center gap-3 relative flex-[0_0_auto]">
              <div className="relative w-12 h-12 rounded-xl">
                <img
                  className="absolute w-full h-full top-0 left-[56.25%] object-cover"
                  alt="Element picture"
                  src="https://c.animaapp.com/QpBFwAMQ/img/15-picture-@2x.png"
                />
              </div>

              <div className="relative w-fit [font-family:'Lato',Helvetica] font-bold text-[#023337] text-[22px] tracking-[0] leading-[normal] whitespace-nowrap">
                Alex T
              </div>
            </div>

            <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
              <img
                className="relative flex-[0_0_auto]"
                alt="Frame"
                src="https://c.animaapp.com/QpBFwAMQ/img/frame-730-5.svg"
              />
            </div>
          </div>

          <p className="relative self-stretch [font-family:'Lato',Helvetica] font-normal text-black text-base tracking-[0] leading-[23px]">
            &quot;Fast delivery and fantastic quality! The customer support team
            was quick to resolve my query. Dealport has earned a loyal
            customer.&quot;
          </p>
        </div>

        <div className="flex flex-col w-[385px] items-start justify-center gap-2 p-5 absolute top-[3481px] right-[52px] bg-white rounded-xl border border-solid border-primary-neutal-200">
          <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
            <div className="inline-flex items-center gap-3 relative flex-[0_0_auto]">
              <div className="w-12 h-12 rounded-xl bg-[url(https://c.animaapp.com/QpBFwAMQ/img/11-picture-@2x.png)] relative bg-cover bg-[50%_50%]" />

              <div className="relative w-fit [font-family:'Lato',Helvetica] font-bold text-[#023337] text-[22px] tracking-[0] leading-[normal] whitespace-nowrap">
                Ahmed M.
              </div>
            </div>

            <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
              <img
                className="relative flex-[0_0_auto]"
                alt="Frame"
                src="https://c.animaapp.com/QpBFwAMQ/img/frame-730-5.svg"
              />
            </div>
          </div>

          <p className="relative self-stretch [font-family:'Lato',Helvetica] font-normal text-black text-base tracking-[0] leading-[23px]">
            &quot;Fast delivery and fantastic quality! The customer support team
            was quick to resolve my query. Dealport has earned a loyal
            customer.&quot;
          </p>
        </div>

        <div className="flex flex-col w-[385px] items-start justify-center gap-2 p-5 absolute top-[3688px] right-[232px] bg-white rounded-xl border border-solid border-primary-neutal-200">
          <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
            <div className="inline-flex items-center gap-3 relative flex-[0_0_auto]">
              <div className="w-12 h-12 rounded-xl bg-[url(https://c.animaapp.com/QpBFwAMQ/img/24-picture-@2x.png)] relative bg-cover bg-[50%_50%]" />

              <div className="relative w-fit [font-family:'Lato',Helvetica] font-bold text-[#023337] text-[22px] tracking-[0] leading-[normal] whitespace-nowrap">
                David H
              </div>
            </div>

            <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
              <img
                className="relative flex-[0_0_auto]"
                alt="Frame"
                src="https://c.animaapp.com/QpBFwAMQ/img/frame-730-5.svg"
              />
            </div>
          </div>

          <p className="relative self-stretch [font-family:'Lato',Helvetica] font-normal text-black text-base tracking-[0] leading-[23px]">
            &quot;Fast delivery and fantastic quality! The customer support team
            was quick to resolve my query. Dealport has earned a loyal
            customer.&quot;
          </p>
        </div>

        <div className="flex flex-col w-[385px] items-start justify-center gap-2 p-5 absolute top-[3481px] right-[-365px] bg-white rounded-xl border border-solid border-primary-neutal-200">
          <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
            <div className="inline-flex items-center gap-3 relative flex-[0_0_auto]">
              <div className="relative w-12 h-12 rounded-xl">
                <img
                  className="absolute w-full h-full top-0 left-0 object-cover"
                  alt="Element picture"
                  src="https://c.animaapp.com/QpBFwAMQ/img/13-picture-@2x.png"
                />
              </div>

              <div className="relative w-fit [font-family:'Lato',Helvetica] font-bold text-[#023337] text-[22px] tracking-[0] leading-[normal] whitespace-nowrap">
                Ahmed M.
              </div>
            </div>

            <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
              <img
                className="mb-[-6118.00px] ml-[-1610.00px] relative flex-[0_0_auto]"
                alt="Frame"
                src="/img/frame-730.svg"
              />
            </div>
          </div>

          <p className="relative self-stretch [font-family:'Lato',Helvetica] font-normal text-black text-base tracking-[0] leading-[23px]">
            &quot;Fast delivery and fantastic quality! The customer support team
            was quick to resolve my query. Dealport has earned a loyal
            customer.&quot;
          </p>
        </div>

        <div className="flex flex-col w-[385px] items-start justify-center gap-2 p-5 absolute top-[3688px] right-[-195px] bg-white rounded-xl border border-solid border-primary-neutal-200">
          <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
            <div className="inline-flex items-center gap-3 relative flex-[0_0_auto]">
              <div className="w-12 h-12 rounded-xl bg-[url(https://c.animaapp.com/QpBFwAMQ/img/13-picture--1@2x.png)] relative bg-cover bg-[50%_50%]" />

              <div className="relative w-fit [font-family:'Lato',Helvetica] font-bold text-[#023337] text-[22px] tracking-[0] leading-[normal] whitespace-nowrap">
                Ahmed M.
              </div>
            </div>

            <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
              <img
                className="relative flex-[0_0_auto]"
                alt="Frame"
                src="/img/image.svg"
              />
            </div>
          </div>

          <p className="relative self-stretch [font-family:'Lato',Helvetica] font-normal text-black text-base tracking-[0] leading-[23px]">
            &quot;Fast delivery and fantastic quality! The customer support team
            was quick to resolve my query. Dealport has earned a loyal
            customer.&quot;
          </p>
        </div>

        <button className="inline-flex h-12 px-[33px] py-4 absolute top-[3895px] left-[calc(50.00%_-_85px)] bg-[#023337] rounded-[200px] items-center justify-center">
          <div className="relative w-fit mt-[-2.50px] mb-[-0.50px] [font-family:'Lato',Helvetica] font-bold text-white text-base tracking-[0] leading-[normal] whitespace-nowrap">
            GET STARTED
          </div>
        </button>
      </section>

      <CallToActionSection />

      <FooterSection />
    </div>
  );
};
