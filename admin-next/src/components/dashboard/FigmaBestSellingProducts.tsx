import React from 'react';
import { normalizeImageUrl } from '../../utils/imageUrlHelper';

interface Product {
  id: string;
  name: string;
  image?: string;
  totalOrder: string;
  status: 'Stock' | 'Stock out';
  price: string;
}

interface FigmaBestSellingProductsProps {
  products?: Product[];
  onDetailsClick?: () => void;
  onProductClick?: (productId: string) => void;
}

const FigmaBestSellingProducts: React.FC<FigmaBestSellingProductsProps> = ({
  products = [
    { id: '1', name: 'Apple iPhone 13', totalOrder: '104', status: 'Stock', price: '999.00' },
    { id: '2', name: 'Nike Air Jordan', totalOrder: '56', status: 'Stock out', price: '999.00' },
    { id: '3', name: 'T-shirt', totalOrder: '266', status: 'Stock', price: '999.00' },
    { id: '4', name: 'Cross Bag', totalOrder: '506', status: 'Stock', price: '999.00' }
  ],
  onDetailsClick,
  onProductClick
}) => {
  return (
    <div className="w-full px-2 xs:px-2.5 sm:px-3 py-2 xs:py-2.5 sm:py-3 bg-white dark:bg-gray-800 rounded-xl border border-zinc-200 dark:border-gray-700 flex flex-col justify-start items-start gap-1.5 xs:gap-2 overflow-hidden">
      <div className="w-full flex flex-col justify-start items-end gap-2 xs:gap-3 sm:gap-4">
        {/* Header */}
        <div className="w-full h-8 flex justify-start items-center gap-2.5">
          <div className="justify-start text-zinc-800 dark:text-white text-sm sm:text-base font-bold font-family: Poppins, Helvetica, sans-serif">Best Selling Product</div>
        </div>

        {/* Table - No overflow on mobile */}
        <div className="w-full">
          <div className="w-full flex flex-col justify-start items-end gap-1.5 xs:gap-2">
          {/* Table Header */}
          <div className="self-stretch bg-blue-50 dark:bg-gray-700 rounded-lg border-b flex justify-start items-center">
            <div className="w-24 xs:w-32 sm:w-44 lg:w-60 self-stretch px-1.5 xs:px-2 sm:px-5 py-2 border-zinc-300 dark:border-gray-600 flex justify-start items-center gap-1">
              <div className="flex-1 justify-start text-neutral-500 dark:text-gray-400 text-[9px] xs:text-[10px] sm:text-xs font-medium font-['Public_Sans'] uppercase">Product</div>
            </div>
            <div className="flex-1 self-stretch pl-1.5 xs:pl-2 sm:pl-5 pr-1 sm:pr-2 py-2 border-zinc-300 dark:border-gray-600 flex justify-start items-center gap-1">
              <div className="flex-1 justify-start text-neutral-500 dark:text-gray-400 text-[9px] xs:text-[10px] sm:text-xs font-medium font-['Public_Sans'] uppercase">Orders</div>
            </div>
            <div className="flex-1 self-stretch px-1.5 xs:px-2 sm:px-5 py-2 border-zinc-300 dark:border-gray-600 flex justify-start items-center gap-1">
              <div className="flex-1 justify-start text-neutral-500 dark:text-gray-400 text-[9px] xs:text-[10px] sm:text-xs font-medium font-['Public_Sans'] uppercase">Status</div>
            </div>
            <div className="flex-1 px-1.5 xs:px-2 sm:px-5 py-2 border-zinc-300 dark:border-gray-600 flex justify-start items-center gap-1">
              <div className="flex-1 justify-start text-neutral-500 dark:text-gray-400 text-[9px] xs:text-[10px] sm:text-xs font-medium font-['Public_Sans'] uppercase">Price</div>
            </div>
          </div>

          {/* Table Rows */}
          <div className="self-stretch flex flex-col justify-start items-start gap-0.5 xs:gap-1">
            {products.map((product) => (
              <div 
                key={product.id} 
                className="self-stretch rounded-lg border-b flex justify-start items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer active:scale-[0.99]"
                onClick={() => onProductClick?.(product.id)}
              >
                {/* Product */}
                <div className="w-24 xs:w-32 sm:w-44 lg:w-60 self-stretch pr-1.5 xs:pr-2 sm:pr-5 pb-2 border-zinc-300 dark:border-gray-600 flex justify-start items-center gap-1.5 xs:gap-2 sm:gap-3">
                  <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-11 sm:h-11 relative rounded-md xs:rounded-lg sm:rounded-[9.86px] overflow-hidden bg-zinc-100 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                    {product.image ? (
                      <img className="w-full h-full object-cover" src={normalizeImageUrl(product.image)} alt={product.name} />
                    ) : (
                      <span className="text-zinc-400 dark:text-gray-400 text-[10px] xs:text-xs sm:text-sm font-medium">{product.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="w-full truncate text-teal-950 dark:text-white text-[10px] xs:text-xs sm:text-sm font-medium font-poppins">{product.name}</div>
                </div>

                {/* Total Order */}
                <div className="flex-1 self-stretch pl-1.5 xs:pl-2 sm:pl-5 pr-1 sm:pr-2 pb-2 border-zinc-300 dark:border-gray-600 flex justify-start items-center gap-1">
                  <div className="flex-1 justify-center text-zinc-800 dark:text-gray-300 text-xs sm:text-sm font-normal font-['Lato'] leading-5">{product.totalOrder}</div>
                </div>

                {/* Status */}
                <div className="flex-1 self-stretch px-1.5 xs:px-2 sm:px-5 pb-2 border-zinc-300 flex justify-start items-center gap-1">
                  <div className="flex-1 flex justify-start items-center gap-1 xs:gap-2">
                    <div className={`w-1.5 h-1.5 xs:w-2 xs:h-2 rounded-full ${product.status === 'Stock' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <div className={`flex-1 justify-center text-xs sm:text-sm font-normal font-['Public_Sans'] leading-5 ${product.status === 'Stock' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {product.status}
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="flex-1 self-stretch px-1.5 xs:px-2 sm:px-5 pb-2 border-zinc-300 dark:border-gray-600 flex justify-start items-center gap-1">
                  <div className="text-right justify-center text-teal-950 dark:text-white text-xs sm:text-sm font-bold font-['Lato'] leading-5">
                    {/* {product.price} */}
                  </div>
                </div>
              </div>
            ))}
          </div>
          </div>
        </div>

        {/* Details Button */}
        <button 
          onClick={onDetailsClick}
          className="w-20 sm:w-24 h-7 sm:h-8 px-2 sm:px-3 py-1 rounded-[50px] outline-offset-[-1px] outline-sky-400 inline-flex justify-center items-center gap-2.5 cursor-pointer hover:bg-sky-50 transition-colors"
        >
          <span className="justify-start text-sky-400 text-xs sm:text-sm font-normal font-['Lato'] leading-6"></span>
        </button>
      </div>
    </div>
  );
};

export default FigmaBestSellingProducts;
