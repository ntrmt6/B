import React, { useMemo } from 'react';
import { ArrowLeft, Package, Store, Image as ImageIcon } from 'lucide-react';
import type { Vendor, Product } from '../../../types';

interface VendorProductTableProps {
  vendor: Vendor;
  products: Product[];
  allProducts: Product[];
  onBack: () => void;
}

const VendorProductTable: React.FC<VendorProductTableProps> = ({ vendor, products, onBack }) => {
  const stats = useMemo(() => ({
    total: products.length,
    active: products.filter(p => p.status === 'Active').length,
    totalValue: products.reduce((s, p) => s + (p.price || 0), 0),
    totalStock: products.reduce((s, p) => s + (p.stock || 0), 0),
  }), [products]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {vendor.logo ? (
            <img src={vendor.logo} alt="" className="w-8 h-8 rounded object-cover border border-slate-200" />
          ) : (
            <div className="w-8 h-8 rounded bg-[#FF8C00]/10 flex items-center justify-center flex-shrink-0">
              <Store className="w-4 h-4 text-[#FF8C00]" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-slate-800 dark:text-white truncate">{vendor.name}</h1>
            <p className="text-xs text-slate-400">Products · {vendor.commissionRate}% commission</p>
          </div>
        </div>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Products', value: stats.total },
          { label: 'Active', value: stats.active },
          { label: 'Total Stock', value: stats.totalStock },
          { label: 'Avg Price', value: `৳${stats.total > 0 ? Math.round(stats.totalValue / stats.total) : 0}` },
        ].map(({ label, value }) => (
          <div key={label} className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Product table — flat borders, tight layout */}
      <div className="border border-slate-200 dark:border-slate-700 rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <th className="text-left px-3 py-2 font-medium text-slate-500 dark:text-slate-400">Product</th>
              <th className="text-left px-3 py-2 font-medium text-slate-500 dark:text-slate-400 hidden md:table-cell">SKU</th>
              <th className="text-right px-3 py-2 font-medium text-slate-500 dark:text-slate-400">Price</th>
              <th className="text-center px-3 py-2 font-medium text-slate-500 dark:text-slate-400 hidden sm:table-cell">Stock</th>
              <th className="text-center px-3 py-2 font-medium text-slate-500 dark:text-slate-400">Status</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-slate-400">
                  <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p>No products assigned to this vendor yet.</p>
                </td>
              </tr>
            ) : products.map((product) => (
              <tr key={product.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {product.image ? (
                      <img src={product.image} alt="" className="w-8 h-8 rounded object-cover border border-slate-200 flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{product.name}</p>
                      {product.category && (
                        <p className="text-xs text-slate-400 truncate">{product.category}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 text-slate-500 dark:text-slate-400 hidden md:table-cell">
                  <span className="text-xs font-mono">{product.sku || '—'}</span>
                </td>
                <td className="px-3 py-2 text-right">
                  <span className="text-sm font-medium text-slate-800 dark:text-white">৳{(product.price || 0).toLocaleString()}</span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-xs text-slate-400 line-through ml-1">৳{product.originalPrice.toLocaleString()}</span>
                  )}
                </td>
                <td className="px-3 py-2 text-center hidden sm:table-cell">
                  <span className={`text-sm font-medium ${(product.stock ?? 0) <= 5 ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>
                    {product.stock ?? 0}
                  </span>
                </td>
                <td className="px-3 py-2 text-center">
                  <span className={`px-2 py-0.5 text-xs font-medium border rounded ${
                    product.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                    {product.status || 'Draft'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary footer */}
      {products.length > 0 && (
        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-500 dark:text-slate-400">
          <span>{products.length} product{products.length !== 1 ? 's' : ''}</span>
          <span>Commission rate: {vendor.commissionRate}% · Est. vendor payout: ৳{Math.round(stats.totalValue * (100 - vendor.commissionRate) / 100).toLocaleString()}</span>
        </div>
      )}
    </div>
  );
};

export default VendorProductTable;
