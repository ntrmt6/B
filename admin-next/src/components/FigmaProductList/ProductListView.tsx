import React from 'react';
import { Search, GripVertical, Eye, Edit, MoreVertical } from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent, useSensors, useSensor, PointerSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Product, ProductCourierStatus } from './types';
import { normalizeImageUrl, getCourierBadgeClassName } from './utils';
import SortableTableRow from './SortableTableRow';

interface ProductListViewProps {
  products: Product[];
  selectedIds: Set<string>;
  openDropdownId: string | null;
  currentPage: number;
  productsPerPage: number;
  storeBaseUrl: string;
  courierStatuses?: Record<number, ProductCourierStatus>;
  getProductKey: (product: Product, idx: number) => string;
  onSelectAll: () => void;
  onSelectProduct: (key: string) => void;
  onSetDropdownId: (id: string | null) => void;
  onEditProduct?: (product: Product) => void;
  onCloneProduct?: (product: Product) => void;
  onDeleteProduct?: (id: number) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onContextMenu: (e: React.MouseEvent, product: Product) => void;
}

const ProductListView: React.FC<ProductListViewProps> = ({
  products,
  selectedIds,
  openDropdownId,
  currentPage,
  productsPerPage,
  storeBaseUrl,
  courierStatuses = {},
  getProductKey,
  onSelectAll,
  onSelectProduct,
  onSetDropdownId,
  onEditProduct,
  onCloneProduct,
  onDeleteProduct,
  onDragEnd,
  onContextMenu,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={products.map(p => p.id)} strategy={verticalListSortingStrategy}>
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-visible min-h-[200px] -mx-2 xxs:-mx-3 sm:mx-0 px-2 xxs:px-3 sm:px-0">
            <table className="w-full text-xs xxs:text-sm overflow-visible min-w-0">
              <thead className="bg-[#E0F2FE] dark:bg-gray-700">
                <tr>
                  <th className="px-2 xxs:px-3 sm:px-4 py-2 xxs:py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === products.length && products.length > 0}
                      onChange={onSelectAll}
                      className="w-4 h-4 xxs:w-5 xxs:h-5 rounded border-[1.5px] border-[#050605] bg-white dark:bg-gray-600"
                    />
                  </th>
                  <th className="px-2 py-2 xxs:py-3 text-center font-medium text-black dark:text-white text-[12px] xxs:text-[14px] sm:text-[16px] w-10" title="Drag to reorder">
                    <GripVertical className="h-4 w-4 text-gray-400 mx-auto" />
                  </th>
                  <th className="px-2 xxs:px-3 sm:px-4 py-2 xxs:py-3 text-left font-medium text-black dark:text-white text-[12px] xxs:text-[14px] sm:text-[16px]">SL</th>
                  <th className="px-2 xxs:px-3 sm:px-4 py-2 xxs:py-3 text-left font-medium text-black dark:text-white text-[12px] xxs:text-[14px] sm:text-[16px]">Image</th>
                  <th className="px-2 xxs:px-3 sm:px-4 py-2 xxs:py-3 text-left font-medium text-black dark:text-white text-[12px] xxs:text-[14px] sm:text-[16px]">Name</th>
                  <th className="px-2 xxs:px-3 sm:px-4 py-2 xxs:py-3 text-left font-medium text-black dark:text-white text-[12px] xxs:text-[14px] sm:text-[16px]">Category</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left font-medium text-black dark:text-white text-[16px]">Sub Category</th>
                  <th className="hidden lg:table-cell px-4 py-3 text-left font-medium text-black dark:text-white text-[16px]">Priority</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left font-medium text-black dark:text-white text-[16px]">SKU</th>
                  <th className="hidden lg:table-cell px-4 py-3 text-left font-medium text-black dark:text-white text-[16px]">Tags</th>
                  <th className="px-4 py-3 text-left font-medium text-black dark:text-white text-[16px]">Status / Courier</th>
                  <th className="px-4 py-3 text-center font-medium text-black dark:text-white text-[16px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#b9b9b9]/50 dark:divide-gray-700 overflow-visible">
                {products.length > 0 ? products.map((product, index) => {
                  const productKey = getProductKey(product, index);
                  return (
                    <SortableTableRow
                      key={productKey}
                      product={product}
                      courierStatus={courierStatuses[product.id]}
                      productKey={productKey}
                      index={index}
                      currentPage={currentPage}
                      productsPerPage={productsPerPage}
                      selectedIds={selectedIds}
                      handleSelectProduct={onSelectProduct}
                      openDropdownId={openDropdownId}
                      setOpenDropdownId={onSetDropdownId}
                      onEditProduct={onEditProduct}
                      onCloneProduct={onCloneProduct}
                      onDeleteProduct={onDeleteProduct}
                      storeBaseUrl={storeBaseUrl}
                      onContextMenu={onContextMenu}
                    />
                  );
                }) : (
                  <tr>
                    <td colSpan={11} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center mb-3">
                          <Search size={24} className="text-gray-400 dark:text-gray-500" />
                        </div>
                        <p className="font-medium">No products found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="block sm:hidden space-y-2">
            {products.length > 0 ? products.map((product, idx) => {
              const productKey = getProductKey(product, idx);
              return (
                <div key={productKey} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {product.image ? (
                      <img src={normalizeImageUrl(product.image)} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">৳{product.price} | Stock: {product.stock ?? 0}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${product.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {product.status === 'Active' ? 'Active' : 'Inactive'}
                      </span>
                      {courierStatuses[product.id] && (
                        <p className={`mt-1 text-[10px] font-medium truncate ${getCourierBadgeClassName(courierStatuses[product.id].label).split(' border ')[0]}`}>
                          {courierStatuses[product.id].provider}: {courierStatuses[product.id].label}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="relative" data-dropdown>
                    <button
                      onClick={() => onSetDropdownId(openDropdownId === productKey ? null : productKey)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                    {openDropdownId === productKey && (
                      <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[120px]">
                        <button
                          onClick={() => { window.open(`${storeBaseUrl}/product-details/${product.slug || product.id}`, '_blank'); onSetDropdownId(null); }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <Eye size={16} /> View
                        </button>
                        <button
                          onClick={() => { onEditProduct?.(product); onSetDropdownId(null); }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <Edit size={16} /> Edit
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <svg className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-sm">No products found</p>
              </div>
            )}
          </div>
        </>
      </SortableContext>
    </DndContext>
  );
};

export default ProductListView;
