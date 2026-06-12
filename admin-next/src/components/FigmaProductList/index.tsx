import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FigmaProductListProps, Product } from './types';
import { getStoreUrl } from './utils';
import { useProductOrder } from './hooks/useProductOrder';
import { useProductImport } from './hooks/useProductImport';
import { useCourierStatus } from './hooks/useCourierStatus';
import ProductHeader from './ProductHeader';
import ProductFilters from './ProductFilters';
import BulkActionBar from './BulkActionBar';
import DiscountModal from './DiscountModal';
import BulkTagModal from './BulkTagModal';
import BulkStockModal from './BulkStockModal';
import ProductGridLarge from './ProductGridLarge';
import ProductGridSmall from './ProductGridSmall';
import ProductListView from './ProductListView';
import Pagination from './Pagination';
import ProductContextMenu from './ProductContextMenu';

const FigmaProductList: React.FC<FigmaProductListProps> = ({
  products: propProducts = [],
  orders = [],
  courierConfig,
  categories = [],
  brands = [],
  title,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onCloneProduct,
  onBulkDelete,
  onBulkStatusUpdate,
  onBulkFlashSale,
  onBulkDiscount,
  onBulkTagAssign,
  onBulkStockUpdate,
  onImport,
  onBulkImport,
  onQuickUpdate,
  tags: availableTags = [],
  tenantId,
  tenantSubdomain,
  productDisplayOrder = [],
  onProductOrderChange,
}) => {
  // ── UI state ──────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'large' | 'small' | 'list'>('list');
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [productsPerPage, setProductsPerPage] = useState(10);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);

  // ── Filter state ──────────────────────────────────────────────────────────
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [showPerPageDropdown, setShowPerPageDropdown] = useState(false);

  // ── Context-menu state ────────────────────────────────────────────────────
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; product: Product } | null>(null);
  const [contextSubMenu, setContextSubMenu] = useState<string | null>(null);
  const [tagSearchInContext, setTagSearchInContext] = useState('');
  const [deliveryChargeInput, setDeliveryChargeInput] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [tagDurationInput, setTagDurationInput] = useState('');
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // ── Custom hooks ──────────────────────────────────────────────────────────
  const {
    orderedProducts,
    hasOrderChanges,
    isSavingOrder,
    handleDragEnd,
    handleSaveOrder,
    handleResetOrder,
  } = useProductOrder({ propProducts, productDisplayOrder, onProductOrderChange });

  const { handleImportFile, handleExportCSV } = useProductImport({
    propProducts,
    onImport,
    onBulkImport,
    importInputRef,
  });

  const courierStatuses = useCourierStatus({ orders, tenantId, courierConfig });

  // ── Derived data ──────────────────────────────────────────────────────────
  const storeBaseUrl = getStoreUrl(tenantSubdomain);

  const uniqueCategories = useMemo(
    () => Array.from(new Set(propProducts.map(p => p.category).filter(Boolean))),
    [propProducts]
  );

  const uniqueBrands = useMemo(
    () => Array.from(new Set(propProducts.map(p => p.brand).filter(Boolean))),
    [propProducts]
  );

  const filteredProducts = useMemo(() => {
    let filtered = orderedProducts.length > 0 ? orderedProducts : propProducts;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query)
      );
    }
    if (categoryFilter !== 'all') filtered = filtered.filter(p => p.category === categoryFilter);
    if (brandFilter !== 'all') filtered = filtered.filter(p => p.brand === brandFilter);
    if (statusFilter !== 'all') filtered = filtered.filter(p => p.status === statusFilter);
    if (tagFilter !== 'all') filtered = filtered.filter(p => p.tags?.includes(tagFilter));

    return filtered;
  }, [orderedProducts, propProducts, searchQuery, categoryFilter, brandFilter, statusFilter, tagFilter]);

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * productsPerPage;
    return filteredProducts.slice(start, start + productsPerPage);
  }, [filteredProducts, currentPage, productsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, brandFilter, statusFilter, tagFilter]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getProductKey = useCallback(
    (product: Product, idx: number): string => product._id || `${product.id}-${idx}`,
    []
  );

  // ── Selection handlers ────────────────────────────────────────────────────
  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === paginatedProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedProducts.map((p, idx) => getProductKey(p, idx))));
    }
  }, [selectedIds.size, paginatedProducts, getProductKey]);

  const handleSelectProduct = useCallback((key: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const getSelectedProductIds = useCallback((): number[] =>
    paginatedProducts
      .filter((p, idx) => selectedIds.has(getProductKey(p, idx)))
      .map(p => p.id),
    [paginatedProducts, selectedIds, getProductKey]
  );

  // ── Bulk action handlers ──────────────────────────────────────────────────
  const handleBulkDelete = useCallback(() => {
    const ids = getSelectedProductIds();
    if (ids.length === 0) { toast.error('Select products to delete'); return; }
    onBulkDelete ? onBulkDelete(ids) : toast.success(`Deleted ${ids.length} products`);
    setSelectedIds(new Set());
  }, [getSelectedProductIds, onBulkDelete]);

  const handleBulkPublish = useCallback(() => {
    const ids = getSelectedProductIds();
    if (ids.length === 0) { toast.error('Select products to publish'); return; }
    onBulkStatusUpdate ? onBulkStatusUpdate(ids, 'Active') : toast.success(`Published ${ids.length} products`);
    setSelectedIds(new Set());
  }, [getSelectedProductIds, onBulkStatusUpdate]);

  const handleBulkDraft = useCallback(() => {
    const ids = getSelectedProductIds();
    if (ids.length === 0) { toast.error('Select products to draft'); return; }
    onBulkStatusUpdate ? onBulkStatusUpdate(ids, 'Draft') : toast.success(`Moved ${ids.length} products to draft`);
    setSelectedIds(new Set());
  }, [getSelectedProductIds, onBulkStatusUpdate]);

  const handleBulkFlashSaleAction = useCallback((action: 'add' | 'remove') => {
    const ids = getSelectedProductIds();
    if (ids.length === 0) { toast.error('Select products first'); return; }
    onBulkFlashSale
      ? onBulkFlashSale(ids, action)
      : toast.success(action === 'add' ? `Added ${ids.length} products to Flash Sale` : `Removed ${ids.length} products from Flash Sale`);
    setSelectedIds(new Set());
  }, [getSelectedProductIds, onBulkFlashSale]);

  const handleApplyDiscount = useCallback(() => {
    const ids = getSelectedProductIds();
    if (ids.length === 0) { toast.error('Select products first'); return; }
    if (discountValue <= 0) { toast.error('Enter a valid discount percentage'); return; }
    onBulkDiscount ? onBulkDiscount(ids, discountValue) : toast.success(`Applied ${discountValue}% discount to ${ids.length} products`);
    setShowDiscountModal(false);
    setDiscountValue(0);
    setSelectedIds(new Set());
  }, [getSelectedProductIds, discountValue, onBulkDiscount]);

  const handleBulkTagAssign = useCallback((tagNames: string[]) => {
    const ids = getSelectedProductIds();
    if (ids.length === 0) { toast.error('Select products first'); return; }
    onBulkTagAssign
      ? onBulkTagAssign(ids, tagNames)
      : toast.success(`Assigned ${tagNames.length} tag(s) to ${ids.length} products`);
    setShowTagModal(false);
    setSelectedIds(new Set());
  }, [getSelectedProductIds, onBulkTagAssign]);

  const handleBulkStockUpdate = useCallback((quantity: number, mode: 'set' | 'add') => {
    const ids = getSelectedProductIds();
    if (ids.length === 0) { toast.error('Select products first'); return; }
    onBulkStockUpdate
      ? onBulkStockUpdate(ids, quantity, mode)
      : toast.success(`Updated stock for ${ids.length} products`);
    setShowStockModal(false);
    setSelectedIds(new Set());
  }, [getSelectedProductIds, onBulkStockUpdate]);

  // ── Click-outside / scroll handlers ──────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setOpenDropdownId(null);
        setShowCategoryDropdown(false);
        setShowBrandDropdown(false);
        setShowStatusDropdown(false);
        setShowTagDropdown(false);
        setShowPerPageDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleCloseCtx = (e: MouseEvent) => {
      if (contextMenu && contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
        setContextSubMenu(null);
      }
    };
    const handleScroll = () => { setContextMenu(null); setContextSubMenu(null); };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setContextMenu(null); setContextSubMenu(null); }
    };
    document.addEventListener('mousedown', handleCloseCtx);
    document.addEventListener('scroll', handleScroll, true);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleCloseCtx);
      document.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [contextMenu]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl mx-1 xxs:mx-2 sm:mx-4 md:mx-6 p-2 xxs:p-3 sm:p-6 shadow-sm font-['Roboto']">
      {/* Hidden file input for CSV/TSV/XLSX import */}
      <input
        type="file"
        ref={importInputRef}
        onChange={handleImportFile}
        accept=".csv,.tsv,.xlsx,.xls"
        className="hidden"
      />

      {/* Header */}
      <ProductHeader
        title={title}
        searchQuery={searchQuery}
        viewMode={viewMode}
        showViewDropdown={showViewDropdown}
        hasOrderChanges={hasOrderChanges}
        isSavingOrder={isSavingOrder}
        onSearchChange={setSearchQuery}
        onViewModeChange={setViewMode}
        onToggleViewDropdown={() => setShowViewDropdown(v => !v)}
        onAddProduct={onAddProduct}
        onImportClick={() => importInputRef.current?.click()}
        onExportCSV={handleExportCSV}
        onSaveOrder={handleSaveOrder}
        onResetOrder={handleResetOrder}
      />

      {/* Filters */}
      <ProductFilters
        categoryFilter={categoryFilter}
        brandFilter={brandFilter}
        statusFilter={statusFilter}
        tagFilter={tagFilter}
        uniqueCategories={uniqueCategories}
        uniqueBrands={uniqueBrands}
        availableTags={availableTags}
        showCategoryDropdown={showCategoryDropdown}
        showBrandDropdown={showBrandDropdown}
        showStatusDropdown={showStatusDropdown}
        showTagDropdown={showTagDropdown}
        onCategoryChange={(v) => { setCategoryFilter(v); setShowCategoryDropdown(false); }}
        onBrandChange={(v) => { setBrandFilter(v); setShowBrandDropdown(false); }}
        onStatusChange={(v) => { setStatusFilter(v); setShowStatusDropdown(false); }}
        onTagChange={(v) => { setTagFilter(v); setShowTagDropdown(false); }}
        onToggleCategoryDropdown={() => { setShowCategoryDropdown(v => !v); setShowBrandDropdown(false); setShowStatusDropdown(false); setShowTagDropdown(false); }}
        onToggleBrandDropdown={() => { setShowBrandDropdown(v => !v); setShowCategoryDropdown(false); setShowStatusDropdown(false); setShowTagDropdown(false); }}
        onToggleStatusDropdown={() => { setShowStatusDropdown(v => !v); setShowCategoryDropdown(false); setShowBrandDropdown(false); setShowTagDropdown(false); }}
        onToggleTagDropdown={() => { setShowTagDropdown(v => !v); setShowCategoryDropdown(false); setShowBrandDropdown(false); setShowStatusDropdown(false); }}
      />

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          onClear={() => setSelectedIds(new Set())}
          onPublish={handleBulkPublish}
          onDraft={handleBulkDraft}
          onFlashSaleAdd={() => handleBulkFlashSaleAction('add')}
          onFlashSaleRemove={() => handleBulkFlashSaleAction('remove')}
          onOpenDiscount={() => setShowDiscountModal(true)}
          onOpenTagAssign={() => setShowTagModal(true)}
          onOpenStockUpdate={() => setShowStockModal(true)}
          onDelete={handleBulkDelete}
        />
      )}

      {/* Discount Modal */}
      {showDiscountModal && (
        <DiscountModal
          selectedCount={selectedIds.size}
          discountValue={discountValue}
          onDiscountChange={setDiscountValue}
          onApply={handleApplyDiscount}
          onClose={() => { setShowDiscountModal(false); setDiscountValue(0); }}
        />
      )}

      {/* Bulk Tag Assign Modal */}
      {showTagModal && (
        <BulkTagModal
          selectedCount={selectedIds.size}
          availableTags={availableTags}
          onApply={handleBulkTagAssign}
          onClose={() => setShowTagModal(false)}
        />
      )}

      {/* Bulk Stock Update Modal */}
      {showStockModal && (
        <BulkStockModal
          selectedCount={selectedIds.size}
          onApply={handleBulkStockUpdate}
          onClose={() => setShowStockModal(false)}
        />
      )}

      {/* Product Views */}
      {viewMode === 'large' && (
        <ProductGridLarge
          products={paginatedProducts}
          selectedIds={selectedIds}
          openDropdownId={openDropdownId}
          storeBaseUrl={storeBaseUrl}
          courierStatuses={courierStatuses}
          getProductKey={getProductKey}
          onSelectProduct={handleSelectProduct}
          onSetDropdownId={setOpenDropdownId}
          onEditProduct={onEditProduct}
          onCloneProduct={onCloneProduct}
          onDeleteProduct={onDeleteProduct}
        />
      )}

      {viewMode === 'small' && (
        <ProductGridSmall
          products={paginatedProducts}
          selectedIds={selectedIds}
          courierStatuses={courierStatuses}
          getProductKey={getProductKey}
          onSelectProduct={handleSelectProduct}
          onEditProduct={onEditProduct}
        />
      )}

      {viewMode === 'list' && (
        <ProductListView
          products={paginatedProducts}
          selectedIds={selectedIds}
          openDropdownId={openDropdownId}
          currentPage={currentPage}
          productsPerPage={productsPerPage}
          storeBaseUrl={storeBaseUrl}
          courierStatuses={courierStatuses}
          getProductKey={getProductKey}
          onSelectAll={handleSelectAll}
          onSelectProduct={handleSelectProduct}
          onSetDropdownId={setOpenDropdownId}
          onEditProduct={onEditProduct}
          onCloneProduct={onCloneProduct}
          onDeleteProduct={onDeleteProduct}
          onDragEnd={handleDragEnd}
          onContextMenu={(e, p) => {
            setContextMenu({ x: e.clientX, y: e.clientY, product: p });
            setContextSubMenu(null);
            setOpenDropdownId(null);
          }}
        />
      )}

      {/* Pagination */}
      {filteredProducts.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          productsPerPage={productsPerPage}
          showPerPageDropdown={showPerPageDropdown}
          onPageChange={setCurrentPage}
          onPerPageChange={(n) => { setProductsPerPage(n); setShowPerPageDropdown(false); }}
          onTogglePerPageDropdown={() => setShowPerPageDropdown(v => !v)}
        />
      )}

      {/* Context Menu */}
      {contextMenu && contextMenu.product && (
        <ProductContextMenu
          contextMenu={contextMenu}
          contextSubMenu={contextSubMenu}
          tagSearchInContext={tagSearchInContext}
          deliveryChargeInput={deliveryChargeInput}
          couponInput={couponInput}
          tagDurationInput={tagDurationInput}
          availableTags={availableTags}
          categories={categories}
          menuRef={contextMenuRef}
          onSetSubMenu={setContextSubMenu}
          onTagSearchChange={setTagSearchInContext}
          onDeliveryChargeChange={setDeliveryChargeInput}
          onCouponChange={setCouponInput}
          onTagDurationChange={setTagDurationInput}
          onClose={() => { setContextMenu(null); setContextSubMenu(null); }}
          onEditProduct={onEditProduct}
          onCloneProduct={onCloneProduct}
          onDeleteProduct={onDeleteProduct}
          onQuickUpdate={onQuickUpdate}
          storeBaseUrl={storeBaseUrl}
        />
      )}
    </div>
  );
};

export default FigmaProductList;
