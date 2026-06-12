'use client';

/**
 * Profile Page
 * Route: /profile
 */
import { Suspense, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../providers';
import dynamic from 'next/dynamic';

const StoreProfile = dynamic(() => import('@/views/StoreProfile'), { ssr: false });
const MobileBottomNav = dynamic(() => import('@/components/store/MobileBottomNav').then(m => ({ default: m.MobileBottomNav })), { ssr: false });

export default function ProfilePage() {
  const router = useRouter();
  const app = useApp();
  const cartOpenRef = useRef<(() => void) | null>(null);

  if (!app.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Please log in to view your profile.</p>
          <button onClick={() => app.setIsLoginOpen(true)} className="px-6 py-2 bg-primary text-white rounded-lg">
            Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Suspense fallback={null}>
        <StoreProfile
          user={app.user}
          onUpdateProfile={app.handleUpdateProfile}
          orders={app.orders}
          onHome={() => router.push('/')}
          onLoginClick={() => app.setIsLoginOpen(true)}
          onLogoutClick={app.handleLogout}
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
          onCartOpenRef={(fn) => { cartOpenRef.current = fn; }}
        />
      </Suspense>

      <Suspense fallback={null}>
        <MobileBottomNav
          onHomeClick={() => router.push('/')}
          onCartClick={() => cartOpenRef.current?.()}
          onAccountClick={() => {}}
          onMenuClick={() => router.push('/categories')}
          cartCount={app.cartItems.length}
          websiteConfig={app.websiteConfig}
          onChatClick={app.handleOpenChat}
          user={app.user}
          onLogoutClick={app.handleLogout}
          activeTab="account"
        />
      </Suspense>
    </>
  );
}
