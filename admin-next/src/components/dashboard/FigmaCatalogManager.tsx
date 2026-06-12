'use client';

import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Category, SubCategory, ChildCategory, Brand, Tag } from '../../types';
import { useCatalogManager, CatalogManagerProps } from './catalog/useCatalogManager';
import { CatalogToolbar } from './catalog/CatalogToolbar';
import { CatalogTabs } from './catalog/CatalogTabs';
import { CatalogTable } from './catalog/CatalogTable';
import { CatalogPagination } from './catalog/CatalogPagination';
import { CatalogItemModal } from './catalog/CatalogItemModal';

interface FigmaCatalogManagerProps extends CatalogManagerProps {
  onNavigate?: (view: string) => void;
}

const FigmaCatalogManager: React.FC<FigmaCatalogManagerProps> = ({ onNavigate, ...rest }) => {
  const mgr = useCatalogManager(rest);

  return (
    <div className="bg-white dark:bg-gray-800 min-h-screen font-['Roboto']">
      <div className="bg-white dark:bg-gray-800 mx-4 md:mx-2 lg:mx-6 my-5 py-5">

        <CatalogToolbar
          searchTerm={mgr.searchTerm}
          onSearchChange={mgr.setSearchTerm}
          statusFilter={mgr.statusFilter}
          showStatusDropdown={mgr.showStatusDropdown}
          onStatusDropdownToggle={() => mgr.setShowStatusDropdown(!mgr.showStatusDropdown)}
          onStatusFilterChange={(s) => { mgr.setStatusFilter(s); mgr.setShowStatusDropdown(false); }}
          itemsPerPage={mgr.itemsPerPage}
          showPerPageDropdown={mgr.showPerPageDropdown}
          onPerPageDropdownToggle={() => mgr.setShowPerPageDropdown(!mgr.showPerPageDropdown)}
          onItemsPerPageChange={(n) => { mgr.setItemsPerPage(n); mgr.setShowPerPageDropdown(false); mgr.setCurrentPage(1); }}
          title={mgr.getTitle()}
          hasOrderChanges={mgr.hasOrderChanges}
          isSavingOrder={mgr.isSavingOrder}
          onSaveOrder={mgr.handleSaveOrder}
          onAdd={() => mgr.handleOpenModal()}
        />

        <CatalogTabs
          tabs={mgr.catalogTabs}
          activeView={rest.view}
          onNavigate={(v) => onNavigate?.(v)}
          onPageReset={() => mgr.setCurrentPage(1)}
        />

        <CatalogTable
          view={rest.view}
          paginatedData={mgr.paginatedData}
          categories={rest.categories}
          subCategories={rest.subCategories}
          showImageColumn={mgr.showImageColumn}
          selectedIds={mgr.selectedIds}
          onSelectAll={mgr.handleSelectAll}
          onSelectItem={mgr.handleSelectItem}
          openActionMenu={mgr.openActionMenu}
          setOpenActionMenu={mgr.setOpenActionMenu}
          setActionMenuPosition={mgr.setActionMenuPosition}
          mobileMenuOpen={mgr.mobileMenuOpen}
          setMobileMenuOpen={mgr.setMobileMenuOpen}
          onEdit={mgr.handleOpenModal}
          onDelete={mgr.handleDelete}
          sensors={mgr.sensors}
          onDragEnd={mgr.handleDragEnd}
          title={mgr.getTitle()}
        />

        {mgr.filteredData.length > 0 && (
          <CatalogPagination
            currentPage={mgr.currentPage}
            totalPages={mgr.totalPages}
            onPageChange={mgr.setCurrentPage}
            getPageNumbers={mgr.getPageNumbers}
          />
        )}
      </div>

      {/* Fixed action dropdown portal */}
      {mgr.openActionMenu && mgr.actionMenuPosition && (() => {
        const activeItem = mgr.getCurrentData().find(item => item.id === mgr.openActionMenu);
        if (!activeItem) return null;
        return (
          <div
            data-dropdown
            className="fixed z-[9999] w-[160px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-600 py-2"
            style={{ top: mgr.actionMenuPosition.top, left: mgr.actionMenuPosition.left, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}
          >
            <button
              onClick={() => { mgr.handleOpenModal(activeItem); mgr.setOpenActionMenu(null); mgr.setActionMenuPosition(null); }}
              className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
            >
              <Edit size={16} className="text-blue-500" /> Edit
            </button>
            <button
              onClick={() => { mgr.handleDelete(activeItem.id); mgr.setActionMenuPosition(null); }}
              className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-sm font-medium text-red-600 transition-colors"
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>
        );
      })()}

      <CatalogItemModal
        isOpen={mgr.isModalOpen}
        onClose={() => mgr.setIsModalOpen(false)}
        editItem={mgr.editItem}
        formData={mgr.formData}
        setFormData={mgr.setFormData}
        view={rest.view}
        title={mgr.getTitle()}
        showImageColumn={mgr.showImageColumn}
        categories={rest.categories}
        subCategories={rest.subCategories}
        onSubmit={mgr.handleSave}
        fileInputRef={mgr.fileInputRef}
        tagDesktopBannerRef={mgr.tagDesktopBannerRef}
        tagMobileBannerRef={mgr.tagMobileBannerRef}
        onFileUpload={mgr.handleFileUpload}
        onTagBannerUpload={mgr.handleTagBannerUpload}
        tagGalleryPickerOpen={mgr.tagGalleryPickerOpen}
        setTagGalleryPickerOpen={mgr.setTagGalleryPickerOpen}
        tagGalleryTarget={mgr.tagGalleryTarget}
        setTagGalleryTarget={mgr.setTagGalleryTarget}
        onTagGallerySelect={mgr.handleTagGallerySelect}
      />
    </div>
  );
};

export default FigmaCatalogManager;
