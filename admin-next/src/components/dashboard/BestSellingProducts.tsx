import React from 'react';
import { Filter } from 'lucide-react';
import ProductImage from './ProductImage';
import { BestSellingProductsProps } from './types';

const BestSellingProducts: React.FC<BestSellingProductsProps> = ({
  bestSellingProducts,
  products
}) => {
  const displayProducts = bestSellingProducts.length > 0 
    ? bestSellingProducts 
    : products.slice(0, 4).map(p => ({ 
        product: p, 
        orders: Math.floor(Math.random() * 500) + 50, 
        revenue: p.price || 0 
      }));

  return (
    <div className="lg:col-span-2 min-h-[20rem] bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-lg hover:shadow-slate-500/10 transition-all overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-2 p-3 sm:p-4 border-b border-slate-50">
        <div className="text-slate-900 text-base sm:text-lg font-bold">
          Best Selling Products
        </div>
        <div className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex justify-center items-center gap-2 cursor-pointer hover:shadow-md hover:shadow-blue-500/30 transition-all">
          <span className="text-white text-sm font-medium">
            Filter
          </span>
          <Filter className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* Table - Responsive */}
      <div className="flex-1 overflow-x-auto">
        {/* Table Header */}
        <div className="bg-slate-50 flex items-center min-w-[500px] px-3 py-2">
          <div className="w-32 sm:w-40 md:w-48 flex-shrink-0 text-slate-500 text-xs font-medium uppercase">
            Product
          </div>
          <div className="flex-1 text-center text-slate-500 text-xs font-medium uppercase">
            Total Order
          </div>
          <div className="flex-1 text-center text-slate-500 text-xs font-medium uppercase hidden xs:block">
            Status
          </div>
          <div className="w-20 sm:w-24 flex-shrink-0 text-right text-slate-500 text-xs font-medium uppercase">
            Price
          </div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-y-auto min-w-[500px]">
          {displayProducts.map((item, index) => (
            <div key={item.product.id} className="flex items-center px-3 py-2 border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
              <div className="w-32 sm:w-40 md:w-48 flex-shrink-0 flex items-center gap-1.5">
                <ProductImage
                  src={item.product.image}
                  alt={item.product.name}
                  size="sm"
                />
                <div className="flex-1 text-slate-900 text-xs sm:text-sm font-bold truncate">
                  {item.product.name}
                </div>
              </div>
              <div className="flex-1 text-center text-slate-700 text-xs sm:text-sm font-medium">
                {item.orders}
              </div>
              <div className="flex-1 hidden xs:flex items-center justify-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${(item.product.stock || 0) > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className={`text-xs sm:text-sm font-medium ${(item.product.stock || 0) > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {(item.product.stock || 0) > 0 ? 'Stock' : 'Stock out'}
                </span>
              </div>
              <div className="w-20 sm:w-24 flex-shrink-0 text-right text-slate-900 text-xs sm:text-sm font-bold">
                ${(item.product.price || 999).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end p-3 border-t border-slate-50">
        <button className="px-3 py-1.5 rounded-lg border border-blue-500 text-blue-500 text-xs sm:text-sm font-medium hover:bg-blue-50 transition-colors">
          Details
        </button>
      </div>
    </div>
  );
};

export default BestSellingProducts;
