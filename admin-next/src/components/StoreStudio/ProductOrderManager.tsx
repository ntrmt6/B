import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Save, Loader2, CheckCircle2, AlertCircle, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Product } from '../../types';

interface ProductOrderManagerProps {
  tenantId: string;
  products: Product[];
  currentOrder?: number[];
  onSave: (order: number[]) => Promise<void>;
}

interface SortableProductItemProps {
  product: Product;
  index: number;
}

const SortableProductItem: React.FC<SortableProductItemProps> = ({ product, index }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: product.id 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
    >
      <button
        {...attributes}
        {...listeners}
        className="p-1 sm:p-2 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing flex-shrink-0"
      >
        <GripVertical className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>

      <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 
              'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3C/svg%3E';
          }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-1.5 sm:px-2 py-0.5 rounded flex-shrink-0">
            #{index + 1}
          </span>
          <h3 className="text-xs sm:text-sm font-medium text-gray-900 truncate">{product.name}</h3>
        </div>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
          ${product.price.toFixed(2)}<span className="hidden sm:inline"> · ID: {product.id}</span>
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {product.status === 'Active' ? (
          <span className="text-xs px-1.5 sm:px-2 py-1 bg-green-100 text-green-700 rounded whitespace-nowrap">Active</span>
        ) : (
          <span className="text-xs px-1.5 sm:px-2 py-1 bg-gray-100 text-gray-600 rounded whitespace-nowrap">Inactive</span>
        )}
      </div>
    </div>
  );
};

export const ProductOrderManager: React.FC<ProductOrderManagerProps> = ({
  tenantId,
  products,
  currentOrder = [],
  onSave,
}) => {
  const [orderedProducts, setOrderedProducts] = useState<Product[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Initialize ordered products
  useEffect(() => {
    if (products.length === 0) {
      setOrderedProducts([]);
      return;
    }

    // If there's a saved order, use it
    if (currentOrder && currentOrder.length > 0) {
      const ordered = currentOrder
        .map(id => products.find(p => p.id === id))
        .filter((p): p is Product => p !== undefined);
      
      // Add any products not in the saved order at the end
      const unorderedProducts = products.filter(
        p => !currentOrder.includes(p.id)
      );
      
      setOrderedProducts([...ordered, ...unorderedProducts]);
    } else {
      // No saved order, use current product list order
      setOrderedProducts([...products]);
    }
  }, [products, currentOrder]);

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setOrderedProducts((items) => {
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);

      const newOrder = arrayMove(items, oldIndex, newIndex);
      setHasChanges(true);
      return newOrder;
    });
  };

  // Save order
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const order = orderedProducts.map(p => p.id);
      await onSave(order);
      setHasChanges(false);
      toast.success('Product order saved successfully!');
    } catch (error) {
      console.error('Failed to save product order:', error);
      toast.error('Failed to save product order');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to original order
  const handleReset = () => {
    if (currentOrder && currentOrder.length > 0) {
      const ordered = currentOrder
        .map(id => products.find(p => p.id === id))
        .filter((p): p is Product => p !== undefined);
      
      const unorderedProducts = products.filter(
        p => !currentOrder.includes(p.id)
      );
      
      setOrderedProducts([...ordered, ...unorderedProducts]);
    } else {
      setOrderedProducts([...products]);
    }
    setHasChanges(false);
  };

  // Filter products by search query
  const filteredProducts = searchQuery
    ? orderedProducts.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toString().includes(searchQuery)
      )
    : orderedProducts;

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Products</h3>
        <p className="text-gray-600">
          Add products to your store to manage their display order.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900">Manage Product Order</h2>
          <p className="text-sm text-gray-600 mt-1">
            Drag and drop products to change their display order in your store
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {hasChanges && (
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Reset
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Order</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Banner */}
      {hasChanges && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <p className="text-sm text-yellow-900">
            You have unsaved changes. Click "Save Order" to apply the new product order.
          </p>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search products by name or ID..."
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-600 font-medium">Total Products</p>
          <p className="text-2xl font-bold text-blue-900 mt-1">{orderedProducts.length}</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-green-600 font-medium">Active Products</p>
          <p className="text-2xl font-bold text-green-900 mt-1">
            {orderedProducts.filter(p => p.status === 'Active').length}
          </p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <p className="text-sm text-purple-600 font-medium">
            {searchQuery ? 'Filtered' : 'Showing'}
          </p>
          <p className="text-2xl font-bold text-purple-900 mt-1">{filteredProducts.length}</p>
        </div>
      </div>

      {/* Product List */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-8">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No products match your search</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredProducts.map(p => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {filteredProducts.map((product, index) => (
                  <SortableProductItem
                    key={product.id}
                    product={product}
                    index={index}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Help Text */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-700">
          <strong>Tip:</strong> The first product in this list will appear first in your store. 
          Drag the products to rearrange them in the order you want them displayed.
        </p>
      </div>
    </div>
  );
};

export default ProductOrderManager;
