import { Router } from 'express';
import { z } from 'zod';
import { getDatabase } from '../db/mongo';
import { getCached, setCachedWithTTL } from '../services/redisCache';

export const marketplaceRouter = Router();

// ─── Types ────────────────────────────────────────────────────────────────────

interface TenantDoc {
  _id: any;
  name: string;
  subdomain: string;
  status: string;
  branding?: { logo?: string; primaryColor?: string };
}

interface SlimMarketplaceProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  image?: string;
  thumbnail?: string;
  galleryImages?: string[];
  category?: string;
  subCategory?: string;
  brand?: string;
  tags?: string[];
  stock?: number;
  status?: string;
  rating?: number;
  reviews?: number;
  flashSale?: boolean;
  flashSalePrice?: number;
  flashSaleStart?: string;
  flashSaleEnd?: string;
  description?: string;
  vendorId?: string;
  vendorName?: string;
  // Marketplace enrichment
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
}

// Fields to pick from each product document
const MARKETPLACE_PRODUCT_FIELDS = [
  'id', 'name', 'slug', 'price', 'originalPrice',
  'image', 'thumbnail', 'galleryImages',
  'category', 'subCategory', 'brand', 'tags',
  'stock', 'status', 'rating', 'reviews',
  'flashSale', 'flashSalePrice', 'flashSaleStart', 'flashSaleEnd',
  'description', 'vendorId', 'vendorName',
] as const;

// ─── Query schemas ────────────────────────────────────────────────────────────

const productsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(40),
  search: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  store: z.string().optional(),
  sort: z.enum(['newest', 'price-low', 'price-high', 'rating', 'popular']).default('newest'),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Get all active tenants from the `tenants` collection. */
async function getActiveTenants(): Promise<TenantDoc[]> {
  const cacheKey = 'marketplace:active_tenants';
  const cached = await getCached<TenantDoc[]>(cacheKey);
  if (cached) return cached;

  const db = await getDatabase();
  const tenants = await db
    .collection('tenants')
    .find({ status: { $in: ['active', 'trialing'] } })
    .project({ _id: 1, name: 1, subdomain: 1, status: 1, branding: 1 })
    .toArray() as unknown as TenantDoc[];

  await setCachedWithTTL(cacheKey, tenants, 'medium'); // ~2 min cache
  return tenants;
}

/** Fetch products for a single tenant from tenant_data collection. */
async function getTenantProducts(
  db: any,
  tenantId: string,
): Promise<Record<string, unknown>[]> {
  const doc = await db
    .collection('tenant_data')
    .findOne(
      { tenantId, key: 'products' },
      { projection: { data: 1, _id: 0 } },
    );
  if (!doc?.data || !Array.isArray(doc.data)) return [];
  return doc.data;
}

// ─── Shared: fetch and cache all enriched marketplace products ─────────────────

async function getAllMarketplaceProducts(): Promise<SlimMarketplaceProduct[]> {
  const cacheKey = 'marketplace:all_products';
  const cached = await getCached<SlimMarketplaceProduct[]>(cacheKey);
  if (cached) return cached;

  const tenants = await getActiveTenants();
  if (tenants.length === 0) return [];

  const db = await getDatabase();

  // Fetch products from ALL active tenants in parallel
  const tenantProducts = await Promise.all(
    tenants.map(async (tenant) => {
      const tenantId = tenant._id.toString();
      const products = await getTenantProducts(db, tenantId);
      return { tenant, tenantId, products };
    }),
  );

  // Flatten & enrich products with tenant info
  const allProducts: SlimMarketplaceProduct[] = [];
  for (const { tenant, tenantId, products } of tenantProducts) {
    for (const p of products) {
      // Only include active products
      const status = (p.status as string | undefined)?.toLowerCase();
      if (status && status !== 'active') continue;

      const slim: Record<string, unknown> = {};
      for (const field of MARKETPLACE_PRODUCT_FIELDS) {
        if (p[field] !== undefined) slim[field] = p[field];
      }

      allProducts.push({
        ...(slim as any),
        tenantId,
        tenantName: tenant.name,
        tenantSlug: tenant.subdomain,
      });
    }
  }

  // Cache the full product list for 60 seconds (short TTL)
  await setCachedWithTTL(cacheKey, allProducts, 'short');
  return allProducts;
}

// ─── GET /api/marketplace/products ────────────────────────────────────────────

marketplaceRouter.get('/products', async (req, res, next) => {
  try {
    const query = productsQuerySchema.parse(req.query);
    const { page, limit, search, category, brand, store, sort } = query;

    // Fetch all products (cached for 60s)
    let allProducts = await getAllMarketplaceProducts();

    // ── Filters ──

    if (store) {
      const st = store.toLowerCase();
      allProducts = allProducts.filter(
        (p) => p.tenantSlug?.toLowerCase() === st,
      );
    }

    if (search) {
      const term = search.toLowerCase();
      allProducts = allProducts.filter(
        (p) =>
          p.name?.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term) ||
          p.category?.toLowerCase().includes(term) ||
          p.brand?.toLowerCase().includes(term),
      );
    }

    if (category) {
      const cat = category.toLowerCase();
      allProducts = allProducts.filter(
        (p) => p.category?.toLowerCase() === cat,
      );
    }

    if (brand) {
      const br = brand.toLowerCase();
      allProducts = allProducts.filter(
        (p) => p.brand?.toLowerCase() === br,
      );
    }

    // ── Sort ──

    switch (sort) {
      case 'price-low':
        allProducts = [...allProducts].sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-high':
        allProducts = [...allProducts].sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'rating':
        allProducts = [...allProducts].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'popular':
        allProducts = [...allProducts].sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
        break;
      case 'newest':
      default:
        break;
    }

    // ── Paginate ──

    const total = allProducts.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paged = allProducts.slice(start, start + limit);

    const result = { products: paged, total, page, totalPages };

    res.set({ 'Cache-Control': 'public, max-age=30, stale-while-revalidate=60' });
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/marketplace/stores ──────────────────────────────────────────────

marketplaceRouter.get('/stores', async (req, res, next) => {
  try {
    const cacheKey = 'marketplace:stores';
    const cached = await getCached<TenantDoc[]>(cacheKey);
    if (cached) {
      res.set({ 'Cache-Control': 'public, max-age=60, stale-while-revalidate=120' });
      return res.json({ data: cached });
    }

    const tenants = await getActiveTenants();

    // Enrich with product count per store
    const db = await getDatabase();
    const stores = await Promise.all(
      tenants.map(async (t) => {
        const tenantId = t._id.toString();
        const products = await getTenantProducts(db, tenantId);
        const activeCount = products.filter(
          (p) => !p.status || (p.status as string).toLowerCase() === 'active',
        ).length;
        return {
          id: tenantId,
          name: t.name,
          slug: t.subdomain,
          logo: t.branding?.logo || null,
          primaryColor: t.branding?.primaryColor || null,
          productCount: activeCount,
        };
      }),
    );

    await setCachedWithTTL(cacheKey, stores, 'medium');

    res.set({ 'Cache-Control': 'public, max-age=60, stale-while-revalidate=120' });
    res.json({ data: stores });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/marketplace/categories ──────────────────────────────────────────

marketplaceRouter.get('/categories', async (req, res, next) => {
  try {
    const cacheKey = 'marketplace:categories';
    const cached = await getCached<any[]>(cacheKey);
    if (cached) {
      res.set({ 'Cache-Control': 'public, max-age=60, stale-while-revalidate=120' });
      return res.json({ data: cached });
    }

    const tenants = await getActiveTenants();
    const db = await getDatabase();

    // Collect categories from all tenants, deduplicating by lowercase name
    const categoryMap = new Map<string, { name: string; slug: string; image?: string; count: number }>();

    for (const t of tenants) {
      const tenantId = t._id.toString();
      const doc = await db
        .collection('tenant_data')
        .findOne({ tenantId, key: 'categories' }, { projection: { data: 1, _id: 0 } });
      if (!doc?.data || !Array.isArray(doc.data)) continue;

      for (const cat of doc.data) {
        if (!cat.name) continue;
        const key = (cat.name as string).toLowerCase();
        const existing = categoryMap.get(key);
        if (existing) {
          existing.count++;
        } else {
          categoryMap.set(key, {
            name: cat.name,
            slug: cat.slug || key.replace(/\s+/g, '-'),
            image: cat.image,
            count: 1,
          });
        }
      }
    }

    const categories = [...categoryMap.values()].sort((a, b) => b.count - a.count);

    await setCachedWithTTL(cacheKey, categories, 'medium');

    res.set({ 'Cache-Control': 'public, max-age=60, stale-while-revalidate=120' });
    res.json({ data: categories });
  } catch (error) {
    next(error);
  }
});
