import React from 'react';
import { ChevronDown, Loader2, Save, X } from 'lucide-react';
import { SearchIcon, SortIcon, ExpandIcon, AddSquareIcon } from './icons';

type ViewMode = 'large' | 'small' | 'list';

interface ProductHeaderProps {
  title?: string;
  searchQuery: string;
  viewMode: ViewMode;
  showViewDropdown: boolean;
  hasOrderChanges: boolean;
  isSavingOrder: boolean;
  onSearchChange: (query: string) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onToggleViewDropdown: () => void;
  onAddProduct?: () => void;
  onImportClick: () => void;
  onExportCSV: () => void;
  onSaveOrder: () => void;
  onResetOrder: () => void;
}

const ProductHeader: React.FC<ProductHeaderProps> = ({
  title = 'Products',
  searchQuery,
  viewMode,
  showViewDropdown,
  hasOrderChanges,
  isSavingOrder,
  onSearchChange,
  onViewModeChange,
  onToggleViewDropdown,
  onAddProduct,
  onImportClick,
  onExportCSV,
  onSaveOrder,
  onResetOrder,
}) => (
  <div className="flex flex-col gap-3 xxs:gap-4 mb-4 xxs:mb-5">
    <h1 className="text-base xxs:text-lg sm:text-xl lg:text-[22px] font-bold text-[#023337] dark:text-white tracking-[0.11px] font-['Lato']">
      {title}
    </h1>

    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 w-full">
      {/* Left side: Search + Deep Search */}
      <div className="flex flex-col xxs:flex-row items-stretch xxs:items-center gap-2 xxs:gap-3 sm:gap-4 flex-1">
        {/* Search Bar */}
        <div className="bg-[#f9f9f9] dark:bg-gray-700 h-[32px] xxs:h-[34px] rounded-lg flex items-center px-2 w-full xxs:w-auto xxs:flex-1 sm:w-[200px] md:w-[292px] sm:flex-none">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-transparent text-[11px] xxs:text-[12px] text-[#7b7b7b] dark:text-gray-400 ml-2 flex-1 outline-none min-w-0"
          />
        </div>

        {/* Deep Search */}
        <button className="hidden xs:flex bg-[#f9f9f9] dark:bg-gray-700 h-[34px] rounded-lg items-center gap-2 px-3 sm:px-4">
          <SortIcon />
          <span className="text-[12px] text-black dark:text-white">Deep Search</span>
        </button>
      </div>

      {/* Right side: Import + Export + View + Add Product */}
      <div className="flex flex-col xxs:flex-row items-stretch xxs:items-center gap-2 xxs:gap-3 sm:gap-4">
        {/* Import */}
        <button
          onClick={onImportClick}
          className="flex items-center gap-1 xxs:gap-2 text-[11px] xxs:text-[12px] text-[#161719] dark:text-gray-300 hover:text-[#ff6a00] transition-colors px-2 xxs:px-3 py-1.5 xxs:py-2 bg-[#f9f9f9] dark:bg-gray-700 rounded-lg"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="xxs:w-5 xxs:h-5">
            <path d="M14.1667 17.5C13.6611 17.0085 11.6667 15.7002 11.6667 15C11.6667 14.2997 13.6611 12.9915 14.1667 12.5M12.5001 15H18.3334" stroke="#FF5500" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10.0001 17.5C6.07171 17.5 4.10752 17.5 2.88714 16.2796C1.66675 15.0592 1.66675 13.095 1.66675 9.16667V6.62023C1.66675 5.1065 1.66675 4.34963 1.98368 3.78172C2.2096 3.37689 2.54364 3.04285 2.94846 2.81693C3.51638 2.5 4.27325 2.5 5.78697 2.5C6.75676 2.5 7.24166 2.5 7.66613 2.65917C8.63525 3.0226 9.03491 3.90298 9.47225 4.77761L10.0001 5.83333M6.66675 5.83333H13.9584C15.714 5.83333 16.5917 5.83333 17.2223 6.25466C17.4953 6.43706 17.7297 6.67143 17.9121 6.94441C18.3164 7.54952 18.3327 8.38233 18.3334 10V11.6667" stroke="#FF5500" strokeWidth="1.25" strokeLinecap="round"/>
          </svg>
          <span className="hidden xxs:inline">Import</span>
        </button>

        {/* Export */}
        <button
          onClick={onExportCSV}
          className="flex items-center gap-1 xxs:gap-2 text-[11px] xxs:text-[12px] text-[#161719] dark:text-gray-300 hover:text-[#ff6a00] transition-colors px-2 xxs:px-3 py-1.5 xxs:py-2 bg-[#f9f9f9] dark:bg-gray-700 rounded-lg"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="xxs:w-5 xxs:h-5">
            <path d="M15.8334 17.5C16.3391 17.0085 18.3334 15.7002 18.3334 15C18.3334 14.2997 16.3391 12.9915 15.8334 12.5M17.5001 15H11.6667" stroke="#FF5500" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10.0001 17.5C6.07171 17.5 4.10752 17.5 2.88714 16.2796C1.66675 15.0592 1.66675 13.095 1.66675 9.16667V6.62023C1.66675 5.1065 1.66675 4.34963 1.98368 3.78172C2.2096 3.37689 2.54364 3.04285 2.94846 2.81693C3.51638 2.5 4.27325 2.5 5.78697 2.5C6.75676 2.5 7.24166 2.5 7.66613 2.65917C8.63525 3.0226 9.03491 3.90298 9.47225 4.77761L10.0001 5.83333M6.66675 5.83333H13.9584C15.714 5.83333 16.5917 5.83333 17.2223 6.25466C17.4953 6.43706 17.7297 6.67143 17.9121 6.94441C18.3164 7.54952 18.3327 8.38233 18.3334 10V10.8333" stroke="#FF5500" strokeWidth="1.25" strokeLinecap="round"/>
          </svg>
          <span className="hidden xxs:inline">Export</span>
        </button>

        {/* View Mode */}
        <div className="relative" data-dropdown>
          <button
            onClick={onToggleViewDropdown}
            className="border border-[#ff6a00] h-[36px] xxs:h-[40px] sm:h-[48px] rounded-lg flex items-center justify-between px-2 xxs:px-3 min-w-0 xxs:min-w-[100px] sm:min-w-[140px] w-full xxs:w-auto"
          >
            <div className="flex flex-col gap-0 xxs:gap-0.5 items-start overflow-hidden">
              <span className="text-[10px] xxs:text-[11px] font-medium text-[#070707] dark:text-white tracking-[-0.24px]">View</span>
              <div className="flex items-center gap-1">
                <ExpandIcon />
                <span className="text-[11px] xxs:text-[13px] text-[#070707] dark:text-white tracking-[-0.3px] truncate">
                  {viewMode === 'large' ? 'Large' : viewMode === 'small' ? 'Small' : 'List'}
                </span>
              </div>
            </div>
            <ChevronDown size={14} className="text-gray-600 dark:text-gray-400 flex-shrink-0 ml-1" />
          </button>
          {showViewDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-600 z-50 py-1 w-[140px] xxs:w-[155px]">
              <button
                onClick={() => { onViewModeChange('large'); onToggleViewDropdown(); }}
                className={`w-full px-2 xxs:px-3 py-2 text-left text-[12px] xxs:text-[13px] hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 ${viewMode === 'large' ? 'bg-orange-50 text-[#ff6a00]' : 'dark:text-gray-200'}`}
              >
                <ExpandIcon />
                Large icons
              </button>
              <button
                onClick={() => { onViewModeChange('small'); onToggleViewDropdown(); }}
                className={`w-full px-2 xxs:px-3 py-2 text-left text-[12px] xxs:text-[13px] hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 ${viewMode === 'small' ? 'bg-orange-50 text-[#ff6a00]' : 'dark:text-gray-200'}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
                Small icons
              </button>
              <button
                onClick={() => { onViewModeChange('list'); onToggleViewDropdown(); }}
                className={`w-full px-2 xxs:px-3 py-2 text-left text-[12px] xxs:text-[13px] hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 ${viewMode === 'list' ? 'bg-orange-50 text-[#ff6a00]' : 'dark:text-gray-200'}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
                List view
              </button>
            </div>
          )}
        </div>

        {/* Add Product */}
        <button
          onClick={onAddProduct}
          className="bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] h-[36px] xxs:h-[40px] sm:h-[48px] rounded-lg flex items-center justify-center gap-1 px-3 sm:px-4 w-full xxs:w-auto"
        >
          <AddSquareIcon />
          <span className="text-[13px] xxs:text-[15px] font-bold text-white tracking-[-0.3px] font-['Lato']">Add Product</span>
        </button>
      </div>

      {/* Save/Reset Order Buttons */}
      {hasOrderChanges && (
        <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-gray-200 dark:border-gray-700">
          <button
            onClick={onSaveOrder}
            disabled={isSavingOrder}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSavingOrder ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>Save Order</span>
          </button>
          <button
            onClick={onResetOrder}
            disabled={isSavingOrder}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            <X className="h-4 w-4" />
            <span>Reset</span>
          </button>
          <span className="text-sm text-amber-600 dark:text-amber-400 flex items-center">
            <span className="inline-block w-2 h-2 bg-amber-500 rounded-full mr-2 animate-pulse" />
            Unsaved changes
          </span>
        </div>
      )}
    </div>
  </div>
);

export default ProductHeader;
