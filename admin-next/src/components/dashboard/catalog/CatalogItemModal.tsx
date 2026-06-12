import React, { useRef } from 'react';
import { X, Image as ImageIcon, Upload, FolderOpen, Monitor, Smartphone } from 'lucide-react';
import { Category, SubCategory } from '../../../types';
import { normalizeImageUrl } from '../../../utils/imageUrlHelper';
import { GalleryPicker } from '../../GalleryPicker';

// Helper: extract YouTube video ID from URL
function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
}

interface CatalogItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  editItem: any;
  formData: any;
  setFormData: (data: any) => void;
  view: string;
  title: string;
  showImageColumn: boolean;
  categories: Category[];
  subCategories: SubCategory[];
  onSubmit: (e: React.FormEvent) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  tagDesktopBannerRef: React.RefObject<HTMLInputElement>;
  tagMobileBannerRef: React.RefObject<HTMLInputElement>;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTagBannerUpload: (e: React.ChangeEvent<HTMLInputElement>, field: 'desktopBanner' | 'mobileBanner') => void;
  tagGalleryPickerOpen: boolean;
  setTagGalleryPickerOpen: (open: boolean) => void;
  tagGalleryTarget: 'desktopBanner' | 'mobileBanner' | null;
  setTagGalleryTarget: (t: 'desktopBanner' | 'mobileBanner' | null) => void;
  onTagGallerySelect: (imageUrl: string) => void;
}

export function CatalogItemModal({
  isOpen, onClose,
  editItem, formData, setFormData,
  view, title, showImageColumn,
  categories, subCategories,
  onSubmit,
  fileInputRef, tagDesktopBannerRef, tagMobileBannerRef,
  onFileUpload, onTagBannerUpload,
  tagGalleryPickerOpen, setTagGalleryPickerOpen, tagGalleryTarget, setTagGalleryTarget,
  onTagGallerySelect,
}: CatalogItemModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-4 lg:p-5 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {editItem ? 'Edit' : 'Add'} {title}
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-white">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder={`Enter ${title.toLowerCase()} name`}
              />
            </div>

            {/* Parent Category for SubCategory */}
            {view === 'catalog_subcategories' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Parent Category *</label>
                <select
                  required
                  value={formData.categoryId || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    categoryId: e.target.value,
                    categoryName: categories.find(c => c.id === e.target.value)?.name,
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Parent SubCategory for ChildCategory */}
            {view === 'catalog_childcategories' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Parent Sub Category *</label>
                <select
                  required
                  value={formData.subCategoryId || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    subCategoryId: e.target.value,
                    subCategoryName: subCategories.find(s => s.id === e.target.value)?.name,
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select Sub Category</option>
                  {subCategories.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Image / Logo upload (Category & Brand) */}
            {showImageColumn && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {view === 'catalog_brands' ? 'Logo' : 'Icon'}
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-700">
                    {(formData.icon || formData.logo) ? (
                      <img src={formData.icon || formData.logo} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={24} className="text-gray-400 dark:text-gray-500" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 text-sm"
                  >
                    Upload Image
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileUpload} className="hidden" />
                </div>
              </div>
            )}

            {/* Tag-specific fields */}
            {view === 'catalog_tags' ? (
              <TagFields
                formData={formData}
                setFormData={setFormData}
                tagDesktopBannerRef={tagDesktopBannerRef}
                tagMobileBannerRef={tagMobileBannerRef}
                onTagBannerUpload={onTagBannerUpload}
                tagGalleryPickerOpen={tagGalleryPickerOpen}
                setTagGalleryPickerOpen={setTagGalleryPickerOpen}
                tagGalleryTarget={tagGalleryTarget}
                setTagGalleryTarget={setTagGalleryTarget}
                onTagGallerySelect={onTagGallerySelect}
              />
            ) : (
              /* Serial for non-tag views */
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Serial</label>
                <input
                  type="number"
                  value={formData.serial || 0}
                  onChange={(e) => setFormData({ ...formData, serial: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            )}

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                value={formData.status || 'Active'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="Active">Publish</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] text-white rounded-lg hover:opacity-90"
              >
                {editItem ? 'Update' : 'Create'} {title}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Gallery Picker */}
      <GalleryPicker
        isOpen={tagGalleryPickerOpen}
        onClose={() => { setTagGalleryPickerOpen(false); setTagGalleryTarget(null); }}
        onSelect={onTagGallerySelect}
        title={`Choose ${tagGalleryTarget === 'desktopBanner' ? 'Desktop Banner' : 'Mobile Banner'} from Gallery`}
      />
    </>
  );
}

// ─── Tag-specific fields (Duration, Countdown, Desktop/Mobile Banner+Video) ───

interface TagFieldsProps {
  formData: any;
  setFormData: (data: any) => void;
  tagDesktopBannerRef: React.RefObject<HTMLInputElement>;
  tagMobileBannerRef: React.RefObject<HTMLInputElement>;
  onTagBannerUpload: (e: React.ChangeEvent<HTMLInputElement>, field: 'desktopBanner' | 'mobileBanner') => void;
  tagGalleryPickerOpen: boolean;
  setTagGalleryPickerOpen: (open: boolean) => void;
  tagGalleryTarget: 'desktopBanner' | 'mobileBanner' | null;
  setTagGalleryTarget: (t: 'desktopBanner' | 'mobileBanner' | null) => void;
  onTagGallerySelect: (imageUrl: string) => void;
}

function TagFields({
  formData, setFormData,
  tagDesktopBannerRef, tagMobileBannerRef,
  onTagBannerUpload,
  setTagGalleryPickerOpen, setTagGalleryTarget,
}: TagFieldsProps) {
  return (
    <div>
      {/* Duration */}
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration (Days)</label>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">How many days this tag stays active. 0 = permanent.</p>
      <input
        type="number"
        min="0"
        value={formData.durationDays || 0}
        onChange={(e) => {
          const days = parseInt(e.target.value) || 0;
          const updates: any = { ...formData, durationDays: days };
          if (days > 0) {
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + days);
            updates.expiresAt = expiry.toISOString();
          } else {
            updates.expiresAt = undefined;
          }
          setFormData(updates);
        }}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      />
      {formData.durationDays > 0 && (
        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
          Expires: {new Date(Date.now() + (formData.durationDays || 0) * 86400000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      )}

      {/* Countdown toggle */}
      <div className="flex items-center justify-between mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Show Countdown Timer</label>
          <p className="text-xs text-gray-500 dark:text-gray-400">Display a countdown timer on the store front for this tag</p>
        </div>
        <button
          type="button"
          onClick={() => setFormData({ ...formData, showCountdown: !formData.showCountdown })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.showCountdown ? 'bg-cyan-500' : 'bg-gray-300 dark:bg-gray-600'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${formData.showCountdown ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* Desktop Banner / Video */}
      <BannerVideoSection
        label="Desktop Banner / Video"
        labelIcon={<Monitor size={14} className="inline mr-1" />}
        bannerFieldName="desktopBanner"
        videoFieldName="desktopVideo"
        bannerRef={tagDesktopBannerRef}
        formData={formData}
        setFormData={setFormData}
        onBannerUpload={(e) => onTagBannerUpload(e, 'desktopBanner')}
        onGalleryOpen={() => { setTagGalleryTarget('desktopBanner'); setTagGalleryPickerOpen(true); }}
        videoPlaceholder="https://youtube.com/watch?v=..."
        uploadLabel="Upload Banner"
        borderColor="border-gray-300"
        hoverBg="hover:bg-gray-50"
        uploadIcon={<Upload size={24} className="mb-1" />}
      />

      {/* Mobile Banner / Video */}
      <BannerVideoSection
        label="Mobile Banner / Video"
        labelIcon={<Smartphone size={14} className="inline mr-1" />}
        bannerFieldName="mobileBanner"
        videoFieldName="mobileVideo"
        bannerRef={tagMobileBannerRef}
        formData={formData}
        setFormData={setFormData}
        onBannerUpload={(e) => onTagBannerUpload(e, 'mobileBanner')}
        onGalleryOpen={() => { setTagGalleryTarget('mobileBanner'); setTagGalleryPickerOpen(true); }}
        videoPlaceholder="https://youtube.com/watch?v=..."
        uploadLabel="Upload Mobile"
        borderColor="border-blue-300 dark:border-blue-600"
        hoverBg="hover:bg-blue-50 dark:hover:bg-blue-900/20"
        uploadIcon={<Smartphone size={24} className="mb-1" />}
      />
    </div>
  );
}

// ─── Reusable Banner + Video URL section ───

interface BannerVideoSectionProps {
  label: string;
  labelIcon: React.ReactNode;
  bannerFieldName: string;
  videoFieldName: string;
  bannerRef: React.RefObject<HTMLInputElement>;
  formData: any;
  setFormData: (data: any) => void;
  onBannerUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGalleryOpen: () => void;
  videoPlaceholder: string;
  uploadLabel: string;
  borderColor: string;
  hoverBg: string;
  uploadIcon: React.ReactNode;
}

function BannerVideoSection({
  label, labelIcon,
  bannerFieldName, videoFieldName,
  bannerRef, formData, setFormData,
  onBannerUpload, onGalleryOpen,
  videoPlaceholder, uploadLabel, borderColor, hoverBg, uploadIcon,
}: BannerVideoSectionProps) {
  const bannerValue = formData[bannerFieldName];
  const videoValue = formData[videoFieldName] || '';

  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {labelIcon} {label}
      </label>
      <div className="grid grid-cols-2 gap-3">
        {/* Banner Image */}
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Banner Image</p>
          <input type="file" ref={bannerRef} onChange={onBannerUpload} className="hidden" accept="image/*" />
          <div
            onClick={() => bannerRef.current?.click()}
            className={`flex-1 border-2 border-dashed ${borderColor} rounded-lg p-2 text-center cursor-pointer ${hoverBg} h-24`}
          >
            {bannerValue ? (
              <div className="relative w-full h-full">
                <img src={normalizeImageUrl(bannerValue)} alt="Banner" className="w-full h-full object-cover rounded" />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFormData((prev: any) => ({ ...prev, [bannerFieldName]: '' })); }}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div className="text-gray-400 dark:text-gray-500 flex flex-col items-center justify-center h-full">
                {uploadIcon}
                <p className="text-xs">{uploadLabel}</p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onGalleryOpen}
            className="w-full mt-1 py-1 border border-dashed border-indigo-300 dark:border-indigo-500 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-xs gap-1"
          >
            <FolderOpen size={12} /> Select Gallery
          </button>
        </div>

        {/* YouTube Video URL */}
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">YouTube Video URL</p>
          <input
            type="url"
            placeholder={videoPlaceholder}
            value={videoValue}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, [videoFieldName]: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
          {getYouTubeId(videoValue) && (
            <div className="mt-1 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
              <iframe
                src={`https://www.youtube.com/embed/${getYouTubeId(videoValue)}`}
                className="w-full h-24"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Video Preview"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
