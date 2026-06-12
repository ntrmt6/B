import { X, ShoppingBag, Trash2, ArrowRight, Store } from 'lucide-react';
import { Product } from '../../../types';
import { formatCurrency } from '../../../utils/format';
import { normalizeImageUrl } from '../../../utils/imageUrlHelper';

interface Props { isOpen: boolean; onClose: () => void; cartItems: number[]; catalogSource: Product[]; onToggleCart: (id: number) => void; onCheckout: (id: number) => void; }

/** Group products by vendor (products without vendorName go under "Your Store") */
function groupByVendor(products: Product[]): { vendorName: string; items: Product[] }[] {
  const map = new Map<string, Product[]>();
  for (const p of products) {
    const key = p.vendorName || '';
    const group = map.get(key) || [];
    group.push(p);
    map.set(key, group);
  }
  // Put store-direct items first, then vendor groups alphabetically
  const groups: { vendorName: string; items: Product[] }[] = [];
  const storeItems = map.get('');
  if (storeItems) groups.push({ vendorName: '', items: storeItems });
  for (const [name, items] of [...map.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (name) groups.push({ vendorName: name, items });
  }
  return groups;
}

export const CartModal = ({ isOpen, onClose, cartItems, catalogSource, onToggleCart, onCheckout }: Props) => {
  if (!isOpen) return null;

  const cartProducts = cartItems
    .map(id => catalogSource.find(x => x.id === id))
    .filter(Boolean) as Product[];

  const totalPrice = cartProducts.reduce((sum, p) => sum + (p.price || 0), 0);
  const vendorGroups = groupByVendor(cartProducts);
  const hasVendorProducts = vendorGroups.some(g => g.vendorName !== '');

  return (
    <div className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-md sm:mx-4 sm:rounded-2xl rounded-t-2xl shadow-2xl relative overflow-hidden animate-slide-up max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'slideUp 0.25s ease-out' }}
      >
        <style>{`@keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
        
        {/* Handle bar for mobile */}
        <div className="flex justify-center pt-2 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-theme-primary" />
            <h2 className="text-base font-bold text-gray-900">My Cart</h2>
            {cartItems.length > 0 && (
              <span className="bg-theme-primary/10 text-theme-primary text-[11px] font-bold px-2 py-0.5 rounded-full">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
              </span>
            )}
          </div>
          <button type="button" className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition" onClick={onClose} aria-label="Close cart">
            <X size={20} />
          </button>
        </div>

        {/* Cart Items */}
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <ShoppingBag size={28} className="text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium text-sm">Your cart is empty</p>
            <p className="text-gray-400 text-xs mt-1">Browse products and add items to get started</p>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {vendorGroups.map(({ vendorName, items }) => (
                <li key={vendorName || '__store__'}>
                  {/* Vendor group header — only show when there are multi-vendor items */}
                  {hasVendorProducts && (
                    <div className="flex items-center gap-1.5 px-4 sm:px-5 pt-2.5 pb-1">
                      <Store size={12} className="text-gray-400" />
                      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                        {vendorName || 'Your Store'}
                      </span>
                    </div>
                  )}
                  <ul className="divide-y divide-gray-50">
                    {items.map(p => (
                      <li key={p.id} className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-gray-50/50 transition-colors">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                          <img src={normalizeImageUrl(p.image)} alt={p.name} className="w-full h-full object-contain p-0.5" loading="lazy" decoding="async" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm leading-snug line-clamp-1">{p.name}</div>
                          <div className="text-sm font-bold text-theme-primary mt-0.5">৳ {formatCurrency(p.price)}</div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            className="h-9 px-3 text-xs text-white font-semibold rounded-lg bg-theme-primary hover:brightness-110 active:scale-95 transition-all flex items-center gap-1 shadow-sm"
                            onClick={() => onCheckout(p.id)}
                          >
                            Order <ArrowRight size={12} />
                          </button>
                          <button
                            className="h-9 w-9 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 flex items-center justify-center transition-all active:scale-95"
                            onClick={() => onToggleCart(p.id)}
                            aria-label="Remove from cart"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>

            {/* Footer with total */}
            <div className="border-t border-gray-100 px-4 sm:px-5 py-3 bg-gray-50/80">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500">Total</span>
                  <div className="text-lg font-bold text-gray-900">৳ {formatCurrency(totalPrice)}</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartModal;
