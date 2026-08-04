import axios from 'axios';

const STORAGE_PREFIX = 'duebook';
export const KEYS = {
  token: `${STORAGE_PREFIX}_token`,
  user: `${STORAGE_PREFIX}_user`,
  tenantId: `${STORAGE_PREFIX}_tenant_id`,
} as const;

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(KEYS.token);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    const tid = localStorage.getItem(KEYS.tenantId);
    if (tid) config.headers['X-Tenant-Id'] = tid;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const url = error.config?.url ?? '';
      if (!url.includes('/auth/login') && !window.location.pathname.startsWith('/login')) {
        Object.values(KEYS).forEach(k => localStorage.removeItem(k));
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
