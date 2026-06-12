import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Check,
  LayoutGrid,
  List as ListIcon,
  Filter,
  X,
  Copy,
  Edit,
  Trash2,
  ChevronDown,
  Bell,
  Settings as SettingsIcon,
  MessageSquare,
  PlayCircle,
  ExternalLink,
  Grid,
  Layout,
  Package,
  Users,
  Archive,
  Star,
  Layers,
  Palette,
  FileText,
  MousePointer2,
  Image as ImageIcon,
  BarChart3,
  ShieldCheck,
  CreditCard,
  LifeBuoy,
  BookOpen,
  CheckCircle,
  Eye
} from 'lucide-react';
import OptimizedImage from './OptimizedImage';
import { Product, Category, Brand, Tag, User } from '../types';
import { formatCurrency } from '../utils/format';

interface Props {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  user: User | null;
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: number) => void;
  onCloneProduct: (product: Product) => void;
  onBulkDelete: (ids: number[]) => void;
  onBulkStatusUpdate: (ids: number[], status: 'Active' | 'Draft') => void;
  onBulkCategoryUpdate: (ids: number[], category: string) => void;
  onSearch: (term: string) => void;
  onDeepSearch: (options: any) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLogout: () => void;
  onSwitchSection: (section: string) => void;
  activeSection: string;
  onViewInShop?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
  storeSubdomain?: string;
  onImport?: () => void;
  onExport?: () => void;
}

const AdminProductsRedesign: React.FC<Props> = ({
  products,
  categories,
  brands,
  user,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onCloneProduct,
  onBulkDelete,
  onBulkStatusUpdate,
  onViewInShop,
  onViewDetails,
  storeSubdomain,
  onBulkCategoryUpdate,
  onSearch,
  onDeepSearch,
  currentPage,
  totalPages,
  onPageChange,
  onLogout,
  onSwitchSection,
  activeSection,
  onImport,
  onExport
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeepSearchOpen, setIsDeepSearchOpen] = useState(false);
  const [openActionDropdown, setOpenActionDropdown] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (openActionDropdown && !target.closest('[data-dropdown]')) {
        setOpenActionDropdown(null);
      }
      if (isViewMenuOpen && !target.closest('[data-view-menu]')) {
        setIsViewMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openActionDropdown]);

  const getSelectedProductIds = (): number[] => {
    return products.filter((p, idx) => selectedIds.has(getProductKey(p, idx))).map(p => p.id);
  };

  // Deep Search Local State
  const [deepSearchTerm, setDeepSearchTerm] = useState('');
  const [searchInFields, setSearchInFields] = useState({
    name: true,
    description: true,
    category: true,
    brand: true,
    sku: true
  });
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [stockRange, setStockRange] = useState({ min: '', max: '' });

  const getProductKey = (product: Product, idx: number) => {
    return (product as any)._id || `${product.id}-${idx}`;
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allKeys = products.map((p, idx) => getProductKey(p, idx));
      setSelectedIds(new Set(allKeys));
    } else {
      setSelectedIds(new Set());
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

  const handleApplyDeepSearch = () => {
    onDeepSearch({
      term: deepSearchTerm,
      fields: searchInFields,
      priceRange,
      stockRange
    });
    setIsDeepSearchOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-stone-50 font-poppins text-black animate-fade-in overflow-x-hidden">
      {/* Content Wrapper */}
      <main className="p-3 sm:p-4 md:p-8 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
        {/* Products Control Header */}
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm space-y-4 sm:space-y-6 w-full overflow-hidden">
          {/* Top Row: Title + Actions */}
          <div className="flex flex-col gap-3 sm:gap-4">
            <h2 className="text-teal-950 text-lg sm:text-xl font-bold font-lato tracking-tight">Products</h2>
            
            {/* Search + Actions Row */}
            <div className="flex flex-col gap-3 w-full">
              {/* Search - Full Width on Mobile */}
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black" size={16} />
                <input
                  type="text"
                  placeholder="Search products/SKU"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    onSearch(e.target.value);
                  }}
                  className="w-full bg-zinc-100 border-none rounded-lg pl-9 pr-3 py-2.5 text-xs focus:ring-1 focus:ring-sky-400"
                />
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Deep Search */}
                <button
                  onClick={() => setIsDeepSearchOpen(!isDeepSearchOpen)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition flex-shrink-0 ${isDeepSearchOpen ? 'bg-sky-100 text-sky-600' : 'bg-zinc-100 text-black'}`}
                >
                  <Filter size={14} />
                  <span className="hidden xs:inline">Deep Search</span>
                </button>

                {/* View Toggle */}
                <div className="relative flex-shrink-0" data-view-menu>
                  <button
                    onClick={() => setIsViewMenuOpen(!isViewMenuOpen)}
                    className="flex items-center gap-1.5 px-3 py-2 border border-sky-500 rounded-lg text-sky-600 text-xs font-medium hover:bg-sky-50 transition"
                  >
                    {viewMode === 'list' ? <ListIcon size={14} /> : <LayoutGrid size={14} />}
                    <span className="hidden sm:inline">{viewMode === 'list' ? 'List' : 'Grid'}</span>
                    <ChevronDown size={12} />
                  </button>
                  {isViewMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[120px]">
                      <button
                        onClick={() => { setViewMode('list'); setIsViewMenuOpen(false); }}
                        className={`flex items-center gap-2 w-full px-3 py-2.5 text-xs hover:bg-gray-50 transition ${viewMode === 'list' ? 'bg-sky-50 text-sky-600' : 'text-gray-700'}`}
                      >
                        <ListIcon size={14} /> List view
                      </button>
                      <button
                        onClick={() => { setViewMode('grid'); setIsViewMenuOpen(false); }}
                        className={`flex items-center gap-2 w-full px-3 py-2.5 text-xs hover:bg-gray-50 transition ${viewMode === 'grid' ? 'bg-sky-50 text-sky-600' : 'text-gray-700'}`}
                      >
                        <LayoutGrid size={14} /> Grid view
                      </button>
                    </div>
                  )}
                </div>

                {/* Add Product */}
                <button
                  onClick={onAddProduct}
                  className="bg-gradient-to-r from-sky-400 to-blue-500 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-white font-bold flex items-center gap-1.5 hover:opacity-90 transition shadow-lg text-xs sm:text-sm flex-shrink-0 ml-auto"
                >
                  <Plus size={16} />
                  <span className="hidden xs:inline">Add Product</span>
                </button>
              </div>
            </div>
          </div>

          {/* Deep Search Panel */}
          {isDeepSearchOpen && (
            <div className="bg-stone-50 border border-gray-200 rounded-xl p-4 sm:p-6 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                <div className="space-y-3 sm:space-y-4">
                  <label className="block text-sm font-semibold text-gray-700">Search In Fields</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(searchInFields).map(([field, active]) => (
                      <label key={field} className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={(e) => setSearchInFields(prev => ({...prev, [field]: e.target.checked}))}
                          className="rounded border-gray-300 text-sky-500 focus:ring-sky-500"
                        />
                        <span className="capitalize">{field}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <label className="block text-sm font-semibold text-gray-700">Price Range</label>
                  <div className="flex items-center gap-2">
                    <input type="number" placeholder="Min" value={priceRange.min} onChange={(e) => setPriceRange(prev => ({...prev, min: e.target.value}))} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-400" />
                    <span className="text-gray-400">-</span>
                    <input type="number" placeholder="Max" value={priceRange.max} onChange={(e) => setPriceRange(prev => ({...prev, max: e.target.value}))} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-400" />
                  </div>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <label className="block text-sm font-semibold text-gray-700">Stock Range</label>
                  <div className="flex items-center gap-2">
                    <input type="number" placeholder="Min" value={stockRange.min} onChange={(e) => setStockRange(prev => ({...prev, min: e.target.value}))} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-400" />
                    <span className="text-gray-400">-</span>
                    <input type="number" placeholder="Max" value={stockRange.max} onChange={(e) => setStockRange(prev => ({...prev, max: e.target.value}))} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-400" />
                  </div>
                </div>
              </div>
              <div className="mt-4 sm:mt-6 flex flex-col xs:flex-row justify-end gap-3">
                <button onClick={() => setIsDeepSearchOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:underline">Cancel</button>
                <button onClick={handleApplyDeepSearch} className="bg-sky-500 text-white px-5 sm:px-6 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-sky-600 transition">Apply Filters</button>
              </div>
            </div>
          )}

          {/* Action Bar: Import/Export + Filters - Stacked on Mobile */}
          <div className="flex flex-col gap-3 pt-1 sm:pt-2">
            {/* Import/Export + Product Count */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <button onClick={onImport} className="flex items-center gap-1 text-xs font-normal text-neutral-900 hover:text-orange-600 transition">
                <div className="w-5 h-5 flex items-center justify-center border border-orange-600 rounded text-orange-600"><Upload size={12} /></div>
                Import
              </button>
              <button onClick={onExport} className="flex items-center gap-1 text-xs font-normal text-neutral-900 hover:text-orange-600 transition">
                <div className="w-5 h-5 flex items-center justify-center border border-orange-600 rounded text-orange-600"><Download size={12} /></div>
                Export
              </button>
              <div className="bg-zinc-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <span className="text-black text-xs font-normal">{products.length} Products</span>
                <ChevronDown size={14} className="text-black" />
              </div>
            </div>

            {/* Filters - Horizontal Scroll on Mobile */}
            <div className="w-full overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
              <div className="flex items-center gap-2 sm:gap-4 min-w-max pb-2">
                <div className="flex items-center gap-1.5 text-xs font-normal text-black">
                  <Filter size={14} /> Filter:
                </div>
                {['All Category', 'All Brands', 'All Status'].map(filter => (
                  <div key={filter} className="bg-zinc-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer hover:bg-zinc-200 transition">
                    <span className="text-black text-xs font-normal">{filter}</span>
                    <ChevronDown size={12} className="text-black" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden min-h-[300px] sm:min-h-[600px] flex flex-col">
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="flex-1 p-3 sm:p-6">
              {/* Select All */}
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 sm:w-5 sm:h-5 rounded border-gray-300 text-sky-500 focus:ring-sky-500 cursor-pointer"
                    checked={selectedIds.size === products.length && products.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                  <span className="text-xs sm:text-sm text-gray-600">Select All</span>
                </label>
                <span className="text-xs sm:text-sm text-gray-400">({products.length} products)</span>
              </div>

              <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                {products.map((product, idx) => {
                  const productKey = getProductKey(product, idx);
                  return (
                    <div
                      key={productKey}
                      className={`relative bg-white border rounded-lg sm:rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer group ${
                        selectedIds.has(productKey) ? 'border-sky-500 ring-2 ring-sky-200' : 'border-gray-200'
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <div className="absolute to p-1.5 left-1.5 sm:to p-2 sm:left-2 z-10">
                        <input
                          type="checkbox"
                          className="w-4 h-4 sm:w-5 sm:h-5 rounded border-gray-300 text-sky-500 focus:ring-sky-500 cursor-pointer bg-white shadow-sm"
                          checked={selectedIds.has(productKey)}
                          onChange={() => toggleSelect(productKey)}
                        />
                      </div>

                      {/* Status Badge */}
                      <div className="absolute to p-1.5 right-1.5 sm:to p-2 sm:right-2 z-10">
                        <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-medium ${
                          product.status === 'Active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {product.status || 'Draft'}
                        </span>
                      </div>

                      {/* Product Image */}
                      <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                        <OptimizedImage
                          src={product.image?.[0] || product.image || 'https://placehold.co/200x200'}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="p-2 sm:p-3">
                        <h3 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2 mb-0.5 sm:mb-1" title={product.name}>
                          {product.name}
                        </h3>
                        <p className="text-[10px] sm:text-xs text-gray-500 mb-1 sm:mb-2">{product.category || 'Uncategorized'}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-bold text-sky-600">
                            {formatCurrency(product.price)}
                          </span>
                          <span className="text-[9px] sm:text-[10px] text-gray-400 uppercase hidden xs:inline">{product.sku || 'No SKU'}</span>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-6 sm:pt-8 pb-1.5 sm:pb-2 px-1.5 sm:px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={(e) => { e.stopPropagation(); onEditProduct(product); }} className="p-1.5 sm:p-2 bg-sky-50 hover:bg-sky-100 rounded-lg transition" title="Edit">
                            <Edit size={12} className="sm:hidden text-sky-600" />
                            <Edit size={14} className="hidden sm:block text-sky-600" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); onCloneProduct(product); }} className="p-1.5 sm:p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition" title="Duplicate">
                            <Copy size={12} className="sm:hidden text-gray-600" />
                            <Copy size={14} className="hidden sm:block text-gray-600" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); onDeleteProduct(product.id); }} className="p-1.5 sm:p-2 bg-red-50 hover:bg-red-100 rounded-lg transition" title="Delete">
                            <Trash2 size={12} className="sm:hidden text-red-600" />
                            <Trash2 size={14} className="hidden sm:block text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {products.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 sm:py-32 text-gray-400">
                  <Archive size={48} strokeWidth={1} className="mb-3 sm:mb-4 opacity-20 sm:w-16 sm:h-16" />
                  <p className="text-base sm:text-lg font-medium">No products found</p>
                  <p className="text-xs sm:text-sm">Try adding a new product or changing filters</p>
                </div>
              )}
            </div>
          )}

          {/* Mobile Card View for List mode (below md) */}
          {viewMode === 'list' && (
            <div className="block md:hidden flex-1 p-3 space-y-2">
              {/* Select All */}
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500"
                    checked={selectedIds.size === products.length && products.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                  <span className="text-xs text-gray-600">Select All ({products.length})</span>
                </label>
              </div>

              {products.map((product, idx) => {
                const productKey = getProductKey(product, idx);
                return (
                  <div key={productKey} className={`rounded-xl border p-3 transition-all ${selectedIds.has(productKey) ? 'border-sky-400 bg-sky-50/30' : 'border-gray-100 bg-white'}`}>
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500 mt-1 flex-shrink-0" checked={selectedIds.has(productKey)} onChange={() => toggleSelect(productKey)} />
                      
                      {/* Image */}
                      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-100">
                        <OptimizedImage src={product.image?.[0] || product.image || 'https://placehold.co/56x56'} alt={product.name} className="w-full h-full object-cover" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-1" title={product.name}>{product.name}</h3>
                        <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-1">
                          <span className="text-[10px] text-gray-500">{product.category || 'Uncategorized'}</span>
                          <span className="text-[10px] text-gray-300">|</span>
                          <span className="text-[10px] text-gray-500 font-mono uppercase">{product.sku || 'No SKU'}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-xs font-bold text-sky-600">{formatCurrency(product.price)}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${product.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {product.status || 'Draft'}
                          </span>
                        </div>
                      </div>

                      {/* Action dropdown */}
                      <div className="relative flex-shrink-0" data-dropdown>
                        <button onClick={() => setOpenActionDropdown(openActionDropdown === productKey ? null : productKey)} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                          <MoreVertical size={16} className="text-gray-400" />
                        </button>
                        {openActionDropdown === productKey && (
                          <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 min-w-[140px]">
                            <button onClick={() => { onEditProduct(product); setOpenActionDropdown(null); }} className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-gray-50"><Edit size={14} /> Edit</button>
                            {onViewInShop && <button onClick={() => { onViewInShop(product); setOpenActionDropdown(null); }} className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-gray-50"><ExternalLink size={14} /> View in Shop</button>}
                            {onViewDetails && <button onClick={() => { onViewDetails(product); setOpenActionDropdown(null); }} className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-gray-50 bg-gray-50"><Eye size={14} /> Details</button>}
                            <button onClick={() => { onCloneProduct(product); setOpenActionDropdown(null); }} className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-gray-50"><Copy size={14} /> Duplicate</button>
                            <button onClick={() => { onBulkStatusUpdate([product.id], product.status === 'Active' ? 'Draft' : 'Active'); setOpenActionDropdown(null); }} className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-gray-50"><CheckCircle size={14} /> {product.status === 'Active' ? 'Set Draft' : 'Set Active'}</button>
                            <button onClick={() => { onDeleteProduct(product.id); setOpenActionDropdown(null); }} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50"><Trash2 size={14} /> Delete</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {products.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Archive size={48} strokeWidth={1} className="mb-3 opacity-20" />
                  <p className="text-base font-medium">No products found</p>
                  <p className="text-xs">Try adding a new product or changing filters</p>
                </div>
              )}
            </div>
          )}

          {/* Desktop Table View (hidden below md) */}
          {viewMode === 'list' && (
            <div className="hidden md:block overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gradient-to-b from-sky-400/20 to-blue-500/20 border-b border-gray-100">
                  <tr>
                    <th className="px-4 lg:px-6 py-4 w-12">
                      <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-sky-500 focus:ring-sky-500 cursor-pointer" checked={selectedIds.size === products.length && products.length > 0} onChange={(e) => handleSelectAll(e.target.checked)} />
                    </th>
                    <th className="px-3 lg:px-4 py-4 text-black text-xs lg:text-sm font-medium uppercase tracking-wider">SL</th>
                    <th className="px-3 lg:px-4 py-4 text-black text-xs lg:text-sm font-medium uppercase tracking-wider">Image</th>
                    <th className="px-3 lg:px-4 py-4 text-black text-xs lg:text-sm font-medium uppercase tracking-wider w-1/5 lg:w-1/4">Name</th>
                    <th className="px-3 lg:px-4 py-4 text-black text-xs lg:text-sm font-medium uppercase tracking-wider">Category</th>
                    <th className="px-3 lg:px-4 py-4 text-black text-xs lg:text-sm font-medium uppercase tracking-wider hidden lg:table-cell">Sub Category</th>
                    <th className="px-3 lg:px-4 py-4 text-black text-xs lg:text-sm font-medium uppercase tracking-wider hidden xl:table-cell">Priority</th>
                    <th className="px-3 lg:px-4 py-4 text-black text-xs lg:text-sm font-medium uppercase tracking-wider">SKU</th>
                    <th className="px-3 lg:px-4 py-4 text-black text-xs lg:text-sm font-medium uppercase tracking-wider text-center hidden lg:table-cell">Tags</th>
                    <th className="px-3 lg:px-4 py-4 text-black text-xs lg:text-sm font-medium uppercase tracking-wider">Status</th>
                    <th className="px-3 lg:px-4 py-4 text-black text-xs lg:text-sm font-medium uppercase tracking-wider text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((product, idx) => {
                    const productKey = getProductKey(product, idx);
                    return (
                    <tr key={productKey} className={`hover:bg-sky-50/30 transition-colors ${selectedIds.has(productKey) ? 'bg-sky-50/50' : ''}`}>
                      <td className="px-4 lg:px-6 py-4">
                        <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-sky-500 focus:ring-sky-500 cursor-pointer" checked={selectedIds.has(productKey)} onChange={() => toggleSelect(productKey)} />
                      </td>
                      <td className="px-3 lg:px-4 py-4 text-stone-900 text-xs font-normal">{(currentPage - 1) * 10 + idx + 1}</td>
                      <td className="px-3 lg:px-4 py-4">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-sky-400 to-blue-500 rounded-lg overflow-hidden border border-gray-100 shadow-sm">
                          <OptimizedImage src={product.image?.[0] || product.image || 'https://placehold.co/40x40'} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                      </td>
                      <td className="px-3 lg:px-4 py-4">
                        <div className="flex flex-col">
                          <span className="text-stone-900 text-xs font-medium line-clamp-2" title={product.name}>{product.name}</span>
                          <span className="text-[10px] text-gray-400 mt-1">ID: {product.id}</span>
                        </div>
                      </td>
                      <td className="px-3 lg:px-4 py-4 text-stone-900 text-xs font-normal">{product.category || 'Watch'}</td>
                      <td className="px-3 lg:px-4 py-4 text-stone-900 text-xs font-normal hidden lg:table-cell">{product.subCategory || 'Mans Watch'}</td>
                      <td className="px-3 lg:px-4 py-4 hidden xl:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-gray-100 rounded-full h-1.5 max-w-[60px]">
                            <div className="bg-sky-400 h-1.5 rounded-full" style={{ width: `${(product as any).priority || 50}%` }}></div>
                          </div>
                          <span className="text-stone-900 text-xs font-normal">{(product as any).priority || 57}%</span>
                        </div>
                      </td>
                      <td className="px-3 lg:px-4 py-4 text-stone-900 text-xs font-normal uppercase tracking-tighter">{product.sku || 'pr123456'}</td>
                      <td className="px-3 lg:px-4 py-4 text-center hidden lg:table-cell">
                        <span className="bg-zinc-100 text-stone-900 text-[10px] px-2 py-1 rounded-md border border-gray-200">
                          {product.tags?.[0] || 'New Arrival'}
                        </span>
                      </td>
                      <td className="px-3 lg:px-4 py-4">
                        <span className={`px-2 lg:px-3 py-1 rounded-full text-[10px] font-medium transition-colors ${
                          product.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {product.status || 'Draft'}
                        </span>
                      </td>
                      <td className="px-3 lg:px-4 py-4 text-center">
                        <div className="relative inline-block" data-dropdown>
                          <button onClick={() => setOpenActionDropdown(openActionDropdown === productKey ? null : productKey)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                            <MoreVertical size={16} className="text-black" />
                          </button>

                          {openActionDropdown === productKey && (
                            <div className="absolute right-full to p-0 mr-2 z-50" style={{ width: '180px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', padding: '8px 0' }}>
                              <button 
                                onClick={() => { onEditProduct(product); setOpenActionDropdown(null); }}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', height: '48px', padding: '0 24px', backgroundColor: 'white', border: 'none', cursor: 'pointer', fontFamily: '"Lato", sans-serif', fontWeight: 600, fontSize: '16px', color: 'black', whiteSpace: 'nowrap' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                              >
                                <Edit size={24} color="black" /> Edit
                              </button>
                              <button 
                                onClick={() => { 
                                  if (onViewInShop) { onViewInShop(product); } 
                                  else if (storeSubdomain) { window.open(`//${storeSubdomain}.${window.location.host}/product/${product.id}`, '_blank'); }
                                  setOpenActionDropdown(null); 
                                }}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', height: '48px', padding: '0 24px', backgroundColor: 'white', border: 'none', cursor: 'pointer', fontFamily: '"Lato", sans-serif', fontWeight: 600, fontSize: '16px', color: 'black', whiteSpace: 'nowrap' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                              >
                                <ExternalLink size={24} color="black" /> View in Shop
                              </button>
                              <button 
                                onClick={() => { if (onViewDetails) onViewDetails(product); setOpenActionDropdown(null); }}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', height: '48px', padding: '0 24px', backgroundColor: '#f4f4f4', border: 'none', cursor: 'pointer', fontFamily: '"Lato", sans-serif', fontWeight: 600, fontSize: '16px', color: 'black', whiteSpace: 'nowrap' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eaeaea'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f4f4f4'}
                              >
                                <Eye size={24} color="black" /> Details
                              </button>
                              <button 
                                onClick={() => { onCloneProduct(product); setOpenActionDropdown(null); }}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', height: '48px', padding: '0 24px', backgroundColor: 'white', border: 'none', cursor: 'pointer', fontFamily: '"Lato", sans-serif', fontWeight: 600, fontSize: '16px', color: 'black', whiteSpace: 'nowrap' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                              >
                                <Copy size={24} color="black" /> Duplicate
                              </button>
                              <button 
                                onClick={() => { 
                                  const newStatus = product.status === 'Active' ? 'Draft' : 'Active';
                                  onBulkStatusUpdate([product.id], newStatus as 'Active' | 'Draft');
                                  setOpenActionDropdown(null); 
                                }}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', height: '48px', padding: '0 24px', backgroundColor: 'white', border: 'none', cursor: 'pointer', fontFamily: '"Lato", sans-serif', fontWeight: 600, fontSize: '16px', color: 'black', whiteSpace: 'nowrap' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                              >
                                <CheckCircle size={24} color="black" /> {product.status === 'Active' ? 'Set Draft' : 'Set Active'}
                              </button>
                              <button 
                                onClick={() => { onDeleteProduct(product.id); setOpenActionDropdown(null); }}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', height: '48px', padding: '0 24px', backgroundColor: 'white', border: 'none', cursor: 'pointer', fontFamily: '"Lato", sans-serif', fontWeight: 600, fontSize: '16px', color: '#da0000', whiteSpace: 'nowrap' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                              >
                                <Trash2 size={24} color="#da0000" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>

              {products.length === 0 && (
                <div className="flex flex-col items-center justify-center py-32 text-gray-400">
                  <Archive size={64} strokeWidth={1} className="mb-4 opacity-20" />
                  <p className="text-lg font-medium">No products found</p>
                  <p className="text-sm">Try adding a new product or changing filters</p>
                </div>
              )}
            </div>
          )}

          {/* Pagination - Responsive */}
          <div className="px-3 sm:px-6 md:px-8 py-4 sm:py-6 border-t border-gray-100 flex flex-col xs:flex-row items-center justify-between gap-3">
            <button
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="h-9 sm:h-10 px-3 sm:px-4 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition w-full xs:w-auto justify-center"
            >
              <ChevronLeft size={16} /> Previous
            </button>

            <div className="flex items-center gap-1 sm:gap-2">
              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                  return (
                    <button
                      key={page}
                      onClick={() => onPageChange(page)}
                      className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg text-xs sm:text-sm font-bold transition ${
                        currentPage === page ? 'bg-sky-100 text-blue-500 shadow-sm' : 'text-teal-950 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {page}
                    </button>
                  );
                }
                if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="px-0.5 sm:px-1 text-gray-400 text-xs">...</span>;
                }
                return null;
              })}
            </div>

            <button
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="h-9 sm:h-10 px-3 sm:px-4 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition w-full xs:w-auto justify-center"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </main>

      {/* Floating Bulk Action Bar - Responsive */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-4 sm:bottom-10 left-1/2 -translate-x-1/2 bg-white border border-gray-200 shadow-2xl rounded-xl sm:rounded-2xl px-3 sm:px-8 py-3 sm:py-4 flex items-center gap-3 sm:gap-8 z-[100] animate-in slide-in-from-bottom-8 max-w-[95vw]">
          <div className="flex flex-col items-center">
            <span className="text-sky-500 font-bold text-base sm:text-lg">{selectedIds.size}</span>
            <span className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-widest font-bold">Selected</span>
          </div>

          <div className="w-px h-6 sm:h-8 bg-gray-100"></div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <button onClick={() => onBulkStatusUpdate(getSelectedProductIds(), 'Active')} className="px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-green-50 text-green-700 text-[10px] sm:text-xs font-bold hover:bg-green-100 transition flex items-center gap-1 sm:gap-2">
              <CheckCircle size={14} /> <span className="hidden xs:inline">Publish</span>
            </button>
            <button onClick={() => onBulkStatusUpdate(getSelectedProductIds(), 'Draft')} className="px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-amber-50 text-amber-700 text-[10px] sm:text-xs font-bold hover:bg-amber-100 transition flex items-center gap-1 sm:gap-2">
              <Eye size={14} /> <span className="hidden xs:inline">Draft</span>
            </button>
            <button onClick={() => onBulkDelete(getSelectedProductIds())} className="px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-red-50 text-red-600 text-[10px] sm:text-xs font-bold hover:bg-red-100 transition flex items-center gap-1 sm:gap-2">
              <Trash2 size={14} /> <span className="hidden xs:inline">Delete</span>
            </button>
          </div>

          <button onClick={() => setSelectedIds(new Set())} className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition text-gray-400">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminProductsRedesign;
