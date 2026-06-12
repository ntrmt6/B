import { Router, Request, Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { getDatabase } from '../db/mongo';
import { getCached, setCachedWithTTL, invalidateCachePattern } from '../services/redisCache';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// All purchase routes require authentication
router.use(authenticateToken);
router.use(requireAdmin);

// Cache key generators for purchases
const PurchaseCacheKeys = {
  list: (tenantId: string, params: string) => `purchases:${tenantId}:list:${params}`,
  summary: (tenantId: string) => `purchases:${tenantId}:summary`,
};

// GET all purchases for tenant with pagination and caching
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId || req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { startDate, endDate, page = '1', pageSize = '50' } = req.query as any;
    const pageNum = Number(page);
    const limit = Math.min(Number(pageSize), 100); // Cap at 100

    // Generate cache key
    const cacheParams = `sd=${startDate || ''}&ed=${endDate || ''}&p=${pageNum}&ps=${limit}`;
    const cacheKey = PurchaseCacheKeys.list(tenantId, cacheParams);

    // Check cache first
    const cached = await getCached<{ items: any[]; total: number }>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const db = await getDatabase();
    const filter: any = { tenantId };

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    // Use Promise.all for parallel execution
    const [total, purchases] = await Promise.all([
      db.collection('purchases').countDocuments(filter),
      db.collection('purchases')
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limit)
        .limit(limit)
        .toArray()
    ]);

    const result = { items: purchases, total };

    // Cache for 2 minutes
    setCachedWithTTL(cacheKey, result, 'short');

    res.json(result);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    next(error);
  }
});

// GET single purchase by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId || req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const db = await getDatabase();
    const purchase = await db.collection('purchases').findOne({
      _id: new ObjectId(req.params.id),
      tenantId
    });

    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    res.json(purchase);
  } catch (error) {
    console.error('Error fetching purchase:', error);
    next(error);
  }
});

// GET purchase summary (totals, counts) with caching
router.get('/summary/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId || req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    // Check cache first
    const cacheKey = PurchaseCacheKeys.summary(tenantId);
    const cached = await getCached<{ totalPurchases: number; totalAmount: number; totalItems: number }>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const db = await getDatabase();
    const summary = await db.collection('purchases').aggregate([
      { $match: { tenantId } },
      {
        $group: {
          _id: null,
          totalPurchases: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          totalItems: { $sum: { $size: '$items' } }
        }
      }
    ]).toArray();

    const result = summary[0] || { totalPurchases: 0, totalAmount: 0, totalItems: 0 };

    // Cache for 2 minutes
    setCachedWithTTL(cacheKey, result, 'short');

    res.json(result);
  } catch (error) {
    console.error('Error fetching purchase summary:', error);
    next(error);
  }
});

// POST create new purchase
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId || req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { items, totalAmount, note, supplierName, paymentMethod } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    const db = await getDatabase();
    
    // Generate purchase number
    const lastPurchase = await db.collection('purchases')
      .findOne({ tenantId }, { sort: { createdAt: -1 } });
    
    const purchaseNumber = lastPurchase 
      ? `PUR-${String(parseInt((lastPurchase.purchaseNumber || 'PUR-0').split('-')[1]) + 1).padStart(6, '0')}`
      : 'PUR-000001';

    const purchase = {
      tenantId,
      purchaseNumber,
      items: items.map((item: any) => ({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku || '',
        barcode: item.barcode || '',
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.quantity) * Number(item.unitPrice),
        batchNo: item.batchNo || '',
        expireDate: item.expireDate || null,
        image: item.image || ''
      })),
      totalAmount: Number(totalAmount),
      supplierName: supplierName || '',
      paymentMethod: paymentMethod || 'cash',
      note: note || '',
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('purchases').insertOne(purchase);

    // Update product stock for each item
    for (const item of items) {
      if (item.productId) {
        await db.collection('products').updateOne(
          { _id: new ObjectId(item.productId), tenantId },
          { 
            $inc: { stock: Number(item.quantity) },
            $set: { updatedAt: new Date() }
          }
        );
      }
    }

    // Invalidate cache
    invalidateCachePattern(`purchases:${tenantId}:*`);

    res.status(201).json({ 
      ...purchase, 
      _id: result.insertedId,
      message: 'Purchase created successfully' 
    });
  } catch (error) {
    console.error('Error creating purchase:', error);
    res.status(500).json({ error: 'Failed to create purchase' });
  }
});

// PUT update purchase
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { items, totalAmount, note, supplierName, paymentMethod, status } = req.body;
    const db = await getDatabase();

    const existingPurchase = await db.collection('purchases').findOne({
      _id: new ObjectId(req.params.id),
      tenantId
    });

    if (!existingPurchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    const updateData: any = {
      updatedAt: new Date()
    };

    if (items) updateData.items = items;
    if (totalAmount !== undefined) updateData.totalAmount = Number(totalAmount);
    if (note !== undefined) updateData.note = note;
    if (supplierName !== undefined) updateData.supplierName = supplierName;
    if (paymentMethod) updateData.paymentMethod = paymentMethod;
    if (status) updateData.status = status;

    await db.collection('purchases').updateOne(
      { _id: new ObjectId(req.params.id), tenantId },
      { $set: updateData }
    );

    // Invalidate cache
    invalidateCachePattern(`purchases:${tenantId}:*`);

    res.json({ message: 'Purchase updated successfully' });
  } catch (error) {
    console.error('Error updating purchase:', error);
    res.status(500).json({ error: 'Failed to update purchase' });
  }
});

// DELETE purchase
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const db = await getDatabase();
    
    const purchase = await db.collection('purchases').findOne({
      _id: new ObjectId(req.params.id),
      tenantId
    });

    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    // Reverse stock updates
    for (const item of purchase.items) {
      if (item.productId) {
        await db.collection('products').updateOne(
          { _id: new ObjectId(item.productId), tenantId },
          { 
            $inc: { stock: -Number(item.quantity) },
            $set: { updatedAt: new Date() }
          }
        );
      }
    }

    await db.collection('purchases').deleteOne({
      _id: new ObjectId(req.params.id),
      tenantId
    });

    // Invalidate cache
    invalidateCachePattern(`purchases:${tenantId}:*`);

    res.json({ message: 'Purchase deleted successfully' });
  } catch (error) {
    console.error('Error deleting purchase:', error);
    res.status(500).json({ error: 'Failed to delete purchase' });
  }
});

export default router;
