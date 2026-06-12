import React from 'react';
import { Pencil, Eye, ToggleRight, ToggleLeft, Tag, Gift, Truck, FolderOpen, Clock, Copy, Trash2, ChevronRight, Check } from 'lucide-react';
import { Product, Category, TagType } from './types';

interface ProductContextMenuProps {
  contextMenu: { x: number; y: number; product: Product };
  contextSubMenu: string | null;
  tagSearchInContext: string;
  deliveryChargeInput: string;
  couponInput: string;
  tagDurationInput: string;
  availableTags: TagType[];
  categories: Category[];
  menuRef: React.RefObject<HTMLDivElement>;
  onSetSubMenu: (sub: string | null) => void;
  onTagSearchChange: (value: string) => void;
  onDeliveryChargeChange: (value: string) => void;
  onCouponChange: (value: string) => void;
  onTagDurationChange: (value: string) => void;
  onClose: () => void;
  onEditProduct?: (product: Product) => void;
  onCloneProduct?: (product: Product) => void;
  onDeleteProduct?: (id: number) => void;
  onQuickUpdate?: (productId: number, updates: Partial<Product>) => void;
  storeBaseUrl: string;
}

const ProductContextMenu: React.FC<ProductContextMenuProps> = ({
  contextMenu,
  contextSubMenu,
  tagSearchInContext,
  deliveryChargeInput,
  couponInput,
  tagDurationInput,
  availableTags,
  categories,
  menuRef,
  onSetSubMenu,
  onTagSearchChange,
  onDeliveryChargeChange,
  onCouponChange,
  onTagDurationChange,
  onClose,
  onEditProduct,
  onCloneProduct,
  onDeleteProduct,
  onQuickUpdate,
  storeBaseUrl,
}) => {
  const { product } = contextMenu;

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-600 py-1 min-w-[220px] text-sm"
      style={{
        left: Math.min(contextMenu.x, window.innerWidth - 240),
        top: Math.min(contextMenu.y, window.innerHeight - 400),
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Edit */}
      <button
        className="flex items-center gap-3 w-full px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
        onClick={() => { onEditProduct?.(product); onClose(); }}
      >
        <Pencil size={15} className="text-blue-500" />
        <span>Edit Product</span>
      </button>

      {/* View in Store */}
      <button
        className="flex items-center gap-3 w-full px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
        onClick={() => {
          window.open(`${storeBaseUrl}/product-details/${product.slug || product.id}`, '_blank');
          onClose();
        }}
      >
        <Eye size={15} className="text-green-500" />
        <span>View in Store</span>
      </button>

      <div className="border-t border-gray-100 dark:border-gray-700 my-1" />

      {/* Publish */}
      <button
        className="flex items-center gap-3 w-full px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-gray-700 transition-colors"
        onClick={() => { onQuickUpdate?.(product.id, { status: 'Active' }); onClose(); }}
      >
        <ToggleRight size={15} className="text-green-500" />
        <span>Publish</span>
        {product.status === 'Active' && <span className="ml-auto text-xs text-green-500 font-medium">● Active</span>}
      </button>

      {/* Draft */}
      <button
        className="flex items-center gap-3 w-full px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-yellow-50 dark:hover:bg-gray-700 transition-colors"
        onClick={() => { onQuickUpdate?.(product.id, { status: 'Draft' }); onClose(); }}
      >
        <ToggleLeft size={15} className="text-yellow-600" />
        <span>Draft</span>
        {product.status === 'Draft' && <span className="ml-auto text-xs text-yellow-500 font-medium">● Draft</span>}
      </button>

      <div className="border-t border-gray-100 dark:border-gray-700 my-1" />

      {/* Change Tags */}
      <div className="relative">
        <button
          className={`flex items-center gap-3 w-full px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-gray-700 transition-colors ${contextSubMenu === 'tags' ? 'bg-purple-50 dark:bg-gray-700' : ''}`}
          onClick={() => onSetSubMenu(contextSubMenu === 'tags' ? null : 'tags')}
        >
          <Tag size={15} className="text-purple-500" />
          <span>Change Tags</span>
          <ChevronRight size={14} className={`ml-auto transition-transform ${contextSubMenu === 'tags' ? 'rotate-90' : ''}`} />
        </button>
        {contextSubMenu === 'tags' && (
          <div className="px-3 pb-2 border-b border-gray-100 dark:border-gray-700">
            <input
              type="text"
              placeholder="Search tags..."
              value={tagSearchInContext}
              onChange={(e) => onTagSearchChange(e.target.value)}
              className="w-full px-2 py-1.5 text-xs border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 mb-2"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="max-h-[150px] overflow-y-auto space-y-1">
              {availableTags
                .filter(t => t.name.toLowerCase().includes(tagSearchInContext.toLowerCase()))
                .map(tag => {
                  const isSelected = product.tags?.includes(tag.name) || product.tag === tag.name;
                  return (
                    <label
                      key={tag.name}
                      className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          const currentTags = product.tags || [];
                          const newTags = isSelected
                            ? currentTags.filter((t: string) => t !== tag.name)
                            : [...currentTags, tag.name];
                          onQuickUpdate?.(product.id, { tags: newTags, tag: newTags[0] || '' });
                        }}
                        className="rounded text-purple-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="dark:text-gray-200">{tag.name}</span>
                    </label>
                  );
                })}
              {availableTags.filter(t => t.name.toLowerCase().includes(tagSearchInContext.toLowerCase())).length === 0 && (
                <p className="text-xs text-gray-400 px-2 py-1">No tags found</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Give Coupons / Discount */}
      <div className="relative">
        <button
          className={`flex items-center gap-3 w-full px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors ${contextSubMenu === 'coupon' ? 'bg-orange-50 dark:bg-gray-700' : ''}`}
          onClick={() => onSetSubMenu(contextSubMenu === 'coupon' ? null : 'coupon')}
        >
          <Gift size={15} className="text-orange-500" />
          <span>Give Coupons / Discount</span>
          <ChevronRight size={14} className={`ml-auto transition-transform ${contextSubMenu === 'coupon' ? 'rotate-90' : ''}`} />
        </button>
        {contextSubMenu === 'coupon' && (
          <div className="px-3 pb-2 border-b border-gray-100 dark:border-gray-700">
            <div className="flex gap-2 mt-1">
              <input
                type="number"
                placeholder="Discount %"
                value={couponInput}
                onChange={(e) => onCouponChange(e.target.value)}
                className="flex-1 px-2 py-1.5 text-xs border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                onClick={(e) => e.stopPropagation()}
                min="0"
                max="100"
              />
              <button
                className="px-3 py-1.5 bg-orange-500 text-white rounded text-xs hover:bg-orange-600 disabled:opacity-50"
                disabled={!couponInput}
                onClick={() => {
                  onQuickUpdate?.(product.id, { discount: couponInput });
                  onCouponChange('');
                  onClose();
                }}
              >
                Apply
              </button>
            </div>
            {product.discount && (
              <p className="text-xs text-gray-400 mt-1">Current: {product.discount}%</p>
            )}
          </div>
        )}
      </div>

      {/* Delivery Charge Set */}
      <div className="relative">
        <button
          className={`flex items-center gap-3 w-full px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-teal-50 dark:hover:bg-gray-700 transition-colors ${contextSubMenu === 'delivery' ? 'bg-teal-50 dark:bg-gray-700' : ''}`}
          onClick={() => onSetSubMenu(contextSubMenu === 'delivery' ? null : 'delivery')}
        >
          <Truck size={15} className="text-teal-500" />
          <span>Delivery Charge Set</span>
          <ChevronRight size={14} className={`ml-auto transition-transform ${contextSubMenu === 'delivery' ? 'rotate-90' : ''}`} />
        </button>
        {contextSubMenu === 'delivery' && (
          <div className="px-3 pb-2 border-b border-gray-100 dark:border-gray-700">
            <div className="flex gap-2 mt-1">
              <input
                type="number"
                placeholder="Delivery charge (৳)"
                value={deliveryChargeInput}
                onChange={(e) => onDeliveryChargeChange(e.target.value)}
                className="flex-1 px-2 py-1.5 text-xs border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                onClick={(e) => e.stopPropagation()}
                min="0"
              />
              <button
                className="px-3 py-1.5 bg-teal-500 text-white rounded text-xs hover:bg-teal-600 disabled:opacity-50"
                disabled={!deliveryChargeInput}
                onClick={() => {
                  onQuickUpdate?.(product.id, { deliveryCharge: Number(deliveryChargeInput) } as any);
                  onDeliveryChargeChange('');
                  onClose();
                }}
              >
                Set
              </button>
            </div>
            {(product as any).deliveryCharge && (
              <p className="text-xs text-gray-400 mt-1">Current: ৳{(product as any).deliveryCharge}</p>
            )}
          </div>
        )}
      </div>

      {/* Set Catalog (Category) */}
      <div className="relative">
        <button
          className={`flex items-center gap-3 w-full px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors ${contextSubMenu === 'catalog' ? 'bg-indigo-50 dark:bg-gray-700' : ''}`}
          onClick={() => onSetSubMenu(contextSubMenu === 'catalog' ? null : 'catalog')}
        >
          <FolderOpen size={15} className="text-indigo-500" />
          <span>Set Catalog</span>
          <ChevronRight size={14} className={`ml-auto transition-transform ${contextSubMenu === 'catalog' ? 'rotate-90' : ''}`} />
        </button>
        {contextSubMenu === 'catalog' && (
          <div className="px-3 pb-2 border-b border-gray-100 dark:border-gray-700">
            <div className="max-h-[150px] overflow-y-auto space-y-1 mt-1">
              {categories.map(cat => {
                const catName = typeof cat === 'string' ? cat : cat.name;
                const isSelected = product.category === catName;
                return (
                  <button
                    key={catName}
                    className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs transition-colors ${isSelected ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'}`}
                    onClick={() => {
                      onQuickUpdate?.(product.id, { category: catName });
                      onClose();
                    }}
                  >
                    {isSelected && <Check size={12} />}
                    <span>{catName}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Set Tag Duration */}
      <div className="relative">
        <button
          className={`flex items-center gap-3 w-full px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-pink-50 dark:hover:bg-gray-700 transition-colors ${contextSubMenu === 'duration' ? 'bg-pink-50 dark:bg-gray-700' : ''}`}
          onClick={() => onSetSubMenu(contextSubMenu === 'duration' ? null : 'duration')}
        >
          <Clock size={15} className="text-pink-500" />
          <span>Set Tag Duration</span>
          <ChevronRight size={14} className={`ml-auto transition-transform ${contextSubMenu === 'duration' ? 'rotate-90' : ''}`} />
        </button>
        {contextSubMenu === 'duration' && (
          <div className="px-3 pb-2 border-b border-gray-100 dark:border-gray-700">
            <div className="flex gap-2 mt-1">
              <input
                type="number"
                placeholder="Duration (days)"
                value={tagDurationInput}
                onChange={(e) => onTagDurationChange(e.target.value)}
                className="flex-1 px-2 py-1.5 text-xs border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                onClick={(e) => e.stopPropagation()}
                min="1"
              />
              <button
                className="px-3 py-1.5 bg-pink-500 text-white rounded text-xs hover:bg-pink-600 disabled:opacity-50"
                disabled={!tagDurationInput}
                onClick={() => {
                  onQuickUpdate?.(product.id, { tagDuration: Number(tagDurationInput) } as any);
                  onTagDurationChange('');
                  onClose();
                }}
              >
                Set
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 dark:border-gray-700 my-1" />

      {/* Duplicate */}
      <button
        className="flex items-center gap-3 w-full px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
        onClick={() => { onCloneProduct?.(product); onClose(); }}
      >
        <Copy size={15} className="text-blue-400" />
        <span>Duplicate</span>
      </button>

      {/* Delete */}
      <button
        className="flex items-center gap-3 w-full px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700 transition-colors"
        onClick={() => { onDeleteProduct?.(product.id); onClose(); }}
      >
        <Trash2 size={15} />
        <span>Delete</span>
      </button>
    </div>
  );
};

export default ProductContextMenu;
