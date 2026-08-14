import api from './api';
import { enqueue, list as listQueue, realId } from './offlineQueue';

interface Entity {
  _id: string;
  name: string;
  phone?: string;
  type: 'Customer' | 'Supplier' | 'Employee';
  totalOwedToMe: number;
  totalIOweThemNumber: number;
  _pending?: boolean;
}

interface Transaction {
  _id: string;
  amount: number;
  direction: 'INCOME' | 'EXPENSE';
  transactionDate: string;
  notes?: string;
  status: 'Pending' | 'Paid' | 'Cancelled';
  entityId?: string;
  _pending?: boolean;
  _qid?: string;
}

const CACHE_PREFIX = 'duebook_cache_';
const ck = {
  entities: (tid: string) => `${CACHE_PREFIX}entities__${tid}`,
  tx: (tid: string, eid: string) => `${CACHE_PREFIX}tx__${tid}__${eid}`,
  pendingTx: (tid: string, eid: string) => `${CACHE_PREFIX}pendingtx__${tid}__${eid}`,
  pendingEntities: (tid: string) => `${CACHE_PREFIX}pendingent__${tid}`,
};

function readCache<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; }
  catch { return fallback; }
}
function writeCache<T>(key: string, value: T) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

const isNetworkErr = (err: unknown) => !(err as { response?: unknown })?.response;
const isOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false;
const tempId = (prefix: string) => `temp_${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const isTempId = (id: string | undefined | null) => typeof id === 'string' && id.startsWith('temp_');

/* ─────────────── READS ─────────────── */

export interface ReadResult<T> { data: T; offline: boolean; }

export async function getEntitiesOffline(tid: string): Promise<ReadResult<Entity[]>> {
  const pending = readCache<Entity[]>(ck.pendingEntities(tid), []);
  try {
    const r = await api.get('/entities', { headers: { 'X-Tenant-Id': tid } });
    const list: Entity[] = r.data?.entities || r.data || [];
    writeCache(ck.entities(tid), list);
    // Drop synced-pending entries (whose temp id has resolved)
    const stillPending = pending.filter(p => isTempId(p._id) && !realId(p._id));
    writeCache(ck.pendingEntities(tid), stillPending);
    return { data: [...list, ...stillPending], offline: false };
  } catch (err) {
    if (isNetworkErr(err)) {
      const cached = readCache<Entity[]>(ck.entities(tid), []);
      return { data: [...cached, ...pending], offline: true };
    }
    throw err;
  }
}

export async function getTxOffline(tid: string, entityId: string): Promise<ReadResult<Transaction[]>> {
  const pending = readCache<Transaction[]>(ck.pendingTx(tid, entityId), []);
  if (isTempId(entityId)) {
    // Cannot fetch from server; only pending local items
    return { data: pending, offline: true };
  }
  try {
    const r = await api.get('/transactions', { params: { entityId }, headers: { 'X-Tenant-Id': tid } });
    const list: Transaction[] = r.data?.transactions || r.data || [];
    writeCache(ck.tx(tid, entityId), list);
    // Drop pending tx whose queue item has drained (server list now holds the real record).
    // Legacy pending items without _qid are also dropped — server fetch succeeded, so they're stale.
    const queueIds = new Set(listQueue().map(q => q.id));
    const stillPending = pending.filter(p => p._qid && queueIds.has(p._qid));
    if (stillPending.length !== pending.length) writeCache(ck.pendingTx(tid, entityId), stillPending);
    return { data: [...list, ...stillPending], offline: false };
  } catch (err) {
    if (isNetworkErr(err)) {
      const cached = readCache<Transaction[]>(ck.tx(tid, entityId), []);
      return { data: [...cached, ...pending], offline: true };
    }
    throw err;
  }
}

/* ─────────────── MUTATIONS ─────────────── */

interface CreateEntityPayload { name: string; phone: string; type: Entity['type']; }
export async function createEntityOffline(tid: string, payload: CreateEntityPayload): Promise<{ entity: Entity; queued: boolean }> {
  if (!isOffline()) {
    try {
      const r = await api.post('/entities', payload, { headers: { 'X-Tenant-Id': tid } });
      const entity: Entity = r.data?.entity || r.data;
      return { entity, queued: false };
    } catch (err) {
      if (!isNetworkErr(err)) throw err;
    }
  }
  const ref = tempId('ent');
  const optimistic: Entity = {
    _id: ref, name: payload.name, phone: payload.phone, type: payload.type,
    totalOwedToMe: 0, totalIOweThemNumber: 0, _pending: true,
  };
  const pending = readCache<Entity[]>(ck.pendingEntities(tid), []);
  writeCache(ck.pendingEntities(tid), [...pending, optimistic]);
  enqueue({
    type: 'create-entity', method: 'POST', url: '/entities',
    body: payload, tenantId: tid,
    label: `Add contact: ${payload.name}`,
    refId: ref, refKind: 'entity',
  });
  return { entity: optimistic, queued: true };
}

interface AddTxPayload {
  entityId: string; entityName?: string;
  amount: number; direction: 'INCOME' | 'EXPENSE';
  transactionDate: string; notes?: string;
}
export async function addTxOffline(tid: string, payload: AddTxPayload): Promise<{ queued: boolean }> {
  if (!isOffline()) {
    try {
      await api.post('/transactions', payload, { headers: { 'X-Tenant-Id': tid } });
      return { queued: false };
    } catch (err) {
      if (!isNetworkErr(err)) throw err;
    }
  }
  // Optimistic local tx
  const q = enqueue({
    type: 'add-tx', method: 'POST', url: '/transactions',
    body: payload, tenantId: tid,
    label: `${payload.direction === 'INCOME' ? 'They owe' : 'I owe'} Tk ${payload.amount}${payload.entityName ? ' — ' + payload.entityName : ''}`,
  });
  const optimistic: Transaction = {
    _id: tempId('tx'),
    amount: payload.amount,
    direction: payload.direction,
    transactionDate: payload.transactionDate,
    notes: payload.notes,
    status: 'Pending',
    entityId: payload.entityId,
    _pending: true,
    _qid: q.id,
  };
  const pKey = ck.pendingTx(tid, payload.entityId);
  writeCache(pKey, [...readCache<Transaction[]>(pKey, []), optimistic]);
  // Bump cached entity totals so summary reflects pending changes
  bumpEntityTotals(tid, payload.entityId, payload.direction, payload.amount);
  return { queued: true };
}

function bumpEntityTotals(tid: string, entityId: string, dir: 'INCOME' | 'EXPENSE', amt: number) {
  const cached = readCache<Entity[]>(ck.entities(tid), []);
  const idx = cached.findIndex(e => e._id === entityId);
  if (idx >= 0) {
    const e = { ...cached[idx] };
    if (dir === 'INCOME') e.totalOwedToMe = (e.totalOwedToMe || 0) + amt;
    else e.totalIOweThemNumber = (e.totalIOweThemNumber || 0) + amt;
    cached[idx] = e;
    writeCache(ck.entities(tid), cached);
    return;
  }
  const pending = readCache<Entity[]>(ck.pendingEntities(tid), []);
  const pIdx = pending.findIndex(e => e._id === entityId);
  if (pIdx >= 0) {
    const e = { ...pending[pIdx] };
    if (dir === 'INCOME') e.totalOwedToMe = (e.totalOwedToMe || 0) + amt;
    else e.totalIOweThemNumber = (e.totalIOweThemNumber || 0) + amt;
    pending[pIdx] = e;
    writeCache(ck.pendingEntities(tid), pending);
  }
}

export async function patchTxStatusOffline(tid: string, txId: string, status: 'Pending' | 'Paid'): Promise<{ queued: boolean }> {
  if (isTempId(txId)) {
    throw new Error('This transaction has not synced yet — please wait for connection.');
  }
  if (!isOffline()) {
    try {
      await api.patch(`/transactions/${txId}`, { status }, { headers: { 'X-Tenant-Id': tid } });
      return { queued: false };
    } catch (err) {
      if (!isNetworkErr(err)) throw err;
    }
  }
  enqueue({
    type: 'patch-tx', method: 'PATCH', url: `/transactions/${txId}`,
    body: { status }, tenantId: tid,
    label: `Mark tx ${status.toLowerCase()}`,
  });
  return { queued: true };
}

export async function patchEntityOffline(tid: string, id: string, payload: { name: string; phone: string }): Promise<{ queued: boolean }> {
  if (isTempId(id)) throw new Error('This contact has not synced yet — please wait for connection.');
  if (!isOffline()) {
    try {
      await api.put(`/entities/${id}`, payload, { headers: { 'X-Tenant-Id': tid } });
      return { queued: false };
    } catch (err) {
      if (!isNetworkErr(err)) throw err;
    }
  }
  enqueue({
    type: 'patch-entity', method: 'PUT', url: `/entities/${id}`,
    body: payload, tenantId: tid,
    label: `Edit contact: ${payload.name}`,
  });
  return { queued: true };
}

export async function deleteEntityOffline(tid: string, id: string, name: string): Promise<{ queued: boolean }> {
  if (isTempId(id)) throw new Error('This contact has not synced yet — please wait for connection.');
  if (!isOffline()) {
    try {
      await api.delete(`/entities/${id}`, { headers: { 'X-Tenant-Id': tid } });
      return { queued: false };
    } catch (err) {
      if (!isNetworkErr(err)) throw err;
    }
  }
  enqueue({
    type: 'delete-entity', method: 'DELETE', url: `/entities/${id}`,
    tenantId: tid,
    label: `Delete contact: ${name}`,
  });
  return { queued: true };
}

/* Clean cached pending items whose queue entries have all synced. */
export function pruneSyncedPending(tid: string) {
  // Remove pending tx entries whose corresponding queue items are gone.
  // (This is a best-effort cleanup — after a successful refetch the cached
  // list already has the server-side rows, so purging pending is safe.)
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(`${CACHE_PREFIX}pendingtx__${tid}__`)) keys.push(k);
  }
  keys.forEach(k => localStorage.removeItem(k));
}
