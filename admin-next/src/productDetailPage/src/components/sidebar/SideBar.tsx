
const relatedProducts = [
    { id: 1, title: "A Kids Book About Yoga", price: 4.53, originalPrice: 5.0 },
    { id: 2, title: "A Kids Book About Yoga", price: 4.53, originalPrice: 5.0 },
    { id: 3, title: "A Kids Book About Yoga", price: 4.53, originalPrice: 5.0 },
    { id: 4, title: "A Kids Book About Yoga", price: 4.53, originalPrice: 5.0 },
    { id: 5, title: "A Kids Book About Yoga", price: 4.53, originalPrice: 5.0 },
    { id: 6, title: "A Kids Book About Yoga", price: 4.53, originalPrice: 5.0 },
];

export default function SideBar({ p }: { p: (typeof relatedProducts)[0] }) {
    return (
        <>
            <div className="flex gap-3 bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-pink-100 rounded-xl flex-shrink-0 relative overflow-hidden">
                    <span className="absolute top-0 left-0 bg-red-500 text-white text-[8px] font-bold px-1">SALE</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 leading-tight line-clamp-2 mb-0.5">{p.title}</p>
                    <p className="text-[10px] text-gray-400 mb-1 line-clamp-1">Yoga is a way to discover ourselves…</p>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                            <span className="text-sm font-bold text-gray-900">${p.price}</span>
                            <span className="text-[10px] text-gray-400 line-through">${p.originalPrice}</span>
                        </div>
                        <span className="text-[10px] text-sky-500 font-semibold">Get 10 Coins</span>
                    </div>
                </div>
            </div>
        </>
    )
}
