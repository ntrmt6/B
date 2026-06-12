
import React from 'react';
import { Plus } from 'lucide-react';
import { SelectField } from './ui';
import { AddCircleIcon, DraftIcon } from './icons';
import { ProductSidebarProps } from './types';
import { Category, SubCategory, ChildCategory, Brand, Tag } from '../../../types';

/* ── Shared sub-components used by both desktop and mobile layouts ── */

const ReadyToPublish: React.FC<{
  completionItems: { label: string; completed: boolean }[];
  completionPercentage: number;
  getProgressColor: (pct: number) => string;
  compact?: boolean;
}> = ({ completionItems, completionPercentage, getProgressColor, compact }) => (
  <div className={`bg-white rounded-lg ${compact ? 'p-2 xxs:p-3 sm:p-4' : 'p-4'}`}>
    <h3 className={`${compact ? 'text-sm xxs:text-base sm:text-lg' : 'text-[20px]'} font-medium text-black ${compact ? 'mb-2 xxs:mb-3' : 'mb-4'}`}>Ready To Publish</h3>
    <div className={`flex items-center gap-2 ${compact ? 'mb-2 xxs:mb-3' : 'mb-4'}`}>
      <div className={`flex-1 ${compact ? 'h-1.5 xxs:h-2' : 'h-2'} bg-[#f9f9f9] rounded-full overflow-hidden`}>
        <div
          className={`h-full ${getProgressColor(completionPercentage)} rounded-full transition-all duration-300`}
          style={{ width: `${completionPercentage}%` }}
        />
      </div>
      <span className={`${compact ? 'text-xs xxs:text-sm' : 'text-[14px]'} font-medium`}>{completionPercentage}%</span>
    </div>
    <div className={compact ? 'grid grid-cols-2 gap-1.5 xxs:gap-2' : 'space-y-2'}>
      {completionItems.map((item, idx) => (
        <div key={idx} className={`flex items-center ${compact ? 'gap-1.5 xxs:gap-2' : 'gap-3'}`}>
          <div className={`${compact ? 'w-2.5 h-2.5 xxs:w-3 xxs:h-3' : 'w-4 h-4'} rounded-full border flex items-center justify-center transition-all ${item.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'}`}>
            {item.completed && (
              <svg className={`${compact ? 'w-1.5 h-1.5 xxs:w-2 xxs:h-2' : 'w-2.5 h-2.5'} text-white`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className={`${compact ? 'text-[10px] xxs:text-xs' : 'text-[12px] font-medium'} ${item.completed ? 'text-black' : 'text-gray-400'}`}>{item.label}</span>
        </div>
      ))}
    </div>
  </div>
);

/* ── Catalog chip selector (categories, sub-categories, brands, tags) ── */

interface CatalogChipsProps {
  formData: ProductSidebarProps['formData'];
  updateField: ProductSidebarProps['updateField'];
  localCategories: Category[];
  localSubCategories: SubCategory[];
  localChildCategories: ChildCategory[];
  localBrands: Brand[];
  localTags: Tag[];
  setCatalogModalTab: ProductSidebarProps['setCatalogModalTab'];
  setShowCatalogModal: ProductSidebarProps['setShowCatalogModal'];
  compact?: boolean;
}

const CatalogPanel: React.FC<CatalogChipsProps> = ({
  formData, updateField, localCategories, localSubCategories, localChildCategories, localBrands, localTags,
  setCatalogModalTab, setShowCatalogModal, compact,
}) => {
  const chipSize = compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm';
  const addBtnSize = compact ? 'w-5 h-5' : 'w-6 h-6';
  const addIconSize = compact ? 12 : 14;
  const sectionMb = compact ? 'mb-3' : 'mb-4';
  const labelClass = compact ? 'text-xs font-medium text-gray-700' : 'text-sm font-medium text-gray-700';

  return (
    <div className={`bg-white rounded-lg ${compact ? 'p-2 xxs:p-3 sm:p-4' : 'p-4'}`}>
      <h3 className={`${compact ? 'text-sm xxs:text-base sm:text-lg mb-2 xxs:mb-3' : 'text-[20px] mb-4'} font-medium text-black`}>Catalog</h3>

      {/* Categories */}
      <div className={sectionMb}>
        <div className={`flex items-center justify-between ${compact ? 'mb-1.5' : 'mb-2'}`}>
          <label className={labelClass}>Assign categories <span className="text-red-500">*</span></label>
          <button type="button" onClick={() => { setCatalogModalTab('category'); setShowCatalogModal(true); }} className={`${addBtnSize} rounded-full bg-indigo-500 text-white flex items-center justify-center hover:bg-indigo-600 transition`}><Plus size={addIconSize} /></button>
        </div>
        <div className={`flex flex-wrap ${compact ? 'gap-1.5' : 'gap-2'}`}>
          {localCategories.map(cat => {
            const isSelected = (formData.categories || []).includes(cat.name);
            return (
              <button key={cat.id} type="button" onClick={() => { const arr = formData.categories || []; const newArr = isSelected ? arr.filter((c: string) => c !== cat.name) : [...arr, cat.name]; updateField('categories', newArr); updateField('category', newArr[0] || ''); }}
                className={`${chipSize} rounded-full font-medium transition-all border ${isSelected ? 'bg-indigo-500 text-white border-indigo-500 shadow-sm' : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'}`}
              >{isSelected && <span className="mr-1">✓</span>}{cat.name}</button>
            );
          })}
        </div>
      </div>

      {/* Sub Categories */}
      {localSubCategories.filter(sc => {
        const selCats = formData.categories || [];
        return selCats.length === 0 || selCats.some((cat: string) => sc.categoryName === cat || sc.categoryId === cat || localCategories.find(c => c.name === cat)?.id === sc.categoryId);
      }).length > 0 && (
        <div className={sectionMb}>
          <div className={`flex items-center justify-between ${compact ? 'mb-1.5' : 'mb-2'}`}>
            <label className={labelClass}>Assign sub categories</label>
            <button type="button" onClick={() => { setCatalogModalTab('subcategory'); setShowCatalogModal(true); }} className={`${addBtnSize} rounded-full bg-purple-500 text-white flex items-center justify-center hover:bg-purple-600 transition`}><Plus size={addIconSize} /></button>
          </div>
          <div className={`flex flex-wrap ${compact ? 'gap-1.5' : 'gap-2'}`}>
            {localSubCategories.filter(sc => {
              const selCats = formData.categories || [];
              return selCats.length === 0 || selCats.some((cat: string) => sc.categoryName === cat || sc.categoryId === cat || localCategories.find(c => c.name === cat)?.id === sc.categoryId);
            }).map(sc => {
              const isSelected = (formData.subCategoriesArr || []).includes(sc.name);
              return (
                <button key={sc.id} type="button" onClick={() => { const arr = formData.subCategoriesArr || []; const newArr = isSelected ? arr.filter((s: string) => s !== sc.name) : [...arr, sc.name]; updateField('subCategoriesArr', newArr); updateField('subCategory', newArr[0] || ''); }}
                  className={`${chipSize} rounded-full font-medium transition-all border ${isSelected ? 'bg-purple-500 text-white border-purple-500 shadow-sm' : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'}`}
                >{isSelected && <span className="mr-1">✓</span>}{sc.name}</button>
              );
            })}
          </div>
        </div>
      )}

      {/* Child Categories */}
      {localChildCategories.filter(cc => {
        const selSubs = formData.subCategoriesArr || [];
        return selSubs.length === 0 ? false : selSubs.some((sub: string) => cc.subCategoryId === sub || localSubCategories.find(s => s.name === sub)?.id === cc.subCategoryId);
      }).length > 0 && (
        <div className={sectionMb}>
          <div className={`flex items-center justify-between ${compact ? 'mb-1.5' : 'mb-2'}`}>
            <label className={labelClass}>Assign child categories</label>
            <button type="button" onClick={() => { setCatalogModalTab('childcategory'); setShowCatalogModal(true); }} className={`${addBtnSize} rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition`}><Plus size={addIconSize} /></button>
          </div>
          <div className={`flex flex-wrap ${compact ? 'gap-1.5' : 'gap-2'}`}>
            {localChildCategories.filter(cc => {
              const selSubs = formData.subCategoriesArr || [];
              return selSubs.some((sub: string) => cc.subCategoryId === sub || localSubCategories.find(s => s.name === sub)?.id === cc.subCategoryId);
            }).map(cc => {
              const isSelected = (formData.childCategoriesArr || []).includes(cc.name);
              return (
                <button key={cc.id} type="button" onClick={() => { const arr = formData.childCategoriesArr || []; const newArr = isSelected ? arr.filter((c: string) => c !== cc.name) : [...arr, cc.name]; updateField('childCategoriesArr', newArr); updateField('childCategory', newArr[0] || ''); }}
                  className={`${chipSize} rounded-full font-medium transition-all border ${isSelected ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm' : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-400'}`}
                >{isSelected && <span className="mr-1">✓</span>}{cc.name}</button>
              );
            })}
          </div>
        </div>
      )}

      {/* Brands */}
      <div className={sectionMb}>
        <div className={`flex items-center justify-between ${compact ? 'mb-1.5' : 'mb-2'}`}>
          <label className={labelClass}>Assign brands</label>
          <button type="button" onClick={() => { setCatalogModalTab('brand'); setShowCatalogModal(true); }} className={`${addBtnSize} rounded-full bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600 transition`}><Plus size={addIconSize} /></button>
        </div>
        <div className={`flex flex-wrap ${compact ? 'gap-1.5' : 'gap-2'}`}>
          {localBrands.map(b => {
            const isSelected = (formData.brandsArr || []).includes(b.name);
            return (
              <button key={b.id} type="button" onClick={() => { const arr = formData.brandsArr || []; const newArr = isSelected ? arr.filter((x: string) => x !== b.name) : [...arr, b.name]; updateField('brandsArr', newArr); updateField('brandName', newArr[0] || ''); }}
                className={`${chipSize} rounded-full font-medium transition-all border ${isSelected ? 'bg-amber-500 text-white border-amber-500 shadow-sm' : 'bg-white text-gray-700 border-gray-300 hover:border-amber-400'}`}
              >{isSelected && <span className="mr-1">✓</span>}{b.name}</button>
            );
          })}
        </div>
      </div>

      {/* Product Tags */}
      <div>
        <label className={`block ${labelClass} ${compact ? 'mb-1.5' : 'mb-2'}`}>Product Tags</label>
        <SelectField
          value=""
          onChange={(v) => {
            const tArr = Array.isArray(formData.tag) ? formData.tag : [];
            if (v && !tArr.includes(v)) {
              updateField('tag', [...tArr, v]);
            }
          }}
          options={(localTags || []).map(t => ({ value: t.name, label: t.name }))}
          placeholder="Add custom tag..."
        />
        {(Array.isArray(formData.tag) ? formData.tag : []).length > 0 && (
          <div className={`flex flex-wrap ${compact ? 'gap-1 mt-1.5' : 'gap-1.5 mt-2'}`}>
            {(Array.isArray(formData.tag) ? formData.tag : []).map((t: string) => (
              <span key={t} className={`inline-flex items-center gap-${compact ? '0.5' : '1'} ${compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'} rounded-full font-medium bg-gray-100 text-gray-700`}>
                {t}
                <button type="button" onClick={() => updateField('tag', (Array.isArray(formData.tag) ? formData.tag : []).filter((x: string) => x !== t))} className="text-gray-400 hover:text-red-500">×</button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Flash Sale Toggle ── */

const FlashSalePanel: React.FC<{ formData: ProductSidebarProps['formData']; updateField: ProductSidebarProps['updateField'] }> = ({ formData, updateField }) => (
  <div className="bg-white rounded-lg p-4">
    <h3 className="text-[20px] font-medium text-black mb-4">Flash Sale</h3>
    <div className="flex items-center justify-between mb-4">
      <span className="text-sm text-gray-600">Enable Flash Sale</span>
      <button
        type="button"
        onClick={() => updateField('flashSale', !formData.flashSale)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.flashSale ? 'bg-orange-500' : 'bg-gray-200'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.flashSale ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
    {formData.flashSale && (
      <div className="space-y-3">
        <div>
          <label className="text-sm text-gray-600 mb-1 block">Start Date</label>
          <input type="datetime-local" value={formData.flashSaleStartDate} onChange={(e) => updateField('flashSaleStartDate', e.target.value)} className="w-full h-10 bg-[#f9f9f9] rounded-lg px-3 text-[14px] outline-none" />
        </div>
        <div>
          <label className="text-sm text-gray-600 mb-1 block">End Date</label>
          <input type="datetime-local" value={formData.flashSaleEndDate} onChange={(e) => updateField('flashSaleEndDate', e.target.value)} className="w-full h-10 bg-[#f9f9f9] rounded-lg px-3 text-[14px] outline-none" />
        </div>
      </div>
    )}
  </div>
);

/* ── Main ProductSidebar ── */

const ProductSidebar: React.FC<ProductSidebarProps> = ({
  formData, updateField, editProduct, handleSaveDraft, handlePublish,
  completionItems, completionPercentage, getProgressColor,
  localCategories, localSubCategories, localChildCategories, localBrands, localTags,
  setCatalogModalTab, setShowCatalogModal,
}) => {
  const catalogProps = {
    formData, updateField, localCategories, localSubCategories, localChildCategories, localBrands, localTags,
    setCatalogModalTab, setShowCatalogModal,
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-[320px] lg:w-[381px] flex-shrink-0 space-y-4 sticky top-6 self-start max-h-[calc(100vh-3rem)] overflow-y-auto">
        {/* Action Buttons */}
        <div className="flex gap-2">
          <button onClick={handleSaveDraft} className="flex-1 h-10 bg-white rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50">
            <DraftIcon />
            <span className="text-[14px] font-semibold text-[#070606]">Draft</span>
          </button>
          <button onClick={handlePublish} className="flex-1 h-10 bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] rounded-lg flex items-center justify-center gap-2">
            <AddCircleIcon />
            <span className="text-[14px] font-semibold text-white">{editProduct ? 'Update' : 'Add Product'}</span>
          </button>
        </div>

        <ReadyToPublish completionItems={completionItems} completionPercentage={completionPercentage} getProgressColor={getProgressColor} />
        <CatalogPanel {...catalogProps} />

        {/* Deep Search */}
        <div className="bg-white rounded-lg p-4">
          <h3 className="text-[20px] font-medium text-black mb-4">Deep Search</h3>
          <input value={formData.deepSearch} onChange={(e) => updateField('deepSearch', e.target.value)} type="text" placeholder="Keywords comma দিয়ে আলাদা করুন (ex: mobile, phone, samsung)" className="w-full h-10 bg-[#f9f9f9] rounded-lg px-3 text-[12px] placeholder:text-[#a2a2a2] outline-none" />
        </div>

        {/* Condition */}
        <div className="bg-white rounded-lg p-4">
          <h3 className="text-[20px] font-medium text-black mb-4">Condition</h3>
          <SelectField value={formData.condition} onChange={(v) => updateField('condition', v)} options={[{ value: 'New', label: 'New' }, { value: 'Used', label: 'Used' }, { value: 'Refurbished', label: 'Refurbished' }]} placeholder="Select Condition" />
        </div>

        <FlashSalePanel formData={formData} updateField={updateField} />

        {/* Most Sales */}
        <div className="bg-white rounded-lg p-4">
          <h3 className="text-[20px] font-medium text-black mb-4">Most Sales</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Mark as Most Sales</span>
            <button type="button" onClick={() => updateField('isMostSales', !formData.isMostSales)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${(formData as any).isMostSales ? 'bg-amber-500' : 'bg-gray-200'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${(formData as any).isMostSales ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className="lg:hidden space-y-3 xxs:space-y-4 w-full">
        <FlashSalePanel formData={formData} updateField={updateField} />

        {/* Action Buttons - Mobile */}
        <div className="flex gap-2">
          <button onClick={handleSaveDraft} className="flex-1 h-9 xxs:h-10 bg-white rounded-lg flex items-center justify-center gap-1.5 xxs:gap-2 hover:bg-gray-50 text-xs xxs:text-sm">
            <DraftIcon />
            <span className="font-semibold text-[#070606]">Draft</span>
          </button>
          <button onClick={handlePublish} className="flex-1 h-9 xxs:h-10 bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] rounded-lg flex items-center justify-center gap-1.5 xxs:gap-2">
            <AddCircleIcon />
            <span className="text-xs xxs:text-sm font-semibold text-white">{editProduct ? 'Update' : 'Add'}</span>
          </button>
        </div>

        <ReadyToPublish compact completionItems={completionItems} completionPercentage={completionPercentage} getProgressColor={getProgressColor} />
        <CatalogPanel {...catalogProps} compact />

        {/* Deep Search - Mobile */}
        <div className="bg-white rounded-lg p-2 xxs:p-3 sm:p-4">
          <h3 className="text-sm xxs:text-base sm:text-lg font-medium text-black mb-2 xxs:mb-3">Deep Search</h3>
          <input value={formData.deepSearch} onChange={(e) => updateField('deepSearch', e.target.value)} type="text" placeholder="Keywords comma দিয়ে আলাদা করুন (ex: mobile, phone, samsung)" className="w-full h-9 bg-[#f9f9f9] rounded-lg px-3 text-xs placeholder:text-[#a2a2a2] outline-none" />
        </div>

        {/* Condition - Mobile */}
        <div className="bg-white rounded-lg p-3 sm:p-4">
          <h3 className="text-base sm:text-lg font-medium text-black mb-3">Condition</h3>
          <SelectField value={formData.condition} onChange={(v) => updateField('condition', v)} options={[{ value: 'New', label: 'New' }, { value: 'Used', label: 'Used' }, { value: 'Refurbished', label: 'Refurbished' }]} placeholder="Select Condition" />
        </div>
      </div>
    </>
  );
};

export default React.memo(ProductSidebar);
