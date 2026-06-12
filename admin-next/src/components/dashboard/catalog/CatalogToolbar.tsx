import React from 'react';
import { ChevronDown } from 'lucide-react';
import { SearchIcon, AddSquareIcon } from './CatalogIcons';

interface CatalogToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  showStatusDropdown: boolean;
  onStatusDropdownToggle: () => void;
  onStatusFilterChange: (status: string) => void;
  itemsPerPage: number;
  showPerPageDropdown: boolean;
  onPerPageDropdownToggle: () => void;
  onItemsPerPageChange: (count: number) => void;
  title: string;
  hasOrderChanges: boolean;
  isSavingOrder: boolean;
  onSaveOrder: () => void;
  onAdd: () => void;
}

export function CatalogToolbar({
  searchTerm, onSearchChange,
  statusFilter, showStatusDropdown, onStatusDropdownToggle, onStatusFilterChange,
  itemsPerPage, showPerPageDropdown, onPerPageDropdownToggle, onItemsPerPageChange,
  title,
  hasOrderChanges, isSavingOrder, onSaveOrder,
  onAdd,
}: CatalogToolbarProps) {
  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-5">
      <h1 className="text-[22px] font-bold text-[#023337] dark:text-white tracking-[0.11px] font-['Lato']">
        Catalog
      </h1>

      <div className="flex flex-wrap items-center gap-4 lg:gap-6">
        {/* Search Bar */}
        <div className="bg-[#f9f9f9] dark:bg-gray-700 h-[34px] rounded-lg flex items-center px-2 w-[292px]">
          <SearchIcon />
          <input
            type="text"
            placeholder={`Search ${title}`}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-transparent text-[12px] text-[#7b7b7b] dark:text-gray-400 ml-2 flex-1 outline-none placeholder:text-[#7b7b7b] dark:placeholder-gray-400"
          />
          <button className="text-[12px] text-black dark:text-white font-medium px-2">
            Search
          </button>
        </div>

        {/* Status Filter */}
        <div className="relative" data-dropdown>
          <button
            onClick={onStatusDropdownToggle}
            className="bg-[#f9f9f9] dark:bg-gray-700 rounded-lg flex items-center gap-2 px-3 py-2"
          >
            <span className="text-[12px] text-black dark:text-white">
              {statusFilter === 'all' ? 'All Status' : statusFilter}
            </span>
            <ChevronDown size={14} className="text-gray-600 dark:text-gray-400" />
          </button>
          {showStatusDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-600 z-50 py-1 w-[120px]">
              {['all', 'Active', 'Inactive'].map((s) => (
                <button
                  key={s}
                  onClick={() => onStatusFilterChange(s)}
                  className="w-full px-3 py-2 text-left text-[12px] text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {s === 'all' ? 'All Status' : s === 'Active' ? 'Publish' : 'Inactive'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Items Per Page */}
        <div className="relative" data-dropdown>
          <button
            onClick={onPerPageDropdownToggle}
            className="bg-[#f9f9f9] dark:bg-gray-700 rounded-lg flex items-center gap-2 px-3 py-2 w-[119px]"
          >
            <span className="text-[12px] text-black dark:text-white">
              {itemsPerPage >= 999 ? 'All' : `${itemsPerPage} ${title}`}
            </span>
            <ChevronDown size={14} className="text-gray-600 dark:text-gray-400" />
          </button>
          {showPerPageDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-600 z-50 py-1 w-full">
              {[5, 10, 15, 20, 50].map((num) => (
                <button
                  key={num}
                  onClick={() => onItemsPerPageChange(num)}
                  className="w-full px-3 py-2 text-left text-[12px] text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {num} {title}
                </button>
              ))}
              <button
                onClick={() => onItemsPerPageChange(9999)}
                className="w-full px-3 py-2 text-left text-[12px] text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                All
              </button>
            </div>
          )}
        </div>

        {/* Save Order Button */}
        {hasOrderChanges && (
          <button
            onClick={onSaveOrder}
            disabled={isSavingOrder}
            className="bg-gradient-to-r from-[#22c55e] to-[#16a34a] h-[48px] rounded-lg flex items-center gap-2 px-5 text-white font-bold text-[15px] font-['Lato'] shadow-md hover:opacity-90 disabled:opacity-50 transition-all animate-pulse"
          >
            {isSavingOrder ? 'Saving...' : 'Save Order'}
          </button>
        )}

        {/* Add Button */}
        <button
          onClick={onAdd}
          className="bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] h-[48px] rounded-lg flex items-center gap-1 px-4 min-w-[142px]"
        >
          <AddSquareIcon />
          <span className="text-[15px] font-bold text-white tracking-[-0.3px] font-['Lato']">
            Add {title}
          </span>
        </button>
      </div>
    </div>
  );
}
