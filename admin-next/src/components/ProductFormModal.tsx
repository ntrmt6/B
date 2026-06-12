// components/ProductFormModal.tsx
// Product Form Modal with Figma Design Implementation
import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Upload, Image as ImageIcon, Plus, Trash2, 
  Calendar, RefreshCw, ChevronDown, Minus, ScanLine,
  Save, FolderOpen, Code, Eye, Search, Globe
} from 'lucide-react';
import { Product, Category, SubCategory, ChildCategory, Brand, Tag } from '../types';

// Constants for special product tags
const SPECIAL_TAGS = {
  DEAL_OF_THE_DAY: 'Deal of the Day',
  MOST_SELLING: 'Most Selling',
  OUR_PRODUCTS: 'All Products',
} as const;

// Helper to check if a tag matches a special tag (case-insensitive)
const hasSpecialTag = (tags: string[], specialTag: string): boolean => 
  tags.some(t => t.toLowerCase() === specialTag.toLowerCase());

// Helper to add or remove a special tag
const toggleSpecialTag = (tags: string[], specialTag: string, shouldHave: boolean): string[] => {
  const hasTag = hasSpecialTag(tags, specialTag);
  if (shouldHave && !hasTag) {
    return [...tags, specialTag];
  } else if (!shouldHave && hasTag) {
    return tags.filter(t => t.toLowerCase() !== specialTag.toLowerCase());
  }
  return tags;
};

// Types for variant management
interface VariantOption {
  id: string;
  name: string;
}

interface Variation {
  id: string;
  name: string;
  options: VariantOption[];
}

interface VariantRow {
  id: string;
  image: string;
  name: string;
  regularPrice: number;
  salePrice: number;
  costPrice: number;
  quantity: number;
  sku: string;
  isDefault: boolean;
}

interface ProductFormData {
  name: string;
  description: string;
  slug: string;
  autoSlug: boolean;
  regularPrice: number;
  salePrice: number;
  costPrice: number;
  sku: string;
  barcode: string;
  moq: number;
  quantity: number;
  categories: string[];
  subCategories: string[];
  childCategories: string[];
  tags: string[];
  brands: string[];
  deliveryInsideDhaka: number;
  deliveryOutsideDhaka: number;
  expirationStart: string;
  expirationEnd: string;
  stockQuantity: string;
  stockStatus: string;
  unlimited: boolean;
  hideInWebsite: boolean;
  mainImage: string;
  galleryImages: string[];
  variations: Variation[];
  variantRows: VariantRow[];
  additionalSku: string;
  additionalBarcode: string;
  additionalMoq: number;
  // Special product flags
  isDealOfTheDay: boolean;
  isMostSelling: boolean;
  isOurProduct: boolean;
  // SEO
  seoTitle: string;
  seoDescription: string;
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (product: Product) => void;
  onSaveDraft: (product: Partial<Product>) => void;
  editingProduct?: Product | null;
  categories: Category[];
  subCategories: SubCategory[];
  childCategories: ChildCategory[];
  brands: Brand[];
  tags: Tag[];
  isLoading?: boolean;
  // Callbacks for creating new catalog items
  onAddCategory?: (category: Category) => void;
  onAddSubCategory?: (subCategory: SubCategory) => void;
  onAddChildCategory?: (childCategory: ChildCategory) => void;
  onAddTag?: (tag: Tag) => void;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onSaveDraft,
  editingProduct,
  categories,
  subCategories,
  childCategories,
  brands,
  tags,
  isLoading = false,
  onAddCategory,
  onAddSubCategory,
  onAddChildCategory,
  onAddTag
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // State for inline "Add New" forms
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewSubCategoryInput, setShowNewSubCategoryInput] = useState(false);
  const [newSubCategoryName, setNewSubCategoryName] = useState('');
  const [showNewChildCategoryInput, setShowNewChildCategoryInput] = useState(false);
  const [newChildCategoryName, setNewChildCategoryName] = useState('');
  const [showNewTagInput, setShowNewTagInput] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [descriptionViewMode, setDescriptionViewMode] = useState<'html' | 'preview'>('html');

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    slug: '',
    autoSlug: true,
    regularPrice: 0,
    salePrice: 0,
    costPrice: 0,
    sku: '',
    barcode: '',
    moq: 0,
    quantity: 0,
    categories: [],
    subCategories: [],
    childCategories: [],
    tags: [],
    brands: [],
    deliveryInsideDhaka: 80,
    deliveryOutsideDhaka: 120,
    expirationStart: '',
    expirationEnd: '',
    stockQuantity: 'Unlimited',
    stockStatus: 'In Stock',
    unlimited: true,
    hideInWebsite: false,
    mainImage: '',
    galleryImages: [],
    variations: [
      { id: '1', name: 'Add Variation 1', options: [] },
      { id: '2', name: 'Add Variation 2', options: [] },
      { id: '3', name: 'Add Variation 3', options: [] },
      { id: '4', name: 'Add Variation 4', options: [] },
    ],
    variantRows: [
      { id: '1', image: '', name: '', regularPrice: 0, salePrice: 0, costPrice: 0, quantity: 0, sku: '', isDefault: false },
      { id: '2', image: '', name: '', regularPrice: 0, salePrice: 0, costPrice: 0, quantity: 0, sku: '', isDefault: false },
      { id: '3', image: '', name: '', regularPrice: 0, salePrice: 0, costPrice: 0, quantity: 0, sku: '', isDefault: false },
      { id: '4', image: '', name: '', regularPrice: 0, salePrice: 0, costPrice: 0, quantity: 0, sku: '', isDefault: false },
    ],
    additionalSku: 'SKU1234567',
    additionalBarcode: '215464578621684',
    additionalMoq: 10,
    // Special product flags
    isDealOfTheDay: false,
    isMostSelling: false,
    isOurProduct: false,
    // SEO
    seoTitle: '',
    seoDescription: '',
  });

  // Get filtered subcategories based on selected categories (multi-select)
  const filteredSubCategories = subCategories.filter(sub => {
    return formData.categories.some(catName => {
      const cat = categories.find(c => c.name === catName);
      return cat && sub.categoryId === cat.id;
    });
  });

  // Get filtered child categories based on selected subcategories (multi-select)
  const filteredChildCategories = childCategories.filter(child => {
    return formData.subCategories.some(subName => {
      const sub = subCategories.find(s => s.name === subName);
      return sub && child.subCategoryId === sub.id;
    });
  });

  // Handler to create a new category
  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return;
    const newCategory: Category = {
      id: Date.now().toString(),
      name: newCategoryName.trim(),
      slug: newCategoryName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      status: 'Active',
    };
    onAddCategory?.(newCategory);
    setFormData(prev => ({ ...prev, categories: [...prev.categories, newCategory.name] }));
    setNewCategoryName('');
    setShowNewCategoryInput(false);
  };

  // Handler to create a new subcategory
  const handleCreateSubCategory = () => {
    if (!newSubCategoryName.trim() || formData.categories.length === 0) return;
    const parentCat = categories.find(c => formData.categories.includes(c.name));
    if (!parentCat) return;
    const newSubCategory: SubCategory = {
      id: Date.now().toString(),
      categoryId: parentCat.id,
      name: newSubCategoryName.trim(),
      status: 'Active',
      categoryName: ''
    };
    onAddSubCategory?.(newSubCategory);
    setFormData(prev => ({ ...prev, subCategories: [...prev.subCategories, newSubCategory.name] }));
    setNewSubCategoryName('');
    setShowNewSubCategoryInput(false);
  };

  // Handler to create a new child category
  const handleCreateChildCategory = () => {
    if (!newChildCategoryName.trim() || formData.subCategories.length === 0) return;
    const parentSub = subCategories.find(s => formData.subCategories.includes(s.name));
    if (!parentSub) return;
    const newChildCategory: ChildCategory = {
      id: Date.now().toString(),
      subCategoryId: parentSub.id,
      name: newChildCategoryName.trim(),
      status: 'Active',
    };
    onAddChildCategory?.(newChildCategory);
    setFormData(prev => ({ ...prev, childCategories: [...prev.childCategories, newChildCategory.name] }));
    setNewChildCategoryName('');
    setShowNewChildCategoryInput(false);
  };

  // Handler to create a new tag
  const handleCreateTag = () => {
    if (!newTagName.trim()) return;
    const newTag: Tag = {
      id: Date.now().toString(),
      name: newTagName.trim(),
      status: 'Active',
    };
    onAddTag?.(newTag);
    setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.name] }));
    setNewTagName('');
    setShowNewTagInput(false);
  };

  // Toggle tag in formData.tags
  const toggleTag = (tagName: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagName)
        ? prev.tags.filter(t => t !== tagName)
        : [...prev.tags, tagName]
    }));
  };

  const [variationInputs, setVariationInputs] = useState<Record<string, string>>({});
  const [expandedVariations, setExpandedVariations] = useState<Record<string, boolean>>({
    '1': true, '2': false, '3': false, '4': false,
  });

  useEffect(() => {
    if (editingProduct) {
      // Check if special tags are present in the tags array
      const productTags = editingProduct.tags || [];
      const isDealOfTheDay = hasSpecialTag(productTags, SPECIAL_TAGS.DEAL_OF_THE_DAY);
      const isMostSelling = hasSpecialTag(productTags, SPECIAL_TAGS.MOST_SELLING);
      const isOurProduct = hasSpecialTag(productTags, SPECIAL_TAGS.OUR_PRODUCTS);
      
      setFormData(prev => ({
        ...prev,
        name: editingProduct.name || '',
        description: editingProduct.description || '',
        slug: editingProduct.slug || '',
        regularPrice: editingProduct.price || 0,
        salePrice: editingProduct.originalPrice || 0,
        sku: editingProduct.sku || '',
        categories: editingProduct.category ? [editingProduct.category] : [],
        subCategories: editingProduct.subCategory ? [editingProduct.subCategory] : [],
        childCategories: editingProduct.childCategory ? [editingProduct.childCategory] : [],
        tags: productTags,
        brands: editingProduct.brand ? [editingProduct.brand] : [],
        mainImage: editingProduct.image || '',
        galleryImages: editingProduct.galleryImages || [],
        isDealOfTheDay,
        isMostSelling,
        isOurProduct,
        seoTitle: editingProduct.seoTitle || '',
        seoDescription: editingProduct.seoDescription || '',
      }));
    }
  }, [editingProduct]);

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const handleNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      name: value,
      slug: prev.autoSlug ? generateSlug(value) : prev.slug
    }));
  };

  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setFormData(prev => ({ ...prev, mainImage: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          setFormData(prev => ({
            ...prev,
            galleryImages: [...prev.galleryImages, reader.result as string].slice(0, 10)
          }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, i) => i !== index)
    }));
  };

  const handleVariantImageUpload = (variantId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          setFormData(prev => ({
            ...prev,
            variantRows: prev.variantRows.map(row =>
              row.id === variantId ? { ...row, image: reader.result as string } : row
            )
          }));
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const updateVariantRow = (id: string, field: keyof VariantRow, value: any) => {
    setFormData(prev => ({
      ...prev,
      variantRows: prev.variantRows.map(row =>
        row.id === id ? { ...row, [field]: value } : row
      )
    }));
  };

  const addVariationOption = (variationId: string) => {
    const input = variationInputs[variationId]?.trim();
    if (!input) return;
    setFormData(prev => ({
      ...prev,
      variations: prev.variations.map(v =>
        v.id === variationId
          ? { ...v, options: [...v.options, { id: Date.now().toString(), name: input }] }
          : v
      )
    }));
    setVariationInputs(prev => ({ ...prev, [variationId]: '' }));
  };

  const removeVariationOption = (variationId: string, optionId: string) => {
    setFormData(prev => ({
      ...prev,
      variations: prev.variations.map(v =>
        v.id === variationId
          ? { ...v, options: v.options.filter(o => o.id !== optionId) }
          : v
      )
    }));
  };

  const toggleVariation = (id: string) => {
    setExpandedVariations(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const applyToAll = () => {
    setFormData(prev => ({
      ...prev,
      variantRows: prev.variantRows.map(row => ({
        ...row,
        regularPrice: prev.regularPrice,
        salePrice: prev.salePrice,
        costPrice: prev.costPrice,
        quantity: prev.quantity,
        sku: prev.sku,
      }))
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build tags array including special tags using helper function
    let finalTags = [...formData.tags];
    finalTags = toggleSpecialTag(finalTags, SPECIAL_TAGS.DEAL_OF_THE_DAY, formData.isDealOfTheDay);
    finalTags = toggleSpecialTag(finalTags, SPECIAL_TAGS.MOST_SELLING, formData.isMostSelling);
    finalTags = toggleSpecialTag(finalTags, SPECIAL_TAGS.OUR_PRODUCTS, formData.isOurProduct);
    
    const productData: Product = {
      id: editingProduct?.id || Date.now(),
      name: formData.name,
      description: formData.description,
      slug: formData.slug,
      price: formData.regularPrice,
      originalPrice: formData.salePrice,
      image: formData.mainImage,
      galleryImages: formData.galleryImages,
      category: formData.categories.join(', '),
      subCategory: formData.subCategories.join(', '),
      childCategory: formData.childCategories.join(', '),
      brand: formData.brands.join(', '),
      tags: finalTags,
      searchTags: [],
      colors: [],
      sizes: [],
      discount: '',
      status: 'Active',
      sku: formData.sku,
      coins: undefined,
      sold: undefined,
      title: '',
      salePrice: undefined,
      condition: 'new' as const,
      seoTitle: formData.seoTitle || undefined,
      seoDescription: formData.seoDescription || undefined,
    };
    onSubmit(productData);
  };

  const handleSaveDraft = () => {
    onSaveDraft({
      name: formData.name,
      description: formData.description,
      slug: formData.slug,
      price: formData.regularPrice,
      originalPrice: formData.salePrice,
      image: formData.mainImage,
      galleryImages: formData.galleryImages,
      category: formData.categories.join(', '),
      tags: formData.tags,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-2 sm:p-4 md:p-8">
      <div className="relative w-full max-w-[1280px] bg-white rounded-xl sm:rounded-2xl md:rounded-[30px] shadow-[0px_0px_37.8px_0px_rgba(0,0,0,0.40)] my-2 sm:my-4 overflow-hidden">
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute right-3 to p-3 sm:right-6 sm:to p-6 md:right-8 md:to p-8 z-10 min-w-[44px] min-h-[44px] sm:w-9 sm:h-9 sm:min-w-0 sm:min-h-0 bg-neutral-400/25 rounded-lg flex items-center justify-center hover:bg-neutral-400/40 transition-colors"
        >
          <X size={16} className="text-black" />
        </button>

        <form onSubmit={handleSubmit} className="p-4 pt-14 sm:p-6 sm:pt-16 md:p-8 md:pt-20 lg:p-[82px] lg:pt-[100px]">
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            {/* Left Column - Responsive */}
            <div className="w-full lg:flex-1 lg:min-w-0 bg-white rounded-lg shadow-[0px_1px_3px_0px_rgba(0,0,0,0.20)] p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-hidden">
              
              {/* Basic Details Section */}
              <div>
                <h2 className="text-zinc-800 text-lg sm:text-xl font-bold font-['Lato'] leading-6 mb-4 sm:mb-6">Basic Details</h2>
                
                {/* Product Name */}
                <div className="mb-3">
                  <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 mb-3">
                    <label className="text-teal-950 text-sm sm:text-base font-bold font-['Lato']">Product Name</label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.autoSlug} 
                        onChange={(e) => setFormData(prev => ({ ...prev, autoSlug: e.target.checked }))} 
                        className="w-4 h-4 rounded border-2 border-neutral-400 text-blue-500 focus:ring-blue-400" 
                      />
                      <span className="text-neutral-400 text-sm sm:text-base font-medium font-['Roboto']">Auto Slug</span>
                    </label>
                  </div>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={(e) => handleNameChange(e.target.value)} 
                    placeholder="Jasmine Fragrance Oil" 
                    className="w-full h-11 sm:h-12 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200 text-teal-950 text-sm sm:text-base font-normal font-['Lato'] focus:outline-none focus:ring-2 focus:ring-blue-400" 
                  />
                </div>

                {/* Product Description */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-teal-950 text-sm sm:text-base font-bold font-['Lato']">Product Description</label>
                    <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => setDescriptionViewMode('html')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          descriptionViewMode === 'html' 
                            ? 'bg-white text-blue-600 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        <Code size={14} />
                        HTML
                      </button>
                      <button
                        type="button"
                        onClick={() => setDescriptionViewMode('preview')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          descriptionViewMode === 'preview' 
                            ? 'bg-white text-blue-600 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        <Eye size={14} />
                        Preview
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    {descriptionViewMode === 'html' ? (
                      <textarea 
                        value={formData.description} 
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} 
                        placeholder="Enter HTML description or plain text..."
                        rows={8}
                        className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 text-teal-950 text-sm font-mono leading-6 resize-y focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    ) : (
                      <div 
                        className="w-full min-h-[200px] p-3 bg-gray-50 rounded-lg border border-gray-200 text-teal-950 text-sm sm:text-base font-normal font-['Lato'] leading-6 overflow-auto prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: formData.description || '<p class="text-gray-400">No description to preview</p>' }}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="w-full h-[0.5px] bg-zinc-400" />

              {/* Price & Stock Section */}
              <div>
                <h2 className="text-zinc-800 text-lg sm:text-xl font-bold font-['Lato'] leading-6 mb-4 sm:mb-6">Price & Stock</h2>
                
                {/* Row 1: Regular Price, Sale Price, Cost Price, SKU - Responsive Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
                  <div>
                    <label className="block text-teal-950 text-xs sm:text-base font-bold font-['Lato'] mb-2 sm:mb-3">Regular Price</label>
                    <input 
                      type="text" 
                      value={formData.regularPrice || ''} 
                      onChange={(e) => setFormData(prev => ({ ...prev, regularPrice: parseFloat(e.target.value) || 0 }))} 
                      placeholder="Ex 1990" 
                      className="w-full h-10 sm:h-12 px-2 sm:px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-neutral-400 text-sm sm:text-base font-bold font-['Lato'] focus:outline-none focus:ring-2 focus:ring-blue-400" 
                    />
                  </div>
                  <div>
                    <label className="block text-teal-950 text-xs sm:text-base font-bold font-['Lato'] mb-2 sm:mb-3">Sale Price</label>
                    <input 
                      type="text" 
                      value={formData.salePrice || ''} 
                      onChange={(e) => setFormData(prev => ({ ...prev, salePrice: parseFloat(e.target.value) || 0 }))} 
                      placeholder="Ex 1990" 
                      className="w-full h-10 sm:h-12 px-2 sm:px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-neutral-400 text-sm sm:text-base font-bold font-['Lato'] focus:outline-none focus:ring-2 focus:ring-blue-400" 
                    />
                  </div>
                  <div>
                    <label className="block text-teal-950 text-xs sm:text-base font-bold font-['Lato'] mb-2 sm:mb-3">Cost Price</label>
                    <input 
                      type="text" 
                      value={formData.costPrice || ''} 
                      onChange={(e) => setFormData(prev => ({ ...prev, costPrice: parseFloat(e.target.value) || 0 }))} 
                      placeholder="Ex 1990" 
                      className="w-full h-10 sm:h-12 px-2 sm:px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-neutral-400 text-sm sm:text-base font-bold font-['Lato'] focus:outline-none focus:ring-2 focus:ring-blue-400" 
                    />
                  </div>
                  <div>
                    <label className="block text-teal-950 text-xs sm:text-base font-bold font-['Lato'] mb-2 sm:mb-3">SKU</label>
                    <input 
                      type="text" 
                      value={formData.sku} 
                      onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))} 
                      placeholder="#SK0001" 
                      className="w-full h-10 sm:h-12 px-2 sm:px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-black text-sm sm:text-base font-normal font-['Lato'] focus:outline-none focus:ring-2 focus:ring-blue-400" 
                    />
                  </div>
                </div>

                {/* Row 2: Bar code, MOQ, Quantity, Apply to all - Responsive */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 items-end">
                  <div className="col-span-2 sm:col-span-1 sm:flex-1 sm:min-w-[140px] sm:max-w-[180px]">
                    <label className="block text-teal-950 text-xs sm:text-base font-bold font-['Lato'] mb-2 sm:mb-3">Bar code</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={formData.barcode} 
                        onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))} 
                        placeholder="2154645786216" 
                        className="w-full h-10 sm:h-12 px-2 sm:px-3 py-2 pr-9 sm:pr-10 bg-gray-50 rounded-lg border border-gray-200 text-teal-950 text-sm sm:text-base font-bold font-['Lato'] focus:outline-none focus:ring-2 focus:ring-blue-400" 
                      />
                      <ScanLine size={18} className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-600" />
                    </div>
                  </div>
                  <div className="sm:w-24 md:w-28">
                    <label className="block text-teal-950 text-xs sm:text-base font-bold font-['Lato'] mb-2 sm:mb-3">MOQ</label>
                    <input 
                      type="text" 
                      value={formData.moq || ''} 
                      onChange={(e) => setFormData(prev => ({ ...prev, moq: parseInt(e.target.value) || 0 }))} 
                      placeholder="Ex 10" 
                      className="w-full h-10 sm:h-12 px-2 sm:px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-neutral-400 text-sm sm:text-base font-bold font-['Lato'] focus:outline-none focus:ring-2 focus:ring-blue-400" 
                    />
                  </div>
                  <div className="sm:w-24 md:w-28">
                    <label className="block text-teal-950 text-xs sm:text-base font-bold font-['Lato'] mb-2 sm:mb-3">Quantity</label>
                    <input 
                      type="text" 
                      value={formData.quantity || ''} 
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))} 
                      placeholder="Ex 100" 
                      className="w-full h-10 sm:h-12 px-2 sm:px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-neutral-400 text-sm sm:text-base font-bold font-['Lato'] focus:outline-none focus:ring-2 focus:ring-blue-400" 
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={applyToAll} 
                    className="col-span-2 sm:col-span-1 h-10 sm:h-12 px-3 py-2 bg-gray-50 rounded-lg border border-blue-500 text-sky-400 text-sm sm:text-base font-bold font-['Roboto'] hover:bg-blue-50 transition-colors whitespace-nowrap"
                  >
                    Apply to all
                  </button>
                </div>
              </div>

              {/* Variant Rows Section - Responsive */}
              <div className="space-y-4">
                {formData.variantRows.map((variant) => (
                  <div key={variant.id} className="flex flex-col gap-2 p-3 sm:p-0 bg-gray-50 sm:bg-transparent rounded-lg sm:rounded-none">
                    {/* Default checkbox aligned right */}
                    <div className="flex justify-end items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={variant.isDefault} 
                        onChange={(e) => updateVariantRow(variant.id, 'isDefault', e.target.checked)} 
                        className="w-4 h-4 rounded border-2 border-slate-900/75" 
                      />
                      <span className="text-neutral-400 text-sm sm:text-base font-medium font-['Roboto']">Default</span>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4">
                      {/* Upload Image Box */}
                      <div 
                        onClick={() => handleVariantImageUpload(variant.id)} 
                        className="w-full sm:w-28 md:w-36 h-20 sm:h-24 bg-white sm:bg-gray-50 rounded-lg border border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors overflow-hidden"
                      >
                        {variant.image ? (
                          <img src={variant.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center gap-1 sm:gap-2">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                              <ImageIcon size={24} className="text-neutral-400 sm:hidden" />
                              <ImageIcon size={32} className="text-neutral-400 hidden sm:block" />
                            </div>
                            <span className="text-neutral-400 text-xs sm:text-base font-medium font-['Roboto']">Upload Image</span>
                          </div>
                        )}
                      </div>

                      {/* Input Fields Grid - Responsive */}
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="grid grid-cols-3 gap-2">
                          <input 
                            type="text" 
                            value={variant.name} 
                            onChange={(e) => updateVariantRow(variant.id, 'name', e.target.value)} 
                            placeholder="Name" 
                            className="w-full h-10 sm:h-12 px-2 sm:px-3 py-2 bg-white sm:bg-gray-50 rounded-lg border border-gray-200 text-neutral-400 text-xs sm:text-base font-medium font-['Roboto'] focus:outline-none focus:ring-2 focus:ring-blue-400" 
                          />
                          <input 
                            type="text" 
                            value={variant.regularPrice || ''} 
                            onChange={(e) => updateVariantRow(variant.id, 'regularPrice', parseFloat(e.target.value) || 0)} 
                            placeholder="Reg. Price" 
                            className="w-full h-10 sm:h-12 px-2 sm:px-3 py-2 bg-white sm:bg-gray-50 rounded-lg border border-gray-200 text-neutral-400 text-xs sm:text-base font-medium font-['Roboto'] focus:outline-none focus:ring-2 focus:ring-blue-400" 
                          />
                          <input 
                            type="text" 
                            value={variant.salePrice || ''} 
                            onChange={(e) => updateVariantRow(variant.id, 'salePrice', parseFloat(e.target.value) || 0)} 
                            placeholder="Sale Price" 
                            className="w-full h-10 sm:h-12 px-2 sm:px-3 py-2 bg-white sm:bg-gray-50 rounded-lg border border-gray-200 text-neutral-400 text-xs sm:text-base font-medium font-['Roboto'] focus:outline-none focus:ring-2 focus:ring-blue-400" 
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <input 
                            type="text" 
                            value={variant.costPrice || ''} 
                            onChange={(e) => updateVariantRow(variant.id, 'costPrice', parseFloat(e.target.value) || 0)} 
                            placeholder="Cost Price" 
                            className="w-full h-10 sm:h-12 px-2 sm:px-3 py-2 bg-white sm:bg-gray-50 rounded-lg border border-gray-200 text-neutral-400 text-xs sm:text-base font-medium font-['Roboto'] focus:outline-none focus:ring-2 focus:ring-blue-400" 
                          />
                          <input 
                            type="text" 
                            value={variant.quantity || ''} 
                            onChange={(e) => updateVariantRow(variant.id, 'quantity', parseInt(e.target.value) || 0)} 
                            placeholder="Qty" 
                            className="w-full h-10 sm:h-12 px-2 sm:px-3 py-2 bg-white sm:bg-gray-50 rounded-lg border border-gray-200 text-neutral-400 text-xs sm:text-base font-medium font-['Roboto'] focus:outline-none focus:ring-2 focus:ring-blue-400" 
                          />
                          <input 
                            type="text" 
                            value={variant.sku} 
                            onChange={(e) => updateVariantRow(variant.id, 'sku', e.target.value)} 
                            placeholder="SKU" 
                            className="w-full h-10 sm:h-12 px-2 sm:px-3 py-2 bg-white sm:bg-gray-50 rounded-lg border border-gray-200 text-neutral-400 text-xs sm:text-base font-medium font-['Roboto'] focus:outline-none focus:ring-2 focus:ring-blue-400" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Additional (Optional) Section - Responsive */}
              <div>
                <h2 className="mb-4 sm:mb-6">
                  <span className="text-zinc-800 text-lg sm:text-xl font-bold font-['Lato'] leading-6">Additional</span>
                  <span className="text-neutral-400 text-lg sm:text-xl font-bold font-['Lato'] leading-6"> </span>
                  <span className="text-neutral-400 text-lg sm:text-xl font-normal font-['Lato'] leading-6">(Optional)</span>
                </h2>

                {/* SKU and Bar Code - Responsive */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mb-4 sm:mb-6">
                  <div>
                    <label className="block text-teal-950 text-sm sm:text-base font-bold font-['Lato'] mb-2 sm:mb-3">SKU</label>
                    <input 
                      type="text" 
                      value={formData.additionalSku} 
                      onChange={(e) => setFormData(prev => ({ ...prev, additionalSku: e.target.value }))} 
                      placeholder="SKU1234567" 
                      className="w-full h-10 sm:h-12 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-teal-950 text-sm sm:text-base font-bold font-['Lato'] focus:outline-none focus:ring-2 focus:ring-blue-400" 
                    />
                  </div>
                  <div>
                    <label className="block text-teal-950 text-sm sm:text-base font-bold font-['Lato'] mb-2 sm:mb-3">Bar Code</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={formData.additionalBarcode} 
                        onChange={(e) => setFormData(prev => ({ ...prev, additionalBarcode: e.target.value }))} 
                        placeholder="215464578621684" 
                        className="w-full h-10 sm:h-12 px-3 py-2 pr-9 sm:pr-10 bg-gray-50 rounded-lg border border-gray-200 text-teal-950 text-sm sm:text-base font-bold font-['Lato'] focus:outline-none focus:ring-2 focus:ring-blue-400" 
                      />
                      <ScanLine size={18} className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-600" />
                    </div>
                  </div>
                </div>

                {/* Delivery Charge - Responsive */}
                <div className="mb-4 sm:mb-6">
                  <label className="block text-teal-950 text-sm sm:text-base font-bold font-['Lato'] mb-2 sm:mb-3">Delivery charge</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-xs sm:text-base font-normal font-['Lato'] whitespace-nowrap">Inside Dhaka</span>
                      <input 
                        type="text" 
                        value={formData.deliveryInsideDhaka} 
                        onChange={(e) => setFormData(prev => ({ ...prev, deliveryInsideDhaka: parseInt(e.target.value) || 0 }))} 
                        className="flex-1 h-10 sm:h-12 px-3 bg-gray-50 rounded-lg border border-gray-200 text-teal-950 text-sm sm:text-base font-normal font-['Lato'] focus:outline-none focus:ring-2 focus:ring-blue-400" 
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-xs sm:text-base font-normal font-['Lato'] whitespace-nowrap">Outside Dhaka</span>
                      <input 
                        type="text" 
                        value={formData.deliveryOutsideDhaka} 
                        onChange={(e) => setFormData(prev => ({ ...prev, deliveryOutsideDhaka: parseInt(e.target.value) || 0 }))} 
                        className="flex-1 h-10 sm:h-12 px-3 bg-gray-50 rounded-lg border border-gray-200 text-teal-950 text-sm sm:text-base font-normal font-['Lato'] focus:outline-none focus:ring-2 focus:ring-blue-400" 
                      />
                    </div>
                  </div>
                </div>

                {/* Expiration and MOQ - Responsive */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div>
                    <label className="block text-teal-950 text-sm sm:text-base font-bold font-['Lato'] mb-2 sm:mb-3">Expiration</label>
                    <div className="grid grid-cols-2 gap-2 sm:gap-5">
                      <div className="relative">
                        <input 
                          type="date" 
                          value={formData.expirationStart} 
                          onChange={(e) => setFormData(prev => ({ ...prev, expirationStart: e.target.value }))} 
                          className="w-full h-10 sm:h-12 px-2 sm:px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-teal-950 text-xs sm:text-base font-normal font-['Lato'] focus:outline-none focus:ring-2 focus:ring-blue-400" 
                          placeholder="Start"
                        />
                      </div>
                      <div className="relative">
                        <input 
                          type="date" 
                          value={formData.expirationEnd} 
                          onChange={(e) => setFormData(prev => ({ ...prev, expirationEnd: e.target.value }))} 
                          className="w-full h-10 sm:h-12 px-2 sm:px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-teal-950 text-xs sm:text-base font-normal font-['Lato'] focus:outline-none focus:ring-2 focus:ring-blue-400" 
                          placeholder="End"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="sm:max-w-[160px]">
                    <label className="block text-teal-950 text-sm sm:text-base font-bold font-['Lato'] mb-2 sm:mb-3">MOQ</label>
                    <input 
                      type="text" 
                      value={formData.additionalMoq} 
                      onChange={(e) => setFormData(prev => ({ ...prev, additionalMoq: parseInt(e.target.value) || 0 }))} 
                      placeholder="10" 
                      className="w-full h-10 sm:h-12 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-teal-950 text-sm sm:text-base font-bold font-['Lato'] focus:outline-none focus:ring-2 focus:ring-blue-400" 
                    />
                  </div>
                </div>
              </div>

              {/* Inventory Section - Responsive */}
              <div>
                <h2 className="text-zinc-800 text-lg sm:text-xl font-bold font-['Lato'] leading-6 mb-4 sm:mb-6">Inventory</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-4">
                  <div>
                    <label className="block text-teal-950 text-sm sm:text-base font-bold font-['Lato'] mb-2 sm:mb-3">Stock Quantity</label>
                    <input 
                      type="text" 
                      value={formData.stockQuantity} 
                      onChange={(e) => setFormData(prev => ({ ...prev, stockQuantity: e.target.value }))} 
                      placeholder="Unlimited" 
                      disabled={formData.unlimited}
                      className="w-full h-10 sm:h-12 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-teal-950 text-sm sm:text-base font-normal font-['Lato'] focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50" 
                    />
                    {/* Unlimited Toggle */}
                    <div className="flex items-center gap-3 mt-3">
                      <button 
                        type="button" 
                        onClick={() => setFormData(prev => ({ ...prev, unlimited: !prev.unlimited }))} 
                        className={`w-12 h-6 px-1 py-1.5 rounded-[200px] flex items-center overflow-hidden transition-colors ${formData.unlimited ? 'bg-gradient-to-r from-sky-400 to-blue-500 justify-end' : 'bg-gray-300 justify-start'}`}
                      >
                        <div className="w-4 h-4 bg-lime-50 rounded-full" />
                      </button>
                      <span className="text-teal-950 text-sm sm:text-base font-normal font-['Lato']">Unlimited</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-teal-950 text-sm sm:text-base font-bold font-['Lato'] mb-2 sm:mb-3">Stock Status</label>
                    <div className="relative">
                      <select 
                        value={formData.stockStatus} 
                        onChange={(e) => setFormData(prev => ({ ...prev, stockStatus: e.target.value }))} 
                        className="w-full h-10 sm:h-12 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-teal-950 text-sm sm:text-base font-normal font-['Lato'] focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none cursor-pointer"
                      >
                        <option value="In Stock">In Stock</option>
                        <option value="Out of Stock">Out of Stock</option>
                        <option value="Pre-order">Pre-order</option>
                      </select>
                      <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-950 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Hide in website checkbox */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <div 
                    className={`w-5 h-5 rounded overflow-hidden flex items-center justify-center ${formData.hideInWebsite ? 'bg-gradient-to-r from-sky-400 to-blue-500' : 'border-2 border-gray-300'}`}
                    onClick={() => setFormData(prev => ({ ...prev, hideInWebsite: !prev.hideInWebsite }))}
                  >
                    {formData.hideInWebsite && (
                      <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                        <path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-gray-500 text-xs sm:text-base font-normal font-['Lato']">Hide in website (for landing page)</span>
                </label>
              </div>

              {/* SEO Settings Section */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <Globe size={18} className="text-teal-950" />
                  <h2 className="text-zinc-800 text-lg sm:text-xl font-bold font-['Lato'] leading-6">SEO Settings</h2>
                </div>

                {/* SEO Title */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-teal-950 text-sm font-medium font-['Lato']">SEO Title</label>
                    <span className={`text-xs font-medium font-['Lato'] ${
                      formData.seoTitle.length > 70 ? 'text-red-500' : formData.seoTitle.length >= 50 ? 'text-orange-500' : 'text-gray-400'
                    }`}>
                      {formData.seoTitle.length}/70
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formData.seoTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
                    maxLength={70}
                    placeholder={formData.name || 'Enter SEO title...'}
                    className="w-full h-10 sm:h-12 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-teal-950 text-sm font-normal font-['Lato'] focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                {/* SEO Description */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-teal-950 text-sm font-medium font-['Lato']">SEO Description</label>
                    <span className={`text-xs font-medium font-['Lato'] ${
                      formData.seoDescription.length > 160 ? 'text-red-500' : formData.seoDescription.length >= 140 ? 'text-orange-500' : 'text-gray-400'
                    }`}>
                      {formData.seoDescription.length}/160
                    </span>
                  </div>
                  <textarea
                    value={formData.seoDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
                    maxLength={160}
                    rows={3}
                    placeholder="Enter a brief description for search engines..."
                    className="w-full px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-teal-950 text-sm font-normal font-['Lato'] focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  />
                </div>

                {/* Google SERP Preview */}
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Search size={14} className="text-gray-400" />
                    <span className="text-gray-400 text-xs font-medium font-['Lato']">Google Search Preview</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[#1a0dab] text-base font-medium leading-snug truncate cursor-pointer hover:underline font-['Lato']">
                      {formData.seoTitle || formData.name || 'Product Name'}
                    </p>
                    <p className="text-[#006621] text-xs truncate font-['Lato']">
                      www.yourstore.com › products › {formData.slug || 'product-slug'}
                    </p>
                    <p className="text-[#545454] text-sm leading-relaxed line-clamp-2 font-['Lato']">
                      {formData.seoDescription || 'Add an SEO description to control how this product appears in search engine results.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Responsive */}
              <div className="flex flex-col-reverse xs:flex-row items-stretch xs:items-center justify-end gap-3 pt-4 sm:pt-6">
                <button 
                  type="button" 
                  onClick={handleSaveDraft} 
                  className="h-10 sm:h-10 px-3 py-1.5 bg-white rounded-lg border border-gray-200 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                >
                  <FolderOpen size={16} className="text-teal-950" />
                  <span className="text-teal-950 text-sm sm:text-base font-bold font-['Lato']">Save to draft</span>
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="h-10 sm:h-10 px-4 py-1.5 bg-gradient-to-r from-sky-400 to-blue-500 rounded-lg flex items-center justify-center gap-1 hover:from-sky-500 hover:to-blue-600 transition-colors disabled:opacity-50"
                >
                  <span className="text-white text-sm sm:text-base font-bold font-['Lato']">{isLoading ? 'Publishing...' : 'Publish Product'}</span>
                </button>
              </div>
            </div>

            {/* Right Column - Responsive */}
            <div className="w-full lg:w-[400px] xl:w-[485px] lg:flex-shrink-0 bg-white rounded-lg shadow-[0px_1px_3px_0px_rgba(0,0,0,0.20)] p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-hidden">
              
              {/* Upload Product Image Section - Responsive */}
              <div>
                <h2 className="text-zinc-800 text-lg sm:text-xl font-bold font-['Lato'] leading-6 mb-1">Upload Product Image</h2>
                <p className="text-teal-950 text-sm sm:text-base font-bold font-['Lato'] mb-3">Up to 10 Images</p>
                
                {/* Main Image Upload - Responsive */}
                <div className="w-full sm:w-96 h-48 sm:h-64 relative bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
                  {formData.mainImage ? (
                    <img src={formData.mainImage} alt="Product" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={60} className="text-gray-300 sm:hidden" />
                      <ImageIcon size={100} className="text-gray-300 hidden sm:block" />
                    </div>
                  )}
                  
                  {/* Browse and Replace buttons */}
                  <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3">
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()} 
                      className="h-8 sm:h-9 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-200 flex items-center gap-1 bg-white hover:bg-gray-50"
                    >
                      <FolderOpen size={16} className="text-gray-500 sm:hidden" />
                      <FolderOpen size={20} className="text-gray-500 hidden sm:block" />
                      <span className="text-gray-500 text-xs sm:text-sm font-normal font-['Lato']">Browse</span>
                    </button>
                  </div>
                  <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3">
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()} 
                      className="h-8 sm:h-9 p-1.5 sm:p-2 bg-white rounded-lg shadow-[0px_1px_3px_0px_rgba(0,0,0,0.20)] flex items-center gap-1 sm:gap-2 hover:bg-gray-50"
                    >
                      <RefreshCw size={14} className="text-black sm:hidden" />
                      <RefreshCw size={16} className="text-black hidden sm:block" />
                      <span className="text-black text-xs sm:text-sm font-normal font-['Lato']">Replace</span>
                    </button>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleMainImageUpload} className="hidden" />
                </div>

                {/* Gallery Images - Responsive */}
                <div className="flex gap-2 sm:gap-4 flex-wrap">
                  {formData.galleryImages.slice(0, 2).map((img, index) => (
                    <div key={index} className="w-16 h-16 sm:w-24 sm:h-24 relative rounded-lg border border-gray-200 overflow-hidden group">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => removeGalleryImage(index)} 
                        className="absolute to p-0.5 right-0.5 sm:top-1 sm:right-1 w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} className="text-gray-500 sm:hidden" />
                        <X size={14} className="text-gray-500 hidden sm:block" />
                      </button>
                    </div>
                  ))}
                  
                  {/* Add Image Button - Responsive */}
                  {formData.galleryImages.length < 10 && (
                    <button 
                      type="button" 
                      onClick={() => galleryInputRef.current?.click()} 
                      className="flex-1 min-w-[100px] sm:min-w-[140px] max-w-[180px] sm:max-w-[220px] h-16 sm:h-24 rounded-lg border border-neutral-400 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <Plus size={20} className="text-lime-500 mb-0.5 sm:mb-1 sm:hidden" />
                      <Plus size={24} className="text-lime-500 mb-0.5 sm:mb-1 hidden sm:block" />
                      <span className="text-lime-500 text-xs sm:text-base font-normal font-['Lato'] leading-5">Add Image</span>
                    </button>
                  )}
                  <input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" />
                </div>
              </div>

              {/* Categories Section - Multi-Select with Chips */}
              <div>
                <h2 className="text-zinc-800 text-lg sm:text-xl font-bold font-['Lato'] leading-6 mb-3 sm:mb-4">Catalog</h2>
                
                {/* Selected Chips Display */}
                {(formData.categories.length > 0 || formData.subCategories.length > 0 || formData.childCategories.length > 0 || formData.brands.length > 0) && (
                  <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Selected</p>
                    <div className="flex flex-wrap gap-1.5">
                      {formData.categories.map(c => (
                        <span key={`cat-${c}`} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                          {c}
                          <button type="button" onClick={() => setFormData(prev => ({ ...prev, categories: prev.categories.filter(x => x !== c), subCategories: prev.subCategories.filter(sc => { const cat = categories.find(ct => ct.name === c); return !cat || !subCategories.find(s => s.name === sc && s.categoryId === cat.id); }), childCategories: [] }))} className="hover:text-blue-900 ml-0.5"><X size={12} /></button>
                        </span>
                      ))}
                      {formData.subCategories.map(s => (
                        <span key={`sub-${s}`} className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                          {s}
                          <button type="button" onClick={() => setFormData(prev => ({ ...prev, subCategories: prev.subCategories.filter(x => x !== s), childCategories: [] }))} className="hover:text-emerald-900 ml-0.5"><X size={12} /></button>
                        </span>
                      ))}
                      {formData.childCategories.map(c => (
                        <span key={`child-${c}`} className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                          {c}
                          <button type="button" onClick={() => setFormData(prev => ({ ...prev, childCategories: prev.childCategories.filter(x => x !== c) }))} className="hover:text-purple-900 ml-0.5"><X size={12} /></button>
                        </span>
                      ))}
                      {formData.brands.map(b => (
                        <span key={`brand-${b}`} className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                          {b}
                          <button type="button" onClick={() => setFormData(prev => ({ ...prev, brands: prev.brands.filter(x => x !== b) }))} className="hover:text-amber-900 ml-0.5"><X size={12} /></button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category Multi-Select Dropdown */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <label className="text-teal-950 text-sm sm:text-base font-bold font-['Lato']">Product Categories</label>
                    <button type="button" onClick={() => setShowNewCategoryInput(!showNewCategoryInput)} className="flex items-center gap-1 p-2 hover:opacity-80">
                      <Plus size={18} className="text-black sm:hidden" />
                      <Plus size={20} className="text-black hidden sm:block" />
                      <span className="text-teal-950 text-xs font-bold font-['Lato']">Add New</span>
                    </button>
                  </div>
                  {showNewCategoryInput && (
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Enter category name" className="w-full p-2 mb-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateCategory())} />
                      <div className="flex gap-2">
                        <button type="button" onClick={handleCreateCategory} className="flex-1 px-3 py-1.5 bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-lg text-xs font-medium hover:from-sky-500 hover:to-blue-600">Save Category</button>
                        <button type="button" onClick={() => { setShowNewCategoryInput(false); setNewCategoryName(''); }} className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
                      </div>
                    </div>
                  )}
                  <div className="relative">
                    <select
                      value=""
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val && !formData.categories.includes(val)) {
                          setFormData(prev => ({ ...prev, categories: [...prev.categories, val] }));
                        }
                      }}
                      className="w-full p-2.5 sm:p-3 bg-white rounded-lg shadow-[0px_1px_3px_0px_rgba(0,0,0,0.20)] text-teal-950 text-sm sm:text-base font-normal font-['Lato'] focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none cursor-pointer"
                    >
                      <option value="">Select category</option>
                      {categories.filter(c => !formData.categories.includes(c.name)).map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                    </select>
                    <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-black pointer-events-none sm:hidden" />
                    <ChevronDown size={24} className="absolute right-3 top-1/2 -translate-y-1/2 text-black pointer-events-none hidden sm:block" />
                  </div>
                </div>

                {/* Sub Category Multi-Select */}
                {formData.categories.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <label className="text-teal-950 text-sm sm:text-base font-bold font-['Lato']">Sub Category</label>
                      <button type="button" onClick={() => setShowNewSubCategoryInput(!showNewSubCategoryInput)} className="flex items-center gap-1 p-2 hover:opacity-80">
                        <Plus size={18} className="text-black sm:hidden" />
                        <Plus size={20} className="text-black hidden sm:block" />
                        <span className="text-teal-950 text-xs font-bold font-['Lato']">Add New</span>
                      </button>
                    </div>
                    {showNewSubCategoryInput && (
                      <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <input type="text" value={newSubCategoryName} onChange={(e) => setNewSubCategoryName(e.target.value)} placeholder="Enter sub category name" className="w-full p-2 mb-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateSubCategory())} />
                        <div className="flex gap-2">
                          <button type="button" onClick={handleCreateSubCategory} className="flex-1 px-3 py-1.5 bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-lg text-xs font-medium hover:from-sky-500 hover:to-blue-600">Save Sub Category</button>
                          <button type="button" onClick={() => { setShowNewSubCategoryInput(false); setNewSubCategoryName(''); }} className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
                        </div>
                      </div>
                    )}
                    <div className="relative">
                      <select
                        value=""
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val && !formData.subCategories.includes(val)) {
                            setFormData(prev => ({ ...prev, subCategories: [...prev.subCategories, val] }));
                          }
                        }}
                        className="w-full p-2.5 sm:p-3 bg-white rounded-lg shadow-[0px_1px_3px_0px_rgba(0,0,0,0.20)] text-teal-950 text-sm sm:text-base font-normal font-['Lato'] focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none cursor-pointer"
                      >
                        <option value="">Select sub category</option>
                        {filteredSubCategories.filter(s => !formData.subCategories.includes(s.name)).map(sub => <option key={sub.id} value={sub.name}>{sub.name}</option>)}
                      </select>
                      <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-black pointer-events-none sm:hidden" />
                      <ChevronDown size={24} className="absolute right-3 top-1/2 -translate-y-1/2 text-black pointer-events-none hidden sm:block" />
                    </div>
                  </div>
                )}

                {/* Child Category Multi-Select */}
                {formData.subCategories.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <label className="text-teal-950 text-sm sm:text-base font-bold font-['Lato']">Child Category</label>
                      <button type="button" onClick={() => setShowNewChildCategoryInput(!showNewChildCategoryInput)} className="flex items-center gap-1 p-2 hover:opacity-80">
                        <Plus size={18} className="text-black sm:hidden" />
                        <Plus size={20} className="text-black hidden sm:block" />
                        <span className="text-teal-950 text-xs font-bold font-['Lato']">Add New</span>
                      </button>
                    </div>
                    {showNewChildCategoryInput && (
                      <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <input type="text" value={newChildCategoryName} onChange={(e) => setNewChildCategoryName(e.target.value)} placeholder="Enter child category name" className="w-full p-2 mb-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateChildCategory())} />
                        <div className="flex gap-2">
                          <button type="button" onClick={handleCreateChildCategory} className="flex-1 px-3 py-1.5 bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-lg text-xs font-medium hover:from-sky-500 hover:to-blue-600">Save Child Category</button>
                          <button type="button" onClick={() => { setShowNewChildCategoryInput(false); setNewChildCategoryName(''); }} className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
                        </div>
                      </div>
                    )}
                    <div className="relative">
                      <select
                        value=""
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val && !formData.childCategories.includes(val)) {
                            setFormData(prev => ({ ...prev, childCategories: [...prev.childCategories, val] }));
                          }
                        }}
                        className="w-full p-2.5 sm:p-3 bg-white rounded-lg shadow-[0px_1px_3px_0px_rgba(0,0,0,0.20)] text-teal-950 text-sm sm:text-base font-normal font-['Lato'] focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none cursor-pointer"
                      >
                        <option value="">Select child category</option>
                        {filteredChildCategories.filter(c => !formData.childCategories.includes(c.name)).map(child => <option key={child.id} value={child.name}>{child.name}</option>)}
                      </select>
                      <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-black pointer-events-none sm:hidden" />
                      <ChevronDown size={24} className="absolute right-3 top-1/2 -translate-y-1/2 text-black pointer-events-none hidden sm:block" />
                    </div>
                  </div>
                )}

                {/* Brand Multi-Select */}
                <div className="mb-4">
                  <label className="text-teal-950 text-sm sm:text-base font-bold font-['Lato'] mb-2 sm:mb-3 block">Brand</label>
                  <div className="relative">
                    <select
                      value=""
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val && !formData.brands.includes(val)) {
                          setFormData(prev => ({ ...prev, brands: [...prev.brands, val] }));
                        }
                      }}
                      className="w-full p-2.5 sm:p-3 bg-white rounded-lg shadow-[0px_1px_3px_0px_rgba(0,0,0,0.20)] text-teal-950 text-sm sm:text-base font-normal font-['Lato'] focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none cursor-pointer"
                    >
                      <option value="">Select Brand</option>
                      {brands.filter(b => !formData.brands.includes(b.name)).map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                    </select>
                    <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-black pointer-events-none sm:hidden" />
                    <ChevronDown size={24} className="absolute right-3 top-1/2 -translate-y-1/2 text-black pointer-events-none hidden sm:block" />
                  </div>
                </div>

                {/* Product Tags - Only show as chips when selected */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <label className="text-teal-950 text-sm sm:text-base font-bold font-['Lato']">Product Tags</label>
                    <button type="button" onClick={() => setShowNewTagInput(!showNewTagInput)} className="flex items-center gap-1 p-2 hover:opacity-80">
                      <Plus size={18} className="text-black sm:hidden" />
                      <Plus size={20} className="text-black hidden sm:block" />
                      <span className="text-teal-950 text-xs font-bold font-['Lato']">Add New</span>
                    </button>
                  </div>
                  {showNewTagInput && (
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <input type="text" value={newTagName} onChange={(e) => setNewTagName(e.target.value)} placeholder="Enter tag name" className="w-full p-2 mb-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateTag())} />
                      <div className="flex gap-2">
                        <button type="button" onClick={handleCreateTag} className="flex-1 px-3 py-1.5 bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-lg text-xs font-medium hover:from-sky-500 hover:to-blue-600">Save Tag</button>
                        <button type="button" onClick={() => { setShowNewTagInput(false); setNewTagName(''); }} className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
                      </div>
                    </div>
                  )}
                  
                  {/* Selected tags as chips */}
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {formData.tags.map(tagName => (
                        <span key={tagName} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-full text-xs font-medium shadow-sm">
                          {tagName}
                          <button type="button" onClick={() => toggleTag(tagName)} className="hover:text-blue-100 ml-0.5"><X size={12} /></button>
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Tag dropdown to add */}
                  <div className="relative">
                    <select
                      value=""
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val && !formData.tags.includes(val)) {
                          toggleTag(val);
                        }
                      }}
                      className="w-full p-2.5 sm:p-3 bg-white rounded-lg shadow-[0px_1px_3px_0px_rgba(0,0,0,0.20)] text-teal-950 text-sm sm:text-base font-normal font-['Lato'] focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none cursor-pointer"
                    >
                      <option value="">Add custom tag...</option>
                      {tags.filter(t => !formData.tags.includes(t.name)).map(tag => <option key={tag.id} value={tag.name}>{tag.name}</option>)}
                    </select>
                    <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-black pointer-events-none sm:hidden" />
                    <ChevronDown size={24} className="absolute right-3 top-1/2 -translate-y-1/2 text-black pointer-events-none hidden sm:block" />
                  </div>
                </div>

                {/* Special Product Flags Section */}
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-teal-950 text-sm sm:text-base font-bold font-['Lato'] mb-3">Product Highlights</h3>
                  
                  <div className="space-y-3">
                    {/* Deal of the Day */}
                    <label className="flex items-center justify-between p-3 bg-white rounded-lg shadow-[0px_1px_3px_0px_rgba(0,0,0,0.20)] cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🔥</span>
                        <span className="text-teal-950 text-sm font-medium font-['Lato']">Deal of the Day</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setFormData(prev => ({ ...prev, isDealOfTheDay: !prev.isDealOfTheDay }))} 
                        className={`w-12 h-6 px-1 py-1.5 rounded-[200px] flex items-center overflow-hidden transition-colors ${formData.isDealOfTheDay ? 'bg-gradient-to-r from-orange-400 to-red-500 justify-end' : 'bg-gray-300 justify-start'}`}
                      >
                        <div className="w-4 h-4 bg-white rounded-full" />
                      </button>
                    </label>

                    {/* Most Selling */}
                    <label className="flex items-center justify-between p-3 bg-white rounded-lg shadow-[0px_1px_3px_0px_rgba(0,0,0,0.20)] cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🏆</span>
                        <span className="text-teal-950 text-sm font-medium font-['Lato']">Most Selling Products</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setFormData(prev => ({ ...prev, isMostSelling: !prev.isMostSelling }))} 
                        className={`w-12 h-6 px-1 py-1.5 rounded-[200px] flex items-center overflow-hidden transition-colors ${formData.isMostSelling ? 'bg-gradient-to-r from-yellow-400 to-amber-500 justify-end' : 'bg-gray-300 justify-start'}`}
                      >
                        <div className="w-4 h-4 bg-white rounded-full" />
                      </button>
                    </label>

                    {/* Our Products */}
                    <label className="flex items-center justify-between p-3 bg-white rounded-lg shadow-[0px_1px_3px_0px_rgba(0,0,0,0.20)] cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">⭐</span>
                        <span className="text-teal-950 text-sm font-medium font-['Lato']">Our Products</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setFormData(prev => ({ ...prev, isOurProduct: !prev.isOurProduct }))} 
                        className={`w-12 h-6 px-1 py-1.5 rounded-[200px] flex items-center overflow-hidden transition-colors ${formData.isOurProduct ? 'bg-gradient-to-r from-purple-400 to-pink-500 justify-end' : 'bg-gray-300 justify-start'}`}
                      >
                        <div className="w-4 h-4 bg-white rounded-full" />
                      </button>
                    </label>
                  </div>
                </div>
              </div>

              {/* Variation Section - Responsive */}
              <div>
                <h2 className="text-zinc-800 text-lg sm:text-xl font-bold font-['Lato'] leading-6 mb-3 sm:mb-4">Variation</h2>
                
                <div className="space-y-2 sm:space-y-3">
                  {formData.variations.map((variation, index) => (
                    <div 
                      key={variation.id} 
                      className="p-2.5 sm:p-3 bg-white rounded-lg shadow-[0px_1px_3px_0px_rgba(0,0,0,0.20)]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-teal-950 text-sm sm:text-base font-bold font-['Lato']">{variation.name}</span>
                        <button 
                          type="button" 
                          onClick={() => toggleVariation(variation.id)}
                          className="p-3 sm:p-1.5 flex items-center justify-center"
                        >
                          {expandedVariations[variation.id] ? (
                            <Minus size={14} className="text-black" />
                          ) : (
                            <Plus size={14} className="text-black" />
                          )}
                        </button>
                      </div>
                      
                      {expandedVariations[variation.id] && (
                        <div className="space-y-2">
                          <input 
                            type="text" 
                            value={variationInputs[variation.id] || ''} 
                            onChange={(e) => setVariationInputs(prev => ({ ...prev, [variation.id]: e.target.value }))} 
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVariationOption(variation.id))}
                            placeholder={index === 0 ? 'Colour' : 'Variation name'} 
                            className="w-full h-8 p-2 sm:p-3 bg-white rounded-lg border border-stone-300 text-teal-950 text-xs font-normal font-['Roboto'] focus:outline-none focus:ring-2 focus:ring-blue-400" 
                          />
                          
                          {/* Variation Options - Responsive */}
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {variation.options.map((option) => (
                              <div 
                                key={option.id} 
                                className="w-20 sm:w-24 h-7 sm:h-8 px-2 sm:p-3 bg-white rounded-lg border border-stone-300 flex justify-between items-center"
                              >
                                <span className="text-teal-950 text-[10px] sm:text-xs font-normal font-['Roboto'] truncate">{option.name}</span>
                                <button 
                                  type="button" 
                                  onClick={() => removeVariationOption(variation.id, option.id)}
                                  className="text-red-700 hover:text-red-800 ml-1 flex-shrink-0"
                                >
                                  <Trash2 size={12} className="sm:hidden" />
                                  <Trash2 size={14} className="hidden sm:block" />
                                </button>
                              </div>
                            ))}
                            
                            {/* Empty Option Input */}
                            <div className="w-20 sm:w-24 h-7 sm:h-8 px-2 sm:p-3 bg-white rounded-lg border border-stone-300 flex justify-between items-center">
                              <span className="text-neutral-400 text-[10px] sm:text-xs font-normal font-['Roboto']">Option</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;
