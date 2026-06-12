'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Category, SubCategory, ChildCategory, Brand, Tag } from '../../../types';
import { CategoryIcon, SubCategoryIcon, ChildCategoryIcon, BrandIcon, TagIcon } from './CatalogIcons';
import { convertFileToWebP } from '../../../services/imageUtils';

export interface CatalogManagerProps {
  view: string;
  categories: Category[];
  subCategories: SubCategory[];
  childCategories: ChildCategory[];
  brands: Brand[];
  tags: Tag[];
  products?: any[];
  onAddCategory: (item: Category) => void;
  onUpdateCategory: (item: Category) => void;
  onDeleteCategory: (id: string) => void;
  onAddSubCategory: (item: SubCategory) => void;
  onUpdateSubCategory: (item: SubCategory) => void;
  onDeleteSubCategory: (id: string) => void;
  onAddChildCategory: (item: ChildCategory) => void;
  onUpdateChildCategory: (item: ChildCategory) => void;
  onDeleteChildCategory: (id: string) => void;
  onAddBrand: (item: Brand) => void;
  onUpdateBrand: (item: Brand) => void;
  onDeleteBrand: (id: string) => void;
  onAddTag: (item: Tag) => void;
  onUpdateTag: (item: Tag) => void;
  onDeleteTag: (id: string) => void;
  onReorderCategories?: (items: Category[]) => void;
  onReorderSubCategories?: (items: SubCategory[]) => void;
  onReorderChildCategories?: (items: ChildCategory[]) => void;
  onReorderBrands?: (items: Brand[]) => void;
  onReorderTags?: (items: Tag[]) => void;
}

export function useCatalogManager(props: CatalogManagerProps) {
  const {
    view, categories, subCategories, childCategories, brands, tags, products = [],
    onAddCategory, onUpdateCategory, onDeleteCategory,
    onAddSubCategory, onUpdateSubCategory, onDeleteSubCategory,
    onAddChildCategory, onUpdateChildCategory, onDeleteChildCategory,
    onAddBrand, onUpdateBrand, onDeleteBrand,
    onAddTag, onUpdateTag, onDeleteTag,
    onReorderCategories, onReorderSubCategories, onReorderChildCategories,
    onReorderBrands, onReorderTags,
  } = props;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const [actionMenuPosition, setActionMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPerPageDropdown, setShowPerPageDropdown] = useState(false);
  const [tagGalleryPickerOpen, setTagGalleryPickerOpen] = useState(false);
  const [tagGalleryTarget, setTagGalleryTarget] = useState<'desktopBanner' | 'mobileBanner' | null>(null);
  const [localOrder, setLocalOrder] = useState<any[]>([]);
  const [hasOrderChanges, setHasOrderChanges] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const tagDesktopBannerRef = useRef<HTMLInputElement>(null);
  const tagMobileBannerRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const catalogTabs = useMemo(() => [
    { id: 'catalog_categories', label: 'Category', icon: <CategoryIcon />, count: categories.length },
    { id: 'catalog_subcategories', label: 'Sub Category', icon: <SubCategoryIcon /> },
    { id: 'catalog_childcategories', label: 'Child Category', icon: <ChildCategoryIcon /> },
    { id: 'catalog_brands', label: 'Brand', icon: <BrandIcon /> },
    { id: 'catalog_tags', label: 'Tags', icon: <TagIcon /> },
  ], [categories.length]);

  const getTitle = useCallback(() => {
    switch (view) {
      case 'catalog_categories': return 'Category';
      case 'catalog_subcategories': return 'Sub Category';
      case 'catalog_childcategories': return 'Child Category';
      case 'catalog_brands': return 'Brand';
      case 'catalog_tags': return 'Tag';
      default: return 'Category';
    }
  }, [view]);

  const enrichWithProductCount = useCallback((items: any[], type: 'category' | 'brand' | 'tag' | 'subCategory' | 'childCategory') => {
    return items.map(item => {
      let count = 0;
      if (type === 'category') count = products.filter(p => p.category === item.name).length;
      else if (type === 'brand') count = products.filter(p => p.brand === item.name).length;
      else if (type === 'tag') count = products.filter(p => Array.isArray(p.tags) && p.tags.includes(item.name)).length;
      else if (type === 'subCategory') count = products.filter(p => p.subCategory === item.name).length;
      else if (type === 'childCategory') count = products.filter(p => p.childCategory === item.name).length;
      return { ...item, productCount: count };
    });
  }, [products]);

  const getCurrentData = useCallback((): any[] => {
    switch (view) {
      case 'catalog_categories': return enrichWithProductCount(categories, 'category');
      case 'catalog_subcategories': return enrichWithProductCount(subCategories, 'subCategory');
      case 'catalog_childcategories': return enrichWithProductCount(childCategories, 'childCategory');
      case 'catalog_brands': return enrichWithProductCount(brands, 'brand');
      case 'catalog_tags': return enrichWithProductCount(tags, 'tag');
      default: return enrichWithProductCount(categories, 'category');
    }
  }, [view, categories, subCategories, childCategories, brands, tags, enrichWithProductCount]);

  // Sync localOrder when view or source data changes
  useEffect(() => {
    const data = getCurrentData();
    const sorted = [...data].sort((a: any, b: any) => (a.serial ?? Infinity) - (b.serial ?? Infinity));
    setLocalOrder(sorted);
    setHasOrderChanges(false);
  }, [view, categories, subCategories, childCategories, brands, tags, products]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredData = useMemo(() => {
    let data = [...localOrder];
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      data = data.filter((item: any) => item.name?.toLowerCase().includes(query));
    }
    if (statusFilter !== 'all') {
      data = data.filter((item: any) => item.status === statusFilter);
    }
    return data;
  }, [localOrder, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [view, searchTerm, statusFilter]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setOpenActionMenu(null);
        setActionMenuPosition(null);
        setShowStatusDropdown(false);
        setShowPerPageDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setLocalOrder((items) => {
      const oldIndex = items.findIndex((item: any) => item.id === active.id);
      const newIndex = items.findIndex((item: any) => item.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return items;
      return arrayMove(items, oldIndex, newIndex);
    });
    setHasOrderChanges(true);
  }, []);

  const handleSaveOrder = useCallback(() => {
    setIsSavingOrder(true);
    const withSerial = localOrder.map((item: any, idx: number) => {
      const { productCount, ...rest } = item;
      return { ...rest, serial: idx + 1 };
    });
    switch (view) {
      case 'catalog_categories': onReorderCategories?.(withSerial); break;
      case 'catalog_subcategories': onReorderSubCategories?.(withSerial); break;
      case 'catalog_childcategories': onReorderChildCategories?.(withSerial); break;
      case 'catalog_brands': onReorderBrands?.(withSerial); break;
      case 'catalog_tags': onReorderTags?.(withSerial); break;
    }
    setHasOrderChanges(false);
    setIsSavingOrder(false);
  }, [localOrder, view, onReorderCategories, onReorderSubCategories, onReorderChildCategories, onReorderBrands, onReorderTags]);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.length === paginatedData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedData.map((item: any) => item.id));
    }
  }, [selectedIds.length, paginatedData]);

  const handleSelectItem = useCallback((id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, []);

  const handleOpenModal = useCallback((item?: any) => {
    setEditItem(item || null);
    if (item) {
      setFormData({ ...item });
    } else {
      const defaults: any = { name: '', status: 'Active', serial: 0, durationDays: 0, showCountdown: false };
      if (view === 'catalog_categories') defaults.icon = '';
      if (view === 'catalog_subcategories') defaults.categoryId = categories[0]?.id || '';
      if (view === 'catalog_childcategories') defaults.subCategoryId = subCategories[0]?.id || '';
      if (view === 'catalog_brands') defaults.logo = '';
      if (view === 'catalog_tags') {
        defaults.desktopBanner = '';
        defaults.mobileBanner = '';
        defaults.desktopVideo = '';
        defaults.mobileVideo = '';
      }
      setFormData(defaults);
    }
    setIsModalOpen(true);
  }, [view, categories, subCategories]);

  const handleSave = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const id = editItem ? editItem.id : Date.now().toString();
    const newItem = { ...formData, id };
    switch (view) {
      case 'catalog_categories': editItem ? onUpdateCategory(newItem) : onAddCategory(newItem); break;
      case 'catalog_subcategories': editItem ? onUpdateSubCategory(newItem) : onAddSubCategory(newItem); break;
      case 'catalog_childcategories': editItem ? onUpdateChildCategory(newItem) : onAddChildCategory(newItem); break;
      case 'catalog_brands': editItem ? onUpdateBrand(newItem) : onAddBrand(newItem); break;
      case 'catalog_tags': editItem ? onUpdateTag(newItem) : onAddTag(newItem); break;
    }
    setIsModalOpen(false);
  }, [editItem, formData, view, onAddCategory, onUpdateCategory, onAddSubCategory, onUpdateSubCategory, onAddChildCategory, onUpdateChildCategory, onAddBrand, onUpdateBrand, onAddTag, onUpdateTag]);

  const handleDelete = useCallback((id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    switch (view) {
      case 'catalog_categories': onDeleteCategory(id); break;
      case 'catalog_subcategories': onDeleteSubCategory(id); break;
      case 'catalog_childcategories': onDeleteChildCategory(id); break;
      case 'catalog_brands': onDeleteBrand(id); break;
      case 'catalog_tags': onDeleteTag(id); break;
    }
    setOpenActionMenu(null);
    setActionMenuPosition(null);
  }, [view, onDeleteCategory, onDeleteSubCategory, onDeleteChildCategory, onDeleteBrand, onDeleteTag]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const converted = await convertFileToWebP(file, { quality: 0.8, maxDimension: 600 });
      const fieldName = view === 'catalog_brands' ? 'logo' : 'icon';
      setFormData((prev: any) => ({ ...prev, [fieldName]: converted }));
    } catch {
      alert('Unable to process this image.');
    }
    e.target.value = '';
  }, [view]);

  const handleTagBannerUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, field: 'desktopBanner' | 'mobileBanner') => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const converted = await convertFileToWebP(file, { quality: 0.85, maxDimension: field === 'desktopBanner' ? 1920 : 800 });
      setFormData((prev: any) => ({ ...prev, [field]: converted }));
    } catch {
      alert('Unable to process this image.');
    }
    e.target.value = '';
  }, []);

  const handleTagGallerySelect = useCallback((imageUrl: string) => {
    if (tagGalleryTarget) {
      setFormData((prev: any) => ({ ...prev, [tagGalleryTarget]: imageUrl }));
    }
    setTagGalleryPickerOpen(false);
    setTagGalleryTarget(null);
  }, [tagGalleryTarget]);

  const getPageNumbers = useCallback((): (number | string)[] => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages]);

  const showImageColumn = view === 'catalog_categories' || view === 'catalog_brands';

  return {
    // State
    searchTerm, setSearchTerm,
    statusFilter, setStatusFilter,
    itemsPerPage, setItemsPerPage,
    currentPage, setCurrentPage,
    selectedIds,
    openActionMenu, setOpenActionMenu,
    actionMenuPosition, setActionMenuPosition,
    mobileMenuOpen, setMobileMenuOpen,
    isModalOpen, setIsModalOpen,
    editItem,
    formData, setFormData,
    showStatusDropdown, setShowStatusDropdown,
    showPerPageDropdown, setShowPerPageDropdown,
    tagGalleryPickerOpen, setTagGalleryPickerOpen,
    tagGalleryTarget, setTagGalleryTarget,
    hasOrderChanges,
    isSavingOrder,
    // Refs
    fileInputRef,
    tagDesktopBannerRef,
    tagMobileBannerRef,
    // Computed
    catalogTabs,
    filteredData,
    paginatedData,
    totalPages,
    showImageColumn,
    sensors,
    // Handlers
    getTitle,
    getCurrentData,
    handleDragEnd,
    handleSaveOrder,
    handleSelectAll,
    handleSelectItem,
    handleOpenModal,
    handleSave,
    handleDelete,
    handleFileUpload,
    handleTagBannerUpload,
    handleTagGallerySelect,
    getPageNumbers,
  };
}
