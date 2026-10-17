import Dexie, { Table } from 'dexie';

export interface EntityRow {
  _id: string;
  tenantId: string;
  name: string;
  phone?: string;
  type: 'Customer' | 'Supplier' | 'Employee';
  totalOwedToMe: number;
  totalIOweThemNumber: number;
  profilePicture?: string;
  rewardsClaimed?: number;
  updatedAt?: string;
  createdAt?: string;
  _pending?: boolean;
}

export interface TxRow {
  _id: string;
  tenantId: string;
  entityId: string;
  amount: number;
  direction: 'INCOME' | 'EXPENSE';
  transactionDate: string;
  notes?: string;
  status: 'Pending' | 'Paid' | 'Cancelled';
  photo?: string;
  _pending?: boolean;
  _qid?: string;
}

export interface QueueRow {
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

export interface TempMapRow { tempId: string; realId: string; }
export interface MetaRow { key: string; value: unknown; }

class DueBookDB extends Dexie {
  entities!: Table<EntityRow, string>;
  transactions!: Table<TxRow, string>;
  queue!: Table<QueueRow, string>;
  tempMap!: Table<TempMapRow, string>;
  meta!: Table<MetaRow, string>;

  constructor() {
    super('duebook');
    this.version(1).stores({
      entities: '_id, tenantId, [tenantId+_id], updatedAt',
      transactions: '_id, [tenantId+entityId], [tenantId+_id], tenantId, entityId',
      queue: 'id, status, tenantId, createdAt',
      tempMap: 'tempId',
      meta: 'key',
    });
  }
}

let _db: DueBookDB | null = null;
export function db(): DueBookDB {
  if (!_db) _db = new DueBookDB();
  return _db;
}

export const hasIDB = () =>
  typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
