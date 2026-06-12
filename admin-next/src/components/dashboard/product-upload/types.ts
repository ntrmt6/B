import React from 'react';
import { Product, Category, SubCategory, ChildCategory, Brand, Tag } from '../../../types';

export interface FigmaProductUploadProps {
  categories: Category[];
  subCategories?: SubCategory[];
  childCategories?: ChildCategory[];
  brands: Brand[];
  tags?: Tag[];
  onAddProduct: (product: Product) => void;
  onBack?: () => void;
  onNavigate?: (section: string) => void;
  editProduct?: Product | null;
}

/** Base props shared by all form sections */
export interface SectionFormProps {
  formData: FormData;
  updateField: (field: keyof FormData, value: any) => void;
}

export interface GeneralInfoSectionProps extends SectionFormProps {
  isDragging: boolean;
  allImages: string[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  unfilteredFileInputRef: React.RefObject<HTMLInputElement | null>;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUnfilteredImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveImage: (idx: number) => void;
  handleRemoveUnfilteredImage: (idx: number) => void;
  handleSetAsMain: (idx: number) => void;
  openGalleryPicker: (target: 'mainImage' | 'gallery' | 'variantImage' | 'catalogIcon', variantKey?: string) => void;
}

export interface VariantsSectionProps extends SectionFormProps {
  variantImageRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
  uploadingVariantImage: string | null;
  handleVariantImageUpload: (vIdx: number, oIdx: number, file: File) => void;
  handleRemoveVariantImage: (vIdx: number, oIdx: number) => void;
}

export interface CatalogModalProps {
  showCatalogModal: boolean;
  setShowCatalogModal: (v: boolean) => void;
  catalogModalTab: 'category' | 'subcategory' | 'childcategory' | 'brand' | 'tag';
  setCatalogModalTab: (v: 'category' | 'subcategory' | 'childcategory' | 'brand' | 'tag') => void;
  newCatalogItem: { name: string; parentCategory: string; parentSubCategory: string; image: string; isFlashSale: boolean; isMostSales: boolean; durationDays: number };
  setNewCatalogItem: React.Dispatch<React.SetStateAction<CatalogModalProps['newCatalogItem']>>;
  savingCatalog: boolean;
  localCategories: Category[];
  localSubCategories: SubCategory[];
  catalogImageRef: React.RefObject<HTMLInputElement | null>;
  uploadingCatalogImage: boolean;
  handleCatalogImageUpload: (file: File) => void;
  handleSaveCatalogItem: () => void;
  openGalleryPicker: (target: 'mainImage' | 'gallery' | 'variantImage' | 'catalogIcon', variantKey?: string) => void;
}

export interface ProductSidebarProps extends SectionFormProps {
  editProduct?: Product | null;
  handleSaveDraft: () => void;
  handlePublish: () => void;
  completionItems: { label: string; completed: boolean }[];
  completionPercentage: number;
  getProgressColor: (pct: number) => string;
  localCategories: Category[];
  localSubCategories: SubCategory[];
  localChildCategories: ChildCategory[];
  localBrands: Brand[];
  localTags: Tag[];
  setCatalogModalTab: (v: 'category' | 'subcategory' | 'childcategory' | 'brand' | 'tag') => void;
  setShowCatalogModal: (v: boolean) => void;
}

export interface AffiliateSource {
  value: string;
  label: string;
}

export interface AffiliateProps extends SectionFormProps {
  affiliateSources: AffiliateSource[];
}

export interface FormData {
  isMostSales: any;
  name: string;
  slug: string;
  autoSlug: boolean;
  shopName: string;
  shortDescription: string;
  description: string;
  mainImage: string;
  videoUrl: string;
  galleryImages: string[];
  unfilteredImages: { url: string; uploadedAt: string }[];
  regularPrice: number;
  salesPrice: number;
  costPrice: number;
  quantity: number;
  serial: number;
  unitName: string;
  warranty: string;
  sku: string;
  barcode: string;
  initialSoldCount: number;
  productionStart: string;
  expirationEnd: string;
  variantsMandatory: boolean;
  variants: { title: string; options: { attribute: string; extraPrice: number; image?: string }[] }[];
  brandName: string;
  modelName: string;
  details: { type: string; description: string }[];
  affiliateSource: string;
  sourceProductUrl: string;
  sourceSku: string;
  useDefaultDelivery: boolean;
  deliveryChargeDefault: number;
  deliveryByCity: { city: string; charge: number }[];
  keywords: string;
  seoDescription: string;
  seoTitle: string;
  category: string;
  subCategory: string;
  childCategory: string;
  categories: string[];
  subCategoriesArr: string[];
  childCategoriesArr: string[];
  brandsArr: string[];
  condition: string;
  flashSale: boolean;
  flashSaleStartDate: string;
  flashSaleEndDate: string;
  tag: string[];
  deepSearch: string;
}
