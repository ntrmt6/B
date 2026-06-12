import React, { useState, useEffect, useRef } from 'react';
import {
  X, Image as ImageIcon, Plus, Trash2,
  RefreshCw, ChevronDown, Minus, ScanLine,
  FolderOpen, Youtube, Layout, Grid, Layers, FileText, Loader2
} from 'lucide-react';
import { Product, Category, SubCategory, ChildCategory, Brand, Tag, User } from '../types';
import toast from 'react-hot-toast';
import { uploadImageToServer, deleteImageFromServer } from '../services/imageUploadService';
import { slugify } from '../services/slugify';
import { showErrorWithWhatsApp } from '../utils/errorReporter';

interface AdminProductUploadProps {
  editingProduct?: Product | null;
  categories: Category[];
  subCategories: SubCategory[];
  childCategories: ChildCategory[];
  brands: Brand[];
  tags: Tag[];
  user: User | null;
  onSubmit: (product: Product) => void;
  onCancel: () => void;
  onSaveDraft: (product: Partial<Product>) => void;
  activeTenantId: string;
}

const AdminProductUpload: React.FC<AdminProductUploadProps> = ({
  editingProduct,
  categories,
  subCategories,
  childCategories,
  brands,
  tags,
  user,
  onSubmit,
  onCancel,
  onSaveDraft,
  activeTenantId
}) => {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    slug: '',
    price: 0,
    originalPrice: 0,
    costPrice: 0,
    sku: '',
    stock: 0,
    category: '',
    subCategory: '',
    childCategory: '',
    brand: '',
    tags: [],
    image: '',
    galleryImages: [],
    status: 'Active'
  });

  // Multi-select arrays for catalog (stored internally as arrays, joined on submit)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
  const [selectedChildCategories, setSelectedChildCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [autoSlug, setAutoSlug] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered subcategories based on selected categories
  const filteredSubCategories = subCategories.filter(sub => {
    return selectedCategories.some(catName => {
      const cat = categories.find(c => c.name === catName);
      return cat && sub.categoryId === cat.id;
    });
  });

  // Filtered child categories based on selected subcategories
  const filteredChildCategories = childCategories.filter(child => {
    return selectedSubCategories.some(subName => {
      const sub = subCategories.find(s => s.name === subName);
      return sub && child.subCategoryId === sub.id;
    });
  });

  // Remove category chip (cascade sub/child)
  const removeCategory = (catName: string) => {
    setSelectedCategories(prev => prev.filter(c => c !== catName));
    const cat = categories.find(c => c.name === catName);
    if (cat) {
      const orphanedSubs = subCategories.filter(s => s.categoryId === cat.id).map(s => s.name);
      setSelectedSubCategories(prev => prev.filter(s => !orphanedSubs.includes(s)));
      setSelectedChildCategories([]);
    }
  };

  // Remove sub-category chip (cascade child)
  const removeSubCategory = (subName: string) => {
    setSelectedSubCategories(prev => prev.filter(s => s !== subName));
    setSelectedChildCategories([]);
  };
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [videoLink, setVideoLink] = useState('');
  const [shortDescription, setShortDescription] = useState(editingProduct?.shortDescription || '');
  const [unitName, setUnitName] = useState('');
  const [warranty, setWarranty] = useState('');
  const [barcode, setBarcode] = useState('');
  const [initialSoldCount, setInitialSoldCount] = useState(0);
  const [expirationStart, setExpirationStart] = useState('');
  const [expirationEnd, setExpirationEnd] = useState('');
  const [productPriority, setProductPriority] = useState(0);

  // SEO Info
  const [seoKeyword, setSeoKeyword] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoTitle, setSeoTitle] = useState('');

  // Affiliate
  const [productSource, setProductSource] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceSku, setSourceSku] = useState('');

  // Shipping
  const [applyDefaultShipping, setApplyDefaultShipping] = useState(false);
  const [defaultShippingCharge, setDefaultShippingCharge] = useState(0);
  const [specificShippingLocation, setSpecificShippingLocation] = useState('');
  const [specificShippingCharge, setSpecificShippingCharge] = useState(0);

  // Variants
  const [isVariantMandatory, setIsVariantMandatory] = useState(false);
  const [variantTitle, setVariantTitle] = useState('');
  const [attributes, setAttributes] = useState([{ id: '1', name: '', extraPrice: 0 }]);

  // Calculate field completion status and progress
  const fieldChecks = {
    itemName: !!formData.name?.trim(),
    media: !!formData.image,
    productDescription: !!formData.description?.trim(),
    pricing: (formData.price ?? 0) > 0,
    inventory: (formData.stock ?? 0) > 0,
  };

  // Count all filled fields for progress (3% per field)
  const filledFieldsCount = [
    !!formData.name?.trim(),
    !!formData.image,
    !!formData.description?.trim(),
    (formData.price ?? 0) > 0,
    (formData.originalPrice ?? 0) > 0,
    (formData.costPrice ?? 0) > 0,
    (formData.stock ?? 0) > 0,
    !!formData.sku?.trim(),
    !!formData.category?.trim(),
    !!formData.subCategory?.trim(),
    !!formData.childCategory?.trim(),
    !!formData.brand?.trim(),
    (formData.tags?.length ?? 0) > 0,
    (formData.galleryImages?.length ?? 0) > 0,
    !!videoLink?.trim(),
    !!shortDescription?.trim(),
    !!unitName?.trim(),
    !!warranty?.trim(),
    !!barcode?.trim(),
    initialSoldCount > 0,
    !!expirationStart,
    !!expirationEnd,
    productPriority > 0,
    !!seoTitle?.trim(),
    !!seoDescription?.trim(),
    !!seoKeyword?.trim(),
    !!productSource?.trim(),
    !!sourceUrl?.trim(),
    !!sourceSku?.trim(),
    !!variantTitle?.trim(),
    applyDefaultShipping,
    defaultShippingCharge > 0,
    !!specificShippingLocation?.trim(),
  ].filter(Boolean).length;

  // Calculate progress: 3% per field, max 100%
  const progressPercent = Math.min(filledFieldsCount * 3, 100);

  // Progress bar color based on percentage
  const getProgressColor = (percent: number) => {
    if (percent < 30) return 'bg-yellow-500';
    if (percent <= 80) return 'bg-green-500';
    return 'bg-blue-500';
  };

  useEffect(() => {
    if (editingProduct) {
      setFormData(editingProduct);
      // Sync multi-select arrays from editingProduct strings
      setSelectedCategories(editingProduct.category ? editingProduct.category.split(', ').filter(Boolean) : []);
      setSelectedSubCategories(editingProduct.subCategory ? editingProduct.subCategory.split(', ').filter(Boolean) : []);
      setSelectedChildCategories(editingProduct.childCategory ? editingProduct.childCategory.split(', ').filter(Boolean) : []);
      setSelectedBrands(editingProduct.brand ? editingProduct.brand.split(', ').filter(Boolean) : []);
      setSelectedTags(editingProduct.tags || []);
      setAutoSlug(false);
    }
  }, [editingProduct]);

  useEffect(() => {
    if (autoSlug && formData.name) {
      setFormData(prev => ({ ...prev, slug: slugify(prev.name || '') }));
    }
  }, [formData.name, autoSlug]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isGallery: boolean = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const loadingToast = toast.loading(isGallery ? `Uploading ${files.length} images...` : 'Uploading image...');

    try {
      if (isGallery) {
        const uploadedUrls: string[] = [];
        for (let i = 0; i < files.length; i++) {
          const url = await uploadImageToServer(files[i], activeTenantId);
          uploadedUrls.push(url);
        }
        setFormData(prev => ({
          ...prev,
          galleryImages: [...(prev.galleryImages || []), ...uploadedUrls]
        }));
      } else {
        const url = await uploadImageToServer(files[0], activeTenantId);
        setFormData(prev => ({ ...prev, image: url }));
      }
      toast.success('Upload successful', { id: loadingToast });
    } catch (error) {
      console.error('Upload error:', error);
      toast.dismiss(loadingToast);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      showErrorWithWhatsApp('Product Upload', `Upload failed: ${msg}`);
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const removeGalleryImage = async (index: number) => {
    const imageUrl = formData.galleryImages?.[index];
    if (imageUrl) {
      try {
        // Optional: delete from server if needed
        // await deleteImageFromServer(imageUrl, activeTenantId);
      } catch (err) {}
    }
    setFormData(prev => ({
      ...prev,
      galleryImages: prev.galleryImages?.filter((_, i) => i !== index)
    }));
  };

  const handleAddAttribute = () => {
    setAttributes([...attributes, { id: Date.now().toString(), name: '', extraPrice: 0 }]);
  };

  const handleRemoveAttribute = (id: string) => {
    setAttributes(attributes.filter(attr => attr.id !== id));
  };

  const handleAttributeChange = (id: string, field: 'name' | 'extraPrice', value: string | number) => {
    setAttributes(attributes.map(attr => attr.id === id ? { ...attr, [field]: value } : attr));
  };

  const handlePublish = () => {
    if (!formData.name) {
      toast.error('Item name is required');
      return;
    }
    // Join multi-select arrays into comma-separated strings
    const submitData = {
      ...formData,
      category: selectedCategories.join(', '),
      subCategory: selectedSubCategories.join(', '),
      childCategory: selectedChildCategories.join(', '),
      brand: selectedBrands.join(', '),
      tags: selectedTags,
      shortDescription: shortDescription || '',
    };
    onSubmit(submitData as Product);
  };

  return (
    <div className="flex-1 bg-stone-50 min-h-screen font-['Lato'] pb-24 sm:pb-20 animate-fade-in overflow-x-hidden">
      <div className="max-w-[1200px] mx-auto pt-4 sm:pt-6 md:pt-8 px-3 sm:px-4 md:px-8 space-y-4 sm:space-y-6">

        <div className="flex justify-between items-center">
            <h1 className="text-black text-xl sm:text-2xl font-bold">Product Upload</h1>
        </div>

        {/* Mobile Action Buttons - Fixed at Bottom */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 flex gap-2 z-50">
          <button
            onClick={() => onSaveDraft({...formData, category: selectedCategories.join(', '), subCategory: selectedSubCategories.join(', '), childCategory: selectedChildCategories.join(', '), brand: selectedBrands.join(', '), tags: selectedTags})}
            className="flex-1 bg-white border border-black rounded-lg h-10 flex items-center justify-center gap-1 text-zinc-950 text-sm font-semibold hover:bg-zinc-50 transition"
          >
            <FileText size={16} /> Draft
          </button>
          <button
            onClick={handlePublish}
            className="flex-1 bg-gradient-to-r from-sky-400 to-blue-500 rounded-lg h-10 flex items-center justify-center gap-1 text-white text-sm font-semibold hover:opacity-90 transition"
          >
            <Plus size={16} /> {editingProduct ? 'Update' : 'Add'}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          {/* Main Form Column */}
          <div className="flex-1 flex flex-col gap-4 sm:gap-6">

            {/* General Information */}
            <section className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-hidden">
              <div className="flex justify-between items-center">
                <h2 className="text-black text-lg sm:text-xl font-medium">General Information</h2>
                <div className="w-8 h-8 flex items-center justify-center bg-stone-50 rounded-lg">
                  <Minus size={16} />
                </div>
              </div>

              <div className="space-y-4">
                {/* Item Name */}
                <div className="space-y-2">
                  <div className="flex flex-col xs:flex-row justify-between items-start xs:items-end gap-2">
                    <label className="text-black text-sm sm:text-base font-normal">Item Name<span className="text-red-600">*</span></label>
                    <div className="flex items-center gap-2">
                      <span className="text-black text-sm sm:text-base font-normal">Auto Slug</span>
                      <button
                        onClick={() => setAutoSlug(!autoSlug)}
                        className={`w-9 h-5 rounded-full relative transition-colors ${autoSlug ? 'bg-sky-400' : 'bg-neutral-300'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute to p-0.5 transition-all ${autoSlug ? 'right-0.5' : 'left-0.5'}`} />
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Ex: Samsung Galaxy S25 Ultra"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full h-10 px-3 sm:px-4 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-sm"
                  />
                </div>

                {/* Media */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-black text-sm sm:text-base font-medium">Media<span className="text-red-700">*</span></label>
                    <div className="w-8 h-8 flex items-center justify-center">
                        <Minus size={16} />
                    </div>
                  </div>

                  <div
                    className="w-full bg-stone-50 rounded-lg border-2 border-dashed border-stone-200 p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center gap-3 sm:gap-4 cursor-pointer hover:bg-stone-100 transition relative overflow-hidden"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {formData.image ? (
                      <div className="relative group w-full h-32 sm:h-48 flex items-center justify-center bg-white rounded-lg">
                        <img src={formData.image} alt="Product" className="max-h-full object-contain" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <RefreshCw className="text-white" size={28} />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-14 h-14 sm:w-20 sm:h-20 bg-stone-100 rounded-full flex items-center justify-center text-stone-400">
                          {isUploading ? <Loader2 size={28} className="animate-spin sm:w-10 sm:h-10" /> : <ImageIcon size={28} className="sm:w-10 sm:h-10" />}
                        </div>
                        <div className="text-center px-2">
                          <p className="text-neutral-400 text-xs sm:text-sm md:text-base font-normal leading-relaxed">
                            Drag and drop image here,<br className="xs:hidden" /> or click to add image.
                          </p>
                          <p className="text-neutral-400 text-[10px] sm:text-xs font-light mt-1">
                            Supported: JPG, PNG (Max: 4MB)<br/>
                            Ratio: 1:1.6 (855×1386 px)
                          </p>
                        </div>
                        <button className="px-4 sm:px-6 py-2 bg-amber-500 rounded-lg text-white text-xs sm:text-sm font-semibold hover:bg-amber-600 transition">
                          {isUploading ? 'Uploading...' : 'Add Image'}
                        </button>
                      </>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, false)}
                    />
                  </div>

                  {/* Gallery Preview - Responsive Grid */}
                  {formData.galleryImages && formData.galleryImages.length > 0 && (
                    <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 gap-2 mt-3 sm:mt-4">
                      {formData.galleryImages.map((img, idx) => (
                        <div key={idx} className="relative group aspect-square bg-stone-100 rounded-lg overflow-hidden border border-stone-200">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <button
                            onClick={(e) => { e.stopPropagation(); removeGalleryImage(idx); }}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => galleryInputRef.current?.click()}
                        className="aspect-square bg-stone-50 border-2 border-dashed border-stone-200 rounded-lg flex items-center justify-center text-stone-400 hover:bg-stone-100 transition"
                      >
                       <Plus size={20} className="sm:w-6 sm:h-6" />
                      </button>
                      <input
                        type="file"
                        ref={galleryInputRef}
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleImageUpload(e, true)}
                      />
                    </div>
                  )}

                  {/* Add Gallery Button when no gallery images */}
                  {(!formData.galleryImages || formData.galleryImages.length === 0) && (
                    <button
                      onClick={() => galleryInputRef.current?.click()}
                      className="w-full bg-stone-50 border-2 border-dashed border-stone-200 rounded-lg py-3 flex items-center justify-center gap-2 text-stone-500 hover:bg-stone-100 transition text-sm"
                    >
                      <Plus size={18} /> Add Gallery Images
                    </button>
                  )}

                  {/* YouTube Link */}
                  <div className="relative">
                    <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                    <input
                      type="text"
                      placeholder="Paste YouTube Video Link (Optional)"
                      value={videoLink}
                      onChange={(e) => setVideoLink(e.target.value)}
                      className="w-full h-10 pl-10 pr-3 sm:pr-4 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-sm"
                    />
                  </div>
                </div>

                {/* Short Description */}
                <div className="space-y-2">
                  <label className="text-black text-sm sm:text-base font-normal">Short Description</label>
                  <textarea
                    placeholder="Ex: Short Description"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    className="w-full h-20 p-3 sm:p-4 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-sm resize-none"
                  />
                </div>

                {/* Product Description */}
                <div className="space-y-2">
                  <label className="text-black text-sm sm:text-base font-normal">Product Description<span className="text-red-700">*</span></label>
                  <div className="bg-stone-50 rounded-lg overflow-hidden">
                    {/* Mock Rich Text Toolbar */}
                    <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-4 py-2 border-b border-stone-200 overflow-x-auto whitespace-nowrap scrollbar-hide">
                      <span className="text-neutral-600 text-xs sm:text-sm font-semibold cursor-pointer">Normal</span>
                      <span className="text-neutral-600 text-xs sm:text-sm font-extrabold cursor-pointer">B</span>
                      <span className="text-neutral-600 text-sm sm:text-base font-serif italic cursor-pointer">I</span>
                      <span className="text-neutral-600 text-xs sm:text-sm font-semibold underline cursor-pointer">U</span>
                      <div className="w-px h-4 bg-neutral-300" />
                      <span className="text-neutral-600 text-xs sm:text-sm font-semibold underline cursor-pointer">A</span>
                      <Layout size={14} className="text-neutral-600 cursor-pointer sm:w-4 sm:h-4" />
                      <Grid size={14} className="text-neutral-600 cursor-pointer sm:w-4 sm:h-4" />
                      <Layers size={14} className="text-neutral-600 cursor-pointer sm:w-4 sm:h-4" />
                      <ImageIcon size={14} className="text-neutral-600 cursor-pointer sm:w-4 sm:h-4" />
                    </div>
                    <textarea
                      placeholder="Ex: Description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full h-28 sm:h-32 p-3 sm:p-4 bg-transparent border-none focus:ring-0 outline-none text-sm resize-none"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Pricing */}
            <section className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-hidden">
              <div className="flex justify-between items-center">
                <h2 className="text-black text-lg sm:text-xl font-medium">Pricing</h2>
                <div className="w-8 h-8 flex items-center justify-center bg-stone-50 rounded-lg">
                  <Minus size={16} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                <div className="space-y-2">
                  <label className="text-black text-sm sm:text-base font-normal">Sell/Current Price<span className="text-red-600">*</span></label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                    className="w-full h-10 px-3 sm:px-4 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-black text-sm sm:text-base font-normal">Regular/Old Price<span className="text-red-600">*</span></label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({...formData, originalPrice: parseFloat(e.target.value)})}
                    className="w-full h-10 px-3 sm:px-4 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-black text-sm sm:text-base font-normal">Buying Price (Optional)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({...formData, costPrice: parseFloat(e.target.value)})}
                    className="w-full h-10 px-3 sm:px-4 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-sm"
                  />
                </div>
              </div>
            </section>

            {/* Inventory */}
            <section className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-hidden">
              <div className="flex justify-between items-center">
                <h2 className="text-black text-lg sm:text-xl font-medium">Inventory</h2>
                <div className="w-8 h-8 flex items-center justify-center bg-stone-50 rounded-lg">
                  <Minus size={16} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                <div className="space-y-2">
                  <label className="text-black text-sm sm:text-base font-normal">Product Priority</label>
                  <input
                    type="text"
                    placeholder="0%"
                    value={productPriority + '%'}
                    onChange={(e) => setProductPriority(parseInt(e.target.value) || 0)}
                    className="w-full h-10 px-3 sm:px-4 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-black text-sm sm:text-base font-normal">Quantity (Stock)</label>
                  <input
                    type="number"
                    placeholder="50"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value)})}
                    className="w-full h-10 px-3 sm:px-4 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-black text-sm sm:text-base font-normal">Unit Name</label>
                  <input
                    type="text"
                    placeholder="Piece, kg, liter, etc."
                    value={unitName}
                    onChange={(e) => setUnitName(e.target.value)}
                    className="w-full h-10 px-3 sm:px-4 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-black text-sm sm:text-base font-normal">Warranty</label>
                  <input
                    type="text"
                    placeholder="12 month"
                    value={warranty}
                    onChange={(e) => setWarranty(e.target.value)}
                    className="w-full h-10 px-3 sm:px-4 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-black text-sm sm:text-base font-normal">SKU / Product Code</label>
                  <input
                    type="text"
                    placeholder="abc-xyz-123"
                    value={formData.sku}
                    onChange={(e) => setFormData({...formData, sku: e.target.value})}
                    className="w-full h-10 px-3 sm:px-4 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-sm uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-black text-sm sm:text-base font-normal">Bar Code</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="2154645786216"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      className="w-full h-10 px-3 sm:px-4 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-sm"
                    />
                    <ScanLine className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-black text-sm sm:text-base font-normal">Initial Sold Count</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={initialSoldCount}
                    onChange={(e) => setInitialSoldCount(parseInt(e.target.value) || 0)}
                    className="w-full h-10 px-3 sm:px-4 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-black text-sm sm:text-base font-normal">Expiration Start</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={expirationStart}
                      onChange={(e) => setExpirationStart(e.target.value)}
                      className="w-full h-10 px-3 sm:px-4 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-black text-sm sm:text-base font-normal">Expiration End</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={expirationEnd}
                      onChange={(e) => setExpirationEnd(e.target.value)}
                      className="w-full h-10 px-3 sm:px-4 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-sm"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Product Variants */}
            <section className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-hidden">
              <div className="flex justify-between items-center gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <h2 className="text-black text-lg sm:text-xl font-medium">Product Variants</h2>
                  <p className="text-neutral-400 text-[10px] sm:text-xs font-normal line-clamp-2">Add multiple variants like Size, Color, Weight etc.</p>
                </div>
                <div className="w-8 h-8 flex items-center justify-center bg-stone-50 rounded-lg flex-shrink-0">
                  <Minus size={16} />
                </div>
              </div>

              <div className="border border-sky-400 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                   <div className="space-y-1">
                    <h3 className="text-black text-base sm:text-xl font-medium">Make this variant mandatory</h3>
                    <p className="text-neutral-400 text-[10px] sm:text-xs font-normal">Toggle on if customer must select a variant option</p>
                   </div>
                   <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-black text-sm sm:text-base font-normal">{isVariantMandatory ? '[Yes]' : '[No]'}</span>
                      <button
                        onClick={() => setIsVariantMandatory(!isVariantMandatory)}
                        className={`w-9 h-5 rounded-full relative transition-colors ${isVariantMandatory ? 'bg-sky-400' : 'bg-neutral-300'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute to p-0.5 transition-all ${isVariantMandatory ? 'right-0.5' : 'left-0.5'}`} />
                      </button>
                    </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-black text-sm sm:text-base font-normal">Title</label>
                    <input
                      type="text"
                      placeholder="Enter the name of variant (e.g., Colour, Size)"
                      value={variantTitle}
                      onChange={(e) => setVariantTitle(e.target.value)}
                      className="w-full h-10 px-3 sm:px-4 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-sm"
                    />
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    {attributes.map((attr, idx) => (
                      <div key={attr.id} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 sm:gap-3">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-stone-50 rounded-lg flex items-center justify-center text-stone-300 border border-stone-100 flex-shrink-0 self-start">
                          <ImageIcon size={20} className="sm:w-6 sm:h-6" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <div className="flex-1">
                              <label className="text-black text-sm font-normal block mb-1">Attribute</label>
                              <input
                                type="text"
                                placeholder="e.g., Red, Large, Cotton"
                                value={attr.name}
                                onChange={(e) => handleAttributeChange(attr.id, 'name', e.target.value)}
                                className="w-full h-10 px-3 sm:px-4 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-sm"
                              />
                            </div>
                            <div className="w-full sm:w-40 md:w-52">
                              <label className="text-black text-sm font-normal block mb-1">Extra Price</label>
                              <input
                                type="number"
                                placeholder="Extra price"
                                value={attr.extraPrice}
                                onChange={(e) => handleAttributeChange(attr.id, 'extraPrice', parseFloat(e.target.value))}
                                className="w-full h-10 px-3 sm:px-4 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-sm"
                              />
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveAttribute(attr.id)}
                          className="w-10 h-10 bg-red-50 text-red-700 rounded-lg flex items-center justify-center hover:bg-red-100 flex-shrink-0 self-end sm:self-auto"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={handleAddAttribute}
                      className="bg-gradient-to-r from-sky-400 to-blue-500 rounded-lg h-10 px-4 flex items-center gap-2 text-white text-xs sm:text-sm font-semibold w-full sm:w-auto justify-center sm:justify-start"
                    >
                      <Plus size={16} /> Add More Option
                    </button>
                  </div>
                </div>
              </div>

              <button className="bg-zinc-100 rounded-lg h-10 px-4 flex items-center gap-2 text-black text-xs sm:text-sm font-semibold hover:bg-zinc-200 transition w-full sm:w-auto justify-center sm:justify-start">
                <Plus size={16} /> Add a new variant
              </button>
            </section>



            {/* Product Details */}
            <section className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-hidden">
              <div className="flex justify-between items-center gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <h2 className="text-black text-lg sm:text-xl font-medium">Product Details</h2>
                  <p className="text-neutral-400 text-[10px] sm:text-xs font-normal line-clamp-2">Add Brand, Model, Serial Number, Fabric Type, EMI etc.</p>
                </div>
                <div className="w-8 h-8 flex items-center justify-center bg-stone-50 rounded-lg flex-shrink-0">
                  <Minus size={16} />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 sm:gap-3">
                 <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                        <label className="text-black text-sm sm:text-base font-normal block">Detail Type</label>
                        <input
                          type="text"
                          placeholder="Ram"
                          className="w-full h-10 px-3 sm:px-4 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-black text-sm sm:text-base font-normal block">Detail Description</label>
                        <input
                          type="text"
                          placeholder="16 GB"
                          className="w-full h-10 px-3 sm:px-4 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-sm"
                        />
                    </div>
                 </div>
                 <button className="w-full sm:w-10 h-10 bg-red-50 text-red-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Trash2 size={18} />
                 </button>
              </div>

              <button className="bg-zinc-100 rounded-lg h-10 px-4 flex items-center gap-2 text-black text-xs sm:text-sm font-semibold w-full sm:w-auto justify-center sm:justify-start">
                <Plus size={16} /> Add a new detail
              </button>
            </section>

            {/* Affiliate */}
            <section className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-hidden">
              <div className="flex justify-between items-center">
                <h2 className="text-black text-lg sm:text-xl font-medium">Affiliate</h2>
                <div className="w-8 h-8 flex items-center justify-center bg-stone-50 rounded-lg">
                  <Minus size={16} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-black text-sm sm:text-base font-normal">Product Source (Optional)</label>
                  <select
                    value={productSource}
                    onChange={(e) => setProductSource(e.target.value)}
                    className="w-full h-10 px-3 sm:px-4 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-sm appearance-none"
                  >
                    <option value="">Select Source</option>
                    <option value="aliexpress">AliExpress (marketplace)</option>
                    <option value="amazon">Amazon</option>
                  </select>
                  <p className="text-neutral-400 text-[10px] sm:text-xs font-normal">Select if sourced from external supplier</p>
                </div>

                {productSource === 'aliexpress' && (
                  <div className="bg-orange-50 rounded-lg p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                    <div className="w-8 h-8 bg-white rounded overflow-hidden flex-shrink-0">
                       <img src="https://placehold.co/32x32" alt="AliExpress" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-black text-sm font-bold">AliExpress</p>
                      <p className="text-sky-500 text-[10px] font-normal truncate">www.aliexpress.com</p>
                    </div>
                    <span className="px-2 sm:px-3 py-1 bg-orange-500 rounded-full text-white text-[10px] sm:text-xs font-semibold flex-shrink-0">Marketplace</span>
                  </div>
                )}

                <div className="bg-orange-50 rounded-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
                  <h3 className="text-black text-xs sm:text-sm font-bold">Source Product Details (Optional)</h3>

                  <div className="space-y-3 sm:space-y-4">
                    <div className="space-y-2">
                      <label className="text-black text-sm sm:text-base font-normal">Source Product URL</label>
                      <input
                        type="text"
                        placeholder="www.xyz.com/product/123"
                        value={sourceUrl}
                        onChange={(e) => setSourceUrl(e.target.value)}
                        className="w-full h-10 px-3 sm:px-4 bg-white rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-sm"
                      />
                      <p className="text-neutral-400 text-[10px] sm:text-xs font-normal">Direct link to product on source platform</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-black text-sm sm:text-base font-normal">Source SKU / Product Code</label>
                      <input
                        type="text"
                        placeholder="abc-xyz-123"
                        value={sourceSku}
                        onChange={(e) => setSourceSku(e.target.value)}
                        className="w-full h-10 px-3 sm:px-4 bg-white rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-sm uppercase"
                      />
                      <p className="text-neutral-400 text-[10px] sm:text-xs font-normal">Product identifier from source (SKU, Product ID)</p>
                    </div>

                    <div className="bg-orange-100 rounded-lg p-3">
                       <p className="text-neutral-400 text-[10px] sm:text-xs font-normal">
                        💡 Tip: These details help track products from external sources. Use Source URL to access product page quickly.
                       </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Shipping */}
            <section className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-hidden">
              <div className="flex justify-between items-center">
                <h2 className="text-black text-lg sm:text-xl font-medium">Shipping</h2>
                <div className="w-8 h-8 flex items-center justify-center bg-stone-50 rounded-lg">
                  <Minus size={16} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-black text-base sm:text-xl font-medium">Delivery Charge</h3>
                  <p className="text-neutral-400 text-[10px] sm:text-xs font-normal">Add specific charge or use default</p>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <label className="text-black text-sm sm:text-base font-normal">Apply default delivery charges</label>
                    <div className="flex items-center gap-2">
                      <span className="text-black text-sm sm:text-base font-normal">{applyDefaultShipping ? '[Applied]' : '[Not Applied]'}</span>
                      <button
                        onClick={() => setApplyDefaultShipping(!applyDefaultShipping)}
                        className={`w-9 h-5 rounded-full relative transition-colors ${applyDefaultShipping ? 'bg-sky-400' : 'bg-neutral-300'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute to p-0.5 transition-all ${applyDefaultShipping ? 'right-0.5' : 'left-0.5'}`} />
                      </button>
                    </div>
                </div>

                <div className="space-y-2">
                  <label className="text-black text-sm sm:text-base font-normal">Delivery Charge (Default)</label>
                  <input
                    type="number"
                    value={defaultShippingCharge}
                    onChange={(e) => setDefaultShippingCharge(parseFloat(e.target.value))}
                    className="w-full h-10 px-3 sm:px-4 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-black text-sm sm:text-base font-normal">Specific Delivery Charge</label>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <input
                      type="text"
                      placeholder="Dhaka"
                      value={specificShippingLocation}
                      onChange={(e) => setSpecificShippingLocation(e.target.value)}
                      className="flex-1 h-10 px-3 sm:px-4 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-sm"
                    />
                    <input
                      type="number"
                      placeholder="80"
                      value={specificShippingCharge}
                      onChange={(e) => setSpecificShippingCharge(parseFloat(e.target.value))}
                      className="w-full sm:w-40 md:w-52 h-10 px-3 sm:px-4 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-sm"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* SEO Info */}
            <section className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-hidden">
               <h2 className="text-black text-lg sm:text-xl font-medium">SEO Info</h2>
               <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <label className="text-black text-sm sm:text-base font-normal">Keyword</label>
                    <input
                      type="text"
                      placeholder="Seo Keyword"
                      value={seoKeyword}
                      onChange={(e) => setSeoKeyword(e.target.value)}
                      className="w-full h-10 px-3 sm:px-4 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-xs sm:text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-black text-sm sm:text-base font-normal">SEO Description</label>
                    <input
                      type="text"
                      placeholder="Seo Description"
                      value={seoDescription}
                      onChange={(e) => setSeoDescription(e.target.value)}
                      className="w-full h-10 px-3 sm:px-4 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-xs sm:text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-black text-sm sm:text-base font-normal">SEO Title</label>
                    <input
                      type="text"
                      placeholder="Seo Title"
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      className="w-full h-10 px-3 sm:px-4 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-xs sm:text-sm"
                    />
                  </div>
               </div>
            </section>

          </div>

          {/* Right Sidebar Column - Hidden on Mobile (actions fixed at bottom) */}
          <div className="hidden lg:block w-full lg:w-96 space-y-6">

            {/* Action Buttons - Desktop Only */}
            <div className="flex gap-2 h-10">
              <button
                onClick={() => onSaveDraft({...formData, category: selectedCategories.join(', '), subCategory: selectedSubCategories.join(', '), childCategory: selectedChildCategories.join(', '), brand: selectedBrands.join(', '), tags: selectedTags})}
                className="flex-1 bg-white border border-black rounded-lg flex items-center justify-center gap-1 text-zinc-950 text-sm font-semibold hover:bg-zinc-50 transition"
              >
                <FileText size={18} /> Draft
              </button>
              <button
                onClick={handlePublish}
                className="flex-1 bg-gradient-to-r from-sky-400 to-blue-500 rounded-lg flex items-center justify-center gap-1 text-white text-sm font-semibold hover:opacity-90 transition"
              >
                <Plus size={18} /> {editingProduct ? 'Update Product' : 'Add Product'}
              </button>
            </div>

            {/* Ready To Publish */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-6 overflow-hidden">
               <h2 className="text-black text-xl font-medium">Ready To Publish</h2>
               <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-stone-50 h-2 rounded-full overflow-hidden">
                       <div className={`${getProgressColor(progressPercent)} h-full rounded-full transition-all duration-300`} style={{ width: `${progressPercent}%` }} />
                    </div>
                    <span className="text-black text-sm font-medium">{progressPercent}%</span>
                  </div>
                  <div className="border-t border-zinc-100 pt-4 space-y-4">
                    {[
                      { label: 'Item Name', checked: fieldChecks.itemName },
                      { label: 'Media', checked: fieldChecks.media },
                      { label: 'Product Description', checked: fieldChecks.productDescription },
                      { label: 'Pricing', checked: fieldChecks.pricing },
                      { label: 'Inventory', checked: fieldChecks.inventory }
                    ].map((item, idx, arr) => (
                      <div key={item.label}>
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${item.checked ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'}`}>
                             {item.checked && (
                               <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                 <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                               </svg>
                             )}
                          </div>
                          <span className={`text-xs font-medium ${item.checked ? 'text-black' : 'text-gray-400'}`}>{item.label}</span>
                        </div>
                        {idx < arr.length - 1 && <div className={`ml-2 w-px h-2.5 border-l border-dashed ${item.checked ? 'border-green-500' : 'border-gray-300'}`} />}
                      </div>
                    ))}
                  </div>
               </div>
            </div>

            {/* Catalog - Multi-Select with Chips */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-5 overflow-hidden">
               <h2 className="text-black text-xl font-medium">Catalog</h2>

               {/* Selected Chips Display */}
               {(selectedCategories.length > 0 || selectedSubCategories.length > 0 || selectedChildCategories.length > 0 || selectedBrands.length > 0) && (
                 <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                   <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Selected</p>
                   <div className="flex flex-wrap gap-1.5">
                     {selectedCategories.map(c => (
                       <span key={`cat-${c}`} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                         <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>{c}
                         <button type="button" onClick={() => removeCategory(c)} className="hover:text-blue-900 ml-0.5"><X size={12} /></button>
                       </span>
                     ))}
                     {selectedSubCategories.map(s => (
                       <span key={`sub-${s}`} className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                         <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>{s}
                         <button type="button" onClick={() => removeSubCategory(s)} className="hover:text-emerald-900 ml-0.5"><X size={12} /></button>
                       </span>
                     ))}
                     {selectedChildCategories.map(c => (
                       <span key={`child-${c}`} className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                         <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>{c}
                         <button type="button" onClick={() => setSelectedChildCategories(prev => prev.filter(x => x !== c))} className="hover:text-purple-900 ml-0.5"><X size={12} /></button>
                       </span>
                     ))}
                     {selectedBrands.map(b => (
                       <span key={`brand-${b}`} className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                         <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>{b}
                         <button type="button" onClick={() => setSelectedBrands(prev => prev.filter(x => x !== b))} className="hover:text-amber-900 ml-0.5"><X size={12} /></button>
                       </span>
                     ))}
                   </div>
                 </div>
               )}

               <div className="space-y-4">
                  {/* Category Multi-Select */}
                  <div className="space-y-2">
                    <label className="text-black text-xs font-normal">Select Category<span className="text-red-700">*</span></label>
                    <div className="relative">
                      <select
                        value=""
                        onChange={(e) => { const v = e.target.value; if (v && !selectedCategories.includes(v)) setSelectedCategories(prev => [...prev, v]); }}
                        className="w-full h-10 px-4 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-xs appearance-none"
                      >
                        <option value="">Select Category</option>
                        {categories.filter(c => !selectedCategories.includes(c.name)).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" size={14} />
                    </div>
                  </div>

                  {/* Sub Category Multi-Select */}
                  {selectedCategories.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-black text-xs font-normal">Select Sub Category</label>
                      <div className="relative">
                        <select
                          value=""
                          onChange={(e) => { const v = e.target.value; if (v && !selectedSubCategories.includes(v)) setSelectedSubCategories(prev => [...prev, v]); }}
                          className="w-full h-10 px-4 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-xs appearance-none"
                        >
                          <option value="">Select Sub Category</option>
                          {filteredSubCategories.filter(s => !selectedSubCategories.includes(s.name)).map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" size={14} />
                      </div>
                    </div>
                  )}

                  {/* Child Category Multi-Select */}
                  {selectedSubCategories.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-black text-xs font-normal">Select Child Category</label>
                      <div className="relative">
                        <select
                          value=""
                          onChange={(e) => { const v = e.target.value; if (v && !selectedChildCategories.includes(v)) setSelectedChildCategories(prev => [...prev, v]); }}
                          className="w-full h-10 px-4 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-xs appearance-none"
                        >
                          <option value="">Select Child Category</option>
                          {filteredChildCategories.filter(c => !selectedChildCategories.includes(c.name)).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" size={14} />
                      </div>
                    </div>
                  )}

                  {/* Brand Multi-Select */}
                  <div className="space-y-2">
                    <label className="text-black text-xs font-normal">Select Brand</label>
                    <div className="relative">
                      <select
                        value=""
                        onChange={(e) => { const v = e.target.value; if (v && !selectedBrands.includes(v)) setSelectedBrands(prev => [...prev, v]); }}
                        className="w-full h-10 px-4 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-xs appearance-none"
                      >
                        <option value="">Select Brand</option>
                        {brands.filter(b => !selectedBrands.includes(b.name)).map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" size={14} />
                    </div>
                  </div>
               </div>
            </div>

            {/* Product Tags - Only show as chips when selected */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-5 overflow-hidden">
               <h2 className="text-black text-xl font-medium">Product Tags</h2>

               {/* Selected tag chips */}
               {selectedTags.length > 0 && (
                 <div className="flex flex-wrap gap-1.5">
                   {selectedTags.map(tag => (
                     <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-full text-xs font-medium shadow-sm">
                       {tag}
                       <button type="button" onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))} className="hover:text-blue-100 ml-0.5"><X size={12} /></button>
                     </span>
                   ))}
                 </div>
               )}

               <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-black text-xs font-normal">Add custom tag...</label>
                    <div className="relative">
                      <select
                        value=""
                        onChange={(e) => { const v = e.target.value; if (v && !selectedTags.includes(v)) setSelectedTags(prev => [...prev, v]); }}
                        className="w-full h-10 px-4 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-xs appearance-none"
                      >
                        <option value="">Add custom tag...</option>
                        {tags.filter(t => !selectedTags.includes(t.name)).map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" size={14} />
                    </div>
                  </div>
               </div>
            </div>

            {/* Deep Search */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-5 overflow-hidden">
               <h2 className="text-black text-xl font-medium">Deep Search</h2>
               <div className="space-y-2">
                 <input
                   type="text"
                   placeholder="Keywords comma দিয়ে আলাদা করুন (ex: mobile, phone, smartphone)"
                   value={formData.deepSearch || ''}
                   onChange={(e) => setFormData({...formData, deepSearch: e.target.value})}
                   className="w-full h-10 px-4 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-xs"
                 />
               </div>
            </div>

            {/* Condition */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-6 overflow-hidden">
               <h2 className="text-black text-xl font-medium">Condition</h2>
               <div className="space-y-4">
                  <div className="relative">
                    <select
                      className="w-full h-10 px-4 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-xs appearance-none"
                    >
                      <option value="new">New</option>
                      <option value="used">Used</option>
                      <option value="refurbished">Refurbished</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" size={14} />
                  </div>
               </div>
            </div>

          </div>
        </div>

        {/* Mobile Sidebar Sections - Below main content */}
        <div className="lg:hidden space-y-4">
          {/* Catalog - Multi-Select with Chips */}
          <div className="bg-white rounded-lg shadow-sm p-4 space-y-4 overflow-hidden">
             <h2 className="text-black text-lg font-medium">Catalog</h2>

             {/* Selected Chips Display */}
             {(selectedCategories.length > 0 || selectedSubCategories.length > 0 || selectedChildCategories.length > 0 || selectedBrands.length > 0) && (
               <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                 <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Selected</p>
                 <div className="flex flex-wrap gap-1.5">
                   {selectedCategories.map(c => (
                     <span key={`cat-${c}`} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[11px] font-medium">
                       <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>{c}
                       <button type="button" onClick={() => removeCategory(c)} className="hover:text-blue-900 ml-0.5"><X size={10} /></button>
                     </span>
                   ))}
                   {selectedSubCategories.map(s => (
                     <span key={`sub-${s}`} className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[11px] font-medium">
                       <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>{s}
                       <button type="button" onClick={() => removeSubCategory(s)} className="hover:text-emerald-900 ml-0.5"><X size={10} /></button>
                     </span>
                   ))}
                   {selectedChildCategories.map(c => (
                     <span key={`child-${c}`} className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[11px] font-medium">
                       <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>{c}
                       <button type="button" onClick={() => setSelectedChildCategories(prev => prev.filter(x => x !== c))} className="hover:text-purple-900 ml-0.5"><X size={10} /></button>
                     </span>
                   ))}
                   {selectedBrands.map(b => (
                     <span key={`brand-${b}`} className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[11px] font-medium">
                       <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>{b}
                       <button type="button" onClick={() => setSelectedBrands(prev => prev.filter(x => x !== b))} className="hover:text-amber-900 ml-0.5"><X size={10} /></button>
                     </span>
                   ))}
                 </div>
               </div>
             )}

             <div className="space-y-3">
                {/* Category */}
                <div className="space-y-2">
                  <label className="text-black text-xs font-normal">Select Category<span className="text-red-700">*</span></label>
                  <div className="relative">
                    <select
                      value=""
                      onChange={(e) => { const v = e.target.value; if (v && !selectedCategories.includes(v)) setSelectedCategories(prev => [...prev, v]); }}
                      className="w-full h-10 px-3 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-xs appearance-none"
                    >
                      <option value="">Select Category</option>
                      {categories.filter(c => !selectedCategories.includes(c.name)).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" size={14} />
                  </div>
                </div>
                {/* Sub Category */}
                {selectedCategories.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-black text-xs font-normal">Select Sub Category</label>
                    <div className="relative">
                      <select
                        value=""
                        onChange={(e) => { const v = e.target.value; if (v && !selectedSubCategories.includes(v)) setSelectedSubCategories(prev => [...prev, v]); }}
                        className="w-full h-10 px-3 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-xs appearance-none"
                      >
                        <option value="">Select Sub Category</option>
                        {filteredSubCategories.filter(s => !selectedSubCategories.includes(s.name)).map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" size={14} />
                    </div>
                  </div>
                )}
                {/* Child Category */}
                {selectedSubCategories.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-black text-xs font-normal">Select Child Category</label>
                    <div className="relative">
                      <select
                        value=""
                        onChange={(e) => { const v = e.target.value; if (v && !selectedChildCategories.includes(v)) setSelectedChildCategories(prev => [...prev, v]); }}
                        className="w-full h-10 px-3 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-xs appearance-none"
                      >
                        <option value="">Select Child Category</option>
                        {filteredChildCategories.filter(c => !selectedChildCategories.includes(c.name)).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" size={14} />
                    </div>
                  </div>
                )}
                {/* Brand */}
                <div className="space-y-2">
                  <label className="text-black text-xs font-normal">Select Brand</label>
                  <div className="relative">
                    <select
                      value=""
                      onChange={(e) => { const v = e.target.value; if (v && !selectedBrands.includes(v)) setSelectedBrands(prev => [...prev, v]); }}
                      className="w-full h-10 px-3 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-xs appearance-none"
                    >
                      <option value="">Select Brand</option>
                      {brands.filter(b => !selectedBrands.includes(b.name)).map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" size={14} />
                  </div>
                </div>
             </div>
          </div>

          {/* Product Tags */}
          <div className="bg-white rounded-lg shadow-sm p-4 space-y-4 overflow-hidden">
             <h2 className="text-black text-lg font-medium">Product Tags</h2>
             {selectedTags.length > 0 && (
               <div className="flex flex-wrap gap-1.5">
                 {selectedTags.map(tag => (
                   <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-full text-[11px] font-medium shadow-sm">
                     {tag}
                     <button type="button" onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))} className="hover:text-blue-100 ml-0.5"><X size={10} /></button>
                   </span>
                 ))}
               </div>
             )}
             <div className="space-y-3">
                <div className="relative">
                  <select
                    value=""
                    onChange={(e) => { const v = e.target.value; if (v && !selectedTags.includes(v)) setSelectedTags(prev => [...prev, v]); }}
                    className="w-full h-10 px-3 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-xs appearance-none"
                  >
                    <option value="">Add custom tag...</option>
                    {tags.filter(t => !selectedTags.includes(t.name)).map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" size={14} />
                </div>
             </div>
          </div>

          {/* Deep Search */}
          <div className="bg-white rounded-lg shadow-sm p-4 space-y-3 overflow-hidden">
             <h2 className="text-black text-lg font-medium">Deep Search</h2>
             <input
               type="text"
               placeholder="Keywords comma দিয়ে আলাদা করুন (ex: mobile, phone)"
               value={formData.deepSearch || ''}
               onChange={(e) => setFormData({...formData, deepSearch: e.target.value})}
               className="w-full h-10 px-3 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-xs"
             />
          </div>

          {/* Condition */}
          <div className="bg-white rounded-lg shadow-sm p-4 space-y-4 overflow-hidden">
             <h2 className="text-black text-lg font-medium">Condition</h2>
             <div className="relative">
               <select
                 className="w-full h-10 px-3 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-sky-400 outline-none text-xs appearance-none"
               >
                 <option value="new">New</option>
                 <option value="used">Used</option>
                 <option value="refurbished">Refurbished</option>
               </select>
               <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" size={14} />
             </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6 sm:mt-8 pb-4">
            <button
              onClick={onCancel}
              className="px-4 sm:px-6 py-2 bg-stone-200 text-black rounded-lg text-sm font-semibold hover:bg-stone-300 transition w-full sm:w-auto"
            >
                Back to List
            </button>
        </div>
      </div>
    </div>
  );
};

export default AdminProductUpload;
