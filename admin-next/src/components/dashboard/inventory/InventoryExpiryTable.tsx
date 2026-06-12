import React from 'react';
import { Package } from 'lucide-react';
import { Product } from '../../../types';
import InventoryStatusBadge from './InventoryStatusBadge';

interface ExpiryProduct extends Product {
  expireDays: number;
}

interface InventoryExpiryTableProps {
  expiryProducts: ExpiryProduct[];
}

const InventoryExpiryTable: React.FC<InventoryExpiryTableProps> = ({ expiryProducts }) => {
  return (
    <div>
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="bg-[#E0F2FE]">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-black text-[16px]">Product</th>
              <th className="px-4 py-3 text-center font-medium text-black text-[16px]">Category</th>
              <th className="px-4 py-3 text-center font-medium text-black text-[16px]">Expire in</th>
              <th className="px-4 py-3 text-center font-medium text-black text-[16px]">Stock</th>
              <th className="px-4 py-3 text-center font-medium text-black text-[16px]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#b9b9b9]/50">
            {expiryProducts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  <Package size={40} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No products with expiry dates</p>
                </td>
              </tr>
            ) : expiryProducts.map((product, idx) => (
              <tr key={`expiry-${product.id}-${idx}`} className="h-[68px] hover:bg-gray-50 transition-colors border-b border-[#b9b9b9]/50">
                <td className="px-4 py-3 text-[12px] text-[#1d1a1a] max-w-[263px]"><p className="line-clamp-2">{product.name}</p></td>
                <td className="px-4 py-3 text-[12px] text-[#1d1a1a] text-center">{product.category || 'Uncategorized'}</td>
                <td className="px-4 py-3 text-[12px] text-[#1d1a1a] text-center">{product.expireDays} Days</td>
                <td className="px-4 py-3 text-[12px] text-[#1d1a1a] text-center">{product.stock || 0}</td>
                <td className="px-4 py-3 text-center"><InventoryStatusBadge product={product} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryExpiryTable;
