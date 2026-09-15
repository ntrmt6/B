import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Device } from '../models/Device';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { env } from '../config/env';

const router = Router();

const getTenantId = (req: Request): string =>
  (req.tenantId as string) || (req.headers['x-tenant-id'] as string) || '';

const hashToken = (raw: string) => crypto.createHash('sha256').update(raw).digest('hex');
const genCode = () => Math.floor(100000 + Math.random() * 900000).toString();
const PAIR_TTL_MS = 10 * 60 * 1000;

// POST /pair/codes (owner-only) — generate a fresh 6-digit code
router.post('/codes', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });
    const label = typeof req.body?.label === 'string' ? req.body.label.trim().slice(0, 60) : 'কর্মচারী';

    let pairCode = genCode();
    // Regen if collides with active code
    for (let i = 0; i < 5; i++) {
      const exists = await Device.findOne({ pairCode, pairCodeConsumed: false, pairCodeExpiresAt: { $gt: new Date() } }).lean();
      if (!exists) break;
      pairCode = genCode();
    }

    const doc = await Device.create({
      tenantId,
      role: 'employee',
      label,
      tokenHash: 'pending',
      pairCode,
      pairCodeExpiresAt: new Date(Date.now() + PAIR_TTL_MS),
      pairCodeConsumed: false,
    });

    res.status(201).json({
      _id: doc._id,
      pairCode,
      expiresAt: doc.pairCodeExpiresAt,
      tenantId,
      label,
    });
  } catch (err) {
    console.error('pair code error:', err);
    res.status(500).json({ error: 'Error generating pair code' });
  }
});

// GET /pair/devices (owner-only) — list active paired devices
router.get('/devices', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });
    const rows = await Device.find({ tenantId, revokedAt: null }).sort({ createdAt: -1 }).lean();
    res.json(rows.map((d) => ({
      _id: d._id,
      role: d.role,
      label: d.label,
      pairCode: d.pairCodeConsumed ? undefined : d.pairCode,
      pairCodeExpiresAt: d.pairCodeExpiresAt,
      pairCodeConsumed: d.pairCodeConsumed,
      lastSeenAt: d.lastSeenAt,
      createdAt: d.createdAt,
    })));
  } catch (err) {
    console.error('pair list error:', err);
    res.status(500).json({ error: 'Error listing devices' });
  }
});

// DELETE /pair/devices/:id (owner-only) — revoke a device
router.delete('/devices/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });
    const doc = await Device.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      { $set: { revokedAt: new Date() } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: 'Device not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('pair revoke error:', err);
    res.status(500).json({ error: 'Error revoking device' });
  }
});

// POST /pair/redeem — { pairCode, tenantId } → { token, tenantId, role, label }
// Public route: no auth needed since the code IS the auth.
router.post('/redeem', async (req: Request, res: Response) => {
  try {
    const { pairCode, tenantId } = req.body || {};
    if (typeof pairCode !== 'string' || !/^[0-9]{6}$/.test(pairCode)) {
      return res.status(400).json({ error: 'invalid code' });
    }
    if (typeof tenantId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(tenantId)) {
      return res.status(400).json({ error: 'invalid tenantId' });
    }

    const doc = await Device.findOne({
      tenantId,
      pairCode,
      pairCodeConsumed: false,
      pairCodeExpiresAt: { $gt: new Date() },
      revokedAt: null,
    });
    if (!doc) return res.status(400).json({ error: 'কোড ভুল বা মেয়াদ শেষ' });

    const rawToken = crypto.randomBytes(32).toString('hex');
    doc.tokenHash = hashToken(rawToken);
    doc.pairCodeConsumed = true;
    doc.lastSeenAt = new Date();
    await doc.save();

    const secret = env.jwtSecret;
    if (!secret) return res.status(500).json({ error: 'server config' });

    const token = jwt.sign(
      {
        deviceId: String(doc._id),
        tenantId,
        role: 'employee',
        userId: `device:${doc._id}`,
        email: `device+${doc._id}@duebook.local`,
      },
      secret,
      { expiresIn: '365d' as any }
    );

    res.json({
      token,
      tenantId,
      role: 'employee',
      label: doc.label,
      deviceId: doc._id,
    });
  } catch (err) {
    console.error('pair redeem error:', err);
    res.status(500).json({ error: 'Error redeeming code' });
  }
});

export default router;
