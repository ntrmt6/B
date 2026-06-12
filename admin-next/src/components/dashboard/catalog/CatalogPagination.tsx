import React from 'react';
import { ArrowLeftIcon } from './CatalogIcons';

interface CatalogPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  getPageNumbers: () => (number | string)[];
}

export function CatalogPagination({
  currentPage,
  totalPages,
  onPageChange,
  getPageNumbers,
}: CatalogPaginationProps) {
  return (
    <div className="flex items-center justify-center gap-[279px] mt-6">
      {/* Previous */}
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="bg-white dark:bg-gray-800 h-[42px] rounded-lg flex items-center gap-1 px-3 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.2)] dark:shadow-[0px_1px_3px_0px_rgba(0,0,0,0.5)] disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        <ArrowLeftIcon />
        <span className="text-[15px] font-medium text-black dark:text-white font-['Lato']">Previous</span>
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-3">
        {getPageNumbers().map((page, idx) => (
          <button
            key={idx}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
            className={`w-[36px] h-[36px] flex items-center justify-center rounded text-[15px] font-medium transition-colors ${
              currentPage === page
                ? 'bg-[#dff5ff] dark:bg-gray-600 text-[#1e90ff] font-bold'
                : page === '...'
                ? 'cursor-default text-[#023337] dark:text-white font-bold'
                : 'border border-[#d1d5db] dark:border-gray-600 text-[#023337] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {page === '...' ? '.....' : page}
          </button>
        ))}
      </div>

      {/* Next */}
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages || totalPages === 0}
        className="bg-white dark:bg-gray-800 h-[42px] rounded-lg flex items-center gap-1 px-3 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.2)] dark:shadow-[0px_1px_3px_0px_rgba(0,0,0,0.5)] disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        <span className="text-[15px] font-medium text-black dark:text-white font-['Lato']">Next</span>
        <div className="rotate-180">
          <ArrowLeftIcon />
        </div>
      </button>
    </div>
  );
}
