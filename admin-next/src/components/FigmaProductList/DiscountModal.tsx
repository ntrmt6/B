import React from 'react';

interface DiscountModalProps {
  selectedCount: number;
  discountValue: number;
  onDiscountChange: (value: number) => void;
  onApply: () => void;
  onClose: () => void;
}

const DiscountModal: React.FC<DiscountModalProps> = ({
  selectedCount,
  discountValue,
  onDiscountChange,
  onApply,
  onClose,
}) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 xxs:p-4">
    <div className="bg-white dark:bg-gray-800 rounded-xl p-3 xxs:p-4 sm:p-6 w-full max-w-[350px] xxs:max-w-[400px] shadow-2xl">
      <h3 className="text-base xxs:text-lg font-semibold mb-3 xxs:mb-4 dark:text-white">Apply Discount</h3>
      <p className="text-xs xxs:text-sm text-gray-600 dark:text-gray-400 mb-3 xxs:mb-4">
        Apply discount to {selectedCount} selected product{selectedCount > 1 ? 's' : ''}
      </p>
      <div className="flex items-center gap-2 mb-3 xxs:mb-4">
        <input
          type="number"
          value={discountValue}
          onChange={(e) => onDiscountChange(Number(e.target.value))}
          placeholder="Enter discount %"
          className="flex-1 h-9 xxs:h-10 border dark:border-gray-600 rounded-lg px-2 xxs:px-3 text-xs xxs:text-sm outline-none focus:border-[#ff6a00] bg-white dark:bg-gray-700 dark:text-white"
          min="0"
          max="100"
        />
        <span className="text-gray-500 dark:text-gray-400">%</span>
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-3 xxs:px-4 py-1.5 xxs:py-2 text-xs xxs:text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          Cancel
        </button>
        <button
          onClick={onApply}
          className="px-3 xxs:px-4 py-1.5 xxs:py-2 text-xs xxs:text-sm bg-[#ff6a00] text-white rounded-lg hover:bg-[#e55d00]"
        >
          Apply
        </button>
      </div>
    </div>
  </div>
);

export default DiscountModal;
