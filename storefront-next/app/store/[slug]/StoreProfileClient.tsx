'use client';

import { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useApp } from '../../providers';
import { DataService } from '@/services/DataService';
import { Store, ArrowLeft, ExternalLink } from 'lucide-react';
import type { Product } from '@/types';

const ProductCard = dynamic(
  () => import('@/components/store/ProductCard').then(m => ({ default: m.ProductCard })),
) as React.ComponentType<any>;

interface StoreInfo {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  primaryColor: string | null;
  productCount: number;
}

export default function StoreProfileClient({ slug }: { slug: string }) {
  const router = useRouter();
  const app = useApp();
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [storeProducts, setStoreProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [stores, mpData] = await Promise.all([
          DataService.getMarketplaceStores(),
          DataService.getMarketplaceProducts({ limit: 100, store: slug }),
        ]);
        if (cancelled) return;

        const found = stores.find((s) => s.slug === slug);
        if (found) setStore(found);

        setStoreProducts((mpData.products || []) as Product[]);
      } catch (err) {
        console.error('[StoreProfile] Load error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [slug]);

  const handleProductClick = useCallback(
    (product: Product) => {
      if (product.slug) router.push(`/product-details/${product.slug}`);
    },
    [router],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading store...</div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500 text-lg">Store not found</p>
        <button onClick={() => router.push('/')} className="text-blue-600 underline">
          Back to Marketplace
        </button>
      </div>
    );
  }

  const storeUrl = `https://${store.slug}.allinbangla.com`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-[1720px] mx-auto px-4 py-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
          >
            <ArrowLeft size={16} /> Back to Marketplace
          </button>
          <div className="flex items-center gap-4">
            {store.logo ? (
              <img src={store.logo} alt={store.name} className="w-16 h-16 rounded-xl object-contain bg-gray-100 border" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Store size={28} className="text-white" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">{store.name}</h1>
              <p className="text-sm text-gray-500">{store.productCount} products</p>
            </div>
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto hidden sm:flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Visit Store <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-[1720px] mx-auto px-4 py-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          All Products from {store.name}
        </h2>
        {storeProducts.length === 0 ? (
          <p className="text-gray-400">No products available from this store yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {storeProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={handleProductClick}
                onBuyNow={app.handlers.handleCheckoutStart}
                onAddToCart={(p: Product) => app.handleAddProductToCart(p, 1)}
                wishlist={app.wishlist}
                onToggleWishlist={(id: number) =>
                  app.handlers.isInWishlist(id)
                    ? app.handlers.removeFromWishlist(id)
                    : app.handlers.addToWishlist(id)
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
