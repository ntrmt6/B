import React from 'react';
import { Eye, Edit, Trash2, Tag, Package } from 'lucide-react';

interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  onPublish: () => void;
  onDraft: () => void;
  onFlashSaleAdd: () => void;
  onFlashSaleRemove: () => void;
  onOpenDiscount: () => void;
  onOpenTagAssign: () => void;
  onOpenStockUpdate: () => void;
  onDelete: () => void;
}

const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  onClear,
  onPublish,
  onDraft,
  onFlashSaleAdd,
  onFlashSaleRemove,
  onOpenDiscount,
  onOpenTagAssign,
  onOpenStockUpdate,
  onDelete,
}) => (
  <div className="bg-gradient-to-r from-[#ff6a00] to-[#ff9500] rounded-xl p-2 xxs:p-3 sm:p-4 mb-4 xxs:mb-5 flex flex-col xxs:flex-row flex-wrap items-start xxs:items-center justify-between gap-2 xxs:gap-4">
    <div className="flex items-center gap-2 xxs:gap-3">
      <span className="text-white font-semibold text-xs xxs:text-sm">
        {selectedCount} selected
      </span>
      <button
        onClick={onClear}
        className="text-white/80 hover:text-white text-xs xxs:text-sm underline"
      >
        Clear
      </button>
    </div>
    <div className="flex flex-wrap items-center gap-1 xxs:gap-2">
      <button
        onClick={onPublish}
        className="bg-white text-green-600 px-2 xxs:px-3 sm:px-4 py-1.5 xxs:py-2 rounded-lg text-xs xxs:text-sm font-medium hover:bg-green-50 transition-colors flex items-center gap-1 xxs:gap-2"
      >
        <Eye size={14} className="xxs:w-4 xxs:h-4" />
        <span className="hidden xxs:inline">Publish</span>
      </button>
      <button
        onClick={onDraft}
        className="bg-white text-gray-600 px-2 xxs:px-3 sm:px-4 py-1.5 xxs:py-2 rounded-lg text-xs xxs:text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1 xxs:gap-2"
      >
        <Edit size={14} className="xxs:w-4 xxs:h-4" />
        <span className="hidden xxs:inline">Draft</span>
      </button>
      <button
        onClick={onFlashSaleAdd}
        className="bg-white text-orange-600 px-2 xxs:px-3 sm:px-4 py-1.5 xxs:py-2 rounded-lg text-xs xxs:text-sm font-medium hover:bg-orange-50 transition-colors flex items-center gap-1 xxs:gap-2"
      >
        ⚡ <span className="hidden xs:inline">Flash Sale</span>
      </button>
      <button
        onClick={onFlashSaleRemove}
        className="hidden sm:flex bg-white text-yellow-600 px-2 xxs:px-3 sm:px-4 py-1.5 xxs:py-2 rounded-lg text-xs xxs:text-sm font-medium hover:bg-yellow-50 transition-colors items-center gap-1 xxs:gap-2"
      >
        ⚡ Remove
      </button>
      <button
        onClick={onOpenDiscount}
        className="bg-white text-purple-600 px-2 xxs:px-3 sm:px-4 py-1.5 xxs:py-2 rounded-lg text-xs xxs:text-sm font-medium hover:bg-purple-50 transition-colors flex items-center gap-1 xxs:gap-2"
      >
        %
      </button>
      <button
        onClick={onOpenTagAssign}
        className="bg-white text-blue-600 px-2 xxs:px-3 sm:px-4 py-1.5 xxs:py-2 rounded-lg text-xs xxs:text-sm font-medium hover:bg-blue-50 transition-colors flex items-center gap-1 xxs:gap-2"
      >
        <Tag size={14} className="xxs:w-4 xxs:h-4" />
        <span className="hidden xs:inline">Tag</span>
      </button>
      <button
        onClick={onOpenStockUpdate}
        className="bg-white text-teal-600 px-2 xxs:px-3 sm:px-4 py-1.5 xxs:py-2 rounded-lg text-xs xxs:text-sm font-medium hover:bg-teal-50 transition-colors flex items-center gap-1 xxs:gap-2"
      >
        <Package size={14} className="xxs:w-4 xxs:h-4" />
        <span className="hidden xs:inline">Stock</span>
      </button>
      <button
        onClick={onDelete}
        className="bg-white text-red-600 px-2 xxs:px-3 sm:px-4 py-1.5 xxs:py-2 rounded-lg text-xs xxs:text-sm font-medium hover:bg-red-50 transition-colors flex items-center gap-1 xxs:gap-2"
      >
        <Trash2 size={14} className="xxs:w-4 xxs:h-4" />
      </button>
    </div>
  </div>
);

export default BulkActionBar;
