import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Product, Category, SubCategory, ChildCategory, Brand, Tag } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { uploadAndSaveToGallery } from '../../../services/imageUploadService';
import { showErrorWithWhatsApp } from '../../../utils/errorReporter';
import { FormData } from './types';

interface UseProductFormParams {
  categories: Category[];
  subCategories: SubCategory[];
  childCategories: ChildCategory[];
  brands: Brand[];
  tags: Tag[];
  onAddProduct: (product: Product) => void;
  onBack?: () => void;
  editProduct?: Product | null;
}

export function useProductForm({
  categories,
  subCategories,
  childCategories,
  brands,
  tags,
  onAddProduct,
  onBack,
  editProduct,
}: UseProductFormParams) {
  const { user } = useAuth();
  const tenantId = user?.tenantId || '';

  const fileInputRef = useRef<HTMLInputElement>(null);
  const unfilteredFileInputRef = useRef<HTMLInputElement>(null);
  const variantImageRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const catalogImageRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadingVariantImage, setUploadingVariantImage] = useState<string | null>(null);
  const [uploadingCatalogImage, setUploadingCatalogImage] = useState(false);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogModalTab, setCatalogModalTab] = useState<'category' | 'subcategory' | 'childcategory' | 'brand' | 'tag'>('category');
  const [newCatalogItem, setNewCatalogItem] = useState({
    name: '',
    parentCategory: '',
    parentSubCategory: '',
    image: '',
    isFlashSale: false,
    isMostSales: false,
    durationDays: 0,
  });
  const [savingCatalog, setSavingCatalog] = useState(false);

  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const [galleryPickerTarget, setGalleryPickerTarget] = useState<'mainImage' | 'gallery' | 'variantImage' | 'catalogIcon' | null>(null);
  const [galleryPickerVariantKey, setGalleryPickerVariantKey] = useState<string | null>(null);

  const [localCategories, setLocalCategories] = useState<Category[]>(categories);
  const [localSubCategories, setLocalSubCategories] = useState<SubCategory[]>(subCategories);
  const [localChildCategories, setLocalChildCategories] = useState<ChildCategory[]>(childCategories);
  const [localBrands, setLocalBrands] = useState<Brand[]>(brands);
  const [localTags, setLocalTags] = useState<Tag[]>(tags);

  useEffect(() => { setLocalCategories(categories); }, [categories]);
  useEffect(() => { setLocalSubCategories(subCategories); }, [subCategories]);
  useEffect(() => { setLocalChildCategories(childCategories); }, [childCategories]);
  useEffect(() => { setLocalBrands(brands); }, [brands]);
  useEffect(() => { setLocalTags(tags); }, [tags]);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    slug: '',
    autoSlug: true,
    shopName: '',
    shortDescription: '',
    description: '',
    mainImage: '',
    videoUrl: '',
    galleryImages: [],
    unfilteredImages: [],
    regularPrice: 0,
    salesPrice: 0,
    quantity: 0,
    serial: 0,
    unitName: '',
    warranty: '',
    sku: '',
    barcode: '',
    initialSoldCount: 0,
    productionStart: '',
    expirationEnd: '',
    variantsMandatory: false,
    variants: [{ title: '', options: [{ attribute: '', extraPrice: 0 }] }],
    modelName: '',
    details: [{ type: '', description: '' }],
    affiliateSource: '',
    sourceProductUrl: '',
    sourceSku: '',
    useDefaultDelivery: false,
    deliveryChargeDefault: 0,
    deliveryByCity: [{ city: 'Dhaka', charge: 80 }],
    keywords: '',
    seoDescription: '',
    seoTitle: '',
    category: '',
    subCategory: '',
    childCategory: '',
    categories: [],
    subCategoriesArr: [],
    childCategoriesArr: [],
    brandsArr: [],
    condition: 'New',
    flashSale: false,
    flashSaleStartDate: '',
    flashSaleEndDate: '',
    tag: [],
    deepSearch: '',
    costPrice: 0,
    isMostSales: false,
    brandName: '',
  });

  useEffect(() => {
    if (editProduct) {
      const loadedVariants = editProduct.variantGroups?.map(vg => ({
        title: vg.title,
        options: vg.options.map(o => ({
          attribute: o.attribute,
          extraPrice: o.extraPrice || 0,
          image: o.image,
        })),
      })) || [{ title: '', options: [{ attribute: '', extraPrice: 0 }] }];

      setFormData(prev => ({
        ...prev,
        name: editProduct.name || '',
        description: editProduct.description || '',
        shortDescription: editProduct.shortDescription || '',
        mainImage: editProduct.image || '',
        galleryImages: editProduct.galleryImages || [],
        salesPrice: editProduct.price || 0,
        regularPrice: editProduct.originalPrice || 0,
        costPrice: editProduct.costPrice || 0,
        category: editProduct.category || '',
        categories: editProduct.categories || (editProduct.category ? [editProduct.category] : []),
        subCategoriesArr: editProduct.subCategories || (editProduct.subCategory ? [editProduct.subCategory] : []),
        childCategoriesArr: editProduct.childCategories || (editProduct.childCategory ? [editProduct.childCategory] : []),
        brandsArr: editProduct.brands || (editProduct.brand ? [editProduct.brand] : []),
        brandName: editProduct.brand || '',
        sku: editProduct.sku || '',
        quantity: editProduct.stock || 0,
        variants: loadedVariants,
        variantsMandatory: editProduct.variantGroups?.[0]?.isMandatory || false,
        details: editProduct.details && editProduct.details.length > 0 ? editProduct.details : [{ type: '', description: '' }],
        flashSale: editProduct.flashSale || false,
        flashSaleStartDate: editProduct.flashSaleStartDate || '',
        flashSaleEndDate: editProduct.flashSaleEndDate || '',
        tag: editProduct.tags || [],
        deepSearch: editProduct.deepSearch || '',
        useDefaultDelivery: editProduct.useDefaultDelivery || false,
        deliveryChargeDefault: editProduct.deliveryChargeDefault || 0,
        deliveryByCity: (editProduct.deliveryByCity && editProduct.deliveryByCity.length > 0) ? editProduct.deliveryByCity : [{ city: 'Dhaka', charge: 80 }],
        keywords: (editProduct as any).seoKeyword || '',
        seoDescription: editProduct.seoDescription || '',
        seoTitle: editProduct.seoTitle || '',
        serial: editProduct.serial || 0,
        unitName: editProduct.unitName || '',
        warranty: editProduct.warranty || '',
        barcode: editProduct.barcode || '',
        initialSoldCount: editProduct.initialSoldCount || 0,
        productionStart: editProduct.productionStart || '',
        expirationEnd: editProduct.expirationEnd || '',
        unfilteredImages: editProduct.unfilteredImages || [],
      }));
    }
  }, [editProduct]);

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const completionItems = [
    { label: 'Item Name', completed: !!formData.name?.trim() },
    { label: 'Media', completed: !!formData.mainImage },
    { label: 'Product Description', completed: !!formData.description?.trim() },
    { label: 'Pricing', completed: formData.salesPrice > 0 },
    { label: 'Inventory', completed: formData.quantity > 0 },
  ];

  const filledFieldsCount = [
    !!formData.name?.trim(),
    !!formData.mainImage,
    !!formData.description?.trim(),
    formData.salesPrice > 0,
    formData.regularPrice > 0,
    formData.costPrice > 0,
    formData.quantity > 0,
    !!formData.sku?.trim(),
    !!(formData.categories?.length || formData.category?.trim()),
    !!(formData.subCategoriesArr?.length || formData.subCategory?.trim()),
    !!(formData.childCategoriesArr?.length || formData.childCategory?.trim()),
    !!(formData.brandsArr?.length || formData.brandName?.trim()),
    (Array.isArray(formData.tag) ? formData.tag : []).length > 0,
    formData.galleryImages.length > 0,
    !!formData.videoUrl?.trim(),
    !!formData.shortDescription?.trim(),
    !!formData.unitName?.trim(),
    !!formData.warranty?.trim(),
    !!formData.barcode?.trim(),
    formData.initialSoldCount > 0,
    !!formData.productionStart,
    !!formData.expirationEnd,
    formData.serial > 0,
    !!formData.seoTitle?.trim(),
    !!formData.seoDescription?.trim(),
    !!formData.keywords?.trim(),
    !!formData.affiliateSource?.trim(),
    !!formData.sourceProductUrl?.trim(),
    !!formData.sourceSku?.trim(),
    formData.variantsMandatory,
    formData.useDefaultDelivery,
    formData.deliveryChargeDefault > 0,
    !!formData.modelName?.trim(),
  ].filter(Boolean).length;

  const completionPercentage = Math.min(filledFieldsCount * 3, 100);

  const getProgressColor = (percent: number) => {
    if (percent < 30) return 'bg-yellow-500';
    if (percent <= 80) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const allImages = formData.mainImage
    ? [formData.mainImage, ...formData.galleryImages]
    : formData.galleryImages;

  const uploadSingleFile = async (file: File, galleryCategory: string = 'Products'): Promise<string | null> => {
    try {
      const imageUrl = await uploadAndSaveToGallery(file, tenantId, galleryCategory);
      return imageUrl;
    } catch (error) {
      console.error('Upload error:', error);
      const msg = error instanceof Error ? error.message : 'Upload failed';
      showErrorWithWhatsApp('Single Image Upload', `Upload failed: ${msg}`, `File: ${file.name}`);
      return null;
    }
  };

  const openGalleryPicker = (target: 'mainImage' | 'gallery' | 'variantImage' | 'catalogIcon', variantKey?: string) => {
    setGalleryPickerTarget(target);
    setGalleryPickerVariantKey(variantKey || null);
    setShowGalleryPicker(true);
  };

  const handleGallerySelect = (imageUrl: string) => {
    if (!galleryPickerTarget) return;

    switch (galleryPickerTarget) {
      case 'mainImage':
        updateField('mainImage', imageUrl);
        toast.success('Main image selected from gallery');
        break;
      case 'gallery':
        if (!formData.galleryImages.includes(imageUrl)) {
          updateField('galleryImages', [...formData.galleryImages, imageUrl]);
          toast.success('Image added to gallery');
        } else {
          toast.error('Image already in gallery');
        }
        break;
      case 'variantImage':
        if (galleryPickerVariantKey) {
          const [variantIdx, optionIdx] = galleryPickerVariantKey.split('-').map(Number);
          const newVariants = [...formData.variants];
          if (newVariants[variantIdx] && newVariants[variantIdx].options[optionIdx]) {
            newVariants[variantIdx].options[optionIdx].image = imageUrl;
            updateField('variants', newVariants);
            toast.success('Variant image selected from gallery');
          }
        }
        break;
      case 'catalogIcon':
        setNewCatalogItem(prev => ({ ...prev, image: imageUrl }));
        toast.success('Image selected from gallery');
        break;
    }

    setShowGalleryPicker(false);
    setGalleryPickerTarget(null);
    setGalleryPickerVariantKey(null);
  };

  const handleGallerySelectMultiple = (imageUrls: string[]) => {
    const newImages = imageUrls.filter(url => !formData.galleryImages.includes(url));
    if (newImages.length > 0) {
      updateField('galleryImages', [...formData.galleryImages, ...newImages]);
      toast.success(`${newImages.length} images added to gallery`);
    }
    setShowGalleryPicker(false);
    setGalleryPickerTarget(null);
  };

  const handleVariantImageUpload = async (variantIdx: number, optionIdx: number, file: File) => {
    const key = `${variantIdx}-${optionIdx}`;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error('Image size should be less than 4MB');
      return;
    }

    setUploadingVariantImage(key);
    try {
      const url = await uploadSingleFile(file);
      if (url) {
        const newVariants = [...formData.variants];
        newVariants[variantIdx].options[optionIdx].image = url;
        updateField('variants', newVariants);
        toast.success('Variant image uploaded');
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      showErrorWithWhatsApp('Variant Image Upload', `Failed to upload variant image: ${msg}`);
    } finally {
      setUploadingVariantImage(null);
    }
  };

  const handleRemoveVariantImage = (variantIdx: number, optionIdx: number) => {
    const newVariants = [...formData.variants];
    newVariants[variantIdx].options[optionIdx].image = undefined;
    updateField('variants', newVariants);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentCount = allImages.length;
    const maxAllowed = 20 - currentCount;
    if (maxAllowed <= 0) {
      toast.error('Maximum 20 images allowed');
      return;
    }

    const filesToUpload = Array.from(files).slice(0, maxAllowed);
    toast.loading(`Uploading ${filesToUpload.length} image(s)...`, { id: 'upload' });

    const uploadedUrls: string[] = [];
    for (const file of filesToUpload) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 4 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 4MB)`);
        continue;
      }
      const url = await uploadSingleFile(file);
      if (url) uploadedUrls.push(url);
    }

    if (uploadedUrls.length > 0) {
      if (!formData.mainImage) {
        updateField('mainImage', uploadedUrls[0]);
        if (uploadedUrls.length > 1) {
          updateField('galleryImages', [...formData.galleryImages, ...uploadedUrls.slice(1)]);
        }
      } else {
        updateField('galleryImages', [...formData.galleryImages, ...uploadedUrls]);
      }
      toast.success(`${uploadedUrls.length} image(s) uploaded`, { id: 'upload' });
    } else {
      toast.dismiss('upload');
      showErrorWithWhatsApp('Product Image Upload', 'Failed to upload images');
    }

    e.target.value = '';
  };

  const handleUnfilteredImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filesToUpload = Array.from(files).slice(0, 5);
    toast.loading(`Uploading ${filesToUpload.length} unfiltered image(s)...`, { id: 'upload-unfiltered' });

    const newUnfilteredImages: { url: string; uploadedAt: string }[] = [];
    for (const file of filesToUpload) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 4 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 4MB)`);
        continue;
      }
      const url = await uploadSingleFile(file, 'Products');
      if (url) {
        newUnfilteredImages.push({ url, uploadedAt: new Date().toISOString() });
      }
    }

    if (newUnfilteredImages.length > 0) {
      updateField('unfilteredImages', [...formData.unfilteredImages, ...newUnfilteredImages]);
      toast.success(`${newUnfilteredImages.length} unfiltered image(s) uploaded`, { id: 'upload-unfiltered' });
    } else {
      toast.dismiss('upload-unfiltered');
      showErrorWithWhatsApp('Unfiltered Image Upload', 'Failed to upload unfiltered images');
    }

    e.target.value = '';
  };

  const handleRemoveUnfilteredImage = (index: number) => {
    updateField('unfilteredImages', formData.unfilteredImages.filter((_, i) => i !== index));
  };

  const handleRemoveImage = (index: number) => {
    if (index === 0 && formData.mainImage) {
      if (formData.galleryImages.length > 0) {
        updateField('mainImage', formData.galleryImages[0]);
        updateField('galleryImages', formData.galleryImages.slice(1));
      } else {
        updateField('mainImage', '');
      }
    } else {
      const galleryIndex = formData.mainImage ? index - 1 : index;
      const newGallery = formData.galleryImages.filter((_, i) => i !== galleryIndex);
      updateField('galleryImages', newGallery);
    }
  };

  const handleSetAsMain = (index: number) => {
    if (index === 0) return;
    const newMainImage = allImages[index];
    const newGallery = allImages.filter((_, i) => i !== index);
    if (formData.mainImage) {
      newGallery.unshift(formData.mainImage);
    }
    updateField('mainImage', newMainImage);
    updateField('galleryImages', newGallery.filter(img => img !== newMainImage));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const currentCount = allImages.length;
    const maxAllowed = 20 - currentCount;
    if (maxAllowed <= 0) {
      toast.error('Maximum 20 images allowed');
      return;
    }

    const filesToUpload = Array.from(files).slice(0, maxAllowed);
    toast.loading(`Uploading ${filesToUpload.length} image(s)...`, { id: 'upload-drop' });

    const uploadedUrls: string[] = [];
    for (const file of filesToUpload) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        continue;
      }
      if (file.size > 4 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 4MB)`);
        continue;
      }
      const url = await uploadSingleFile(file);
      if (url) uploadedUrls.push(url);
    }

    if (uploadedUrls.length > 0) {
      if (!formData.mainImage) {
        updateField('mainImage', uploadedUrls[0]);
        if (uploadedUrls.length > 1) {
          updateField('galleryImages', [...formData.galleryImages, ...uploadedUrls.slice(1)]);
        }
      } else {
        updateField('galleryImages', [...formData.galleryImages, ...uploadedUrls]);
      }
      toast.success(`${uploadedUrls.length} image(s) uploaded`, { id: 'upload-drop' });
    } else {
      toast.dismiss('upload-drop');
      showErrorWithWhatsApp('Product Image Upload (Drop)', 'Failed to upload images');
    }
  };

  const handleCatalogImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error('Image size should be less than 4MB');
      return;
    }

    setUploadingCatalogImage(true);
    try {
      const url = await uploadSingleFile(file);
      if (url) {
        setNewCatalogItem(prev => ({ ...prev, image: url }));
        toast.success('Image uploaded');
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      showErrorWithWhatsApp('Catalog Image Upload', `Failed to upload image: ${msg}`);
    } finally {
      setUploadingCatalogImage(false);
    }
  };

  const handleSaveCatalogItem = async () => {
    if (!newCatalogItem.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setSavingCatalog(true);
    try {
      const endpoint = catalogModalTab === 'subcategory' ? 'subcategories'
        : catalogModalTab === 'childcategory' ? 'childcategories'
        : catalogModalTab === 'brand' ? 'brands'
        : catalogModalTab === 'tag' ? 'tags'
        : 'categories';

      const getResponse = await fetch(`/api/tenant-data/${tenantId}/${endpoint}`);
      let existingData: any[] = [];
      if (getResponse.ok) {
        const result = await getResponse.json();
        existingData = result.data || [];
      }

      const newItem: any = {
        id: Date.now(),
        name: newCatalogItem.name.trim(),
        createdAt: new Date().toISOString(),
      };

      if (catalogModalTab === 'category') {
        newItem.image = newCatalogItem.image;
        newItem.isFlashSale = newCatalogItem.isFlashSale;
        newItem.isMostSales = newCatalogItem.isMostSales;
      } else if (catalogModalTab === 'subcategory') {
        newItem.categoryId = newCatalogItem.parentCategory;
        newItem.categoryName = newCatalogItem.parentCategory;
        newItem.image = newCatalogItem.image;
      } else if (catalogModalTab === 'childcategory') {
        newItem.subCategoryId = newCatalogItem.parentSubCategory;
        newItem.subCategoryName = newCatalogItem.parentSubCategory;
        newItem.image = newCatalogItem.image;
      } else if (catalogModalTab === 'brand') {
        newItem.logo = newCatalogItem.image;
      } else if (catalogModalTab === 'tag') {
        newItem.icon = newCatalogItem.image;
        newItem.image = newCatalogItem.image;
        if (newCatalogItem.durationDays > 0) {
          newItem.durationDays = newCatalogItem.durationDays;
          const expiry = new Date();
          expiry.setDate(expiry.getDate() + newCatalogItem.durationDays);
          newItem.expiresAt = expiry.toISOString();
        }
      }

      const updatedData = [...existingData, newItem];

      const saveResponse = await fetch(`/api/tenant-data/${tenantId}/${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: updatedData }),
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save');
      }

      toast.success(`${catalogModalTab.charAt(0).toUpperCase() + catalogModalTab.slice(1)} added successfully!`);

      if (catalogModalTab === 'category') {
        setLocalCategories(prev => [...prev, newItem as Category]);
        updateField('categories', [...(formData.categories || []), newCatalogItem.name.trim()]);
        updateField('category', (formData.categories || [])[0] || newCatalogItem.name.trim());
      } else if (catalogModalTab === 'subcategory') {
        setLocalSubCategories(prev => [...prev, newItem as SubCategory]);
        updateField('subCategoriesArr', [...(formData.subCategoriesArr || []), newCatalogItem.name.trim()]);
        updateField('subCategory', (formData.subCategoriesArr || [])[0] || newCatalogItem.name.trim());
      } else if (catalogModalTab === 'childcategory') {
        setLocalChildCategories(prev => [...prev, newItem as ChildCategory]);
        updateField('childCategory', newCatalogItem.name.trim());
      } else if (catalogModalTab === 'tag') {
        setLocalTags(prev => [...prev, newItem as Tag]);
        updateField('tag', [newCatalogItem.name.trim()]);
      } else if (catalogModalTab === 'brand') {
        setLocalBrands(prev => [...prev, newItem as Brand]);
        updateField('brandsArr', [...(formData.brandsArr || []), newCatalogItem.name.trim()]);
        updateField('brandName', (formData.brandsArr || [])[0] || newCatalogItem.name.trim());
      }

      setNewCatalogItem({
        name: '',
        parentCategory: '',
        parentSubCategory: '',
        image: '',
        isFlashSale: false,
        isMostSales: false,
        durationDays: 0,
      });
      setShowCatalogModal(false);
    } catch (error) {
      console.error('Error saving catalog item:', error);
      toast.error('Failed to save. Please try again.');
    } finally {
      setSavingCatalog(false);
    }
  };

  const handleSaveDraft = () => {
    const validVariants = formData.variants
      .filter(v => v.title.trim() && v.options.some(o => o.attribute.trim()))
      .map(v => ({
        title: v.title.trim(),
        isMandatory: formData.variantsMandatory,
        options: v.options
          .filter(o => o.attribute.trim())
          .map(o => ({
            attribute: o.attribute.trim(),
            extraPrice: o.extraPrice || 0,
            image: o.image,
          })),
      }));

    const draftProduct: Product = {
      id: editProduct?.id || Date.now(),
      name: formData.name || 'Untitled Draft',
      slug: formData.slug || `draft-${Date.now()}`,
      description: formData.description,
      shortDescription: formData.shortDescription || '',
      image: formData.mainImage,
      galleryImages: formData.galleryImages,
      unfilteredImages: formData.unfilteredImages.length > 0 ? formData.unfilteredImages : undefined,
      videoUrl: formData.videoUrl,
      price: formData.salesPrice || 0,
      originalPrice: formData.regularPrice || 0,
      costPrice: formData.costPrice || 0,
      category: formData.categories?.[0] || formData.category,
      subCategory: formData.subCategoriesArr?.[0] || formData.subCategory,
      childCategory: formData.childCategoriesArr?.[0] || formData.childCategory,
      brand: formData.brandsArr?.[0] || formData.brandName,
      categories: formData.categories,
      subCategories: formData.subCategoriesArr,
      childCategories: formData.childCategoriesArr,
      brands: formData.brandsArr,
      sku: formData.sku,
      stock: formData.quantity || 0,
      status: 'Draft',
      tags: (Array.isArray(formData.tag) ? formData.tag : []).length > 0 ? formData.tag : [],
      tenantId: tenantId,
      shopName: formData.shopName,
      flashSale: formData.flashSale,
      flashSaleStartDate: formData.flashSaleStartDate || undefined,
      flashSaleEndDate: formData.flashSaleEndDate || undefined,
      variantGroups: validVariants.length > 0 ? validVariants : undefined,
      deepSearch: formData.deepSearch || '',
      serial: formData.serial || 0,
      unitName: formData.unitName || '',
      warranty: formData.warranty || '',
      barcode: formData.barcode || '',
      initialSoldCount: formData.initialSoldCount || 0,
      productionStart: formData.productionStart || '',
      expirationEnd: formData.expirationEnd || '',
      details: formData.details.filter(d => d.type.trim() && d.description.trim()).length > 0 ? formData.details.filter(d => d.type.trim() && d.description.trim()) : undefined,
      salePrice: undefined,
      title: '',
      useDefaultDelivery: formData.useDefaultDelivery,
      deliveryChargeDefault: formData.deliveryChargeDefault || 0,
      deliveryCharge: formData.useDefaultDelivery ? formData.deliveryChargeDefault : (formData.deliveryByCity?.[0]?.charge || 0),
      deliveryByCity: formData.deliveryByCity?.filter(d => d.city.trim()) || [],
      seoKeyword: formData.keywords || '',
      seoDescription: formData.seoDescription || '',
      seoTitle: formData.seoTitle || '',
      coins: undefined,
      sold: undefined,
      condition: '',
    };

    onAddProduct(draftProduct);
    toast.success('Draft saved!');
    onBack?.();
  };

  const handlePublish = () => {
    if (!formData.name || (!formData.category && !formData.categories?.length) || !formData.salesPrice) {
      toast.error('Please fill required fields');
      return;
    }

    const validVariants = formData.variants
      .filter(v => v.title.trim() && v.options.some(o => o.attribute.trim()))
      .map(v => ({
        title: v.title.trim(),
        isMandatory: formData.variantsMandatory,
        options: v.options
          .filter(o => o.attribute.trim())
          .map(o => ({
            attribute: o.attribute.trim(),
            extraPrice: o.extraPrice || 0,
            image: o.image,
          })),
      }));

    const newProduct: Product = {
      id: editProduct?.id || Date.now(),
      name: formData.name,
      slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
      description: formData.description,
      shortDescription: formData.shortDescription || '',
      image: formData.mainImage,
      galleryImages: formData.galleryImages,
      unfilteredImages: formData.unfilteredImages.length > 0 ? formData.unfilteredImages : undefined,
      videoUrl: formData.videoUrl,
      price: formData.salesPrice,
      originalPrice: formData.regularPrice,
      costPrice: formData.costPrice,
      category: formData.categories?.[0] || formData.category,
      subCategory: formData.subCategoriesArr?.[0] || formData.subCategory,
      childCategory: formData.childCategoriesArr?.[0] || formData.childCategory,
      brand: formData.brandsArr?.[0] || formData.brandName,
      categories: formData.categories,
      subCategories: formData.subCategoriesArr,
      childCategories: formData.childCategoriesArr,
      brands: formData.brandsArr,
      sku: formData.sku,
      stock: formData.quantity,
      status: 'Active',
      tags: (Array.isArray(formData.tag) ? formData.tag : []).length > 0 ? formData.tag : [],
      tenantId: tenantId,
      shopName: formData.shopName,
      flashSale: formData.flashSale,
      flashSaleStartDate: formData.flashSaleStartDate || undefined,
      flashSaleEndDate: formData.flashSaleEndDate || undefined,
      variantGroups: validVariants.length > 0 ? validVariants : undefined,
      deepSearch: formData.deepSearch || '',
      serial: formData.serial || 0,
      unitName: formData.unitName || '',
      warranty: formData.warranty || '',
      barcode: formData.barcode || '',
      initialSoldCount: formData.initialSoldCount || 0,
      productionStart: formData.productionStart || '',
      expirationEnd: formData.expirationEnd || '',
      details: formData.details.filter(d => d.type.trim() && d.description.trim()).length > 0 ? formData.details.filter(d => d.type.trim() && d.description.trim()) : undefined,
      salePrice: undefined,
      title: '',
      useDefaultDelivery: formData.useDefaultDelivery,
      deliveryChargeDefault: formData.deliveryChargeDefault || 0,
      deliveryCharge: formData.useDefaultDelivery ? formData.deliveryChargeDefault : (formData.deliveryByCity?.[0]?.charge || 0),
      deliveryByCity: formData.deliveryByCity?.filter(d => d.city.trim()) || [],
      seoKeyword: formData.keywords || '',
      seoDescription: formData.seoDescription || '',
      seoTitle: formData.seoTitle || '',
      coins: undefined,
      sold: undefined,
      condition: '',
    };

    onAddProduct(newProduct);
    toast.success(editProduct ? 'Product updated!' : 'Product added!');
    onBack?.();
  };

  const affiliateSources = [
    { value: 'AliExpress', label: 'AliExpress (marketplace)', color: '#ff6a00' },
    { value: 'Amazon', label: 'Amazon (marketplace)', color: '#ff9900' },
    { value: 'Alibaba', label: 'Alibaba (marketplace)', color: '#ff6a00' },
    { value: 'Other', label: 'Other', color: '#666' },
  ];

  return {
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
    filledFieldsCount,
    affiliateSources,
    tenantId,
  };
}
