import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface ShippingSectionProps {
  data: any;
  onChange: (data: any) => void;
}

const ShippingSection: React.FC<ShippingSectionProps> = ({ data, onChange }) => {
  const addCityCharge = () => {
    const newCity = {
      city: '',
      charge: 0
    };
    onChange({
      deliveryByCity: [...(data.deliveryByCity || []), newCity]
    });
  };

  const updateCityCharge = (index: number, updates: any) => {
    const updated = data.deliveryByCity.map((item: any, i: number) =>
      i === index ? { ...item, ...updates } : item
    );
    onChange({ deliveryByCity: updated });
  };

  const removeCityCharge = (index: number) => {
    onChange({
      deliveryByCity: data.deliveryByCity.filter((_: any, i: number) => i !== index)
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Shipping</h2>

      <div className="space-y-6">
        {/* Global Delivery Charge */}
        <div>
          <label className="flex items-center gap-2 mb-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-500 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Use global delivery charge</span>
          </label>
          <input
            type="number"
            value={data.deliveryCharge || ''}
            onChange={(e) => onChange({ deliveryCharge: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {/* City-based Charges */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">City-based Delivery Charges</h3>
          <div className="space-y-3 mb-3">
            {data.deliveryByCity?.map((item: any, index: number) => (
              <div key={index} className="flex gap-3">
                <input
                  type="text"
                  value={item.city}
                  onChange={(e) => updateCityCharge(index, { city: e.target.value })}
                  placeholder="City name"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
                <input
                  type="number"
                  value={item.charge || ''}
                  onChange={(e) => updateCityCharge(index, { charge: parseFloat(e.target.value) || 0 })}
                  placeholder="Charge"
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
                <button
                  onClick={() => removeCityCharge(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addCityCharge}
            className="w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-700 rounded-lg hover:border-blue-500 hover:text-blue-500 transition flex items-center justify-center gap-2 text-sm"
          >
            <Plus size={16} />
            Add City Charge
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShippingSection;
