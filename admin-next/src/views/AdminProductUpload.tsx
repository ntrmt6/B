import React, { useState, useEffect } from 'react';
import { ChevronRight, Save, Plus, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { Product, Category, SubCategory, ChildCategory, Brand, Tag } from '../types';
import GeneralInformationSection from '../components/ProductUpload/GeneralInformationSection';
import MediaSection from '../components/ProductUpload/MediaSection';
import DescriptionSection from '../components/ProductUpload/DescriptionSection';
import PricingSection from '../components/ProductUpload/PricingSection';
import InventorySection from '../components/ProductUpload/InventorySection';
import VariantsSection from '../components/ProductUpload/VariantsSection';
import BrandDetailsSection from '../components/ProductUpload/BrandDetailsSection';
import AffiliateSection from '../components/ProductUpload/AffiliateSection';
import ShippingSection from '../components/ProductUpload/ShippingSection';
import SEOSection from '../components/ProductUpload/SEOSection';
import PublishSidebar from '../components/ProductUpload/PublishSidebar';
import CatalogSidebar from '../components/ProductUpload/CatalogSidebar';
import { useAuth } from '../context/AuthContext';

interface AdminProductUploadProps {
  categories: Category[];
  subCategories: SubCategory[];
  childCategories: ChildCategory[];
  brands: Brand[];
  tags: Tag[];
  onAddProduct?: (product: Product) => void;
  onLogout?: () => void;
  onSwitchSection?: (section: string) => void;
  // New props for edit mode
  initialProduct?: Product | null;
  user?: { name?: string; tenantId?: string } | null;
  activeTenantId?: string;
  onCancel?: () => void;
  onSubmit?: (product: Product) => void;
}

interface FormData {
  name: string;
  slug: string;
  autoSlug: boolean;
  shortDescription: string;
  description: string;
  mainImage: string;
  videoUrl: string;
  galleryImages: string[];
  regularPrice: number;
  salesPrice: number;
  costPrice: number;
  quantity: number;
  quantityAlert: number;
  unitName: string;
  warranty: string;
  sku: string;
  barcode: string;
  initialStock: number;
  stockDate: string;
  locationSlot: string;
  variantsMandatory: boolean;
  variants: any[];
  brand: string;
  details: { title: string; description: string }[];
  affiliateSource: string;
  sourceProductUrl: string;
  sourceSku: string;
  deliveryCharge: number;
  deliveryByCity: { city: string; charge: number }[];
  keywords: string;
  metaDescription: string;
  metaTitle: string;
  category: string;
  subCategory: string;
  childCategory: string;
  categories: string[];
  subCategories: string[];
  childCategories: string[];
  brands: string[];
  condition: string;
  tags: string[];
}

const AdminProductUpload: React.FC<AdminProductUploadProps> = ({
  categories,
  subCategories,
  childCategories,
  brands,
  tags,
  onAddProduct,
  onLogout,
  onSwitchSection,
  initialProduct,
  user: propsUser,
  activeTenantId,
  onCancel,
  onSubmit
}) => {
  const { user: authUser } = useAuth();
  const user = propsUser || authUser;
  const tenantId = activeTenantId || user?.tenantId || '';

  const [formData, setFormData] = useState<FormData>({
    name: '',
    slug: '',
    autoSlug: true,
    shortDescription: '',
    description: '',
    mainImage: '',
    videoUrl: '',
    galleryImages: [],
    regularPrice: 0,
    salesPrice: 0,
    costPrice: 0,
    quantity: 0,
    quantityAlert: 0,
    unitName: '',
    warranty: '',
    sku: '',
    barcode: '',
    initialStock: 0,
    stockDate: new Date().toISOString().split('T')[0],
    locationSlot: '',
    variantsMandatory: false,
    variants: [],
    brand: '',
    details: [],
    affiliateSource: '',
    sourceProductUrl: '',
    sourceSku: '',
    deliveryCharge: 0,
    deliveryByCity: [],
    keywords: '',
    metaDescription: '',
    metaTitle: '',
    category: '',
    subCategory: '',
    childCategory: '',
    categories: [],
    subCategories: [],
    childCategories: [],
    brands: [],
    condition: 'New',
    tags: []
  });

  const [completionPercentage, setCompletionPercentage] = useState(0);

  // Load initial product data when editing
  useEffect(() => {
    if (initialProduct) {
      setFormData(prev => ({
        ...prev,
        name: initialProduct.name || '',
        slug: initialProduct.slug || '',
        shortDescription: initialProduct.shortDescription || '',
        description: initialProduct.description || '',
        mainImage: initialProduct.image || '',
        galleryImages: initialProduct.galleryImages || [],
        regularPrice: initialProduct.originalPrice || 0,
        salesPrice: initialProduct.price || 0,
        costPrice: initialProduct.costPrice || 0,
        quantity: initialProduct.stock || 0,
        sku: initialProduct.sku || '',
        brand: initialProduct.brand || '',
        category: initialProduct.category || '',
        subCategory: initialProduct.subCategory || '',
        childCategory: initialProduct.childCategory || '',
        categories: initialProduct.categories || (initialProduct.category ? [initialProduct.category] : []),
        subCategories: initialProduct.subCategories || (initialProduct.subCategory ? [initialProduct.subCategory] : []),
        childCategories: initialProduct.childCategories || (initialProduct.childCategory ? [initialProduct.childCategory] : []),
        brands: initialProduct.brands || (initialProduct.brand ? [initialProduct.brand] : []),
        condition: initialProduct.condition || 'New',
        tags: initialProduct.tags || []
      }));
    }
  }, [initialProduct]);

  // Calculate completion percentage
  useEffect(() => {
    const requiredFields = [
      formData.categories?.length ? formData.categories[0] : formData.category,
      formData.mainImage,
      formData.name,
      formData.salesPrice,
      formData.brand
    ];
    const completed = requiredFields.filter(field => field).length;
    setCompletionPercentage(Math.round((completed / requiredFields.length) * 100));
  }, [formData.category, formData.mainImage, formData.name, formData.salesPrice, formData.brand]);

  const handleFormChange = (section: string, data: any) => {
    setFormData(prev => ({
      ...prev,
      ...data
    }));
  };

  const handleSaveDraft = () => {
    const draftProduct: Product = {
      id: initialProduct?.id || Date.now(),
      name: formData.name || 'Untitled Draft',
      slug: formData.slug || `draft-${Date.now()}`,
      description: formData.description,
      image: formData.mainImage,
      galleryImages: formData.galleryImages,
      price: formData.salesPrice || 0,
      originalPrice: formData.regularPrice || 0,
      costPrice: formData.costPrice || 0,
      category: formData.categories?.[0] || formData.category,
      subCategory: formData.subCategories?.[0] || formData.subCategory,
      childCategory: formData.childCategories?.[0] || formData.childCategory,
      brand: formData.brands?.[0] || formData.brand,
      categories: formData.categories,
      subCategories: formData.subCategories,
      childCategories: formData.childCategories,
      brands: formData.brands,
      sku: formData.sku,
      stock: formData.quantity || 0,
      colors: initialProduct?.colors || [],
      sizes: initialProduct?.sizes || [],
      status: 'Draft',
      tags: formData.tags,
      shortDescription: formData.shortDescription || '',
      condition: '',
      coins: undefined,
      sold: undefined,
      title: '',
      salePrice: undefined
    };

    if (onSubmit) {
      onSubmit(draftProduct);
      toast.success('Draft saved successfully');
    } else if (onAddProduct) {
      onAddProduct(draftProduct);
      toast.success('Draft saved successfully');
    } else {
      const drafts = JSON.parse(localStorage.getItem(`drafts_${tenantId}`) || '[]');
      const draftId = `draft_${Date.now()}`;
      drafts.push({
        id: draftId,
        data: formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      localStorage.setItem(`drafts_${tenantId}`, JSON.stringify(drafts));
      toast.success('Draft saved to local storage');
    }
  };

  const handleAddProduct = async () => {
    if (!formData.name || (!formData.category && !formData.categories?.length) || !formData.mainImage || !formData.salesPrice) {
      toast.error('Please fill all required fields');
      return;
    }

    const newProduct: Product = {
      id: initialProduct?.id || Date.now(),
      name: formData.name,
      slug: formData.slug,
      description: formData.description,
      image: formData.mainImage,
      galleryImages: formData.galleryImages,
      price: formData.salesPrice,
      originalPrice: formData.regularPrice,
      costPrice: formData.costPrice,
      category: formData.categories?.[0] || formData.category,
      subCategory: formData.subCategories?.[0] || formData.subCategory,
      childCategory: formData.childCategories?.[0] || formData.childCategory,
      brand: formData.brands?.[0] || formData.brand,
      categories: formData.categories,
      subCategories: formData.subCategories,
      childCategories: formData.childCategories,
      brands: formData.brands,
      sku: formData.sku,
      stock: formData.quantity,
      colors: initialProduct?.colors || [],
      sizes: initialProduct?.sizes || [],
      status: initialProduct?.status || 'Active',
      tags: formData.tags,
      shortDescription: formData.shortDescription || '',
      condition: '',
      coins: undefined,
      sold: undefined,
      title: '',
      salePrice: undefined
    };

    if (onSubmit) {
      onSubmit(newProduct);
    } else if (onAddProduct) {
      onAddProduct(newProduct);
      toast.success(initialProduct ? 'Product updated successfully' : 'Product added successfully');
    }
    // Reset form
    setFormData({
      name: '', slug: '', autoSlug: true, shortDescription: '', description: '',
      mainImage: '', videoUrl: '', galleryImages: [], regularPrice: 0, salesPrice: 0,
      costPrice: 0, quantity: 0, quantityAlert: 0, unitName: '', warranty: '',
      sku: '', barcode: '', initialStock: 0, stockDate: new Date().toISOString().split('T')[0],
      locationSlot: '', variantsMandatory: false, variants: [], brand: '', details: [],
      affiliateSource: '', sourceProductUrl: '', sourceSku: '', deliveryCharge: 0,
      deliveryByCity: [], keywords: '', metaDescription: '', metaTitle: '',
      category: '', subCategory: '', childCategory: '', categories: [], subCategories: [], childCategories: [], brands: [], condition: 'New', tags: []
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Responsive */}
      <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
          {/* Breadcrumb - hide on very small, show condensed */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600 overflow-x-auto">
            <span className="hidden sm:inline whitespace-nowrap">Welcome Back, {user?.name}</span>
            <ChevronRight size={14} className="hidden sm:block flex-shrink-0" />
            <span className="text-gray-400 whitespace-nowrap">Products</span>
            <ChevronRight size={14} className="flex-shrink-0" />
            <span className="font-semibold text-gray-900 whitespace-nowrap">{initialProduct ? 'Edit' : 'Upload'}</span>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors self-start"
            >
              <ArrowLeft size={16} />
              <span className="hidden xs:inline">Back to Products</span>
              <span className="xs:hidden">Back</span>
            </button>
          )}
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{initialProduct ? 'Edit Product' : 'Add New Product'}</h1>
      </div>

      {/* Mobile: Publish actions at top (sticky) */}
      <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-3 py-2 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-full bg-gray-200 rounded-full h-2 max-w-[120px]">
              <div className={`h-2 rounded-full transition-all duration-300 ${completionPercentage < 30 ? 'bg-yellow-500' : completionPercentage <= 80 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${completionPercentage}%` }} />
            </div>
            <span className="text-xs font-medium text-gray-500">{completionPercentage}%</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleSaveDraft} className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition flex items-center gap-1.5">
              <Save size={14} /> Draft
            </button>
            <button
              onClick={handleAddProduct}
              disabled={completionPercentage < 80}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={14} /> Publish
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Responsive grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 p-3 sm:p-6">
        {/* Left Column - Form sections */}
        <div className="lg:col-span-3 space-y-4 sm:space-y-6">
          <GeneralInformationSection
            data={formData}
            onChange={(data) => handleFormChange('general', data)}
          />
          <MediaSection
            data={formData}
            tenantId={tenantId}
            onChange={(data) => handleFormChange('media', data)}
          />
          <DescriptionSection
            data={formData}
            onChange={(data) => handleFormChange('description', data)}
          />
          <PricingSection
            data={formData}
            onChange={(data) => handleFormChange('pricing', data)}
          />
          <InventorySection
            data={formData}
            onChange={(data) => handleFormChange('inventory', data)}
          />
          <VariantsSection
            data={formData}
            onChange={(data) => handleFormChange('variants', data)}
          />
          <BrandDetailsSection
            data={formData}
            brands={brands}
            onChange={(data) => handleFormChange('brandDetails', data)}
          />
          <AffiliateSection
            data={formData}
            onChange={(data) => handleFormChange('affiliate', data)}
          />
          <ShippingSection
            data={formData}
            onChange={(data) => handleFormChange('shipping', data)}
          />
          <SEOSection
            data={formData}
            onChange={(data) => handleFormChange('seo', data)}
          />
        </div>

        {/* Right Column - Sidebar (hidden on mobile, shown on lg+) */}
        <div className="hidden lg:block lg:col-span-1 space-y-6">
          <PublishSidebar
            completionPercentage={completionPercentage}
            onDraft={handleSaveDraft}
            onPublish={handleAddProduct}
          />
          <CatalogSidebar
            categories={categories}
            subCategories={subCategories}
            childCategories={childCategories}
            brands={brands}
            tags={tags}
            data={formData}
            onChange={(data) => handleFormChange('catalog', data)}
          />
        </div>

        {/* Mobile: Catalog section inline (shown below lg) */}
        <div className="lg:hidden space-y-4">
          <CatalogSidebar
            categories={categories}
            subCategories={subCategories}
            childCategories={childCategories}
            brands={brands}
            tags={tags}
            data={formData}
            onChange={(data) => handleFormChange('catalog', data)}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminProductUpload;
