import React from 'react';
import { Package } from 'lucide-react';
import { Product } from '../../../types';
import { normalizeImageUrl } from '../../../utils/imageUrlHelper';
import InventoryStatusBadge from './InventoryStatusBadge';

export type StockDisplayLimit = 10 | 20 | 50 | 'all';

interface InventoryLowStockTableProps {
  lowStockProducts: Product[];
  displayedLowStockProducts: Product[];
  stockDisplayLimit: StockDisplayLimit;
  onDisplayLimitChange: (value: StockDisplayLimit) => void;
  onRowClick: (product: Product) => void;
}

const InventoryLowStockTable: React.FC<InventoryLowStockTableProps> = ({
  lowStockProducts,
  displayedLowStockProducts,
  stockDisplayLimit,
  onDisplayLimitChange,
  onRowClick,
}) => {
  return (
    <div className="mb-6">
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="bg-[#E0F2FE]">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-black text-[16px]">Product</th>
              <th className="px-4 py-3 text-center font-medium text-black text-[16px]">Category</th>
              <th className="px-4 py-3 text-center font-medium text-black text-[16px]">Price</th>
              <th className="px-4 py-3 text-center font-medium text-black text-[16px]">Stock</th>
              <th className="px-4 py-3 text-center font-medium text-black text-[16px]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#b9b9b9]/50">
            {displayedLowStockProducts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <Package size={40} className="text-gray-300 mb-3" />
                    <p>No low stock products found</p>
                  </div>
                </td>
              </tr>
            ) : (
              displayedLowStockProducts.map((product, idx) => (
                <tr
                  key={`stock-${product.id}-${idx}`}
                  className="h-[68px] hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => onRowClick(product)}
                >
                  <td className="px-4 py-3 text-[12px] text-[#1d1a1a] max-w-[263px]"><p className="line-clamp-2">{product.name}</p></td>
                  <td className="px-4 py-3 text-[12px] text-[#1d1a1a] text-center">{product.category || 'Uncategorized'}</td>
                  <td className="px-4 py-3 text-[12px] text-[#1d1a1a] text-center">{product.price || 0}</td>
                  <td className="px-4 py-3 text-[12px] text-[#1d1a1a] text-center">{product.stock || 0}</td>
                  <td className="px-4 py-3 text-center"><InventoryStatusBadge product={product} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between mt-3 px-1">
          <p className="text-[12px] text-[#7b7b7b]">Showing {displayedLowStockProducts.length} of {lowStockProducts.length} low stock products</p>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-[#7b7b7b]">Show</span>
            {[10, 20, 50, 'all'].map((option) => (
              <button
                key={String(option)}
                onClick={() => onDisplayLimitChange(option as StockDisplayLimit)}
                className={`h-8 px-3 rounded-md text-[12px] border transition-colors ${
                  stockDisplayLimit === option
                    ? 'bg-[#0ea5e9] text-white border-[#0ea5e9]'
                    : 'bg-white text-[#4b5563] border-[#d1d5db] hover:bg-gray-50'
                }`}
              >
                {option === 'all' ? 'All' : option}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="block sm:hidden space-y-2">
        {displayedLowStockProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No low stock products found</p>
          </div>
        ) : (
          displayedLowStockProducts.map((product, idx) => (
            <button
              type="button"
              key={`stock-mobile-${product.id}-${idx}`}
              className="w-full text-left bg-white border border-gray-200 rounded-lg p-3"
              onClick={() => onRowClick(product)}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {(product as any).images && (product as any).images[0] ? (
                  <img src={normalizeImageUrl((product as any).images[0])} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Package size={16} className="text-gray-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">৳{product.price || 0} • Stock: {product.stock || 0}</p>
                  <span className="inline-block mt-1"><InventoryStatusBadge product={product} /></span>
                </div>
              </div>
            </button>
          ))
        )}

        <div className="pt-1">
          <div className="grid grid-cols-4 gap-2">
            {[10, 20, 50, 'all'].map((option) => (
              <button
                key={`mobile-${String(option)}`}
                onClick={() => onDisplayLimitChange(option as StockDisplayLimit)}
                className={`h-8 rounded-md text-[12px] border ${
                  stockDisplayLimit === option
                    ? 'bg-[#023337] text-white border-[#023337]'
                    : 'bg-white text-[#4b5563] border-[#d1d5db]'
                }`}
              >
                {option === 'all' ? 'All' : option}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryLowStockTable;
