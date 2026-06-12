import api from '@/lib/api';

export interface CashboxTransaction {
  _id?: string;
  id?: string;
  type: 'cash_in' | 'cash_out';
  amount: number;
  source: string; // 'manual' | 'transaction' | 'sale' | 'purchase' | 'expense'
  note: string;
  date: string;
  createdAt: string;
}

export interface CashboxSummary {
  totalCashIn: number;
  totalCashOut: number;
  balance: number;
  totalTransactions: number;
  totalAmount: number;
}

function normalizeTx(tx: Partial<CashboxTransaction> & { id?: string; _id?: string }): CashboxTransaction {
  return {
    _id: tx._id || tx.id,
    id: tx.id || tx._id,
    type: tx.type || 'cash_in',
    amount: Number(tx.amount || 0),
    source: tx.source || 'manual',
    note: tx.note || '',
    date: tx.date || tx.createdAt || new Date().toISOString(),
    createdAt: tx.createdAt || tx.date || new Date().toISOString(),
  };
}

export async function fetchCashboxTransactions(
  tenantId: string,
  params?: Record<string, string>
): Promise<{ transactions: CashboxTransaction[]; total: number; summary: CashboxSummary }> {
  const res = await api.get('/cashbox', { params, headers: { 'X-Tenant-Id': tenantId } });
  const data = res.data;
  const transactions = Array.isArray(data?.items) ? data.items.map(normalizeTx) : [];
  return {
    transactions,
    total: data?.total || 0,
    summary: data?.summary || { totalCashIn: 0, totalCashOut: 0, balance: 0, totalTransactions: 0, totalAmount: 0 },
  };
}

export async function fetchCashboxSummary(
  tenantId: string,
  params?: Record<string, string>
): Promise<CashboxSummary> {
  const res = await api.get('/cashbox/summary', { params, headers: { 'X-Tenant-Id': tenantId } });
  return res.data;
}

export async function createCashboxTransaction(
  tenantId: string,
  tx: { type: 'cash_in' | 'cash_out'; amount: number; source?: string; note?: string; date?: string }
): Promise<CashboxTransaction> {
  const res = await api.post('/cashbox', {
    type: tx.type,
    amount: tx.amount,
    source: tx.source || 'manual',
    note: tx.note || '',
    date: tx.date || new Date().toISOString(),
  }, { headers: { 'X-Tenant-Id': tenantId } });
  return normalizeTx(res.data);
}

export async function deleteCashboxTransaction(tenantId: string, id: string): Promise<void> {
  await api.delete(`/cashbox/${id}`, { headers: { 'X-Tenant-Id': tenantId } });
}
