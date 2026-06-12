const footerLinks = {
  quick: [
    { href: "/pages/return-and-refund-policy", label: "Return & Refund Policy" },
    { href: "/pages/privacy-policy", label: "Privacy Policy" },
    { href: "/pages/terms-and-conditions", label: "Terms and Conditions" },
    { href: "/pages/about-us", label: "About us" },
  ],
  useful: [
    { href: "/pages/why-shop-online-with-us", label: "Why Shop Online with Us" },
    { href: "/pages/online-payment-methods", label: "Online Payment Methods" },
    { href: "/pages/after-sales-support", label: "After Sales Support" },
    { href: "/pages/faq", label: "FAQ" },
  ],
};

export const Footer = () => {
  return (
    <div className="box-border caret-transparent">
      {/* Desktop Footer */}
      <div className="box-border caret-transparent hidden md:block">
        <div className="bg-white box-border caret-transparent mt-5">
          <div className="box-border caret-transparent max-w-[1340px] w-[95%] mx-auto">
            <div className="box-border caret-transparent gap-x-[25px] grid grid-cols-[1fr] gap-y-[25px] p-[15px] md:gap-x-[30px] md:grid-cols-[repeat(4,1fr)] md:gap-y-[30px] md:px-2.5 md:py-5">
              {/* Brand */}
              <div className="box-border caret-transparent text-center w-full md:text-start min-h-0 min-w-0 md:min-h-[auto] md:min-w-[auto]">
                <div className="box-border caret-transparent flex justify-center text-center mb-[15px] md:block md:justify-normal md:text-start">
                  <a href="/" className="text-blue-700 items-center box-border caret-transparent flex justify-center max-w-[180px] text-center w-full mx-auto md:text-start md:mx-0 hover:no-underline">
                    <img sizes="(max-width: 599px) 200px, (min-width: 600px) 400px" alt="Overseas Products" src="https://c.animaapp.com/mmu22iaoUL3nbW/assets/74.webp" className="aspect-[auto_5400_/_1500] box-border caret-transparent block h-10 max-w-[180px] object-contain w-full" />
                  </a>
                </div>
                <div className="text-sm box-border caret-transparent text-center md:text-start">
                  <p className="box-border caret-transparent text-center md:text-start">Get the best for less</p>
                </div>
                <div className="items-center box-border caret-transparent gap-x-2.5 flex justify-center gap-y-2.5 text-center mt-[15px] md:justify-normal md:text-start">
                  {[
                    { href: "https://www.facebook.com/myopbd.shop", icon: "icon-14.svg", label: "facebook", hover: "hover:bg-indigo-800" },
                    { href: "https://www.instagram.com/opbd.shop", icon: "icon-15.svg", label: "instagram", hover: "" },
                    { href: "https://youtube.com/@opbd.s", icon: "icon-16.svg", label: "youtube", hover: "hover:bg-red-600" },
                    { href: "https://s.daraz.com.bd/s.ZIJqX", icon: "icon-17.svg", label: "daraz", hover: "hover:bg-red-600" },
                    { href: "https://wa.me/+8801615332701", icon: "icon-18.svg", label: "WhatsApp", hover: "hover:bg-teal-600" },
                  ].map((s) => (
                    <a key={s.label} aria-label={s.label} href={s.href} className={`text-blue-700 bg-gray-400/30 box-border caret-transparent block underline pt-1.5 pb-1 px-2 rounded-[25px] ${s.hover} hover:no-underline`}>
                      <img src={`https://c.animaapp.com/mmu22iaoUL3nbW/assets/${s.icon}`} alt="Icon" className="box-border caret-transparent h-5 w-5" />
                    </a>
                  ))}
                </div>
              </div>
              {/* Contact */}
              <div className="box-border caret-transparent text-center md:text-start min-h-0 min-w-0 md:min-h-[auto] md:min-w-[auto]">
                <div className="box-border caret-transparent text-center mb-[15px] md:text-start">
                  <b className="text-xl font-semibold box-border caret-transparent block tracking-[-0.3px] leading-[30px]">Contact Us</b>
                </div>
                <ul className="box-border caret-transparent list-none text-center pl-0 md:text-start">
                  {[
                    { icon: "icon-19.svg", href: "mailto://opbd.shop@gmail.com", text: "opbd.shop@gmail.com" },
                    { icon: "icon-20.svg", href: "tel://+8801615332701", text: "+8801615332701" },
                    { icon: "icon-21.svg", href: "#", text: "D-14/3, Bank Colony, Savar, Dhaka-1340" },
                  ].map((c, i) => (
                    <li key={i} className="items-center box-border caret-transparent gap-x-2.5 flex flex-wrap justify-center gap-y-2.5 text-center w-full mb-2 md:flex-nowrap md:justify-start md:text-start">
                      <span className="text-lime-500"><img src={`https://c.animaapp.com/mmu22iaoUL3nbW/assets/${c.icon}`} alt="Icon" className="box-border caret-transparent h-5 w-5" /></span>
                      <a href={c.href} className="text-sm box-border caret-transparent block leading-[26px] text-center mb-0.5 md:text-start hover:text-black hover:no-underline">{c.text}</a>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Quick Links */}
              <div className="box-border caret-transparent text-center md:text-start min-h-0 min-w-0 md:min-h-[auto] md:min-w-[auto]">
                <div className="box-border caret-transparent text-center mb-[15px] md:text-start">
                  <b className="text-xl font-semibold box-border caret-transparent block tracking-[-0.3px] leading-[30px]">Quick Links</b>
                </div>
                <ul className="box-border caret-transparent list-none text-center pl-0 md:text-start">
                  {footerLinks.quick.map((link) => (
                    <li key={link.href} className="box-border caret-transparent text-center py-[5px] md:text-start">
                      <a href={link.href} className="text-zinc-800 box-border caret-transparent inline-block text-center md:text-start hover:text-blue-600 hover:no-underline">{link.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Useful Links */}
              <div className="box-border caret-transparent text-center md:text-start min-h-0 min-w-0 md:min-h-[auto] md:min-w-[auto]">
                <div className="box-border caret-transparent text-center mb-[15px] md:text-start">
                  <b className="text-xl font-semibold box-border caret-transparent block tracking-[-0.3px] leading-[30px]">Useful Links</b>
                </div>
                <ul className="box-border caret-transparent list-none text-center pl-0 md:text-start">
                  {footerLinks.useful.map((link) => (
                    <li key={link.href} className="box-border caret-transparent text-center py-[5px] md:text-start">
                      <a href={link.href} className="text-zinc-800 box-border caret-transparent inline-block text-center md:text-start hover:text-blue-600 hover:no-underline">{link.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {/* Copyright */}
            <div className="border-t-indigo-300 box-border caret-transparent flex justify-center mb-[60px] p-[15px] border-t md:mb-0 md:px-[30px] md:py-[25px]">
              <div className="items-center box-border caret-transparent gap-x-[15px] flex flex-col justify-between gap-y-[15px] text-center md:flex-row md:text-start">
                <b className="text-neutral-600 text-sm box-border caret-transparent block leading-[22px]">
                  Copyright © 2025{" "}
                  <a href="/" className="box-border caret-transparent inline-block hover:text-blue-900 hover:underline">www.paatalika.com</a>
                  <br />
                  <a href="/" className="font-bold box-border caret-transparent inline-block hover:text-blue-900 hover:underline">Overseas Products</a>
                </b>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="box-border caret-transparent block md:hidden">
        <div className="fixed bg-white border-t-stone-400/60 shadow-[rgba(0,0,0,0.07)_0px_-2px_12px_0px] box-border caret-transparent flex z-[1000] px-[15px] py-[1.875px] border-t bottom-0 inset-x-0">
          <div className="box-border caret-transparent max-w-full min-h-[auto] w-full">
            <div className="items-center box-border caret-transparent flex justify-between">
              {[
                { href: "https://m.me/515657261637355", icon: "icon-22.svg", label: "Messenger" },
                { href: "https://wa.me/+8801615332701", icon: "icon-23.svg", label: "Call" },
                { href: "/", icon: "icon-24.svg", label: "Home" },
                { href: "https://www.facebook.com/myopbd.shop", icon: "icon-25.svg", label: "Page" },
                { href: "/my-account-sm", icon: "icon-26.svg", label: "Account" },
              ].map((item) => (
                <a key={item.href} href={item.href} className="relative text-blue-700 items-center box-border caret-transparent flex basis-0 flex-col grow min-h-[auto] py-[5px] rounded-[10px] hover:no-underline">
                  <img src={`https://c.animaapp.com/mmu22iaoUL3nbW/assets/${item.icon}`} alt="Icon" className="box-border caret-transparent block h-[30px] w-[30px] mb-1" />
                  <span className="text-neutral-500 text-[13px] font-semibold box-border caret-transparent block tracking-[0.13px] min-h-[auto] min-w-[auto] text-ellipsis text-nowrap overflow-hidden">{item.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Footer Info */}
      <div className="box-border caret-transparent block md:hidden">
        <div className="bg-white box-border caret-transparent mt-5">
          <div className="box-border caret-transparent max-w-[1340px] w-[95%] mx-auto">
            <div className="box-border caret-transparent gap-x-[25px] grid grid-cols-[1fr] gap-y-[25px] p-[15px]">
              {/* Brand */}
              <div className="box-border caret-transparent text-center w-full">
                <div className="box-border caret-transparent flex justify-center mb-[15px]">
                  <a href="/" className="text-blue-700 items-center box-border caret-transparent flex justify-center max-w-[180px] w-full mx-auto hover:no-underline">
                    <img alt="Overseas Products" src="https://c.animaapp.com/mmu22iaoUL3nbW/assets/74.webp" className="aspect-[auto_5400_/_1500] box-border caret-transparent block h-10 max-w-[180px] object-contain w-full" />
                  </a>
                </div>
                <p className="text-sm box-border caret-transparent text-center">Get the best for less</p>
              </div>
              {/* Contact */}
              <div className="box-border caret-transparent text-center">
                <b className="text-xl font-semibold box-border caret-transparent block tracking-[-0.3px] leading-[30px] mb-[15px]">Contact Us</b>
                <ul className="box-border caret-transparent list-none pl-0">
                  {[
                    { icon: "icon-19.svg", href: "mailto://opbd.shop@gmail.com", text: "opbd.shop@gmail.com" },
                    { icon: "icon-20.svg", href: "tel://+8801615332701", text: "+8801615332701" },
                    { icon: "icon-21.svg", href: "#", text: "D-14/3, Bank Colony, Savar, Dhaka-1340" },
                  ].map((c, i) => (
                    <li key={i} className="items-center box-border caret-transparent gap-x-2.5 flex flex-wrap justify-center gap-y-2.5 text-center w-full mb-2">
                      <span className="text-lime-500"><img src={`https://c.animaapp.com/mmu22iaoUL3nbW/assets/${c.icon}`} alt="Icon" className="h-5 w-5" /></span>
                      <a href={c.href} className="text-sm box-border caret-transparent block leading-[26px] hover:no-underline">{c.text}</a>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Quick Links */}
              <div className="box-border caret-transparent text-center">
                <b className="text-xl font-semibold box-border caret-transparent block tracking-[-0.3px] leading-[30px] mb-[15px]">Quick Links</b>
                <ul className="box-border caret-transparent list-none pl-0">
                  {footerLinks.quick.map((link) => (
                    <li key={link.href} className="box-border caret-transparent text-center py-[5px]">
                      <a href={link.href} className="text-zinc-800 box-border caret-transparent inline-block hover:text-blue-600 hover:no-underline">{link.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Useful Links */}
              <div className="box-border caret-transparent text-center">
                <b className="text-xl font-semibold box-border caret-transparent block tracking-[-0.3px] leading-[30px] mb-[15px]">Useful Links</b>
                <ul className="box-border caret-transparent list-none pl-0">
                  {footerLinks.useful.map((link) => (
                    <li key={link.href} className="box-border caret-transparent text-center py-[5px]">
                      <a href={link.href} className="text-zinc-800 box-border caret-transparent inline-block hover:text-blue-600 hover:no-underline">{link.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {/* Mobile Copyright */}
            <div className="border-t-indigo-300 box-border caret-transparent flex justify-center mb-[60px] p-[15px] border-t">
              <b className="text-neutral-600 text-sm box-border caret-transparent block leading-[22px] text-center">
                Copyright © 2025{" "}
                <a href="/" className="box-border caret-transparent inline-block hover:text-blue-900 hover:underline">www.paatalika.com</a>
                <br />
                <a href="/" className="font-bold box-border caret-transparent inline-block hover:text-blue-900 hover:underline">Overseas Products</a>
              </b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
