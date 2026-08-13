import axios from 'axios';
import { apiUrl, BASE_PATH } from './config';

const STORAGE_PREFIX = 'duebook';
export const KEYS = {
  token: `${STORAGE_PREFIX}_token`,
  user: `${STORAGE_PREFIX}_user`,
  tenantId: `${STORAGE_PREFIX}_tenant_id`,
} as const;

const api = axios.create({
  // Same-origin "/api" when no backend URL is configured (proxy mode),
  // or the backend's absolute "…/api" for static hosting (CORS mode).
  baseURL: apiUrl('/api'),
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
      if (!url.includes('/auth/login') && !window.location.pathname.startsWith(`${BASE_PATH}/login`)) {
        Object.values(KEYS).forEach(k => localStorage.removeItem(k));
        window.location.href = `${BASE_PATH}/login`;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
