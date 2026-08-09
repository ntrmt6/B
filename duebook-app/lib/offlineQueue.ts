import api from './api';

export interface QueueItem {
  id: string;
  type: 'create-entity' | 'add-tx' | 'patch-tx' | 'patch-entity' | 'delete-entity';
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

const KEY = 'duebook_offline_queue';
const MAP_KEY = 'duebook_tempid_map';
type Listener = () => void;
const listeners = new Set<Listener>();

function notify() { listeners.forEach(l => { try { l(); } catch {} }); }

function read(): QueueItem[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}

function write(items: QueueItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  notify();
}

export function subscribe(l: Listener) { listeners.add(l); return () => { listeners.delete(l); }; }
export function list(): QueueItem[] { return read(); }
export function pendingCount(): number { return read().filter(i => i.status === 'pending').length; }
export function failedCount(): number { return read().filter(i => i.status === 'failed').length; }

export function enqueue(item: Omit<QueueItem, 'id' | 'createdAt' | 'attempts' | 'status'>): QueueItem {
  const q = read();
  const created: QueueItem = {
    ...item,
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    attempts: 0,
    status: 'pending',
  };
  q.push(created);
  write(q);
  return created;
}

export function remove(id: string) { write(read().filter(i => i.id !== id)); }
export function clearFailed() { write(read().filter(i => i.status !== 'failed')); }

function getTempMap(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(MAP_KEY) || '{}'); } catch { return {}; }
}
function setTempMap(m: Record<string, string>) { localStorage.setItem(MAP_KEY, JSON.stringify(m)); }
export function realId(id: string | undefined | null): string | null {
  if (!id) return null;
  if (!id.startsWith('temp_')) return id;
  return getTempMap()[id] || null;
}

function rewriteQueuedRefs(tempKey: string, realKey: string) {
  const q = read();
  let changed = false;
  for (const it of q) {
    if (it.body && typeof it.body === 'object') {
      const b = it.body as Record<string, unknown>;
      if (b.entityId === tempKey) { b.entityId = realKey; changed = true; }
    }
    if (it.url.includes(tempKey)) { it.url = it.url.replace(tempKey, realKey); changed = true; }
    if (it.refId === tempKey) { it.refId = realKey; changed = true; }
  }
  if (changed) write(q);
}

let syncing = false;

export interface SyncResult { synced: number; failedItems: QueueItem[]; stopped: boolean; }

export async function drain(): Promise<SyncResult> {
  if (syncing) return { synced: 0, failedItems: [], stopped: true };
  syncing = true;
  let synced = 0;
  const failedItems: QueueItem[] = [];
  let stopped = false;
  try {
    let queue = read();
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (item.status === 'failed') { failedItems.push(item); continue; }

      // Resolve any temp entity ids from earlier successful creates
      let body = item.body;
      let url = item.url;
      if (body && typeof body === 'object') {
        const b = body as Record<string, unknown>;
        if (typeof b.entityId === 'string' && b.entityId.startsWith('temp_')) {
          const mapped = getTempMap()[b.entityId];
          if (!mapped) {
            // Parent hasn't synced yet — mark failed with clear reason
            item.status = 'failed';
            item.lastError = 'Parent contact not synced yet';
            queue = read();
            const idx = queue.findIndex(x => x.id === item.id);
            if (idx >= 0) { queue[idx] = item; write(queue); }
            failedItems.push(item);
            continue;
          }
          body = { ...(body as object), entityId: mapped };
        }
      }
      if (typeof url === 'string') {
        for (const [tempK, realK] of Object.entries(getTempMap())) {
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
        // If this was a create with a temp ref, remember the mapping
        if (item.type === 'create-entity' && item.refId && item.refId.startsWith('temp_')) {
          const created = res.data?.entity || res.data;
          const realKey = created?._id;
          if (realKey) {
            const m = getTempMap();
            m[item.refId] = realKey;
            setTempMap(m);
            rewriteQueuedRefs(item.refId, realKey);
          }
        }
        queue = read().filter(x => x.id !== item.id);
        write(queue);
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
          queue = read();
          const idx = queue.findIndex(x => x.id === item.id);
          if (idx >= 0) { queue[idx] = { ...queue[idx], attempts: queue[idx].attempts + 1, lastError: msg }; write(queue); }
          break;
        }
        item.attempts++;
        item.lastError = msg;
        item.status = 'failed';
        queue = read();
        const idx = queue.findIndex(x => x.id === item.id);
        if (idx >= 0) { queue[idx] = item; write(queue); }
        failedItems.push(item);
      }
    }
  } finally {
    syncing = false;
  }
  return { synced, failedItems, stopped };
}

export async function retryFailed(): Promise<SyncResult> {
  const q = read().map(i => i.status === 'failed' ? { ...i, status: 'pending' as const, lastError: undefined } : i);
  write(q);
  return drain();
}

export function discardFailed(id: string) { remove(id); }
