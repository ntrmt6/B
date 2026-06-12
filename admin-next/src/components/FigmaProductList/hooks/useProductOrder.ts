import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Product } from '../types';

interface UseProductOrderOptions {
  propProducts: Product[];
  productDisplayOrder?: number[];
  onProductOrderChange?: (order: number[]) => Promise<void>;
}

interface UseProductOrderReturn {
  orderedProducts: Product[];
  hasOrderChanges: boolean;
  isSavingOrder: boolean;
  handleDragEnd: (event: DragEndEvent) => void;
  handleSaveOrder: () => Promise<void>;
  handleResetOrder: () => void;
}

export function useProductOrder({
  propProducts,
  productDisplayOrder = [],
  onProductOrderChange,
}: UseProductOrderOptions): UseProductOrderReturn {
  const [orderedProducts, setOrderedProducts] = useState<Product[]>([]);
  const [hasOrderChanges, setHasOrderChanges] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const hasManualOrderRef = useRef(false);
  const prevProductIdsRef = useRef<string>('');

  // Initialise ordered products, respecting saved backend order
  useEffect(() => {
    if (propProducts.length === 0) {
      setOrderedProducts([]);
      prevProductIdsRef.current = '';
      hasManualOrderRef.current = false;
      return;
    }

    const currentProductIds = propProducts.map(p => p.id).sort().join(',');
    const productsChanged = prevProductIdsRef.current !== currentProductIds;

    if (!productsChanged && hasManualOrderRef.current) {
      return;
    }

    prevProductIdsRef.current = currentProductIds;

    if (productDisplayOrder.length > 0) {
      const ordered = productDisplayOrder
        .map(id => propProducts.find(p => p.id === id))
        .filter((p): p is Product => p !== undefined);
      const unordered = propProducts.filter(p => !productDisplayOrder.includes(p.id));
      setOrderedProducts([...ordered, ...unordered]);
    } else {
      setOrderedProducts([...propProducts]);
    }

    setHasOrderChanges(false);
    if (productsChanged) {
      hasManualOrderRef.current = false;
    }
  }, [propProducts, productDisplayOrder]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOrderedProducts(items => {
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return items;
      const newOrder = arrayMove(items, oldIndex, newIndex);
      hasManualOrderRef.current = true;
      setHasOrderChanges(true);
      return newOrder;
    });
  }, []);

  const handleSaveOrder = useCallback(async () => {
    if (!onProductOrderChange) {
      toast.error('Order saving not configured');
      return;
    }
    setIsSavingOrder(true);
    try {
      const order = orderedProducts.map(p => p.id);
      await onProductOrderChange(order);
      setHasOrderChanges(false);
      toast.success('Product order saved! Store front will show products in this order.');
    } catch (error) {
      console.error('Failed to save product order:', error);
      toast.error('Failed to save product order');
    } finally {
      setIsSavingOrder(false);
    }
  }, [orderedProducts, onProductOrderChange]);

  const handleResetOrder = useCallback(() => {
    if (productDisplayOrder.length > 0) {
      const ordered = productDisplayOrder
        .map(id => propProducts.find(p => p.id === id))
        .filter((p): p is Product => p !== undefined);
      const unordered = propProducts.filter(p => !productDisplayOrder.includes(p.id));
      setOrderedProducts([...ordered, ...unordered]);
    } else {
      setOrderedProducts([...propProducts]);
    }
    setHasOrderChanges(false);
  }, [propProducts, productDisplayOrder]);

  return {
    orderedProducts,
    hasOrderChanges,
    isSavingOrder,
    handleDragEnd,
    handleSaveOrder,
    handleResetOrder,
  };
}
