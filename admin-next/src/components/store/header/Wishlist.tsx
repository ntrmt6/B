import { X, Trash2, ShoppingCart, Heart } from 'lucide-react';
import { Product } from '../../../types';
import { formatCurrency } from '../../../utils/format';
import { normalizeImageUrl } from '../../../utils/imageUrlHelper';

interface WishlistProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistItems: number[];
  catalogSource: Product[];
  onRemoveFromWishlist: (id: number) => void;
  onAddToCart?: (id: number) => void;
  onProductClick?: (product: Product) => void;
}

export const Wishlist = ({ isOpen, onClose, wishlistItems, catalogSource, onRemoveFromWishlist, onAddToCart, onProductClick }: WishlistProps) => {
  if (!isOpen) return null;

  const wishlistProducts = wishlistItems
    .map(id => catalogSource.find(x => x.id === id))
    .filter((p): p is Product => !!p);

  return (
    <div className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 relative overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, #F472B6 0%, #EC4899 50%, #DB2777 100%)' }} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <Heart size={20} className="text-pink-500" fill="#EC4899" />
            <h2 className="text-xl font-bold text-gray-900">My Wishlist</h2>
            {wishlistProducts.length > 0 && (
              <span className="bg-pink-100 text-pink-600 text-xs font-bold px-2 py-0.5 rounded-full">{wishlistProducts.length}</span>
            )}
          </div>
          <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 pb-5">
          {wishlistProducts.length === 0 ? (
            <div className="text-center py-12">
              <Heart size={48} className="mx-auto text-gray-200 mb-3" />
              <p className="text-gray-500 font-medium">Your wishlist is empty</p>
              <p className="text-gray-400 text-sm mt-1">Tap the heart icon on products to save them here</p>
            </div>
          ) : (
            <ul className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {wishlistProducts.map(product => (
                <li key={product.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-pink-100 hover:bg-pink-50/30 transition-all group">
                  <img
                    src={normalizeImageUrl(product.image)}
                    alt={product.name}
                    className="w-16 h-16 rounded-xl object-cover border shadow-sm cursor-pointer flex-shrink-0"
                    loading="lazy"
                    decoding="async"
                    onClick={() => { onProductClick?.(product); onClose(); }}
                  />
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-semibold text-gray-900 text-sm truncate cursor-pointer hover:text-pink-600 transition-colors"
                      onClick={() => { onProductClick?.(product); onClose(); }}
                    >
                      {product.name}
                    </div>
                    <div className="text-sm font-bold mt-1 text-pink-600">৳ {formatCurrency(product.price)}</div>
                    <div className="mt-2 flex gap-2">
                      {onAddToCart && (
                        <button
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition-all hover:shadow-md active:scale-95"
                          style={{ background: 'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 60%, #0284C7 100%)' }}
                          onClick={() => onAddToCart(product.id)}
                        >
                          <ShoppingCart size={13} /> Add to Cart
                        </button>
                      )}
                      <button
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition"
                        onClick={() => onRemoveFromWishlist(product.id)}
                      >
                        <Trash2 size={13} /> Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
