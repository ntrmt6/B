import React from 'react';
import { Search } from 'lucide-react';
import { Product, ProductCourierStatus } from './types';
import { normalizeImageUrl, getCourierBadgeClassName } from './utils';

interface ProductGridSmallProps {
  products: Product[];
  selectedIds: Set<string>;
  courierStatuses?: Record<number, ProductCourierStatus>;
  getProductKey: (product: Product, idx: number) => string;
  onSelectProduct: (key: string) => void;
  onEditProduct?: (product: Product) => void;
}

const ProductGridSmall: React.FC<ProductGridSmallProps> = ({
  products,
  selectedIds,
  courierStatuses = {},
  getProductKey,
  onSelectProduct,
  onEditProduct,
}) => (
  <div className="grid grid-cols-2 xxs:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2 xxs:gap-3">
    {products.length > 0 ? products.map((product, idx) => {
      const productKey = getProductKey(product, idx);
      return (
        <div key={productKey} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-1.5 xxs:p-2 hover:shadow-md transition-shadow relative group">
          {/* Checkbox */}
          <div className="absolute top-1 left-1 z-10">
            <input
              type="checkbox"
              checked={selectedIds.has(productKey)}
              onChange={() => onSelectProduct(productKey)}
              className="w-3 h-3 xxs:w-4 xxs:h-4 rounded border-gray-300"
            />
          </div>
          {/* Image */}
          <div
            className="w-full aspect-square rounded overflow-hidden bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] mb-1.5 xxs:mb-2 cursor-pointer"
            onClick={() => onEditProduct?.(product)}
          >
            {product.image ? (
              <img
                src={normalizeImageUrl(product.image)}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-[10px] xxs:text-xs">
                No Img
              </div>
            )}
          </div>
          {/* Info */}
          <h3 className="text-[10px] xxs:text-[11px] font-medium text-gray-900 dark:text-white line-clamp-1">{product.name}</h3>
          <div className="flex items-center justify-between mt-0.5 xxs:mt-1">
            <span className="text-[11px] xxs:text-[12px] font-bold text-[#1e90ff]">৳{product.price}</span>
            <span
              className={`w-1.5 h-1.5 xxs:w-2 xxs:h-2 rounded-full ${
                product.status === 'Active' ? 'bg-green-500' : 'bg-orange-400'
              }`}
              title={product.status === 'Active' ? 'Published' : 'Draft'}
            />
          </div>
          {courierStatuses[product.id] && (
            <p className={`mt-1 text-[9px] xxs:text-[10px] font-medium truncate ${getCourierBadgeClassName(courierStatuses[product.id].label).split(' border ')[0]}`}>
              {courierStatuses[product.id].provider}: {courierStatuses[product.id].label}
            </p>
          )}
        </div>
      );
    }) : (
      <div className="col-span-full py-8 xxs:py-12 text-center text-gray-500 dark:text-gray-400">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 xxs:w-16 xxs:h-16 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center mb-2 xxs:mb-3">
            <Search size={20} className="text-gray-400 dark:text-gray-500 xxs:w-6 xxs:h-6" />
          </div>
          <p className="font-medium text-sm xxs:text-base">No products found</p>
          <p className="text-xs xxs:text-sm">Try adjusting your search or filters</p>
        </div>
      </div>
    )}
  </div>
);

export default ProductGridSmall;
