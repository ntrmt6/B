/**
 * Offline Queue — Caches transactions locally when internet connectivity drops.
 * Transactions are stored in localStorage and synced back once connectivity is restored.
 */

const STORAGE_KEY = 'hishabee_offline_queue';

export interface OfflineTransaction {
  id: string;
  type: 'sale' | 'return' | 'adjustment';
  payload: Record<string, unknown>;
  createdAt: string;
  status: 'pending' | 'synced' | 'failed';
}

/** Check if browser is online */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/** Get all pending offline transactions */
export function getOfflineQueue(): OfflineTransaction[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/** Save the queue to localStorage */
function saveQueue(queue: OfflineTransaction[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

/** Add a transaction to the offline queue */
export function enqueueOfflineTransaction(
  type: OfflineTransaction['type'],
  payload: Record<string, unknown>
): OfflineTransaction {
  const queue = getOfflineQueue();
  const tx: OfflineTransaction = {
    id: `offline_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    payload,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
  queue.push(tx);
  saveQueue(queue);
  return tx;
}

/** Remove synced transactions from the queue */
export function clearSyncedTransactions(): void {
  const queue = getOfflineQueue().filter((tx) => tx.status === 'pending');
  saveQueue(queue);
}

/** Mark transactions as synced or failed */
export function updateTransactionStatus(
  results: Array<{ id: string; status: 'synced' | 'failed' }>
): void {
  const queue = getOfflineQueue();
  for (const result of results) {
    const tx = queue.find((t) => t.id === result.id);
    if (tx) tx.status = result.status;
  }
  saveQueue(queue);
}

/** Get the count of pending offline transactions */
export function getPendingCount(): number {
  return getOfflineQueue().filter((tx) => tx.status === 'pending').length;
}

/**
 * Register online/offline event listeners for automatic sync.
 * Call this once in a top-level component.
 */
export function registerConnectivityListeners(
  onOnline: () => void,
  onOffline?: () => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => onOnline();
  const handleOffline = () => onOffline?.();

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
