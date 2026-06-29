'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface StoreData {
  _id: string;
  name: string;
  subdomain: string;
  logo?: string | null;
  tagline?: string | null;
  storeUrl: string;
  trendingProducts: Array<{
    _id: string;
    name: string;
    slug: string;
    image?: string;
    price?: number;
  }>;
  trendingCategories: string[];
}

interface StoresDirectoryProps {
  stores: StoreData[];
}

/**
 * StoresDirectory - Client-side interactive grid of store cards
 *
 * Features:
 * - Responsive grid layout (1-4 columns)
 * - Store card with logo, name, tagline
 * - Trending products preview
 * - Category tags
 * - Direct links to store subdomains
 */
export default function StoresDirectory({ stores }: StoresDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter stores based on search
  const filteredStores = stores.filter((store) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      store.name.toLowerCase().includes(query) ||
      store.subdomain.toLowerCase().includes(query) ||
      store.tagline?.toLowerCase().includes(query) ||
      store.trendingCategories.some((cat) => cat.toLowerCase().includes(query))
    );
  });

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search stores by name, category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full md:w-96 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
        />
      </div>

      {/* Stores Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredStores.map((store) => (
          <StoreCard key={store._id} store={store} />
        ))}
      </div>

      {/* No Results */}
      {filteredStores.length === 0 && searchQuery && (
        <div className="text-center py-12">
          <p className="text-gray-500">No stores found matching "{searchQuery}"</p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-2 text-emerald-600 hover:underline"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
}

function StoreCard({ store }: { store: StoreData }) {
  const [imgError, setImgError] = useState(false);

  return (
    <a
      href={store.storeUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:border-emerald-300 transition-all duration-200"
    >
      {/* Store Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {/* Store Logo */}
          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            {store.logo && !imgError ? (
              <Image
                src={store.logo}
                alt={`${store.name} logo`}
                width={48}
                height={48}
                className="object-cover w-full h-full"
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="text-2xl font-bold text-gray-400">
                {store.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Store Info */}
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 truncate group-hover:text-emerald-600 transition-colors">
              {store.name}
            </h3>
            <p className="text-sm text-gray-500 truncate">
              {store.subdomain}.allinbangla.com
            </p>
          </div>
        </div>

        {/* Tagline */}
        {store.tagline && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">{store.tagline}</p>
        )}
      </div>

      {/* Trending Products Preview */}
      {store.trendingProducts.length > 0 && (
        <div className="p-3 bg-gray-50">
          <p className="text-xs text-gray-500 mb-2">Trending products</p>
          <div className="flex gap-2">
            {store.trendingProducts.slice(0, 3).map((product) => (
              <div
                key={product._id}
                className="w-12 h-12 rounded-md bg-white border border-gray-200 overflow-hidden flex-shrink-0"
              >
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400 text-xs">📦</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Tags */}
      {store.trendingCategories.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="flex flex-wrap gap-1">
            {store.trendingCategories.slice(0, 3).map((category, idx) => (
              <span
                key={idx}
                className="inline-block px-2 py-0.5 text-xs bg-emerald-50 text-emerald-700 rounded-full"
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Visit Button */}
      <div className="px-4 py-3 border-t border-gray-100">
        <span className="block w-full text-center py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium group-hover:bg-emerald-700 transition-colors">
          Visit Store →
        </span>
      </div>
    </a>
  );
}
