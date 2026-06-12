import { Router } from 'express';
import { getDatabase } from '../db/mongo';
import { ObjectId } from 'mongodb';
import { createAuditLog } from './auditLogs';
import { getCached, setCachedWithTTL, invalidateCachePattern, CacheKeys } from '../services/redisCache';
import { extractTenantId } from '../middleware/auth';

export const incomesRouter = Router();

// Extract tenant context for all routes
incomesRouter.use(extractTenantId);

// Helper to extract tenantId from request
function getTenantId(req: any): string | null {
  return req.tenantId || req.headers['x-tenant-id'] || null;
}

// List with filters and pagination (with caching)
incomesRouter.get('/', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const col = db.collection('incomes');
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const { query, status, category, from, to } = req.query as any;
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 10);

    // Generate cache key from query params
    const cacheParams = `q=${query || ''}&s=${status || ''}&c=${category || ''}&f=${from || ''}&t=${to || ''}&p=${page}&ps=${pageSize}`;
    const cacheKey = CacheKeys.incomesList(tenantId, cacheParams);

    // Check cache first
    const cached = await getCached<{ items: any[]; total: number }>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const filter: any = {};
    filter.tenantId = tenantId;
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (query) filter.name = { $regex: String(query), $options: 'i' };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }

    // Use Promise.all for parallel execution
    const [total, rawItems] = await Promise.all([
      col.countDocuments(filter),
      col.find(filter)
        .sort({ date: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .toArray()
    ]);

    const items = rawItems.map(({ _id, ...rest }) => ({ id: String(_id), ...rest }));
    const result = { items, total };

    // Cache for 2 minutes (short TTL for dynamic data)
    setCachedWithTTL(cacheKey, result, 'short');

    res.json(result);
  } catch (e) {
    next(e);
  }
});

// Summary (with caching and aggregation for speed)
incomesRouter.get('/summary', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const col = db.collection('incomes');
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const { from, to } = req.query as any;

    // Generate cache key
    const cacheParams = `f=${from || ''}&t=${to || ''}`;
    const cacheKey = CacheKeys.incomesSummary(tenantId, cacheParams);

    // Check cache first
    const cached = await getCached<{ totalAmount: number; categories: number; totalTransactions: number }>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const matchStage: any = {};
    matchStage.tenantId = tenantId;
    if (from || to) {
      matchStage.date = {};
      if (from) matchStage.date.$gte = from;
      if (to) matchStage.date.$lte = to;
    }

    // Use aggregation pipeline for efficient calculation
    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: { $toDouble: '$amount' } },
          categories: { $addToSet: '$category' },
          totalTransactions: { $sum: 1 }
        }
      }
    ];

    const [result] = await col.aggregate(pipeline).toArray();
    const summary = result
      ? {
          totalAmount: result.totalAmount || 0,
          categories: (result.categories || []).length,
          totalTransactions: result.totalTransactions || 0
        }
      : { totalAmount: 0, categories: 0, totalTransactions: 0 };

    // Cache for 2 minutes
    setCachedWithTTL(cacheKey, summary, 'short');

    res.json(summary);
  } catch (e) {
    next(e);
  }
});

// Income categories - list
incomesRouter.get('/categories', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const col = db.collection('income_categories');
    const tenantId = getTenantId(req);
    const filter: any = {};
    if (tenantId) filter.tenantId = tenantId;
    const rawCats = await col.find(filter).sort({ name: 1 }).toArray();
    const cats = rawCats.map(({ _id, ...rest }) => ({ id: String(_id), ...rest }));
    res.json(cats);
  } catch (e) {
    next(e);
  }
});

// Income categories - create
incomesRouter.post('/categories', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const col = db.collection('income_categories');
    const tenantId = getTenantId(req);
    const { name } = req.body;
    const result = await col.insertOne({ name, tenantId, createdAt: new Date().toISOString() });
    res.status(201).json({ id: result.insertedId.toString(), name, tenantId });
  } catch (e) {
    next(e);
  }
});

// Create
incomesRouter.post('/', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const col = db.collection('incomes');
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });
    const payload = req.body;
    const result = await col.insertOne({
      ...payload,
      tenantId: tenantId,
      createdAt: new Date().toISOString(),
    });
    
    // Invalidate incomes cache for this tenant
    invalidateCachePattern(`incomes:${tenantId}`);
    
    // Create audit log for income creation
    const user = (req as any).user;
    await createAuditLog({
      tenantId: payload.tenantId,
      userId: user?._id || user?.id || 'system',
      userName: user?.name || 'System',
      userRole: user?.role || 'system',
      action: 'Income Created',
      actionType: 'create',
      resourceType: 'income',
      resourceId: result.insertedId.toString(),
      resourceName: payload.name || 'Income',
      details: `Income "${payload.name || 'Income'}" created - ৳${payload.amount}`,
      metadata: { amount: payload.amount, source: payload.source },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });
    res.status(201).json({ ...payload, id: result.insertedId.toString() });
  } catch (e) {
    next(e);
  }
});

// Update
incomesRouter.put('/:id', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const col = db.collection('incomes');
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });
    const { id } = req.params;
    const payload = req.body;
    
    let filter: any;
    try {
      filter = { _id: new ObjectId(id) };
    } catch {
      filter = { id };
    }
    filter.tenantId = tenantId;  // Always scope to tenant

    await col.updateOne(filter, {
      $set: {
        ...payload,
        updatedAt: new Date().toISOString(),
      },
    });
    
    // Invalidate incomes cache for this tenant
    invalidateCachePattern(`incomes:${tenantId}`);
    
    res.json({ ...payload, id });
  } catch (e) {
    next(e);
  }
});

// Delete
incomesRouter.delete('/:id', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const col = db.collection('incomes');
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });
    const { id } = req.params;
    
    let filter: any;
    try {
      filter = { _id: new ObjectId(id) };
    } catch {
      filter = { id };
    }
    filter.tenantId = tenantId;  // Always scope to tenant

    await col.deleteOne(filter);
    
    // Invalidate incomes cache for this tenant
    invalidateCachePattern(`incomes:${tenantId}`);
    
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

export default incomesRouter;
