/**
 * Storage Cleanup Utility
 * Manages browser storage quota and clears unnecessary data
 */

interface StorageQuotaData {
  usage: number;
  quota: number;
  percentage: number;
}

/**
 * Get current storage quota info
 */
export async function getStorageQuotaInfo(): Promise<StorageQuotaData | null> {
  if (!navigator.storage?.estimate) {
    return null;
  }

  try {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
      percentage: estimate.quota ? (estimate.usage! / estimate.quota) * 100 : 0,
    };
  } catch (error) {
    console.warn('[StorageCleanup] Failed to get storage quota:', error);
    return null;
  }
}

/**
 * Clear all IndexedDB databases
 */
export async function clearIndexedDBs(): Promise<void> {
  if (!window.indexedDB) {
    return;
  }

  try {
    const databases = await indexedDB.databases?.() || [];
    
    for (const db of databases) {
      if (db.name) {
        try {
          const request = indexedDB.deleteDatabase(db.name);
          await new Promise((resolve, reject) => {
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(null);
          });
          console.log(`[StorageCleanup] Deleted IndexedDB: ${db.name}`);
        } catch (error) {
          console.warn(`[StorageCleanup] Failed to delete IndexedDB ${db.name}:`, error);
        }
      }
    }
  } catch (error) {
    console.warn('[StorageCleanup] Failed to clear IndexedDBs:', error);
  }
}

/**
 * Clear localStorage items older than specified days
 */
export function clearOldLocalStorage(olderThanDays: number = 30): void {
  try {
    const cutoffTime = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
    
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Skip important keys
      if (
        key.startsWith('seven-days-') ||
        key.startsWith('admin_auth_') ||
        key.startsWith('tenant_id_') ||
        key.includes('_token')
      ) {
        continue;
      }

      const value = localStorage.getItem(key);
      if (value) {
        try {
          // Try to parse as timestamped data
          const data = JSON.parse(value);
          if (data?.timestamp && data.timestamp < cutoffTime) {
            keysToRemove.push(key);
          }
        } catch {
          // Not timestamped JSON, skip
        }
      }
    }

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`[StorageCleanup] Removed old localStorage key: ${key}`);
    });
  } catch (error) {
    console.warn('[StorageCleanup] Failed to clear old localStorage:', error);
  }
}

/**
 * Clear sessionStorage
 */
export function clearSessionStorage(): void {
  try {
    sessionStorage.clear();
    console.log('[StorageCleanup] Cleared sessionStorage');
  } catch (error) {
    console.warn('[StorageCleanup] Failed to clear sessionStorage:', error);
  }
}

/**
 * Cleanup strategy when storage quota is exceeded
 */
export async function handleStorageQuotaExceeded(): Promise<void> {
  console.warn('[StorageCleanup] Storage quota exceeded, starting cleanup...');

  try {
    // 1. Clear sessionStorage (temporary data)
    clearSessionStorage();

    // 2. Clear old localStorage entries
    clearOldLocalStorage(7); // Clear items older than 7 days

    // 3. Clear IndexedDB databases
    await clearIndexedDBs();

    // 4. Check if persistent storage is available
    if (navigator.storage?.persist) {
      try {
        const isPersisted = await navigator.storage.persist();
        if (isPersisted) {
          console.log('[StorageCleanup] Persistent storage granted');
        }
      } catch (error) {
        console.warn('[StorageCleanup] Failed to request persistent storage:', error);
      }
    }

    console.log('[StorageCleanup] Cleanup completed');
  } catch (error) {
    console.error('[StorageCleanup] Error during cleanup:', error);
  }
}

/**
 * Monitor storage quota and trigger cleanup if needed
 */
export async function monitorStorageQuota(thresholdPercent: number = 85): Promise<void> {
  const quotaInfo = await getStorageQuotaInfo();
  
  if (!quotaInfo) return;

  console.log(
    `[StorageCleanup] Storage usage: ${(quotaInfo.usage / 1024 / 1024).toFixed(2)}MB / ${(quotaInfo.quota / 1024 / 1024).toFixed(2)}MB (${quotaInfo.percentage.toFixed(1)}%)`
  );

  if (quotaInfo.percentage > thresholdPercent) {
    console.warn(`[StorageCleanup] Storage quota at ${quotaInfo.percentage.toFixed(1)}%`);
    await handleStorageQuotaExceeded();
  }
}

/**
 * Setup storage event listener for quota exceeded errors
 */
export function setupStorageQuotaListener(): void {
  // Listen for storage events
  window.addEventListener('storage', () => {
    monitorStorageQuota().catch(error => {
      console.error('[StorageCleanup] Error monitoring quota:', error);
    });
  });

  // Listen for unhandled promise rejections that mention storage/quota
  window.addEventListener('unhandledrejection', (event) => {
    const errorMessage = String(event.reason?.message || event.reason || '');
    
    if (
      errorMessage.includes('NO_SPACE') ||
      errorMessage.includes('QuotaExceededError') ||
      errorMessage.includes('UnknownError') ||
      errorMessage.includes('FILE_ERROR_NO_SPACE')
    ) {
      console.error('[StorageCleanup] Storage quota exceeded error detected:', event.reason);
      event.preventDefault();
      
      handleStorageQuotaExceeded().catch(error => {
        console.error('[StorageCleanup] Failed to handle quota exceeded:', error);
      });
    }
  });
}

/**
 * Initialize storage cleanup on app startup
 */
export function initializeStorageCleanup(): void {
  if (typeof window === 'undefined') return;

  try {
    // Setup listeners for quota errors
    setupStorageQuotaListener();

    // Initial check and cleanup if needed
    monitorStorageQuota(80).catch(error => {
      console.error('[StorageCleanup] Initial storage check failed:', error);
    });

    // Periodic check every hour
    setInterval(() => {
      monitorStorageQuota(85).catch(error => {
        console.error('[StorageCleanup] Periodic storage check failed:', error);
      });
    }, 60 * 60 * 1000);

    console.log('[StorageCleanup] Initialized storage cleanup');
  } catch (error) {
    console.error('[StorageCleanup] Failed to initialize:', error);
  }
}
