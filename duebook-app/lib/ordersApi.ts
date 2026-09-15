import api from './api';

export type OrderStatus = 'new' | 'making' | 'ready' | 'cancelled';
export type OrderPayment = 'nagad' | 'bkash' | 'baki';

export interface OrderItem {
  menuItemId?: string;
  nameBn: string;
  priceAt: number;
  qty: number;
  note?: string;
}

export interface OrderDoc {
  _id: string;
  tenantId?: string;
  code: string;
  items: OrderItem[];
  customerName?: string;
  entityId?: string;
  linkedTxId?: string;
  note?: string;
  paymentMethod: OrderPayment;
  total: number;
  status: OrderStatus;
  createdByRole: 'owner' | 'employee';
  createdAt: string;
  updatedAt: string;
}

export interface DailySummary {
  orderCount: number;
  cancelled: number;
  perItem: Record<string, number>;
  totals: { cash: number; digital: number; baki: number; all: number };
}

export interface CreateOrderPayload {
  items: OrderItem[];
  customerName?: string;
  entityId?: string;
  note?: string;
  paymentMethod: OrderPayment;
}

export interface EditOrderPayload {
  items?: OrderItem[];
  customerName?: string;
  note?: string;
}

export async function listOrders(tid: string, opts?: { from?: string; to?: string; status?: OrderStatus }): Promise<OrderDoc[]> {
  const r = await api.get('/duebook/orders', {
    headers: { 'X-Tenant-Id': tid },
    params: opts,
  });
  return r.data || [];
}

export async function createOrder(tid: string, body: CreateOrderPayload): Promise<OrderDoc> {
  const r = await api.post('/duebook/orders', body, { headers: { 'X-Tenant-Id': tid } });
  return r.data;
}

export async function editOrder(tid: string, id: string, body: EditOrderPayload): Promise<OrderDoc> {
  const r = await api.patch(`/duebook/orders/${id}`, body, { headers: { 'X-Tenant-Id': tid } });
  return r.data;
}

export async function updateOrderStatus(tid: string, id: string, status: OrderStatus, reason?: string): Promise<OrderDoc> {
  const r = await api.patch(`/duebook/orders/${id}/status`, { status, reason }, { headers: { 'X-Tenant-Id': tid } });
  return r.data;
}

export async function getDailySummary(tid: string): Promise<DailySummary> {
  const r = await api.get('/duebook/orders/summary/today', { headers: { 'X-Tenant-Id': tid } });
  return r.data;
}

/* ─────────────── Offline queue for orders (owner only) ─────────────── */
// Simple pattern: if creation fails with network error, store the payload,
// retry on `online` event or on next mount.

const OFFLINE_KEY = 'duebook_orders_offline_queue';

interface QueuedOrder {
  id: string;
  createdAt: number;
  tenantId: string;
  payload: CreateOrderPayload;
  attempts: number;
  lastError?: string;
}

function readQ(): QueuedOrder[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(OFFLINE_KEY) || '[]'); } catch { return []; }
}
function writeQ(q: QueuedOrder[]) { localStorage.setItem(OFFLINE_KEY, JSON.stringify(q)); }

const isNetErr = (err: unknown) => !(err as { response?: unknown })?.response;

export function queueOfflineOrder(tid: string, payload: CreateOrderPayload): QueuedOrder {
  const q = readQ();
  const item: QueuedOrder = {
    id: `qo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: Date.now(),
    tenantId: tid,
    payload,
    attempts: 0,
  };
  q.push(item);
  writeQ(q);
  return item;
}

export function offlineOrderCount(): number { return readQ().length; }

let draining = false;
export async function drainOfflineOrders(): Promise<{ synced: number; failed: number }> {
  if (draining) return { synced: 0, failed: 0 };
  draining = true;
  let synced = 0; let failed = 0;
  try {
    let q = readQ();
    for (const item of [...q]) {
      try {
        await createOrder(item.tenantId, item.payload);
        q = readQ().filter(x => x.id !== item.id);
        writeQ(q);
        synced++;
      } catch (err: any) {
        if (isNetErr(err)) break; // stop, retry later
        item.attempts += 1;
        item.lastError = err?.response?.data?.error || err?.message || 'failed';
        q = readQ().map(x => x.id === item.id ? item : x);
        writeQ(q);
        failed++;
      }
    }
  } finally {
    draining = false;
  }
  return { synced, failed };
}

export async function createOrderResilient(tid: string, payload: CreateOrderPayload):
  Promise<{ order?: OrderDoc; queued: boolean }> {
  try {
    const order = await createOrder(tid, payload);
    return { order, queued: false };
  } catch (err) {
    if (isNetErr(err)) {
      queueOfflineOrder(tid, payload);
      return { queued: true };
    }
    throw err;
  }
}
