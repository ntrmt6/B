import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface VariantsSectionProps {
  data: any;
  onChange: (data: any) => void;
}

const VariantsSection: React.FC<VariantsSectionProps> = ({ data, onChange }) => {
  const addVariant = () => {
    const newVariant = {
      id: `variant_${Date.now()}`,
      title: '',
      attribute: '',
      extraPrice: 0
    };
    onChange({
      variants: [...(data.variants || []), newVariant]
    });
  };

  const updateVariant = (id: string, updates: any) => {
    onChange({
      variants: data.variants.map((v: any) =>
        v.id === id ? { ...v, ...updates } : v
      )
    });
  };

  const removeVariant = (id: string) => {
    onChange({
      variants: data.variants.filter((v: any) => v.id !== id)
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Product Variants</h2>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={data.variantsMandatory}
            onChange={(e) => onChange({ variantsMandatory: e.target.checked })}
            className="w-4 h-4 text-blue-500 rounded"
          />
          <span className="text-sm text-gray-700">Make this variant mandatory</span>
        </label>
      </div>

      <div className="space-y-4 mb-4">
        {data.variants?.map((variant: any) => (
          <div key={variant.id} className="p-4 border border-gray-200 rounded-lg space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex-1 space-y-3">
                <input
                  type="text"
                  value={variant.title}
                  onChange={(e) => updateVariant(variant.id, { title: e.target.value })}
                  placeholder="Variant Title (e.g., Color)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
                <input
                  type="text"
                  value={variant.attribute}
                  onChange={(e) => updateVariant(variant.id, { attribute: e.target.value })}
                  placeholder="Attribute (e.g., Red, Blue, Green)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
                <input
                  type="number"
                  value={variant.extraPrice || 0}
                  onChange={(e) => updateVariant(variant.id, { extraPrice: parseFloat(e.target.value) || 0 })}
                  placeholder="Extra Price (Optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
              </div>
              <button
                onClick={() => removeVariant(variant.id)}
                className="ml-3 p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addVariant}
        className="w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-700 rounded-lg hover:border-blue-500 hover:text-blue-500 transition flex items-center justify-center gap-2"
      >
        <Plus size={18} />
        Add Variant
      </button>
    </div>
  );
};

export default VariantsSection;
