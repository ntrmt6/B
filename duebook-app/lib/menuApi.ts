import api from './api';

export interface MenuItemDoc {
  _id: string;
  tenantId?: string;
  nameBn: string;
  price: number;
  category: string;
  available: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface MenuSettingsDoc {
  tenantId?: string;
  shopNameBn: string;
  taglineBn: string;
  footerNotesBn: string[];
}

export interface MenuExportDoc {
  _id: string;
  format: 'pdf-a4' | 'pdf-a5' | 'png';
  fileName: string;
  itemCount: number;
  createdAt: string;
}

const CACHE_PREFIX = 'duebook_cache_menu_';
const ck = {
  items: (tid: string) => `${CACHE_PREFIX}items__${tid}`,
  settings: (tid: string) => `${CACHE_PREFIX}settings__${tid}`,
  seeded: (tid: string) => `${CACHE_PREFIX}seeded__${tid}`,
};

const readCache = <T>(key: string, fb: T): T => {
  if (typeof window === 'undefined') return fb;
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) as T : fb; }
  catch { return fb; }
};
const writeCache = <T>(key: string, v: T) => {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
};

const isNetErr = (err: unknown) => !(err as { response?: unknown })?.response;

export const DEFAULT_MENU_ITEMS: Omit<MenuItemDoc, '_id'>[] = [
  { nameBn: 'দুধ চা', price: 10, category: 'দুধ চা', available: true, sortOrder: 10 },
  { nameBn: 'চিনি ছাড়া দুধ চা', price: 10, category: 'দুধ চা', available: true, sortOrder: 20 },
  { nameBn: 'রং চা', price: 10, category: 'রং চা', available: true, sortOrder: 30 },
  { nameBn: 'চিনি ছাড়া রং চা', price: 10, category: 'রং চা', available: true, sortOrder: 40 },
  { nameBn: 'আদা চা', price: 10, category: 'রং চা', available: true, sortOrder: 50 },
  { nameBn: 'লেবু চা', price: 10, category: 'রং চা', available: true, sortOrder: 60 },
  { nameBn: 'কফি', price: 10, category: 'অন্যান্য', available: true, sortOrder: 70 },
];

export async function listMenuItems(tid: string): Promise<{ items: MenuItemDoc[]; offline: boolean }> {
  try {
    const r = await api.get('/duebook/menu/items', { headers: { 'X-Tenant-Id': tid } });
    const items: MenuItemDoc[] = r.data || [];
    writeCache(ck.items(tid), items);
    return { items, offline: false };
  } catch (err) {
    if (isNetErr(err)) {
      return { items: readCache<MenuItemDoc[]>(ck.items(tid), []), offline: true };
    }
    throw err;
  }
}

export async function createMenuItem(tid: string, body: Omit<MenuItemDoc, '_id'>): Promise<MenuItemDoc> {
  const r = await api.post('/duebook/menu/items', body, { headers: { 'X-Tenant-Id': tid } });
  return r.data;
}

export async function updateMenuItem(tid: string, id: string, body: Partial<MenuItemDoc>): Promise<MenuItemDoc> {
  const r = await api.put(`/duebook/menu/items/${id}`, body, { headers: { 'X-Tenant-Id': tid } });
  return r.data;
}

export async function deleteMenuItem(tid: string, id: string): Promise<void> {
  await api.delete(`/duebook/menu/items/${id}`, { headers: { 'X-Tenant-Id': tid } });
}

export async function reorderMenuItems(tid: string, items: { _id: string; sortOrder: number }[]): Promise<void> {
  await api.post('/duebook/menu/items/reorder', { items }, { headers: { 'X-Tenant-Id': tid } });
}

export async function getMenuSettings(tid: string): Promise<MenuSettingsDoc> {
  try {
    const r = await api.get('/duebook/menu/settings', { headers: { 'X-Tenant-Id': tid } });
    const s: MenuSettingsDoc = r.data || { shopNameBn: '', taglineBn: '', footerNotesBn: [] };
    writeCache(ck.settings(tid), s);
    return s;
  } catch (err) {
    if (isNetErr(err)) return readCache<MenuSettingsDoc>(ck.settings(tid), { shopNameBn: '', taglineBn: '', footerNotesBn: [] });
    throw err;
  }
}

export async function saveMenuSettings(tid: string, body: Partial<MenuSettingsDoc>): Promise<MenuSettingsDoc> {
  const r = await api.put('/duebook/menu/settings', body, { headers: { 'X-Tenant-Id': tid } });
  writeCache(ck.settings(tid), r.data);
  return r.data;
}

export async function seedDefaultsIfNeeded(tid: string): Promise<{ seeded: number }> {
  if (typeof window !== 'undefined' && localStorage.getItem(ck.seeded(tid)) === '1') return { seeded: 0 };
  try {
    const { items } = await listMenuItems(tid);
    if (items.length > 0) {
      localStorage.setItem(ck.seeded(tid), '1');
      return { seeded: 0 };
    }
    let count = 0;
    for (const seed of DEFAULT_MENU_ITEMS) {
      try { await createMenuItem(tid, seed); count++; } catch {}
    }
    localStorage.setItem(ck.seeded(tid), '1');
    return { seeded: count };
  } catch {
    return { seeded: 0 };
  }
}

export async function listMenuExports(tid: string): Promise<MenuExportDoc[]> {
  const r = await api.get('/duebook/menu/exports', { headers: { 'X-Tenant-Id': tid } });
  return r.data || [];
}

export async function recordMenuExport(tid: string, body: { format: 'pdf-a4' | 'pdf-a5' | 'png'; fileName: string; itemCount: number }): Promise<MenuExportDoc> {
  const r = await api.post('/duebook/menu/exports', body, { headers: { 'X-Tenant-Id': tid } });
  return r.data;
}

export async function deleteMenuExport(tid: string, id: string): Promise<void> {
  await api.delete(`/duebook/menu/exports/${id}`, { headers: { 'X-Tenant-Id': tid } });
}
