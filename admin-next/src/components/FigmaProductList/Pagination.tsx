import React from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  productsPerPage: number;
  showPerPageDropdown: boolean;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  onTogglePerPageDropdown: () => void;
}

const PER_PAGE_OPTIONS = [5, 10, 15, 20, 50];

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  productsPerPage,
  showPerPageDropdown,
  onPageChange,
  onPerPageChange,
  onTogglePerPageDropdown,
}) => {
  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 gap-4">
      {/* Products Per Page – left */}
      <div className="relative order-2 sm:order-1" data-dropdown>
        <button
          onClick={onTogglePerPageDropdown}
          className="bg-[#f9f9f9] dark:bg-gray-700 rounded-lg flex items-center justify-between gap-2 px-3 py-2 w-auto min-w-[80px]"
        >
          <span className="text-[12px] text-black dark:text-white">
            {productsPerPage >= 999 ? 'All' : productsPerPage}
          </span>
          <ChevronDown size={14} className="text-gray-600 dark:text-gray-400" />
        </button>
        {showPerPageDropdown && (
          <div className="absolute bottom-full left-0 mb-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-600 z-50 py-1 w-full">
            {PER_PAGE_OPTIONS.map(num => (
              <button
                key={num}
                onClick={() => onPerPageChange(num)}
                className="w-full px-3 py-2 text-left text-[12px] hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200"
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => onPerPageChange(9999)}
              className="w-full px-3 py-2 text-left text-[12px] hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200"
            >
              All
            </button>
          </div>
        )}
      </div>

      {/* Page Numbers – center */}
      <div className="flex items-center gap-2 order-1 sm:order-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="w-9 h-9 flex items-center justify-center border dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300"
        >
          <ChevronLeft size={16} />
        </button>

        {getPageNumbers().map((page, idx) => (
          <button
            key={idx}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
            className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
              currentPage === page
                ? 'bg-[#38bdf8] text-white'
                : page === '...'
                ? 'cursor-default dark:text-gray-400'
                : 'border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="w-9 h-9 flex items-center justify-center border dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
