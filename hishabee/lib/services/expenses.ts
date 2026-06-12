import api from '@/lib/api';

export interface Expense {
  _id?: string;
  id?: string;
  name: string;
  amount: number;
  category?: string;
  date: string;
  status?: string;
  note?: string;
  createdAt: string;
}

function normalizeExpense(expense: Partial<Expense> & { id?: string; _id?: string }): Expense {
  return {
    _id: expense._id || expense.id,
    id: expense.id || expense._id,
    name: expense.name || '',
    amount: Number(expense.amount || 0),
    category: expense.category,
    date: expense.date || expense.createdAt || new Date().toISOString(),
    status: expense.status,
    note: expense.note,
    createdAt: expense.createdAt || expense.date || new Date().toISOString(),
  };
}

export async function fetchExpenses(tenantId: string, params?: Record<string, string>): Promise<{ expenses: Expense[]; total: number }> {
  const res = await api.get('/expenses', { params, headers: { 'X-Tenant-Id': tenantId } });
  // Backend returns { items: [...], total }
  const data = res.data;
  const expenses = Array.isArray(data?.items) ? data.items.map(normalizeExpense) : [];
  return {
    expenses,
    total: data?.total || 0,
  };
}

export async function createExpense(tenantId: string, expense: Partial<Expense>): Promise<Expense> {
  // Backend POST /expenses expects: name, category, amount, date, status
  const res = await api.post('/expenses', {
    name: expense.name,
    category: expense.category || 'Other',
    amount: expense.amount,
    date: expense.date || new Date().toISOString(),
    status: expense.status || 'active',
    note: expense.note,
  }, { headers: { 'X-Tenant-Id': tenantId } });
  return normalizeExpense(res.data);
}

export async function deleteExpense(tenantId: string, id: string): Promise<void> {
  await api.delete(`/expenses/${id}`, { headers: { 'X-Tenant-Id': tenantId } });
}
