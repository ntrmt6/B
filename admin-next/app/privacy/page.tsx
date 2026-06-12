'use client';

/**
 * Static Pages (Privacy, About, Terms, etc.)
 * Uses a route group to share a layout
 */
import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../providers';
import dynamic from 'next/dynamic';

const StaticPage = dynamic(() => import('@/views/StaticPage'), { ssr: false });

export default function StaticContentPage() {
  const router = useRouter();
  const app = useApp();

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 animate-pulse">
        <div className="h-16 bg-white dark:bg-gray-800 shadow" />
        <div className="max-w-4xl mx-auto px-4 py-12 space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
        </div>
      </div>
    }>
      <StaticPage
        products={app.products}
        orders={app.orders}
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
        onProductClick={(p: any) => p.slug && router.push(`/product-details/${p.slug}`)}
        wishlistCount={app.wishlist.length}
        wishlist={app.wishlist}
        onToggleWishlist={(id: number) =>
          app.handlers.isInWishlist(id) ? app.handlers.removeFromWishlist(id) : app.handlers.addToWishlist(id)
        }
        cart={app.cartItems}
        onToggleCart={(id: number) => {
          const p = app.products.find((pr: any) => pr.id === id);
          if (p) app.handleCartToggle(p.id, { silent: false });
        }}
        onCheckoutFromCart={app.handlers.handleCheckoutFromCart}
        categories={app.categories}
        subCategories={app.subCategories}
        childCategories={app.childCategories}
        brands={app.brands}
        tags={app.tags}
      />
    </Suspense>
  );
}
