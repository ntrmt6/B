import type { Metadata } from 'next';
import { headers } from 'next/headers';
import StoresDirectory from './StoresDirectory';
import { PoweredByFooter } from '../components/seo';

/**
 * Stores Directory Page - /stores
 *
 * Public marketplace directory aggregating all active tenant stores.
 * Optimized for SEO with localized meta tags for Bangladesh market.
 */

export const revalidate = 300; // ISR: 5 minutes

// SEO-optimized metadata for Bangladesh market
export const metadata: Metadata = {
  title: 'Discover Top Online Stores in Bangladesh | AllInBangla',
  description:
    'Browse and discover the best online stores in Bangladesh. Shop from verified sellers offering fashion, electronics, groceries, and more. Find your perfect store on AllInBangla marketplace.',
  keywords: [
    'online stores bangladesh',
    'e-commerce bangladesh',
    'online shopping bd',
    'best online shops bangladesh',
    'AllInBangla stores',
    'বাংলাদেশ অনলাইন শপ',
    'অনলাইন শপিং',
  ],
  openGraph: {
    title: 'Discover Top Online Stores in Bangladesh | AllInBangla',
    description:
      'Browse and discover the best online stores in Bangladesh. Shop from verified sellers on AllInBangla marketplace.',
    type: 'website',
    locale: 'bn_BD',
    alternateLocale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Discover Top Online Stores in Bangladesh',
    description: 'Browse the best online stores on AllInBangla marketplace.',
  },
  alternates: {
    canonical: 'https://allinbangla.com/stores',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

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

async function fetchStores(): Promise<StoreData[]> {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5555';
    const response = await fetch(`${apiBase}/api/stores/directory`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      console.error('[StoresPage] Failed to fetch stores:', response.status);
      return [];
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('[StoresPage] Error fetching stores:', error);
    return [];
  }
}

export default async function StoresPage() {
  const stores = await fetchStores();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header Section */}
      <header className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-12 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Discover Top Online Stores in Bangladesh
          </h1>
          <p className="text-lg text-emerald-100 max-w-2xl mx-auto">
            Browse verified sellers offering fashion, electronics, groceries, and more.
            Find your perfect store on AllInBangla marketplace.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Store Count */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-gray-600">
              <span className="font-semibold text-gray-900">{stores.length}</span> active stores
            </p>
          </div>

          {/* Stores Grid */}
          <StoresDirectory stores={stores} />

          {/* Empty State */}
          {stores.length === 0 && (
            <div className="text-center py-16">
              <div className="text-gray-400 text-6xl mb-4">🏪</div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">No stores found</h2>
              <p className="text-gray-500">Check back soon for new stores.</p>
            </div>
          )}
        </div>
      </main>

      {/* SEO Footer with Platform Backlink */}
      <PoweredByFooter />

      {/* Schema.org Structured Data for Store Listing */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'Top Online Stores in Bangladesh',
            description: 'Directory of verified online stores on AllInBangla marketplace',
            url: 'https://allinbangla.com/stores',
            numberOfItems: stores.length,
            itemListElement: stores.slice(0, 20).map((store, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              item: {
                '@type': 'Store',
                name: store.name,
                url: store.storeUrl,
                ...(store.logo && { image: store.logo }),
                ...(store.tagline && { description: store.tagline }),
              },
            })),
          }),
        }}
      />
    </div>
  );
}
