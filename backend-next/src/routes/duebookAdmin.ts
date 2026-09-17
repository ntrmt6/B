import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { authenticateToken } from '../middleware/auth';
import { User } from '../models/User';
import { DueBookSettings } from '../models/DueBookSettings';
import { Entity } from '../models/Entity';
import { Transaction } from '../models/Transaction';
import { getDatabase } from '../db/mongo';

/**
 * DueBook super-admin API.
 *
 * All routes require an authenticated super_admin. Provides system-wide
 * counts, signup timelines, visitor tallies aggregated across DueBook
 * tenants, and user management (activate / deactivate / delete / role).
 */
export const duebookAdminRouter = Router();

const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ error: 'Auth required' });
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Super admin only', code: 'FORBIDDEN' });
  }
  next();
};

duebookAdminRouter.use(authenticateToken, requireSuperAdmin);

const startOfDayUTC = (d = new Date()) => {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
};

// ── Overview ────────────────────────────────────────────────────────────
duebookAdminRouter.get('/overview', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startToday = startOfDayUTC(now);
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const db = await getDatabase();
    const visitorsCol = db.collection('visitors');
    const pageViewsCol = db.collection('page_views');

    const [
      totalUsers,
      tenantAdmins,
      staffUsers,
      googleUsers,
      localUsers,
      activeUsers,
      inactiveUsers,
      newToday,
      newThisWeek,
      newThisMonth,
      loggedInDay,
      loggedInWeek,
      shopsConfigured,
      totalEntities,
      totalTransactions,
      totalVisitors,
      visitorsToday,
      visitorsWeek,
      pageViewsToday,
      pageViewsWeek,
      onlineNow,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: 'tenant_admin' }),
      User.countDocuments({ role: 'staff' }),
      User.countDocuments({ provider: 'google' }),
      User.countDocuments({ provider: { $ne: 'google' } }),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      User.countDocuments({ createdAt: { $gte: startToday } }),
      User.countDocuments({ createdAt: { $gte: weekAgo } }),
      User.countDocuments({ createdAt: { $gte: monthAgo } }),
      User.countDocuments({ lastLogin: { $gte: dayAgo } }),
      User.countDocuments({ lastLogin: { $gte: weekAgo } }),
      DueBookSettings.countDocuments({}),
      Entity.countDocuments({}),
      Transaction.countDocuments({}),
      visitorsCol.countDocuments({}),
      visitorsCol.countDocuments({ lastVisit: { $gte: startToday } }),
      visitorsCol.countDocuments({ lastVisit: { $gte: weekAgo } }),
      pageViewsCol.countDocuments({ timestamp: { $gte: startToday } }),
      pageViewsCol.countDocuments({ timestamp: { $gte: weekAgo } }),
      visitorsCol.countDocuments({ lastVisit: { $gte: fiveMinAgo } }),
    ]);

    res.json({
      users: {
        total: totalUsers,
        tenantAdmins,
        staff: staffUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        google: googleUsers,
        local: localUsers,
        newToday,
        newThisWeek,
        newThisMonth,
        loggedInDay,
        loggedInWeek,
      },
      shops: {
        configured: shopsConfigured,
      },
      records: {
        entities: totalEntities,
        transactions: totalTransactions,
      },
      visitors: {
        total: totalVisitors,
        today: visitorsToday,
        week: visitorsWeek,
        pageViewsToday,
        pageViewsWeek,
        onlineNow,
      },
      generatedAt: now,
    });
  } catch (err) {
    next(err);
  }
});

// ── Daily signup / visitor timeline ─────────────────────────────────────
duebookAdminRouter.get('/timeline', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = Math.min(Math.max(parseInt((req.query.days as string) || '30', 10) || 30, 7), 180);
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - (days - 1));

    const [signups, visitors, pageViews] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Dhaka' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      (await getDatabase())
        .collection('visitors')
        .aggregate([
          { $match: { firstVisit: { $gte: start } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$firstVisit', timezone: 'Asia/Dhaka' } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),
      (await getDatabase())
        .collection('page_views')
        .aggregate([
          { $match: { timestamp: { $gte: start } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp', timezone: 'Asia/Dhaka' } },
              views: { $sum: 1 },
              visitors: { $addToSet: '$visitorId' },
            },
          },
          { $project: { views: 1, visitors: { $size: '$visitors' } } },
          { $sort: { _id: 1 } },
        ])
        .toArray(),
    ]);

    // Build a dense day-by-day series
    const days_out: Array<{ date: string; signups: number; newVisitors: number; pageViews: number; uniqueVisitors: number }> = [];
    const signupMap = new Map(signups.map((d: any) => [d._id, d.count]));
    const visitorsMap = new Map(visitors.map((d: any) => [d._id, d.count]));
    const pvMap = new Map(pageViews.map((d: any) => [d._id, { views: d.views, visitors: d.visitors }]));

    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setUTCDate(d.getUTCDate() + i);
      const label = d.toISOString().slice(0, 10);
      const pv = pvMap.get(label);
      days_out.push({
        date: label,
        signups: (signupMap.get(label) as number) || 0,
        newVisitors: (visitorsMap.get(label) as number) || 0,
        pageViews: pv?.views || 0,
        uniqueVisitors: pv?.visitors || 0,
      });
    }

    res.json({ days: days_out });
  } catch (err) {
    next(err);
  }
});

// ── Users list ──────────────────────────────────────────────────────────
duebookAdminRouter.get('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = ((req.query.search as string) || '').trim();
    const role = (req.query.role as string) || '';
    const provider = (req.query.provider as string) || '';
    const active = (req.query.active as string) || '';
    const sort = (req.query.sort as string) || 'newest';
    const limit = Math.min(Math.max(parseInt((req.query.limit as string) || '25', 10) || 25, 1), 200);
    const offset = Math.max(parseInt((req.query.offset as string) || '0', 10) || 0, 0);

    const filter: Record<string, any> = {};
    if (role) filter.role = role;
    if (provider) filter.provider = provider;
    if (active === 'true') filter.isActive = true;
    if (active === 'false') filter.isActive = false;
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ email: rx }, { name: rx }, { phone: rx }, { tenantId: rx }];
    }

    const sortSpec: Record<string, 1 | -1> =
      sort === 'oldest' ? { createdAt: 1 } :
      sort === 'lastLogin' ? { lastLogin: -1 } :
      sort === 'name' ? { name: 1 } :
      { createdAt: -1 };

    const [rows, total] = await Promise.all([
      User.find(filter)
        .select('name email phone role tenantId isActive provider providerId lastLogin image createdAt updatedAt')
        .sort(sortSpec)
        .skip(offset)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    // Enrich with shop name + entity/transaction counts for the current page only
    const tenantIds = rows.map(r => r.tenantId).filter(Boolean) as string[];
    const [shops, entityCounts, txCounts] = await Promise.all([
      DueBookSettings.find({ tenantId: { $in: tenantIds } }).select('tenantId shopName').lean(),
      Entity.aggregate([{ $match: { tenantId: { $in: tenantIds } } }, { $group: { _id: '$tenantId', c: { $sum: 1 } } }]),
      Transaction.aggregate([{ $match: { tenantId: { $in: tenantIds } } }, { $group: { _id: '$tenantId', c: { $sum: 1 } } }]),
    ]);
    const shopMap = new Map(shops.map(s => [s.tenantId, s.shopName]));
    const entMap = new Map(entityCounts.map((s: any) => [s._id, s.c]));
    const txMap = new Map(txCounts.map((s: any) => [s._id, s.c]));

    res.json({
      total,
      offset,
      limit,
      users: rows.map(u => ({
        ...u,
        shopName: (u.tenantId && shopMap.get(u.tenantId)) || '',
        entities: (u.tenantId && (entMap.get(u.tenantId) as number)) || 0,
        transactions: (u.tenantId && (txMap.get(u.tenantId) as number)) || 0,
      })),
    });
  } catch (err) {
    next(err);
  }
});

const patchSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.enum(['customer', 'admin', 'tenant_admin', 'super_admin', 'staff']).optional(),
  name: z.string().min(2).max(120).optional(),
});

duebookAdminRouter.patch('/users/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });
    if (req.userId === id && req.body.isActive === false) {
      return res.status(400).json({ error: 'You cannot deactivate your own account' });
    }
    const data = patchSchema.parse(req.body);
    const updated = await User.findByIdAndUpdate(id, { $set: data }, { new: true }).select('-password');
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json({ ok: true, user: updated });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    next(err);
  }
});

duebookAdminRouter.delete('/users/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });
    if (req.userId === id) return res.status(400).json({ error: 'You cannot delete your own account' });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const tenantId = user.tenantId;

    await user.deleteOne();
    // Best-effort tenant data purge
    if (tenantId) {
      await Promise.allSettled([
        Entity.deleteMany({ tenantId }),
        Transaction.deleteMany({ tenantId }),
        DueBookSettings.deleteMany({ tenantId }),
      ]);
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ── Recent signups (compact feed for dashboard) ─────────────────────────
duebookAdminRouter.get('/recent-signups', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(Math.max(parseInt((req.query.limit as string) || '10', 10) || 10, 1), 50);
    const rows = await User.find({})
      .select('name email provider role createdAt lastLogin tenantId')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json({ users: rows });
  } catch (err) {
    next(err);
  }
});

// ── Traffic sources (aggregated across all tenants) ─────────────────────
duebookAdminRouter.get('/traffic', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = Math.min(Math.max(parseInt((req.query.days as string) || '7', 10) || 7, 1), 90);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const db = await getDatabase();

    const [topReferrers, topPages, deviceBreakdown, tenantsByViews] = await Promise.all([
      db.collection('page_views').aggregate([
        { $match: { timestamp: { $gte: since }, referrer: { $exists: true, $ne: null } } },
        { $group: { _id: '$referrer', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 12 },
        { $project: { _id: 0, referrer: '$_id', count: 1 } },
      ]).toArray(),
      db.collection('page_views').aggregate([
        { $match: { timestamp: { $gte: since } } },
        { $group: { _id: '$page', views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: 12 },
        { $project: { _id: 0, page: '$_id', views: 1 } },
      ]).toArray(),
      db.collection('visitors').aggregate([
        { $match: { lastVisit: { $gte: since } } },
        { $group: { _id: '$device', count: { $sum: 1 } } },
        { $project: { _id: 0, device: { $ifNull: ['$_id', 'Unknown'] }, count: 1 } },
      ]).toArray(),
      db.collection('page_views').aggregate([
        { $match: { timestamp: { $gte: since } } },
        { $group: { _id: '$tenantId', views: { $sum: 1 }, visitors: { $addToSet: '$visitorId' } } },
        { $project: { _id: 0, tenantId: '$_id', views: 1, visitors: { $size: '$visitors' } } },
        { $sort: { views: -1 } },
        { $limit: 10 },
      ]).toArray(),
    ]);

    res.json({ days, topReferrers, topPages, deviceBreakdown, tenantsByViews });
  } catch (err) {
    next(err);
  }
});

export default duebookAdminRouter;
