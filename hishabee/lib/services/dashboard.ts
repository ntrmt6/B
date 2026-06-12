import api from '@/lib/api';

export interface DashboardMetrics {
  todaySell: number;
  todayPurchase: number;
  todayExpense: number;
  totalStock: number;
  youWillGet: number;
  youWillGive: number;
  balance: number;
}

export async function fetchDashboardMetrics(tenantId: string, timeframe: string): Promise<DashboardMetrics> {
  const now = new Date();
  let startDate: string;
  const endDate: string = now.toISOString();

  switch (timeframe) {
    case 'Today': {
      const s = new Date(now); s.setHours(0, 0, 0, 0);
      startDate = s.toISOString();
      break;
    }
    case 'Weekly': {
      const s = new Date(now); s.setDate(s.getDate() - 7);
      startDate = s.toISOString();
      break;
    }
    case 'Monthly': {
      const s = new Date(now); s.setMonth(s.getMonth() - 1);
      startDate = s.toISOString();
      break;
    }
    case 'Yearly': {
      const s = new Date(now); s.setFullYear(s.getFullYear() - 1);
      startDate = s.toISOString();
      break;
    }
    default:
      startDate = '2020-01-01T00:00:00.000Z';
  }

  const [ordersRes, expensesRes, purchasesRes, entitiesRes] = await Promise.allSettled([
    api.get(`/orders/${tenantId}`, { params: { pageSize: 10000 } }),
    api.get('/expenses/summary', { params: { from: startDate.slice(0, 10), to: endDate.slice(0, 10) }, headers: { 'X-Tenant-Id': tenantId } }),
    api.get('/purchases', { params: { startDate: startDate.slice(0, 10), endDate: endDate.slice(0, 10), pageSize: 10000 }, headers: { 'X-Tenant-Id': tenantId } }),
    api.get('/entities', { headers: { 'X-Tenant-Id': tenantId } }),
  ]);

  let todaySell = 0;
  if (ordersRes.status === 'fulfilled') {
    const allOrders = ordersRes.value.data?.data || [];
    if (Array.isArray(allOrders)) {
      // Filter orders by date range client-side (backend doesn't filter by date)
      const fromMs = new Date(startDate).getTime();
      const toMs = new Date(endDate).getTime();
      const validStatuses = new Set(['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Processing', 'Sent to Courier']);
      const filtered = allOrders.filter((o: { date?: string; createdAt?: string; status?: string }) => {
        const d = new Date(o.date || o.createdAt || '').getTime();
        return !isNaN(d) && d >= fromMs && d <= toMs && validStatuses.has(o.status || '');
      });
      todaySell = filtered.reduce((sum: number, o: { amount?: number; total?: number; grandTotal?: number }) => sum + (o.amount || o.total || o.grandTotal || 0), 0);
    }
  }

  let todayExpense = 0;
  if (expensesRes.status === 'fulfilled') {
    todayExpense = expensesRes.value.data?.totalAmount || 0;
  }

  let todayPurchase = 0;
  if (purchasesRes.status === 'fulfilled') {
    // /purchases returns { items: [...], total: number }
    const items = purchasesRes.value.data?.items || [];
    if (Array.isArray(items)) {
      todayPurchase = items.reduce((sum: number, p: { totalAmount?: number; amount?: number }) => sum + (p.totalAmount || p.amount || 0), 0);
    }
  }

  let youWillGet = 0;
  let youWillGive = 0;
  if (entitiesRes.status === 'fulfilled') {
    // Backend returns plain array of entities
    const entities = entitiesRes.value.data;
    if (Array.isArray(entities)) {
      for (const e of entities) {
        youWillGet += e.totalOwedToMe || 0;
        youWillGive += e.totalIOweThemNumber || 0;
      }
    }
  }

  // Fetch products for stock count
  let totalStock = 0;
  try {
    const prodRes = await api.get(`/tenant-data/${tenantId}/products`);
    // Backend returns { data: <content> }
    const products = prodRes.data?.data || [];
    if (Array.isArray(products)) {
      totalStock = products.reduce((sum: number, p: { stock?: number; quantity?: number }) => sum + (p.stock || p.quantity || 0), 0);
    }
  } catch { /* ignore */ }

  const balance = todaySell - todayPurchase - todayExpense;

  return { todaySell, todayPurchase, todayExpense, totalStock, youWillGet, youWillGive, balance };
}
