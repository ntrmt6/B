import React from 'react';
import { ChevronDown } from 'lucide-react';
import { SortIcon } from './icons';

interface TagItem {
  id: string;
  name: string;
  status: 'Active' | 'Inactive';
}

interface ProductFiltersProps {
  categoryFilter: string;
  brandFilter: string;
  statusFilter: string;
  tagFilter: string;
  uniqueCategories: (string | undefined)[];
  uniqueBrands: (string | undefined)[];
  availableTags: TagItem[];
  showCategoryDropdown: boolean;
  showBrandDropdown: boolean;
  showStatusDropdown: boolean;
  showTagDropdown: boolean;
  onCategoryChange: (value: string) => void;
  onBrandChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onTagChange: (value: string) => void;
  onToggleCategoryDropdown: () => void;
  onToggleBrandDropdown: () => void;
  onToggleStatusDropdown: () => void;
  onToggleTagDropdown: () => void;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
  categoryFilter,
  brandFilter,
  statusFilter,
  tagFilter,
  uniqueCategories,
  uniqueBrands,
  availableTags,
  showCategoryDropdown,
  showBrandDropdown,
  showStatusDropdown,
  showTagDropdown,
  onCategoryChange,
  onBrandChange,
  onStatusChange,
  onTagChange,
  onToggleCategoryDropdown,
  onToggleBrandDropdown,
  onToggleStatusDropdown,
  onToggleTagDropdown,
}) => (
  <div className="flex flex-col sm:flex-row items-stretch sm:items-start justify-end gap-3 xxs:gap-4 mb-4 xxs:mb-5">
    <div className="flex flex-col gap-2 xxs:gap-3">
      <div className="flex flex-wrap items-center gap-2 xxs:gap-3 sm:gap-4 justify-end">
        {/* Filter Label */}
        <div className="flex items-center gap-1 xxs:gap-2">
          <SortIcon />
          <span className="text-[11px] xxs:text-[12px] text-black dark:text-white">Filter:</span>
        </div>

        {/* Category Filter */}
        <div className="relative" data-dropdown>
          <button
            onClick={onToggleCategoryDropdown}
            className="bg-[#f9f9f9] dark:bg-gray-700 rounded-lg flex items-center justify-between gap-1 xxs:gap-2 px-2 xxs:px-3 py-1.5 xxs:py-2 min-w-0 max-w-[120px] xxs:max-w-[140px]"
          >
            <span className="text-[11px] xxs:text-[12px] text-black dark:text-white truncate">
              {categoryFilter === 'all' ? 'All Category' : categoryFilter}
            </span>
            <ChevronDown size={12} className="text-gray-600 dark:text-gray-400 flex-shrink-0 xxs:w-[14px] xxs:h-[14px]" />
          </button>
          {showCategoryDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-600 z-50 py-1 w-[130px] xxs:w-[150px] max-h-[200px] overflow-y-auto">
              <button
                onClick={() => onCategoryChange('all')}
                className="w-full px-2 xxs:px-3 py-1.5 xxs:py-2 text-left text-[11px] xxs:text-[12px] hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200"
              >
                All Category
              </button>
              {uniqueCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => onCategoryChange(cat!)}
                  className="w-full px-2 xxs:px-3 py-1.5 xxs:py-2 text-left text-[11px] xxs:text-[12px] hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200 truncate"
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Brand Filter */}
        <div className="relative" data-dropdown>
          <button
            onClick={onToggleBrandDropdown}
            className="bg-[#f9f9f9] dark:bg-gray-700 rounded-lg flex items-center justify-between gap-1 xxs:gap-2 px-2 xxs:px-3 py-1.5 xxs:py-2 min-w-0 max-w-[110px] xxs:max-w-[130px]"
          >
            <span className="text-[11px] xxs:text-[12px] text-black dark:text-white truncate">
              {brandFilter === 'all' ? 'All Brands' : brandFilter}
            </span>
            <ChevronDown size={12} className="text-gray-600 dark:text-gray-400 flex-shrink-0 xxs:w-[14px] xxs:h-[14px]" />
          </button>
          {showBrandDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-600 z-50 py-1 w-[130px] xxs:w-[150px] max-h-[200px] overflow-y-auto">
              <button
                onClick={() => onBrandChange('all')}
                className="w-full px-2 xxs:px-3 py-1.5 xxs:py-2 text-left text-[11px] xxs:text-[12px] hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200"
              >
                All Brands
              </button>
              {uniqueBrands.map(brand => (
                <button
                  key={brand}
                  onClick={() => onBrandChange(brand!)}
                  className="w-full px-2 xxs:px-3 py-1.5 xxs:py-2 text-left text-[11px] xxs:text-[12px] hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200 truncate"
                >
                  {brand}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status Filter */}
        <div className="relative" data-dropdown>
          <button
            onClick={onToggleStatusDropdown}
            className="bg-[#f9f9f9] dark:bg-gray-700 rounded-lg flex items-center justify-between gap-1 xxs:gap-2 px-2 xxs:px-3 py-1.5 xxs:py-2 min-w-0"
          >
            <span className="text-[11px] xxs:text-[12px] text-black dark:text-white">
              {statusFilter === 'all' ? 'All Status' : statusFilter}
            </span>
            <ChevronDown size={12} className="text-gray-600 dark:text-gray-400 xxs:w-[14px] xxs:h-[14px]" />
          </button>
          {showStatusDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-600 z-50 py-1 w-[100px] xxs:w-[120px]">
              <button
                onClick={() => onStatusChange('all')}
                className="w-full px-2 xxs:px-3 py-1.5 xxs:py-2 text-left text-[11px] xxs:text-[12px] hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200"
              >
                All Status
              </button>
              <button
                onClick={() => onStatusChange('Active')}
                className="w-full px-2 xxs:px-3 py-1.5 xxs:py-2 text-left text-[11px] xxs:text-[12px] hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200"
              >
                Publish
              </button>
              <button
                onClick={() => onStatusChange('Draft')}
                className="w-full px-2 xxs:px-3 py-1.5 xxs:py-2 text-left text-[11px] xxs:text-[12px] hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200"
              >
                Draft
              </button>
            </div>
          )}
        </div>

        {/* Tag Filter */}
        {availableTags.length > 0 && (
          <div className="relative" data-dropdown>
            <button
              onClick={onToggleTagDropdown}
              className="bg-[#f9f9f9] dark:bg-gray-700 rounded-lg flex items-center justify-between gap-1 xxs:gap-2 px-2 xxs:px-3 py-1.5 xxs:py-2 min-w-0 max-w-[120px] xxs:max-w-[140px]"
            >
              <span className="text-[11px] xxs:text-[12px] text-black dark:text-white truncate">
                {tagFilter === 'all' ? 'All Tags' : tagFilter}
              </span>
              <ChevronDown size={12} className="text-gray-600 dark:text-gray-400 flex-shrink-0 xxs:w-[14px] xxs:h-[14px]" />
            </button>
            {showTagDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-600 z-50 py-1 w-[130px] xxs:w-[150px] max-h-[200px] overflow-y-auto">
                <button
                  onClick={() => onTagChange('all')}
                  className="w-full px-2 xxs:px-3 py-1.5 xxs:py-2 text-left text-[11px] xxs:text-[12px] hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200"
                >
                  All Tags
                </button>
                {availableTags
                  .filter(t => t.status === 'Active')
                  .map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => onTagChange(tag.name)}
                      className="w-full px-2 xxs:px-3 py-1.5 xxs:py-2 text-left text-[11px] xxs:text-[12px] hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200 truncate"
                    >
                      {tag.name}
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
);

export default ProductFilters;
