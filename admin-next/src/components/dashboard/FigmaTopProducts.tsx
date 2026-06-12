import React from 'react';
import { normalizeImageUrl } from '../../utils/imageUrlHelper';

interface TopProduct {
  id: string;
  name: string;
  itemCode: string;
  price: number;
  image?: string;
}

interface FigmaTopProductsProps {
  products?: TopProduct[];
  onAllProductsClick?: () => void;
  onProductClick?: (productId: string) => void;
}

const FigmaTopProducts: React.FC<FigmaTopProductsProps> = ({
  products = [
    { id: '1', name: 'Apple iPhone 13', itemCode: '#FXZ-4567', price: 999.00 },
    { id: '2', name: 'Nike Air Jordan', itemCode: '#FXZ-4567', price: 72.40 },
    { id: '3', name: 'T-shirt', itemCode: '#FXZ-4567', price: 35.40 },
    { id: '4', name: 'Assorted Cross Bag', itemCode: '#FXZ-4567', price: 80.00 },
    // { id: '5', name: 'Fur Pom Gloves', itemCode: '#FXZ-4567', price: 20.00 }
  ],
  onAllProductsClick,
  onProductClick
}) => {
  return (
    <div className="w-full h-full px-2 xs:px-2.5 py-2 xs:py-2.5 bg-white dark:bg-gray-800 rounded-xl border border-zinc-200 dark:border-gray-700 flex flex-col justify-start items-start gap-1.5 xs:gap-2 overflow-hidden">
      {/* Header */}
      <div className="w-full flex flex-col justify-start items-start gap-2 xs:gap-3">
        <div className="w-full flex justify-start items-center gap-2 xs:gap-3">
          <div className="flex-1 justify-start text-zinc-800 dark:text-white text-sm sm:text-base font-bold font-family: Poppins, Helvetica, sans-serif">Top Products</div>
          {/* <button 
            onClick={onAllProductsClick}
            className="justify-start text-sky-400 text-xs font-normal font-family: Poppins, Helvetica, sans-serif cursor-pointer hover:underline bg-transparent border-none"
          >
            All product
          </button> */}
        </div>

        {/* Search Bar */}
        {/* <div className="w-full p-2 bg-neutral-50 dark:bg-gray-700 rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-200 dark:outline-gray-600 flex justify-start items-center gap-1 xs:gap-1.5 overflow-hidden">
          <div className="flex justify-start items-center gap-2 flex-1">
            <div className="w-4 h-4 sm:w-5 sm:h-5 relative">
              <svg width="100%" height="100%" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="9" cy="9" r="6" stroke="#71717A" strokeWidth="1.67"/>
                <path d="M14 14L17 17" stroke="#71717A" strokeWidth="1.67" strokeLinecap="round"/>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-neutral-700 dark:text-gray-200 text-xs sm:text-sm font-normal font-['Lato'] placeholder:text-neutral-500 dark:placeholder:text-gray-400"
            />
          </div>
        </div> */}
      </div>

      {/* Products List */}
      <div className="w-full flex-1 flex flex-col justify-start items-start gap-2 sm:gap-3 overflow-y-auto pr-1 sm:pr-2">
        {products.length === 0 ? (
          <div className="w-full py-8 text-center text-neutral-400 dark:text-gray-500 text-sm">No products found</div>
        ) : (
          products.map((product) => (
            <div 
              key={product.id} 
              className="w-full pr-1 sm:pr-2 pb-1.5 border-b border-neutral-300 dark:border-gray-600 flex justify-start items-center gap-2 sm:gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer rounded"
              onClick={() => onProductClick?.(product.id)}
            >
              {/* Product Image */}
              <div className="w-9 h-9 sm:w-12 sm:h-12 relative rounded-lg sm:rounded-xl overflow-hidden bg-zinc-100 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                {product.image ? (
                  <img className="w-full h-full object-cover" src={normalizeImageUrl(product.image)} alt={product.name} />
                ) : (
                  <span className="text-zinc-400 dark:text-gray-400 text-sm sm:text-lg font-medium">{product.name.charAt(0)}</span>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 flex flex-col justify-center items-start gap-0.5 sm:gap-1 overflow-hidden min-w-0">
                <div className="w-full truncate text-teal-950 dark:text-white text-xs sm:text-sm font-medium font-family: Poppins, Helvetica, sans-serif">{product.name}</div>
                <div className="text-neutral-400 dark:text-gray-500 text-[9px] sm:text-[11px] font-normal font-family: Poppins, Helvetica, sans-serif">Item: {product.itemCode}</div>
              </div>

              {/* Price */}
              <div className="text-right whitespace-nowrap text-teal-950 dark:text-white text-xs sm:text-sm font-bold font-family: Poppins, Helvetica, sans-serif leading-5">{product.price}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FigmaTopProducts;
