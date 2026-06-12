import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Brand } from '../../types';

interface BrandDetailsSectionProps {
  data: any;
  brands: Brand[];
  onChange: (data: any) => void;
}

const BrandDetailsSection: React.FC<BrandDetailsSectionProps> = ({ data, brands, onChange }) => {
  const addDetail = () => {
    const newDetail = {
      id: `detail_${Date.now()}`,
      title: '',
      description: ''
    };
    onChange({
      details: [...(data.details || []), newDetail]
    });
  };

  const updateDetail = (id: string, updates: any) => {
    onChange({
      details: data.details.map((d: any) =>
        d.id === id ? { ...d, ...updates } : d
      )
    });
  };

  const removeDetail = (id: string) => {
    onChange({
      details: data.details.filter((d: any) => d.id !== id)
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Brand & Details</h2>

      <div className="space-y-6">
        {/* Brand Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Brand Name <span className="text-red-500">*</span>
          </label>
          <select
            value={data.brand}
            onChange={(e) => onChange({ brand: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="">Select a brand</option>
            {brands.map(brand => (
              <option key={brand.id} value={brand.name || brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>

        {/* Product Details */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Product Details</h3>
          <div className="space-y-3 mb-3">
            {data.details?.map((detail: any, index: number) => (
              <div key={detail.id} className="p-4 border border-gray-200 rounded-lg space-y-2">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={detail.title}
                      onChange={(e) => updateDetail(detail.id, { title: e.target.value })}
                      placeholder="Detail Title (e.g., Material, Color)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                    />
                    <textarea
                      value={detail.description}
                      onChange={(e) => updateDetail(detail.id, { description: e.target.value })}
                      placeholder="Detail Description"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-none"
                    />
                  </div>
                  <button
                    onClick={() => removeDetail(detail.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition flex-shrink-0"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addDetail}
            className="w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-700 rounded-lg hover:border-blue-500 hover:text-blue-500 transition flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Add Detail
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrandDetailsSection;
