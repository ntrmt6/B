import { Router, Request, Response, NextFunction } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { Entity, IEntity } from '../models/Entity';
import { Transaction, ITransaction } from '../models/Transaction';
import { DueBookSettings } from '../models/DueBookSettings';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

const PARSER_SCRIPT = path.resolve(__dirname, '../../scripts/parse_duebook_intent.py');

function runParser(payload: unknown, timeoutMs = 4000): Promise<any> {
  return new Promise((resolve, reject) => {
    const proc = spawn('python3', [PARSER_SCRIPT], { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    const timer = setTimeout(() => {
      proc.kill('SIGKILL');
      reject(new Error('parser timeout'));
    }, timeoutMs);
    proc.stdout.on('data', (d) => { out += d.toString(); });
    proc.stderr.on('data', (d) => { err += d.toString(); });
    proc.on('error', (e) => { clearTimeout(timer); reject(e); });
    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0 && !out) return reject(new Error(err || `parser exited ${code}`));
      try { resolve(JSON.parse(out)); }
      catch (e) { reject(new Error('parser bad output')); }
    });
    try {
      proc.stdin.write(JSON.stringify(payload));
      proc.stdin.end();
    } catch (e) {
      clearTimeout(timer);
      reject(e as Error);
    }
  });
}

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

    const { name, phone, email, address, type, profilePicture } = req.body;

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
      profilePicture: typeof profilePicture === 'string' && profilePicture.length <= 300000 ? profilePicture : '',
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

    const { name, phone, email, address, type, profilePicture } = req.body;

    const update: any = {};
    if (typeof name === 'string') update.name = name;
    if (typeof phone === 'string') update.phone = phone;
    if (email !== undefined) update.email = email;
    if (address !== undefined) update.address = address;
    if (typeof type === 'string') update.type = type;
    if (typeof profilePicture === 'string' && profilePicture.length <= 300000) update.profilePicture = profilePicture;

    const entity = await Entity.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      update,
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

    const { entityId, entityName, amount, direction, transactionDate, dueDate, notes, items, transactionType, photo } = req.body;

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
      photo: typeof photo === 'string' && photo.length <= 300000 ? photo : '',
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

// ============ AI INTENT PARSE ============

// ============ SITUATION COACH ============
// Real-time action guide for stressful shop-floor moments.
// Built-in templates cover the common chip scenarios and always respond instantly.
// A "custom" free-text situation returns a generic-but-safe fallback so the
// feature works offline. Extend with an LLM call later if desired.

type CoachPlan = {
  id: string;
  title: string;
  titleBn: string;
  tone: 'calm' | 'firm' | 'friendly' | 'focused';
  immediate: { icon: 'pause'; text: string; textBn: string };
  script: { icon: 'say'; text: string; textBn: string };
  action: { icon: 'do'; text: string; textBn: string };
};

const COACH_TEMPLATES: Record<string, CoachPlan> = {
  short_temper: {
    id: 'short_temper',
    title: 'Short Temper',
    titleBn: 'মাথা গরম হচ্ছে',
    tone: 'calm',
    immediate: {
      icon: 'pause',
      text: 'Inhale 4s, exhale 6s. Do not reply for 3 seconds.',
      textBn: '৪ সেকেন্ড শ্বাস নিন, ৬ সেকেন্ড ছাড়ুন। ৩ সেকেন্ড কথা বলবেন না।',
    },
    script: {
      icon: 'say',
      text: 'One moment please, let me check.',
      textBn: 'এক মিনিট ভাই, দেখছি।',
    },
    action: {
      icon: 'do',
      text: 'Sip water, then open the ledger and read the last entry.',
      textBn: 'পানি খান, তারপর হিসাব খুলে শেষ এন্ট্রি দেখুন।',
    },
  },
  due_argument: {
    id: 'due_argument',
    title: 'Customer arguing on due',
    titleBn: 'বাকি নিয়ে তর্ক',
    tone: 'firm',
    immediate: {
      icon: 'pause',
      text: 'Stay quiet 3 seconds. Keep eyes on the ledger, not the face.',
      textBn: '৩ সেকেন্ড চুপ থাকুন। মুখের দিকে না, খাতার দিকে তাকান।',
    },
    script: {
      icon: 'say',
      text: 'Let us check the entry together.',
      textBn: 'একসাথে হিসাবটা দেখি ভাই।',
    },
    action: {
      icon: 'do',
      text: 'Open the customer, show the last 3 transactions on screen.',
      textBn: 'কাস্টমার খুলে শেষ ৩টি লেনদেন স্ক্রিনে দেখান।',
    },
  },
  crowd_pressure: {
    id: 'crowd_pressure',
    title: 'Crowd pressure',
    titleBn: 'ভিড়ের চাপ',
    tone: 'focused',
    immediate: {
      icon: 'pause',
      text: 'Straighten back, drop shoulders, one breath.',
      textBn: 'সোজা হয়ে দাঁড়ান, কাঁধ নামান, একবার শ্বাস নিন।',
    },
    script: {
      icon: 'say',
      text: 'One by one please, everyone will be served.',
      textBn: 'একজন একজন করে বলেন, সবাই পাবেন।',
    },
    action: {
      icon: 'do',
      text: 'Serve the person nearest the counter first, ignore the rest for 20s.',
      textBn: 'কাউন্টারের সবচেয়ে কাছের জনকে আগে দেন, ২০ সেকেন্ড বাকিদের দিকে তাকাবেন না।',
    },
  },
  price_haggle: {
    id: 'price_haggle',
    title: 'Price haggling',
    titleBn: 'দামাদামি',
    tone: 'friendly',
    immediate: {
      icon: 'pause',
      text: 'Smile, pause 2 seconds before answering.',
      textBn: 'হালকা হাসুন, ২ সেকেন্ড থেমে উত্তর দিন।',
    },
    script: {
      icon: 'say',
      text: 'This is the best price, brother.',
      textBn: 'এটাই শেষ দাম ভাই।',
    },
    action: {
      icon: 'do',
      text: 'Hand over the item, state the total, wait quietly.',
      textBn: 'জিনিস হাতে দিন, মোট বলুন, চুপ থাকুন।',
    },
  },
  no_money: {
    id: 'no_money',
    title: 'Customer says no cash',
    titleBn: 'টাকা নেই বলছে',
    tone: 'firm',
    immediate: {
      icon: 'pause',
      text: 'Stay calm, do not raise voice. Hold the item.',
      textBn: 'ঠান্ডা থাকুন, চিৎকার নয়। জিনিসটা হাতে রাখুন।',
    },
    script: {
      icon: 'say',
      text: 'When can you pay, brother?',
      textBn: 'কবে দিবেন ভাই?',
    },
    action: {
      icon: 'do',
      text: 'Add a due entry with a date reminder before handing over.',
      textBn: 'দেওয়ার আগে তারিখসহ বাকি এন্ট্রি করুন।',
    },
  },
  supplier_late: {
    id: 'supplier_late',
    title: 'Supplier delivery late',
    titleBn: 'সাপ্লায়ার দেরি',
    tone: 'focused',
    immediate: {
      icon: 'pause',
      text: 'Breathe once. Note the current time.',
      textBn: 'একবার শ্বাস নিন। এখনকার সময় লিখে রাখুন।',
    },
    script: {
      icon: 'say',
      text: 'Kindly confirm today\'s delivery time.',
      textBn: 'আজকের ডেলিভারি টাইম জানান দয়া করে।',
    },
    action: {
      icon: 'do',
      text: 'Send one polite reminder, then move to the next task.',
      textBn: 'একটা ভদ্র রিমাইন্ডার দিন, তারপর পরের কাজে যান।',
    },
  },
  bkash_dispute: {
    id: 'bkash_dispute',
    title: 'bKash payment dispute',
    titleBn: 'বিকাশ পেমেন্ট ঝামেলা',
    tone: 'calm',
    immediate: {
      icon: 'pause',
      text: 'Pause 3 seconds. Do not accuse.',
      textBn: '৩ সেকেন্ড থামুন। দোষারোপ নয়।',
    },
    script: {
      icon: 'say',
      text: 'Show me the transaction ID please.',
      textBn: 'ট্রানজেকশন আইডিটা দেখান দয়া করে।',
    },
    action: {
      icon: 'do',
      text: 'Match TrxID with your bKash SMS before releasing the item.',
      textBn: 'জিনিস দেওয়ার আগে বিকাশ SMS-এর সাথে TrxID মিলান।',
    },
  },
  staff_mistake: {
    id: 'staff_mistake',
    title: 'Staff made a mistake',
    titleBn: 'কর্মচারীর ভুল',
    tone: 'calm',
    immediate: {
      icon: 'pause',
      text: 'Breathe. Do not scold in front of customers.',
      textBn: 'শ্বাস নিন। কাস্টমারের সামনে বকবেন না।',
    },
    script: {
      icon: 'say',
      text: 'We will sort this out, no problem.',
      textBn: 'কোনো সমস্যা নেই, ঠিক করে দিচ্ছি।',
    },
    action: {
      icon: 'do',
      text: 'Fix the transaction now, coach the staff after the shop closes.',
      textBn: 'এখন লেনদেন ঠিক করুন, দোকান বন্ধের পরে কর্মচারীকে বুঝান।',
    },
  },
};

function pickToneForCustom(text: string): CoachPlan['tone'] {
  const t = text.toLowerCase();
  if (/(angry|রাগ|তর্ক|argument|shout|চিৎকার)/.test(t)) return 'firm';
  if (/(rush|hurry|জলদি|তাড়া|ভিড়|crowd)/.test(t)) return 'focused';
  if (/(price|দাম|দামাদামি|discount|ছাড়)/.test(t)) return 'friendly';
  return 'calm';
}

function customFallback(text: string): CoachPlan {
  const tone = pickToneForCustom(text);
  return {
    id: 'custom',
    title: text.slice(0, 60),
    titleBn: text.slice(0, 60),
    tone,
    immediate: {
      icon: 'pause',
      text: 'Take a deep breath, do not reply for 3 seconds.',
      textBn: 'একবার লম্বা শ্বাস নিন, ৩ সেকেন্ড উত্তর দেবেন না।',
    },
    script: {
      icon: 'say',
      text: 'One moment please, let me handle this.',
      textBn: 'এক মিনিট ভাই, আমি দেখছি।',
    },
    action: {
      icon: 'do',
      text: 'Wipe the counter, then return to the customer with a clear next step.',
      textBn: 'কাউন্টার মুছে নিন, তারপর পরিষ্কার সিদ্ধান্ত নিয়ে ফিরে আসুন।',
    },
  };
}

// POST /api/ai/situation-coach → returns an Action Plan for a shop-floor moment.
// Body: { situationId?: string, text?: string }
router.post('/ai/situation-coach', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ ok: false, error: 'Tenant ID is required' });

    const rawId = typeof req.body?.situationId === 'string' ? req.body.situationId.trim() : '';
    const rawText = typeof req.body?.text === 'string' ? req.body.text.trim().slice(0, 240) : '';

    if (rawId && COACH_TEMPLATES[rawId]) {
      return res.json({ ok: true, source: 'template', plan: COACH_TEMPLATES[rawId] });
    }

    if (!rawText) {
      return res.status(400).json({
        ok: false,
        error: 'Pick a chip or describe the situation',
        hint: 'e.g. "customer refuses to pay"',
      });
    }

    return res.json({ ok: true, source: 'custom', plan: customFallback(rawText) });
  } catch (error) {
    console.error('situation-coach error:', error);
    res.status(500).json({ ok: false, error: 'Internal error' });
  }
});

// GET /api/ai/situation-coach/templates → list of chips available to the UI.
router.get('/ai/situation-coach/templates', async (_req: Request, res: Response) => {
  const chips = Object.values(COACH_TEMPLATES).map(t => ({
    id: t.id, title: t.title, titleBn: t.titleBn, tone: t.tone,
  }));
  res.json({ ok: true, chips });
});

// POST parse a natural-language message into { entityId, amount, direction }.
// Uses a small Python script (regex + fuzzy match). No LLM cost, works offline.
router.post('/ai/parse-intent', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ ok: false, error: 'Tenant ID is required' });

    const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    if (!text) return res.status(400).json({ ok: false, error: 'Empty message', hint: "Try: 'Rahim 500 taka add to due'" });
    if (text.length > 500) return res.status(400).json({ ok: false, error: 'Message too long' });

    // Load a compact entity list (name + phone) so the parser can match.
    // Limit to a sane page size to keep the spawn payload small.
    const entities = await Entity.find({ tenantId })
      .select('_id name phone')
      .sort({ updatedAt: -1 })
      .limit(2000)
      .lean();

    const compact = entities.map((e: any) => ({
      id: String(e._id),
      name: e.name,
      phone: e.phone || '',
    }));

    let result: any;
    try {
      result = await runParser({ text, entities: compact });
    } catch (e: any) {
      console.error('parse-intent parser failed', e?.message);
      return res.status(500).json({ ok: false, error: 'Parser unavailable', hint: 'Try again in a moment' });
    }

    return res.json(result);
  } catch (error) {
    console.error('parse-intent error:', error);
    res.status(500).json({ ok: false, error: 'Internal error' });
  }
});

export default router;
