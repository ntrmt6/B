import React from 'react';
import { Star } from 'lucide-react';

interface TopProductsListProps {
  products: any[];
}

const TopProductsList: React.FC<TopProductsListProps> = ({ products }) => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Top Product</h3>
      <div className="space-y-4">
        {products.map((product, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-50 overflow-hidden flex-shrink-0 border border-gray-100">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-gray-900 truncate">{product.name}</h4>
              <div className="flex items-center gap-1 mt-0.5">
                <Star size={12} className="fill-amber-400 text-amber-400" />
                <span className="text-xs font-bold text-gray-900">{product.rating}</span>
                <span className="text-xs text-gray-400">({product.reviews} reviews)</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">৳{product.price}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{product.sales} Sales</p>
            </div>
          </div>
        ))}
      </div>
      <button className="w-full mt-6 py-2 rounded-xl border border-gray-100 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
        View All Products
      </button>
    </div>
  );
};

export default TopProductsList;
