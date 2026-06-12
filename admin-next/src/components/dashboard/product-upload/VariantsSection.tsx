import React from 'react';
import { Upload, X, Plus } from 'lucide-react';
import { normalizeImageUrl } from '../../../utils/imageUrlHelper';
import { Section, InputField, Toggle } from './ui';
import { AddCircleIcon } from './icons';
import { VariantsSectionProps } from './types';

const VariantsSection: React.FC<VariantsSectionProps> = ({
  formData,
  updateField,
  variantImageRefs,
  uploadingVariantImage,
  handleVariantImageUpload,
  handleRemoveVariantImage,
}) => {
  return (
    <Section title="Product Variants" subtitle="You can add multiple variant for a single product here. Like Size, Color, and Weight etc.">
      <div className="space-y-4">
        {formData.variants.map((variant, vIdx) => (
          <div key={vIdx} className="border border-[#38bdf8] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[20px] font-medium">Make this variant mandatory</p>
                <p className="text-[12px] text-[#a2a2a2]">Toggle this on if you want your customer to select at least one of the variant options</p>
              </div>
              <Toggle 
                label="[No]" 
                value={formData.variantsMandatory}
                onChange={(v) => updateField('variantsMandatory', v)}
              />
            </div>

            <InputField
              label="Title"
              value={variant.title}
              onChange={(v) => {
                const newVariants = [...formData.variants];
                newVariants[vIdx].title = v;
                updateField('variants', newVariants);
              }}
              placeholder="Enter the name of variant (e.g., Colour, Size, Material)"
            />

            {variant.options.map((option, oIdx) => (
              <div key={oIdx} className="flex items-end gap-2 mt-4">
                {/* Variant Image Upload */}
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    ref={(el) => { variantImageRefs.current[`${vIdx}-${oIdx}`] = el; }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleVariantImageUpload(vIdx, oIdx, file);
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                  <div 
                    onClick={() => variantImageRefs.current[`${vIdx}-${oIdx}`]?.click()}
                    className="w-[67px] h-[67px] bg-[#f9f9f9] rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-100 overflow-hidden border-2 border-dashed border-gray-300 hover:border-[#38bdf8] transition-colors"
                  >
                    {uploadingVariantImage === `${vIdx}-${oIdx}` ? (
                      <div className="animate-spin w-6 h-6 border-2 border-[#38bdf8] border-t-transparent rounded-full" />
                    ) : option.image ? (
                      <img src={normalizeImageUrl(option.image)} alt="Variant" className="w-full h-full object-cover" />
                    ) : (
                      <Upload size={24} className="text-gray-400" />
                    )}
                  </div>
                  {option.image && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveVariantImage(vIdx, oIdx);
                      }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[16px] text-black">Attribute</label>
                    <input
                      value={option.attribute}
                      onChange={(e) => {
                        const newVariants = [...formData.variants];
                        newVariants[vIdx].options[oIdx].attribute = e.target.value;
                        updateField('variants', newVariants);
                      }}
                      placeholder="Enter variant Option (e.g., Red, Large, Cotton)"
                      className="w-full h-10 bg-[#f9f9f9] rounded-lg px-3 text-[14px] placeholder:text-[#999] outline-none mt-2"
                    />
                  </div>
                  <div>
                    <label className="text-[16px] text-black">Extra Price</label>
                    <input
                      type="number"
                      value={option.extraPrice}
                      onChange={(e) => {
                        const newVariants = [...formData.variants];
                        newVariants[vIdx].options[oIdx].extraPrice = parseFloat(e.target.value) || 0;
                        updateField('variants', newVariants);
                      }}
                      placeholder="Enter Extra price for this option"
                      className="w-full h-10 bg-[#f9f9f9] rounded-lg px-3 text-[14px] placeholder:text-[#999] outline-none mt-2"
                    />
                  </div>
                </div>
                <button 
                  onClick={() => {
                    const newVariants = [...formData.variants];
                    newVariants[vIdx].options = newVariants[vIdx].options.filter((_, i) => i !== oIdx);
                    updateField('variants', newVariants);
                  }}
                  className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-500"
                >
                  <X size={24} />
                </button>
              </div>
            ))}

            <button
              onClick={() => {
                const newVariants = [...formData.variants];
                newVariants[vIdx].options.push({ attribute: '', extraPrice: 0 });
                updateField('variants', newVariants);
              }}
              className="mt-4 h-10 bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] text-white rounded-lg px-4 flex items-center gap-3"
            >
              <AddCircleIcon />
              <span className="text-[14px] font-semibold">Add More Option</span>
            </button>
          </div>
        ))}

        <button
          onClick={() => {
            updateField('variants', [...formData.variants, { title: '', options: [{ attribute: '', extraPrice: 0 }] }]);
          }}
          className="h-10 bg-[#f4f4f4] rounded-lg px-4 flex items-center gap-3"
        >
          <Plus size={24} />
          <span className="text-[14px] font-semibold text-black">Add a new variant</span>
        </button>
      </div>
    </Section>
  );
};

export default React.memo(VariantsSection);
