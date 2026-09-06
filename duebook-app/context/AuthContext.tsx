'use client';

import { createContext, useContext, useState, useEffect, useLayoutEffect, useCallback, type ReactNode } from 'react';
import api, { KEYS } from '@/lib/api';

// useLayoutEffect on client (synchronous, before paint), useEffect on server (SSR safe)
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

interface User { _id: string; name: string; email: string; role: string; tenantId?: string; }

interface AuthCtx {
  user: User | null;
  tenantId: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: {
    name: string; email: string; password: string; phone?: string; shopName?: string;
    securityQuestion: string; securityAnswer: string;
  }) => Promise<void>;
  forgotPassword: (email: string) => Promise<{ ok: boolean; question?: string; message: string }>;
  resetPassword: (email: string, securityAnswer: string, newPassword: string) => Promise<void>;
  googleLogin: (credential: string, shopName?: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useIsomorphicLayoutEffect(() => {
    try {
      const t = localStorage.getItem(KEYS.token);
      const u = localStorage.getItem(KEYS.user);
      if (t && u) {
        setUser(JSON.parse(u));
        setTenantId(localStorage.getItem(KEYS.tenantId));
      }
    } catch {
      Object.values(KEYS).forEach(k => localStorage.removeItem(k));
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: u } = res.data;
    const tid = u.tenantId || u.subdomain || '';
    localStorage.setItem(KEYS.token, token);
    localStorage.setItem(KEYS.user, JSON.stringify(u));
    localStorage.setItem(KEYS.tenantId, tid);
    setUser(u);
    setTenantId(tid);
  }, []);

  const applyAuth = (token: string, u: User) => {
    const tid = u.tenantId || '';
    localStorage.setItem(KEYS.token, token);
    localStorage.setItem(KEYS.user, JSON.stringify(u));
    localStorage.setItem(KEYS.tenantId, tid);
    setUser(u);
    setTenantId(tid);
  };

  const signup = useCallback(async (data: {
    name: string; email: string; password: string; phone?: string; shopName?: string;
    securityQuestion: string; securityAnswer: string;
  }) => {
    const res = await api.post('/duebook/auth/signup', data);
    applyAuth(res.data.token, res.data.user);
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    const res = await api.post('/duebook/auth/forgot-password', { email });
    return { ok: !!res.data.ok, question: res.data.question, message: res.data.message };
  }, []);

  const resetPassword = useCallback(async (email: string, securityAnswer: string, newPassword: string) => {
    const res = await api.post('/duebook/auth/reset-password', { email, securityAnswer, newPassword });
    if (res.data?.token && res.data?.user) applyAuth(res.data.token, res.data.user);
  }, []);

  const googleLogin = useCallback(async (credential: string, shopName?: string) => {
    const res = await api.post('/duebook/auth/google', { credential, shopName });
    applyAuth(res.data.token, res.data.user);
  }, []);

  const logout = useCallback(() => {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
    setUser(null);
    setTenantId(null);
  }, []);

  return <Ctx.Provider value={{ user, tenantId, loading, login, signup, forgotPassword, resetPassword, googleLogin, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be within AuthProvider');
  return ctx;
}
