'use client';

/**
 * Checkout Page
 * Route: /checkout
 */
import { Suspense, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../providers';
import { ensureVariantSelection } from '@/utils/appHelpers';
import dynamic from 'next/dynamic';

const StoreCheckout = dynamic(() => import('@/views/StoreCheckout'), { ssr: false });
const LoginModal = dynamic(() => import('@/components/store/LoginModal').then(m => ({ default: m.LoginModal })), { ssr: false });
const StoreChatModal = dynamic(() => import('@/components/store/StoreChatModal').then(m => ({ default: m.StoreChatModal })), { ssr: false });
const MobileBottomNav = dynamic(() => import('@/components/store/MobileBottomNav').then(m => ({ default: m.MobileBottomNav })), { ssr: false });

export default function CheckoutPage() {
  const router = useRouter();
  const app = useApp();
  const cartOpenRef = useRef<(() => void) | null>(null);

  const product = app.selectedProduct;
  const quantity = app.checkoutQuantity;
  const variant = app.selectedVariant || (product ? ensureVariantSelection(product) : null);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No product selected for checkout.</p>
          <button onClick={() => router.push('/')} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {app.isLoginOpen && (
        <Suspense fallback={null}>
          <LoginModal
            onClose={() => app.setIsLoginOpen(false)}
            onLogin={app.handleLogin}
            onRegister={app.handleRegister}
            onGoogleLogin={app.handleGoogleLogin}
          />
        </Suspense>
      )}

      <Suspense fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 animate-pulse">
          <div className="h-16 bg-white dark:bg-gray-800 shadow" />
          <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/3" />
          </div>
        </div>
      }>
        <StoreCheckout
          product={product}
          quantity={quantity}
          variant={variant!}
          onBack={() => router.back()}
          onConfirmOrder={app.handlers.handlePlaceOrder}
          user={app.user}
          onLoginClick={() => app.setIsLoginOpen(true)}
          onLogoutClick={app.handleLogout}
          onProfileClick={() => router.push('/profile')}
          logo={app.logo}
          websiteConfig={app.websiteConfig}
          tenantId={app.activeTenantId}
          deliveryConfigs={app.deliveryConfig}
          paymentMethods={app.paymentMethods}
          searchValue=""
          onSearchChange={() => {}}
          onOpenChat={app.handleOpenChat}
          cart={app.cartItems}
          onToggleCart={(id: number) => {
            const p = app.products.find(pr => pr.id === id);
            if (p) app.handleCartToggle(p.id, { silent: false });
          }}
          onCheckoutFromCart={app.handlers.handleCheckoutFromCart}
          productCatalog={app.products}
          orders={app.orders}
          onCartOpenRef={(fn) => { cartOpenRef.current = fn; }}
        />
      </Suspense>

      <Suspense fallback={null}>
        <StoreChatModal
          isOpen={app.isChatOpen}
          onClose={app.handleCloseChat}
          tenantId={app.activeTenantId}
          websiteConfig={app.websiteConfig}
          user={app.user}
          messages={app.chatMessages}
          onSendMessage={app.handleCustomerSendChat}
          context="customer"
          onEditMessage={app.handleEditChatMessage}
          onDeleteMessage={app.handleDeleteChatMessage}
          onLoginClick={() => app.setIsLoginOpen(true)}
        />
      </Suspense>

      <Suspense fallback={null}>
        <MobileBottomNav
          onHomeClick={() => router.push('/')}
          onCartClick={() => cartOpenRef.current?.()}
          onAccountClick={() => app.user ? router.push('/profile') : app.setIsLoginOpen(true)}
          onMenuClick={() => router.push('/categories')}
          cartCount={app.cartItems.length}
          websiteConfig={app.websiteConfig}
          onChatClick={app.handleOpenChat}
          user={app.user}
          onLogoutClick={app.handleLogout}
        />
      </Suspense>
    </>
  );
}
