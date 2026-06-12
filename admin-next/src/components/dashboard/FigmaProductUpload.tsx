import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { GalleryPicker } from '../GalleryPicker';
import { FigmaProductUploadProps } from './product-upload/types';
import { useProductForm } from './product-upload/useProductForm';
import GeneralInfoSection from './product-upload/GeneralInfoSection';
import PricingSection from './product-upload/PricingSection';
import InventorySection from './product-upload/InventorySection';
import VariantsSection from './product-upload/VariantsSection';
import BrandSection from './product-upload/BrandSection';
import KeyFeaturesSection from './product-upload/KeyFeaturesSection';
import AffiliateSection from './product-upload/AffiliateSection';
import ShippingSection from './product-upload/ShippingSection';
import SeoSection from './product-upload/SeoSection';
import ProductSidebar from './product-upload/ProductSidebar';
import CatalogModal from './product-upload/CatalogModal';

const FigmaProductUpload: React.FC<FigmaProductUploadProps> = ({
  categories,
  subCategories = [],
  childCategories = [],
  brands,
  tags = [],
  onAddProduct,
  onBack,
  onNavigate,
  editProduct,
}) => {
  const {
    formData,
    isDragging,
    uploadingVariantImage,
    uploadingCatalogImage,
    showCatalogModal,
    setShowCatalogModal,
    catalogModalTab,
    setCatalogModalTab,
    newCatalogItem,
    setNewCatalogItem,
    savingCatalog,
    showGalleryPicker,
    setShowGalleryPicker,
    galleryPickerTarget,
    setGalleryPickerTarget,
    galleryPickerVariantKey,
    setGalleryPickerVariantKey,
    localCategories,
    localSubCategories,
    localChildCategories,
    localBrands,
    localTags,
    fileInputRef,
    unfilteredFileInputRef,
    variantImageRefs,
    catalogImageRef,
    updateField,
    openGalleryPicker,
    handleGallerySelect,
    handleGallerySelectMultiple,
    handleVariantImageUpload,
    handleRemoveVariantImage,
    handleImageUpload,
    handleUnfilteredImageUpload,
    handleRemoveUnfilteredImage,
    handleRemoveImage,
    handleSetAsMain,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleCatalogImageUpload,
    handleSaveCatalogItem,
    handleSaveDraft,
    handlePublish,
    allImages,
    completionItems,
    completionPercentage,
    getProgressColor,
    affiliateSources,
  } = useProductForm({
    categories,
    subCategories,
    childCategories,
    brands,
    tags,
    onAddProduct,
    onBack,
    editProduct,
  });

  return (
    <div className="min-h-screen bg-[#f9f9f9] pb-6 xxs:pb-8 font-['Lato']">
      {/* Header */}
      <div className="px-2 xxs:px-3 sm:px-4 lg:px-3 xl:px-4 py-3 xxs:py-4 sm:py-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors shadow-sm"
              title="Back to Products"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
          )}
          <h1 className="text-base xxs:text-lg sm:text-xl lg:text-[24px] font-bold text-black">Product Upload</h1>
        </div>
      </div>

      <div className="px-2 xxs:px-3 sm:px-4 lg:px-3 xl:px-4 flex flex-col lg:flex-row gap-3 xxs:gap-4 lg:gap-4 xl:gap-5">
        {/* Left Column - Form */}
        <div className="flex-1 space-y-3 xxs:space-y-4">
          <GeneralInfoSection
            formData={formData}
            updateField={updateField}
            isDragging={isDragging}
            allImages={allImages}
            fileInputRef={fileInputRef}
            unfilteredFileInputRef={unfilteredFileInputRef}
            handleDragOver={handleDragOver}
            handleDragLeave={handleDragLeave}
            handleDrop={handleDrop}
            handleImageUpload={handleImageUpload}
            handleUnfilteredImageUpload={handleUnfilteredImageUpload}
            handleRemoveImage={handleRemoveImage}
            handleRemoveUnfilteredImage={handleRemoveUnfilteredImage}
            handleSetAsMain={handleSetAsMain}
            openGalleryPicker={openGalleryPicker}
          />
          <PricingSection formData={formData} updateField={updateField} />
          <InventorySection formData={formData} updateField={updateField} />
          <VariantsSection
            formData={formData}
            updateField={updateField}
            variantImageRefs={variantImageRefs}
            uploadingVariantImage={uploadingVariantImage}
            handleVariantImageUpload={handleVariantImageUpload}
            handleRemoveVariantImage={handleRemoveVariantImage}
          />
          <BrandSection formData={formData} updateField={updateField} />
          <KeyFeaturesSection formData={formData} updateField={updateField} />
          <AffiliateSection formData={formData} updateField={updateField} affiliateSources={affiliateSources} />
          <ShippingSection formData={formData} updateField={updateField} />
          <SeoSection formData={formData} updateField={updateField} />
        </div>

        {/* Right Sidebar */}
        <ProductSidebar
          formData={formData}
          updateField={updateField}
          editProduct={editProduct}
          handleSaveDraft={handleSaveDraft}
          handlePublish={handlePublish}
          completionItems={completionItems}
          completionPercentage={completionPercentage}
          getProgressColor={getProgressColor}
          localCategories={localCategories}
          localSubCategories={localSubCategories}
          localChildCategories={localChildCategories}
          localBrands={localBrands}
          localTags={localTags}
          setCatalogModalTab={setCatalogModalTab}
          setShowCatalogModal={setShowCatalogModal}
        />
      </div>

      {/* Catalog Modal */}
      <CatalogModal
        showCatalogModal={showCatalogModal}
        setShowCatalogModal={setShowCatalogModal}
        catalogModalTab={catalogModalTab}
        setCatalogModalTab={setCatalogModalTab}
        newCatalogItem={newCatalogItem}
        setNewCatalogItem={setNewCatalogItem}
        savingCatalog={savingCatalog}
        localCategories={localCategories}
        localSubCategories={localSubCategories}
        catalogImageRef={catalogImageRef}
        uploadingCatalogImage={uploadingCatalogImage}
        handleCatalogImageUpload={handleCatalogImageUpload}
        handleSaveCatalogItem={handleSaveCatalogItem}
        openGalleryPicker={openGalleryPicker}
      />

      {/* Gallery Picker Modal */}
      <GalleryPicker
        isOpen={showGalleryPicker}
        onClose={() => {
          setShowGalleryPicker(false);
          setGalleryPickerTarget(null);
          setGalleryPickerVariantKey(null);
        }}
        onSelect={handleGallerySelect}
        multiple={galleryPickerTarget === 'gallery'}
        onSelectMultiple={galleryPickerTarget === 'gallery' ? handleGallerySelectMultiple : undefined}
        title={
          galleryPickerTarget === 'mainImage' ? 'Select Main Image' :
          galleryPickerTarget === 'gallery' ? 'Select Gallery Images' :
          galleryPickerTarget === 'variantImage' ? 'Select Variant Image' :
          'Select Image'
        }
      />
    </div>
  );
};

export default FigmaProductUpload;