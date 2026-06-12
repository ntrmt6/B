import React from 'react';
import { Search, Edit, Trash2, Image as ImageIcon, MoreVertical } from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Category, SubCategory } from '../../../types';
import { normalizeImageUrl } from '../../../utils/imageUrlHelper';
import { SortableRow } from './SortableRow';
import { DotsIcon } from './CatalogIcons';

interface CatalogTableProps {
  view: string;
  paginatedData: any[];
  categories: Category[];
  subCategories: SubCategory[];
  showImageColumn: boolean;
  selectedIds: string[];
  onSelectAll: () => void;
  onSelectItem: (id: string) => void;
  openActionMenu: string | null;
  setOpenActionMenu: (id: string | null) => void;
  setActionMenuPosition: (pos: { top: number; left: number } | null) => void;
  mobileMenuOpen: string | null;
  setMobileMenuOpen: (id: string | null) => void;
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
  sensors: any;
  onDragEnd: (event: DragEndEvent) => void;
  title: string;
}

export function CatalogTable({
  view, paginatedData, categories, subCategories,
  showImageColumn, selectedIds, onSelectAll, onSelectItem,
  openActionMenu, setOpenActionMenu, setActionMenuPosition,
  mobileMenuOpen, setMobileMenuOpen,
  onEdit, onDelete,
  sensors, onDragEnd,
  title,
}: CatalogTableProps) {
  const noResultsBlock = (colSpan: number) => (
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center mb-3">
        <Search size={24} className="text-gray-400 dark:text-gray-500" />
      </div>
      <p className="font-medium">No {title.toLowerCase()}s found</p>
      <p className="text-sm">Try adjusting your search or add a new {title.toLowerCase()}</p>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 overflow-visible">
      {/* Desktop Table */}
      <div className="hidden sm:block overflow-x-auto overflow-y-visible">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={paginatedData.map((item: any) => item.id)} strategy={verticalListSortingStrategy}>
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-[#E0F2FE] dark:bg-gray-700">
                <tr>
                  <th className="px-2 py-3 w-[40px]" />
                  <th className="px-4 py-3 text-left w-[50px]">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === paginatedData.length && paginatedData.length > 0}
                      onChange={onSelectAll}
                      className="w-5 h-5 rounded border-[1.5px] border-[#050605] dark:border-gray-500 bg-white dark:bg-gray-600"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-black dark:text-white text-[16px]">SL</th>
                  {showImageColumn && (
                    <th className="px-4 py-3 text-left font-medium text-black dark:text-white text-[16px]">Image/icon</th>
                  )}
                  <th className="px-4 py-3 text-left font-medium text-black dark:text-white text-[16px]">Name</th>
                  {view === 'catalog_subcategories' && (
                    <th className="px-4 py-3 text-left font-medium text-black dark:text-white text-[16px]">Parent Category</th>
                  )}
                  {view === 'catalog_childcategories' && (
                    <th className="px-4 py-3 text-left font-medium text-black dark:text-white text-[16px]">Parent Sub Category</th>
                  )}
                  <th className="px-4 py-3 text-center font-medium text-black dark:text-white text-[16px]">Products</th>
                  <th className="px-4 py-3 text-center font-medium text-black dark:text-white text-[16px]">Status</th>
                  <th className="px-4 py-3 text-center font-medium text-black dark:text-white text-[16px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#b9b9b9]/50 dark:divide-gray-600">
                {paginatedData.length > 0 ? (
                  paginatedData.map((item) => (
                    <SortableRow key={item.id} id={item.id}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => onSelectItem(item.id)}
                          className="w-5 h-5 rounded border-[1.5px] border-[#eaf8e7] dark:border-gray-500 bg-white dark:bg-gray-600"
                        />
                      </td>
                      <td className="px-4 py-3 text-[12px] text-[#1d1a1a] dark:text-gray-200 text-center">
                        {item.serial || 0}
                      </td>
                      {showImageColumn && (
                        <td className="px-4 py-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden">
                            {(item.icon || item.logo) ? (
                              <img
                                src={normalizeImageUrl(item.icon || item.logo)}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white">
                                <ImageIcon size={16} />
                              </div>
                            )}
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-3 text-[12px] text-[#1d1a1a] dark:text-gray-200">
                        {item.name}
                      </td>
                      {view === 'catalog_subcategories' && (
                        <td className="px-4 py-3 text-[12px] text-[#1d1a1a] dark:text-gray-200">
                          {categories.find(c => c.id === item.categoryId)?.name || '-'}
                        </td>
                      )}
                      {view === 'catalog_childcategories' && (
                        <td className="px-4 py-3 text-[12px] text-[#1d1a1a] dark:text-gray-200">
                          {subCategories.find(s => s.id === item.subCategoryId)?.name || '-'}
                        </td>
                      )}
                      <td className="px-4 py-3 text-[12px] text-[#1d1a1a] dark:text-gray-200 text-center">
                        {item.productCount || 0}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-[9px] py-0.5 rounded-[30px] text-[12px] font-medium ${
                          item.status === 'Active'
                            ? 'bg-[#c1ffbc] text-[#085e00]'
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {item.status === 'Active' ? 'Publish' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div data-dropdown>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (openActionMenu === item.id) {
                                setOpenActionMenu(null);
                                setActionMenuPosition(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setActionMenuPosition({ top: rect.bottom + 4, left: rect.right - 160 });
                                setOpenActionMenu(item.id);
                              }
                            }}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors inline-flex"
                          >
                            <DotsIcon />
                          </button>
                        </div>
                      </td>
                    </SortableRow>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                      {noResultsBlock(11)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </SortableContext>
        </DndContext>
      </div>

      {/* Mobile Card View */}
      <div className="block sm:hidden space-y-2">
        {paginatedData.length > 0 ? (
          paginatedData.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {showImageColumn && (
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] flex-shrink-0">
                    {(item.icon || item.logo) ? (
                      <img src={normalizeImageUrl(item.icon || item.logo)} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white">
                        <ImageIcon size={16} />
                      </div>
                    )}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {view === 'catalog_subcategories' && categories.find(c => c.id === item.categoryId)?.name}
                    {view === 'catalog_childcategories' && subCategories.find(s => s.id === item.subCategoryId)?.name}
                    {(view === 'catalog_categories' || view === 'catalog_brands' || view === 'catalog_tags') && `${item.productCount || 0} products`}
                  </p>
                  <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    item.status === 'Active' ? 'bg-[#c1ffbc] text-[#085e00]' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {item.status === 'Active' ? 'Publish' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="relative" data-dropdown>
                <button
                  onClick={() => setMobileMenuOpen(mobileMenuOpen === item.id ? null : item.id)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                >
                  <MoreVertical className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
                {mobileMenuOpen === item.id && (
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1 z-50 min-w-[120px]">
                    <button
                      onClick={() => { onEdit(item); setMobileMenuOpen(null); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Edit size={16} className="text-blue-500" /> Edit
                    </button>
                    <button
                      onClick={() => { onDelete(item.id); setMobileMenuOpen(null); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center mx-auto mb-3">
              <Search size={24} className="text-gray-400 dark:text-gray-500" />
            </div>
            <p className="font-medium">No {title.toLowerCase()}s found</p>
            <p className="text-sm">Try adjusting your search or add a new {title.toLowerCase()}</p>
          </div>
        )}
      </div>
    </div>
  );
}
