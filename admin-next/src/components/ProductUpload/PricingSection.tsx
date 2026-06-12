import React from 'react';
import { DollarSign } from 'lucide-react';

interface PricingSectionProps {
  data: any;
  onChange: (data: any) => void;
}

const PricingSection: React.FC<PricingSectionProps> = ({ data, onChange }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
      <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Pricing</h2>

      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {/* Sales Price */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Sales Price <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <DollarSign size={18} className="text-gray-400 flex-shrink-0" />
            <input
              type="number"
              value={data.salesPrice || ''}
              onChange={(e) => onChange({ salesPrice: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
            />
          </div>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Current/Sell Price</p>
        </div>

        {/* Regular Price */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Regular Price
          </label>
          <div className="flex items-center gap-2">
            <DollarSign size={18} className="text-gray-400 flex-shrink-0" />
            <input
              type="number"
              value={data.regularPrice || ''}
              onChange={(e) => onChange({ regularPrice: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
            />
          </div>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Old/Original Price</p>
        </div>

        {/* Cost Price */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Cost Price
          </label>
          <div className="flex items-center gap-2">
            <DollarSign size={18} className="text-gray-400 flex-shrink-0" />
            <input
              type="number"
              value={data.costPrice || ''}
              onChange={(e) => onChange({ costPrice: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
            />
          </div>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Optional</p>
        </div>
      </div>

      {/* Discount Calculation */}
      {data.regularPrice && data.salesPrice && (
        <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs sm:text-sm text-green-700">
            Discount: {Math.round(((data.regularPrice - data.salesPrice) / data.regularPrice) * 100)}%
          </p>
        </div>
      )}
    </div>
  );
};

export default PricingSection;
