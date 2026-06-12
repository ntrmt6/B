import React from 'react';
import { MoreVertical, Edit, Copy, Eye, Trash2, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Product, ProductCourierStatus } from './types';
import { normalizeImageUrl, getCourierBadgeClassName } from './utils';

export interface SortableTableRowProps {
  product: Product;
  courierStatus?: ProductCourierStatus;
  productKey: string;
  index: number;
  currentPage: number;
  productsPerPage: number;
  selectedIds: Set<string>;
  handleSelectProduct: (key: string) => void;
  openDropdownId: string | null;
  setOpenDropdownId: (id: string | null) => void;
  onEditProduct?: (product: Product) => void;
  onCloneProduct?: (product: Product) => void;
  onDeleteProduct?: (id: number) => void;
  storeBaseUrl?: string;
  onContextMenu?: (e: React.MouseEvent, product: Product) => void;
}

const SortableTableRow: React.FC<SortableTableRowProps> = ({
  product,
  courierStatus,
  productKey,
  index,
  currentPage,
  productsPerPage,
  selectedIds,
  handleSelectProduct,
  openDropdownId,
  setOpenDropdownId,
  onEditProduct,
  onCloneProduct,
  onDeleteProduct,
  storeBaseUrl = '',
  onContextMenu: onCtxMenu,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
    position: 'relative' as const,
    backgroundColor: isDragging ? '#f9fafb' : undefined,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`h-[68px] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${isDragging ? 'shadow-lg' : ''}`}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('input[type="checkbox"]') || target.closest('[data-dropdown]') || target.closest('button')) return;
        onEditProduct?.(product);
      }}
      onContextMenu={(e) => { e.preventDefault(); onCtxMenu?.(e, product); }}
    >
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={selectedIds.has(productKey)}
          onChange={() => handleSelectProduct(productKey)}
          className="w-5 h-5 rounded border-[1.5px] border-[#eaf8e7] bg-white dark:bg-gray-600"
        />
      </td>
      <td className="px-2 py-3 text-center">
        <button
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded touch-none"
          title="Drag to reorder products"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </button>
      </td>
      <td className="px-4 py-3 text-[12px] text-[#1d1a1a] dark:text-gray-200 text-center">
        {(currentPage - 1) * productsPerPage + index + 1}
      </td>
      <td className="px-4 py-3">
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-r from-[#38bdf8] to-[#1e90ff]">
          {product.image ? (
            <img
              src={normalizeImageUrl(product.image)}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-xs">
              No img
            </div>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="text-[12px] text-[#1d1a1a] dark:text-gray-200 max-w-[200px] line-clamp-2">
          {product.name}
        </p>
      </td>
      <td className="px-4 py-3 text-[12px] text-[#1d1a1a] dark:text-gray-200">
        {product.category || '-'}
      </td>
      <td className="hidden md:table-cell px-4 py-3 text-[12px] text-[#1d1a1a] dark:text-gray-200">
        {product.subCategory || '-'}
      </td>
      <td className="hidden lg:table-cell px-4 py-3 text-[12px] text-[#1d1a1a] dark:text-gray-200">
        {product.rating ? `${Math.round(product.rating * 10)}%` : '-'}
      </td>
      <td className="hidden md:table-cell px-4 py-3 text-[12px] text-[#1d1a1a] dark:text-gray-200">
        {product.sku || '-'}
      </td>
      <td className="hidden lg:table-cell px-4 py-3 text-[12px] text-[#1d1a1a] dark:text-gray-200">
        {product.tag || (Array.isArray(product.tags) ? product.tags.join(', ') : '') || '-'}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col items-start gap-1">
          <span className={`px-[9px] py-0.5 rounded-[30px] text-[12px] font-medium ${
            product.status === 'Active'
              ? 'bg-[#c1ffbc] text-[#085e00]'
              : 'bg-orange-100 text-orange-700'
          }`}>
            {product.status === 'Active' ? 'Publish' : 'Draft'}
          </span>
          {courierStatus && (
            <span
              title={`${courierStatus.provider} | ${courierStatus.trackingId}`}
              className={`max-w-[180px] px-2 py-0.5 rounded-full text-[10px] font-medium truncate ${getCourierBadgeClassName(courierStatus.label)}`}
            >
              {courierStatus.provider}: {courierStatus.label}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="relative" data-dropdown>
          <button
            onClick={() => setOpenDropdownId(openDropdownId === productKey ? null : productKey)}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          >
            <MoreVertical size={16} className="text-gray-500" />
          </button>
          {openDropdownId === productKey && (
            <div className="absolute right-0 top-full mt-1 z-[9999]">
              <div className="w-[160px] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 overflow-hidden py-2">
                <button
                  onClick={() => { onEditProduct?.(product); setOpenDropdownId(null); }}
                  className="flex items-center gap-3 w-full h-10 px-4 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  <Edit size={16} />
                  Edit
                </button>
                <button
                  onClick={() => { onCloneProduct?.(product); setOpenDropdownId(null); }}
                  className="flex items-center gap-3 w-full h-10 px-4 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  <Copy size={16} />
                  Duplicate
                </button>
                <button
                  onClick={() => { window.open(`${storeBaseUrl}/product-details/${product.slug || product.id}`, '_blank'); setOpenDropdownId(null); }}
                  className="flex items-center gap-3 w-full h-10 px-4 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  <Eye size={16} />
                  View
                </button>
                <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                <button
                  onClick={() => { onDeleteProduct?.(product.id); setOpenDropdownId(null); }}
                  className="flex items-center gap-3 w-full h-10 px-4 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium text-red-600"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
};

export default SortableTableRow;
