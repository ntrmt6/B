
import { StarIcon } from '../details/Icons'
const relatedProducts = [
    { id: 1, title: "A Kids Book About Yoga", price: 4.53, originalPrice: 5.0 },
    { id: 2, title: "A Kids Book About Yoga", price: 4.53, originalPrice: 5.0 },
    { id: 3, title: "A Kids Book About Yoga", price: 4.53, originalPrice: 5.0 },
    { id: 4, title: "A Kids Book About Yoga", price: 4.53, originalPrice: 5.0 },
    { id: 5, title: "A Kids Book About Yoga", price: 4.53, originalPrice: 5.0 },
    { id: 6, title: "A Kids Book About Yoga", price: 4.53, originalPrice: 5.0 },
];
export default function ProductCard({ p }: { p: (typeof relatedProducts)[0] }) {
    return (
        <>
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-br from-orange-100 to-pink-100 h-32 flex items-center justify-center text-xs text-gray-400 font-medium relative">
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">SALE</span>
                    Image
                </div>
                <div className="p-3">
                    <p className="text-xs font-semibold text-gray-800 leading-tight line-clamp-2 mb-1">{p.title}</p>
                    <div className="flex items-center gap-0.5 mb-1">
                        {[1, 2, 3, 4, 5].map((i) => <StarIcon key={i} filled={i <= 4} />)}
                        <span className="text-xs text-gray-400 ml-1">100+ Sold</span>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                        <span className="text-sm font-bold text-gray-900">${p.price}</span>
                        <span className="text-xs text-gray-400 line-through">${p.originalPrice}</span>
                    </div>
                    <div className="flex gap-1">
                        <button className="flex-1 bg-orange-50 text-orange-600 border border-orange-200 text-xs py-1.5 rounded-lg font-semibold hover:bg-orange-100 transition-colors">🛒 Cart</button>
                        <button className="flex-1 bg-sky-500 text-white text-xs py-1.5 rounded-lg font-semibold hover:bg-sky-600 transition-colors">Buy Now</button>
                    </div>
                </div>
            </div>
        </>
    )
}
