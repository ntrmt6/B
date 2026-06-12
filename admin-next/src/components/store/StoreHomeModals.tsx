import React, { Suspense, lazy } from 'react';
import type { Product, Order, ProductVariantSelection } from '../../types';

const TrackOrderModal = lazy(() => import('./TrackOrderModal').then(m => ({ default: m.TrackOrderModal })));
const ProductQuickViewModal = lazy(() => import('./ProductQuickViewModal').then(m => ({ default: m.ProductQuickViewModal })));

interface StoreHomeModalsProps {
  isTrackOrderOpen: boolean;
  onCloseTrackOrder: () => void;
  orders?: Order[];
  quickViewProduct: Product | null;
  onCloseQuickView: () => void;
  onQuickViewOrder: (product: Product, quantity: number, variant: ProductVariantSelection) => void;
  onViewDetails: (product: Product) => void;
}

export const StoreHomeModals: React.FC<StoreHomeModalsProps> = ({
  isTrackOrderOpen,
  onCloseTrackOrder,
  orders,
  quickViewProduct,
  onCloseQuickView,
  onQuickViewOrder,
  onViewDetails,
}) => (
  <>
    {/* Track Order Modal */}
    {isTrackOrderOpen && (
      <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" /></div>}>
        <TrackOrderModal onClose={onCloseTrackOrder} orders={orders} />
      </Suspense>
    )}
   
    {/* Quick View Modal */}
    {quickViewProduct && (
      <Suspense fallback={null}>
        <ProductQuickViewModal
          product={quickViewProduct}
          onClose={onCloseQuickView}
          onCompleteOrder={onQuickViewOrder}
          onViewDetails={onViewDetails}
        />
      </Suspense>
    )}
  </>
);
