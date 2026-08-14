import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { InventoryItem } from '../models/InventoryItem';
import { InventorySale } from '../models/InventorySale';
import { DailyTarget } from '../models/DailyTarget';
import { Entity } from '../models/Entity';
import { Transaction } from '../models/Transaction';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.use(requireAdmin);

const getTenantId = (req: any): string =>
  req.tenantId || (req.headers['x-tenant-id'] as string) || '';

// Local YYYY-MM-DD in shop's server time (single-tenant server, so this matches user).
const todayKey = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const dayBounds = (key: string): { from: Date; to: Date } => {
  const [y, m, d] = key.split('-').map((x) => parseInt(x, 10));
  const from = new Date(y, m - 1, d, 0, 0, 0, 0);
  const to = new Date(y, m - 1, d, 23, 59, 59, 999);
  return { from, to };
};

// ─── Items ─────────────────────────────────────────────────────────

router.get('/items', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });
    const items = await InventoryItem.find({ tenantId }).sort({ createdAt: -1 }).lean();
    res.json(items);
  } catch (e) {
    console.error('[inventory] list items', e);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

router.post('/items', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });
    const { name, unit, stockQty, buyPrice, sellPrice, lowStockThreshold, notes } = req.body || {};
    if (!name || typeof name !== 'string') return res.status(400).json({ error: 'Name required' });
    const item = await InventoryItem.create({
      tenantId,
      name: name.trim(),
      unit: typeof unit === 'string' ? unit.trim() : undefined,
      stockQty: Math.max(0, Number(stockQty) || 0),
      buyPrice: Math.max(0, Number(buyPrice) || 0),
      sellPrice: Math.max(0, Number(sellPrice) || 0),
      lowStockThreshold: Math.max(0, Number(lowStockThreshold ?? 5)),
      notes: typeof notes === 'string' ? notes : undefined,
    });
    res.status(201).json(item);
  } catch (e) {
    console.error('[inventory] create item', e);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

router.put('/items/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });
    const { name, unit, stockQty, buyPrice, sellPrice, lowStockThreshold, notes } = req.body || {};
    const update: any = {};
    if (typeof name === 'string') update.name = name.trim();
    if (typeof unit === 'string') update.unit = unit.trim();
    if (stockQty !== undefined) update.stockQty = Math.max(0, Number(stockQty) || 0);
    if (buyPrice !== undefined) update.buyPrice = Math.max(0, Number(buyPrice) || 0);
    if (sellPrice !== undefined) update.sellPrice = Math.max(0, Number(sellPrice) || 0);
    if (lowStockThreshold !== undefined) update.lowStockThreshold = Math.max(0, Number(lowStockThreshold) || 0);
    if (notes !== undefined) update.notes = String(notes).slice(0, 500);
    const item = await InventoryItem.findOneAndUpdate({ _id: req.params.id, tenantId }, update, {
      new: true,
      runValidators: true,
    });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (e) {
    console.error('[inventory] update item', e);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

router.delete('/items/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });
    const item = await InventoryItem.findOneAndDelete({ _id: req.params.id, tenantId });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ success: true });
  } catch (e) {
    console.error('[inventory] delete item', e);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// ─── Record sale ────────────────────────────────────────────────────
// Atomically: decrement stock (if enough), log sale, optionally create an
// INCOME transaction against a customer.

router.post('/sell', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });
    const {
      itemId,
      qty,
      salePrice, // optional override; falls back to item.sellPrice
      entityId,   // optional — if given, creates an INCOME transaction as a due
      dueDate,
      notes,
      status,     // optional 'Pending' | 'Paid' (default 'Pending' if entityId, else no tx)
    } = req.body || {};

    if (!itemId) return res.status(400).json({ error: 'itemId required' });
    const q = Number(qty);
    if (!q || q <= 0) return res.status(400).json({ error: 'qty must be > 0' });

    const item = await InventoryItem.findOne({ _id: itemId, tenantId });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.stockQty < q) {
      return res.status(400).json({ error: `Not enough stock (have ${item.stockQty})` });
    }

    const priceEach = salePrice !== undefined ? Math.max(0, Number(salePrice) || 0) : item.sellPrice;
    const totalSale = priceEach * q;
    const totalCost = item.buyPrice * q;
    const profit = totalSale - totalCost;

    // Atomic conditional decrement to prevent overselling under concurrency.
    const decRes = await InventoryItem.findOneAndUpdate(
      { _id: itemId, tenantId, stockQty: { $gte: q } },
      { $inc: { stockQty: -q } },
      { new: true }
    );
    if (!decRes) return res.status(409).json({ error: 'Stock changed — refresh and retry' });

    let entity = null as any;
    let transaction = null as any;
    const wantsTx = entityId && String(entityId).length > 0;
    if (wantsTx) {
      entity = await Entity.findOne({ _id: entityId, tenantId });
      if (!entity) {
        // Roll stock back if entity invalid.
        await InventoryItem.updateOne({ _id: itemId, tenantId }, { $inc: { stockQty: q } });
        return res.status(400).json({ error: 'Entity not found' });
      }
      const txStatus = status === 'Paid' ? 'Paid' : 'Pending';
      transaction = await Transaction.create({
        tenantId,
        entityId: entity._id,
        entityName: entity.name,
        amount: totalSale,
        direction: 'INCOME',
        transactionDate: new Date(),
        dueDate: dueDate ? new Date(dueDate) : undefined,
        notes,
        items: `${item.name} x ${q}${item.unit ? ' ' + item.unit : ''}`,
        transactionType: 'Inventory Sale',
        status: txStatus,
      });
      if (txStatus === 'Pending') {
        await Entity.findByIdAndUpdate(entity._id, { $inc: { totalOwedToMe: totalSale } });
      }
    }

    const sale = await InventorySale.create({
      tenantId,
      itemId: item._id,
      itemName: item.name,
      qty: q,
      salePrice: priceEach,
      buyPriceSnapshot: item.buyPrice,
      profit,
      entityId: entity?._id,
      entityName: entity?.name,
      transactionId: transaction?._id,
      soldAt: new Date(),
    });

    res.status(201).json({ sale, item: decRes, transaction });
  } catch (e) {
    console.error('[inventory] sell', e);
    res.status(500).json({ error: 'Failed to record sale' });
  }
});

// ─── Sales history ──────────────────────────────────────────────────

router.get('/sales', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });
    const { from, to, itemId, limit } = req.query;
    const filter: any = { tenantId };
    if (itemId) filter.itemId = itemId;
    if (from || to) {
      filter.soldAt = {};
      if (from) filter.soldAt.$gte = new Date(String(from));
      if (to) {
        const t = new Date(String(to));
        t.setHours(23, 59, 59, 999);
        filter.soldAt.$lte = t;
      }
    }
    const cap = Math.min(Math.max(1, parseInt(String(limit ?? '200'), 10) || 200), 1000);
    const sales = await InventorySale.find(filter).sort({ soldAt: -1 }).limit(cap).lean();
    res.json(sales);
  } catch (e) {
    console.error('[inventory] sales', e);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

router.delete('/sales/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });
    const sale = await InventorySale.findOne({ _id: req.params.id, tenantId });
    if (!sale) return res.status(404).json({ error: 'Sale not found' });

    // Restore stock.
    await InventoryItem.updateOne({ _id: sale.itemId, tenantId }, { $inc: { stockQty: sale.qty } });

    // Reverse linked transaction if it was Pending.
    if (sale.transactionId) {
      const tx = await Transaction.findOne({ _id: sale.transactionId, tenantId });
      if (tx) {
        if (tx.status === 'Pending') {
          await Entity.findByIdAndUpdate(tx.entityId, { $inc: { totalOwedToMe: -tx.amount } });
        }
        await Transaction.deleteOne({ _id: tx._id });
      }
    }

    await InventorySale.deleteOne({ _id: sale._id });
    res.json({ success: true });
  } catch (e) {
    console.error('[inventory] delete sale', e);
    res.status(500).json({ error: 'Failed to delete sale' });
  }
});

// ─── Daily target ──────────────────────────────────────────────────

router.get('/target', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });
    const date = (req.query.date as string) || todayKey();
    const t = await DailyTarget.findOne({ tenantId, date }).lean();
    res.json(t || { tenantId, date, targetSales: 0, targetProfit: 0 });
  } catch (e) {
    console.error('[inventory] get target', e);
    res.status(500).json({ error: 'Failed to fetch target' });
  }
});

router.put('/target', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });
    const { date, targetSales, targetProfit } = req.body || {};
    const key = typeof date === 'string' && date.length === 10 ? date : todayKey();
    const t = await DailyTarget.findOneAndUpdate(
      { tenantId, date: key },
      {
        $set: {
          targetSales: Math.max(0, Number(targetSales) || 0),
          targetProfit: Math.max(0, Number(targetProfit) || 0),
        },
        $setOnInsert: { tenantId, date: key },
      },
      { new: true, upsert: true }
    );
    res.json(t);
  } catch (e) {
    console.error('[inventory] set target', e);
    res.status(500).json({ error: 'Failed to save target' });
  }
});

// ─── Today's progress ──────────────────────────────────────────────

router.get('/today', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });
    const key = (req.query.date as string) || todayKey();
    const { from, to } = dayBounds(key);
    const [target, agg] = await Promise.all([
      DailyTarget.findOne({ tenantId, date: key }).lean(),
      InventorySale.aggregate([
        { $match: { tenantId, soldAt: { $gte: from, $lte: to } } },
        {
          $group: {
            _id: null,
            salesTotal: { $sum: { $multiply: ['$salePrice', '$qty'] } },
            profitTotal: { $sum: '$profit' },
            saleCount: { $sum: 1 },
            unitsSold: { $sum: '$qty' },
          },
        },
      ]),
    ]);
    const row = agg[0] || { salesTotal: 0, profitTotal: 0, saleCount: 0, unitsSold: 0 };
    res.json({
      date: key,
      targetSales: target?.targetSales || 0,
      targetProfit: target?.targetProfit || 0,
      salesTotal: row.salesTotal || 0,
      profitTotal: row.profitTotal || 0,
      saleCount: row.saleCount || 0,
      unitsSold: row.unitsSold || 0,
    });
  } catch (e) {
    console.error('[inventory] today', e);
    res.status(500).json({ error: 'Failed to fetch today progress' });
  }
});

export default router;
