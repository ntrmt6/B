import React from 'react';
import { Section, InputField, Toggle } from './ui';
import { SectionFormProps } from './types';

const ShippingSection: React.FC<SectionFormProps> = ({ formData, updateField }) => {
  return (
    <Section title="Shipping">
      <div className="space-y-4">
        <div>
          <p className="text-[20px] font-medium">Delivery Charge</p>
          <p className="text-[12px] text-[#a2a2a2]">You can add specific delivery charge for this product or use the default charges</p>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-[16px]">Apply default delivery charges</span>
          <Toggle 
            label={formData.useDefaultDelivery ? "[Applied]" : "[Not Applied]"}
            value={formData.useDefaultDelivery}
            onChange={(v) => updateField('useDefaultDelivery', v)}
          />
        </div>

        <InputField
          label="Delivery Charge (Default)"
          value={formData.deliveryChargeDefault}
          onChange={(v) => updateField('deliveryChargeDefault', parseFloat(v) || 0)}
          placeholder="120"
          type="number"
        />

        <div>
          <label className="text-[16px] text-black">Specific Delivery Charge</label>
          <div className="flex gap-2 mt-2">
            <input
              value={formData.deliveryByCity[0]?.city || ''}
              onChange={(e) => {
                const newDelivery = [...formData.deliveryByCity];
                if (newDelivery[0]) newDelivery[0].city = e.target.value;
                else newDelivery.push({ city: e.target.value, charge: 0 });
                updateField('deliveryByCity', newDelivery);
              }}
              placeholder="Dhaka"
              className="flex-1 h-10 bg-[#f9f9f9] rounded-lg px-3 text-[14px] outline-none"
            />
            <input
              type="number"
              value={formData.deliveryByCity[0]?.charge || ''}
              onChange={(e) => {
                const newDelivery = [...formData.deliveryByCity];
                if (newDelivery[0]) newDelivery[0].charge = parseFloat(e.target.value) || 0;
                else newDelivery.push({ city: '', charge: parseFloat(e.target.value) || 0 });
                updateField('deliveryByCity', newDelivery);
              }}
              placeholder="80"
              className="w-full sm:w-[213px] h-10 bg-[#f9f9f9] rounded-lg px-3 text-[14px] outline-none"
            />
          </div>
        </div>
      </div>
    </Section>
  );
};

export default React.memo(ShippingSection);
