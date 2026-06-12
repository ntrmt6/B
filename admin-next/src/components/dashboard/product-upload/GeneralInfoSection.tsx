import React from 'react';
import { ChevronUp, Plus, Upload, Youtube, Scan, X, FolderOpen } from 'lucide-react';
import { normalizeImageUrl } from '../../../utils/imageUrlHelper';
import { RichTextEditor } from '../../RichTextEditor';
import { Section, InputField, Toggle } from './ui';
import { GeneralInfoSectionProps } from './types';

const GeneralInfoSection: React.FC<GeneralInfoSectionProps> = ({
  formData,
  updateField,
  isDragging,
  allImages,
  fileInputRef,
  unfilteredFileInputRef,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleImageUpload,
  handleUnfilteredImageUpload,
  handleRemoveImage,
  handleRemoveUnfilteredImage,
  handleSetAsMain,
  openGalleryPicker,
}) => {
  return (
    <Section title="General Information">
      <div className="space-y-3 xxs:space-y-4">
        {/* Item Name */}
        <div className="flex flex-col gap-1.5 xxs:gap-2">
          <div className="flex flex-col xxs:flex-row xxs:items-center justify-between gap-1 xxs:gap-2">
            <label className="text-[14px] xxs:text-[16px] text-black">
              Item Name<span className="text-[#e30000]">*</span>
            </label>
            <Toggle 
              label="Auto Slug" 
              value={formData.autoSlug} 
              onChange={(v) => updateField('autoSlug', v)}
            />
          </div>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => {
              updateField('name', e.target.value);
              if (formData.autoSlug) {
                updateField('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'));
              }
            }}
            placeholder="Ex: Samsung Galaxy S25 Ultra"
            className="w-full h-9 xxs:h-10 bg-[#f9f9f9] rounded-lg px-2 xxs:px-3 text-[13px] xxs:text-[14px] placeholder:text-[#a2a2a2] outline-none"
          />
          
          {/* Manual Slug Input */}
          {!formData.autoSlug && (
            <div className="mt-2">
              <label className="text-[12px] xxs:text-[13px] text-gray-600 mb-1 block">
                Product Slug (URL)
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => updateField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'))}
                placeholder="ex: samsung-galaxy-s25-ultra"
                className="w-full h-9 xxs:h-10 bg-[#f9f9f9] rounded-lg px-2 xxs:px-3 text-[13px] xxs:text-[14px] placeholder:text-[#a2a2a2] outline-none border border-gray-300 focus:border-blue-500"
              />
              <p className="text-[11px] text-gray-500 mt-1">URL-friendly name (lowercase, hyphens only)</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5 xxs:gap-2">
          <div className="flex items-center justify-between">
            <label className="text-[14px] xxs:text-[16px] font-medium text-black">
              Media<span className="text-[#da0000]">*</span>
            </label>
            <ChevronUp size={18} className="xxs:w-5 xxs:h-5" />
          </div>
          
          {/* Image Upload & Gallery */}
          <div 
            className={`rounded-lg p-2 xxs:p-3 sm:p-4 transition-colors border-2 ${
              isDragging 
                ? 'bg-blue-50 border-blue-400 border-dashed' 
                : 'bg-[#f9f9f9] border-transparent hover:bg-gray-50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Gallery Grid */}
            {allImages.length > 0 ? (
              <div className="space-y-3 xxs:space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs xxs:text-sm text-gray-600">{allImages.length}/20 images</span>
                  {allImages.length < 20 && (
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs xxs:text-sm text-[#ff9f1c] hover:underline flex items-center gap-1"
                    >
                      <Plus size={12} className="xxs:w-[14px] xxs:h-[14px]" /> Add More
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 xxs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 xxs:gap-3">
                  {allImages.map((img, idx) => (
                    <div 
                      key={idx} 
                      className={`relative group aspect-square rounded-lg overflow-hidden border-2 ${
                        idx === 0 ? 'border-[#ff9f1c] ring-2 ring-[#ff9f1c]/20' : 'border-gray-200'
                      }`}
                    >
                      <img src={normalizeImageUrl(img)} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                      {idx === 0 && (
                        <div className="absolute top-0.5 xxs:top-1 left-0.5 xxs:left-1 bg-[#ff9f1c] text-white text-[8px] xxs:text-[10px] px-1 xxs:px-1.5 py-0.5 rounded">
                          Main
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 xxs:gap-2">
                        {idx !== 0 && (
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleSetAsMain(idx); }}
                            className="w-5 h-5 xxs:w-7 xxs:h-7 bg-white text-gray-700 rounded-full flex items-center justify-center text-[10px] xxs:text-xs hover:bg-[#ff9f1c] hover:text-white transition-colors"
                            title="Set as Main"
                          >
                            ★
                          </button>
                        )}
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleRemoveImage(idx); }}
                          className="w-5 h-5 xxs:w-7 xxs:h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          title="Remove"
                        >
                          <X size={12} className="xxs:w-[14px] xxs:h-[14px]" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {allImages.length < 20 && (
                    <div className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-grid items-center justify-center gap-1 ml-1 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-gray-400 hover:text-[#ff9f1c] transition-colors"
                        title="Upload new image"
                      >
                        <Plus size={20} className="ml-4 xxs:w-6 xxs:h-6" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openGalleryPicker('gallery')}
                        className="text-gray-400 hover:text-[#ff9f1c] transition-colors"
                        title="Choose from gallery"
                      >
                        <FolderOpen size={16} className="xxs:w-5 xxs:h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-3 xxs:py-4 sm:py-6 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-[50px] h-[50px] xxs:w-[60px] xxs:h-[60px] sm:w-[76px] sm:h-[76px] mb-2 xxs:mb-3">
                  <Upload className="w-full h-full text-[#a2a2a2]" />
                </div>
                <p className="text-[13px] xxs:text-[14px] sm:text-[16px] text-[#a2a2a2] text-center">
                  Drag & drop images, or click to add.
                </p>
                <p className="text-[10px] xxs:text-[11px] sm:text-[12px] text-[#a2a2a2] text-center mt-1">
                  JPG, PNG (max 4MB). Up to 20 images.
                </p>
                <div className="flex flex-wrap gap-2 mt-3 xxs:mt-4">
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    className="bg-[#ff9f1c] text-white px-3 xxs:px-4 py-1.5 xxs:py-2 rounded-lg text-[12px] xxs:text-[14px] font-semibold"
                  >
                    Add Product Image
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); unfilteredFileInputRef.current?.click(); }}
                    className="bg-emerald-600 text-white px-3 xxs:px-4 py-1.5 xxs:py-2 rounded-lg text-[12px] xxs:text-[14px] font-semibold flex items-center gap-1.5 hover:bg-emerald-700 transition-colors"
                  >
                    <Scan size={14} />
                    Unfiltered Real Image
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); openGalleryPicker('gallery'); }}
                    className="bg-gray-100 text-gray-700 px-3 xxs:px-4 py-1.5 xxs:py-2 rounded-lg text-[12px] xxs:text-[14px] font-semibold flex items-center gap-1.5 hover:bg-gray-200 transition-colors"
                  >
                    <FolderOpen size={14} />
                    Choose From Gallery
                  </button>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef as React.RefObject<HTMLInputElement>}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <input
              ref={unfilteredFileInputRef as React.RefObject<HTMLInputElement>}
              type="file"
              accept="image/*"
              multiple
              onChange={handleUnfilteredImageUpload}
              className="hidden"
            />
          </div>

          {/* Unfiltered Real Images Section */}
          {(formData.unfilteredImages.length > 0 || allImages.length > 0) && (
            <div className="mt-3 xxs:mt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[13px] xxs:text-[14px] font-medium text-gray-700 flex items-center gap-1.5">
                  <Scan size={14} className="text-emerald-600" />
                  Unfiltered Real Images
                </label>
                <button
                  type="button"
                  onClick={() => unfilteredFileInputRef.current?.click()}
                  className="text-xs xxs:text-sm text-emerald-600 hover:underline flex items-center gap-1"
                >
                  <Plus size={12} className="xxs:w-[14px] xxs:h-[14px]" /> Add Authentic Shot
                </button>
              </div>
              {formData.unfilteredImages.length > 0 ? (
                <div className="grid grid-cols-3 xxs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 xxs:gap-3">
                  {formData.unfilteredImages.map((img, idx) => (
                    <div 
                      key={idx} 
                      className="relative group aspect-square rounded-lg overflow-hidden border-2 border-emerald-400 ring-2 ring-emerald-400/20"
                    >
                      <img src={normalizeImageUrl(img.url)} alt={`Authentic ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute top-0.5 xxs:top-1 left-0.5 xxs:left-1 bg-emerald-600 text-white text-[7px] xxs:text-[9px] px-1 xxs:px-1.5 py-0.5 rounded">
                        Authentic Shot
                      </div>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleRemoveUnfilteredImage(idx); }}
                          className="w-5 h-5 xxs:w-7 xxs:h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          title="Remove"
                        >
                          <X size={12} className="xxs:w-[14px] xxs:h-[14px]" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] xxs:text-[12px] text-gray-400 italic">No authentic/unfiltered images added yet.</p>
              )}
            </div>
          )}

          {/* Video URL */}
          <div className="relative">
            <Youtube size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a2a2a2]" />
            <input
              type="text"
              value={formData.videoUrl}
              onChange={(e) => updateField('videoUrl', e.target.value)}
              placeholder="Past YouTube Video Link (Optional)"
              className="w-full h-10 bg-[#f9f9f9] rounded-lg pl-9 pr-3 text-[14px] placeholder:text-[#a2a2a2] outline-none"
            />
          </div>
        </div>

        {/* Product Description */}
        <div className="flex flex-col gap-2">
          <RichTextEditor
            label="Product Description"
            value={formData.description}
            onChange={(v) => updateField('description', v)}
            placeholder="Enter product description..."
            minHeight="min-h-[200px]"
          />
        </div>

        {/* Short Description */}
        <div className="flex flex-col gap-2">
          <RichTextEditor
            label="Short Description"
            value={formData.shortDescription}
            onChange={(v) => updateField('shortDescription', v)}
            placeholder="Ex: Short Description"
            minHeight="min-h-[100px]"
          />
        </div>
      </div>
    </Section>
  );
};

export default React.memo(GeneralInfoSection);
