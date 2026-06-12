
import React, { lazy, Suspense, useMemo, useState } from 'react';

// Lazy load heavy layout components from individual files
const StoreHeader = lazy(() => import('../components/StoreHeader').then(m => ({ default: m.StoreHeader })));
const StoreFooter = lazy(() => import('../components/store/StoreFooter').then(m => ({ default: m.StoreFooter })));
const TrackOrderModal = lazy(() => import('../components/store/TrackOrderModal').then(m => ({ default: m.TrackOrderModal })));
import { CheckCircle, Copy, Check } from 'lucide-react';
import { User, WebsiteConfig, Product, Order } from '../types';

interface SuccessProps {
  onHome: () => void;
  user?: User | null;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  onProfileClick?: () => void;
  logo?: string | null;
  websiteConfig?: WebsiteConfig;
  tenantId?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onImageSearchClick?: () => void;
  onOpenChat?: () => void;
  cart?: number[];
  onToggleCart?: (id: number) => void;
  onCheckoutFromCart?: (productId: number) => void;
  productCatalog?: Product[];
  orderId?: string;
  orders?: Order[];
  onCartOpenRef?: (openFn: () => void) => void;
}

const crystalPanelClass = 'rounded-2xl border border-sky-100/80 bg-white/80 backdrop-blur-sm shadow-[0_20px_80px_rgba(14,116,144,0.12)] p-5 sm:p-7 lg:p-8';
const actionButtonBaseClass = 'w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200';
const primaryActionButtonClass = `${actionButtonBaseClass} bg-gradient-to-r from-sky-600 to-sky-500 text-white shadow-[0_8px_22px_rgba(2,132,199,0.35)] hover:from-sky-700 hover:to-sky-600`;
const secondaryActionButtonClass = `${actionButtonBaseClass} border border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100`;

const StoreOrderSuccess = ({ onHome, user, onLoginClick, onLogoutClick, onProfileClick, logo, websiteConfig, searchValue, onSearchChange, onImageSearchClick, onOpenChat, tenantId, cart, onToggleCart, onCheckoutFromCart, productCatalog, orderId: propsOrderId, orders = [], onCartOpenRef }: SuccessProps) => {
  const [copied, setCopied] = React.useState(false);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
  
  // Get orderId from URL or props
  const orderId = useMemo(() => {
    if (propsOrderId) return propsOrderId;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('orderId') || '';
    }
    return '';
  }, [propsOrderId]);

  const handleCopyOrderId = () => {
    if (orderId) {
      navigator.clipboard.writeText(orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-orange-50 font-sans text-slate-900 flex flex-col">
      <Suspense fallback={null}>
        <StoreHeader 
          onHomeClick={onHome}
          ImageSearchClick={onImageSearchClick}
          onTrackOrder={() => setIsTrackOrderOpen(true)}
          user={user}
          onLoginClick={onLoginClick}
          onLogoutClick={onLogoutClick}
          onProfileClick={onProfileClick}
          logo={logo}
          websiteConfig={websiteConfig}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          cart={cart}
          onToggleCart={onToggleCart}
          onCheckoutFromCart={onCheckoutFromCart}
          productCatalog={productCatalog}
          onCartOpenRef={onCartOpenRef}
        />
      </Suspense>
      
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center py-12">
        <div className={`${crystalPanelClass} max-w-lg w-full text-center animate-in fade-in zoom-in-95 duration-500`}>
           <div className="w-24 h-24 bg-gradient-to-br from-sky-100 via-sky-50 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-white shadow-md">
              <CheckCircle size={48} className="text-sky-600" />
           </div>
            
           <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-700 via-sky-600 to-orange-500 bg-clip-text text-transparent mb-2">Order Confirmed!</h1>
           <p className="text-slate-600 mb-8">Thank you for your purchase. Your order has been placed successfully and is being processed.</p>
            
            {orderId && (
              <div className="bg-gradient-to-r from-sky-50 to-orange-50 rounded-xl p-4 mb-6 border border-sky-100/80">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-slate-500 block">Order ID</span>
                    <span className="text-xl font-bold text-sky-700">{orderId}</span>
                  </div>
                  <button
                    onClick={handleCopyOrderId}
                    className="p-2 hover:bg-sky-100 rounded-lg transition-colors"
                    title="Copy Order ID"
                  >
                    {copied ? <Check size={20} className="text-sky-600" /> : <Copy size={20} className="text-slate-500" />}
                  </button>
                </div>
              </div>
            )}
            
            <div className="bg-white/70 rounded-lg p-4 mb-8 text-left border border-sky-100/70 shadow-inner">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-500">Order Status</span>
                <span className="text-sm font-bold text-orange-700 bg-orange-100 px-2 py-1 rounded">Pending</span>
              </div>
              <p className="text-xs text-slate-400">You can track your order status in the "Track Order" section.</p>
            </div>

            <div className="flex flex-col gap-3">
               <button 
                 onClick={onHome}
                 className={primaryActionButtonClass}
               >
                 Continue Shopping
               </button>
               <button 
                 onClick={() => window.print()}
                 className={secondaryActionButtonClass}
               >
                 Download Invoice
               </button>
            </div>
        </div>
      </main>

      <Suspense fallback={null}>
        <StoreFooter websiteConfig={websiteConfig} logo={logo} tenantId={tenantId} onOpenChat={onOpenChat} />
      </Suspense>

      {isTrackOrderOpen && (
        <Suspense fallback={null}>
          <TrackOrderModal onClose={() => setIsTrackOrderOpen(false)} orders={orders} />
        </Suspense>
      )}
    </div>
  );
};

export default StoreOrderSuccess;
