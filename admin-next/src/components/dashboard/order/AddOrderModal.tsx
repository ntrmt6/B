import React from 'react';
import { Plus, Search, X, Loader2 } from 'lucide-react';
import { Product } from '../../../types';
import { BD_LOCATIONS, Division } from './constants';

export interface NewOrderFormState {
  customer: string;
  phone: string;
  address: string;
  division: string;
  district: string;
  upazila: string;
  productId: string;
  quantity: number;
  deliveryCharge: number;
  discountType: 'percentage' | 'taka' | 'none';
  discountValue: string;
  notes: string;
}

interface AddOrderModalProps {
  showAddOrderModal: boolean;
  setShowAddOrderModal: (show: boolean) => void;
  isCreatingOrder: boolean;
  newOrderForm: NewOrderFormState;
  setNewOrderForm: React.Dispatch<React.SetStateAction<NewOrderFormState>>;
  productSearchTerm: string;
  setProductSearchTerm: (term: string) => void;
  showProductDropdown: boolean;
  setShowProductDropdown: (show: boolean) => void;
  useManualAddress: boolean;
  setUseManualAddress: (use: boolean) => void;
  upazilaOptions: string[];
  selectedProductForOrder: Product | null;
  filteredProducts: Product[];
  safeProducts: Product[];
  handleCreateOrder: () => Promise<void>;
}

const AddOrderModal: React.FC<AddOrderModalProps> = ({
  showAddOrderModal,
  setShowAddOrderModal,
  isCreatingOrder,
  newOrderForm,
  setNewOrderForm,
  productSearchTerm,
  setProductSearchTerm,
  showProductDropdown,
  setShowProductDropdown,
  useManualAddress,
  setUseManualAddress,
  upazilaOptions,
  selectedProductForOrder,
  filteredProducts,
  safeProducts,
  handleCreateOrder,
}) => {
  if (!showAddOrderModal) return null;
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';
  const inputClass = 'w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100';

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) setShowAddOrderModal(false); }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-xl max-h-[95vh] sm:max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 lg:p-5 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-base sm:text-xl font-semibold text-gray-900 dark:text-white">Add New Order</h2>
          <button
            onClick={() => setShowAddOrderModal(false)}
            className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 flex-1 overflow-y-auto">
          {/* No Products Warning */}
          {safeProducts.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <p className="text-yellow-800 font-medium">No products available</p>
              <p className="text-yellow-600 text-sm mt-1">Please add products first to create orders.</p>
            </div>
          )}

          {/* Customer Name */}
          <div>
            <label className={labelClass}>
              Customer Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newOrderForm.customer}
              onChange={(e) => setNewOrderForm(prev => ({ ...prev, customer: e.target.value }))}
              placeholder="Enter customer name"
              className={inputClass}
            />
          </div>

          {/* Phone */}
          <div>
            <label className={labelClass}>
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={newOrderForm.phone}
              onChange={(e) => setNewOrderForm(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="01XXXXXXXXX"
              maxLength={13}
              className={inputClass}
            />
          </div>

          {/* Address */}
          <div>
            <label className={labelClass}>
              Delivery Address
            </label>
            <input
              type="text"
              value={newOrderForm.address}
              onChange={(e) => setNewOrderForm(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Full address"
              className={inputClass}
            />
          </div>

          {/* Division */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Division <span className="text-red-500">*</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useManualAddress}
                  onChange={(e) => setUseManualAddress(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span>Manual input</span>
              </label>
            </div>

            {useManualAddress ? (
              <input
                type="text"
                value={newOrderForm.division}
                onChange={(e) => setNewOrderForm(prev => ({ ...prev, division: e.target.value }))}
                placeholder="Enter division manually"
                className={inputClass}
              />
            ) : (
              <select
                value={newOrderForm.division}
                onChange={(e) => {
                  setNewOrderForm(prev => ({
                    ...prev,
                    division: e.target.value,
                    district: '',
                    upazila: '',
                  }));
                }}
                className={inputClass}
              >
                <option value="">Select Division</option>
                <option value="Dhaka">Dhaka</option>
                <option value="Chattogram">Chattogram</option>
                <option value="Rajshahi">Rajshahi</option>
                <option value="Khulna">Khulna</option>
                <option value="Barishal">Barishal</option>
                <option value="Sylhet">Sylhet</option>
                <option value="Rangpur">Rangpur</option>
                <option value="Mymensingh">Mymensingh</option>
              </select>
            )}
          </div>

          {/* District - Only shows when division is selected OR manual mode */}
          {(newOrderForm.division || useManualAddress) && (
            <div>
              <label className={labelClass}>
                District <span className="text-red-500">*</span>
              </label>

              {useManualAddress ? (
                <input
                  type="text"
                  value={newOrderForm.district}
                  onChange={(e) => setNewOrderForm(prev => ({ ...prev, district: e.target.value }))}
                  placeholder="Enter district manually"
                  className={inputClass}
                />
              ) : (
                <select
                  value={newOrderForm.district}
                  onChange={(e) => {
                    setNewOrderForm(prev => ({
                      ...prev,
                      district: e.target.value,
                      upazila: '',
                    }));
                  }}
                  className={inputClass}
                >
                  <option value="">Select District</option>
                  {Object.keys(BD_LOCATIONS[newOrderForm.division as Division] || {}).map((district) => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Upazila/PS - Only shows when district is selected OR manual mode */}
          {(newOrderForm.district || useManualAddress) && (
            <div>
              <label className={labelClass}>
                Upazila/PS <span className="text-red-500">*</span>
              </label>

              {useManualAddress ? (
                <input
                  type="text"
                  value={newOrderForm.upazila}
                  onChange={(e) => setNewOrderForm(prev => ({ ...prev, upazila: e.target.value }))}
                  placeholder="Enter upazila/PS manually"
                  className={inputClass}
                />
              ) : (
                <select
                  value={newOrderForm.upazila}
                  onChange={(e) => setNewOrderForm(prev => ({ ...prev, upazila: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">Select Upazila/PS</option>
                  {upazilaOptions.map((upazila: string) => (
                    <option key={upazila} value={upazila}>{upazila}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Product Selection - Searchable */}
          <div>
            <label className={labelClass}>
              Product <span className="text-red-500">*</span>
            </label>
            <div className="relative product-search-container">
              <input
                type="text"
                value={selectedProductForOrder
                  ? `${selectedProductForOrder.name} - ৳${(selectedProductForOrder.price || 0).toLocaleString()}`
                  : productSearchTerm}
                onChange={(e) => {
                  if (selectedProductForOrder) {
                    setNewOrderForm(prev => ({ ...prev, productId: '' }));
                  }
                  setProductSearchTerm(e.target.value);
                  setShowProductDropdown(true);
                }}
                onFocus={() => setShowProductDropdown(true)}
                placeholder="Search product by name..."
                className={inputClass}
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />

              {/* Dropdown List */}
              {showProductDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product, idx) => (
                      <button
                        key={`${product.id}-${idx}`}
                        type="button"
                        onClick={() => {
                          setNewOrderForm(prev => ({ ...prev, productId: String(product.id) }));
                          setProductSearchTerm('');
                          setShowProductDropdown(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900 dark:text-gray-100">{product.name || 'Unnamed'}</span>
                          <span className="text-blue-600 font-semibold">৳{(product.price || 0).toLocaleString()}</span>
                        </div>
                        {product.sku && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">SKU: {product.sku}</div>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                      No products found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Selected Product Preview */}
          {selectedProductForOrder && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 flex items-center gap-3">
              <img
                src={selectedProductForOrder.image || '/placeholder.png'}
                alt={selectedProductForOrder.name || 'Product'}
                className="w-12 h-12 object-cover rounded-lg"
                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{selectedProductForOrder.name || 'Unnamed'}</p>
                <p className="text-blue-600 font-semibold">৳{(selectedProductForOrder.price || 0).toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* Quantity and Delivery Charge */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={newOrderForm.quantity}
                onChange={(e) => setNewOrderForm(prev => ({ ...prev, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                Delivery Charge
              </label>
              <input
                type="number"
                min=""
                value={newOrderForm.deliveryCharge}
                onChange={(e) => setNewOrderForm(prev => ({ ...prev, deliveryCharge: Math.max(0, parseInt(e.target.value)) }))}
                className={inputClass}
              />
            </div>
          </div>

          {/* Discount Section */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Discount (Optional)
            </label>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                type="button"
                onClick={() => setNewOrderForm(prev => ({
                  ...prev,
                  discountType: 'percentage',
                  discountValue: prev.discountType === 'percentage' ? prev.discountValue : '',
                }))}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  newOrderForm.discountType === 'percentage'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                Percentage %
              </button>
              <button
                type="button"
                onClick={() => setNewOrderForm(prev => ({
                  ...prev,
                  discountType: 'taka',
                  discountValue: prev.discountType === 'taka' ? prev.discountValue : '',
                }))}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  newOrderForm.discountType === 'taka'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                Fixed টাকা
              </button>
            </div>
            {newOrderForm.discountType !== 'none' && (
              <div className="relative">
                <input
                  type="number"
                  min=""
                  max={newOrderForm.discountType === 'percentage' ? 100 : undefined}
                  value={newOrderForm.discountValue}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    if (inputValue === '') {
                      setNewOrderForm(prev => ({ ...prev, discountValue: '' }));
                    } else {
                      const value = parseFloat(inputValue);
                      const maxValue = newOrderForm.discountType === 'percentage' ? 100 : Infinity;
                      setNewOrderForm(prev => ({
                        ...prev,
                        discountValue: String(Math.min(Math.max(0, value), maxValue)),
                      }));
                    }
                  }}
                  placeholder={newOrderForm.discountType === 'percentage' ? 'Enter percentage (0-100)' : 'Enter amount in টাকা'}
                  className={inputClass}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">
                  {newOrderForm.discountType === 'percentage' ? '%' : '৳'}
                </span>
              </div>
            )}
            {newOrderForm.discountType === 'none' && (
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">Select a discount type above to apply discount</p>
            )}
          </div>

          {/* Order Summary */}
          {selectedProductForOrder && (() => {
            const subtotal = (selectedProductForOrder.price || 0) * newOrderForm.quantity;
            let discountAmount = 0;
            const numericDiscountValue = Number(newOrderForm.discountValue) || 0;
            if (newOrderForm.discountType === 'percentage' && numericDiscountValue > 0) {
              discountAmount = (subtotal * numericDiscountValue) / 100;
            } else if (newOrderForm.discountType === 'taka' && numericDiscountValue > 0) {
              discountAmount = numericDiscountValue;
            }
            const subtotalAfterDiscount = subtotal - discountAmount;
            const total = subtotalAfterDiscount + newOrderForm.deliveryCharge;

            return (
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Subtotal:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">৳{subtotal.toLocaleString()}</span>
                </div>
                {newOrderForm.discountType !== 'none' && discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">
                      Discount ({newOrderForm.discountType === 'percentage'
                        ? `${newOrderForm.discountValue}%`
                        : `৳${newOrderForm.discountValue}`}):
                    </span>
                    <span className="font-medium text-green-600">-৳{discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Delivery:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">৳{newOrderForm.deliveryCharge.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base font-semibold border-t border-blue-100 dark:border-blue-900 pt-2">
                  <span className="text-gray-900 dark:text-gray-100">Total:</span>
                  <span className="text-blue-600">৳{total.toLocaleString()}</span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-3 sm:p-4 lg:p-4 xl:p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-2xl">
          <button
            onClick={() => setShowAddOrderModal(false)}
            className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-100 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateOrder}
            disabled={isCreatingOrder || safeProducts.length === 0 || !selectedProductForOrder}
            className="px-5 py-2.5 bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-lg font-medium hover:from-sky-500 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isCreatingOrder ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create Order
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddOrderModal;
