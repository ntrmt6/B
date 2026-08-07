import { Router, Request, Response } from 'express';
import { Entity } from '../models/Entity';
import { Transaction } from '../models/Transaction';
import { DueBookSettings } from '../models/DueBookSettings';

const router = Router();

const validTid = (tid: unknown): tid is string =>
  typeof tid === 'string' && /^[a-f\d]{24}$/i.test(tid);

const normalisePhone = (p: string) => p.replace(/\D/g, '');

// GET /api/public/register-info?tid=TENANTID
router.get('/public/register-info', async (req: Request, res: Response) => {
  try {
    const { tid } = req.query;
    if (!validTid(tid)) return res.status(400).json({ error: 'Invalid link' });

    const settings = await DueBookSettings.findOne({ tenantId: tid }).lean();
    if (!settings || !settings.registrationEnabled) {
      return res.status(404).json({ error: 'Registration not available' });
    }

    res.json({
      shopName: settings.shopName || 'Our Shop',
      bonusAmount: settings.bonusAmount || 0,
      welcomeMessage: settings.welcomeMessage || '',
    });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/public/register  { tid, name, phone }
router.post('/public/register', async (req: Request, res: Response) => {
  try {
    const { tid, name, phone } = req.body || {};
    if (!validTid(tid)) return res.status(400).json({ error: 'Invalid link' });
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const cleanPhone = normalisePhone(String(phone || ''));
    if (cleanPhone.length < 7) {
      return res.status(400).json({ error: 'Valid phone required' });
    }

    const settings = await DueBookSettings.findOne({ tenantId: tid }).lean();
    if (!settings || !settings.registrationEnabled) {
      return res.status(403).json({ error: 'Registration not available' });
    }

    // Returning customer: same phone already exists for this tenant
    const existing = await Entity.findOne({ tenantId: tid, phone: cleanPhone });
    if (existing) {
      return res.json({
        returning: true,
        bonusAmount: settings.bonusAmount || 0,
        shopName: settings.shopName || 'Our Shop',
        entityId: existing._id,
        name: existing.name,
      });
    }

    const entity = await Entity.create({
      tenantId: tid,
      name: name.trim(),
      phone: cleanPhone,
      type: 'Customer',
    });

    // If a bonus is configured, credit it as an EXPENSE tx (shop owes customer)
    const bonus = Number(settings.bonusAmount) || 0;
    if (bonus > 0) {
      await Transaction.create({
        tenantId: tid,
        entityId: entity._id,
        entityName: entity.name,
        amount: bonus,
        direction: 'EXPENSE',
        transactionDate: new Date(),
        notes: 'Registration bonus',
        transactionType: 'Bonus',
        status: 'Pending',
      });
      await Entity.updateOne(
        { _id: entity._id },
        { $inc: { totalIOweThemNumber: bonus } }
      );
    }

    res.status(201).json({
      returning: false,
      bonusAmount: bonus,
      shopName: settings.shopName || 'Our Shop',
      entityId: entity._id,
      name: entity.name,
    });
  } catch (err: any) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: 'Already registered' });
    }
    console.error('public register error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
