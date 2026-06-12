interface FooterProps {
    logo?: string | null;
    websiteName?: string;
    addresses?: string[];
    footerQuickLinks?: Array<{ label: string; url: string }>;
    footerUsefulLinks?: Array<{ label: string; url: string }>;
    socialLinks?: Array<{ type: string; url: string }>;
}

export default function Footer({
    logo,
    websiteName,
    addresses = [],
    footerQuickLinks = [],
    footerUsefulLinks = [],
    socialLinks = [],
}: FooterProps) {
    const year = new Date().getFullYear();
    const address = addresses.length > 0 ? addresses[0] : "";

    // Get social link URL by type
    const getSocialUrl = (type: string) => {
        const link = socialLinks.find(s => s.type.toLowerCase() === type.toLowerCase());
        return link?.url || "#";
    };

    return (
        <footer
            className="w-full"
            style={{ fontFamily: "'Lato', sans-serif" }}
        >
            <div className="mx-auto max-w-[1720px] bg-white rounded-t-[112px] px-20 pt-14 pb-6 max-md:px-6 max-md:pt-10 max-md:rounded-t-[48px]">

                {/* DESKTOP layout */}
                <div className="hidden md:flex flex-row items-start justify-between gap-8">

                    <div className="flex flex-col gap-4 max-w-[220px]">
                        {logo ? (
                            <img src={logo} alt="Logo" className="h-12 max-w-[169px] object-contain" />
                        ) : websiteName ? (
                            <span className="text-xl font-bold text-[#112F63]">{websiteName}</span>
                        ) : null}
                        {address && (
                            <p className="text-[13px] font-inter text-black text-sm leading-[1.7] mt-1">
                                {address}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-row gap-20">
                        {/* VISIT */}
                        {address && (
                            <div className="flex flex-col gap-3">
                                <h4 className="text-[16px] font-semibold text-[#112F63] font-inter uppercase tracking-wider">
                                    VISIT
                                </h4>
                                <p className="text-[12px] text-black leading-[1.8] font-medium font-inter">
                                    {address}
                                </p>
                            </div>
                        )}

                        {/* QUICK LINK */}
                        {footerQuickLinks.length > 0 && (
                            <div className="flex flex-col gap-[20px]">
                                <h4 className="text-[16px] font-semibold text-[#112F63] font-inter uppercase tracking-wider">
                                    QUICK LINK
                                </h4>
                                <ul className="flex flex-col gap-2">
                                    {footerQuickLinks.map((item) => (
                                        <li key={item.label}>
                                            <a href={item.url || "#"} className="text-[12px] text-black leading-[1.8] font-medium font-inter">
                                                {item.label}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* USEFUL LINK */}
                        {footerUsefulLinks.length > 0 && (
                            <div className="flex flex-col gap-[20px]">
                                <h4 className="text-[16px] font-semibold text-[#112F63] font-inter uppercase tracking-wider">
                                    USEFUL LINK
                                </h4>
                                <ul className="flex flex-col gap-2">
                                    {footerUsefulLinks.map((item) => (
                                        <li key={item.label}>
                                            <a href={item.url || "#"} className="text-[12px] text-black leading-[1.8] font-medium font-inter">
                                                {item.label}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* LEGAL */}
                        <div className="flex flex-col gap-[20px]">
                            <h4 className="text-[16px] font-semibold text-[#112F63] font-inter uppercase tracking-wider">
                                LEGAL
                            </h4>
                            <ul className="flex flex-col gap-2">
                                {["Terms & Condition", "Privacy Policy", "Return Policy"].map((item) => (
                                    <li key={item}>
                                        <a href="#" className="text-[12px] text-black leading-[1.8] font-medium font-inter">
                                            {item}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* MOBILE layout */}
                <div className="flex md:hidden flex-col items-center gap-4 pb-28">
                    {logo ? (
                        <img src={logo} alt="Logo" className="h-10 max-w-[140px] object-contain" />
                    ) : websiteName ? (
                        <span className="text-lg font-bold text-[#112F63]">{websiteName}</span>
                    ) : null}
                    <p className="text-sm font-inter font-medium text-[#635C5C] text-center">
                        {websiteName || "Store"} &copy; {year}. All rights reserved.
                    </p>
                    <div className="flex flex-row items-center gap-6 mt-1">
                        {socialLinks.length > 0 ? socialLinks.map((social, i) => (
                            <a key={i} href={social.url || "#"} aria-label={social.type} className="text-[#153060]">
                                <span className="text-sm font-medium">{social.type}</span>
                            </a>
                        )) : (
                            <>
                                <a href={getSocialUrl("youtube")} aria-label="YouTube">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <path d="M10 15L15.19 12L10 9V15ZM21.56 7.17C21.69 7.64 21.78 8.27 21.84 9.07C21.91 9.87 21.94 10.56 21.94 11.16L22 12C22 14.19 21.84 15.8 21.56 16.83C21.31 17.73 20.73 18.31 19.83 18.56C19.36 18.69 18.5 18.78 17.18 18.84C15.88 18.91 14.69 18.94 13.59 18.94L12 19C7.81 19 5.2 18.84 4.17 18.56C3.27 18.31 2.69 17.73 2.44 16.83C2.31 16.36 2.22 15.73 2.16 14.93C2.09 14.13 2.06 13.44 2.06 12.84L2 12C2 9.81 2.16 8.2 2.44 7.17C2.69 6.27 3.27 5.69 4.17 5.44C4.64 5.31 5.5 5.22 6.82 5.16C8.12 5.09 9.31 5.06 10.41 5.06L12 5C16.19 5 18.8 5.16 19.83 5.44C20.73 5.69 21.31 6.27 21.56 7.17Z" fill="#153060" />
                                    </svg>
                                </a>
                                <a href={getSocialUrl("facebook")} aria-label="Facebook">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <path d="M9.198 21.5H13.198V13.49H16.802L17.198 9.51H13.198V7.5C13.198 7.23478 13.3034 6.98043 13.4909 6.79289C13.6784 6.60536 13.9328 6.5 14.198 6.5H17.198V2.5H14.198C12.8719 2.5 11.6002 3.02678 10.6625 3.96447C9.72479 4.90215 9.198 6.17392 9.198 7.5V9.51H7.198L6.802 13.49H9.198V21.5Z" fill="#153060" />
                                    </svg>
                                </a>
                            </>
                        )}
                    </div>
                </div>

                {/* Desktop Copyright */}
                <p className="hidden md:block text-[12px] font-inter font-medium text-black mt-6">
                    &copy;{year} {websiteName || "Store"}, All right reserved.
                </p>
            </div>
        </footer>
    );
}
