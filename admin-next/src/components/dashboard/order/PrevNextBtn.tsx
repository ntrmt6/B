
/**
 * PrevNextBtn component representing a pagination UI.
 */

interface PrevNextBtnProps {
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export function PrevNextBtn({ 
  currentPage = 1, 
  totalPages = 24, 
  onPageChange 
}: PrevNextBtnProps) {
  // SVG for the Chevron Left icon (Previous)
  const ChevronLeft = () => (
    <svg 
      width="12" 
      height="11" 
      viewBox="0 0 12 11" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M7.5 9.5L3.5 5.5L7.5 1.5" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange?.(page);
    }
  };

  // Generate visible page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1, 2, 3, 4, 5, '...', totalPages);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between w-full py-4">
      {/* Previous Button */}
      <button 
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="inline-flex h-10 items-center gap-1 px-3 py-2 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="flex w-5 h-5 items-center justify-center text-gray-700">
          <ChevronLeft />
        </span>
        <span className="font-medium text-gray-700 text-sm">
          Previous
        </span>
      </button>

      {/* Pagination Numbers */}
      <div className="flex items-center gap-2">
        {getPageNumbers().map((num, idx) => (
          <button
            key={idx}
            onClick={() => typeof num === 'number' && handlePageChange(num)}
            disabled={num === '...'}
            className={`flex items-center justify-center w-9 h-9 rounded text-sm font-medium transition-colors ${
              num === currentPage
                ? 'bg-blue-100 text-blue-600 font-bold'
                : num === '...'
                ? 'text-gray-500 cursor-default'
                : 'border border-gray-200 text-gray-700 hover:border-blue-300 cursor-pointer'
            } ${typeof num === 'number' && num !== currentPage ? 'hidden sm:flex' : 'flex'}`}
          >
            {num}
          </button>
        ))}
      </div>

      {/* Next Button */}
      <button 
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="inline-flex h-10 items-center gap-1 px-3 py-2 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="font-medium text-gray-700 text-sm">
          Next
        </span>
        <span className="flex w-5 h-5 items-center justify-center text-gray-700 rotate-180">
          <ChevronLeft />
        </span>
      </button>
    </div>
  );
}

export default PrevNextBtn;