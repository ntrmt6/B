import { Router } from 'express';
import { getDatabase } from '../db/mongo';
import { getCached, setCachedWithTTL, CacheKeys } from '../services/redisCache';
import { getTenantData } from '../services/tenantDataService';

export const profitLossRouter = Router();

// Cache key for profit/loss summary
const getProfitLossCacheKey = (tenantId: string, from?: string, to?: string) => 
  `profitloss:${tenantId}:summary:f=${from || ''}&t=${to || ''}`;

// Convert period string to date range
function periodToDateRange(period?: string): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString();
  let fromDate: Date;

  switch (period) {
    case 'daily':
      fromDate = new Date(now); fromDate.setHours(0, 0, 0, 0);
      break;
    case 'weekly':
      fromDate = new Date(now); fromDate.setDate(fromDate.getDate() - 7);
      break;
    case 'yearly':
      fromDate = new Date(now); fromDate.setFullYear(fromDate.getFullYear() - 1);
      break;
    case 'monthly':
    default:
      fromDate = new Date(now); fromDate.setMonth(fromDate.getMonth() - 1);
      break;
  }

  return { from: fromDate.toISOString(), to };
}

// Get profit/loss summary (with caching)
profitLossRouter.get('/summary', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const { from: qFrom, to: qTo, period, tenantId: queryTenantId } = req.query as any;
    const tenantId = queryTenantId || req.headers['x-tenant-id'] || 'global';

    // Support both from/to and period params
    let from = qFrom;
    let to = qTo;
    if (!from && !to && period) {
      const range = periodToDateRange(period);
      from = range.from;
      to = range.to;
    }

    // Check cache first
    const cacheKey = getProfitLossCacheKey(tenantId, from, to);
    const cached = await getCached<any>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Helper to check if a date string falls within range
    const isInRange = (dateStr: string | undefined): boolean => {
      if (!dateStr) return false;
      if (!from && !to) return true;
      const d = new Date(dateStr).getTime();
      if (isNaN(d)) return false;
      if (from && d < new Date(from).getTime()) return false;
      if (to && d > new Date(to).getTime()) return false;
      return true;
    };

    // Build date filters for each collection using their actual field names/types
    // Expenses/Incomes store date as string (e.g. "2026-03-21" or ISO)
    // Purchases store createdAt as Date object
    const expenseDateFilter: any = {};
    if (from || to) {
      expenseDateFilter.date = {};
      if (from) expenseDateFilter.date.$gte = from.slice(0, 10); // "2026-03-21" format
      if (to) expenseDateFilter.date.$lte = to.slice(0, 10) + '\uffff'; // ensure end of day
    }

    const purchaseDateFilter: any = {};
    if (from || to) {
      purchaseDateFilter.createdAt = {};
      if (from) purchaseDateFilter.createdAt.$gte = new Date(from);
      if (to) purchaseDateFilter.createdAt.$lte = new Date(to);
    }

    const expenseFilter: any = { ...expenseDateFilter };
    if (tenantId && tenantId !== 'global') expenseFilter.tenantId = tenantId;
    
    const incomeFilter: any = { ...expenseDateFilter };
    if (tenantId && tenantId !== 'global') incomeFilter.tenantId = tenantId;

    const purchaseFilter: any = { ...purchaseDateFilter };
    if (tenantId && tenantId !== 'global') purchaseFilter.tenantId = tenantId;

    // Run all queries in parallel for speed
    // Orders are stored via tenantDataService (tenant_data collection), NOT a separate orders collection
    const [allOrders, expenses, incomes, purchaseDocs, tenantProducts] = await Promise.all([
      getTenantData<any[]>(tenantId, 'orders').catch(() => []),
      db.collection('expenses').find(expenseFilter).toArray(),
      db.collection('incomes').find(incomeFilter).toArray().catch(() => []),
      db.collection('purchases').find(purchaseFilter).toArray().catch(() => []),
      getTenantData<any[]>(tenantId, 'products').catch(() => [])
    ]);

    // Filter orders by date range and valid status (in-memory since they're stored as array)
    const validStatuses = new Set(['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Processing', 'Sent to Courier']);
    const orders = (Array.isArray(allOrders) ? allOrders : []).filter(
      (o: any) => validStatuses.has(o.status) && isInRange(o.date || o.createdAt)
    );

    // Ensure products is an array
    const products = Array.isArray(tenantProducts) ? tenantProducts : [];
    const productMap = new Map(products.map((p: any) => [p.id?.toString(), p]));

    // Calculate total revenue from orders (selling price = amount - deliveryCharge)
    const totalRevenue = orders.reduce(
      (sum: number, o: any) => sum + (o.amount || o.total || o.grandTotal || 0),
      0
    );

    // Calculate total purchases from purchases collection
    const totalPurchases = (Array.isArray(purchaseDocs) ? purchaseDocs : []).reduce(
      (sum: number, p: any) => sum + (p.totalAmount || p.amount || 0),
      0
    );

    // Calculate total expenses
    const totalExpenses = expenses.reduce((sum, e: any) => sum + (Number(e.amount) || 0), 0);

    // Calculate other income
    const totalIncome = incomes.reduce((sum, i: any) => sum + (Number(i.amount) || 0), 0);

    // Net profit = revenue + other income - expenses - purchases
    const netProfit = totalRevenue + totalIncome - totalExpenses - totalPurchases;

    const result = {
      // Flat fields for easy frontend consumption
      totalRevenue,
      totalExpenses,
      totalPurchases,
      totalIncome,
      netProfit,
      orderCount: orders.length,
      expenseCount: expenses.length,
      incomeCount: incomes.length,
      purchaseCount: (Array.isArray(purchaseDocs) ? purchaseDocs : []).length,
      // Detailed breakdown for advanced views
      profitFromSale: {
        sellingPrice: totalRevenue,
        purchasePrice: totalPurchases,
        deliveryPrice: orders.reduce((sum: number, o: any) => sum + (o.deliveryCharge || 0), 0),
        profit: totalRevenue - totalPurchases,
      },
      otherIncome: totalIncome,
      otherExpense: totalExpenses,
      totalProfitLoss: netProfit,
    };

    // Cache for 2 minutes
    setCachedWithTTL(cacheKey, result, 'short');

    res.json(result);
  } catch (e) {
    next(e);
  }
});

// Get detailed transactions
profitLossRouter.get('/details', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const { from: qFrom, to: qTo, period, type, tenantId: queryTenantId, page = 1, pageSize = 20 } = req.query as any;
    const tenantId = queryTenantId || req.headers['x-tenant-id'] || 'global';
    const pageNum = Number(page);
    const pageSizeNum = Number(pageSize);

    // Support both from/to and period params
    let from = qFrom;
    let to = qTo;
    if (!from && !to && period) {
      const range = periodToDateRange(period);
      from = range.from;
      to = range.to;
    }

    // Helper to check date range for in-memory filtering
    const isInRange = (dateStr: string | undefined): boolean => {
      if (!dateStr) return false;
      if (!from && !to) return true;
      const d = new Date(dateStr).getTime();
      if (isNaN(d)) return false;
      if (from && d < new Date(from).getTime()) return false;
      if (to && d > new Date(to).getTime()) return false;
      return true;
    };

    // Build date filters for each collection
    const expenseDateFilter: any = {};
    if (from || to) {
      expenseDateFilter.date = {};
      if (from) expenseDateFilter.date.$gte = from.slice(0, 10);
      if (to) expenseDateFilter.date.$lte = to.slice(0, 10) + '\uffff';
    }

    const items: any[] = [];

    // Get sales if requested or no type filter
    // Orders are stored via tenantDataService, not in a separate collection
    if (!type || type === 'sale') {
      const allOrders = await getTenantData<any[]>(tenantId, 'orders').catch(() => []);
      const validStatuses = new Set(['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Processing', 'Sent to Courier']);
      const orders = (Array.isArray(allOrders) ? allOrders : []).filter(
        (o: any) => validStatuses.has(o.status) && isInRange(o.date || o.createdAt)
      );
      orders.forEach((o: any) => {
        items.push({
          id: o._id?.toString() || o.id,
          date: o.date || o.createdAt,
          type: 'sale',
          description: `Order #${o.id || o._id} - ${o.productName || 'Product'}`,
          amount: o.amount || o.total || o.grandTotal || 0,
          category: 'Sales',
        });
      });
    }

    // Get expenses if requested or no type filter
    if (!type || type === 'expense') {
      const expensesCol = db.collection('expenses');
      const expenseFilter: any = { ...expenseDateFilter };
      if (tenantId && tenantId !== 'global') expenseFilter.tenantId = tenantId;
      
      const expenses = await expensesCol.find(expenseFilter).toArray();
      expenses.forEach((e: any) => {
        items.push({
          id: e._id?.toString() || e.id,
          date: e.date,
          type: 'expense',
          description: e.name || 'Expense',
          amount: e.amount || 0,
          category: e.category,
        });
      });
    }

    // Get incomes if requested or no type filter
    if (!type || type === 'income') {
      try {
        const incomesCol = db.collection('incomes');
        const incomeFilter: any = { ...expenseDateFilter };
        if (tenantId && tenantId !== 'global') incomeFilter.tenantId = tenantId;
        
        const incomes = await incomesCol.find(incomeFilter).toArray();
        incomes.forEach((i: any) => {
          items.push({
            id: i._id?.toString() || i.id,
            date: i.date,
            type: 'income',
            description: i.name || 'Income',
            amount: i.amount || 0,
            category: i.category,
          });
        });
      } catch (e) {
        // Incomes collection may not exist
      }
    }

    // Sort by date descending
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Paginate
    const total = items.length;
    const paged = items.slice((pageNum - 1) * pageSizeNum, pageNum * pageSizeNum);

    res.json({ items: paged, total });
  } catch (e) {
    next(e);
  }
});

export default profitLossRouter;
