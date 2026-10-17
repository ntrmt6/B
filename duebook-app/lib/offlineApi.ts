import api from './api';
import { db, hasIDB, type EntityRow, type TxRow } from './db';
import { enqueue, list as listQueue, realId, remove as removeQueue } from './offlineQueue';

interface Entity {
  _id: string;
  name: string;
  phone?: string;
  type: 'Customer' | 'Supplier' | 'Employee';
  totalOwedToMe: number;
  totalIOweThemNumber: number;
  profilePicture?: string;
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
  photo?: string;
  _pending?: boolean;
  _qid?: string;
}

const LEGACY_PREFIX = 'duebook_cache_';
const isNetworkErr = (err: unknown) => !(err as { response?: unknown })?.response;
const isOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false;
const tempId = (prefix: string) => `temp_${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const isTempId = (id: string | undefined | null) => typeof id === 'string' && id.startsWith('temp_');

/* ─────────────── Legacy localStorage → Dexie migration (one-time) ─────────────── */

const migratedTenants = new Set<string>();
async function migrateLegacy(tid: string) {
  if (!hasIDB() || typeof localStorage === 'undefined') return;
  if (migratedTenants.has(tid)) return;
  migratedTenants.add(tid);
  try {
    const entKey = `${LEGACY_PREFIX}entities__${tid}`;
    const pendEntKey = `${LEGACY_PREFIX}pendingent__${tid}`;
    const entRaw = localStorage.getItem(entKey);
    const pendEntRaw = localStorage.getItem(pendEntKey);
    const rows: EntityRow[] = [];
    if (entRaw) {
      try {
        const list: Entity[] = JSON.parse(entRaw);
        for (const e of list) rows.push({ ...e, tenantId: tid, _pending: false });
      } catch {}
      localStorage.removeItem(entKey);
    }
    if (pendEntRaw) {
      try {
        const list: Entity[] = JSON.parse(pendEntRaw);
        for (const e of list) rows.push({ ...e, tenantId: tid, _pending: true });
      } catch {}
      localStorage.removeItem(pendEntKey);
    }
    if (rows.length) await db().entities.bulkPut(rows);

    // Transactions were keyed per-entity; sweep any legacy keys for this tid.
    const txKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.startsWith(`${LEGACY_PREFIX}tx__${tid}__`) || k.startsWith(`${LEGACY_PREFIX}pendingtx__${tid}__`)) {
        txKeys.push(k);
      }
    }
    const txRows: TxRow[] = [];
    for (const k of txKeys) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      try {
        const list: Transaction[] = JSON.parse(raw);
        const pending = k.includes('pendingtx__');
        const entityId = k.split('__').pop() || '';
        for (const t of list) {
          txRows.push({
            _id: t._id,
            tenantId: tid,
            entityId: t.entityId || entityId,
            amount: t.amount,
            direction: t.direction,
            transactionDate: t.transactionDate,
            notes: t.notes,
            status: t.status,
            photo: t.photo,
            _pending: pending || t._pending,
            _qid: t._qid,
          });
        }
      } catch {}
      localStorage.removeItem(k);
    }
    if (txRows.length) await db().transactions.bulkPut(txRows);
  } catch {}
}

/* ─────────────── READS ─────────────── */

export interface ReadResult<T> { data: T; offline: boolean; }

async function readCachedEntities(tid: string): Promise<Entity[]> {
  if (!hasIDB()) return [];
  const rows = await db().entities.where({ tenantId: tid }).toArray();
  return rows.map(({ tenantId: _t, ...rest }) => rest as Entity);
}

async function writeFreshEntities(tid: string, list: Entity[]) {
  if (!hasIDB()) return;
  await db().transaction('rw', db().entities, async () => {
    // Keep locally-pending rows (either temp ids not yet mapped, or edits still queued).
    const existingPending = await db().entities
      .where({ tenantId: tid })
      .filter(r => r._pending === true && isTempId(r._id) && !realId(r._id))
      .toArray();
    await db().entities.where({ tenantId: tid }).delete();
    const serverRows: EntityRow[] = list.map(e => ({ ...e, tenantId: tid, _pending: false }));
    await db().entities.bulkPut([...serverRows, ...existingPending]);
  });
}

export async function getEntitiesOffline(tid: string): Promise<ReadResult<Entity[]>> {
  await migrateLegacy(tid);
  const cached = await readCachedEntities(tid);

  // Local-first: if we have cache, resolve immediately and refresh in background.
  if (cached.length > 0) {
    void refreshEntitiesInBackground(tid);
    return { data: cached, offline: isOffline() };
  }

  // Cold start: no cache yet, fetch synchronously.
  try {
    const r = await api.get('/entities', { headers: { 'X-Tenant-Id': tid } });
    const list: Entity[] = r.data?.entities || r.data || [];
    await writeFreshEntities(tid, list);
    return { data: list, offline: false };
  } catch (err) {
    if (isNetworkErr(err)) return { data: [], offline: true };
    throw err;
  }
}

async function refreshEntitiesInBackground(tid: string) {
  if (isOffline()) return;
  try {
    const r = await api.get('/entities', { headers: { 'X-Tenant-Id': tid } });
    const list: Entity[] = r.data?.entities || r.data || [];
    await writeFreshEntities(tid, list);
  } catch {}
}

async function readCachedTx(tid: string, entityId: string): Promise<Transaction[]> {
  if (!hasIDB()) return [];
  const rows = await db().transactions.where({ tenantId: tid, entityId }).toArray();
  return rows.map(({ tenantId: _t, ...rest }) => rest as Transaction);
}

async function writeFreshTx(tid: string, entityId: string, list: Transaction[]) {
  if (!hasIDB()) return;
  const queueIds = new Set(listQueue().map(q => q.id));
  await db().transaction('rw', db().transactions, async () => {
    const pending = await db().transactions
      .where({ tenantId: tid, entityId })
      .filter(r => r._pending === true && !!r._qid && queueIds.has(r._qid))
      .toArray();
    await db().transactions.where({ tenantId: tid, entityId }).delete();
    const serverRows: TxRow[] = list.map(t => ({
      _id: t._id,
      tenantId: tid,
      entityId: t.entityId || entityId,
      amount: t.amount,
      direction: t.direction,
      transactionDate: t.transactionDate,
      notes: t.notes,
      status: t.status,
      photo: t.photo,
      _pending: false,
    }));
    await db().transactions.bulkPut([...serverRows, ...pending]);
  });
}

export async function getTxOffline(tid: string, entityId: string): Promise<ReadResult<Transaction[]>> {
  await migrateLegacy(tid);
  const cached = await readCachedTx(tid, entityId);

  if (isTempId(entityId)) {
    // Parent not synced yet — only local rows exist.
    return { data: cached, offline: true };
  }

  if (cached.length > 0) {
    void refreshTxInBackground(tid, entityId);
    return { data: cached, offline: isOffline() };
  }

  try {
    const r = await api.get('/transactions', { params: { entityId }, headers: { 'X-Tenant-Id': tid } });
    const list: Transaction[] = r.data?.transactions || r.data || [];
    await writeFreshTx(tid, entityId, list);
    return { data: list, offline: false };
  } catch (err) {
    if (isNetworkErr(err)) return { data: [], offline: true };
    throw err;
  }
}

async function refreshTxInBackground(tid: string, entityId: string) {
  if (isOffline()) return;
  try {
    const r = await api.get('/transactions', { params: { entityId }, headers: { 'X-Tenant-Id': tid } });
    const list: Transaction[] = r.data?.transactions || r.data || [];
    await writeFreshTx(tid, entityId, list);
  } catch {}
}

/* ─────────────── MUTATIONS ─────────────── */

async function putEntityRow(tid: string, e: Entity, pending: boolean) {
  if (!hasIDB()) return;
  await db().entities.put({ ...e, tenantId: tid, _pending: pending });
}

async function bumpEntityTotalsDexie(tid: string, entityId: string, dir: 'INCOME' | 'EXPENSE', amt: number) {
  if (!hasIDB()) return;
  const row = await db().entities.get(entityId);
  if (!row || row.tenantId !== tid) return;
  const next: EntityRow = { ...row };
  if (dir === 'INCOME') next.totalOwedToMe = (next.totalOwedToMe || 0) + amt;
  else next.totalIOweThemNumber = (next.totalIOweThemNumber || 0) + amt;
  await db().entities.put(next);
}

interface CreateEntityPayload { name: string; phone: string; type: Entity['type']; profilePicture?: string; }
export async function createEntityOffline(tid: string, payload: CreateEntityPayload): Promise<{ entity: Entity; queued: boolean }> {
  if (!isOffline()) {
    try {
      const r = await api.post('/entities', payload, { headers: { 'X-Tenant-Id': tid } });
      const entity: Entity = r.data?.entity || r.data;
      await putEntityRow(tid, entity, false);
      return { entity, queued: false };
    } catch (err) {
      if (!isNetworkErr(err)) throw err;
    }
  }
  const ref = tempId('ent');
  const optimistic: Entity = {
    _id: ref, name: payload.name, phone: payload.phone, type: payload.type,
    totalOwedToMe: 0, totalIOweThemNumber: 0,
    profilePicture: payload.profilePicture || '',
    _pending: true,
  };
  await putEntityRow(tid, optimistic, true);
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
  photo?: string;
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
  const q = enqueue({
    type: 'add-tx', method: 'POST', url: '/transactions',
    body: payload, tenantId: tid,
    label: `${payload.direction === 'INCOME' ? 'They owe' : 'I owe'} Tk ${payload.amount}${payload.entityName ? ' — ' + payload.entityName : ''}`,
  });
  const optimistic: TxRow = {
    _id: tempId('tx'),
    tenantId: tid,
    entityId: payload.entityId,
    amount: payload.amount,
    direction: payload.direction,
    transactionDate: payload.transactionDate,
    notes: payload.notes,
    status: 'Pending',
    photo: payload.photo,
    _pending: true,
    _qid: q.id,
  };
  if (hasIDB()) await db().transactions.put(optimistic);
  await bumpEntityTotalsDexie(tid, payload.entityId, payload.direction, payload.amount);
  return { queued: true };
}

export async function patchTxStatusOffline(tid: string, txId: string, status: 'Pending' | 'Paid'): Promise<{ queued: boolean }> {
  if (isTempId(txId)) {
    throw new Error('This transaction has not synced yet — please wait for connection.');
  }
  if (!isOffline()) {
    try {
      await api.patch(`/transactions/${txId}`, { status }, { headers: { 'X-Tenant-Id': tid } });
      if (hasIDB()) {
        const row = await db().transactions.get(txId);
        if (row) await db().transactions.put({ ...row, status });
      }
      return { queued: false };
    } catch (err) {
      if (!isNetworkErr(err)) throw err;
    }
  }
  if (hasIDB()) {
    const row = await db().transactions.get(txId);
    if (row) await db().transactions.put({ ...row, status, _pending: true });
  }
  enqueue({
    type: 'patch-tx', method: 'PATCH', url: `/transactions/${txId}`,
    body: { status }, tenantId: tid,
    label: `Mark tx ${status.toLowerCase()}`,
  });
  return { queued: true };
}

export async function deleteTxOffline(tid: string, txId: string, entityId?: string): Promise<{ queued: boolean }> {
  if (isTempId(txId)) {
    if (hasIDB()) {
      const row = await db().transactions.get(txId);
      await db().transactions.delete(txId);
      if (row?._qid) removeQueue(row._qid);
      if (row && entityId) {
        await bumpEntityTotalsDexie(tid, entityId, row.direction, -row.amount);
      }
    }
    return { queued: false };
  }
  if (!isOffline()) {
    try {
      await api.delete(`/transactions/${txId}`, { headers: { 'X-Tenant-Id': tid } });
      if (hasIDB()) await db().transactions.delete(txId);
      return { queued: false };
    } catch (err) {
      if (!isNetworkErr(err)) throw err;
    }
  }
  if (hasIDB()) await db().transactions.delete(txId);
  enqueue({
    type: 'delete-tx', method: 'DELETE', url: `/transactions/${txId}`,
    tenantId: tid,
    label: `Delete transaction`,
  });
  return { queued: true };
}

export async function patchEntityOffline(tid: string, id: string, payload: { name: string; phone: string; profilePicture?: string }): Promise<{ queued: boolean }> {
  if (isTempId(id)) throw new Error('This contact has not synced yet — please wait for connection.');
  if (!isOffline()) {
    try {
      await api.put(`/entities/${id}`, payload, { headers: { 'X-Tenant-Id': tid } });
      if (hasIDB()) {
        const row = await db().entities.get(id);
        if (row) await db().entities.put({ ...row, ...payload });
      }
      return { queued: false };
    } catch (err) {
      if (!isNetworkErr(err)) throw err;
    }
  }
  if (hasIDB()) {
    const row = await db().entities.get(id);
    if (row) await db().entities.put({ ...row, ...payload, _pending: true });
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
      if (hasIDB()) {
        await db().entities.delete(id);
        await db().transactions.where({ tenantId: tid, entityId: id }).delete();
      }
      return { queued: false };
    } catch (err) {
      if (!isNetworkErr(err)) throw err;
    }
  }
  if (hasIDB()) {
    await db().entities.delete(id);
    await db().transactions.where({ tenantId: tid, entityId: id }).delete();
  }
  enqueue({
    type: 'delete-entity', method: 'DELETE', url: `/entities/${id}`,
    tenantId: tid,
    label: `Delete contact: ${name}`,
  });
  return { queued: true };
}

/* Legacy no-op kept for callers that still invoke it. */
export function pruneSyncedPending(_tid: string) { /* handled implicitly by Dexie refresh */ }
