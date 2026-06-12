'use client';

import { Suspense, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useApp } from '../../providers';

const StoreProductDetail = dynamic(() => import('@/views/StoreProductDetail'), { ssr: false });
const LoginModal = dynamic(() => import('@/components/store/LoginModal').then(m => ({ default: m.LoginModal })), { ssr: false });
const StoreChatModal = dynamic(() => import('@/components/store/StoreChatModal').then(m => ({ default: m.StoreChatModal })), { ssr: false });

function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen font-sans text-slate-900 pb-28 md:pb-0" style={{ background: 'linear-gradient(to bottom, #f0f4f8, #e8ecf1)' }}>
      {/* Header — matches StoreHeader */}
      <header className="w-full bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-[1720px] mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-14 sm:h-16 animate-pulse">
            <div className="h-8 w-24 sm:w-28 bg-gray-200 rounded" />
            <div className="h-10 flex-1 max-w-xl bg-gray-200 rounded-full mx-4 hidden md:block" />
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 sm:h-9 sm:w-9 bg-gray-200 rounded-full" />
              <div className="h-8 w-8 sm:h-9 sm:w-9 bg-gray-200 rounded-full" />
            </div>
          </div>
        </div>
      </header>
      {/* Main content — matches max-w-[1500px], flex flex-col lg:flex-row gap-4 */}
      <main className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-4 animate-pulse">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left: Product hero (image + info) */}
          <div className="flex-1">
            <div className="bg-white/90 rounded-2xl p-4 sm:p-6">
              <div className="flex flex-col md:flex-row gap-4 md:gap-10">
                {/* Image gallery — w-full md:w-1/2 */}
                <div className="w-full md:w-1/2 space-y-3">
                  {/* Main image — aspect-square, rounded-[24px] */}
                  <div className="aspect-square bg-gray-200 rounded-[24px] border border-slate-100" />
                  {/* Thumbnails — gap-3 */}
                  <div className="flex gap-3 overflow-hidden py-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="flex-shrink-0 w-20 h-20 bg-gray-200 rounded-xl border-2 border-slate-100" />
                    ))}
                  </div>
                </div>
                {/* Product info — w-full md:w-1/2 */}
                <div className="w-full md:w-1/2 flex flex-col space-y-4">
                  {/* Title */}
                  <div className="space-y-2 mb-3 md:mb-6">
                    <div className="h-7 md:h-9 bg-gray-200 rounded w-3/4" />
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-20 bg-gray-200 rounded" />
                      <div className="h-4 w-px bg-gray-200" />
                      <div className="h-4 w-16 bg-gray-200 rounded" />
                    </div>
                  </div>
                  {/* Price */}
                  <div className="flex items-baseline gap-3 mb-4 md:mb-8">
                    <div className="h-8 md:h-10 w-24 bg-gray-200 rounded" />
                    <div className="h-5 w-16 bg-gray-200 rounded" />
                  </div>
                  {/* Share button */}
                  <div className="h-10 w-36 bg-gray-200 rounded-full mb-4 md:mb-10" />
                  {/* Variant selectors */}
                  <div className="space-y-4 md:space-y-8 mb-4 md:mb-10">
                    <div className="space-y-2">
                      <div className="h-3 w-12 bg-gray-200 rounded" />
                      <div className="flex items-center gap-2">
                        <div className="h-9 w-9 bg-gray-200 rounded-xl" />
                        <div className="h-8 w-10 bg-gray-200 rounded" />
                        <div className="h-9 w-9 bg-gray-200 rounded-xl" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-10 bg-gray-200 rounded" />
                      <div className="flex flex-wrap gap-2">
                        {[1,2,3].map(i => <div key={i} className="h-9 w-16 bg-gray-200 rounded-lg" />)}
                      </div>
                    </div>
                  </div>
                  {/* Action buttons — hidden md:flex gap-3 */}
                  <div className="hidden md:flex gap-3 mb-6">
                    <div className="flex-1 h-12 bg-gray-200 rounded-xl" />
                    <div className="flex-1 h-12 bg-gray-200 rounded-xl" />
                  </div>
                  {/* Metadata grid */}
                  <div className="grid grid-cols-2 gap-y-4 pt-8 border-t border-slate-100">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="space-y-1">
                        <div className="h-3 w-16 bg-gray-200 rounded" />
                        <div className="h-4 w-24 bg-gray-200 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Right sidebar — w-full lg:w-80 */}
          <aside className="w-full lg:w-80 space-y-4">
            <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
              <div className="h-5 w-28 bg-gray-200 rounded mb-4" />
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center gap-4 p-3 mb-2">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-3/4 bg-gray-200 rounded" />
                    <div className="h-3 w-1/2 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
              <div className="h-5 w-24 bg-gray-200 rounded mb-3" />
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center gap-3 p-2 mb-1">
                  <div className="w-8 h-8 bg-gray-200 rounded-full" />
                  <div className="h-3 w-20 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default function ProductDetailClient() {
  const router = useRouter();
  const params = useParams();
  const app = useApp();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const isCatalogPending = app.isLoading || !app.activeTenantId;

  const product = useMemo(() => {
    if (!slug) return null;

    return app.products.find(p => p.slug === slug)
      || (!Number.isNaN(Number(slug)) ? app.products.find(p => p.id === Number(slug)) : null)
      || null;
  }, [app.products, slug]);

  useEffect(() => {
    if (product && app.selectedProduct?.id !== product.id) {
      app.setSelectedProduct(product);
    }
  }, [app, product]);

  if (isCatalogPending) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full rounded-2xl bg-white p-8 text-center shadow-sm border border-gray-100">
          <h1 className="text-xl font-semibold text-gray-900">Product not found</h1>
          <p className="mt-3 text-sm text-gray-500">
            This product is not available in the current shop catalog.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => router.push('/all-products')}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              View products
            </button>
            <button
              onClick={() => router.push('/')}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Go home
            </button>
          </div>
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

      <Suspense fallback={<ProductDetailSkeleton />}>
        <StoreProductDetail
          product={product}
          orders={app.orders}
          tenantId={app.activeTenantId}
          onBack={() => router.back()}
          onProductClick={(p: any) => p.slug && router.push(`/product-details/${p.slug}`)}
          wishlistCount={app.wishlist.length}
          isWishlisted={app.handlers.isInWishlist(product.id)}
          onToggleWishlist={() =>
            app.handlers.isInWishlist(product.id)
              ? app.handlers.removeFromWishlist(product.id)
              : app.handlers.addToWishlist(product.id)
          }
          onCheckout={app.handlers.handleCheckoutStart}
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
          onToggleCart={(id: number) => {
            const nextProduct = app.products.find(p => p.id === id);
            if (nextProduct) app.handleCartToggle(nextProduct.id, { silent: false });
          }}
          onCheckoutFromCart={app.handlers.handleCheckoutFromCart}
          onAddToCart={(nextProduct: any, quantity: number, variant: any) =>
            app.handleAddProductToCart(nextProduct, quantity, variant, { silent: true })
          }
          productCatalog={app.products}
          categories={app.categories}
          onCategoryClick={(categorySlug: string) => router.push(`/all-products?category=${categorySlug}`)}
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
