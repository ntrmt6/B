import { Router, Request, Response } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { InventorySale } from '../models/InventorySale';
import { Attendance } from '../models/Attendance';
import { Transaction } from '../models/Transaction';
import { EmployeeAdvance } from '../models/EmployeeAdvance';

const router = Router();

router.use(authenticateToken);
router.use(requireAdmin);

const getTenantId = (req: any): string =>
  req.tenantId || (req.headers['x-tenant-id'] as string) || '';

// Asia/Dhaka is UTC+6. Given a YYYY-MM-DD, return the [startUtc, endUtc)
// covering that entire local Dhaka day.
const dhakaDayRange = (dateStr: string): { start: Date; end: Date; label: string } => {
  const [y, m, d] = dateStr.split('-').map(Number);
  // Dhaka midnight in UTC: subtract 6 hours
  const start = new Date(Date.UTC(y, m - 1, d, -6, 0, 0));
  const end = new Date(Date.UTC(y, m - 1, d, 18, 0, 0)); // next Dhaka midnight
  return { start, end, label: dateStr };
};

const todayDhakaKey = (): string => {
  const now = new Date();
  const dhaka = new Date(now.getTime() + 6 * 60 * 60 * 1000);
  return dhaka.toISOString().slice(0, 10);
};

router.get('/duebook/pnl', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });

    const dateStr =
      typeof req.query.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date)
        ? req.query.date
        : todayDhakaKey();
    const { start, end, label } = dhakaDayRange(dateStr);

    const [sales, txs, attendanceRows, advanceRows] = await Promise.all([
      InventorySale.find({ tenantId, soldAt: { $gte: start, $lt: end } })
        .select('itemName qty salePrice buyPriceSnapshot profit')
        .lean(),
      Transaction.find({
        tenantId,
        status: 'Paid',
        transactionDate: { $gte: start, $lt: end },
      })
        .select('direction amount notes')
        .lean(),
      Attendance.find({ tenantId, date: label })
        .select('employeeLabel dailyRate')
        .lean(),
      EmployeeAdvance.find({
        tenantId,
        createdAt: { $gte: start, $lt: end },
      })
        .select('employeeLabel amount note')
        .lean(),
    ]);

    const salesRevenue = sales.reduce((s, r) => s + r.salePrice * r.qty, 0);
    const cogs = sales.reduce((s, r) => s + r.buyPriceSnapshot * r.qty, 0);
    const grossProfit = salesRevenue - cogs;

    const otherIncome = txs
      .filter((t) => t.direction === 'INCOME')
      .reduce((s, t) => s + (t.amount || 0), 0);
    const otherExpense = txs
      .filter((t) => t.direction === 'EXPENSE')
      .reduce((s, t) => s + (t.amount || 0), 0);

    const wages = attendanceRows.reduce((s, r) => s + (r.dailyRate || 0), 0);
    const advances = advanceRows.reduce((s, r) => s + (r.amount || 0), 0);

    const net = grossProfit + otherIncome - otherExpense - wages - advances;

    res.json({
      date: label,
      salesRevenue,
      cogs,
      grossProfit,
      wages,
      advances,
      otherIncome,
      otherExpense,
      net,
      counts: {
        sales: sales.length,
        transactions: txs.length,
        employeesMarked: attendanceRows.length,
        advances: advanceRows.length,
      },
      breakdown: {
        topSales: sales
          .slice()
          .sort((a, b) => b.qty * b.salePrice - a.qty * a.salePrice)
          .slice(0, 5)
          .map((r) => ({
            itemName: r.itemName,
            qty: r.qty,
            revenue: r.qty * r.salePrice,
            profit: r.profit,
          })),
        expenses: txs
          .filter((t) => t.direction === 'EXPENSE')
          .slice(0, 5)
          .map((t) => ({ amount: t.amount, note: t.notes || '' })),
      },
    });
  } catch (e) {
    console.error('duebook pnl error', e);
    res.status(500).json({ error: 'Error computing P&L' });
  }
});

export default router;
