import React, { useEffect, useState } from 'react';
import { Product, ProductVariantStock } from '../../../types';

export interface InventoryUpdatePayload {
  stock: number;
  initialSoldCount: number;
  variantStock: ProductVariantStock[];
  price: number;
  deliveryCharge: number;
  useDefaultDelivery: boolean;
}

interface InventoryStockUpdateModalProps {
  product: Product | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (payload: InventoryUpdatePayload) => void;
}

const InventoryStockUpdateModal: React.FC<InventoryStockUpdateModalProps> = ({ product, isSaving, onClose, onSave }) => {
  const [stock, setStock] = useState(0);
  const [initialSoldCount, setInitialSoldCount] = useState(0);
  const [variantStock, setVariantStock] = useState<ProductVariantStock[]>([]);
  const [price, setPrice] = useState(0);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [useDefaultDelivery, setUseDefaultDelivery] = useState(false);

  useEffect(() => {
    if (!product) return;
    setStock(Number(product.stock) || 0);
    setInitialSoldCount(Number(product.initialSoldCount) || 0);
    setVariantStock(Array.isArray(product.variantStock) ? product.variantStock : []);
    setPrice(Number(product.price) || 0);
    setDeliveryCharge(Number(product.deliveryCharge) || 0);
    setUseDefaultDelivery(!!product.useDefaultDelivery);
  }, [product]);

  if (!product) return null;

  const updateVariantQuantity = (index: number, nextStock: number) => {
    setVariantStock((prev) => prev.map((variant, i) => {
      if (i !== index) return variant;
      return {
        ...variant,
        stock: Math.max(0, nextStock),
      };
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[88vh] overflow-y-auto">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Update Stock</h2>
            <p className="text-xs text-slate-500 mt-1">{product.name}</p>
          </div>
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700">Close</button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-600">Stock Quantity</span>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(Math.max(0, Number(e.target.value) || 0))}
                className="h-10 px-3 rounded-lg border border-slate-200 outline-none focus:border-[#ff6a00]"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-600">Initial Sold</span>
              <input
                type="number"
                min="0"
                value={initialSoldCount}
                onChange={(e) => setInitialSoldCount(Math.max(0, Number(e.target.value) || 0))}
                className="h-10 px-3 rounded-lg border border-slate-200 outline-none focus:border-[#ff6a00]"
              />
            </label>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm font-medium text-slate-900 mb-3">Pricing &amp; Delivery</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-600">Selling Price (৳)</span>
                <input
                  type="number"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))}
                  className="h-10 px-3 rounded-lg border border-slate-200 outline-none focus:border-[#ff6a00]"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-600">Delivery Charge (৳)</span>
                <input
                  type="number"
                  min="0"
                  value={deliveryCharge}
                  disabled={useDefaultDelivery}
                  onChange={(e) => setDeliveryCharge(Math.max(0, Number(e.target.value) || 0))}
                  className="h-10 px-3 rounded-lg border border-slate-200 outline-none focus:border-[#ff6a00] disabled:opacity-50 disabled:bg-slate-50"
                />
              </label>
            </div>

            <label className="flex items-center gap-2 mt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useDefaultDelivery}
                onChange={(e) => setUseDefaultDelivery(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 accent-[#ff6a00]"
              />
              <span className="text-xs text-slate-600">Use store default delivery charge</span>
            </label>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-900 mb-2">Variant Quantity</p>
            {variantStock.length === 0 ? (
              <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
                No variant-level stock found for this product.
              </div>
            ) : (
              <div className="space-y-2">
                {variantStock.map((variant, index) => (
                  <div key={`${variant.color}-${variant.size}-${index}`} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <span className="text-xs text-slate-700">{variant.color || 'N/A'}</span>
                    <span className="text-xs text-slate-700">{variant.size || 'N/A'}</span>
                    <input
                      type="number"
                      min="0"
                      value={Number(variant.stock) || 0}
                      onChange={(e) => updateVariantQuantity(index, Number(e.target.value) || 0)}
                      className="h-9 px-2 rounded-md border border-slate-200 outline-none focus:border-[#ff6a00]"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 h-10 rounded-lg border border-slate-300 text-sm text-slate-700">Cancel</button>
          <button
            onClick={() => onSave({ stock, initialSoldCount, variantStock, price, deliveryCharge, useDefaultDelivery })}
            disabled={isSaving}
            className="px-4 h-10 rounded-lg bg-[#ff6a00] text-white text-sm disabled:opacity-70"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryStockUpdateModal;
