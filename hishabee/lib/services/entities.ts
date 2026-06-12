import api from '@/lib/api';

export interface Entity {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  type: 'Customer' | 'Supplier' | 'Employee';
  totalOwedToMe: number;
  totalIOweThemNumber: number;
  createdAt: string;
}

export interface Transaction {
  _id?: string;
  id?: string;
  entityId: string;
  type: 'due' | 'payment' | 'advance';
  amount: number;
  description?: string;
  date: string;
  createdAt: string;
  direction?: 'INCOME' | 'EXPENSE';
  transactionDate?: string;
  notes?: string;
  status?: 'Pending' | 'Paid' | 'Cancelled';
}

function normalizeTransaction(tx: Partial<Transaction> & { _id?: string; id?: string; direction?: 'INCOME' | 'EXPENSE'; transactionDate?: string; notes?: string }): Transaction {
  const type = tx.type || (tx.direction === 'INCOME' ? 'due' : tx.direction === 'EXPENSE' ? 'payment' : 'advance');
  const date = tx.date || tx.transactionDate || tx.createdAt || new Date().toISOString();

  return {
    _id: tx._id || tx.id,
    id: tx.id || tx._id,
    entityId: tx.entityId || '',
    type,
    amount: Number(tx.amount || 0),
    description: tx.description || tx.notes,
    date,
    createdAt: tx.createdAt || date,
    direction: tx.direction,
    transactionDate: tx.transactionDate || date,
    notes: tx.notes,
    status: tx.status,
  };
}

export async function fetchEntities(tenantId: string): Promise<Entity[]> {
  const res = await api.get('/entities', { headers: { 'X-Tenant-Id': tenantId } });
  return res.data?.entities || res.data || [];
}

export async function createEntity(tenantId: string, entity: Partial<Entity>): Promise<Entity> {
  const res = await api.post('/entities', entity, { headers: { 'X-Tenant-Id': tenantId } });
  return res.data;
}

export async function updateEntity(tenantId: string, id: string, updates: Partial<Entity>): Promise<Entity> {
  const res = await api.put(`/entities/${id}`, updates, { headers: { 'X-Tenant-Id': tenantId } });
  return res.data;
}

export async function deleteEntity(tenantId: string, id: string): Promise<void> {
  await api.delete(`/entities/${id}`, { headers: { 'X-Tenant-Id': tenantId } });
}

export async function fetchTransactions(tenantId: string, entityId?: string): Promise<Transaction[]> {
  const params = entityId ? { entityId } : {};
  const res = await api.get('/transactions', { params, headers: { 'X-Tenant-Id': tenantId } });
  const transactions = Array.isArray(res.data?.transactions) ? res.data.transactions : Array.isArray(res.data) ? res.data : [];
  return transactions.map(normalizeTransaction);
}

export async function createTransaction(tenantId: string, tx: Partial<Transaction>): Promise<Transaction> {
  const direction = tx.type === 'due' ? 'INCOME' : 'EXPENSE';
  const payload = {
    entityId: tx.entityId,
    amount: tx.amount,
    direction,
    transactionDate: tx.date || new Date().toISOString(),
    notes: tx.description,
    transactionType: tx.type,
  };
  const res = await api.post('/transactions', payload, { headers: { 'X-Tenant-Id': tenantId } });
  return normalizeTransaction(res.data);
}
