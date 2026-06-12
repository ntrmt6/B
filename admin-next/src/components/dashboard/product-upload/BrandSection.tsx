import React from 'react';
import { X, Plus } from 'lucide-react';
import { Section, InputField } from './ui';
import { SectionFormProps } from './types';

const BrandSection: React.FC<SectionFormProps> = ({ formData, updateField }) => {
  return (
    <Section title="Brand" subtitle="You can add multiple product details for a single product here. Like Brand, Model, Serial Number, Fabric Type, and EMI etc.">
      <div className="flex items-end gap-2">
        <div className="flex-1 grid grid-cols-2 gap-2">
          <InputField
            label="Brand Name"
            value={formData.brandName}
            onChange={(v) => updateField('brandName', v)}
            placeholder="Samsung"
          />
          <InputField
            label="Model Name"
            value={formData.modelName}
            onChange={(v) => updateField('modelName', v)}
            placeholder="S25 Ultra"
          />
        </div>
        <button className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-500">
          <X size={24} />
        </button>
      </div>
      <button className="mt-4 h-10 bg-[#f4f4f4] rounded-lg px-4 flex items-center gap-3">
        <Plus size={24} />
        <span className="text-[14px] font-semibold text-black">Create a new Brand</span>
      </button>
    </Section>
  );
};

export default React.memo(BrandSection);
