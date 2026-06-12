'use client';

import { Suspense, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useApp } from './providers';

const StoreHome = dynamic(() => import('@/views/StoreHome'));

const MobileBottomNav = dynamic(() =>
  import('@/components/store/MobileBottomNav').then(m => ({ default: m.MobileBottomNav })),
  { ssr: false }
);
const StoreChatModal = dynamic(() =>
  import('@/components/store/StoreChatModal').then(m => ({ default: m.StoreChatModal })),
  { ssr: false }
);
const LoginModal = dynamic(() =>
  import('@/components/store/LoginModal').then(m => ({ default: m.LoginModal })),
  { ssr: false }
);

export function StorePageSkeleton() {
  return (
    <div className="min-h-screen font-sans text-slate-900" style={{ background: '#ffffff' }}>
      {/* Header — matches StoreHeader: w-full, bg-white, shadow-sm, sticky top-0 z-50 */}
      <header className="w-full bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-[1720px] mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-14 sm:h-16 animate-pulse">
            <div className="h-8 w-24 sm:w-28 bg-gray-200 rounded" />
            <div className="h-10 flex-1 max-w-xl bg-gray-200 rounded-full mx-4 hidden md:block" />
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 sm:h-9 sm:w-9 bg-gray-200 rounded-full" />
              <div className="h-8 w-8 sm:h-9 sm:w-9 bg-gray-200 rounded-full" />
              <div className="h-8 w-8 sm:h-9 sm:w-9 bg-gray-200 rounded-full" />
            </div>
          </div>
        </div>
      </header>
      {/* Hero — matches max-w-[1720px], aspect-ratio 20/6 mobile */}
      <section className="w-full">
        <div className="max-w-[1720px] mx-auto px-2 md:px-4 lg:px-0 pb-1 animate-pulse">
          <div className="bg-gray-200 rounded-lg sm:rounded-xl" style={{ aspectRatio: '20/6', maxHeight: '500px' }} />
        </div>
      </section>
      {/* Categories — pill carousel matching gap-0.5 */}
      <div className="overflow-hidden py-0.5 animate-pulse">
        <div className="flex gap-0.5 px-0.5">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="flex-shrink-0 flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full bg-white border border-gray-100 shadow-sm">
              <div className="w-7 h-7 sm:w-9 sm:h-9 bg-gray-200 rounded-full" />
              <div className="h-3 w-12 sm:w-16 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
      {/* Product sections — matches max-w-[1720px], px-0.5, space-y-0.5 */}
      <main className="max-w-[1720px] mx-auto px-0.5 sm:px-1 lg:px-1.5 space-y-0.5 sm:space-y-1 pb-4 animate-pulse" style={{ minHeight: '680px' }}>
        {/* Flash sale section placeholder */}
        <div className="pt-0.5 pb-0.5">
          <div className="bg-gradient-to-r from-pink-500/20 via-rose-500/20 to-orange-500/20 rounded-xl sm:rounded-2xl p-px sm:p-0.5">
            <div className="bg-gray-100 rounded-lg sm:rounded-xl p-1 sm:p-1.5">
              <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <div className="w-7 h-7 sm:w-10 sm:h-10 bg-gray-200 rounded-lg sm:rounded-xl" />
                  <div className="h-4 sm:h-5 w-20 sm:w-36 bg-gray-200 rounded" />
                </div>
                <div className="h-6 sm:h-8 w-10 sm:w-16 bg-gray-200 rounded-full" />
              </div>
              <div className="flex gap-0.5 sm:gap-0.5 md:gap-1 overflow-hidden pb-0.5">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="flex-shrink-0 w-[120px] sm:w-[160px] md:w-[180px] lg:w-[200px]">
                    <div className="bg-white rounded-lg sm:rounded-xl overflow-hidden border border-gray-100">
                      <div className="bg-gray-200" style={{ aspectRatio: '1/1' }} />
                      <div className="p-0.5 sm:p-1 md:p-1.5 space-y-0.5">
                        <div className="h-3 w-full bg-gray-200 rounded" />
                        <div className="h-6 sm:h-7 w-full bg-gray-200 rounded-lg" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Product grid section placeholders */}
        {[1, 2].map(section => (
          <div key={section} className="py-2">
            <div className="h-5 w-36 bg-gray-200 rounded mb-2" />
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100/80" style={{ contain: 'layout' }}>
                  <div className="bg-gray-50/50" style={{ aspectRatio: '1/1' }}>
                    <div className="w-full h-full bg-gray-200" />
                  </div>
                  <div className="px-1 pb-1 pt-0.5 flex flex-col gap-0.5">
                    <div className="h-2.5 w-8 bg-gray-200 rounded" />
                    <div className="min-h-[28px] sm:min-h-[32px] md:min-h-[40px]">
                      <div className="h-3 md:h-3.5 w-full bg-gray-200 rounded" />
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-auto">
                      <div className="h-4 w-14 bg-gray-200 rounded" />
                      <div className="h-3 w-10 bg-gray-200 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>
      {/* Footer — matches dark footer with rounded-t */}
      <footer className="w-full mt-auto">
        <div className="mx-auto max-w-[1720px] bg-gray-900 rounded-t-[48px] md:rounded-t-[112px] px-6 md:px-20 pt-10 md:pt-14 pb-6 animate-pulse">
          <div className="hidden md:flex flex-row items-start justify-between gap-8">
            <div className="flex flex-col gap-4 max-w-[220px]">
              <div className="h-8 w-[140px] bg-gray-700 rounded" />
              <div className="h-3 w-full bg-gray-800 rounded" />
              <div className="h-3 w-4/5 bg-gray-800 rounded" />
            </div>
            {[1,2,3].map(col => (
              <div key={col} className="space-y-3">
                <div className="h-4 w-24 bg-gray-700 rounded" />
                {[1,2,3].map(j => <div key={j} className="h-3 w-20 bg-gray-800 rounded" />)}
              </div>
            ))}
          </div>
          <div className="md:hidden space-y-4">
            <div className="h-8 w-[120px] bg-gray-700 rounded mx-auto" />
            <div className="h-3 w-3/4 bg-gray-800 rounded mx-auto" />
          </div>
          <div className="mt-8 pt-4 border-t border-gray-800">
            <div className="h-3 w-48 bg-gray-800 rounded mx-auto" />
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function StoreHomeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const app = useApp();
  const cartOpenRef = useRef<(() => void) | null>(null);

  const categoryFilter = searchParams.get('category');
  const brandFilter = searchParams.get('brand');
  const urlCategoryFilter = categoryFilter || (brandFilter ? `brand:${brandFilter}` : null);

  const handleProductClick = useCallback((product: any) => {
    if (product.slug) router.push(`/product-details/${product.slug}`);
  }, [router]);

  const handleCategoryFilterChange = useCallback((slug: string | null) => {
    if (slug) {
      if (slug === 'all') router.push('/all-products');
      else if (slug.startsWith('brand:')) router.push(`/all-products?brand=${slug.replace('brand:', '')}`);
      else router.push(`/all-products?category=${slug}`);
    } else {
      router.push('/');
    }
  }, [router]);

  const handleToggleCart = useCallback((id: number) => {
    const product = app.products.find(p => p.id === id);
    if (product) app.handleCartToggle(product.id, { silent: false });
  }, [app]);

  if (app.isLoading) return <StorePageSkeleton />;

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

      <Suspense fallback={<StorePageSkeleton />}>
        <StoreHome
          products={app.products}
          orders={app.orders}
          tenantId={app.activeTenantId}
          onProductClick={handleProductClick}
          onQuickCheckout={app.handlers.handleCheckoutStart}
          wishlistCount={app.wishlist.length}
          wishlist={app.wishlist}
          onToggleWishlist={(id: number) =>
            app.handlers.isInWishlist(id) ? app.handlers.removeFromWishlist(id) : app.handlers.addToWishlist(id)
          }
          user={app.user}
          onLoginClick={() => app.setIsLoginOpen(true)}
          onLogoutClick={app.handleLogout}
          onProfileClick={() => router.push('/profile')}
          logo={app.logo}
          websiteConfig={app.websiteConfig}
          searchValue=""
          onSearchChange={() => {}}
          onOpenChat={app.handleOpenChat}
          cart={app.cartItems}
          onToggleCart={handleToggleCart}
          onCheckoutFromCart={app.handlers.handleCheckoutFromCart}
          onAddToCart={app.handleAddProductToCart}
          categories={app.categories}
          subCategories={app.subCategories}
          childCategories={app.childCategories}
          brands={app.brands}
          tags={app.tags}
          initialCategoryFilter={urlCategoryFilter}
          onCategoryFilterChange={handleCategoryFilterChange}
          onMobileMenuOpenRef={() => {}}
          onCartOpenRef={(fn: (() => void) | null) => { cartOpenRef.current = fn; }}
        />
      </Suspense>

      <Suspense fallback={null}>
        <MobileBottomNav
          onHomeClick={() => { window.scrollTo(0, 0); }}
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
    </>
  );
}