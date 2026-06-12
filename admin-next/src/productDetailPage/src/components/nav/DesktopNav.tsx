
interface DesktopNavProps {
    logo?: string;
    onBack?: () => void;
    cart?: number[];
    onToggleCart?: (id: number) => void;
}

export default function DesktopNav({ logo, onBack, cart }: DesktopNavProps) {
    return (
        <nav className="hidden lg:block bg-white sticky top-0 z-40 border-b border-[#F1F5FF] overflow-x-hidden">
            <div className="max-w-[1720px] mx-auto w-full flex items-center justify-between px-6 py-4">

                {/* Logo */}
                <a href="/" onClick={(e) => { if (onBack) { e.preventDefault(); onBack(); } }} className="flex-shrink-0">
                    {logo ? (
                        <img src={logo} alt="Logo" className="h-[44px] w-auto max-w-[180px] object-contain" />
                    ) : (
                        <span className="text-xl font-bold text-gray-800">Store</span>
                    )}
                </a>

                {/* Middle Section */}
                <div className="flex items-center justify-center flex-1 mx-10 min-w-0">

                    {/* Camera Icon */}
                    <div className="bg-[#F1F5FF] p-2 rounded-lg flex-shrink-0">
                        <img src="https://details-snit.vercel.app/images/cameraIcon.svg" alt="Camera" width={32} height={32} />
                    </div>

                    {/* Search Box */}
                    <div className="flex items-center gap-2 bg-[#F1F5FF] rounded-xl pl-3 py-2 relative ml-6 w-full max-w-[671px] min-w-0">

                        <img src="https://details-snit.vercel.app/images/mic-02.svg" alt="Mic" width={32} height={32} className="flex-shrink-0" />

                        <input
                            className="flex-1 bg-transparent outline-none text-[16px] font-normal placeholder-[#6A717F] min-w-0"
                            placeholder="Search products..."
                        />

                        <button className="
                            absolute right-0 top-0 bottom-0
                            px-6 rounded-r-xl
                            bg-gradient-to-r from-[#38BDF8] to-[#1E90FF]
                            bg-[length:200%_200%] bg-left
                            hover:bg-right
                            transition-all duration-500 ease-in-out
                            text-white font-semibold text-[16px]
                        ">
                            Search
                        </button>
                    </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-8 flex-shrink-0">
                    <div className="relative cursor-pointer">
                        <img src="https://details-snit.vercel.app/images/shopping-cart-02.svg" alt="Cart" width={32} height={32} />
                        {cart && cart.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                {cart.length}
                            </span>
                        )}
                    </div>

                    <button className="flex items-center gap-2">
                        <img src="https://details-snit.vercel.app/images/user-circle.svg" alt="User" width={32} height={32} />
                        <span className="text-[16px] font-medium text-black">
                            Sign in
                        </span>
                    </button>
                </div>

            </div>
        </nav>
    )
}
