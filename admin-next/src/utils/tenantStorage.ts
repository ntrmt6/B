/**
 * Tenant-scoped storage utilities
 * Ensures localStorage/sessionStorage keys are namespaced per tenant
 * to prevent cross-tenant data leakage in multi-tenant SaaS
 */

// Get the current tenant ID from the most reliable source
function getCurrentTenantId(): string {
  if (typeof window === 'undefined') return '';
  
  // Try active tenant from localStorage
  const activeTenant = localStorage.getItem('seven-days-active-tenant');
  if (activeTenant) return activeTenant;
  
  // Try from user session
  try {
    const userStr = localStorage.getItem('admin_auth_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user?.tenantId) return user.tenantId;
    }
  } catch {}
  
  return '';
}

// Get a tenant-scoped key
export function tenantKey(key: string, tenantId?: string): string {
  const tid = tenantId || getCurrentTenantId();
  if (!tid) return key; // fallback to unscoped if no tenant
  return `${tid}:${key}`;
}

// Tenant-scoped localStorage wrapper
export const tenantStorage = {
  getItem(key: string, tenantId?: string): string | null {
    return localStorage.getItem(tenantKey(key, tenantId));
  },
  
  setItem(key: string, value: string, tenantId?: string): void {
    localStorage.setItem(tenantKey(key, tenantId), value);
  },
  
  removeItem(key: string, tenantId?: string): void {
    localStorage.removeItem(tenantKey(key, tenantId));
  },
  
  // Clear only items for a specific tenant
  clearTenant(tenantId: string): void {
    const prefix = `${tenantId}:`;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(prefix)) keysToRemove.push(k);
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  }
};

// Tenant-scoped sessionStorage wrapper
export const tenantSession = {
  getItem(key: string, tenantId?: string): string | null {
    return sessionStorage.getItem(tenantKey(key, tenantId));
  },
  
  setItem(key: string, value: string, tenantId?: string): void {
    sessionStorage.setItem(tenantKey(key, tenantId), value);
  },
  
  removeItem(key: string, tenantId?: string): void {
    sessionStorage.removeItem(tenantKey(key, tenantId));
  }
};

// Migrate existing unscoped keys to tenant-scoped keys
export function migrateStorageToTenantScope(tenantId: string): void {
  if (!tenantId) return;
  
  const keysToMigrate = [
    'admin_auth_token',
    'admin_auth_user', 
    'admin_auth_permissions',
    '_vid',
    'admin_notes',
    'seven-days-cart',
  ];
  
  for (const key of keysToMigrate) {
    const value = localStorage.getItem(key);
    const scopedKey = tenantKey(key, tenantId);
    // Only migrate if unscoped key exists and scoped doesn't
    if (value && !localStorage.getItem(scopedKey)) {
      localStorage.setItem(scopedKey, value);
    }
  }
}
