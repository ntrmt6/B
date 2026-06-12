import React, { useState } from 'react';
import { Package, X } from 'lucide-react';

interface BulkStockModalProps {
  selectedCount: number;
  onApply: (quantity: number, mode: 'set' | 'add') => void;
  onClose: () => void;
}

const BulkStockModal: React.FC<BulkStockModalProps> = ({
  selectedCount,
  onApply,
  onClose,
}) => {
  const [quantity, setQuantity] = useState<number>(0);
  const [mode, setMode] = useState<'add' | 'set'>('add');

  const handleApply = () => {
    if (mode === 'add' && quantity <= 0) return;
    if (mode === 'set' && quantity < 0) return;
    onApply(quantity, mode);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 xxs:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 xxs:p-4 sm:p-6 w-full max-w-[350px] xxs:max-w-[400px] shadow-2xl">
        <div className="flex items-center justify-between mb-3 xxs:mb-4">
          <h3 className="text-base xxs:text-lg font-semibold dark:text-white flex items-center gap-2">
            <Package size={18} />
            Update Stock
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs xxs:text-sm text-gray-600 dark:text-gray-400 mb-3 xxs:mb-4">
          Update stock for {selectedCount} selected product{selectedCount > 1 ? 's' : ''}
        </p>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-3 xxs:mb-4">
          <button
            onClick={() => setMode('add')}
            className={`flex-1 py-2 rounded-lg text-xs xxs:text-sm font-medium transition-colors ${
              mode === 'add'
                ? 'bg-[#ff6a00] text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Add to Stock
          </button>
          <button
            onClick={() => setMode('set')}
            className={`flex-1 py-2 rounded-lg text-xs xxs:text-sm font-medium transition-colors ${
              mode === 'set'
                ? 'bg-[#ff6a00] text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Set Stock
          </button>
        </div>

        {/* Quantity input */}
        <div className="mb-3 xxs:mb-4">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            {mode === 'add' ? 'Quantity to add' : 'Set stock to'}
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            placeholder={mode === 'add' ? 'Enter quantity to add' : 'Enter new stock quantity'}
            className="w-full h-9 xxs:h-10 border dark:border-gray-600 rounded-lg px-2 xxs:px-3 text-xs xxs:text-sm outline-none focus:border-[#ff6a00] bg-white dark:bg-gray-700 dark:text-white"
            min={mode === 'set' ? 0 : 1}
          />
        </div>

        <p className="text-[10px] xxs:text-xs text-gray-400 dark:text-gray-500 mb-4">
          {mode === 'add'
            ? `This will add ${quantity || 0} to the current stock of each selected product.`
            : `This will set the stock of all ${selectedCount} selected products to ${quantity || 0}.`}
        </p>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 xxs:px-4 py-1.5 xxs:py-2 text-xs xxs:text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={mode === 'add' ? quantity <= 0 : quantity < 0}
            className="px-3 xxs:px-4 py-1.5 xxs:py-2 text-xs xxs:text-sm bg-[#ff6a00] text-white rounded-lg hover:bg-[#e55d00] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mode === 'add' ? 'Add Stock' : 'Set Stock'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkStockModal;
