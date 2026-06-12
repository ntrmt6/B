import React from 'react';
import { Search, Edit, Copy, Eye, Trash2 } from 'lucide-react';
import { Product, ProductCourierStatus } from './types';
import { normalizeImageUrl, getCourierBadgeClassName } from './utils';
import { DotsIcon } from './icons';

interface ProductGridLargeProps {
  products: Product[];
  selectedIds: Set<string>;
  openDropdownId: string | null;
  storeBaseUrl: string;
  courierStatuses?: Record<number, ProductCourierStatus>;
  getProductKey: (product: Product, idx: number) => string;
  onSelectProduct: (key: string) => void;
  onSetDropdownId: (id: string | null) => void;
  onEditProduct?: (product: Product) => void;
  onCloneProduct?: (product: Product) => void;
  onDeleteProduct?: (id: number) => void;
}

const ProductGridLarge: React.FC<ProductGridLargeProps> = ({
  products,
  selectedIds,
  openDropdownId,
  storeBaseUrl,
  courierStatuses = {},
  getProductKey,
  onSelectProduct,
  onSetDropdownId,
  onEditProduct,
  onCloneProduct,
  onDeleteProduct,
}) => (
  <div className="grid grid-cols-1 xxs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 xxs:gap-3 sm:gap-4">
    {products.length > 0 ? products.map((product, idx) => {
      const productKey = getProductKey(product, idx);
      return (
        <div key={productKey} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-2 xxs:p-3 sm:p-4 hover:shadow-lg transition-shadow relative group">
          {/* Checkbox */}
          <div className="absolute top-2 xxs:top-3 left-2 xxs:left-3 z-10">
            <input
              type="checkbox"
              checked={selectedIds.has(productKey)}
              onChange={() => onSelectProduct(productKey)}
              className="w-4 h-4 xxs:w-5 xxs:h-5 rounded border-gray-300"
            />
          </div>
          {/* Actions Dropdown */}
          <div className="absolute top-2 xxs:top-3 right-2 xxs:right-3 z-10" data-dropdown>
            <button
              onClick={() => onSetDropdownId(openDropdownId === productKey ? null : productKey)}
              className="p-1 xxs:p-1.5 bg-white/80 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition-colors"
            >
              <DotsIcon />
            </button>
            {openDropdownId === productKey && (
              <div className="absolute right-0 top-[calc(100%+4px)] z-[9999]">
                <div className="w-[140px] bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-600 overflow-hidden py-1">
                  <button
                    onClick={() => { onEditProduct?.(product); onSetDropdownId(null); }}
                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <Edit size={14} /> Edit
                  </button>
                  <button
                    onClick={() => { onCloneProduct?.(product); onSetDropdownId(null); }}
                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <Copy size={14} /> Duplicate
                  </button>
                  <button
                    onClick={() => { window.open(`${storeBaseUrl}/product-details/${product.slug || product.id}`, '_blank'); onSetDropdownId(null); }}
                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <Eye size={14} /> View
                  </button>
                  <button
                    onClick={() => { onDeleteProduct?.(product.id); onSetDropdownId(null); }}
                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-red-600"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            )}
          </div>
          {/* Image */}
          <div className="w-full aspect-square rounded-lg overflow-hidden bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] mb-3">
            {product.image ? (
              <img
                src={normalizeImageUrl(product.image)}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-xs xxs:text-sm">
                No Image
              </div>
            )}
          </div>
          {/* Info */}
          <h3 className="text-[11px] xxs:text-xs sm:text-[14px] font-medium text-gray-900 dark:text-white line-clamp-2 mb-1 sm:mb-2">{product.name}</h3>
          <p className="text-[11px] xxs:text-[13px] text-gray-500 dark:text-gray-400 mb-1 xxs:mb-2">{product.category || 'Uncategorized'}</p>
          <div className="flex items-end justify-between gap-2">
            <span className="text-[13px] xxs:text-[15px] font-bold text-[#1e90ff]">৳{product.price}</span>
            <div className="flex flex-col items-end gap-1">
              <span className={`px-1.5 xxs:px-2 py-0.5 rounded-full text-[9px] xxs:text-[11px] font-medium ${
                product.status === 'Active'
                  ? 'bg-[#c1ffbc] text-[#085e00]'
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {product.status === 'Active' ? 'Publish' : 'Draft'}
              </span>
              {courierStatuses[product.id] && (
                <span
                  title={`${courierStatuses[product.id].provider} | ${courierStatuses[product.id].trackingId}`}
                  className={`max-w-[120px] text-right px-2 py-0.5 rounded-full text-[10px] font-medium truncate ${getCourierBadgeClassName(courierStatuses[product.id].label)}`}
                >
                  {courierStatuses[product.id].provider}: {courierStatuses[product.id].label}
                </span>
              )}
            </div>
          </div>
          {product.sku && <p className="text-[10px] xxs:text-[11px] text-gray-400 dark:text-gray-500 mt-1 xxs:mt-2">SKU: {product.sku}</p>}
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

export default ProductGridLarge;
