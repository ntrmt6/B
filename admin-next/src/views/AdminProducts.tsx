import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import { Product, Category, SubCategory, ChildCategory, Brand, Tag } from '../types';
import ProductPricingAndStock, { ProductPricingData } from '@/components/ProductPricingAndStock';
import { DraftProduct, generateDraftId, getDrafts, saveDraft } from '@/utils/draftManager';
import AdminProductUpload from './AdminProductUpload';

interface AdminProductsProps {
  products: Product[];
  categories: Category[];
  subCategories: SubCategory[];
  childCategories: ChildCategory[];
  brands: Brand[];
  tags: Tag[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: number) => void;
  onBulkDelete: (ids: number[]) => void;
  onBulkUpdate: (ids: number[], updates: Partial<Product>) => void;
  tenantId?: string;
  onLogout: () => void;
  onSwitchSection: (section: string) => void;
  activeSection: string;
}

interface DraftProductData {
  draftId: string;
  name?: string;
}

interface DisplayProduct extends Product {
  _isDraft?: boolean;
  _draftId?: string;
}

interface SvgIconProps {
  [key: string]: any;
}

interface IconsObject {
  Search: React.FC<SvgIconProps>;
  Plus: React.FC<SvgIconProps>;
  Filter: React.FC<SvgIconProps>;
  Upload: React.FC<SvgIconProps>;
  Download: React.FC<SvgIconProps>;
  MoreVertical: React.FC<SvgIconProps>;
}

interface CsvImportRow {
  [key: string]: string | number;
}

interface CsvTemplateData {
  name: string;
  price: string;
  originalPrice: string;
  sku: string;
  stock: string;
  category: string;
  status: string;
  tags: string;
  galleryImages: string;
  description: string;
}

const AdminProducts: React.FC<AdminProductsProps> = ({ 
  products,
  categories,
  subCategories,
  childCategories,
  brands,
  tags,
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct,
  onBulkDelete,
  onBulkUpdate,
  tenantId,
  onLogout,
  onSwitchSection,
  activeSection
}) => {
  const activeTenantId = tenantId || '';
  const [view, setView] = useState<'list' | 'upload'>('list');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [draftProducts, setDraftProducts] = useState<any[]>([]);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [openActionDropdown, setOpenActionDropdown] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Refs
  const importInputRef = useRef<HTMLInputElement>(null);
  const viewMenuRef = useRef<HTMLDivElement>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    price: 0,
    status: 'Active'
  });

  // --- 1. Import Logic (Saves to DB per Tenant) ---
  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        let successCount = 0;
        for (const row of results.data as any[]) {
          try {
            const newProduct: any = {
              ...row,
              tenantId: activeTenantId,
              price: parseFloat(row.price) || 0,
              originalPrice: parseFloat(row.originalPrice) || 0,
              stock: parseInt(row.stock) || 0,
              tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()) : [],
              galleryImages: row.galleryImages ? row.galleryImages.split(';') : [],
              status: row.status || 'Active',
              createdAt: new Date().toISOString()
            };
            await onAddProduct(newProduct);
            successCount++;
          } catch (error) {
            console.error("Failed to import row:", row.name, error);
          }
        }
        alert(`Successfully imported ${successCount} products to ${activeTenantId}.`);
        if (importInputRef.current) importInputRef.current.value = '';
      }
    });
  };

  // --- 2. Export Logic ---
  const handleExportCSV = () => {
    if (products.length === 0) return alert("No products to export");
    const dataToExport = products.map(p => ({
      ...p,
      tags: Array.isArray(p.tags) ? p.tags.join(', ') : '',
      galleryImages: Array.isArray(p.galleryImages) ? p.galleryImages.join(';') : ''
    }));
    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `products_${activeTenantId}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- 3. Download Template Logic ---
  const handleDownloadTemplate = () => {
    const templateData = [{
      name: "Example Product",
      price: "49.99",
      originalPrice: "59.99",
      sku: "SKU123",
      stock: "100",
      category: categories[0]?.name || "General",
      status: "Active",
      tags: "tag1, tag2",
      galleryImages: "url1;url2",
      description: "Sample description"
    }];
    const csv = Papa.unparse(templateData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'systemnextit_product_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Effects & Helpers ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openActionDropdown !== null && !(event.target as HTMLElement).closest('[data-action-dropdown]')) {
        setOpenActionDropdown(null);
      }
      if (isViewMenuOpen && viewMenuRef.current && !viewMenuRef.current.contains(event.target as Node)) {
        setIsViewMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openActionDropdown, isViewMenuOpen]);

  useEffect(() => {
    setDraftProducts(getDrafts(activeTenantId));
  }, [activeTenantId]);

  const allProducts = useMemo(() => [
    ...products,
    ...draftProducts.map(draft => ({
      id: parseInt(draft.draftId.replace('draft_', '')) || Date.now(),
      name: draft.name || 'Untitled Draft',
      status: 'Draft',
      _isDraft: true,
      _draftId: draft.draftId,
    } as unknown as Product))
  ], [products, draftProducts]);

  const filteredProducts = useMemo(() =>
    allProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [allProducts, searchTerm]);

  const paginatedProducts = filteredProducts.slice((currentPage - 1) * 10, currentPage * 10);
  const totalPages = Math.ceil(filteredProducts.length / 10);

  const getProductKey = (product: Product, idx: number) => {
    return `${product.id}-${idx}`;
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedProducts.length) {
      setSelectedIds(new Set());
    } else {
      const allKeys = paginatedProducts.map((p, idx) => getProductKey(p, idx));
      setSelectedIds(new Set(allKeys));
    }
  };

  const toggleSelect = (key: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const getSelectedProductIds = (): number[] => {
    return paginatedProducts.filter((p, idx) => selectedIds.has(getProductKey(p, idx))).map(p => p.id);
  };

  const Icons = {
    Search: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
    Plus: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
    Filter: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>,
    Upload: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>,
    Download: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>,
    MoreVertical: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>,
    Eye: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>,
    Edit: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
  };

  if (view === 'upload') {
    return (
      <AdminProductUpload
        initialProduct={editingProduct}
        categories={categories}
        subCategories={subCategories}
        childCategories={childCategories}
        brands={brands}
        tags={tags}
        user={undefined}
        activeTenantId={activeTenantId}
        onCancel={() => { setView('list'); setEditingProduct(null); }}
        onSubmit={(product: Product) => {
          editingProduct ? onUpdateProduct(product) : onAddProduct(product);
          setView('list'); setEditingProduct(null);
        }}
      />
    );
  }

  return (
    <div className="w-full min-h-screen bg-white font-sans text-gray-800 p-3 xs:p-4 sm:p-6">
      <input type="file" ref={importInputRef} onChange={handleImportCSV} accept=".csv" className="hidden" />
      
      {/* Header Section - Responsive */}
      <div className="flex flex-col gap-3 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-[#111827]">Products</h1>
          <button
            onClick={() => { setEditingProduct(null); setView('upload'); }}
            className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2 bg-[#0088FF] text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors w-full sm:w-auto"
          >
            <Icons.Plus /> Add Product
          </button>
        </div>
        {/* Search */}
        <div className="relative w-full sm:max-w-md">
          <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className="block w-full pl-10 pr-4 py-2.5 bg-[#F3F4F6] border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            placeholder="Search products/SKU"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Action Bar - Responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
        <div className="flex flex-wrap items-center gap-3 sm:gap-6">
          <button onClick={() => importInputRef.current?.click()} className="flex items-center gap-2 text-[#EA580C] text-sm font-medium hover:opacity-80">
            <Icons.Upload /> Import
          </button>
          <button onClick={handleExportCSV} className="flex items-center gap-2 text-[#EA580C] text-sm font-medium hover:opacity-80">
            <Icons.Download /> Export
          </button>
          <button onClick={handleDownloadTemplate} className="flex items-center gap-2 text-blue-600 text-sm font-medium hover:opacity-80">
            <Icons.Download /> Template
          </button>
        </div>

        {/* View Toggle */}
        <div className="relative" ref={viewMenuRef}>
          <button
            onClick={() => setIsViewMenuOpen(!isViewMenuOpen)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-sky-500 rounded-lg text-sky-600 text-sm font-medium hover:bg-sky-50 transition"
          >
            <span className="text-xs text-gray-500 uppercase hidden xs:inline">View</span>
            {viewMode === 'list' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            )}
            <span className="hidden xs:inline">{viewMode === 'list' ? 'List view' : 'Grid view'}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
          {isViewMenuOpen && (
            <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[140px]">
              <button
                onClick={() => { setViewMode('list'); setIsViewMenuOpen(false); }}
                className={`flex items-center gap-2 w-full px-4 py-3 text-sm hover:bg-gray-50 transition ${viewMode === 'list' ? 'bg-sky-50 text-sky-600' : 'text-gray-700'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                List view
              </button>
              <button
                onClick={() => { setViewMode('grid'); setIsViewMenuOpen(false); }}
                className={`flex items-center gap-2 w-full px-4 py-3 text-sm hover:bg-gray-50 transition ${viewMode === 'grid' ? 'bg-sky-50 text-sky-600' : 'text-gray-700'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                Grid view
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Card View (shown below sm breakpoint) */}
      <div className="block sm:hidden space-y-3">
        {/* Select All */}
        <div className="flex items-center gap-3 px-1">
          <input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.size === paginatedProducts.length && paginatedProducts.length > 0} className="w-4 h-4 rounded" />
          <span className="text-xs text-gray-500">Select All ({paginatedProducts.length})</span>
        </div>
        {paginatedProducts.map((product, index) => {
          const productKey = getProductKey(product, index);
          return (
            <div key={productKey} className={`bg-white dark:bg-gray-800 rounded-xl border p-3 transition-colors ${selectedIds.has(productKey) ? 'border-blue-300 bg-blue-50/30 dark:bg-blue-900/20' : 'border-gray-100 dark:border-gray-700'}`}>
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <input type="checkbox" checked={selectedIds.has(productKey)} onChange={() => toggleSelect(productKey)} className="w-4 h-4 rounded mt-1 flex-shrink-0 dark:bg-gray-700 dark:border-gray-600" />
                
                {/* Image */}
                <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-700 border dark:border-gray-600 overflow-hidden flex-shrink-0">
                  {product.image && <img src={product.image} className="w-full h-full object-cover" alt="" />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">{product.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-semibold text-sky-600 dark:text-sky-400">৳{product.price?.toLocaleString() || '0'}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">|</span>
                    <span className={`text-xs ${(product.stock ?? 0) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                      Stock: {product.stock ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${product.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                      {product.status}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">#{(currentPage - 1) * 10 + index + 1}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="relative flex-shrink-0" data-action-dropdown>
                  <button onClick={() => setOpenActionDropdown(openActionDropdown === productKey ? null : productKey)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                    <Icons.MoreVertical className="text-gray-400 dark:text-gray-500" />
                  </button>
                  {openActionDropdown === productKey && (
                    <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-xl z-50 py-1">
                      <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200 flex items-center gap-2" onClick={() => { setEditingProduct(product); setOpenActionDropdown(null); }}>
                        <Icons.Eye className="text-gray-400" />View
                      </button>
                      <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200 flex items-center gap-2" onClick={() => { setEditingProduct(product); setView('upload'); setOpenActionDropdown(null); }}>
                        <Icons.Edit className="text-gray-400" />Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table (hidden below sm) */}
      <div className="hidden sm:block w-full rounded-xl border border-gray-100 shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#EBF5FF] text-[#1F2937] text-sm font-semibold">
                <th className="p-4 w-14 text-center">
                  <input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.size === paginatedProducts.length && paginatedProducts.length > 0} />
                </th>
                <th className="p-4">SL</th>
                <th className="p-4">Image</th>
                <th className="p-4">Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">SKU</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedProducts.map((product, index) => {
                const productKey = getProductKey(product, index);
                return (
                <tr key={productKey} className={`${selectedIds.has(productKey) ? 'bg-blue-50/50' : ''} hover:bg-gray-50 transition-colors`}>
                  <td className="p-4 text-center">
                    <input type="checkbox" checked={selectedIds.has(productKey)} onChange={() => toggleSelect(productKey)} />
                  </td>
                  <td className="p-4 text-sm text-gray-500">{(currentPage - 1) * 10 + index + 1}</td>
                  <td className="p-4">
                    <div className="w-10 h-10 rounded-md bg-gray-100 border overflow-hidden">
                      {product.image && <img src={product.image} className="w-full h-full object-cover" alt="" />}
                    </div>
                  </td>
                  <td className="p-4 text-sm font-medium text-gray-900">{product.name}</td>
                  <td className="p-4 text-sm text-gray-600">{product.category || '-'}</td>
                  <td className="p-4 text-sm text-gray-600 font-mono">{product.sku || 'N/A'}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${product.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="p-4 text-center relative" data-action-dropdown>
                    <button onClick={() => setOpenActionDropdown(openActionDropdown === productKey ? null : productKey)} className="p-1 hover:bg-gray-100 rounded-md">
                      <Icons.MoreVertical className="text-gray-400" />
                    </button>
                    {openActionDropdown === productKey && (
                      <div className="absolute right-full mr-2 to p-0 w-32 bg-white border border-gray-100 rounded-lg shadow-xl z-50 py-1">
                        <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50" onClick={() => { setEditingProduct(product); setView('upload'); setOpenActionDropdown(null); }}>Edit</button>
                        <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50" onClick={() => { onDeleteProduct(product.id); setOpenActionDropdown(null); }}>Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination - Responsive */}
      <div className="flex flex-col xs:flex-row justify-between items-center mt-4 sm:mt-6 gap-3">
        <p className="text-xs sm:text-sm text-gray-500">Showing {paginatedProducts.length} of {filteredProducts.length} products</p>
        <div className="flex gap-2">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 sm:px-4 py-2 text-sm font-medium border rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-all">Previous</button>
          <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 sm:px-4 py-2 text-sm font-medium border rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-all">Next</button>
        </div>
      </div>

      {/* Floating Bulk Action Bar - Responsive */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 bg-white border border-gray-200 shadow-2xl rounded-xl sm:rounded-2xl px-3 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-6 z-[100] max-w-[95vw]">
          <div className="flex flex-col items-center">
            <span className="text-sky-500 font-bold text-base sm:text-lg">{selectedIds.size}</span>
            <span className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Selected</span>
          </div>

          <div className="w-px h-6 sm:h-8 bg-gray-200"></div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => { onBulkUpdate(getSelectedProductIds(), { status: 'Active' }); setSelectedIds(new Set()); }}
              className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-green-50 text-green-700 text-[10px] sm:text-xs font-bold hover:bg-green-100 transition flex items-center gap-1 sm:gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              <span className="hidden xs:inline">Publish</span>
            </button>
            <button
              onClick={() => { onBulkUpdate(getSelectedProductIds(), { status: 'Draft' }); setSelectedIds(new Set()); }}
              className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-amber-50 text-amber-700 text-[10px] sm:text-xs font-bold hover:bg-amber-100 transition flex items-center gap-1 sm:gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              <span className="hidden xs:inline">Draft</span>
            </button>
            <button
              onClick={() => { onBulkDelete(getSelectedProductIds()); setSelectedIds(new Set()); }}
              className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-red-50 text-red-600 text-[10px] sm:text-xs font-bold hover:bg-red-100 transition flex items-center gap-1 sm:gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              <span className="hidden xs:inline">Delete</span>
            </button>
          </div>

          <button onClick={() => setSelectedIds(new Set())} className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      )}
    </div>
  );
};
