import { HeaderGadgets} from "./components/Header";
import { Hero } from "./components/Hero";
import { Category } from "./components/Category";
import { ProductCard } from "./components/ProductCard";
import { Footer } from "./components/Footer";
import { TimeCounter } from "./components/TimeCounter";

type ProductItem = {
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

type ProductSection = {
  tagTitle: string;
  tagHref: string;
  timeCounter?: { hours: string; mins: string; sec: string };
  products: ProductItem[];
};

const productSections: ProductSection[] = [
  {
    tagTitle: "New Arrival",
    tagHref: "/products?tag=New%20Arrival",
    products: [
      { href: "/robotic-dog-remote-control-robot-dog-cat", alt: "Robotic Dog [Remote Control Robot Dog + Cat]", src: "https://c.animaapp.com/mmu22iaoUL3nbW/assets/73.webp", imgClassName: "aspect-[auto_600_/_600]", discountText: "-33% OFF", title: "Robotic Dog [Remote Control Robot Dog + Cat]", currentPrice: "৳ 1,070", originalPrice: "৳ 1,600", isStockOut: false },
      { href: "/magnetic-suction-vacuum-tabphone-holder", alt: "Magnetic Suction Vacuum Tab/Phone Holder", src: "https://c.animaapp.com/mmu22iaoUL3nbW/assets/55.webp", imgClassName: "aspect-[auto_600_/_600]", discountText: "-39% OFF", title: "Magnetic Suction Vacuum Tab/Phone Holder", currentPrice: "৳ 550", originalPrice: "৳ 900", isStockOut: false },
      { href: "/rubiks-cube-orbit-spinner-brain-teaser-latest-collection-2025-83497", alt: "Rubik's Cube -Orbit Spinner Brain Teaser", src: "https://c.animaapp.com/mmu22iaoUL3nbW/assets/54.webp", imgClassName: "aspect-[auto_600_/_600]", discountText: "-26% OFF", title: "Rubik's Cube -Orbit Spinner Brain Teaser [Latest Collection-2025]", currentPrice: "৳ 890", originalPrice: "৳ 1,200", isStockOut: false },
      { href: "/frog-libra-learning-toys-puzzle-digital-thinking-training-parent-child-interaction", alt: "Frog Libra Learning Toys Puzzle", src: "https://c.animaapp.com/mmu22iaoUL3nbW/assets/63.webp", imgClassName: "aspect-[auto_600_/_600]", discountText: "-25% OFF", title: "Frog Libra Learning Toys Puzzle Digital Thinking Training Parent-Child Interaction", currentPrice: "৳ 675", originalPrice: "৳ 900", isStockOut: false },
      { href: "/unleash-the-rope-big-combat-educational-toys", alt: "Unleash the rope big combat educational toys", src: "https://c.animaapp.com/mmu22iaoUL3nbW/assets/61.webp", imgClassName: "aspect-[auto_600_/_600]", discountText: "-37% OFF", title: "Unleash the rope big combat educational toys", currentPrice: "৳ 430", originalPrice: "৳ 680", isStockOut: false },
    ],
  },
  {
    tagTitle: "Popular products",
    tagHref: "/products?tag=Popular%20products",
    products: [
      { href: "/turbine-wash-portable-washing-machine-dormitory-usb-bucket-washer", alt: "Turbine Wash Portable Washing Machine", src: "https://c.animaapp.com/mmu22iaoUL3nbW/assets/64.webp", imgClassName: "aspect-[auto_600_/_600]", discountText: "-36% OFF", title: "Turbine Wash Portable Washing Machine [Dormitory USB Bucket washer]", currentPrice: "৳ 890", originalPrice: "৳ 1,400", isStockOut: false },
      { href: "/police-car-and-jeep-toy-showpiece-gift-for-kids", alt: "Police Car and Jeep", src: "https://c.animaapp.com/mmu22iaoUL3nbW/assets/47.webp", imgClassName: "aspect-[auto_478_/_480]", discountText: "-34% OFF", title: "Police Car and Jeep [Toy Showpiece & Gift for kids]", currentPrice: "৳ 325", originalPrice: "৳ 490", isStockOut: false },
      { href: "/vr-shinecon-g13-3d-virtual-reality-box", alt: "VR Shinecon G13 3D Virtual Reality Box", src: "https://c.animaapp.com/mmu22iaoUL3nbW/assets/68.webp", imgClassName: "aspect-[auto_400_/_399]", discountText: "-39% OFF", title: "VR Shinecon G13 3D Virtual Reality Box", currentPrice: "৳ 399", originalPrice: "৳ 650", isStockOut: true },
      { href: "/3d-football-player-figures-messi-pvc-model", alt: "3D Football Player Figures (Messi) PVC Model", src: "https://c.animaapp.com/mmu22iaoUL3nbW/assets/66.webp", imgClassName: "aspect-[auto_400_/_400]", discountText: "-50% OFF", title: "3D Football Player Figures (Messi) PVC Model", currentPrice: "৳ 450", originalPrice: "৳ 900", isStockOut: false },
      { href: "/retro-portable-mini-handheld-video-game-console-8-bit-30-inch-color-lcd", alt: "Retro Portable Mini Handheld Video Game Console", src: "https://c.animaapp.com/mmu22iaoUL3nbW/assets/65.webp", imgClassName: "aspect-[auto_996_/_1012]", discountText: "-41% OFF", title: "Retro Portable Mini Handheld Video Game Console 8 Bit 3.0 Inch Color LCD", currentPrice: "৳ 950", originalPrice: "৳ 1,600" },
    ],
  },
  {
    tagTitle: "Flash Sale",
    tagHref: "/products?tag=Flash%20Sale",
    timeCounter: { hours: "0-10", mins: "0-32", sec: "0-60" },
    products: [
      { href: "/wireless-bluetooth-headset-portable-foldable", alt: "Wireless Bluetooth Headset Portable Foldable", src: "https://c.animaapp.com/mmu22iaoUL3nbW/assets/53.webp", imgClassName: "aspect-[auto_720_/_720]", discountText: "-47% OFF", title: "Wireless Bluetooth Headset Portable Foldable", currentPrice: "৳ 280", originalPrice: "৳ 530", isStockOut: false },
      { href: "/automatic-deposit-banknote-christmas-gift", alt: "Automatic Deposit Banknote Christmas Gift", src: "https://c.animaapp.com/mmu22iaoUL3nbW/assets/56.webp", imgClassName: "aspect-[auto_1080_/_1067]", discountText: "-55% OFF", title: "Automatic Deposit Banknote Christmas Gift", currentPrice: "৳ 180", originalPrice: "৳ 400", isStockOut: true },
      { href: "/inpods-12-tws-wireless-pop-ups-bluetooth-50-headphone-earphones", alt: "inPods 12 TWS Wireless Bluetooth Earbuds", src: "https://c.animaapp.com/mmu22iaoUL3nbW/assets/78.webp", imgClassName: "aspect-[auto_720_/_720]", discountText: "-53% OFF", title: "inPods 12 TWS Wireless Pop-ups Bluetooth 5.0 Earbuds", currentPrice: "৳ 190", originalPrice: "৳ 400", isStockOut: true },
      { href: "/couple-digital-love-leather-quartz-watch-set", alt: "Couple Digital LOVE Leather Quartz Watch Set", src: "https://c.animaapp.com/mmu22iaoUL3nbW/assets/69.webp", imgClassName: "aspect-[auto_1079_/_1074]", discountText: "-50% OFF", title: "Couple Digital LOVE Leather Quartz Watch Set", currentPrice: "৳ 299", originalPrice: "৳ 600", isStockOut: true },
      { href: "/ghoul-hand-candle-holder", alt: "Ghoul Hand Candle Holder", src: "https://c.animaapp.com/mmu22iaoUL3nbW/assets/49.webp", imgClassName: "aspect-[auto_600_/_599]", discountText: "-50% OFF", title: "Ghoul Hand Candle Holder", currentPrice: "৳ 225", originalPrice: "৳ 450", isStockOut: false },
    ],
  },
  {
    tagTitle: "Best Sale Products",
    tagHref: "/products?tag=Best%20Sale%20Products",
    products: [
      { href: "/digital-kids-camera-classic-mini-camera", alt: "Digital Kids Camera Classic mini Camera", src: "https://c.animaapp.com/mmu22iaoUL3nbW/assets/67.webp", imgClassName: "aspect-[auto_800_/_800]", discountText: "-38% OFF", title: "Digital Kids Camera Classic mini Camera", currentPrice: "৳ 1,375", originalPrice: "৳ 2,200", isStockOut: false },
      { href: "/ultra-range-one-click-eject-fly-plane-blaster", alt: "Ultra-Range One-Click Eject Fly Plane Blaster", src: "https://c.animaapp.com/mmu22iaoUL3nbW/assets/50.webp", imgClassName: "aspect-[auto_600_/_600]", discountText: "-31% OFF", title: "Ultra-Range One-Click Eject Fly Plane Blaster", currentPrice: "৳ 379", originalPrice: "৳ 550", isStockOut: false },
      { href: "/motorcycle-toy-motorbike-model-showpiece-for-boys-gift-for-kids", alt: "Motorcycle Toy", src: "https://c.animaapp.com/mmu22iaoUL3nbW/assets/58.webp", imgClassName: "aspect-[auto_600_/_600]", discountText: "-35% OFF", title: "Motorcycle Toy [Motorbike Model Showpiece for Boys, Gift for Kids]", currentPrice: "৳ 310", originalPrice: "৳ 480" },
      { href: "/k8-wireless-microphone-63230", alt: "K8 Wireless Microphone", src: "https://c.animaapp.com/mmu22iaoUL3nbW/assets/62.webp", imgClassName: "aspect-[auto_1080_/_1080]", discountText: "-51% OFF", title: "K8 Wireless Microphone", currentPrice: "৳ 590", originalPrice: "৳ 1,200" },
      { href: "/m10-tws-led-digital-display-bt-53-earbud-sports-music-true-game-wireless-earphones", alt: "M10 TWS LED Digital Display BT 5.3 Earbud", src: "https://c.animaapp.com/mmu22iaoUL3nbW/assets/75.webp", imgClassName: "aspect-[auto_1080_/_1078]", discountText: "-42% OFF", title: "M10 TWS LED Digital Display BT 5.3 Earbud Sports Music True Game Wireless Earphones", currentPrice: "৳ 350", originalPrice: "৳ 600", isStockOut: false },
    ],
  },
  {
    tagTitle: "Flash Deals",
    tagHref: "/products?tag=Flash%20Deals",
    timeCounter: { hours: "0-10", mins: "0-33", sec: "0-15" },
    products: [
      { href: "/cx03-phone-semiconductor-magnetic-cooler-15w-wireless-fast-charge", alt: "CX03 Phone Semiconductor Magnetic Cooler", src: "https://c.animaapp.com/mmu22iaoUL3nbW/assets/59.webp", imgClassName: "aspect-[auto_1080_/_1080]", discountText: "-46% OFF", title: "CX03 Phone Semiconductor Magnetic Cooler 15W Wireless Fast Charge", currentPrice: "৳ 1,290", originalPrice: "৳ 2,400", isStockOut: true },
      { href: "/phone-radiator-cooler-for-gaming-mobile-tablet", alt: "AL-12 Magnetic and Clip Semiconductor Cooling", src: "https://c.animaapp.com/mmu22iaoUL3nbW/assets/77.webp", imgClassName: "aspect-[auto_1079_/_1087]", discountText: "-43% OFF", title: "AL-12 Magnetic and Cllip Semiconductor Cooling", currentPrice: "৳ 1,190", originalPrice: "৳ 2,100", isStockOut: true },
      { href: "/t900-ultra2-smartwatch", alt: "T900 Ultra2 Smartwatch", src: "https://c.animaapp.com/mmu22iaoUL3nbW/assets/57.webp", imgClassName: "aspect-[auto_500_/_500]", discountText: "-50% OFF", title: "T900 Ultra2 Smartwatch", currentPrice: "৳ 750", originalPrice: "৳ 1,500", isStockOut: false },
      { href: "/portable-mini-12v-dc-electric-submersible-pump", alt: "Portable Mini 12V DC Electric Submersible Pump", src: "https://c.animaapp.com/mmu22iaoUL3nbW/assets/70.webp", imgClassName: "aspect-[auto_1000_/_1000]", discountText: "-39% OFF", title: "Portable Mini 12V DC Electric Submersible Pump", currentPrice: "৳ 1,150", originalPrice: "৳ 1,900", isStockOut: false },
      { href: "/g6-universal-mini-usb-portable-mobile-phone-cooler", alt: "G6 Universal Mini USB Portable Mobile Phone Cooler", src: "https://c.animaapp.com/mmu22iaoUL3nbW/assets/71.webp", imgClassName: "aspect-[auto_600_/_619]", discountText: "-52% OFF", title: "G6 Universal Mini USB Portable Mobile Phone Cooler", currentPrice: "৳ 240", originalPrice: "৳ 500", isStockOut: true },
    ],
  },
];

export const App = () => {
  return (
    <main className="text-black text-base not-italic normal-nums font-normal accent-auto bg-gray-100 box-border caret-transparent block tracking-[normal] leading-[normal] list-outside list-disc overflow-x-hidden overflow-y-auto pointer-events-auto scroll-smooth text-start indent-[0px] normal-case visible w-full border-separate font-satoshi md:bg-transparent">
      <div className="box-border caret-transparent">
        <HeaderGadgets />
        <div className="box-border caret-transparent min-h-[1000px] mb-20 md:min-h-0 md:mb-0">
          <Hero />
          <Category />
          {productSections.map((section) => (
            <div key={section.tagTitle} className="box-border caret-transparent">
              <div className="items-center box-border caret-transparent flex-col max-w-[1340px] w-full mx-0 px-[15px] md:[align-items:normal] md:flex-row md:w-[95%] md:mx-auto md:px-0">
                <div className="items-center box-border caret-transparent flex justify-between mt-6 mb-3.5">
                  <div className="items-center box-border caret-transparent gap-x-[7px] flex flex-col justify-center min-h-[auto] min-w-[auto] gap-y-[7px] md:gap-x-[15px] md:flex-row md:gap-y-[15px]">
                    <h2 className="text-neutral-900 text-base font-bold box-border caret-transparent leading-[18px] min-h-[auto] min-w-[auto] text-ellipsis text-nowrap overflow-hidden md:text-neutral-700 md:text-[22px] md:font-medium md:leading-[normal]">
                      {section.tagTitle}
                    </h2>
                    {section.timeCounter && (
                      <TimeCounter hours={section.timeCounter.hours} mins={section.timeCounter.mins} sec={section.timeCounter.sec} />
                    )}
                  </div>
                  <a href={section.tagHref} className="text-black text-[13px] font-medium items-center box-border caret-transparent flex leading-[15px] md:text-zinc-800 md:text-base hover:text-zinc-800 hover:no-underline">
                    View All
                    <img src="https://c.animaapp.com/mmu22iaoUL3nbW/assets/icon-12.svg" alt="Icon" className="box-border caret-transparent block h-6 w-6 ml-0 md:ml-2" />
                  </a>
                </div>
                <div className="box-border caret-transparent gap-x-[7px] grid grid-cols-[repeat(2,1fr)] gap-y-[7px] mb-[30px] md:gap-x-[15px] md:grid-cols-[repeat(5,1fr)] md:gap-y-[15px]">
                  {section.products.map((product, idx) => (
                    <ProductCard key={idx} {...product} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        <Footer />
      </div>
    </main>
  );
};
