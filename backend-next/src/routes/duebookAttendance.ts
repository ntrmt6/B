import { Router, Request, Response } from 'express';
import { Attendance } from '../models/Attendance';
import { DueBookSettings } from '../models/DueBookSettings';
import { Device } from '../models/Device';
import { duebookAuth } from '../middleware/duebookRoleAuth';

const router = Router();

router.use(duebookAuth);

const getTenantId = (req: Request): string =>
  (req.tenantId as string) || (req.headers['x-tenant-id'] as string) || '';

const getRole = (req: Request): 'owner' | 'employee' => {
  const r = (req.userRole || (req.user as any)?.role || '').toString();
  return r === 'employee' ? 'employee' : 'owner';
};

const getDeviceId = (req: Request): string | null => {
  const uid = (req.userId || '').toString();
  if (uid.startsWith('device:')) return uid.slice('device:'.length);
  return null;
};

// Asia/Dhaka is UTC+6 (no DST). Convert current time → YYYY-MM-DD in that TZ.
const todayDhaka = (): string => {
  const now = new Date();
  const dhaka = new Date(now.getTime() + 6 * 60 * 60 * 1000);
  return dhaka.toISOString().slice(0, 10);
};

const monthRangeDhaka = (month?: string): { from: string; to: string; label: string } => {
  const now = new Date(new Date().getTime() + 6 * 60 * 60 * 1000);
  const m = month && /^\d{4}-\d{2}$/.test(month) ? month : now.toISOString().slice(0, 7);
  const [yStr, mStr] = m.split('-');
  const y = parseInt(yStr, 10);
  const mo = parseInt(mStr, 10);
  const from = `${m}-01`;
  const lastDay = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  const to = `${m}-${String(lastDay).padStart(2, '0')}`;
  return { from, to, label: m };
};

// GET current daily rate (owner + employee)
router.get('/config', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });
    const s = await DueBookSettings.findOne({ tenantId }).lean();
    res.json({ dailyAttendanceRate: s?.dailyAttendanceRate || 0 });
  } catch (err) {
    console.error('attendance config get error:', err);
    res.status(500).json({ error: 'Error loading config' });
  }
});

// PUT daily rate (owner only)
router.put('/config', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });
    if (getRole(req) !== 'owner') return res.status(403).json({ error: 'Only owner can change rate' });
    const raw = Number(req.body?.dailyAttendanceRate);
    if (!Number.isFinite(raw) || raw < 0) return res.status(400).json({ error: 'invalid dailyAttendanceRate' });
    const rate = Math.round(raw * 100) / 100;
    const doc = await DueBookSettings.findOneAndUpdate(
      { tenantId },
      { $set: { dailyAttendanceRate: rate }, $setOnInsert: { tenantId } },
      { upsert: true, new: true }
    );
    res.json({ dailyAttendanceRate: doc.dailyAttendanceRate });
  } catch (err) {
    console.error('attendance config put error:', err);
    res.status(500).json({ error: 'Error saving config' });
  }
});

// POST mark today's attendance (employee only — the device marks itself)
router.post('/mark', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });
    if (getRole(req) !== 'employee') return res.status(403).json({ error: 'Only employee can mark attendance' });
    const deviceId = getDeviceId(req);
    if (!deviceId) return res.status(400).json({ error: 'Device required' });

    const device = await Device.findById(deviceId).lean();
    if (!device || device.tenantId !== tenantId) return res.status(404).json({ error: 'Device not found' });

    const settings = await DueBookSettings.findOne({ tenantId }).lean();
    const rate = settings?.dailyAttendanceRate || 0;
    const date = todayDhaka();

    try {
      const doc = await Attendance.create({
        tenantId,
        deviceId,
        employeeLabel: device.label || 'কর্মচারী',
        date,
        markedAt: new Date(),
        dailyRate: rate,
      });
      return res.status(201).json({ ok: true, attendance: doc, alreadyMarked: false });
    } catch (e: any) {
      if (e && e.code === 11000) {
        const existing = await Attendance.findOne({ tenantId, deviceId, date }).lean();
        return res.json({ ok: true, attendance: existing, alreadyMarked: true });
      }
      throw e;
    }
  } catch (err) {
    console.error('attendance mark error:', err);
    res.status(500).json({ error: 'Error marking attendance' });
  }
});

// GET employee's own attendance for a month (?month=YYYY-MM, default current)
router.get('/me', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });
    if (getRole(req) !== 'employee') return res.status(403).json({ error: 'Employee only' });
    const deviceId = getDeviceId(req);
    if (!deviceId) return res.status(400).json({ error: 'Device required' });

    const { from, to, label } = monthRangeDhaka(req.query.month as string | undefined);
    const rows = await Attendance.find({
      tenantId,
      deviceId,
      date: { $gte: from, $lte: to },
    })
      .sort({ date: 1 })
      .lean();

    const settings = await DueBookSettings.findOne({ tenantId }).lean();
    const currentRate = settings?.dailyAttendanceRate || 0;
    const totalDays = rows.length;
    const totalSalary = rows.reduce((s, r) => s + (r.dailyRate || 0), 0);
    const today = todayDhaka();
    const markedToday = rows.some((r) => r.date === today);

    res.json({
      month: label,
      today,
      markedToday,
      currentRate,
      totalDays,
      totalSalary,
      rows,
    });
  } catch (err) {
    console.error('attendance me error:', err);
    res.status(500).json({ error: 'Error loading attendance' });
  }
});

// GET report for all employees (owner only, ?month=YYYY-MM)
router.get('/report', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });
    if (getRole(req) !== 'owner') return res.status(403).json({ error: 'Owner only' });

    const { from, to, label } = monthRangeDhaka(req.query.month as string | undefined);

    const rows = await Attendance.find({
      tenantId,
      date: { $gte: from, $lte: to },
    })
      .sort({ date: 1 })
      .lean();

    const devices = await Device.find({ tenantId, role: 'employee', revokedAt: null }).lean();
    const deviceMap = new Map(devices.map((d) => [String(d._id), d]));

    const groups = new Map<string, { deviceId: string; label: string; days: number; totalSalary: number; dates: string[]; revoked?: boolean }>();
    for (const r of rows) {
      const key = String(r.deviceId);
      const dev = deviceMap.get(key);
      const g = groups.get(key) || {
        deviceId: key,
        label: dev?.label || r.employeeLabel || 'কর্মচারী',
        days: 0,
        totalSalary: 0,
        dates: [] as string[],
        revoked: !dev,
      };
      g.days += 1;
      g.totalSalary += r.dailyRate || 0;
      g.dates.push(r.date);
      groups.set(key, g);
    }

    // Also include active employees with zero attendance so owner can see them
    for (const d of devices) {
      const key = String(d._id);
      if (!groups.has(key)) {
        groups.set(key, { deviceId: key, label: d.label || 'কর্মচারী', days: 0, totalSalary: 0, dates: [] });
      }
    }

    const employees = Array.from(groups.values()).sort((a, b) => a.label.localeCompare(b.label, 'bn'));
    const totals = {
      days: employees.reduce((s, e) => s + e.days, 0),
      salary: employees.reduce((s, e) => s + e.totalSalary, 0),
    };

    res.json({ month: label, employees, totals });
  } catch (err) {
    console.error('attendance report error:', err);
    res.status(500).json({ error: 'Error loading report' });
  }
});

export default router;
