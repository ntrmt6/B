import React from 'react';
import { Section, InputField, SelectField } from './ui';
import { AffiliateProps } from './types';

const AffiliateSection: React.FC<AffiliateProps> = ({ formData, updateField, affiliateSources }) => {
  return (
    <Section title="Affiliate">
      <div className="space-y-4">
        <SelectField
          label="Product Source (Optional)"
          value={formData.affiliateSource}
          onChange={(v) => updateField('affiliateSource', v)}
          options={affiliateSources}
          placeholder="Select source"
        />
        <p className="text-[12px] text-[#a2a2a2]">Select if this product is sourced from an external supplier or marketplace</p>

        {formData.affiliateSource && (
          <>
            <div className="bg-[#fff8ef] h-[60px] rounded-lg flex items-center px-4 gap-4">
              <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center text-orange-500 font-bold">A</div>
              <div>
                <p className="text-[14px] font-bold text-black">{formData.affiliateSource}</p>
                <p className="text-[10px] text-[#009ade]">www.{formData.affiliateSource.toLowerCase()}.com</p>
              </div>
              <span className="ml-auto bg-[#ff821c] text-white text-[12px] font-semibold px-3 py-1 rounded-full">Marketplace</span>
            </div>

            <div className="bg-[#fff8ef] rounded-lg p-4 sm:p-6 space-y-4">
              <p className="text-[14px] font-bold text-black">Source Product Details (Optional)</p>
              <div>
                <InputField
                  label="Source Product URL"
                  value={formData.sourceProductUrl}
                  onChange={(v) => updateField('sourceProductUrl', v)}
                  placeholder="www.xyz.com/product/123"
                />
                <p className="text-[12px] text-[#a2a2a2] mt-1">Direct link to this product on the source platform</p>
              </div>
              <div>
                <InputField
                  label="Source SKU / Product Code"
                  value={formData.sourceSku}
                  onChange={(v) => updateField('sourceSku', v)}
                  placeholder="ABC-XYZ-123"
                />
                <p className="text-[12px] text-[#a2a2a2] mt-1">Product identifier from the source (SKU, Product ID, etc.)</p>
              </div>
              <div className="bg-[#fff0dd] rounded-lg p-3">
                <p className="text-[12px] text-[#a2a2a2]">
                  💡 Tip: These details help you track and manage products from external sources. You can use the Source URL to quickly access the product page, and the Source SKU for ordering or communication with suppliers.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </Section>
  );
};

export default React.memo(AffiliateSection);
