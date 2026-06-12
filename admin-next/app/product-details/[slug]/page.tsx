'use client';

/**
 * Product Detail Page
 * Route: /product-details/[slug]
 */
import { Suspense, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useApp } from '../../providers';
import dynamic from 'next/dynamic';

const StoreProductDetail = dynamic(() => import('@/views/StoreProductDetail'), { ssr: false });
const LoginModal = dynamic(() => import('@/components/store/LoginModal').then(m => ({ default: m.LoginModal })), { ssr: false });
const StoreChatModal = dynamic(() => import('@/components/store/StoreChatModal').then(m => ({ default: m.StoreChatModal })), { ssr: false });

function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 animate-pulse">
      <div className="h-16 bg-white dark:bg-gray-800 shadow" />
      <div className="max-w-7xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-8">
        <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-xl" />
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const app = useApp();

  const product = useMemo(() => {
    return app.products.find(p => p.slug === slug) ||
      app.products.find(p => p.id === Number(slug)) || null;
  }, [app.products, slug]);

  if (!product) return <ProductDetailSkeleton />;

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
            const p = app.products.find(pr => pr.id === id);
            if (p) app.handleCartToggle(p.id, { silent: false });
          }}
          onCheckoutFromCart={app.handlers.handleCheckoutFromCart}
          onAddToCart={(p: any, qty: number, v: any) => app.handleAddProductToCart(p, qty, v, { silent: true })}
          productCatalog={app.products}
          categories={app.categories}
          onCategoryClick={(slug: string) => router.push(`/all-products?category=${slug}`)}
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
