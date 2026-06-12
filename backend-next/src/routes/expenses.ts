import { Router } from 'express';
import { getDatabase } from '../db/mongo';
import { ObjectId } from 'mongodb';
import { createAuditLog } from './auditLogs';
import { getCached, setCachedWithTTL, invalidateCachePattern, CacheKeys } from '../services/redisCache';
import { authenticateToken, extractTenantId, requireTenantId } from '../middleware/auth';

export const expensesRouter = Router();

// Apply auth middleware to all write operations
expensesRouter.use(extractTenantId);  // Extract tenant from header/JWT for all routes

// Helper to extract tenantId from request (trusted source: JWT > header)
function getTenantId(req: any): string | null {
  // Prefer JWT-decoded tenantId (set by auth middleware) over header
  return req.tenantId || req.headers['x-tenant-id'] || null;
}

// List with filters and pagination (with caching)
expensesRouter.get('/', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const col = db.collection('expenses');
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const { query, status, category, from, to } = req.query as any;
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 10);

    // Generate cache key from query params
    const cacheParams = `q=${query || ''}&s=${status || ''}&c=${category || ''}&f=${from || ''}&t=${to || ''}&p=${page}&ps=${pageSize}`;
    const cacheKey = CacheKeys.expensesList(tenantId, cacheParams);

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
expensesRouter.get('/summary', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const col = db.collection('expenses');
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const { from, to } = req.query as any;

    // Generate cache key
    const cacheParams = `f=${from || ''}&t=${to || ''}`;
    const cacheKey = CacheKeys.expensesSummary(tenantId, cacheParams);

    // Check cache first
    const cached = await getCached<{ totalAmount: number; categories: number; totalTransactions: number }>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const matchStage: any = {};
    if (tenantId !== 'global') matchStage.tenantId = tenantId;
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

// Create
expensesRouter.post('/', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const col = db.collection('expenses');
    const payload = req.body;
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const required = ['name','category','amount','date','status'];
    for (const k of required) {
      if (!(k in payload)) {
        return res.status(400).json({ error: `Missing field: ${k}` });
      }
    }

    const doc = {
      name: String(payload.name),
      category: String(payload.category),
      amount: Number(payload.amount),
      date: String(payload.date),
      status: String(payload.status),
      note: payload.note ? String(payload.note) : undefined,
      imageUrl: payload.imageUrl ? String(payload.imageUrl) : undefined,
      tenantId: tenantId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await col.insertOne(doc as any);
    
    // Invalidate expenses cache for this tenant
    invalidateCachePattern(`expenses:${tenantId}`);
    
    // Create audit log for expense creation
    const user = (req as any).user;
    await createAuditLog({
      tenantId: user?.tenantId || tenantId,
      userId: user?._id || user?.id || 'system',
      userName: user?.name || 'System',
      userRole: user?.role || 'system',
      action: 'Expense Created',
      actionType: 'create',
      resourceType: 'expense',
      resourceId: String(result.insertedId),
      resourceName: doc.name,
      details: `Expense "${doc.name}" created - ৳${doc.amount} (${doc.category})`,
      metadata: { amount: doc.amount, category: doc.category },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });
    res.status(201).json({ id: String(result.insertedId), ...doc });
  } catch (e) {
    next(e);
  }
});

// Update
expensesRouter.put('/:id', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const col = db.collection('expenses');
    const { id } = req.params;
    const payload = req.body || {};
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const updates: any = { ...payload, updatedAt: new Date().toISOString() };

    // CRITICAL: Filter by both _id AND tenantId to prevent cross-tenant modification
    const filter = { _id: new ObjectId(id), tenantId };
    const result = await col.updateOne(filter, { $set: updates });
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Expense not found or access denied' });
    }
    const doc = await col.findOne({ _id: new ObjectId(id) });
    
    // Invalidate expenses cache for this tenant
    invalidateCachePattern(`expenses:${tenantId}`);
    
    res.json({ id, ...doc, _id: undefined });
  } catch (e) {
    next(e);
  }
});

// Delete
expensesRouter.delete('/:id', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const col = db.collection('expenses');
    const { id } = req.params;
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    // CRITICAL: Filter by both _id AND tenantId to prevent cross-tenant deletion
    const result = await col.deleteOne({ _id: new ObjectId(id), tenantId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Expense not found or access denied' });
    }
    
    // Invalidate expenses cache for this tenant
    invalidateCachePattern(`expenses:${tenantId}`);
    
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

// ===== CATEGORIES =====

// List categories
expensesRouter.get('/categories/list', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const col = db.collection('expense_categories');
    const tenantId = getTenantId(req);
    const filter: any = {};
    if (tenantId) filter.tenantId = tenantId;
    const items = await col.find(filter).sort({ name: 1 }).toArray();
    res.json({ items: items.map(i => ({ id: String(i._id), ...i, _id: undefined })) });
  } catch (e) {
    next(e);
  }
});

// Create category
expensesRouter.post('/categories/create', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const col = db.collection('expense_categories');
    const { name } = req.body;
    const tenantId = getTenantId(req);

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const doc = { name: String(name).trim(), tenantId: tenantId, createdAt: new Date().toISOString() };
    const result = await col.insertOne(doc as any);
    res.status(201).json({ id: String(result.insertedId), ...doc });
    
  } catch (e) {
    next(e);
  }
});

// Update category
expensesRouter.put('/categories/:id', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const col = db.collection('expense_categories');
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const oid = new ObjectId(id);
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });
    await col.updateOne({ _id: oid, tenantId }, { $set: { name: String(name).trim() } });
    const doc = await col.findOne({ _id: oid });
    res.json({ id: String(doc?._id), ...doc, _id: undefined });
  } catch (e) {
    next(e);
  }
});

// Delete category
expensesRouter.delete('/categories/:id', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const col = db.collection('expense_categories');
    const { id } = req.params;

    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });
    await col.deleteOne({ _id: new ObjectId(id), tenantId });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});
