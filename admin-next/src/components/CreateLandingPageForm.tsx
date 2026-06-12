import React, { useState, useRef } from 'react';
import { Search, ChevronLeft, Trash2, Plus, Minus, Upload, Star, Calendar, DollarSign, Image, Type, FileText, MessageCircle, Video, Palette } from 'lucide-react';
import { Product } from '../types';
import { getStoredToken } from '../services/authService';

// Types - Exported for external use
export interface BenefitItem {
  id: string;
  text: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface ReviewItem {
  id: string;
  name: string;
  quote: string;
  rating: number;
  image?: string;
}

export interface LandingPageFormData {
  productId: number | null;
  productTitle: string;
  imageUrl: string;
  productImages: string[];
  description: string;
  price?: number;
  originalPrice?: number;
  offerEndDate: string;
  productOfferInfo: string;
  paymentSectionTitle: string;
  benefits: BenefitItem[];
  whyBuySection: string;
  faqs: FAQItem[];
  faqHeadline: string;
  reviews: ReviewItem[];
  reviewHeadline: string;
  videoLink: string;
  backgroundColor: string;
  textColor: string;
  urlSlug: string;
  status: 'draft' | 'published';
}

export interface CreateLandingPageFormProps {
  products: Product[];
  tenantId?: string;
  onSave: (data: LandingPageFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<LandingPageFormData>;
}

// Helper to generate unique IDs
const generateId = () => crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

// Section Header Component
const SectionHeader: React.FC<{
  title: string;
  isCollapsed: boolean;
  onToggle: () => void;
}> = ({ title, isCollapsed, onToggle }) => (
  <div className="flex items-center justify-between w-full">
    <p className="font-bold text-[#023337] text-[20px]">{title}</p>
    <button
      type="button"
      onClick={onToggle}
      className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600"
    >
      <Minus size={20} />
    </button>
  </div>
);

// Input Field Component
const InputField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}> = ({ label, value, onChange, placeholder = 'Enter Text', required = false, type = 'text' }) => (
  <div className="flex flex-col gap-3 w-full">
    <p className="font-bold text-[#023337] text-[15px]">
      {label}
      {required && <span className="text-[#da0000]">*</span>}
    </p>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg px-3 py-2.5 text-[15px] text-gray-900 placeholder-[#aeaeae] focus:outline-none focus:ring-2 focus:ring-blue-200"
    />
  </div>
);

// Image Upload Button Component
const ImageUploadButton: React.FC<{
  label: string;
  imageUrl: string;
  onUpload: (url: string) => void;
  aspectRatio?: string;
}> = ({ label, imageUrl, onUpload, aspectRatio = '1:1.6 aspect ratio (855×1386 pixels)' }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const token = getStoredToken();
      const response = await fetch(`${API_BASE_URL}/api/cloudflare/upload`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        onUpload(data.url);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <p className="font-bold text-[#023337] text-[15px]">{label}</p>
      <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-3 flex flex-col items-center justify-center">
        <div className="flex flex-col gap-3 items-center w-full max-w-[320px]">
          {imageUrl ? (
            <img src={imageUrl} alt="Uploaded" className="w-[76px] h-[76px] object-cover rounded-lg" />
          ) : (
            <div className="w-[76px] h-[76px] bg-gray-200 rounded-lg flex items-center justify-center">
              <Upload size={32} className="text-gray-400" />
            </div>
          )}
          <p className="text-[#a2a2a2] text-[12px] text-center">
            Note: Use images with a {aspectRatio}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-[#ff9f1c] text-white font-semibold text-[14px] px-4 py-2 rounded-lg hover:bg-[#e8901a] disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : 'Add Image'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Icon Upload Button (smaller version)
const IconUploadButton: React.FC<{
  iconUrl: string;
  onUpload: (url: string) => void;
}> = ({ iconUrl, onUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const token = getStoredToken();
      const response = await fetch(`${API_BASE_URL}/api/cloudflare/upload`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        onUpload(data.url);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="font-bold text-[#023337] text-[15px]">Icon</p>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg w-12 h-12 flex items-center justify-center hover:border-blue-300"
      >
        {iconUrl ? (
          <img src={iconUrl} alt="Icon" className="w-8 h-8 object-contain" />
        ) : (
          <Upload size={20} className="text-gray-400" />
        )}
      </button>
    </div>
  );
};

// Product Images Upload Component
const ProductImagesUpload: React.FC<{
  images: string[];
  onAddImage: (url: string) => void;
  maxImages: number;
}> = ({ images, onAddImage, maxImages }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || images.length >= maxImages) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const token = getStoredToken();
      const response = await fetch(`${API_BASE_URL}/api/cloudflare/upload`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        onAddImage(data.url);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-3 flex flex-col items-center justify-center">
      <div className="flex flex-col gap-3 items-center w-full max-w-[320px]">
        {images.length > 0 ? (
          <div className="flex gap-2 flex-wrap justify-center">
            {images.map((img, index) => (
              <img key={index} src={img} alt="" className="w-16 h-16 object-cover rounded" />
            ))}
          </div>
        ) : (
          <div className="w-[76px] h-[76px] bg-gray-200 rounded-lg flex items-center justify-center">
            <Upload size={32} className="text-gray-400" />
          </div>
        )}
        <p className="text-[#a2a2a2] text-[12px] text-center">
          Note: Use images with a 1:1.6 aspect ratio (855×1386 pixels.)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || images.length >= maxImages}
          className="bg-[#ff9f1c] text-white font-semibold text-[14px] px-4 py-2 rounded-lg hover:bg-[#e8901a] disabled:opacity-50"
        >
          {isUploading ? 'Uploading...' : 'Add Image'}
        </button>
      </div>
    </div>
  );
};

// Main Component
export const CreateLandingPageForm: React.FC<CreateLandingPageFormProps> = ({
  products,
  tenantId,
  onSave,
  onCancel,
  initialData
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Collapsed sections state
  const [collapsedSections, setCollapsedSections] = useState({
    basic: false,
    offer: false,
    benefits: false,
    faq: false,
    review: false,
    video: false,
    theme: false
  });

  // Default offer end date - 7 days from now
  const defaultEndDate = new Date();
  defaultEndDate.setDate(defaultEndDate.getDate() + 7);

  // Form data - aligned with backend model
  const [formData, setFormData] = useState<LandingPageFormData>({
    productId: initialData?.productId ?? null,
    productTitle: initialData?.productTitle ?? '',
    imageUrl: initialData?.imageUrl ?? '',
    productImages: initialData?.productImages ?? [],
    description: initialData?.description ?? '',
    price: initialData?.price,
    originalPrice: initialData?.originalPrice,
    offerEndDate: initialData?.offerEndDate ?? defaultEndDate.toISOString().split('T')[0],
    productOfferInfo: initialData?.productOfferInfo ?? '',
    paymentSectionTitle: initialData?.paymentSectionTitle ?? '',
    benefits: initialData?.benefits ?? [
      { id: generateId(), text: '' }
    ],
    whyBuySection: initialData?.whyBuySection ?? '',
    faqHeadline: initialData?.faqHeadline ?? 'Frequently Asked Questions',
    faqs: initialData?.faqs ?? [
      { id: generateId(), question: '', answer: '' }
    ],
    reviewHeadline: initialData?.reviewHeadline ?? 'Customer Reviews',
    reviews: initialData?.reviews ?? [
      { id: generateId(), name: '', quote: '', rating: 5 }
    ],
    videoLink: initialData?.videoLink ?? '',
    backgroundColor: initialData?.backgroundColor ?? '#FFFFFF',
    textColor: initialData?.textColor ?? '#000000',
    urlSlug: initialData?.urlSlug ?? '',
    status: initialData?.status ?? 'draft'
  });

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSection = (section: keyof typeof collapsedSections) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Generate URL slug from product title
  const generateSlug = (title: string) => {
    return title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // Benefit handlers
  const addBenefit = () => {
    setFormData(prev => ({
      ...prev,
      benefits: [...prev.benefits, { id: generateId(), text: '' }]
    }));
  };

  const updateBenefit = (id: string, text: string) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.map(b => b.id === id ? { ...b, text } : b)
    }));
  };

  const removeBenefit = (id: string) => {
    if (formData.benefits.length > 1) {
      setFormData(prev => ({
        ...prev,
        benefits: prev.benefits.filter(b => b.id !== id)
      }));
    }
  };

  // FAQ handlers
  const addFAQ = () => {
    setFormData(prev => ({
      ...prev,
      faqs: [...prev.faqs, { id: generateId(), question: '', answer: '' }]
    }));
  };

  const updateFAQ = (id: string, field: keyof FAQItem, value: string) => {
    setFormData(prev => ({
      ...prev,
      faqs: prev.faqs.map(f => f.id === id ? { ...f, [field]: value } : f)
    }));
  };

  const removeFAQ = (id: string) => {
    if (formData.faqs.length > 1) {
      setFormData(prev => ({
        ...prev,
        faqs: prev.faqs.filter(f => f.id !== id)
      }));
    }
  };

  // Review handlers
  const addReview = () => {
    setFormData(prev => ({
      ...prev,
      reviews: [...prev.reviews, { id: generateId(), name: '', quote: '', rating: 5 }]
    }));
  };

  const updateReview = (id: string, field: keyof ReviewItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      reviews: prev.reviews.map(r => r.id === id ? { ...r, [field]: value } : r)
    }));
  };

  const removeReview = (id: string) => {
    if (formData.reviews.length > 1) {
      setFormData(prev => ({
        ...prev,
        reviews: prev.reviews.filter(r => r.id !== id)
      }));
    }
  };

  // Product image handlers
  const addProductImage = (url: string) => {
    if (formData.productImages.length < 4) {
      setFormData(prev => ({
        ...prev,
        productImages: [...prev.productImages, url]
      }));
    }
  };

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleSubmit = async (status: 'draft' | 'published') => {
    // Validate required fields
    const errors: string[] = [];
    if (!formData.productTitle?.trim()) {
      errors.push('Product title is required');
    }
    if (!formData.imageUrl?.trim()) {
      errors.push('Main image is required');
    }
    if (!formData.description?.trim()) {
      errors.push('Description is required');
    }
    if (!formData.offerEndDate) {
      errors.push('Offer end date is required');
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);
    setIsSaving(true);
    try {
      await onSave({ ...formData, status });
    } catch (error) {
      console.error('Error saving:', error);
      setValidationErrors([error instanceof Error ? error.message : 'Failed to save landing page']);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden min-h-screen">
      {/* Back Button */}
      <div className="px-4 py-4 sm:py-6">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-4 pb-6">
        <div className="bg-[#f2f2f2] rounded-lg flex items-center px-3 py-2">
          <Search size={20} className="text-gray-400 mr-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Product Name"
            className="flex-1 bg-transparent text-[12px] text-gray-600 placeholder-[#a2a2a2] outline-none"
          />
          <span className="text-[12px] text-black cursor-pointer">Search</span>
        </div>
        
        {/* Product search results */}
        {searchQuery && (
          <div className="mt-2 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <p className="p-3 text-gray-500 text-sm">No products found</p>
            ) : (
              filteredProducts.slice(0, 5).map(product => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ 
                      ...prev, 
                      productId: product.id,
                      productTitle: product.name,
                      imageUrl: product.image || '',
                      price: product.price,
                      originalPrice: product.originalPrice || product.price,
                      urlSlug: generateSlug(product.name)
                    }));
                    setSearchQuery('');
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                >
                  {product.image && (
                    <img src={product.image} alt="" className="w-8 h-8 object-cover rounded" />
                  )}
                  <span className="text-sm">{product.name}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="px-4 space-y-8">
        {/* Basic Info Section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Type className="text-[#023337]" size={20} />
            <p className="font-bold text-[#023337] text-[20px]">Basic Information</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Product Title"
              value={formData.productTitle}
              onChange={(value) => setFormData(prev => ({ 
                ...prev, 
                productTitle: value,
                urlSlug: prev.urlSlug || generateSlug(value)
              }))}
              placeholder="Enter product title"
              required
            />
            <InputField
              label="URL Slug"
              value={formData.urlSlug}
              onChange={(value) => setFormData(prev => ({ ...prev, urlSlug: value }))}
              placeholder="product-url-slug"
              required
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <ImageUploadButton
                label="Main Image"
                imageUrl={formData.imageUrl}
                onUpload={(url) => setFormData(prev => ({ ...prev, imageUrl: url }))}
              />
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex flex-col gap-3">
                <p className="font-bold text-[#023337] text-[15px]">Description<span className="text-[#da0000]">*</span></p>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter product description"
                  rows={4}
                  className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg px-3 py-2.5 text-[15px] text-gray-900 placeholder-[#aeaeae] focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Price and Offer Section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <DollarSign className="text-[#023337]" size={20} />
            <p className="font-bold text-[#023337] text-[20px]">Pricing & Offer</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField
              label="Sale Price"
              value={formData.price?.toString() || ''}
              onChange={(value) => setFormData(prev => ({ ...prev, price: parseFloat(value) || undefined }))}
              placeholder="0.00"
              type="number"
            />
            <InputField
              label="Original Price"
              value={formData.originalPrice?.toString() || ''}
              onChange={(value) => setFormData(prev => ({ ...prev, originalPrice: parseFloat(value) || undefined }))}
              placeholder="0.00"
              type="number"
            />
            <div className="flex flex-col gap-3">
              <p className="font-bold text-[#023337] text-[15px]">
                Offer End Date
                <span className="text-[#da0000]">*</span>
              </p>
              <input
                type="date"
                value={formData.offerEndDate}
                onChange={(e) => setFormData(prev => ({ ...prev, offerEndDate: e.target.value }))}
                className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg px-3 py-2.5 text-[15px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="font-bold text-[#023337] text-[15px]">Offer Details (HTML supported)</p>
            <textarea
              value={formData.productOfferInfo}
              onChange={(e) => setFormData(prev => ({ ...prev, productOfferInfo: e.target.value }))}
              placeholder="Enter offer details, special discounts, etc."
              rows={3}
              className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg px-3 py-2.5 text-[15px] text-gray-900 placeholder-[#aeaeae] focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
            />
          </div>

          <div className="flex flex-col gap-3">
            <p className="font-bold text-[#023337] text-[15px]">Payment Section Title (HTML supported)</p>
            <textarea
              value={formData.paymentSectionTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentSectionTitle: e.target.value }))}
              placeholder="Custom payment section heading"
              rows={2}
              className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg px-3 py-2.5 text-[15px] text-gray-900 placeholder-[#aeaeae] focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
            />
          </div>
        </div>

        {/* Benefits Section */}
        <div className="flex flex-col gap-4 items-end">
          <SectionHeader
            title="Product Benefits"
            isCollapsed={collapsedSections.benefits}
            onToggle={() => toggleSection('benefits')}
          />
          
          {!collapsedSections.benefits && (
            <>
              <div className="flex flex-col gap-3 w-full">
                {formData.benefits.map((benefit, index) => (
                  <div key={benefit.id} className="flex gap-4 items-start">
                    <div className="flex-1">
                      <InputField
                        label={`Benefit ${index + 1}`}
                        value={benefit.text}
                        onChange={(value) => updateBenefit(benefit.id, value)}
                        placeholder="Enter benefit text"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBenefit(benefit.id)}
                      className="mt-9 text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addBenefit}
                className="bg-[#ff9f1c] text-white font-semibold text-[14px] px-4 py-2 rounded-lg hover:bg-[#e8901a]"
              >
                Add More
              </button>
            </>
          )}
        </div>

        {/* Why Buy Section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <FileText className="text-[#023337]" size={20} />
            <p className="font-bold text-[#023337] text-[20px]">Why Buy From Us</p>
          </div>
          <div className="flex flex-col gap-3">
            <p className="font-bold text-[#023337] text-[15px]">Content (HTML supported)</p>
            <textarea
              value={formData.whyBuySection}
              onChange={(e) => setFormData(prev => ({ ...prev, whyBuySection: e.target.value }))}
              placeholder="Enter why customers should buy from you"
              rows={4}
              className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg px-3 py-2.5 text-[15px] text-gray-900 placeholder-[#aeaeae] focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
            />
          </div>
        </div>

        {/* Product Images Section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image className="text-[#023337]" size={20} />
              <p className="font-bold text-[#023337] text-[15px]">Additional Product Images</p>
            </div>
            <p className="font-bold text-[#023337] text-[15px]">({formData.productImages.length}/4)</p>
          </div>
          <ProductImagesUpload
            images={formData.productImages}
            onAddImage={addProductImage}
            maxImages={4}
          />
        </div>

        {/* FAQ Section */}
        <div className="flex flex-col gap-4 items-end">
          <SectionHeader
            title="FAQ Section"
            isCollapsed={collapsedSections.faq}
            onToggle={() => toggleSection('faq')}
          />
          
          {!collapsedSections.faq && (
            <>
              <div className="w-full">
                <InputField
                  label="FAQ Headline"
                  value={formData.faqHeadline}
                  onChange={(value) => setFormData(prev => ({ ...prev, faqHeadline: value }))}
                />
              </div>
              
              <div className="flex flex-col gap-3 w-full">
                {formData.faqs.map((faq) => (
                  <div key={faq.id} className="flex gap-4 items-start">
                    <div className="flex-1">
                      <InputField
                        label="FAQ Question"
                        value={faq.question}
                        onChange={(value) => updateFAQ(faq.id, 'question', value)}
                      />
                    </div>
                    <div className="flex-1">
                      <InputField
                        label="FAQ Answer"
                        value={faq.answer}
                        onChange={(value) => updateFAQ(faq.id, 'answer', value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFAQ(faq.id)}
                      className="mt-9 text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addFAQ}
                className="bg-[#ff9f1c] text-white font-semibold text-[14px] px-4 py-2 rounded-lg hover:bg-[#e8901a]"
              >
                Add More
              </button>
            </>
          )}
        </div>

        {/* Review Section */}
        <div className="flex flex-col gap-4 items-end">
          <SectionHeader
            title="Review Section"
            isCollapsed={collapsedSections.review}
            onToggle={() => toggleSection('review')}
          />
          
          {!collapsedSections.review && (
            <>
              <div className="w-full">
                <InputField
                  label="Review Headline"
                  value={formData.reviewHeadline}
                  onChange={(value) => setFormData(prev => ({ ...prev, reviewHeadline: value }))}
                />
              </div>
              
              <div className="flex flex-col gap-3 w-full">
                {formData.reviews.map((review) => (
                  <div key={review.id} className="flex gap-4 items-start">
                    <div className="flex-1">
                      <InputField
                        label="Name"
                        value={review.name}
                        onChange={(value) => updateReview(review.id, 'name', value)}
                      />
                    </div>
                    <div className="flex-1">
                      <InputField
                        label="Quote"
                        value={review.quote}
                        onChange={(value) => updateReview(review.id, 'quote', value)}
                      />
                    </div>
                    <div className="flex flex-col gap-3">
                      <p className="font-bold text-[#023337] text-[15px]">Rating</p>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={review.rating}
                        onChange={(e) => updateReview(review.id, 'rating', parseInt(e.target.value) || 5)}
                        className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg w-12 h-12 text-center text-[15px] text-[#aeaeae]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeReview(review.id)}
                      className="mt-9 text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addReview}
                className="bg-[#ff9f1c] text-white font-semibold text-[14px] px-4 py-2 rounded-lg hover:bg-[#e8901a]"
              >
                Add More
              </button>
            </>
          )}
        </div>

        {/* Video Section */}
        <div className="flex flex-col gap-4 items-end">
          <SectionHeader
            title="Video Section"
            isCollapsed={collapsedSections.video}
            onToggle={() => toggleSection('video')}
          />
          
          {!collapsedSections.video && (
            <div className="w-full">
              <InputField
                label="Video Link"
                value={formData.videoLink}
                onChange={(value) => setFormData(prev => ({ ...prev, videoLink: value }))}
              />
            </div>
          )}
        </div>

        {/* Theme Section */}
        <div className="flex flex-col gap-4 items-end">
          <SectionHeader
            title="Theme Section"
            isCollapsed={collapsedSections.theme}
            onToggle={() => toggleSection('theme')}
          />
          
          {!collapsedSections.theme && (
            <div className="flex gap-4 w-full">
              <div className="flex-1">
                <InputField
                  label="Background Colour"
                  value={formData.backgroundColor}
                  onChange={(value) => setFormData(prev => ({ ...prev, backgroundColor: value }))}
                  placeholder="#FFFFFF"
                />
              </div>
              <div className="flex-1">
                <InputField
                  label="Text Colour"
                  value={formData.textColor}
                  onChange={(value) => setFormData(prev => ({ ...prev, textColor: value }))}
                  placeholder="#000000"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="font-semibold text-red-700 mb-2">Please fix the following errors:</p>
            <ul className="list-disc list-inside text-red-600 text-sm space-y-1">
              {validationErrors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="px-4 py-8 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => handleSubmit('draft')}
          disabled={isSaving}
          className="flex-1 max-w-[180px] bg-[#f9f9f9] text-[#070606] font-semibold text-[14px] px-2 py-3 rounded-lg flex items-center justify-center gap-1 hover:bg-gray-200 disabled:opacity-50"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 12H15M9 16H12M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Draft
        </button>
        <button
          type="button"
          onClick={() => handleSubmit('published')}
          disabled={isSaving}
          className="flex-1 max-w-[180px] bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] text-white font-semibold text-[15px] px-2 py-3 rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Publish'}
        </button>
      </div>
    </div>
  );
};

export default CreateLandingPageForm;
