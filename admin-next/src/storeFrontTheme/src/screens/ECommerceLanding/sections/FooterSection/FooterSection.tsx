export const FooterSection = (): JSX.Element => {
  const companyInfoLinks = [
    { label: "About Us", href: "#about" },
    { label: "Careers", href: "#careers" },
    { label: "Press Releases", href: "#press" },
    { label: "Sustainability Practices", href: "#sustainability" },
  ];

  const customerSupportLinks = [
    { label: "Contact Us", href: "#contact" },
    { label: "Help Center (FAQs)", href: "#help" },
    { label: "Track My Order", href: "#track" },
    { label: "Return & Refund Policy", href: "#returns" },
    { label: "Shipping Information", href: "#shipping" },
  ];

  const exploreLinks = [
    { label: "Categories", href: "#categories" },
    { label: "Bestsellers", href: "#bestsellers" },
    { label: "New Arrivals", href: "#new" },
    { label: "Deals & Promotions", href: "#deals" },
  ];

  const legalLinks = [
    { label: "Terms & Conditions", href: "#terms" },
    { label: "Privacy Policy", href: "#privacy" },
    { label: "Cookie Policy", href: "#cookies" },
    { label: "Accessibility Statement", href: "#accessibility" },
    { label: "Return & Refund Policy", href: "#refund-policy" },
  ];

  const socialLinks = [
    {
      name: "Facebook",
      icon: "https://c.animaapp.com/QpBFwAMQ/img/facebook.svg",
      href: "#facebook",
      width: "w-6",
      height: "h-6",
    },
    {
      name: "Instagram",
      icon: "https://c.animaapp.com/QpBFwAMQ/img/instagram.svg",
      href: "#instagram",
      width: "w-6",
      height: "h-6",
    },
    {
      name: "Twitter",
      icon: "https://c.animaapp.com/QpBFwAMQ/img/garden-twitter-fill-12.svg",
      href: "#twitter",
      width: "w-5",
      height: "h-5",
    },
    {
      name: "LinkedIn",
      icon: "https://c.animaapp.com/QpBFwAMQ/img/linkedin.svg",
      href: "#linkedin",
      width: "w-6",
      height: "h-6",
    },
  ];

  return (
    <footer className="absolute left-[calc(50.00%_-_720px)] bottom-0 w-[1440px] h-[504px] bg-[#eaf8e7]">
      <nav
        className="flex flex-col w-[161px] items-start gap-6 absolute top-[76px] left-[100px]"
        aria-labelledby="company-info-heading"
      >
        <h2
          id="company-info-heading"
          className="relative self-stretch mt-[-1.00px] [font-family:'Lato',Helvetica] font-medium text-black text-lg tracking-[0] leading-[normal]"
        >
          Company Info
        </h2>

        <ul className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
          {companyInfoLinks.map((link, index) => (
            <li key={index} className="relative self-stretch">
              <a
                href={link.href}
                className={`${index === 0 ? "mt-[-1.00px]" : ""} [font-family:'Lato',Helvetica] font-normal text-[#000000cc] text-base tracking-[0] leading-[normal] hover:text-black transition-colors`}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <nav
        className="inline-flex flex-col items-start gap-6 absolute top-[76px] left-[317px]"
        aria-labelledby="customer-support-heading"
      >
        <h2
          id="customer-support-heading"
          className="relative self-stretch mt-[-1.00px] [font-family:'Lato',Helvetica] font-medium text-black text-lg tracking-[0] leading-[normal]"
        >
          Customer Support
        </h2>

        <ul className="inline-flex flex-col items-start gap-5 relative flex-[0_0_auto]">
          {customerSupportLinks.map((link, index) => (
            <li key={index} className="relative self-stretch">
              <a
                href={link.href}
                className={`${index === 0 ? "mt-[-1.00px]" : ""} [font-family:'Lato',Helvetica] font-normal text-[#000000cc] text-base tracking-[0] leading-[normal] hover:text-black transition-colors`}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <nav
        className="flex flex-col w-[161px] items-start gap-6 absolute top-[76px] left-[959px]"
        aria-labelledby="explore-heading"
      >
        <h2
          id="explore-heading"
          className="relative self-stretch mt-[-1.00px] [font-family:'Lato',Helvetica] font-medium text-black text-lg tracking-[0] leading-[normal]"
        >
          Explore
        </h2>

        <ul className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
          {exploreLinks.map((link, index) => (
            <li key={index} className="relative self-stretch">
              <a
                href={link.href}
                className={`${index === 0 ? "mt-[-1.00px]" : ""} [font-family:'Lato',Helvetica] font-normal text-[#000000cc] text-base tracking-[0] leading-[normal] hover:text-black transition-colors`}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <nav
        className="inline-flex flex-col items-start gap-6 absolute top-[76px] left-[1176px]"
        aria-labelledby="legal-heading"
      >
        <h2
          id="legal-heading"
          className="self-stretch mt-[-1.00px] font-medium text-black text-lg relative [font-family:'Lato',Helvetica] tracking-[0] leading-[normal]"
        >
          Legal
        </h2>

        <ul className="inline-flex flex-col items-start gap-5 relative flex-[0_0_auto]">
          {legalLinks.map((link, index) => (
            <li key={index} className="relative self-stretch">
              <a
                href={link.href}
                className={`${index === 0 ? "mt-[-1.00px]" : ""} [font-family:'Lato',Helvetica] font-normal text-[#000000cc] text-base tracking-[0] leading-[normal] hover:text-black transition-colors`}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <img
        className="absolute top-[calc(50.00%_-_114px)] left-[calc(50.00%_-_120px)] w-60 h-[51px]"
        alt="Dealport Logo"
        src="https://c.animaapp.com/QpBFwAMQ/img/frame-4121-1.svg"
      />

      <div className="flex flex-col w-[129px] items-start gap-3 absolute top-[345px] left-[1176px]">
        <h2 className="relative self-stretch mt-[-1.00px] [font-family:'Lato',Helvetica] font-medium text-black text-lg tracking-[0] leading-[normal]">
          Connect with us
        </h2>

        <div
          className="flex items-end gap-3 relative self-stretch w-full flex-[0_0_auto]"
          role="list"
          aria-label="Social media links"
        >
          {socialLinks.map((social, index) => (
            <a
              key={index}
              href={social.href}
              aria-label={social.name}
              className="hover:opacity-70 transition-opacity"
              role="listitem"
            >
              <img
                className={`relative ${social.width} ${social.height}`}
                alt={social.name}
                src={social.icon}
              />
            </a>
          ))}
        </div>
      </div>

      <p className="absolute top-[464px] left-[1050px] [font-family:'Lato',Helvetica] font-normal text-[#00000080] text-base tracking-[0] leading-[normal] whitespace-nowrap">
        Trusted Seller Certifications by SSL Secure
      </p>

      <hr
        className="absolute top-[448px] left-[calc(50.00%_-_720px)] w-[1440px] h-px border-0 bg-[url('https://c.animaapp.com/QpBFwAMQ/img/vector-9.svg')]"
        aria-hidden="true"
      />

      <p className="absolute top-[464px] left-[82px] [font-family:'Lato',Helvetica] font-normal text-[#00000080] text-base tracking-[0] leading-[normal] whitespace-nowrap">
        © 2025 Dealport. All rights reserved
      </p>

      <div className="flex flex-col w-[396px] items-start justify-center gap-4 absolute top-[345px] left-[calc(50.00%_-_198px)]">
        <div className="flex items-center justify-center gap-2.5 relative self-stretch w-full flex-[0_0_auto]">
          <h2 className="relative flex-1 mt-[-1.00px] [font-family:'Lato',Helvetica] font-medium text-[#4ea674] text-base text-center tracking-[0] leading-[normal]">
            Newsletter Signup
          </h2>
        </div>

        <form
          className="flex h-12 items-center gap-1.5 p-1.5 relative self-stretch w-full bg-[#c1e6ba] rounded-[200px]"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="flex items-center gap-2.5 px-6 py-2.5 relative flex-1 self-stretch grow rounded-[200px]">
            <label htmlFor="newsletter-email" className="sr-only">
              Enter your email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              placeholder="Enter your email address"
              className="mt-[-2.50px] mb-[-0.50px] font-normal text-[#00000099] tracking-[0.08px] relative w-full [font-family:'Lato',Helvetica] text-base leading-[normal] bg-transparent border-0 outline-none focus:text-black placeholder:text-[#00000099]"
              aria-label="Email address for newsletter"
              required
            />
          </div>

          <button
            type="submit"
            className="flex w-[120px] items-center justify-center gap-2 px-[19px] py-6 relative self-stretch bg-white rounded-[200px] hover:bg-gray-50 transition-colors cursor-pointer"
            aria-label="Subscribe to newsletter"
          >
            <span className="relative w-fit mt-[-16.50px] mb-[-14.50px] [font-family:'Lato',Helvetica] font-medium text-black text-base tracking-[0.08px] leading-[normal] whitespace-nowrap">
              Subscribe
            </span>
          </button>
        </form>
      </div>
    </footer>
  );
};
