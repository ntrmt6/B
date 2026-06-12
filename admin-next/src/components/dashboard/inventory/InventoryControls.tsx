import React from 'react';
import { ChevronDown } from 'lucide-react';

const SearchIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#7B7B7B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 21L16.65 16.65" stroke="#7B7B7B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface SortOption {
  value: string;
  label: string;
}

interface InventoryControlsProps {
  searchQuery: string;
  sortBy: string;
  lowStockThreshold: number;
  expireThreshold: number;
  showSortDropdown: boolean;
  sortOptions: SortOption[];
  onSearchChange: (value: string) => void;
  onSortByChange: (value: string) => void;
  onLowStockThresholdChange: (value: number) => void;
  onExpireThresholdChange: (value: number) => void;
  onToggleSortDropdown: () => void;
  onCloseSortDropdown: () => void;
}

const InventoryControls: React.FC<InventoryControlsProps> = ({
  searchQuery,
  sortBy,
  lowStockThreshold,
  expireThreshold,
  showSortDropdown,
  sortOptions,
  onSearchChange,
  onSortByChange,
  onLowStockThresholdChange,
  onExpireThresholdChange,
  onToggleSortDropdown,
  onCloseSortDropdown,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-4 mb-5">
      <div className="bg-[#f9f9f9] h-[34px] rounded-lg flex items-center px-2 flex-1 min-w-[200px] max-w-[300px]">
        <SearchIcon />
        <input
          type="text"
          placeholder="Product Name"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="bg-transparent text-[12px] text-[#7b7b7b] ml-2 flex-1 outline-none placeholder:text-[#7b7b7b]"
        />
        <button className="text-[12px] text-black font-medium px-2">Search</button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[12px] text-[#7b7b7b]">Sort by</span>
        <div className="relative" data-dropdown>
          <button onClick={onToggleSortDropdown} className="bg-[#f9f9f9] rounded-lg flex items-center gap-2 px-3 py-2 w-[159px]">
            <span className="text-[12px] text-black">{sortOptions.find((o) => o.value === sortBy)?.label}</span>
            <ChevronDown size={14} className="text-gray-600" />
          </button>
          {showSortDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border z-50 py-1 w-full">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSortByChange(option.value);
                    onCloseSortDropdown();
                  }}
                  className="w-full px-3 py-2 text-left text-[12px] hover:bg-gray-50"
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[12px] text-black">Set the low stock threshold at</span>
        <input
          type="number"
          value={lowStockThreshold}
          onChange={(e) => onLowStockThresholdChange(parseInt(e.target.value, 10) || 5)}
          className="bg-[#f9f9f9] h-[32px] w-[80px] rounded-lg text-center text-[12px] text-black outline-none border border-transparent focus:border-[#ff6a00] transition-colors"
          min="1"
        />
        <span className="text-[12px] text-black">Unit</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[12px] text-black">Set the Low Expire threshold at</span>
        <input
          type="number"
          value={expireThreshold}
          onChange={(e) => onExpireThresholdChange(parseInt(e.target.value, 10) || 10)}
          className="bg-[#f9f9f9] h-[32px] w-[80px] rounded-lg text-center text-[12px] text-black outline-none border border-transparent focus:border-[#ff6a00] transition-colors"
          min="1"
        />
        <span className="text-[12px] text-black">Days</span>
      </div>
    </div>
  );
};

export default InventoryControls;
