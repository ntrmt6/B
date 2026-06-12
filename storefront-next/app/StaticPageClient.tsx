'use client';
import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from './providers';
import dynamic from 'next/dynamic';

const StaticPage = dynamic(() => import('@/views/StaticPage'), { ssr: false });

export default function StaticPageClient() {
  const router = useRouter();
  const app = useApp();

  return (
    <Suspense fallback={null}>
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
