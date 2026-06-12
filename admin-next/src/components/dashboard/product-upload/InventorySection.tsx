import React from 'react';
import { Scan, Calendar } from 'lucide-react';
import { Section, InputField } from './ui';
import { SectionFormProps } from './types';

const InventorySection: React.FC<SectionFormProps> = ({ formData, updateField }) => {
  return (
    <Section title="Inventory">
      <div className="space-y-3 xxs:space-y-4">
        <div className="grid grid-cols-1 xxs:grid-cols-2 sm:grid-cols-3 gap-2 xxs:gap-3 sm:gap-4 lg:gap-4 xl:gap-5">
          <InputField
            label="Product serial"
            value={formData.serial}
            onChange={(v) => updateField('serial', parseFloat(v) || 0)}
            placeholder="0%"
            type="number"
          />
          <InputField
            label="Quantity (Stock)"
            value={formData.quantity}
            onChange={(v) => updateField('quantity', parseInt(v) || 0)}
            placeholder="50"
            type="number"
          />
          <InputField
            label="Unit Name"
            value={formData.unitName}
            onChange={(v) => updateField('unitName', v)}
            placeholder="Piece, kg, liter, meter etc."
          />
        </div>
        <div className="grid grid-cols-1 xxs:grid-cols-2 sm:grid-cols-3 gap-2 xxs:gap-3 sm:gap-4 lg:gap-4 xl:gap-5">
          <InputField
            label="Warranty"
            value={formData.warranty}
            onChange={(v) => updateField('warranty', v)}
            placeholder="12 month"
          />
          <InputField
            label="SKU / Product Code"
            value={formData.sku}
            onChange={(v) => updateField('sku', v)}
            placeholder="ABC-XYZ-123"
          />
          <InputField
            label="Bar Code"
            value={formData.barcode}
            onChange={(v) => updateField('barcode', v)}
            placeholder="2154645786216"
            rightIcon={<Scan size={18} className="text-gray-400 xxs:w-5 xxs:h-5" />}
          />
        </div>
        <div className="grid grid-cols-1 xxs:grid-cols-2 sm:grid-cols-3 gap-2 xxs:gap-3 sm:gap-4 lg:gap-4 xl:gap-5">
          <InputField
            label="Initial Sold Count"
            value={formData.initialSoldCount}
            onChange={(v) => updateField('initialSoldCount', parseInt(v) || 0)}
            placeholder="0"
            type="number"
          />
          <InputField
            label="Production Start"
            value={formData.productionStart}
            onChange={(v) => updateField('productionStart', v)}
            placeholder="DD-MM-YYYY"
            rightIcon={<Calendar size={18} className="text-gray-400 xxs:w-5 xxs:h-5" />}
          />
          <InputField
            label="Expiration End"
            value={formData.expirationEnd}
            onChange={(v) => updateField('expirationEnd', v)}
            placeholder="DD-MM-YYYY"
            rightIcon={<Calendar size={18} className="text-gray-400 xxs:w-5 xxs:h-5" />}
          />
        </div>
      </div>
    </Section>
  );
};

export default React.memo(InventorySection);
