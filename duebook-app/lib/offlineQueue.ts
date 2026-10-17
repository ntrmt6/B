import api from './api';
import { db, hasIDB } from './db';

export interface QueueItem {
  id: string;
  type: 'create-entity' | 'add-tx' | 'patch-tx' | 'delete-tx' | 'patch-entity' | 'delete-entity';
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  body?: unknown;
  tenantId: string;
  createdAt: number;
  attempts: number;
  status: 'pending' | 'failed';
  lastError?: string;
  label: string;
  refId?: string;
  refKind?: 'entity' | 'tx';
}

const LEGACY_KEY = 'duebook_offline_queue';
const LEGACY_MAP_KEY = 'duebook_tempid_map';

type Listener = () => void;
const listeners = new Set<Listener>();
function notify() { listeners.forEach(l => { try { l(); } catch {} }); }

// In-memory mirror so SyncBar + consumers can keep sync accessors.
let mirror: QueueItem[] = [];
let tempMap: Record<string, string> = {};
let bootstrapped = false;
let bootstrapPromise: Promise<void> | null = null;

async function bootstrap(): Promise<void> {
  if (bootstrapped) return;
  if (!hasIDB()) { bootstrapped = true; return; }
  try {
    const [rows, mapRows] = await Promise.all([
      db().queue.orderBy('createdAt').toArray(),
      db().tempMap.toArray(),
    ]);
    mirror = rows;
    tempMap = Object.fromEntries(mapRows.map(r => [r.tempId, r.realId]));

    // One-time migration from localStorage
    if (typeof localStorage !== 'undefined') {
      const legacyQ = localStorage.getItem(LEGACY_KEY);
      if (legacyQ && mirror.length === 0) {
        try {
          const parsed: QueueItem[] = JSON.parse(legacyQ);
          if (Array.isArray(parsed) && parsed.length) {
            await db().queue.bulkPut(parsed);
            mirror = parsed;
          }
        } catch {}
        localStorage.removeItem(LEGACY_KEY);
      }
      const legacyMap = localStorage.getItem(LEGACY_MAP_KEY);
      if (legacyMap && Object.keys(tempMap).length === 0) {
        try {
          const parsed: Record<string, string> = JSON.parse(legacyMap);
          const entries = Object.entries(parsed);
          if (entries.length) {
            await db().tempMap.bulkPut(entries.map(([tempId, realId]) => ({ tempId, realId })));
            tempMap = parsed;
          }
        } catch {}
        localStorage.removeItem(LEGACY_MAP_KEY);
      }
    }
  } catch {
    // Fall back to empty mirror; next writes will try Dexie again.
  }
  bootstrapped = true;
  notify();
}

export function ready(): Promise<void> {
  if (!bootstrapPromise) bootstrapPromise = bootstrap();
  return bootstrapPromise;
}

// Kick off bootstrap on module load (client only).
if (typeof window !== 'undefined') { void ready(); }

function persistQueue(items: QueueItem[]) {
  if (!hasIDB()) return;
  // Replace entire table — small size, infrequent.
  void db().transaction('rw', db().queue, async () => {
    await db().queue.clear();
    if (items.length) await db().queue.bulkPut(items);
  }).catch(() => {});
}

function persistSingle(item: QueueItem) {
  if (!hasIDB()) return;
  void db().queue.put(item).catch(() => {});
}

function removePersist(id: string) {
  if (!hasIDB()) return;
  void db().queue.delete(id).catch(() => {});
}

export function subscribe(l: Listener) { listeners.add(l); return () => { listeners.delete(l); }; }
export function list(): QueueItem[] { return mirror.slice(); }
export function pendingCount(): number { return mirror.filter(i => i.status === 'pending').length; }
export function failedCount(): number { return mirror.filter(i => i.status === 'failed').length; }

export function enqueue(item: Omit<QueueItem, 'id' | 'createdAt' | 'attempts' | 'status'>): QueueItem {
  const created: QueueItem = {
    ...item,
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    attempts: 0,
    status: 'pending',
  };
  mirror = [...mirror, created];
  persistSingle(created);
  notify();
  return created;
}

export function remove(id: string) {
  mirror = mirror.filter(i => i.id !== id);
  removePersist(id);
  notify();
}

export function clearFailed() {
  const kept = mirror.filter(i => i.status !== 'failed');
  mirror = kept;
  persistQueue(kept);
  notify();
}

function updateItem(id: string, patch: Partial<QueueItem>) {
  const idx = mirror.findIndex(i => i.id === id);
  if (idx < 0) return;
  const next = { ...mirror[idx], ...patch };
  mirror = [...mirror.slice(0, idx), next, ...mirror.slice(idx + 1)];
  persistSingle(next);
  notify();
}

export function realId(id: string | undefined | null): string | null {
  if (!id) return null;
  if (!id.startsWith('temp_')) return id;
  return tempMap[id] || null;
}

function setTempMapping(tempKey: string, realKey: string) {
  tempMap = { ...tempMap, [tempKey]: realKey };
  if (hasIDB()) void db().tempMap.put({ tempId: tempKey, realId: realKey }).catch(() => {});
}

function rewriteQueuedRefs(tempKey: string, realKey: string) {
  let changed = false;
  const next = mirror.map(it => {
    const u = { ...it };
    if (u.body && typeof u.body === 'object') {
      const b = { ...(u.body as Record<string, unknown>) };
      if (b.entityId === tempKey) { b.entityId = realKey; u.body = b; changed = true; }
    }
    if (u.url.includes(tempKey)) { u.url = u.url.replace(tempKey, realKey); changed = true; }
    if (u.refId === tempKey) { u.refId = realKey; changed = true; }
    return u;
  });
  if (changed) {
    mirror = next;
    persistQueue(next);
    notify();
  }
}

let syncing = false;

export interface SyncResult { synced: number; failedItems: QueueItem[]; stopped: boolean; }

export async function drain(): Promise<SyncResult> {
  await ready();
  if (syncing) return { synced: 0, failedItems: [], stopped: true };
  syncing = true;
  let synced = 0;
  const failedItems: QueueItem[] = [];
  let stopped = false;
  try {
    const snapshot = mirror.slice();
    for (const current of snapshot) {
      const item = mirror.find(x => x.id === current.id);
      if (!item) continue;
      if (item.status === 'failed') { failedItems.push(item); continue; }

      let body = item.body;
      let url = item.url;
      if (body && typeof body === 'object') {
        const b = body as Record<string, unknown>;
        if (typeof b.entityId === 'string' && b.entityId.startsWith('temp_')) {
          const mapped = tempMap[b.entityId];
          if (!mapped) {
            updateItem(item.id, { status: 'failed', lastError: 'Parent contact not synced yet' });
            failedItems.push({ ...item, status: 'failed', lastError: 'Parent contact not synced yet' });
            continue;
          }
          body = { ...(body as object), entityId: mapped };
        }
      }
      if (typeof url === 'string') {
        for (const [tempK, realK] of Object.entries(tempMap)) {
          if (url.includes(tempK)) url = url.replace(tempK, realK);
        }
      }

      try {
        const res = await api.request({
          method: item.method,
          url,
          data: body,
          headers: { 'X-Tenant-Id': item.tenantId },
        });
        if (item.type === 'create-entity' && item.refId && item.refId.startsWith('temp_')) {
          const created = res.data?.entity || res.data;
          const realKey = created?._id;
          if (realKey) {
            setTempMapping(item.refId, realKey);
            rewriteQueuedRefs(item.refId, realKey);
          }
        }
        mirror = mirror.filter(x => x.id !== item.id);
        removePersist(item.id);
        notify();
        synced++;
      } catch (err) {
        const e = err as { response?: { status?: number; data?: { message?: string; error?: string } }; message?: string };
        const isNetwork = !e?.response;
        const msg =
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          (e?.response?.status ? `HTTP ${e.response.status}` : '') ||
          e?.message ||
          'Unknown error';
        if (isNetwork) {
          stopped = true;
          updateItem(item.id, { attempts: item.attempts + 1, lastError: msg });
          break;
        }
        updateItem(item.id, { attempts: item.attempts + 1, lastError: msg, status: 'failed' });
        failedItems.push({ ...item, attempts: item.attempts + 1, lastError: msg, status: 'failed' });
      }
    }
  } finally {
    syncing = false;
  }
  return { synced, failedItems, stopped };
}

export async function retryFailed(): Promise<SyncResult> {
  await ready();
  const next = mirror.map(i =>
    i.status === 'failed' ? { ...i, status: 'pending' as const, lastError: undefined } : i
  );
  mirror = next;
  persistQueue(next);
  notify();
  return drain();
}

export function discardFailed(id: string) { remove(id); }
