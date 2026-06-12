'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import api from '@/lib/api';
import { type TenantConfig, DEFAULT_TENANT_CONFIG } from '@/lib/tenant-config';

// Storage key constants — central place to change the prefix
const STORAGE_PREFIX = 'hishabee';
const STORAGE_KEYS = {
  token: `${STORAGE_PREFIX}_token`,
  user: `${STORAGE_PREFIX}_user`,
  tenantId: `${STORAGE_PREFIX}_tenant_id`,
  tenantConfig: `${STORAGE_PREFIX}_tenant_config`,
} as const;

export { STORAGE_KEYS };

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  tenantId?: string;
  subdomain?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  tenantId: string | null;
  tenantConfig: TenantConfig;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function loadSavedConfig(): TenantConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.tenantConfig);
    if (raw) return { ...DEFAULT_TENANT_CONFIG, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_TENANT_CONFIG;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantConfig, setTenantConfig] = useState<TenantConfig>(DEFAULT_TENANT_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem(STORAGE_KEYS.token);
    const savedUser = localStorage.getItem(STORAGE_KEYS.user);
    const savedTenant = localStorage.getItem(STORAGE_KEYS.tenantId);
    if (savedToken && savedUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setTenantId(savedTenant);
      setTenantConfig(loadSavedConfig());
    }
    setLoading(false);
  }, []);

  // Fetch tenant config from backend when tenantId is available
  useEffect(() => {
    if (!tenantId || !token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/tenant-config');
        if (!cancelled && res.data) {
          const merged = { ...DEFAULT_TENANT_CONFIG, ...res.data };
          setTenantConfig(merged);
          localStorage.setItem(STORAGE_KEYS.tenantConfig, JSON.stringify(merged));
        }
      } catch {
        // Backend may not have this endpoint yet — use defaults
      }
    })();
    return () => { cancelled = true; };
  }, [tenantId, token]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: newUser, tenantConfig: serverConfig } = res.data;
    const tid = newUser.tenantId || newUser.subdomain || '';

    localStorage.setItem(STORAGE_KEYS.token, newToken);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(newUser));
    localStorage.setItem(STORAGE_KEYS.tenantId, tid);

    if (serverConfig) {
      const merged = { ...DEFAULT_TENANT_CONFIG, ...serverConfig };
      setTenantConfig(merged);
      localStorage.setItem(STORAGE_KEYS.tenantConfig, JSON.stringify(merged));
    }

    setToken(newToken);
    setUser(newUser);
    setTenantId(tid);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
    localStorage.removeItem(STORAGE_KEYS.tenantId);
    localStorage.removeItem(STORAGE_KEYS.tenantConfig);
    setToken(null);
    setUser(null);
    setTenantId(null);
    setTenantConfig(DEFAULT_TENANT_CONFIG);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, tenantId, tenantConfig, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
