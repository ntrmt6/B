/**
 * Native-SQLite mirror for DueBook.
 *
 * When the app runs inside the Capacitor shell (Android APK) we open a native
 * SQLite database and mirror every Dexie write into it. The mirror survives
 * WebView cache clears and app-data wipes that drop IndexedDB; it is a true
 * on-device persistence tier backed by the OS filesystem.
 *
 * In a plain browser (no Capacitor) every call here is a no-op — Dexie remains
 * the sole store.
 */
import { Capacitor } from '@capacitor/core';
import type { EntityRow, TxRow, QueueRow, TempMapRow } from './db';

type SQLiteConnection = {
  checkConnectionsConsistency: () => Promise<{ result: boolean }>;
  isConnection: (db: string, readonly: boolean) => Promise<{ result: boolean }>;
  createConnection: (
    db: string, encrypted: boolean, mode: string, version: number, readonly: boolean,
  ) => Promise<SQLiteDBConnection>;
  retrieveConnection: (db: string, readonly: boolean) => Promise<SQLiteDBConnection>;
};
type SQLiteDBConnection = {
  open: () => Promise<void>;
  close: () => Promise<void>;
  execute: (statements: string) => Promise<unknown>;
  run: (sql: string, values?: unknown[]) => Promise<unknown>;
  query: (sql: string, values?: unknown[]) => Promise<{ values?: unknown[] }>;
};

let readyPromise: Promise<SQLiteDBConnection | null> | null = null;

export function isNative(): boolean {
  try { return Capacitor.isNativePlatform && Capacitor.isNativePlatform(); }
  catch { return false; }
}

async function openDB(): Promise<SQLiteDBConnection | null> {
  if (!isNative()) return null;
  try {
    const mod = (await import('@capacitor-community/sqlite')) as {
      CapacitorSQLite: unknown;
      SQLiteConnection: new (plugin: unknown) => SQLiteConnection;
    };
    const sqlite = new mod.SQLiteConnection(mod.CapacitorSQLite);
    const name = 'duebook';
    const already = await sqlite.isConnection(name, false);
    const conn = already.result
      ? await sqlite.retrieveConnection(name, false)
      : await sqlite.createConnection(name, false, 'no-encryption', 1, false);
    await conn.open();
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS entities (
        _id TEXT PRIMARY KEY,
        tenantId TEXT NOT NULL,
        payload TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_entities_tenant ON entities(tenantId);

      CREATE TABLE IF NOT EXISTS transactions (
        _id TEXT PRIMARY KEY,
        tenantId TEXT NOT NULL,
        entityId TEXT NOT NULL,
        payload TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_tx_tenant_entity ON transactions(tenantId, entityId);

      CREATE TABLE IF NOT EXISTS queue (
        id TEXT PRIMARY KEY,
        createdAt INTEGER NOT NULL,
        payload TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tempmap (
        tempId TEXT PRIMARY KEY,
        realId TEXT NOT NULL
      );
    `);
    return conn;
  } catch {
    return null;
  }
}

export function ready(): Promise<SQLiteDBConnection | null> {
  if (!readyPromise) readyPromise = openDB();
  return readyPromise;
}

/* ─── Entities ─── */

export async function putEntityNative(row: EntityRow): Promise<void> {
  const conn = await ready();
  if (!conn) return;
  try {
    await conn.run(
      `INSERT OR REPLACE INTO entities (_id, tenantId, payload) VALUES (?, ?, ?)`,
      [row._id, row.tenantId, JSON.stringify(row)],
    );
  } catch {}
}

export async function deleteEntityNative(id: string): Promise<void> {
  const conn = await ready();
  if (!conn) return;
  try {
    await conn.run(`DELETE FROM entities WHERE _id = ?`, [id]);
    await conn.run(`DELETE FROM transactions WHERE entityId = ?`, [id]);
  } catch {}
}

export async function replaceEntitiesNative(tenantId: string, rows: EntityRow[]): Promise<void> {
  const conn = await ready();
  if (!conn) return;
  try {
    await conn.run(`DELETE FROM entities WHERE tenantId = ?`, [tenantId]);
    for (const row of rows) {
      await conn.run(
        `INSERT OR REPLACE INTO entities (_id, tenantId, payload) VALUES (?, ?, ?)`,
        [row._id, row.tenantId, JSON.stringify(row)],
      );
    }
  } catch {}
}

export async function readEntitiesNative(tenantId: string): Promise<EntityRow[]> {
  const conn = await ready();
  if (!conn) return [];
  try {
    const res = await conn.query(
      `SELECT payload FROM entities WHERE tenantId = ?`, [tenantId]
    );
    const values = (res.values ?? []) as Array<{ payload: string }>;
    return values.map(v => JSON.parse(v.payload) as EntityRow);
  } catch { return []; }
}

/* ─── Transactions ─── */

export async function putTxNative(row: TxRow): Promise<void> {
  const conn = await ready();
  if (!conn) return;
  try {
    await conn.run(
      `INSERT OR REPLACE INTO transactions (_id, tenantId, entityId, payload) VALUES (?, ?, ?, ?)`,
      [row._id, row.tenantId, row.entityId, JSON.stringify(row)],
    );
  } catch {}
}

export async function deleteTxNative(id: string): Promise<void> {
  const conn = await ready();
  if (!conn) return;
  try { await conn.run(`DELETE FROM transactions WHERE _id = ?`, [id]); } catch {}
}

export async function replaceTxNative(tenantId: string, entityId: string, rows: TxRow[]): Promise<void> {
  const conn = await ready();
  if (!conn) return;
  try {
    await conn.run(`DELETE FROM transactions WHERE tenantId = ? AND entityId = ?`, [tenantId, entityId]);
    for (const row of rows) {
      await conn.run(
        `INSERT OR REPLACE INTO transactions (_id, tenantId, entityId, payload) VALUES (?, ?, ?, ?)`,
        [row._id, row.tenantId, row.entityId, JSON.stringify(row)],
      );
    }
  } catch {}
}

export async function readTxNative(tenantId: string, entityId: string): Promise<TxRow[]> {
  const conn = await ready();
  if (!conn) return [];
  try {
    const res = await conn.query(
      `SELECT payload FROM transactions WHERE tenantId = ? AND entityId = ?`,
      [tenantId, entityId],
    );
    const values = (res.values ?? []) as Array<{ payload: string }>;
    return values.map(v => JSON.parse(v.payload) as TxRow);
  } catch { return []; }
}

/* ─── Queue ─── */

export async function putQueueNative(item: QueueRow): Promise<void> {
  const conn = await ready();
  if (!conn) return;
  try {
    await conn.run(
      `INSERT OR REPLACE INTO queue (id, createdAt, payload) VALUES (?, ?, ?)`,
      [item.id, item.createdAt, JSON.stringify(item)],
    );
  } catch {}
}

export async function deleteQueueNative(id: string): Promise<void> {
  const conn = await ready();
  if (!conn) return;
  try { await conn.run(`DELETE FROM queue WHERE id = ?`, [id]); } catch {}
}

export async function replaceQueueNative(items: QueueRow[]): Promise<void> {
  const conn = await ready();
  if (!conn) return;
  try {
    await conn.run(`DELETE FROM queue`, []);
    for (const item of items) {
      await conn.run(
        `INSERT OR REPLACE INTO queue (id, createdAt, payload) VALUES (?, ?, ?)`,
        [item.id, item.createdAt, JSON.stringify(item)],
      );
    }
  } catch {}
}

export async function readQueueNative(): Promise<QueueRow[]> {
  const conn = await ready();
  if (!conn) return [];
  try {
    const res = await conn.query(`SELECT payload FROM queue ORDER BY createdAt ASC`);
    const values = (res.values ?? []) as Array<{ payload: string }>;
    return values.map(v => JSON.parse(v.payload) as QueueRow);
  } catch { return []; }
}

/* ─── TempMap ─── */

export async function putTempMapNative(row: TempMapRow): Promise<void> {
  const conn = await ready();
  if (!conn) return;
  try {
    await conn.run(
      `INSERT OR REPLACE INTO tempmap (tempId, realId) VALUES (?, ?)`,
      [row.tempId, row.realId],
    );
  } catch {}
}

export async function readTempMapNative(): Promise<TempMapRow[]> {
  const conn = await ready();
  if (!conn) return [];
  try {
    const res = await conn.query(`SELECT tempId, realId FROM tempmap`);
    const values = (res.values ?? []) as Array<{ tempId: string; realId: string }>;
    return values.map(v => ({ tempId: v.tempId, realId: v.realId }));
  } catch { return []; }
}
