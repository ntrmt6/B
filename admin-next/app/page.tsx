'use client';

/**
 * Store Home Page - Main storefront
 * Maps to: / and /all-products
 */
import { Suspense, useCallback, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useApp } from './providers';
import dynamic from 'next/dynamic';

// Standard dynamic import for a default export
const StoreHome = dynamic(() => import('@/views/StoreHome'));

// Named exports: wrap in { default } for next/dynamic
const MobileBottomNav = dynamic(() => 
  import('@/components/store/MobileBottomNav').then((m) => ({ default: m.MobileBottomNav })),
  { ssr: false }
);

const StoreChatModal = dynamic(() => 
  import('@/components/store/StoreChatModal').then((m) => ({ default: m.StoreChatModal })),
  { ssr: false }
);

const LoginModal = dynamic(() => 
  import('@/components/store/LoginModal').then((m) => ({ default: m.LoginModal })),
  { ssr: false }
);

function StorePageSkeleton() {
  return (
    <div className="min-h-screen font-sans text-slate-900" style={{ background: '#ffffff' }}>
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
      <div className="max-w-[1720px] mx-auto px-2 md:px-4 lg:px-0 pb-1 animate-pulse">
        <div className="bg-gray-200 rounded-lg sm:rounded-xl" style={{ aspectRatio: '20/6', maxHeight: '500px' }} />
      </div>
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
      <main className="max-w-[1720px] mx-auto px-0.5 sm:px-1 lg:px-1.5 space-y-0.5 sm:space-y-1 pb-4 animate-pulse" style={{ minHeight: '680px' }}>
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
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const app = useApp();
  const cartOpenRef = useRef<(() => void) | null>(null);

  const categoryFilter = searchParams.get('category');
  const brandFilter = searchParams.get('brand');
  const isAllProductsPage = pathname === '/all-products';
  const urlCategoryFilter = categoryFilter || (brandFilter ? `brand:${brandFilter}` : null) || (isAllProductsPage ? 'all' : null);

  const handleProductClick = useCallback((product: any) => {
    if (product.slug) {
      router.push(`/product-details/${product.slug}`);
    }
  }, [router]);

  const handleCategoryFilterChange = useCallback((slug: string | null) => {
    if (slug) {
      if (slug === 'all') {
        router.push('/all-products');
      } else if (slug.startsWith('brand:')) {
        router.push(`/all-products?brand=${slug.replace('brand:', '')}`);
      } else {
        router.push(`/all-products?category=${slug}`);
      }
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
          onCartOpenRef={(fn) => { cartOpenRef.current = fn; }}
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
