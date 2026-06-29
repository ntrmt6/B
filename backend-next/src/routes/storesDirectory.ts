import { Router } from 'express';
import { getDatabase } from '../db/mongo';
import { env } from '../config/env';

/**
 * Stores Directory Router
 *
 * Provides public API endpoints for the marketplace directory page
 * and XML sitemap generation at allinbangla.com
 *
 * Endpoints:
 * - GET /api/stores/directory - Fetch all active stores with metadata
 * - GET /api/stores/sitemap - Fetch store URLs for XML sitemap
 */

export const storesDirectoryRouter = Router();

// In-memory cache for sitemap (prevents DB overload during heavy crawling)
interface SitemapCache {
  data: StoreForSitemap[];
  timestamp: number;
}

let sitemapCache: SitemapCache | null = null;
const SITEMAP_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface StoreForDirectory {
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

interface StoreForSitemap {
  subdomain: string;
  url: string;
  lastModified: string;
}

/**
 * GET /api/stores/directory
 *
 * Fetches all active public tenant stores with metadata for the
 * marketplace directory page. Includes:
 * - Store name, logo, subdomain
 * - Top 3 trending products or categories
 *
 * Optimized with MongoDB aggregation pipeline for performance.
 */
storesDirectoryRouter.get('/directory', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const primaryDomain = env.primaryDomain || 'allinbangla.com';

    // Aggregation pipeline to fetch active tenants with their website config and products
    const pipeline = [
      // Stage 1: Match only active tenants (not suspended, archived, or blocked)
      {
        $match: {
          status: { $in: ['active', 'trialing'] },
          $or: [
            { 'shopStatus.isBlocked': { $ne: true } },
            { 'shopStatus.isBlocked': { $exists: false } }
          ]
        }
      },
      // Stage 2: Sort by creation date (newest first)
      {
        $sort: { createdAt: -1 as const }
      },
      // Stage 3: Limit to reasonable number for directory
      {
        $limit: 100
      },
      // Stage 4: Project only needed fields
      {
        $project: {
          _id: 1,
          name: 1,
          subdomain: 1,
          createdAt: 1
        }
      }
    ];

    const tenants = await db.collection('tenants').aggregate(pipeline).toArray();

    // Fetch website config and products for each tenant in parallel
    const storesWithMetadata: StoreForDirectory[] = await Promise.all(
      tenants.map(async (tenant) => {
        const tenantId = tenant._id.toString();

        // Fetch website config and products in parallel
        const [websiteDoc, productsDoc] = await Promise.all([
          db.collection('tenant_data').findOne(
            { tenantId, key: 'website' },
            { projection: { 'data.logo': 1, 'data.tagline': 1 } }
          ),
          db.collection('tenant_data').findOne(
            { tenantId, key: 'products' },
            { projection: { data: 1 } }
          )
        ]);

        const websiteConfig = websiteDoc?.data || {};
        const allProducts: any[] = productsDoc?.data || [];

        // Filter active products and get top 3 (by most recent or featured)
        const activeProducts = allProducts
          .filter((p: any) => p.status === 'Active' && p.name && p.slug)
          .slice(0, 3)
          .map((p: any) => ({
            _id: p._id || p.id,
            name: p.name,
            slug: p.slug,
            image: p.image || null,
            price: p.price || null
          }));

        // Extract unique categories from products (top 3)
        const categorySet = new Set<string>();
        for (const p of allProducts) {
          if (Array.isArray(p.category)) {
            p.category.forEach((c: string) => categorySet.add(c));
          } else if (p.category) {
            categorySet.add(p.category);
          }
          if (categorySet.size >= 3) break;
        }

        return {
          _id: tenantId,
          name: tenant.name,
          subdomain: tenant.subdomain,
          logo: websiteConfig.logo || null,
          tagline: websiteConfig.tagline || null,
          storeUrl: `https://${tenant.subdomain}.${primaryDomain}`,
          trendingProducts: activeProducts,
          trendingCategories: [...categorySet].slice(0, 3)
        };
      })
    );

    res.json({
      success: true,
      data: storesWithMetadata,
      count: storesWithMetadata.length,
      meta: {
        primaryDomain,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[storesDirectory] Error fetching directory:', error);
    next(error);
  }
});

/**
 * GET /api/stores/sitemap
 *
 * Returns a lightweight list of all active store URLs for XML sitemap generation.
 * Includes caching to prevent database overload during heavy search engine crawling.
 *
 * Response format optimized for sitemap.xml generation:
 * - subdomain
 * - full URL
 * - lastModified timestamp
 */
storesDirectoryRouter.get('/sitemap', async (req, res, next) => {
  try {
    const now = Date.now();
    const primaryDomain = env.primaryDomain || 'allinbangla.com';

    // Check cache first
    if (sitemapCache && (now - sitemapCache.timestamp) < SITEMAP_CACHE_TTL) {
      return res.json({
        success: true,
        data: sitemapCache.data,
        count: sitemapCache.data.length,
        cached: true,
        cacheAge: Math.round((now - sitemapCache.timestamp) / 1000)
      });
    }

    const db = await getDatabase();

    // Lightweight query for sitemap - only fetch subdomain and updatedAt
    const stores = await db.collection('tenants')
      .find(
        {
          status: { $in: ['active', 'trialing'] },
          $or: [
            { 'shopStatus.isBlocked': { $ne: true } },
            { 'shopStatus.isBlocked': { $exists: false } }
          ]
        },
        {
          projection: {
            subdomain: 1,
            updatedAt: 1,
            createdAt: 1
          }
        }
      )
      .sort({ createdAt: -1 })
      .toArray();

    const sitemapData: StoreForSitemap[] = stores.map((store) => ({
      subdomain: store.subdomain,
      url: `https://${store.subdomain}.${primaryDomain}`,
      lastModified: store.updatedAt || store.createdAt || new Date().toISOString()
    }));

    // Update cache
    sitemapCache = {
      data: sitemapData,
      timestamp: now
    };

    res.json({
      success: true,
      data: sitemapData,
      count: sitemapData.length,
      cached: false
    });
  } catch (error) {
    console.error('[storesDirectory] Error fetching sitemap data:', error);
    next(error);
  }
});

/**
 * GET /api/stores/:subdomain
 *
 * Get details for a specific store by subdomain (public endpoint)
 */
storesDirectoryRouter.get('/:subdomain', async (req, res, next) => {
  try {
    const { subdomain } = req.params;
    const db = await getDatabase();
    const primaryDomain = env.primaryDomain || 'allinbangla.com';

    const tenant = await db.collection('tenants').findOne({
      subdomain: subdomain.toLowerCase().trim(),
      status: { $in: ['active', 'trialing'] }
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Store not found'
      });
    }

    const tenantId = tenant._id.toString();

    // Fetch additional data
    const [websiteDoc, productsDoc] = await Promise.all([
      db.collection('tenant_data').findOne({ tenantId, key: 'website' }),
      db.collection('tenant_data').findOne({ tenantId, key: 'products' })
    ]);

    const websiteConfig = websiteDoc?.data || {};
    const products = (productsDoc?.data || [])
      .filter((p: any) => p.status === 'Active')
      .slice(0, 12);

    res.json({
      success: true,
      data: {
        _id: tenantId,
        name: tenant.name,
        subdomain: tenant.subdomain,
        storeUrl: `https://${tenant.subdomain}.${primaryDomain}`,
        logo: websiteConfig.logo || null,
        tagline: websiteConfig.tagline || null,
        storeName: websiteConfig.storeName || tenant.name,
        featuredProducts: products.map((p: any) => ({
          _id: p._id || p.id,
          name: p.name,
          slug: p.slug,
          image: p.image,
          price: p.price
        }))
      }
    });
  } catch (error) {
    console.error('[storesDirectory] Error fetching store:', error);
    next(error);
  }
});
