import { Router, Request, Response } from 'express';
import { MenuItem } from '../models/MenuItem';
import { MenuSettings } from '../models/MenuSettings';
import { MenuExport } from '../models/MenuExport';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.use(requireAdmin);

const getTenantId = (req: Request): string =>
  (req.tenantId as string) || (req.headers['x-tenant-id'] as string) || '';

// GET all menu items for tenant
router.get('/items', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });
    const items = await MenuItem.find({ tenantId }).sort({ sortOrder: 1, createdAt: 1 }).lean();
    res.json(items);
  } catch (err) {
    console.error('menu list error:', err);
    res.status(500).json({ error: 'Error fetching menu' });
  }
});

// POST create menu item
router.post('/items', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });
    const { nameBn, price, category, available, sortOrder } = req.body || {};
    if (typeof nameBn !== 'string' || !nameBn.trim()) return res.status(400).json({ error: 'nameBn required' });
    if (typeof price !== 'number' || price < 0) return res.status(400).json({ error: 'price required' });

    const doc = await MenuItem.create({
      tenantId,
      nameBn: nameBn.trim(),
      price,
      category: (category || 'অন্যান্য').toString().trim().slice(0, 40),
      available: available !== false,
      sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
    });
    res.status(201).json(doc);
  } catch (err) {
    console.error('menu create error:', err);
    res.status(500).json({ error: 'Error creating menu item' });
  }
});

// PUT update menu item
router.put('/items/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });
    const { nameBn, price, category, available, sortOrder } = req.body || {};
    const update: Record<string, unknown> = {};
    if (typeof nameBn === 'string') update.nameBn = nameBn.trim().slice(0, 80);
    if (typeof price === 'number' && price >= 0) update.price = price;
    if (typeof category === 'string') update.category = category.trim().slice(0, 40) || 'অন্যান্য';
    if (typeof available === 'boolean') update.available = available;
    if (typeof sortOrder === 'number') update.sortOrder = sortOrder;

    const doc = await MenuItem.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      update,
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ error: 'Menu item not found' });
    res.json(doc);
  } catch (err) {
    console.error('menu update error:', err);
    res.status(500).json({ error: 'Error updating menu item' });
  }
});

// DELETE menu item
router.delete('/items/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });
    const doc = await MenuItem.findOneAndDelete({ _id: req.params.id, tenantId });
    if (!doc) return res.status(404).json({ error: 'Menu item not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('menu delete error:', err);
    res.status(500).json({ error: 'Error deleting menu item' });
  }
});

// POST bulk reorder — body: [{ _id, sortOrder }]
router.post('/items/reorder', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });
    const rows = Array.isArray(req.body?.items) ? req.body.items : [];
    if (rows.length === 0 || rows.length > 500) return res.status(400).json({ error: 'invalid items' });
    await Promise.all(
      rows.map((r: { _id: string; sortOrder: number }) =>
        MenuItem.updateOne({ _id: r._id, tenantId }, { $set: { sortOrder: r.sortOrder } })
      )
    );
    res.json({ success: true });
  } catch (err) {
    console.error('menu reorder error:', err);
    res.status(500).json({ error: 'Error reordering menu' });
  }
});

// GET menu settings
router.get('/settings', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });
    const s = await MenuSettings.findOne({ tenantId }).lean();
    res.json(s || { tenantId, shopNameBn: '', taglineBn: '', footerNotesBn: [] });
  } catch (err) {
    console.error('menu settings get error:', err);
    res.status(500).json({ error: 'Error fetching menu settings' });
  }
});

// PUT menu settings
router.put('/settings', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });
    const { shopNameBn, taglineBn, footerNotesBn } = req.body || {};
    const update: Record<string, unknown> = {};
    if (typeof shopNameBn === 'string') update.shopNameBn = shopNameBn.trim().slice(0, 120);
    if (typeof taglineBn === 'string') update.taglineBn = taglineBn.trim().slice(0, 160);
    if (Array.isArray(footerNotesBn)) {
      update.footerNotesBn = footerNotesBn
        .filter((s: unknown) => typeof s === 'string')
        .map((s: string) => s.trim().slice(0, 160))
        .filter(Boolean)
        .slice(0, 6);
    }
    const s = await MenuSettings.findOneAndUpdate(
      { tenantId },
      { $set: update, $setOnInsert: { tenantId } },
      { new: true, upsert: true, runValidators: true }
    );
    res.json(s);
  } catch (err) {
    console.error('menu settings put error:', err);
    res.status(500).json({ error: 'Error saving menu settings' });
  }
});

// GET recent exports
router.get('/exports', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });
    const rows = await MenuExport.find({ tenantId }).sort({ createdAt: -1 }).limit(50).lean();
    res.json(rows);
  } catch (err) {
    console.error('menu exports list error:', err);
    res.status(500).json({ error: 'Error fetching exports' });
  }
});

// POST record an export
router.post('/exports', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });
    const { format, fileName, itemCount } = req.body || {};
    if (!['pdf-a4', 'pdf-a5', 'png'].includes(format)) return res.status(400).json({ error: 'invalid format' });
    if (typeof fileName !== 'string' || !fileName.trim()) return res.status(400).json({ error: 'fileName required' });
    const doc = await MenuExport.create({
      tenantId,
      format,
      fileName: fileName.trim().slice(0, 160),
      itemCount: typeof itemCount === 'number' && itemCount >= 0 ? itemCount : 0,
    });
    res.status(201).json(doc);
  } catch (err) {
    console.error('menu export record error:', err);
    res.status(500).json({ error: 'Error recording export' });
  }
});

// DELETE an export record
router.delete('/exports/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });
    const doc = await MenuExport.findOneAndDelete({ _id: req.params.id, tenantId });
    if (!doc) return res.status(404).json({ error: 'Export not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('menu export delete error:', err);
    res.status(500).json({ error: 'Error deleting export record' });
  }
});

export default router;
