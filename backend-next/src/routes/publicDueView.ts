import { Router, Request, Response } from 'express';
import { Entity } from '../models/Entity';
import { Transaction } from '../models/Transaction';
import { DueBookSettings } from '../models/DueBookSettings';

const router = Router();

const validTid = (tid: unknown): tid is string =>
  typeof tid === 'string' && /^[a-f\d]{24}$/i.test(tid);

// GET /api/public/duebook/shop?tid=TENANTID  →  { shopName, shopLogo } (public)
router.get('/public/duebook/shop', async (req: Request, res: Response) => {
  try {
    const { tid } = req.query;
    if (!validTid(tid)) return res.status(400).json({ error: 'Invalid tenant' });
    const s = await DueBookSettings.findOne({ tenantId: tid })
      .select('shopName shopLogo')
      .lean();
    res.json({ shopName: s?.shopName || '', shopLogo: s?.shopLogo || '' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/public/due-view?tid=TENANTID  →  all entities with balances
router.get('/public/due-view', async (req: Request, res: Response) => {
  try {
    const { tid } = req.query;
    if (!validTid(tid)) return res.status(400).json({ error: 'Invalid link' });
    const entities = await Entity.find({ tenantId: tid })
      .select('name phone type totalOwedToMe totalIOweThemNumber createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .lean();
    res.json(entities);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/public/due-view/transactions?tid=TENANTID&entityId=ID
router.get('/public/due-view/transactions', async (req: Request, res: Response) => {
  try {
    const { tid, entityId } = req.query;
    if (!validTid(tid)) return res.status(400).json({ error: 'Invalid link' });
    if (typeof entityId !== 'string') return res.status(400).json({ error: 'Missing entityId' });

    // Verify entity belongs to this tenant before returning transactions
    const entity = await Entity.findOne({ _id: entityId, tenantId: tid }).lean();
    if (!entity) return res.status(404).json({ error: 'Not found' });

    const transactions = await Transaction.find({ entityId, tenantId: tid })
      .select('amount direction transactionDate notes status createdAt')
      .sort({ transactionDate: 1 })
      .lean();
    res.json(transactions);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
