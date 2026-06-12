interface MobileNavProps {
    logo?: string;
    onBack?: () => void;
    cart?: number[];
    onToggleCart?: (id: number) => void;
}

export default function MobileNav({ logo, onBack, cart }: MobileNavProps) {
    return (
        <div>
            <nav className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-40">
                <img src="https://details-snit.vercel.app/images/menu-01.svg" alt="Menu" width={24} height={24} className='cursor-pointer' />
                <div className="flex items-center gap-1.5">
                    <a href='/' onClick={(e) => { if (onBack) { e.preventDefault(); onBack(); } }}>
                        {logo ? (
                            <img src={logo} alt="Logo" className="h-[36px] w-auto max-w-[140px] object-contain" />
                        ) : (
                            <span className="text-lg font-bold text-gray-800">Store</span>
                        )}
                    </a>
                </div>
                <div className="flex items-center gap-3 sm:gap-5">
                    <img src="https://details-snit.vercel.app/images/search-01.svg" alt="Search" width={24} height={24} className='cursor-pointer' />
                    <div className="relative cursor-pointer">
                        <img src="https://details-snit.vercel.app/images/shopping-cart-02.svg" alt="Cart" width={24} height={24} />
                        {cart && cart.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                                {cart.length}
                            </span>
                        )}
                    </div>
                    <img src="https://details-snit.vercel.app/images/notification-02.svg" alt="Notifications" width={24} height={24} className='cursor-pointer' />
                </div>
            </nav>
        </div>
    )
}
