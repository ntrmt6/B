// Income Service for Business Reports
// Manages other income sources besides sales

// Resolve API base URL from Vite env
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// In-memory cache for faster subsequent loads
const cache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute cache

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && entry.expires > Date.now()) {
    return entry.data as T;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any, ttl = CACHE_TTL): void {
  cache.set(key, { data, expires: Date.now() + ttl });
}

function invalidateCache(pattern?: string): void {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) cache.delete(key);
    }
  } else {
    cache.clear();
  }
}

export interface IncomeDTO {
  id?: string;
  name: string;
  category: string;
  amount: number;
  date: string; // ISO
  status: 'Published' | 'Draft' | 'Trash';
  note?: string;
  imageUrl?: string;
  tenantId?: string;
}

export interface IncomeSummary {
  totalAmount: number;
  totalTransactions: number;
  categories: number;
}

export interface IncomeCategoryDTO {
  id?: string;
  name: string;
  tenantId?: string;
}

let _tenantId = '';
export function setIncomeTenantId(id: string) { _tenantId = id; }

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>) {
  const base = API_BASE_URL || window.location.origin;
  const url = new URL(path, base);
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

export const IncomeService = {
  // List incomes with caching
  async list(opts: { query?: string; status?: string; category?: string; from?: string; to?: string; page?: number; pageSize?: number } = {}) {
    const cacheKey = `incomes:list:${JSON.stringify(opts)}:${_tenantId}`;
    const cached = getCached<{ items: IncomeDTO[]; total: number }>(cacheKey);
    if (cached) return cached;

    const url = buildUrl('/api/incomes', opts);
    const res = await fetch(url, { headers: headers() });
    if (!res.ok) return { items: [], total: 0 };
    const data = await res.json() as { items: IncomeDTO[]; total: number };
    setCache(cacheKey, data);
    return data;
  },

  // Summary with caching
  async summary(opts: { from?: string; to?: string } = {}) {
    const cacheKey = `incomes:summary:${JSON.stringify(opts)}:${_tenantId}`;
    const cached = getCached<IncomeSummary>(cacheKey);
    if (cached) return cached;

    const url = buildUrl('/api/incomes/summary', opts);
    const res = await fetch(url, { headers: headers() });
    if (!res.ok) return { totalAmount: 0, totalTransactions: 0, categories: 0 };
    const data = await res.json() as IncomeSummary;
    setCache(cacheKey, data);
    return data;
  },

  // Load both list and summary in parallel (for fast initial load)
  async loadAll(opts: { query?: string; status?: string; category?: string; from?: string; to?: string; page?: number; pageSize?: number } = {}) {
    const [listResult, summaryResult, categories] = await Promise.all([
      this.list(opts),
      this.summary({ from: opts.from, to: opts.to }),
      this.listCategories()
    ]);
    return { list: listResult, summary: summaryResult, categories };
  },

  // Categories with caching
  async listCategories() {
    const cacheKey = `incomes:categories:${_tenantId}`;
    const cached = getCached<IncomeCategoryDTO[]>(cacheKey);
    if (cached) return cached;

    const res = await fetch(buildUrl('/api/incomes/categories'), { headers: headers() });
    if (!res.ok) return [];
    const data = await res.json() as IncomeCategoryDTO[];
    setCache(cacheKey, data, 5 * 60 * 1000); // 5 min cache for categories
    return data;
  },

  async createCategory(name: string) {
    invalidateCache('incomes:categories');
    const res = await fetch(buildUrl('/api/incomes/categories'), {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error('Failed to create income category');
    return res.json() as Promise<IncomeCategoryDTO>;
  },

  async create(payload: IncomeDTO) {
    invalidateCache('incomes:');
    const res = await fetch(buildUrl('/api/incomes'), {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create income');
    return res.json() as Promise<IncomeDTO>;
  },

  async update(id: string, payload: Partial<IncomeDTO>) {
    invalidateCache('incomes:');
    const res = await fetch(buildUrl(`/api/incomes/${id}`), {
      method: 'PUT',
      headers: headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update income');
    return res.json() as Promise<IncomeDTO>;
  },

  async remove(id: string) {
    invalidateCache('incomes:');
    const res = await fetch(buildUrl(`/api/incomes/${id}`), { method: 'DELETE', headers: headers() });
    if (!res.ok) throw new Error('Failed to delete income');
    return res.json() as Promise<{ success: boolean }>;
  },

  // Clear cache manually
  clearCache() {
    invalidateCache('incomes:');
  }
};
