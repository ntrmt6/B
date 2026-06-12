import React from 'react';
import { Package, Search } from 'lucide-react';
import ProductImage from './ProductImage';
import { TopProductsProps } from './types';

const TopProducts: React.FC<TopProductsProps> = ({ products }) => {
  const topProducts = products.slice(0, 5);

  return (
    <div className="min-h-[20rem] md:min-h-[18rem] lg:min-h-[20rem] bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-lg hover:shadow-slate-500/10 transition-all flex flex-col overflow-hidden">
      {/* Header & Search */}
      <div className="p-3 sm:p-4 border-b border-slate-50">
        <div className="flex justify-between items-center mb-2.5">
          <div className="text-slate-900 text-base sm:text-lg font-bold">
            Top Products
          </div>
          <div className="text-blue-500 text-xs sm:text-sm font-medium cursor-pointer hover:text-blue-600 transition-colors">
            All products
          </div>
        </div>
        <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-1.5 hover:border-blue-300 transition-colors">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span className="text-slate-400 text-xs sm:text-sm font-medium">
            Search
          </span>
        </div>
      </div>

      {/* Product List */}
      <div className="flex-1 overflow-y-autop-3 sm:p-4 pt-2 space-y-2">
        {topProducts.map((product, index) => (
          <div key={product.id} className="flex items-center gap-2 pb-2 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors rounded-lg p-1.5 -mx-1.5">
            <ProductImage
              src={product.image}
              alt={product.name}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <div className="text-slate-900 text-xs sm:text-sm font-bold truncate">
                {product.name}
              </div>
              <div className="text-slate-400 text-[10px] sm:text-xs font-medium">
                Item: #FXZ-{4567 + index}
              </div>
            </div>
            <div className="text-slate-900 text-xs sm:text-sm font-black flex-shrink-0">
              ${(product.price || 99).toFixed(2)}
            </div>
          </div>
        ))}

        {topProducts.length === 0 && (
          <div className="py-6 text-center">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs sm:text-sm text-slate-500">No products yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopProducts;
