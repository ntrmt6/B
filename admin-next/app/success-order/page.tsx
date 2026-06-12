'use client';

/**
 * Order Success Page
 * Route: /success-order?orderId=X
 */
import { Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '../providers';
import dynamic from 'next/dynamic';

const StoreOrderSuccess = dynamic(() => import('@/views/StoreOrderSuccess'), { ssr: false });
const MobileBottomNav = dynamic(() => import('@/components/store/MobileBottomNav').then(m => ({ default: m.MobileBottomNav })), { ssr: false });

export default function SuccessOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const app = useApp();
  const cartOpenRef = useRef<(() => void) | null>(null);

  return (
    <>
      <Suspense fallback={null}>
        <StoreOrderSuccess
          onHome={() => router.push('/')}
          orderId={orderId || undefined}
          user={app.user}
          onLoginClick={() => app.setIsLoginOpen(true)}
          onLogoutClick={app.handleLogout}
          onProfileClick={() => router.push('/profile')}
          logo={app.logo}
          tenantId={app.activeTenantId}
          websiteConfig={app.websiteConfig}
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
