import { Router } from 'express';
import { getDatabase } from '../db/mongo';
import { ObjectId } from 'mongodb';
import { createAuditLog } from './auditLogs';
import { getCached, setCachedWithTTL, invalidateCachePattern, CacheKeys } from '../services/redisCache';
import { extractTenantId } from '../middleware/auth';

export const cashboxRouter = Router();

cashboxRouter.use(extractTenantId);

function getTenantId(req: any): string | null {
  return req.tenantId || req.headers['x-tenant-id'] || null;
}

// List cashbox transactions with filters and pagination
cashboxRouter.get('/', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const col = db.collection('cashbox_transactions');
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const { type, source, from, to, query } = req.query as any;
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 50);

    const cacheParams = `type=${type || ''}&source=${source || ''}&from=${from || ''}&to=${to || ''}&q=${query || ''}&p=${page}&ps=${pageSize}`;
    const cacheKey = CacheKeys.cashboxList(tenantId, cacheParams);

    const cached = await getCached<{ items: any[]; total: number; summary: any }>(cacheKey);
    if (cached) return res.json(cached);

    const filter: any = { tenantId };
    if (type && type !== 'all') filter.type = type;
    if (source && source !== 'all') filter.source = source;
    if (query) filter.note = { $regex: String(query), $options: 'i' };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }

    const [total, rawItems] = await Promise.all([
      col.countDocuments(filter),
      col.find(filter)
        .sort({ date: -1, createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .toArray()
    ]);

    const items = rawItems.map(({ _id, ...rest }) => ({ id: String(_id), ...rest }));

    // Calculate summary for the filtered results
    const summaryFilter: any = { tenantId };
    if (from || to) {
      summaryFilter.date = {};
      if (from) summaryFilter.date.$gte = from;
      if (to) summaryFilter.date.$lte = to;
    }

    const summaryPipeline = [
      { $match: summaryFilter },
      {
        $group: {
          _id: null,
          totalCashIn: {
            $sum: { $cond: [{ $eq: ['$type', 'cash_in'] }, { $toDouble: '$amount' }, 0] }
          },
          totalCashOut: {
            $sum: { $cond: [{ $eq: ['$type', 'cash_out'] }, { $toDouble: '$amount' }, 0] }
          },
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: { $toDouble: '$amount' } }
        }
      }
    ];

    const [summaryResult] = await col.aggregate(summaryPipeline).toArray();
    const summary = summaryResult
      ? {
          totalCashIn: summaryResult.totalCashIn || 0,
          totalCashOut: summaryResult.totalCashOut || 0,
          balance: (summaryResult.totalCashIn || 0) - (summaryResult.totalCashOut || 0),
          totalTransactions: summaryResult.totalTransactions || 0,
          totalAmount: summaryResult.totalAmount || 0,
        }
      : { totalCashIn: 0, totalCashOut: 0, balance: 0, totalTransactions: 0, totalAmount: 0 };

    const result = { items, total, summary };
    setCachedWithTTL(cacheKey, result, 'short');
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// Get summary only
cashboxRouter.get('/summary', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const col = db.collection('cashbox_transactions');
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const { from, to } = req.query as any;

    const cacheParams = `from=${from || ''}&to=${to || ''}`;
    const cacheKey = CacheKeys.cashboxSummary(tenantId, cacheParams);

    const cached = await getCached<any>(cacheKey);
    if (cached) return res.json(cached);

    const matchStage: any = { tenantId };
    if (from || to) {
      matchStage.date = {};
      if (from) matchStage.date.$gte = from;
      if (to) matchStage.date.$lte = to;
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalCashIn: {
            $sum: { $cond: [{ $eq: ['$type', 'cash_in'] }, { $toDouble: '$amount' }, 0] }
          },
          totalCashOut: {
            $sum: { $cond: [{ $eq: ['$type', 'cash_out'] }, { $toDouble: '$amount' }, 0] }
          },
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: { $toDouble: '$amount' } }
        }
      }
    ];

    const [result] = await col.aggregate(pipeline).toArray();
    const summary = result
      ? {
          totalCashIn: result.totalCashIn || 0,
          totalCashOut: result.totalCashOut || 0,
          balance: (result.totalCashIn || 0) - (result.totalCashOut || 0),
          totalTransactions: result.totalTransactions || 0,
          totalAmount: result.totalAmount || 0,
        }
      : { totalCashIn: 0, totalCashOut: 0, balance: 0, totalTransactions: 0, totalAmount: 0 };

    setCachedWithTTL(cacheKey, summary, 'short');
    res.json(summary);
  } catch (e) {
    next(e);
  }
});

// Create cashbox transaction
cashboxRouter.post('/', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const col = db.collection('cashbox_transactions');
    const payload = req.body;
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    if (!payload.type || !['cash_in', 'cash_out'].includes(payload.type)) {
      return res.status(400).json({ error: 'Type must be cash_in or cash_out' });
    }
    if (!payload.amount || Number(payload.amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const doc = {
      type: String(payload.type),
      amount: Number(payload.amount),
      source: String(payload.source || 'manual'),
      note: payload.note ? String(payload.note) : '',
      date: String(payload.date || new Date().toISOString()),
      tenantId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await col.insertOne(doc as any);

    invalidateCachePattern(`cashbox:${tenantId}`);

    const user = (req as any).user;
    try {
      await createAuditLog({
        tenantId: user?.tenantId || tenantId,
        userId: user?._id || user?.id || 'system',
        userName: user?.name || 'System',
        userRole: user?.role || 'system',
        action: `Cashbox ${doc.type === 'cash_in' ? 'Cash In' : 'Cash Out'}`,
        actionType: 'create',
        resourceType: 'cashbox',
        resourceId: String(result.insertedId),
        resourceName: `${doc.type === 'cash_in' ? 'Cash In' : 'Cash Out'} - ${doc.amount}`,
        details: `Cashbox ${doc.type === 'cash_in' ? 'Cash In' : 'Cash Out'}: ${doc.amount} (${doc.source})`,
        metadata: { amount: doc.amount, type: doc.type, source: doc.source },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'success'
      });
    } catch { /* audit log failure should not crash */ }

    res.status(201).json({ id: String(result.insertedId), ...doc });
  } catch (e) {
    next(e);
  }
});

// Update cashbox transaction
cashboxRouter.put('/:id', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const col = db.collection('cashbox_transactions');
    const { id } = req.params;
    const payload = req.body || {};
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const updates: any = { ...payload, updatedAt: new Date().toISOString() };
    delete updates._id;
    delete updates.id;
    delete updates.tenantId;

    const filter = { _id: new ObjectId(id), tenantId };
    const result = await col.updateOne(filter, { $set: updates });
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Transaction not found or access denied' });
    }
    const doc = await col.findOne({ _id: new ObjectId(id) });

    invalidateCachePattern(`cashbox:${tenantId}`);

    res.json({ id, ...doc, _id: undefined });
  } catch (e) {
    next(e);
  }
});

// Delete cashbox transaction
cashboxRouter.delete('/:id', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const col = db.collection('cashbox_transactions');
    const { id } = req.params;
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const result = await col.deleteOne({ _id: new ObjectId(id), tenantId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Transaction not found or access denied' });
    }

    invalidateCachePattern(`cashbox:${tenantId}`);

    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});
