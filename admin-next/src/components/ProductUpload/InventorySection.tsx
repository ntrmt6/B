import React from 'react';
import { Package, AlertCircle } from 'lucide-react';

interface InventorySectionProps {
  data: any;
  onChange: (data: any) => void;
}

const InventorySection: React.FC<InventorySectionProps> = ({ data, onChange }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
      <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Inventory</h2>

      <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
        {/* Quantity */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Product Quantity
          </label>
          <div className="flex items-center gap-2">
            <Package size={18} className="text-gray-400 flex-shrink-0" />
            <input
              type="number"
              value={data.quantity || ''}
              onChange={(e) => onChange({ quantity: parseInt(e.target.value) || 0 })}
              placeholder="0"
              className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
            />
          </div>
        </div>

        {/* Quantity Alert */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            <div className="flex items-center gap-1">
              <AlertCircle size={14} />
              Quantity Alert
            </div>
          </label>
          <input
            type="number"
            value={data.quantityAlert || ''}
            onChange={(e) => onChange({ quantityAlert: parseInt(e.target.value) || 0 })}
            placeholder="0"
            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
          />
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Alert when stock drops below</p>
        </div>

        {/* Unit Name */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Unit Name
          </label>
          <input
            type="text"
            value={data.unitName}
            onChange={(e) => onChange({ unitName: e.target.value })}
            placeholder="e.g., kg, pcs, meter"
            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
          />
        </div>

        {/* Warranty */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Warranty
          </label>
          <input
            type="text"
            value={data.warranty}
            onChange={(e) => onChange({ warranty: e.target.value })}
            placeholder="e.g., 1 year, 6 months"
            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
          />
        </div>

        {/* SKU */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            SKU / Product Code
          </label>
          <input
            type="text"
            value={data.sku}
            onChange={(e) => onChange({ sku: e.target.value })}
            placeholder="e.g., SKU-12345"
            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
          />
        </div>

        {/* Bar Code */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Bar Code
          </label>
          <input
            type="text"
            value={data.barcode}
            onChange={(e) => onChange({ barcode: e.target.value })}
            placeholder="e.g., 1234567890"
            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
          />
        </div>

        {/* Initial Stock Count */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Initial Stock Count
          </label>
          <input
            type="number"
            value={data.initialStock || ''}
            onChange={(e) => onChange({ initialStock: parseInt(e.target.value) || 0 })}
            placeholder="0"
            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
          />
        </div>

        {/* Stock Entry Date */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Stock Entry Date
          </label>
          <input
            type="date"
            value={data.stockDate}
            onChange={(e) => onChange({ stockDate: e.target.value })}
            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
          />
        </div>

        {/* Location Slot */}
        <div className="xs:col-span-2">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Location Slot
          </label>
          <input
            type="text"
            value={data.locationSlot}
            onChange={(e) => onChange({ locationSlot: e.target.value })}
            placeholder="e.g., Shelf A-1"
            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
          />
        </div>
      </div>
    </div>
  );
};

export default InventorySection;
