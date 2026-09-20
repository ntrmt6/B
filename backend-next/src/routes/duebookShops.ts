import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { User } from '../models/User';
import { DueBookSettings } from '../models/DueBookSettings';

const router = Router();

router.use(authenticateToken);
router.use(requireAdmin);

const slugify = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

// GET all shops (tenants) the authenticated user has access to
router.get('/duebook/shops', async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const ids = new Set<string>();
    if (Array.isArray(user.tenantIds)) user.tenantIds.forEach((t) => t && ids.add(t));
    if (user.tenantId) ids.add(user.tenantId);
    if (ids.size === 0) return res.json({ shops: [], currentTenantId: null });

    const settings = await DueBookSettings.find({ tenantId: { $in: Array.from(ids) } })
      .select('tenantId shopName shopLogo updatedAt')
      .lean();
    const byTenant = new Map(settings.map((s) => [s.tenantId, s]));

    const shops = Array.from(ids).map((tenantId) => {
      const s = byTenant.get(tenantId);
      return {
        tenantId,
        shopName: s?.shopName || '',
        shopLogo: s?.shopLogo || '',
        isPrimary: tenantId === user.tenantId,
      };
    });

    res.json({ shops, currentTenantId: req.tenantId || user.tenantId || null });
  } catch (e) {
    console.error('shops list error', e);
    res.status(500).json({ error: 'Failed to list shops' });
  }
});

// POST create a new shop for the current user
router.post('/duebook/shops', async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const shopName = String(req.body?.shopName || '').trim().slice(0, 120);
    if (!shopName) return res.status(400).json({ error: 'Shop name required' });

    const existing = new Set<string>();
    if (Array.isArray(user.tenantIds)) user.tenantIds.forEach((t) => t && existing.add(t));
    if (user.tenantId) existing.add(user.tenantId);
    if (existing.size >= 20) {
      return res.status(400).json({ error: 'Shop limit reached (20).' });
    }

    // Generate a unique tenantId
    const slug = slugify(shopName) || 'shop';
    let tenantId = `${slug}-${randomUUID().slice(0, 8)}`;
    let guard = 0;
    while ((await DueBookSettings.findOne({ tenantId }).lean()) && guard < 5) {
      tenantId = `${slug}-${randomUUID().slice(0, 8)}`;
      guard++;
    }

    const settings = await DueBookSettings.create({
      tenantId,
      shopName,
      registrationEnabled: false,
    });

    if (!Array.isArray(user.tenantIds)) user.tenantIds = [];
    if (!user.tenantIds.includes(tenantId)) user.tenantIds.push(tenantId);
    await user.save();

    res.status(201).json({
      shop: {
        tenantId: settings.tenantId,
        shopName: settings.shopName,
        shopLogo: settings.shopLogo,
        isPrimary: false,
      },
    });
  } catch (e) {
    console.error('shops create error', e);
    res.status(500).json({ error: 'Failed to create shop' });
  }
});

// DELETE detach a shop from user (data is preserved; the shop just leaves the user's list).
// The primary tenant on the user record cannot be detached.
router.delete('/duebook/shops/:tenantId', async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const target = String(req.params.tenantId || '').trim();
    if (!target) return res.status(400).json({ error: 'tenantId required' });
    if (target === user.tenantId) return res.status(400).json({ error: 'Cannot remove primary shop' });

    if (!Array.isArray(user.tenantIds) || !user.tenantIds.includes(target)) {
      return res.status(404).json({ error: 'Shop not in your list' });
    }
    user.tenantIds = user.tenantIds.filter((t: string) => t !== target);
    await user.save();
    res.json({ ok: true });
  } catch (e) {
    console.error('shops delete error', e);
    res.status(500).json({ error: 'Failed to remove shop' });
  }
});

export default router;
