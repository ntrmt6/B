import React from 'react';
import { Section, InputField } from './ui';
import { SectionFormProps } from './types';

const PricingSection: React.FC<SectionFormProps> = ({ formData, updateField }) => {
  return (
    <Section title="Pricing">
      <div className="grid grid-cols-1 xxs:grid-cols-2 sm:grid-cols-3 gap-2 xxs:gap-3 sm:gap-4 lg:gap-4 xl:gap-5">
        <InputField
          label="Sell/Current Price"
          required
          value={formData.salesPrice}
          onChange={(v) => updateField('salesPrice', parseFloat(v) || 0)}
          placeholder="0"
          type="number"
        />
        <InputField
          label="Regular/Old Price"
          required
          value={formData.regularPrice}
          onChange={(v) => updateField('regularPrice', parseFloat(v) || 0)}
          placeholder="0"
          type="number"
        />
        <InputField
          label="Cost Price (Optional)"
          value={formData.costPrice}
          onChange={(v) => updateField('costPrice', parseFloat(v) || 0)}
          placeholder="0"
          type="number"
        />
      </div>
    </Section>
  );
};

export default React.memo(PricingSection);
