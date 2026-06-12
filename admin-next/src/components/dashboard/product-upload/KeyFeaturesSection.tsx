import React from 'react';
import { X, Plus } from 'lucide-react';
import { Section, InputField } from './ui';
import { SectionFormProps } from './types';

const KeyFeaturesSection: React.FC<SectionFormProps> = ({ formData, updateField }) => {
  return (
    <Section title="key features" subtitle="You can add multiple key features for a single product here. Like Brand, Model, Serial Number, Fabric Type, and EMI etc.">
      {formData.details.map((detail, idx) => (
        <div key={idx} className="flex items-end gap-2 mb-4">
          <div className="flex-1 grid grid-cols-2 gap-2">
            <InputField
              label="Detail Type"
              value={detail.type}
              onChange={(v) => {
                const newDetails = [...formData.details];
                newDetails[idx].type = v;
                updateField('details', newDetails);
              }}
              placeholder="Ram"
            />
            <InputField
              label="Detail Description"
              value={detail.description}
              onChange={(v) => {
                const newDetails = [...formData.details];
                newDetails[idx].description = v;
                updateField('details', newDetails);
              }}
              placeholder="16 GB"
            />
          </div>
          <button 
            onClick={() => updateField('details', formData.details.filter((_, i) => i !== idx))}
            className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-500"
          >
            <X size={24} />
          </button>
        </div>
      ))}
      <button
        onClick={() => updateField('details', [...formData.details, { type: '', description: '' }])}
        className="h-10 bg-[#f4f4f4] rounded-lg px-4 flex items-center gap-3"
      >
        <Plus size={24} />
        <span className="text-[14px] font-semibold text-black">Add More</span>
      </button>
    </Section>
  );
};

export default React.memo(KeyFeaturesSection);
