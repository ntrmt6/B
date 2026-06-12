// Resolve API base URL from Vite env
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001';

export interface CategoryDTO {
  id?: string;
  name: string;
  createdAt?: string;
}

let _tenantId = '';
export function setCategoryTenantId(id: string) { _tenantId = id; }

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>) {
  const url = new URL(path, API_BASE_URL);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

function headers(extra?: Record<string, string>): Record<string, string> {
  const h: Record<string, string> = { ...extra };
  if (_tenantId) h['X-Tenant-Id'] = _tenantId;
  // Add Authorization token from localStorage
  const token = localStorage.getItem('admin_auth_token');
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

export const CategoryService = {
  async list() {
    const url = buildUrl('/api/expenses/categories/list');
    const res = await fetch(url, { headers: headers() });
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json() as Promise<{ items: CategoryDTO[] }>;
  },

  async create(payload: { name: string }) {
    const url = buildUrl('/api/expenses/categories/create');
    console.log('[CategoryService] Creating category at:', url, 'with tenantId:', _tenantId);
    const res = await fetch(url, {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorText = await res.text();
      console.error('[CategoryService] Create failed:', res.status, errorText);
      throw new Error(`Failed to create category: ${res.status} ${errorText}`);
    }
    const result = await res.json();
    console.log('[CategoryService] Category created:', result);
    return result as CategoryDTO;
  },

  async update(id: string, payload: { name: string }) {
    const res = await fetch(buildUrl(`/api/expenses/categories/${id}`), {
      method: 'PUT',
      headers: headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update category');
    return res.json() as Promise<CategoryDTO>;
  },

  async remove(id: string) {
    const res = await fetch(buildUrl(`/api/expenses/categories/${id}`), { method: 'DELETE', headers: headers() });
    if (!res.ok) throw new Error('Failed to delete category');
    return res.json() as Promise<{ success: boolean }>;
  },
};
