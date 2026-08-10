import { Router, Request, Response } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { ReminderSettings } from '../models/ReminderSettings';
import { ReminderQueue } from '../models/ReminderQueue';
import { generateForTenant } from '../services/reminderScheduler';

const router = Router();

router.use(authenticateToken);
router.use(requireAdmin);

const getTenantId = (req: any): string =>
  req.tenantId || (req.headers['x-tenant-id'] as string) || '';

router.get('/duebook/reminder-settings', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });
    const s = await ReminderSettings.findOne({ tenantId }).lean();
    res.json(
      s || {
        tenantId,
        enabled: false,
        triggerDaysOverdue: [3, 7, 14, 30],
        minAmount: 100,
        cooldownDays: 3,
        runHourLocal: 9,
        maxRemindersPerRun: 50,
      },
    );
  } catch (e) {
    console.error('reminder-settings GET', e);
    res.status(500).json({ error: 'Error fetching reminder settings' });
  }
});

router.put('/duebook/reminder-settings', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });

    const {
      enabled,
      triggerDaysOverdue,
      minAmount,
      cooldownDays,
      runHourLocal,
      maxRemindersPerRun,
    } = req.body || {};

    const update: any = {};
    if (typeof enabled === 'boolean') update.enabled = enabled;
    if (Array.isArray(triggerDaysOverdue)) {
      const cleaned = triggerDaysOverdue
        .map((n: any) => Number(n))
        .filter((n) => Number.isFinite(n) && n >= 0 && n <= 365);
      update.triggerDaysOverdue = Array.from(new Set(cleaned)).sort((a, b) => a - b);
    }
    if (typeof minAmount === 'number' && minAmount >= 0) update.minAmount = minAmount;
    if (typeof cooldownDays === 'number' && cooldownDays >= 0 && cooldownDays <= 365)
      update.cooldownDays = cooldownDays;
    if (typeof runHourLocal === 'number' && runHourLocal >= 0 && runHourLocal <= 23)
      update.runHourLocal = runHourLocal;
    if (
      typeof maxRemindersPerRun === 'number' &&
      maxRemindersPerRun >= 1 &&
      maxRemindersPerRun <= 1000
    )
      update.maxRemindersPerRun = maxRemindersPerRun;

    const s = await ReminderSettings.findOneAndUpdate(
      { tenantId },
      { $set: update, $setOnInsert: { tenantId } },
      { new: true, upsert: true, runValidators: true },
    );
    res.json(s);
  } catch (e) {
    console.error('reminder-settings PUT', e);
    res.status(500).json({ error: 'Error saving reminder settings' });
  }
});

router.get('/duebook/reminder-queue', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });
    const status = (req.query.status as string) || 'pending';
    const filter: any = { tenantId };
    if (status !== 'all') filter.status = status;
    const items = await ReminderQueue.find(filter)
      .sort({ generatedAt: -1 })
      .limit(200)
      .lean();
    res.json(items);
  } catch (e) {
    console.error('reminder-queue GET', e);
    res.status(500).json({ error: 'Error fetching reminder queue' });
  }
});

router.post('/duebook/reminder-queue/:id/mark-sent', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });
    const item = await ReminderQueue.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      { $set: { status: 'sent', sentAt: new Date() } },
      { new: true },
    );
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: 'Error updating reminder' });
  }
});

router.post('/duebook/reminder-queue/:id/dismiss', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });
    const item = await ReminderQueue.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      { $set: { status: 'dismissed' } },
      { new: true },
    );
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: 'Error dismissing reminder' });
  }
});

router.post('/duebook/reminder-queue/generate-now', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });
    const result = await generateForTenant(tenantId, { force: true });
    res.json(result);
  } catch (e) {
    console.error('generate-now', e);
    res.status(500).json({ error: 'Error generating reminders' });
  }
});

export default router;
