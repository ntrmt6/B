import { Router, Request, Response, NextFunction } from 'express';
import { Entity, IEntity } from '../models/Entity';
import { Transaction, ITransaction } from '../models/Transaction';
import { DueBookSettings } from '../models/DueBookSettings';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// All due list routes require authentication
router.use(authenticateToken);
router.use(requireAdmin);

// Helper to get tenantId from request
const getTenantId = (req: any): string => {
  return req.tenantId || (req.headers['x-tenant-id'] as string) || '';
};

// ============ ENTITY ENDPOINTS ============

// GET all entities by type with optional search (filtered by tenant)
router.get('/entities', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { type, search } = req.query;
    const filter: any = { tenantId };

    if (type) filter.type = type;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const entities = await Entity.find(filter).sort({ createdAt: -1 }).lean();
    res.json(entities);
  } catch (error) {
    console.error('Error fetching entities:', error);
    res.status(500).json({ error: 'Error fetching entities' });
  }
});

// GET single entity with summary
router.get('/entities/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const entity = await Entity.findOne({ _id: req.params.id, tenantId }).lean();
    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' });
    }
    res.json(entity);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching entity' });
  }
});

// POST create new entity
router.post('/entities', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { name, phone, email, address, type } = req.body;

    // Validate required fields
    if (!name || !phone || !type) {
      return res.status(400).json({ error: 'Missing required fields: name, phone, type' });
    }

    // Check if entity already exists for this tenant
    const existing = await Entity.findOne({ tenantId, phone });
    if (existing) {
      return res.status(400).json({ error: 'Entity with this phone already exists' });
    }

    const entity = new Entity({
      tenantId,
      name,
      phone,
      email,
      address,
      type,
      totalOwedToMe: 0,
      totalIOweThemNumber: 0,
    });

    await entity.save();
    res.status(201).json(entity);
  } catch (error) {
    console.error('Error creating entity:', error);
    res.status(500).json({ error: 'Error creating entity' });
  }
});

// PUT update entity
router.put('/entities/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { name, phone, email, address, type } = req.body;
    
    const entity = await Entity.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      { name, phone, email, address, type },
      { new: true, runValidators: true }
    );

    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    res.json(entity);
  } catch (error) {
    console.error('Error updating entity:', error);
    res.status(500).json({ error: 'Error updating entity' });
  }
});

// DELETE entity
router.delete('/entities/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    // Check if entity has transactions
    const transactionCount = await Transaction.countDocuments({ 
      tenantId, 
      entityId: req.params.id 
    });
    
    if (transactionCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete entity with existing transactions. Delete transactions first.' 
      });
    }

    const entity = await Entity.findOneAndDelete({ _id: req.params.id, tenantId });
    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    res.json({ success: true, message: 'Entity deleted successfully' });
  } catch (error) {
    console.error('Error deleting entity:', error);
    res.status(500).json({ error: 'Error deleting entity' });
  }
});

// POST claim a payment-milestone reward (increments rewardsClaimed by 1)
router.post('/entities/:id/claim-reward', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });

    const entity = await Entity.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      { $inc: { rewardsClaimed: 1 } },
      { new: true }
    );
    if (!entity) return res.status(404).json({ error: 'Entity not found' });
    res.json(entity);
  } catch (error) {
    console.error('Error claiming reward:', error);
    res.status(500).json({ error: 'Error claiming reward' });
  }
});

// PATCH reset rewardsClaimed (e.g. to skip past milestones) — body: { rewardsClaimed: number }
router.patch('/entities/:id/rewards-claimed', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });
    const { rewardsClaimed } = req.body || {};
    if (typeof rewardsClaimed !== 'number' || rewardsClaimed < 0) {
      return res.status(400).json({ error: 'rewardsClaimed must be a non-negative number' });
    }
    const entity = await Entity.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      { rewardsClaimed: Math.floor(rewardsClaimed) },
      { new: true }
    );
    if (!entity) return res.status(404).json({ error: 'Entity not found' });
    res.json(entity);
  } catch (error) {
    console.error('Error resetting rewards claimed:', error);
    res.status(500).json({ error: 'Error resetting rewards claimed' });
  }
});

// ============ DUEBOOK SETTINGS (self-registration + bonus) ============

router.get('/duebook/settings', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });
    const settings = await DueBookSettings.findOne({ tenantId }).lean();
    res.json(
      settings || {
        tenantId,
        shopName: '',
        registrationEnabled: false,
        bonusAmount: 0,
        rewardItemName: '',
        rewardItemPrice: 0,
        paymentRewardThreshold: 0,
        welcomeMessage: '',
      }
    );
  } catch (error) {
    console.error('Error fetching duebook settings:', error);
    res.status(500).json({ error: 'Error fetching settings' });
  }
});

router.put('/duebook/settings', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });

    const { shopName, registrationEnabled, bonusAmount, rewardItemName, rewardItemPrice, paymentRewardThreshold, welcomeMessage, shopLogo } = req.body || {};
    const update: any = {};
    if (typeof shopName === 'string') update.shopName = shopName.trim().slice(0, 120);
    if (typeof registrationEnabled === 'boolean') update.registrationEnabled = registrationEnabled;
    if (typeof bonusAmount === 'number' && bonusAmount >= 0) update.bonusAmount = bonusAmount;
    if (typeof rewardItemName === 'string') update.rewardItemName = rewardItemName.trim().slice(0, 100);
    if (typeof rewardItemPrice === 'number' && rewardItemPrice >= 0) update.rewardItemPrice = rewardItemPrice;
    if (typeof paymentRewardThreshold === 'number' && paymentRewardThreshold >= 0) update.paymentRewardThreshold = paymentRewardThreshold;
    if (typeof welcomeMessage === 'string') update.welcomeMessage = welcomeMessage.trim().slice(0, 300);
    if (typeof shopLogo === 'string' && shopLogo.length <= 300000) update.shopLogo = shopLogo;

    const settings = await DueBookSettings.findOneAndUpdate(
      { tenantId },
      { $set: update, $setOnInsert: { tenantId } },
      { new: true, upsert: true, runValidators: true }
    );
    res.json(settings);
  } catch (error) {
    console.error('Error saving duebook settings:', error);
    res.status(500).json({ error: 'Error saving settings' });
  }
});

// ============ TRANSACTION ENDPOINTS ============

// GET transactions for an entity with date range filter
router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { entityId, from, to, status } = req.query;
    const filter: any = { tenantId };

    if (entityId) filter.entityId = entityId;
    if (status) filter.status = status;

    if (from || to) {
      filter.transactionDate = {};
      if (from) filter.transactionDate.$gte = new Date(from as string);
      if (to) {
        const toDate = new Date(to as string);
        toDate.setHours(23, 59, 59, 999);
        filter.transactionDate.$lte = toDate;
      }
    }

    const transactions = await Transaction.find(filter)
      .sort({ transactionDate: -1 })
      .lean();

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching transactions' });
  }
});

// GET single transaction
router.get('/transactions/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const transaction = await Transaction.findOne({ _id: req.params.id, tenantId }).lean();
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching transaction' });
  }
});

// POST create new transaction
router.post('/transactions', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { entityId, entityName, amount, direction, transactionDate, dueDate, notes, items, transactionType } = req.body;

    // Validate required fields
    if (!entityId || !amount || !direction || !transactionDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify entity exists and belongs to this tenant
    const entity = await Entity.findOne({ _id: entityId, tenantId });
    if (!entity) {
      return res.status(400).json({ error: 'Entity not found' });
    }

    const transaction = new Transaction({
      tenantId,
      entityId,
      entityName: entityName || entity.name,
      amount,
      direction,
      transactionDate: new Date(transactionDate),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      notes,
      items,
      transactionType,
      status: 'Pending',
    });

    await transaction.save();

    // Atomically update entity totals to prevent race conditions
    const incField = direction === 'INCOME' ? 'totalOwedToMe' : 'totalIOweThemNumber';
    await Entity.findByIdAndUpdate(entityId, { $inc: { [incField]: amount } });

    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Error creating transaction' });
  }
});

// PATCH update transaction status
router.patch('/transactions/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { status } = req.body;
    const transaction = await Transaction.findOne({ _id: req.params.id, tenantId });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const oldStatus = transaction.status;
    const oldAmount = transaction.amount;
    const direction = transaction.direction;

    // Atomically update entity totals based on status change
    const incField = direction === 'INCOME' ? 'totalOwedToMe' : 'totalIOweThemNumber';
    let delta = 0;
    if (oldStatus === 'Pending') delta -= oldAmount; // reverse old
    if (status === 'Pending') delta += oldAmount;    // apply new
    if (delta !== 0) {
      await Entity.findByIdAndUpdate(transaction.entityId, { $inc: { [incField]: delta } });
    }

    transaction.status = status;
    await transaction.save();

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Error updating transaction' });
  }
});

// DELETE transaction
router.delete('/transactions/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, tenantId });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Atomically reverse entity totals on delete
    if (transaction.status === 'Pending') {
      const decField = transaction.direction === 'INCOME' ? 'totalOwedToMe' : 'totalIOweThemNumber';
      await Entity.findByIdAndUpdate(transaction.entityId, { $inc: { [decField]: -transaction.amount } });
    }

    res.json({ success: true, message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting transaction' });
  }
});

export default router;
