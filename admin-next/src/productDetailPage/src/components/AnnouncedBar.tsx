

interface AnnouncedBarProps {
    text?: string;
    onHomeClick: () => void;
    onCategoryClick?: () => void;
}
export default function AnnouncedBar({ text, onHomeClick }: AnnouncedBarProps) {
    const displayText = text || "Categories";

    const handleCategoryClick = () => {
        console.log("Redirecting to all products...");

        // This triggers a full browser page reload to the new URL
        window.location.href = "/all-products";
    };
    return (
        <div className="max-w-[1720px] mx-auto w-full">
            <div className="flex items-center w-full">

                {/* Mobile Notice */}
                {displayText && (
                    <div className="flex lg:hidden bg-sky-500 text-white text-center py-2 text-xs font-medium px-4 w-full">
                        {displayText}
                    </div>
                )}

                {/* Desktop content*/}
                <div className="hidden lg:flex w-full">
                    <div className="flex items-center gap-5 px-8 py-3.5 bg-white border-b border-gray-100 text-sm basis-[40%]">

                        <button onClick={onHomeClick} className="flex items-center gap-1 font-poppins font-medium cursor-pointer text-gray-900">
                            <img src="https://details-snit.vercel.app/images/home-09.svg" alt="Home" width={24} height={24} />
                            Home
                        </button>

                        <button onClick={handleCategoryClick} className="flex items-center gap-1 font-poppins font-medium cursor-pointer text-gray-900">
                            <img src="https://details-snit.vercel.app/images/category-management.svg" alt="Categories" width={24} height={24} />
                            Categories
                        </button>

                        <button className="flex items-center gap-1 font-poppins font-medium cursor-pointer">
                            <img src="https://details-snit.vercel.app/images/fire.svg" alt="Flash Sale" width={24} height={24} />
                            <span className="bg-gradient-to-b from-[#FF6A00] to-[#FF9F1C] bg-clip-text text-transparent">
                                Flash Sale
                            </span>
                        </button>

                    </div>
                    {displayText && (
                        <div className="flex items-center justify-center text-black text-[16px] basis-[50%]">
                            {displayText}
                        </div>
                    )}
                </div>

            </div>
        </div>
    )
}
