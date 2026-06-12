import React from 'react';
import { X, Upload, FolderOpen, Plus } from 'lucide-react';
import { normalizeImageUrl } from '../../../utils/imageUrlHelper';
import { CatalogModalProps } from './types';

const CatalogModal: React.FC<CatalogModalProps> = ({
  showCatalogModal, setShowCatalogModal,
  catalogModalTab, setCatalogModalTab,
  newCatalogItem, setNewCatalogItem,
  savingCatalog,
  localCategories, localSubCategories,
  catalogImageRef, uploadingCatalogImage,
  handleCatalogImageUpload, handleSaveCatalogItem,
  openGalleryPicker,
}) => {
  if (!showCatalogModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-[95vw] sm:w-[600px] max-w-[600px] max-h-[90vh] overflow-auto shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Add Catalog Item</h2>
          <button onClick={() => setShowCatalogModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b overflow-x-auto">
          {[
            { key: 'category', label: 'Category' },
            { key: 'subcategory', label: 'Sub Category' },
            { key: 'childcategory', label: 'Child Category' },
            { key: 'brand', label: 'Brand' },
            { key: 'tag', label: 'Tag' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setCatalogModalTab(tab.key as any);
                setNewCatalogItem({ name: '', parentCategory: '', parentSubCategory: '', image: '', isFlashSale: false, isMostSales: false, durationDays: 0 });
              }}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                catalogModalTab === tab.key
                  ? 'text-[#ff6a00] border-b-2 border-[#ff6a00]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {catalogModalTab === 'category' ? 'Category' :
               catalogModalTab === 'subcategory' ? 'Sub Category' :
               catalogModalTab === 'childcategory' ? 'Child Category' :
               catalogModalTab === 'brand' ? 'Brand' : 'Tag'} Name *
            </label>
            <input
              type="text"
              value={newCatalogItem.name}
              onChange={(e) => setNewCatalogItem(prev => ({ ...prev, name: e.target.value }))}
              placeholder={`Enter ${catalogModalTab} name`}
              className="w-full h-11 border rounded-lg px-3 text-sm outline-none focus:border-[#ff6a00]"
            />
          </div>

          {/* Parent Category - for Sub Category */}
          {catalogModalTab === 'subcategory' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category *</label>
              <select
                value={newCatalogItem.parentCategory}
                onChange={(e) => setNewCatalogItem(prev => ({ ...prev, parentCategory: e.target.value }))}
                className="w-full h-11 border rounded-lg px-3 text-sm outline-none focus:border-[#ff6a00] bg-white"
              >
                <option value="">Select Parent Category</option>
                {localCategories.map((cat) => (
                  <option key={cat.id || cat.name} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Parent Sub Category - for Child Category */}
          {catalogModalTab === 'childcategory' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent Sub Category *</label>
              <select
                value={newCatalogItem.parentSubCategory}
                onChange={(e) => setNewCatalogItem(prev => ({ ...prev, parentSubCategory: e.target.value }))}
                className="w-full h-11 border rounded-lg px-3 text-sm outline-none focus:border-[#ff6a00] bg-white"
              >
                <option value="">Select Parent Sub Category</option>
                {localSubCategories.map((sub) => (
                  <option key={sub.id || sub.name} value={sub.name}>{sub.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Image Upload - for Category, Brand, Sub/Child Category, Tag */}
          {(catalogModalTab === 'category' || catalogModalTab === 'brand') && (
            <CatalogImageUpload
              label={catalogModalTab === 'brand' ? 'Brand Logo' : 'Category Icon/Image'}
              size="w-20 h-20"
              rounded="rounded-xl"
              image={newCatalogItem.image}
              uploading={uploadingCatalogImage}
              catalogImageRef={catalogImageRef}
              handleCatalogImageUpload={handleCatalogImageUpload}
              openGalleryPicker={openGalleryPicker}
              onRemove={() => setNewCatalogItem(prev => ({ ...prev, image: '' }))}
              showGallery
              hint="Recommended: Square image, 200x200px or larger"
            />
          )}

          {(catalogModalTab === 'subcategory' || catalogModalTab === 'childcategory') && (
            <CatalogImageUpload
              label={`${catalogModalTab === 'subcategory' ? 'Sub Category' : 'Child Category'} Icon`}
              size="w-16 h-16"
              rounded="rounded-lg"
              image={newCatalogItem.image}
              uploading={uploadingCatalogImage}
              catalogImageRef={catalogImageRef}
              handleCatalogImageUpload={handleCatalogImageUpload}
              openGalleryPicker={openGalleryPicker}
              onRemove={() => setNewCatalogItem(prev => ({ ...prev, image: '' }))}
            />
          )}

          {catalogModalTab === 'tag' && (
            <CatalogImageUpload
              label="Tag Icon"
              size="w-14 h-14"
              rounded="rounded-lg"
              image={newCatalogItem.image}
              uploading={uploadingCatalogImage}
              catalogImageRef={catalogImageRef}
              handleCatalogImageUpload={handleCatalogImageUpload}
              openGalleryPicker={openGalleryPicker}
              onRemove={() => setNewCatalogItem(prev => ({ ...prev, image: '' }))}
            />
          )}

          {/* Tag Duration */}
          {catalogModalTab === 'tag' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Days)</label>
              <p className="text-xs text-gray-500 mb-2">Set how many days this tag will stay active in the store. Leave 0 for permanent.</p>
              <input
                type="number"
                min="0"
                value={newCatalogItem.durationDays || ''}
                onChange={(e) => setNewCatalogItem(prev => ({ ...prev, durationDays: parseInt(e.target.value) || 0 }))}
                placeholder="e.g. 7 for one week"
                className="w-full h-11 border rounded-lg px-3 text-sm outline-none focus:border-[#ff6a00]"
              />
              {newCatalogItem.durationDays > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  Tag will expire on: {new Date(Date.now() + newCatalogItem.durationDays * 86400000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              )}
            </div>
          )}

          {/* Flash Sale & Most Sales - for Category */}
          {catalogModalTab === 'category' && (
            <div className="flex gap-3 sm:gap-4 lg:gap-4 xl:gap-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newCatalogItem.isFlashSale}
                  onChange={(e) => setNewCatalogItem(prev => ({ ...prev, isFlashSale: e.target.checked }))}
                  className="w-4 h-4 accent-[#ff6a00]"
                />
                <span className="text-sm text-gray-700">⚡ Flash Sale Category</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newCatalogItem.isMostSales}
                  onChange={(e) => setNewCatalogItem(prev => ({ ...prev, isMostSales: e.target.checked }))}
                  className="w-4 h-4 accent-[#ff6a00]"
                />
                <span className="text-sm text-gray-700">🔥 Most Sales Category</span>
              </label>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <button onClick={() => setShowCatalogModal(false)} className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSaveCatalogItem}
            disabled={savingCatalog}
            className="px-5 py-2.5 text-sm bg-[#ff6a00] text-white rounded-lg hover:bg-[#e55d00] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {savingCatalog && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {savingCatalog ? 'Saving...' : `Add ${catalogModalTab.charAt(0).toUpperCase() + catalogModalTab.slice(1)}`}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Reusable image upload widget for catalog modal ── */

const CatalogImageUpload: React.FC<{
  label: string;
  size: string;
  rounded: string;
  image: string;
  uploading: boolean;
  catalogImageRef: React.RefObject<HTMLInputElement | null>;
  handleCatalogImageUpload: (file: File) => void;
  openGalleryPicker: (target: 'mainImage' | 'gallery' | 'variantImage' | 'catalogIcon', variantKey?: string) => void;
  onRemove: () => void;
  showGallery?: boolean;
  hint?: string;
}> = ({ label, size, rounded, image, uploading, catalogImageRef, handleCatalogImageUpload, openGalleryPicker, onRemove, showGallery, hint }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label} (Optional)</label>
    <input
      ref={catalogImageRef as React.RefObject<HTMLInputElement>}
      type="file"
      accept="image/*"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleCatalogImageUpload(file);
        e.target.value = '';
      }}
      className="hidden"
    />
    <div className="flex items-center gap-4">
      <div
        onClick={() => catalogImageRef.current?.click()}
        className={`${size} border-2 border-dashed ${rounded} flex items-center justify-center cursor-pointer transition-colors ${
          image ? 'border-[#ff6a00] bg-orange-50' : 'border-gray-300 hover:border-[#ff6a00] bg-gray-50'
        }`}
      >
        {uploading ? (
          <div className="animate-spin w-6 h-6 border-2 border-[#ff6a00] border-t-transparent rounded-full" />
        ) : image ? (
          <img src={normalizeImageUrl(image)} alt="Preview" className={`w-full h-full object-cover ${rounded === 'rounded-xl' ? 'rounded-lg' : 'rounded-md'}`} />
        ) : (
          <div className="flex flex-col items-center text-gray-400">
            <Upload size={size === 'w-14 h-14' ? 18 : size === 'w-16 h-16' ? 20 : 24} />
            {size === 'w-20 h-20' && <span className="text-xs mt-1">Upload</span>}
          </div>
        )}
      </div>
      {showGallery && (
        <button
          type="button"
          onClick={() => openGalleryPicker('catalogIcon')}
          className="h-20 px-4 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#ff6a00] hover:bg-orange-50 transition-colors text-gray-400"
        >
          <FolderOpen size={24} />
          <span className="text-xs mt-1">Gallery</span>
        </button>
      )}
      {image && (
        <button onClick={onRemove} className={`text-${showGallery ? 'sm' : 'xs'} text-red-500 hover:text-red-700 flex items-center gap-1`}>
          <X size={14} /> Remove
        </button>
      )}
    </div>
    {hint && <p className="text-xs text-gray-500 mt-2">{hint}</p>}
  </div>
);

export default React.memo(CatalogModal);
