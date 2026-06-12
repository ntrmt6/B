import { Product, Order, User, ThemeConfig, WebsiteConfig, Role, DeliveryConfig, PaymentMethod, LandingPage, Tenant, CreateTenantPayload, ChatMessage, Category, SubCategory, ChildCategory, Brand, Tag } from '../types';
import { getAuthHeader, hasValidToken } from './authService';
import { getGuestSessionId } from '../utils/guestSession';
import { getCached, setCached, deleteCached, CacheKeys, setCachedByType, clearTenantCache } from './RedisService';
import type { Socket } from 'socket.io-client';

// Safe JSON stringify that handles circular references and DOM elements
const safeStringify = (obj: unknown): string => {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    // Skip React internal properties and DOM elements
    if (key.startsWith('__reactFiber') || key.startsWith('__reactProps') || key === 'stateNode') {
      return undefined;
    }
    if (value instanceof HTMLElement || value instanceof Node) {
      return undefined;
    }
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  });
};

// Debug flag - set to false to reduce console noise
const DEBUG_LOGGING = false;

// Reserved subdomains that cannot be used for tenants
const RESERVED_TENANT_SLUGS = [
  'www', 'admin', 'adminlogin', 'superadmin', 'login', 'app',
  'api', 'dashboard', 'tenant', 'support', 'cdn', 'static'
];

// API base URL from environment variable
const API_BASE_URL = process.env.VITE_API_BASE_URL || '';

/**
 * Cache-aware API fetch function
 * Checks cache first, then fetches from API and caches response
 */
const cachedFetch = async <T>(
  endpoint: string,
  options: RequestInit = {},
  cacheKey?: string,
  cacheTTL: 'api' | 'user' | 'tenant' | 'chat' | 'session' = 'api'
): Promise<T> => {
  // Generate cache key if not provided
  const key = cacheKey || CacheKeys.apiResponse(endpoint, JSON.stringify(options));
  
  // Check cache first
  const cached = await getCached<T>(key);
  if (cached !== null) {
    if (DEBUG_LOGGING) console.log(`[Cache] Hit for ${endpoint}`);
    return cached;
  }
  
  // Fetch from API
  if (DEBUG_LOGGING) console.log(`[Cache] Miss for ${endpoint}, fetching...`);
  const response = await fetch(`${API_BASE_URL}/api/${endpoint}`, {
    ...options,
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  const contentType = response.headers.get('content-type') || '';
  if (!response.ok || !contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(`API Error: ${response.status}. Expected JSON, got ${contentType}. Body: ${text.slice(0, 100)}`);
  }
  
  const data = await response.json();
  
  // Cache the response
  await setCachedByType(key, data, cacheTTL);
  
  return data;
};

// Clear cache when socket data updates are received
export const invalidateDataCache = async (tenantId: string, dataType?: string): Promise<void> => {
  if (dataType) {
    // Invalidate specific data type
    await deleteCached(CacheKeys.tenantBootstrap(tenantId));
    
    switch (dataType) {
      case 'products':
        await deleteCached(CacheKeys.tenantProducts(tenantId));
        break;
      case 'orders':
        // Clear order cache
        const orderCacheKey = CacheKeys.tenantOrders(tenantId);
        await deleteCached(orderCacheKey);
        break;
      case 'chat_messages':
        await deleteCached(CacheKeys.chatMessages(tenantId));
        break;
    }
  } else {
    // Clear all cache for tenant
    await clearTenantCache(tenantId);
  }
  
  if (DEBUG_LOGGING) console.log(`[Cache] Invalidated cache for tenant ${tenantId}, type: ${dataType || 'all'}`);
};

// Mark fetch API usage for socket updates
const socketUpdateFlags = new Set<string>();

// Socket.IO connection for real-time updates - lazy loaded
let socket: Socket | null = null;
let socketInitAttempted = false;
let pendingTenantJoin: string | null = null;
let socketModule: typeof import('socket.io-client') | null = null;

// Lazy load socket.io-client only when needed
const getSocketIO = async () => {
  if (!socketModule) {
    socketModule = await import('socket.io-client');
  }
  return socketModule;
};

const initSocket = async (): Promise<Socket | null> => {
  if (typeof window === 'undefined') return null;
  if (socket?.connected) return socket;
  
  // If socket exists but disconnected, try to reconnect
  if (socket && !socket.connected) {
    socket.connect();
    return socket;
  }
  
  // Only create new socket once
  if (socketInitAttempted) return socket;
  
  socketInitAttempted = true;
  // Connect to the backend API server (not the frontend dev server)
  // API_BASE_URL points to the actual backend (e.g. http://localhost:5001 in dev)
  // Falling back to window.location.origin for production where frontend is served by backend
  const socketUrl = API_BASE_URL || window.location.origin;
  
  if (DEBUG_LOGGING) console.log('[Socket.IO] Initializing connection to:', socketUrl);
  
  try {
    const { io } = await getSocketIO();
    socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      autoConnect: true,
      withCredentials: true
    });
    
    socket.on('connect', () => {
      if (DEBUG_LOGGING) console.log('[Socket.IO] Connected:', socket?.id);
      // Join pending tenant room after connection
      if (pendingTenantJoin && socket?.connected) {
        socket.emit('join-tenant', pendingTenantJoin);
        if (DEBUG_LOGGING) console.log('[Socket.IO] Joined pending tenant room:', pendingTenantJoin);
      }
    });
    
    socket.on('disconnect', (reason) => {
      if (DEBUG_LOGGING) console.log('[Socket.IO] Disconnected:', reason);
    });
    
    socket.on('connect_error', (error) => {
      // Only log once per session to avoid console spam
      if (!socket?.connected) {
        console.debug('[Socket.IO] Connection error:', error.message);
      }
    });
  
  // Listen for data updates and notify listeners
  socket.on('data-update', (payload: { tenantId: string; key: string; data: unknown }) => {
    if (DEBUG_LOGGING) console.log('[Socket.IO] Data update received:', payload.tenantId, payload.key);
    // Map server keys to frontend keys if needed
    const keyMap: Record<string, string> = {
      'theme_config': 'theme',
      'website_config': 'website',
      'delivery_config': 'delivery',
      'payment_methods': 'payment_methods',
      'landing_pages': 'landing_pages',
      'chat_messages': 'chat_messages',
      'store_studio_config': 'store_studio_config',
      'store_layout': 'store_layout',
      'store_customization': 'store_customization'
    };
    const mappedKey = keyMap[payload.key] || payload.key;
    
    // Invalidate both localStorage and Redis cache for this key
    invalidateCache(payload.key, payload.tenantId);
    invalidateDataCache(payload.tenantId, payload.key).catch(err => 
      console.warn('[Cache] Redis invalidation failed:', err)
    );
    
    // Notify UI listeners - mark as from socket to prevent save loops
    notifyDataRefresh(mappedKey, payload.tenantId, true);
  });

  // Listen for chat message updates
  socket.on('chat-update', (payload: { tenantId: string; data: unknown }) => {
    if (DEBUG_LOGGING) console.log('[Socket.IO] Chat update received:', payload.tenantId);
    invalidateCache('chat_messages', payload.tenantId);
    notifyDataRefresh('chat_messages', payload.tenantId, true);
  });
  
  socket.on('new-order', (payload: { tenantId: string; data: unknown }) => {
    if (DEBUG_LOGGING) console.log('[Socket.IO] New order received:', payload.tenantId);
    invalidateCache('orders', payload.tenantId);
    notifyDataRefresh('orders', payload.tenantId, true);
  });
  
  socket.on('order-updated', (payload: { tenantId: string; data: unknown }) => {
    if (DEBUG_LOGGING) console.log('[Socket.IO] Order updated:', payload.tenantId);
    invalidateCache('orders', payload.tenantId);
    notifyDataRefresh('orders', payload.tenantId, true);
  });

  // Listen for real-time notification events (new order notifications, etc.)
  socket.on('new-notification', (notification: any) => {
    if (DEBUG_LOGGING) console.log('[Socket.IO] New notification received:', notification?.title || notification?.type);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('socket:new-notification', { detail: notification }));
    }
  });
  
  } catch (e) {
    console.error('[Socket.IO] Initialization failed:', e);
    return null;
  }
  
  return socket;
};

// Join tenant room for targeted updates
export const joinTenantRoom = async (tenantId: string) => {
  pendingTenantJoin = tenantId; // Store for reconnection
  const s = await initSocket();
  if (s?.connected) {
    s.emit('join-tenant', tenantId);
    if (DEBUG_LOGGING) console.log('[Socket.IO] Joined tenant room:', tenantId);
  } else {
    if (DEBUG_LOGGING) console.log('[Socket.IO] Socket not connected, will join room on connect');
  }
};

// Leave tenant room
export const leaveTenantRoom = async (tenantId: string) => {
  // Use cached socket if available (don't init just to leave)
  if (socket?.connected) {
    socket.emit('leave-tenant', tenantId);
  }
};

const buildApiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE_URL) {
    return normalizedPath;
  }
  const trimmedBase = API_BASE_URL.replace(/\/$/, '');
  return `${trimmedBase}${normalizedPath}`;
};

type TenantApiListResponse = { data?: Array<Partial<Tenant> & { _id?: string }>; error?: string };
type TenantApiItemResponse = { data?: Partial<Tenant> & { _id?: string }; error?: string };
type TenantDataResponse<T = unknown> = { data?: T; error?: string };

type SavePayload = {
  key: string;
  data: unknown;
  tenantId?: string;
  options?: { forceEmpty?: boolean };
};

type SaveQueueEntry = {
  timer: ReturnType<typeof setTimeout>;
  payload: SavePayload;
  resolvers: Array<{ resolve: () => void; reject: (error: unknown) => void }>;
};

// Data refresh event system for cross-component synchronization
type DataRefreshListener = (key: string, tenantId?: string, fromSocket?: boolean) => void;
const dataRefreshListeners = new Set<DataRefreshListener>();

// Track keys that were just updated from socket to prevent save loops
const socketUpdatedKeys = new Set<string>();

export const isKeyFromSocket = (key: string, tenantId?: string): boolean => {
  const cacheKey = `${tenantId || 'public'}::${key}`;
  return socketUpdatedKeys.has(cacheKey);
};

export const clearSocketFlag = (key: string, tenantId?: string): void => {
  const cacheKey = `${tenantId || 'public'}::${key}`;
  socketUpdatedKeys.delete(cacheKey);
};

export const onDataRefresh = (listener: DataRefreshListener): (() => void) => {
  dataRefreshListeners.add(listener);
  return () => dataRefreshListeners.delete(listener);
};

const notifyDataRefresh = (key: string, tenantId?: string, fromSocket = false) => {
  if (fromSocket) {
    const cacheKey = `${tenantId || 'public'}::${key}`;
    socketUpdatedKeys.add(cacheKey);
    // Clear flag after a short delay to allow state to settle
    setTimeout(() => socketUpdatedKeys.delete(cacheKey), 2000);
  }
  dataRefreshListeners.forEach(listener => {
    try {
      listener(key, tenantId, fromSocket);
    } catch (error) {
      console.error('Data refresh listener error:', error);
    }
  });
};

const SAVE_DEBOUNCE_MS = Math.max(0, Number(process.env.VITE_REMOTE_SAVE_DEBOUNCE_MS ?? 1200));
const DISABLE_REMOTE_SAVE = String(process.env.VITE_DISABLE_REMOTE_SAVE ?? '').toLowerCase() === 'true';
const SHOULD_LOG_SAVE_SKIP = Boolean(process.env.DEV);

// Simple memory cache for frequently accessed data
type CacheEntry<T> = { data: T; timestamp: number; tenantId?: string };
const dataCache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache - increased to prevent frequent resets

const getCacheKey = (key: string, tenantId?: string) => {
  const scope = (tenantId && tenantId.trim()) ? tenantId.trim() : 'public';
  return `${scope}::${key}`;
};

// LocalStorage cache for instant loads
const LOCAL_CACHE_PREFIX = 'ds_cache_';
const LOCAL_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours for localStorage - user data should persist

const getLocalCache = <T>(key: string, tenantId?: string): T | null => {
  if (typeof window === 'undefined') return null;
  try {
    const cacheKey = LOCAL_CACHE_PREFIX + getCacheKey(key, tenantId);
    const stored = localStorage.getItem(cacheKey);
    if (!stored) return null;
    const { data, timestamp } = JSON.parse(stored);
    if (Date.now() - timestamp > LOCAL_CACHE_TTL_MS) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    return data as T;
  } catch {
    return null;
  }
};

const setLocalCache = <T>(key: string, data: T, tenantId?: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const cacheKey = LOCAL_CACHE_PREFIX + getCacheKey(key, tenantId);
    localStorage.setItem(cacheKey, safeStringify({ data, timestamp: Date.now() }));
  } catch {
    // localStorage full or unavailable
  }
};

const getCachedData = <T>(key: string, tenantId?: string): T | null => {
  const cacheKey = getCacheKey(key, tenantId);
  // Check memory cache first
  const entry = dataCache.get(cacheKey) as CacheEntry<T> | undefined;
  if (entry && Date.now() - entry.timestamp <= CACHE_TTL_MS) {
    return entry.data;
  }
  if (entry) dataCache.delete(cacheKey);
  // Fallback to localStorage for instant loads
  const localData = getLocalCache<T>(key, tenantId);
  if (localData !== null) {
    // Restore to memory cache
    dataCache.set(cacheKey, { data: localData, timestamp: Date.now(), tenantId });
    return localData;
  }
  return null;
};

const setCachedData = <T>(key: string, data: T, tenantId?: string): void => {
  const cacheKey = getCacheKey(key, tenantId);
  dataCache.set(cacheKey, { data, timestamp: Date.now(), tenantId });
  // Also persist to localStorage for instant next load
  setLocalCache(key, data, tenantId);
};

const invalidateCache = (key: string, tenantId?: string): void => {
  const cacheKey = getCacheKey(key, tenantId);
  dataCache.delete(cacheKey);
  if (typeof window !== 'undefined') {
    try { localStorage.removeItem(LOCAL_CACHE_PREFIX + cacheKey); } catch {}
  }
};

// Request deduplication - prevent multiple concurrent requests for the same data
const pendingRequests = new Map<string, Promise<unknown>>();

const deduplicateRequest = async <T>(
  key: string,
  tenantId: string | undefined,
  requestFn: () => Promise<T>
): Promise<T> => {
  const cacheKey = getCacheKey(key, tenantId);
  
  // Check if there's already a pending request for this data
  const pending = pendingRequests.get(cacheKey);
  if (pending) {
    return pending as Promise<T>;
  }
  
  // Create new request and track it
  const promise = requestFn().finally(() => {
    pendingRequests.delete(cacheKey);
  });
  
  pendingRequests.set(cacheKey, promise);
  return promise;
};

class DataServiceImpl {
  incrementTutorialViews(id: string, tenantId: string) {
    throw new Error('Method not implemented.');
  }
  getTutorials(tenantId: string) {
    throw new Error('Method not implemented.');
  }
  async setupCustomDomain(tenantId: string, domain: string) {
    return this.requestTenantApi(`/api/tenants/${tenantId}/setup-domain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customDomain: domain })
    });
  }
  async verifyDomainDNS(tenantId: string, domain: string) {
    return this.requestTenantApi(`/api/tenants/${tenantId}/verify-domain?domain=${encodeURIComponent(domain)}`);
  }
  private saveQueue = new Map<string, SaveQueueEntry>();
  private hasLoggedSaveBlock = false;

  private sanitizeTenantSlug(value?: string | null): string {
    if (!value) return '';
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/^-+|-+$/g, '')
      .slice(0, 63);
  }

  private omitUndefined<T extends Record<string, any>>(payload: T): T {
    const sanitized: Record<string, any> = {};
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined) {
        sanitized[key] = value;
      }
    });
    return sanitized as T;
  }

  private filterByTenant<T extends { tenantId?: string }>(items: T[], tenantId?: string): T[] {
    if (!tenantId) return items;
    return items.filter(item => !item.tenantId || item.tenantId === tenantId);
  }

  private resolveTenantScope(tenantId?: string) {
    return tenantId?.trim() ? tenantId.trim() : 'public';
  }

  private getSaveQueueKey(key: string, tenantId?: string) {
    return `${this.resolveTenantScope(tenantId)}::${key}`;
  }

  private enqueueSave<T>(key: string, data: T, tenantId?: string, options?: { forceEmpty?: boolean }): Promise<void> {
    const queueKey = this.getSaveQueueKey(key, tenantId);
    return new Promise((resolve, reject) => {
      const existing = this.saveQueue.get(queueKey);
      if (existing) {
        clearTimeout(existing.timer);
        existing.payload = { key, data, tenantId, options };
        existing.resolvers.push({ resolve, reject });
        existing.timer = setTimeout(() => this.flushQueuedSave(queueKey), SAVE_DEBOUNCE_MS);
        return;
      }

      const timer = setTimeout(() => this.flushQueuedSave(queueKey), SAVE_DEBOUNCE_MS);
      this.saveQueue.set(queueKey, {
        timer,
        payload: { key, data, tenantId, options },
        resolvers: [{ resolve, reject }]
      });
    });
  }

  private async flushQueuedSave(queueKey: string) {
    const entry = this.saveQueue.get(queueKey);
    if (!entry) return;
    clearTimeout(entry.timer);
    this.saveQueue.delete(queueKey);
    try {
      await this.commitSave(entry.payload.key, entry.payload.data, entry.payload.tenantId, entry.payload.options);
      entry.resolvers.forEach(({ resolve }) => resolve());
    } catch (error) {
      entry.resolvers.forEach(({ reject }) => reject(error));
    }
  }

  private normalizeHeaders(headers?: HeadersInit) {
    if (!headers) return {} as Record<string, string>;
    if (headers instanceof Headers) {
      return Object.fromEntries(headers.entries());
    }
    if (Array.isArray(headers)) {
      return headers.reduce<Record<string, string>>((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});
    }
    return { ...headers };
  }

  private async requestTenantApi<T>(path: string, init?: RequestInit): Promise<T> {
    if (typeof fetch === 'undefined') {
      throw new Error('Fetch API is not available in this environment');
    }
    const { headers, body, ...rest } = init || {};
    const normalizedHeaders = this.normalizeHeaders(headers);
    const authHeaders = this.normalizeHeaders(getAuthHeader());

    try {
      const response = await fetch(buildApiUrl(path), {
        credentials: 'include',
        ...rest,
        headers: {
          ...authHeaders,
          ...normalizedHeaders
        },
        body
      });
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok) {
        if (contentType.includes('application/json')) {
          const errorPayload = await response.json().catch(() => null) as { error?: string; code?: string; message?: string } | null;
          const errorCode = errorPayload?.code || '';
          const message = errorPayload?.error || errorPayload?.message || `Request failed (${response.status})`;
          
          // Create error with code for downstream handling
          const err = new Error(message) as Error & { code?: string; status?: number };
          err.code = errorCode;
          err.status = response.status;
          throw err;
        }
        const err = new Error(`Request failed (${response.status})`) as Error & { status?: number };
        err.status = response.status;
        throw err;
      }
      if (!contentType.includes('application/json')) {
        throw new Error(`Invalid API response: expected JSON but got ${contentType || 'unknown'} from ${path}`);
      }
      const raw = await response.text();
      const payload = raw ? JSON.parse(raw) : null;
      return payload as T;
    } catch (err: any) {
      // network error (e.g. connection refused) or parsing error
      console.error(`[DataService] Network/API error while calling ${path}:`, err.message || err);
      // show user-facing hint once if running in browser
      if (typeof window !== 'undefined' && (err.message || '').toLowerCase().includes('failed to fetch')) {
        try {
          import('react-hot-toast').then(({ toast }) => {
            toast.error('Unable to reach backend API. Make sure the server is running.');
          });
        } catch {}
      }
      // rethrow so callers can decide to fallback
      throw err;
    }
  }

  private async fetchTenantDocument<T>(key: string, tenantId?: string): Promise<T | null> {
    const scope = this.resolveTenantScope(tenantId);
    try {
      const response = await this.requestTenantApi<TenantDataResponse<T>>(`/api/tenant-data/${scope}/${key}`);
      if (response && 'data' in response) {
        return (response.data ?? null) as T | null;
      }
      return null;
    } catch (error: any) {
      const status = error?.status;
      const code = error?.code || '';
      const msg = error?.message || '';
      
      // Show user feedback for critical errors
      if (typeof window !== 'undefined') {
        if (status === 402 || code === 'SUBSCRIPTION_BLOCKED') {
          import('react-hot-toast').then(({ toast }) => toast.error('Subscription expired. Please renew to continue.')).catch(() => {});
        } else if (status === 401 || code === 'TOKEN_EXPIRED') {
          import('react-hot-toast').then(({ toast }) => toast.error('Session expired. Please log in again.')).catch(() => {});
        } else if (status === 503 || code === 'SUBSCRIPTION_CHECK_FAILED') {
          import('react-hot-toast').then(({ toast }) => toast.error('Service temporarily unavailable. Please try again.')).catch(() => {});
        }
      }
      
      console.warn(`Unable to load ${key} for tenant ${scope}:`, msg);
      return null;
    }
  }

  private async persistTenantDocument<T>(key: string, data: T, tenantId?: string): Promise<void> {
    // Skip API call if no auth token — prevents 401 errors from background auto-save
    if (!hasValidToken()) {
      console.debug(`[DataService] Skipping save for ${key} — no auth token`);
      return;
    }
    const scope = this.resolveTenantScope(tenantId);
    await this.requestTenantApi(`/api/tenant-data/${scope}/${key}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: safeStringify({ data })
    });
  }

  private normalizeTenantDocument(doc: Partial<Tenant> & { _id?: string }): Tenant {
    const idValue = doc.id || doc._id || doc.subdomain || `tenant-${Date.now()}`;
    return { ...(doc as Tenant), id: String(idValue) };
  }

  private async fetchMockTenants(): Promise<Tenant[]> {
    if (typeof fetch === 'undefined') {
      return [];
    }
    try {
      const response = await fetch(buildApiUrl('/api/tenants'));
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Unable to load tenants (${response.status}). Expected JSON, got ${contentType}. Body: ${text.slice(0, 100)}`);
      }
      const payload = await response.json();
      return Array.isArray(payload?.data) ? (payload.data as Tenant[]) : [];
    } catch (error) {
      console.warn('Failed to load tenants', error);
      return [];
    }
  }

  // Bootstrap: Fetch all critical data in ONE API call
  // Includes catalog data (categories, brands, tags) so above-fold sections
  // render immediately without waiting for the deferred secondary load.
  async bootstrap(tenantId?: string): Promise<{
    products: Product[];
    themeConfig: ThemeConfig | null;
    websiteConfig: WebsiteConfig;
    categories?: Category[];
    subcategories?: SubCategory[];
    childcategories?: ChildCategory[];
    brands?: Brand[];
    tags?: Tag[];
  }> {
    const scope = this.resolveTenantScope(tenantId);
    const defaultWebsite = this.getDefaultWebsiteConfig();

    // Check Redis cache first for ultra-fast response
    const cacheKey = CacheKeys.tenantBootstrap(scope);
    const cachedBootstrap = await getCached<{
      products: Product[];
      themeConfig: ThemeConfig | null;
      websiteConfig: WebsiteConfig;
    }>(cacheKey);
    
    if (cachedBootstrap && cachedBootstrap.products.length > 0) {
      if (DEBUG_LOGGING) console.log(`[Redis] Bootstrap cache hit for tenant: ${scope}`, {
        socialLinksCount: cachedBootstrap.websiteConfig?.socialLinks?.length || 0,
        addressesCount: cachedBootstrap.websiteConfig?.addresses?.length || 0
      });
      
      // Background revalidation to keep cache fresh
      this.revalidateBootstrap(scope, tenantId, defaultWebsite, cachedBootstrap.products)
        .catch(err => console.warn('[DataService] Bootstrap revalidation failed', err));
      
      return cachedBootstrap;
    }

    // Fallback to legacy localStorage cache
    const cachedProducts = getCachedData<Product[]>('products', tenantId);
    const cachedTheme = getCachedData<ThemeConfig | null>('theme_config', tenantId);
    const cachedWebsite = getCachedData<WebsiteConfig>('website_config', tenantId);
    
    // Only use cache if we have actual products (not empty array)
    const hasValidProductCache = cachedProducts && cachedProducts.length > 0;
    const hasOtherCache = Boolean(cachedTheme || cachedWebsite);

    if (hasValidProductCache) {
      console.log('[DataService] Using localStorage cache for bootstrap', {
        cachedSocialLinks: cachedWebsite?.socialLinks?.length || 0,
        cachedAddresses: cachedWebsite?.addresses?.length || 0
      });
      // Kick off background revalidation without blocking UI
      this.revalidateBootstrap(scope, tenantId, defaultWebsite, cachedProducts).catch(err => {
        console.warn('[DataService] Bootstrap revalidation failed', err);
      });

      return {
        products: cachedProducts.map((p, i) => ({ ...p, id: p.id ?? i + 1 })),
        themeConfig: cachedTheme ?? null,
        websiteConfig: cachedWebsite ? { ...defaultWebsite, ...cachedWebsite } : defaultWebsite
      };
    }
    
    // If no product cache but have other cached data, still fetch fresh but use other caches
    if (hasOtherCache) {
      const freshData = await this.fetchFreshBootstrap(scope, tenantId, defaultWebsite);
      
      // Cache in Redis for next request
      await setCachedByType(cacheKey, {
        products: freshData.products,
        themeConfig: freshData.themeConfig,
        websiteConfig: freshData.websiteConfig
      }, 'tenant');
      
      return {
        products: freshData.products,
        themeConfig: freshData.themeConfig ?? cachedTheme ?? null,
        websiteConfig: freshData.websiteConfig ?? (cachedWebsite ? { ...defaultWebsite, ...cachedWebsite } : defaultWebsite)
      };
    }

    // No cache available - fetch fresh data
    const freshData = await this.fetchFreshBootstrap(scope, tenantId, defaultWebsite);
    
    // Cache in Redis for next request
    await setCachedByType(cacheKey, {
      products: freshData.products,
      themeConfig: freshData.themeConfig,
      websiteConfig: freshData.websiteConfig
    }, 'tenant');
    
    return freshData;
  }

  private async revalidateBootstrap(scope: string, tenantId: string | undefined, defaultWebsite: WebsiteConfig, cachedProducts?: Product[]) {
    // Capture cached values BEFORE revalidation fetch updates local cache
    const prevWebsite = getCachedData<WebsiteConfig>('website_config', tenantId);
    const prevTheme = getCachedData<ThemeConfig | null>('theme_config', tenantId);

    const freshData = await this.fetchFreshBootstrap(scope, tenantId, defaultWebsite, true);
    
    // If fresh data has different products than cached, notify UI to refresh
    if (freshData.products.length !== (cachedProducts?.length || 0) ||
        JSON.stringify(freshData.products.map(p => p.id).sort()) !== JSON.stringify((cachedProducts || []).map(p => p.id).sort())) {
      console.log('[DataService] Background revalidation found new products, notifying UI');
      notifyDataRefresh('products', tenantId, false);
    }

    // Notify UI if website config changed (carousel, campaigns, branding, etc.)
    try {
      const prevCarouselLen = prevWebsite?.carouselItems?.length ?? 0;
      const freshCarouselLen = freshData.websiteConfig?.carouselItems?.length ?? 0;
      const websiteChanged =
        prevCarouselLen !== freshCarouselLen ||
        JSON.stringify(prevWebsite?.carouselItems ?? []) !== JSON.stringify(freshData.websiteConfig?.carouselItems ?? []) ||
        JSON.stringify(prevWebsite?.campaigns ?? []) !== JSON.stringify(freshData.websiteConfig?.campaigns ?? []) ||
        (prevWebsite?.websiteName ?? '') !== (freshData.websiteConfig?.websiteName ?? '') ||
        (prevWebsite?.productDetailTheme ?? '') !== (freshData.websiteConfig?.productDetailTheme ?? '') ||
        (prevWebsite?.readyTheme ?? '') !== (freshData.websiteConfig?.readyTheme ?? '');

      if (websiteChanged) {
        console.log('[DataService] Background revalidation found updated website config, notifying UI');
        notifyDataRefresh('website', tenantId, false);
      }
    } catch {
      // Ignore comparison failures
    }

    // Notify UI if theme config changed
    try {
      if (JSON.stringify(prevTheme ?? null) !== JSON.stringify(freshData.themeConfig ?? null)) {
        console.log('[DataService] Background revalidation found updated theme config, notifying UI');
        notifyDataRefresh('theme', tenantId, false);
      }
    } catch {
      // Ignore comparison failures
    }
  }

  private async fetchFreshBootstrap(scope: string, tenantId: string | undefined, defaultWebsite: WebsiteConfig, isBackground = false) {
    console.log(`[DataService] Bootstrap loading for tenant: ${scope}${isBackground ? ' (background)' : ''}`);

    try {
      // Check if we have prefetched data from index.html XHR (fastest)
      let responseData: { data: { products: Product[] | null; theme_config: ThemeConfig | null; website_config: WebsiteConfig | null; categories?: Category[]; subcategories?: SubCategory[]; childcategories?: ChildCategory[]; brands?: Brand[]; tags?: Tag[] } } | null = null;
      
      if (!isBackground && typeof window !== 'undefined') {
        // First check XHR prefetch from index.html (synchronous, already loaded)
        if ((window as any).__BOOTSTRAP_DATA__?.data) {
          console.log('[DataService] Using XHR prefetched bootstrap data (instant)');
          responseData = (window as any).__BOOTSTRAP_DATA__;
          delete (window as any).__BOOTSTRAP_DATA__;
        }
        // Fallback to entry-client.tsx prefetch
        else if ((window as any).__PREFETCHED_BOOTSTRAP__) {
          try {
            const prefetched = await (window as any).__PREFETCHED_BOOTSTRAP__;
            if (prefetched?.data) {
              console.log('[DataService] Using prefetched bootstrap data');
              responseData = prefetched;
              delete (window as any).__PREFETCHED_BOOTSTRAP__;
            }
          } catch (e) {
            console.warn('[DataService] Prefetch failed, fetching fresh');
          }
        }
      }
      
      if (!responseData) {
        // Request bootstrap with catalog data so above-fold categories render immediately
        responseData = await this.requestTenantApi<{
          data: {
            products: Product[] | null;
            theme_config: ThemeConfig | null;
            website_config: WebsiteConfig | null;
            categories?: Category[];
            subcategories?: SubCategory[];
            childcategories?: ChildCategory[];
            brands?: Brand[];
            tags?: Tag[];
          };
        }>(`/api/tenant-data/${scope}/bootstrap?include=catalog`);
      }
      
      const { products, theme_config, website_config, categories, subcategories, childcategories, brands, tags } = responseData.data;

      // Cache the results for subsequent fast loads
      // Only cache if we got actual data (not null/undefined)
      if (products !== null && products !== undefined) setCachedData('products', products, tenantId);
      if (theme_config) setCachedData('theme_config', theme_config, tenantId);
      if (website_config) setCachedData('website_config', website_config, tenantId);
      if (categories) setCachedData('categories', categories, tenantId);
      if (subcategories) setCachedData('subcategories', subcategories, tenantId);
      if (childcategories) setCachedData('childcategories', childcategories, tenantId);
      if (brands) setCachedData('brands', brands, tenantId);
      if (tags) setCachedData('tags', tags, tenantId);
      
      // Return products from server (even empty array is valid - tenant has no products yet)
      const finalProducts = (products || []).map((p, i) => ({ ...p, id: p.id ?? i + 1 }));
      
      return {
        products: finalProducts,
        themeConfig: theme_config || null,
        websiteConfig: website_config ? { ...defaultWebsite, ...website_config } : defaultWebsite,
        categories: categories || undefined,
        subcategories: subcategories || undefined,
        childcategories: childcategories || undefined,
        brands: brands || undefined,
        tags: tags || undefined,
      };
    } catch (error) {
      console.warn('Bootstrap failed, falling back to cache/individual requests', error);
      // if we have any cached data, return it immediately instead of hitting network again
      const cachedProducts = getCachedData<Product[]>('products', tenantId) || [];
      const cachedTheme = getCachedData<ThemeConfig | null>('theme_config', tenantId) ?? null;
      const cachedWebsite = getCachedData<WebsiteConfig>('website_config', tenantId) || defaultWebsite;
      if (cachedProducts.length || cachedTheme || cachedWebsite) {
        return {
          products: cachedProducts.map((p, i) => ({ ...p, id: p.id ?? i + 1 })),
          themeConfig: cachedTheme,
          websiteConfig: cachedWebsite
        };
      }
      if (!isBackground) {
        const [products, themeConfig, websiteConfig] = await Promise.all([
          this.getProducts(tenantId),
          this.getThemeConfig(tenantId),
          this.getWebsiteConfig(tenantId)
        ]);
        return { products, themeConfig, websiteConfig };
      }
      throw error;
    }
  }

  // Default website config - used as fallback for new tenants (minimal defaults, all content is dynamic)
  private getDefaultWebsiteConfig(): WebsiteConfig {
    return {
      websiteName: '',
      storeName: '',
      shortDescription: '',
      whatsappNumber: '',
      favicon: '',
      headerLogo: '',
      footerLogo: '',
      addresses: [],
      emails: [],
      phones: [],
      socialLinks: [],
      footerQuickLinks: [],
      footerUsefulLinks: [],
      showMobileHeaderCategory: true,
      showNewsSlider: false,
      headerSliderText: '',
      hideCopyright: false,
      hideCopyrightText: false,
      showPoweredBy: false,
      brandingText: '',
      carouselItems: [],
      searchHints: '',
      orderLanguage: 'English',
      productDetailTheme: 'modern',
      productCardStyle: 'style2',
      categorySectionStyle: 'style5',
      productSectionStyle: 'style2',
      footerStyle: 'style2',
      chatEnabled: true,
      chatGreeting: '',
      chatOfflineMessage: '',
      chatSupportHours: { from: '09:00', to: '18:00' },
      chatWhatsAppFallback: false,
      popups: []
    };
  }

  // Secondary data: Fetch all secondary data in ONE API call
  async getSecondaryData(tenantId?: string): Promise<{
    orders: Order[];
    logo: string | null;
    deliveryConfig: DeliveryConfig[];
    paymentMethods: PaymentMethod[];
    chatMessages: ChatMessage[];
    landingPages: LandingPage[];
    categories: Category[];
    subcategories: SubCategory[];
    childcategories: ChildCategory[];
    brands: Brand[];
    tags: Tag[];
  }> {
    const scope = this.resolveTenantScope(tenantId);
    if (DEBUG_LOGGING) console.log(`[DataService] Loading secondary data for tenant: ${scope}`);

    // Serve cached data immediately
    const cachedOrders = getCachedData<Order[]>('orders', tenantId);
    const cachedLogo = getCachedData<string | null>('logo', tenantId);
    const cachedDelivery = getCachedData<DeliveryConfig[]>('delivery_config', tenantId);
    const cachedPaymentMethods = getCachedData<PaymentMethod[]>('payment_methods', tenantId);
    const cachedChat = getCachedData<ChatMessage[]>('chat_messages', tenantId);
    const cachedLanding = getCachedData<LandingPage[]>('landing_pages', tenantId);
    const cachedCategories = getCachedData<Category[]>('categories', tenantId);
    const cachedSubcategories = getCachedData<SubCategory[]>('subcategories', tenantId);
    const cachedChildCategories = getCachedData<ChildCategory[]>('childcategories', tenantId);
    const cachedBrands = getCachedData<Brand[]>('brands', tenantId);
    const cachedTags = getCachedData<Tag[]>('tags', tenantId);

    const hasCachedSecondary = Boolean(
      (cachedOrders && cachedOrders.length) || cachedLogo || (cachedDelivery && cachedDelivery.length) ||
      (cachedPaymentMethods && cachedPaymentMethods.length) ||
      (cachedChat && cachedChat.length) || (cachedLanding && cachedLanding.length) ||
      (cachedCategories && cachedCategories.length) || (cachedSubcategories && cachedSubcategories.length) ||
      (cachedChildCategories && cachedChildCategories.length) || (cachedBrands && cachedBrands.length) ||
      (cachedTags && cachedTags.length)
    );

    if (hasCachedSecondary) {
      this.revalidateSecondary(scope, tenantId).catch(err => console.warn('[DataService] Secondary revalidation failed', err));

      return {
        orders: cachedOrders || [],
        logo: cachedLogo || null,
        deliveryConfig: cachedDelivery || [],
        paymentMethods: cachedPaymentMethods || [],
        chatMessages: cachedChat || [],
        landingPages: cachedLanding || [],
        categories: cachedCategories || [],
        subcategories: cachedSubcategories || [],
        childcategories: cachedChildCategories || [],
        brands: cachedBrands || [],
        tags: cachedTags || []
      };
    }
    
    return this.fetchFreshSecondary(scope, tenantId);
  }

  private async revalidateSecondary(scope: string, tenantId: string | undefined) {
    await this.fetchFreshSecondary(scope, tenantId, true);
  }

  private async fetchFreshSecondary(
    scope: string,
    tenantId: string | undefined,
    isBackground = false
  ) {
    try {
      // Check for prefetched secondary data from index.html/entry-client (instant)
      let response: {
        data: {
          payment_methods: any[];
          orders: Order[] | null;
          logo: string | null;
          delivery_config: DeliveryConfig[] | null;
          chat_messages: ChatMessage[] | null;
          landing_pages: LandingPage[] | null;
          categories: Category[] | null;
          subcategories: SubCategory[] | null;
          childcategories: ChildCategory[] | null;
          brands: Brand[] | null;
          tags: Tag[] | null;
        };
      } | null = null;

      if (!isBackground && typeof window !== 'undefined') {
        // First check synchronous XHR prefetch from index.html
        if ((window as any).__SECONDARY_DATA__?.data) {
          console.log('[DataService] Using XHR prefetched secondary data (instant)');
          response = (window as any).__SECONDARY_DATA__;
          delete (window as any).__SECONDARY_DATA__;
        }
        // Fallback to entry-client.tsx fetch promise
        else if ((window as any).__PREFETCHED_SECONDARY__) {
          try {
            const prefetched = await (window as any).__PREFETCHED_SECONDARY__;
            if (prefetched?.data) {
              console.log('[DataService] Using prefetched secondary data');
              response = prefetched;
              delete (window as any).__PREFETCHED_SECONDARY__;
            }
          } catch (e) {
            console.warn('[DataService] Secondary prefetch failed, fetching fresh');
          }
        }
      }

      if (!response) {
        const data = await deduplicateRequest(`tenant_secondary_bundle`, scope === 'public' ? undefined : scope, () =>
          this.requestTenantApi<{
            data: {
              payment_methods: any[];
              orders: Order[] | null;
              logo: string | null;
              delivery_config: DeliveryConfig[] | null;
              chat_messages: ChatMessage[] | null;
              landing_pages: LandingPage[] | null;
              categories: Category[] | null;
              subcategories: SubCategory[] | null;
              childcategories: ChildCategory[] | null;
              brands: Brand[] | null;
              tags: Tag[] | null;
            };
          }>(`/api/tenant-data/${scope}/secondary`)
        );
        response = data;
      }

      if (!response) {
        throw new Error('Failed to fetch secondary data');
      }

      const data = response.data;

      // Cache results for quick subsequent loads
      setCachedData('orders', data.orders || [], tenantId);
      setCachedData('logo', data.logo || null, tenantId);
      setCachedData('delivery_config', data.delivery_config || [], tenantId);
      setCachedData('payment_methods', data.payment_methods || [], tenantId);
      setCachedData('chat_messages', data.chat_messages || [], tenantId);
      setCachedData('landing_pages', data.landing_pages || [], tenantId);
      setCachedData('categories', data.categories || [], tenantId);
      setCachedData('subcategories', data.subcategories || [], tenantId);
      setCachedData('childcategories', data.childcategories || [], tenantId);
      setCachedData('brands', data.brands || [], tenantId);
      setCachedData('tags', data.tags || [], tenantId);
      
      return {
        orders: data.orders || [],
        logo: data.logo || null,
        deliveryConfig: data.delivery_config || [],
        paymentMethods: data.payment_methods || [],
        chatMessages: data.chat_messages || [],
        landingPages: data.landing_pages || [],
        categories: data.categories || [],
        subcategories: data.subcategories || [],
        childcategories: data.childcategories || [],
        brands: data.brands || [],
        tags: data.tags || []
      };
    } catch (error) {
      if (isBackground) throw error;
      console.warn('[DataService] Secondary data fetch failed', error);
      return {
        orders: [],
        logo: null,
        deliveryConfig: [],
        paymentMethods: [],
        chatMessages: [],
        landingPages: [],
        categories: [],
        subcategories: [],
        childcategories: [],
        brands: [],
        tags: []
      };
    }
  }

  private async getCollection<T>(key: string, defaultValue: T[], tenantId?: string): Promise<T[]> {
    // Check cache first
    const cached = getCachedData<T[]>(key, tenantId);
    if (cached && cached.length > 0) return this.filterByTenant(cached as Array<T & { tenantId?: string }>, tenantId);
    
    const remote = await this.fetchTenantDocument<T[]>(key, tenantId);
    if (Array.isArray(remote) && remote.length > 0) {
      setCachedData(key, remote, tenantId);
      return this.filterByTenant(remote as Array<T & { tenantId?: string }>, tenantId);
    }
    
    // If remote is empty but we have cached data (even if expired), prefer cache over defaults
    if (cached && cached.length > 0) {
      if (DEBUG_LOGGING) console.warn(`[DataService] Remote ${key} is empty, using cached data`);
      return this.filterByTenant(cached as Array<T & { tenantId?: string }>, tenantId);
    }
    
    // Only return defaults if we have no cached data at all
    if (DEBUG_LOGGING) console.info(`[DataService] No data for ${key}, using defaults`);
    return defaultValue;
  }

  async getProducts(tenantId?: string): Promise<Product[]> {
    const remote = await this.getCollection<Product>('products', [], tenantId);
    // Only use fallback if the collection returned an error (indicated by returning undefined or using the empty default)
    // If the API successfully returned an empty array, that's valid - it means the tenant has no products yet
    const normalized = remote.map((product, index) => ({ ...product, id: product.id ?? index + 1 }));
    return normalized;
  }

  async getOrders(tenantId?: string): Promise<Order[]> {
    const cacheKey = CacheKeys.tenantOrders(tenantId || 'default');
    const authHeaders = getAuthHeader();
    const hasAuthToken = Object.entries(authHeaders).some(([key, value]) => key.toLowerCase() === 'authorization' && Boolean(value));
    
    // Check Redis cache first
    const cachedOrders = await getCached<Order[]>(cacheKey);
    if (cachedOrders) {
      console.log(`[Redis] Orders cache hit for tenant: ${tenantId}`);
      return cachedOrders;
    }

    // Storefront guests do not have an access token, so avoid calling the protected tenant-data orders endpoint.
    if (!hasAuthToken) {
      return getCachedData<Order[]>('orders', tenantId) || [];
    }
    
    // Fetch from API and cache
    const remote = await this.getCollection<Order>('orders', [], tenantId);
    
    // Cache the result
    await setCachedByType(cacheKey, remote, 'api');
    
    return remote;
  }

  async getLandingPages(tenantId?: string): Promise<LandingPage[]> {
    return this.getCollection<LandingPage>('landing_pages', [], tenantId);
  }

  async getUsers(tenantId?: string): Promise<User[]> {
    return this.getCollection<User>('users', [], tenantId);
  }

  async getRoles(tenantId?: string): Promise<Role[]> {
    const defaultRoles: Role[] = [
      { id: 'manager', name: 'Store Manager', description: 'Can manage products and orders', permissions: [
        { resource: 'dashboard', actions: ['read'] },
        { resource: 'orders', actions: ['read', 'write', 'edit'] },
        { resource: 'products', actions: ['read', 'write', 'edit'] }
      ] },
      { id: 'support', name: 'Support Agent', description: 'Can view orders and dashboard', permissions: [
        { resource: 'dashboard', actions: ['read'] },
        { resource: 'orders', actions: ['read'] }
      ] }
    ];
    const remote = await this.getCollection<Role>('roles', [], tenantId);
    return remote.length ? remote : defaultRoles;
  }

  async get<T>(key: string, defaultValue: T, tenantId?: string, skipCache = false): Promise<T> {
    // Check cache for simple gets (skip for real-time data like chat)
    if (!skipCache) {
      const cached = getCachedData<T>(key, tenantId);
      if (cached !== null) return cached;
    }
    
    // Deduplicate concurrent requests for the same data
    return deduplicateRequest(key, tenantId, async () => {
      const remote = await this.fetchTenantDocument<T>(key, tenantId);
      if (remote === null || remote === undefined) {
        return defaultValue;
      }
      if (Array.isArray(defaultValue) && Array.isArray(remote)) {
        if (!skipCache) setCachedData(key, remote, tenantId);
        return this.filterByTenant(remote as Array<{ tenantId?: string }> as any, tenantId) as unknown as T;
      }
      if (!skipCache) setCachedData(key, remote, tenantId);
      return remote;
    });
  }

  // Get chat messages - always fresh, no cache
  async getChatMessages(tenantId?: string): Promise<ChatMessage[]> {
    return this.get<ChatMessage[]>('chat_messages', [], tenantId, true);
  }

  /**
   * Send a guest chat message via the public endpoint.
   * Does NOT include an Authorization header — guest users have no JWT.
   * Automatically attaches the persistent guest session ID.
   */
  async sendGuestMessage(
    tenantId: string,
    message: string,
    senderName?: string,
    subdomain?: string | null,
  ): Promise<{ id: string; timestamp: number }> {
    const sessionId = getGuestSessionId();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (subdomain) headers['X-Tenant-Subdomain'] = subdomain;

    const response = await fetch(buildApiUrl(`/api/guestchat/${tenantId}/chats`), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message,
        sessionId,
        ...(senderName && { senderName }),
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error((data as { error?: string }).error || `Guest chat failed (${response.status})`);
    }

    const msg = (data as { message?: { id?: string; timestamp?: number } }).message;
    return { id: msg?.id || '', timestamp: msg?.timestamp || Date.now() };
  }

  /**
   * Fetch guest chat messages for the current session.
   * No auth header — uses the persistent guest session ID.
   */
  async fetchGuestMessages(
    tenantId: string,
    subdomain?: string | null,
  ): Promise<ChatMessage[]> {
    const sessionId = getGuestSessionId();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (subdomain) headers['X-Tenant-Subdomain'] = subdomain;

    const response = await fetch(buildApiUrl(`/api/guestchat/${tenantId}/chats/${sessionId}`), {
      method: 'GET',
      headers,
    });

    const data = await response.json().catch(() => ({ messages: [] }));
    if (!response.ok) return [];

    const rawMessages = (data as { messages?: unknown[] }).messages || [];
    return rawMessages.map((m: any) => ({
      id: m.id || m._id,
      sender: m.sender,
      text: m.text,
      timestamp: m.timestamp || Date.now(),
      customerName: m.senderName,
      guestSessionId: m.sessionId || sessionId,
      authorName: m.senderName,
      isGuest: m.isGuest,
    }));
  }

  async getThemeConfig(tenantId?: string): Promise<ThemeConfig | null> {
    // Return server data AS-IS - no defaults, fully dynamic from admin settings
    const remote = await this.get<ThemeConfig | null>('theme_config', null, tenantId);
    return remote;
  }

  async getWebsiteConfig(tenantId?: string): Promise<WebsiteConfig> {
    // Use minimal defaults - all content should come from the database
    const defaultConfig = this.getDefaultWebsiteConfig();
    return this.get<WebsiteConfig>('website_config', defaultConfig, tenantId);
  }

async getPaymentMethods(tenantId?: string): Promise<PaymentMethod[]> {
    const defaults: PaymentMethod[] = [
      { id: 'cod-default', provider: 'cod', name: 'Cash On Delivery', isEnabled: true }
    ];
    const remote = await this.get<PaymentMethod[]>('payment_methods', defaults, tenantId);
    return remote.length ? remote : defaults;
  }

  async getDeliveryConfig(tenantId?: string): Promise<DeliveryConfig[]> {
    const defaults: DeliveryConfig[] = [
      { type: 'Regular', isEnabled: true, division: 'Dhaka', insideCharge: 60, outsideCharge: 120, freeThreshold: 0, note: 'Standard delivery time 2-3 days' },
      { type: 'Express', isEnabled: true, division: 'Dhaka', insideCharge: 100, outsideCharge: 200, freeThreshold: 5000, note: 'Next day delivery available' },
      { type: 'Free', isEnabled: false, division: 'Dhaka', insideCharge: 0, outsideCharge: 0, freeThreshold: 0, note: 'Promotional free shipping' }
    ];
    const remote = await this.get<DeliveryConfig[]>('delivery_config', defaults, tenantId);
    return remote.length ? remote : defaults;
  }

  async getCatalog(type: string, defaults: any[], tenantId?: string): Promise<any[]> {
    // Check cache first to avoid unnecessary API calls
    const cached = getCachedData<any[]>(type, tenantId);
    if (cached && cached.length > 0) {
      if (DEBUG_LOGGING) console.log(`[DataService] Using cached ${type}`);
      return cached;
    }
    
    const remote = await this.get<any[]>(type, [], tenantId);
    
    // If we got remote data, use it
    if (remote && remote.length > 0) {
      return remote;
    }
    
    // If remote is empty but we have cached data, prefer cache
    if (cached && cached.length > 0) {
      if (DEBUG_LOGGING) console.warn(`[DataService] Remote ${type} is empty, preserving cached data`);
      return cached;
    }
    
    // Only use defaults if we have no data at all (new tenant)
    if (DEBUG_LOGGING) console.info(`[DataService] No ${type} found, using defaults for new tenant`);
    return defaults;
  }

  // ========== COURIER CONFIG - Uses dedicated /api/courier/config endpoint ==========
  async getCourierConfig(tenantId: string): Promise<{ apiKey: string; secretKey: string; instruction: string }> {
    const defaultConfig = { apiKey: '', secretKey: '', instruction: '' };
    if (!tenantId) return defaultConfig;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/courier/config`, {
        headers: {
          'X-Tenant-Id': tenantId,
          ...getAuthHeader()
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          apiKey: data.apiKey || '',
          secretKey: data.secretKey || '',
          instruction: data.instruction || ''
        };
      }
      return defaultConfig;
    } catch (error) {
      console.warn('[DataService] Failed to load courier config:', error);
      return defaultConfig;
    }
  }

  async saveCourierConfig(tenantId: string, config: { apiKey: string; secretKey: string; instruction?: string }): Promise<void> {
    if (!tenantId) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/courier/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': tenantId,
          ...getAuthHeader()
        },
        body: JSON.stringify({
          apiKey: config.apiKey?.trim() || '',
          secretKey: config.secretKey?.trim() || '',
          instruction: config.instruction?.trim() || ''
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save courier config');
      }
      console.log('[DataService] Courier config saved to database');
    } catch (error) {
      console.error('[DataService] Failed to save courier config:', error);
      throw error;
    }
  }

  async saveFacebookPixelConfig(tenantId: string, config: { pixelId: string; accessToken: string; enableTestEvent: boolean; isEnabled: boolean }): Promise<void> {
    if (!tenantId) return;
    try {
      await this.requestTenantApi('/api/facebook-pixel/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': tenantId,
        },
        body: JSON.stringify({
          pixelId: config.pixelId?.trim() || '',
          accessToken: config.accessToken?.trim() || '',
          enableTestEvent: !!config.enableTestEvent,
          isEnabled: !!config.isEnabled,
        })
      });
      console.log('[DataService] Facebook Pixel config saved to database');
    } catch (error) {
      console.error('[DataService] Failed to save Facebook Pixel config:', error);
      throw error;
    }
  }

  async getFacebookPixelConfig(tenantId: string): Promise<{ pixelId: string; accessToken: string; enableTestEvent: boolean; isEnabled: boolean }> {
    const defaultConfig = { pixelId: '', accessToken: '', enableTestEvent: false, isEnabled: false };
    if (!tenantId) return defaultConfig;
    try {
      const result = await this.requestTenantApi<{ data: { pixelId: string; accessToken: string; enableTestEvent: boolean; isEnabled: boolean } }>('/api/facebook-pixel/config', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      return result?.data || defaultConfig;
    } catch (error) {
      console.error('[DataService] Failed to get Facebook Pixel config:', error);
      return defaultConfig;
    }
  }

  async save<T>(key: string, data: T, tenantId?: string, options?: { forceEmpty?: boolean }): Promise<void> {
    if (DISABLE_REMOTE_SAVE) {
      if (!this.hasLoggedSaveBlock && SHOULD_LOG_SAVE_SKIP) {
        console.info('[DataService] Remote saves are disabled via VITE_DISABLE_REMOTE_SAVE flag.');
        this.hasLoggedSaveBlock = true;
      }
      return;
    }

    // Safety check: Prevent saving empty products array to avoid data loss
    // Skip this check if forceEmpty is true (intentional bulk delete)
    // if (key === 'products' && Array.isArray(data) && data.length === 0 && !options?.forceEmpty) {
    //   const cached = getCachedData<T[]>('products', tenantId);
    //   if (cached && cached.length > 0) {
    //     console.warn('[DataService] Blocked enqueueing empty products save - cache has data. This prevents accidental data loss.');
    //     return;
    //   }
    // }

    if (SAVE_DEBOUNCE_MS <= 0) {
      await this.commitSave(key, data, tenantId, options);
      return;
    }

    await this.enqueueSave(key, data, tenantId, options);
  }

  /**
   * Save immediately without debounce - use for critical updates like theme changes
   * that need to reflect instantly on the storefront
   */
  async saveImmediate<T>(key: string, data: T, tenantId?: string, options?: { forceEmpty?: boolean }): Promise<void> {
    if (DISABLE_REMOTE_SAVE) {
      return;
    }

    // Safety check disabled - was blocking legitimate saves
    // if (key === 'products' && Array.isArray(data) && data.length === 0 && !options?.forceEmpty) {
    //   const cached = getCachedData<T[]>('products', tenantId);
    //   if (cached && cached.length > 0) {
    //     console.warn('[DataService] Blocked saving empty products array - cache has data. This prevents accidental data loss.');
    //     return;
    //   }
    // }
    
    // Cancel any pending debounced save for this key
    const queueKey = this.getSaveQueueKey(key, tenantId);
    const existing = this.saveQueue.get(queueKey);
    if (existing) {
      clearTimeout(existing.timer);
      this.saveQueue.delete(queueKey);
      // Resolve pending promises since we're saving now
      existing.resolvers.forEach(({ resolve }) => resolve());
    }
    
    await this.commitSave(key, data, tenantId, options);
  }

  private async commitSave<T>(key: string, data: T, tenantId?: string, options?: { forceEmpty?: boolean }): Promise<void> {
    const scope = this.resolveTenantScope(tenantId);
    
    // Safety check disabled - was blocking legitimate saves
    // if (key === 'products' && Array.isArray(data) && data.length === 0 && !options?.forceEmpty) {
    //   const cached = getCachedData<T[]>('products', tenantId);
    //   if (cached && cached.length > 0) {
    //     console.warn(`[DataService] Blocked saving empty products array for tenant ${scope} - cache has ${cached.length} products`);
    //     return;
    //   }
    // }
    
    // Safety check: Prevent saving website_config with empty carouselItems when we have cached carousels
    // This prevents stale cache from wiping out carousel data
    if (key === 'website_config' && typeof data === 'object' && data !== null) {
      const wsData = data as unknown as { 
        carouselItems?: unknown[]; 
        socialLinks?: unknown[];
        addresses?: unknown[];
        emails?: unknown[];
        phones?: unknown[];
      };
      const cachedWs = getCachedData<{ 
        carouselItems?: unknown[]; 
        socialLinks?: unknown[];
        addresses?: unknown[];
        emails?: unknown[];
        phones?: unknown[];
      }>('website_config', tenantId);
      
      // Preserve carousel items
      if ((!wsData.carouselItems || wsData.carouselItems.length === 0) && 
          cachedWs?.carouselItems && cachedWs.carouselItems.length > 0) {
        console.warn(`[DataService] Preserving ${cachedWs.carouselItems.length} cached carousels`);
        (data as any).carouselItems = cachedWs.carouselItems;
      }
      
      // Preserve social links
      if ((!wsData.socialLinks || wsData.socialLinks.length === 0) && 
          cachedWs?.socialLinks && cachedWs.socialLinks.length > 0) {
        console.warn(`[DataService] Preserving ${cachedWs.socialLinks.length} cached social links`);
        (data as any).socialLinks = cachedWs.socialLinks;
      }
      
      // Preserve addresses
      if ((!wsData.addresses || wsData.addresses.length === 0) && 
          cachedWs?.addresses && cachedWs.addresses.length > 0) {
        console.warn(`[DataService] Preserving ${cachedWs.addresses.length} cached addresses`);
        (data as any).addresses = cachedWs.addresses;
      }
      
      // Preserve emails
      if ((!wsData.emails || wsData.emails.length === 0) && 
          cachedWs?.emails && cachedWs.emails.length > 0) {
        console.warn(`[DataService] Preserving ${cachedWs.emails.length} cached emails`);
        (data as any).emails = cachedWs.emails;
      }
      
      // Preserve phones
      if ((!wsData.phones || wsData.phones.length === 0) && 
          cachedWs?.phones && cachedWs.phones.length > 0) {
        console.warn(`[DataService] Preserving ${cachedWs.phones.length} cached phones`);
        (data as any).phones = cachedWs.phones;
      }
    }
    
    // Don't log full data objects - they may contain large base64 images
    console.log(`[DataService] Saving ${key} for tenant ${scope}`, Array.isArray(data) ? `(${data.length} items)` : '(object)');
    try {
      await this.persistTenantDocument(key, data, tenantId);
      // Update cache with new data
      setCachedData(key, data, tenantId);
      
      // Invalidate bootstrap cache for keys that are part of bootstrap bundle
      // This ensures on page reload we get fresh data instead of stale cached bootstrap
      if (['website_config', 'theme_config', 'products'].includes(key)) {
        await deleteCached(CacheKeys.tenantBootstrap(scope));
        console.log(`[DataService] Invalidated bootstrap cache for ${scope} after ${key} save`);
      }
      
      // NOTE: Don't call notifyDataRefresh here - the server will emit a socket event
      // that triggers the refresh. Calling it here causes infinite save loops.
      console.log(`[DataService] Saved ${key}`);
    } catch (error: any) {
      const status = error?.status;
      const code = error?.code || '';
      
      // Show user feedback for save failures
      if (typeof window !== 'undefined') {
        if (status === 402 || code === 'SUBSCRIPTION_BLOCKED') {
          import('react-hot-toast').then(({ toast }) => toast.error('Subscription expired. Changes not saved.')).catch(() => {});
        } else if (status === 401 || code === 'TOKEN_EXPIRED') {
          import('react-hot-toast').then(({ toast }) => toast.error('Session expired. Changes not saved. Please log in again.')).catch(() => {});
        } else if (status === 403 || code === 'PERMISSION_DENIED') {
          import('react-hot-toast').then(({ toast }) => toast.error('Permission denied. You cannot save this data.')).catch(() => {});
        } else if (status === 503) {
          import('react-hot-toast').then(({ toast }) => toast.error('Server temporarily unavailable. Changes not saved.')).catch(() => {});
        } else {
          import('react-hot-toast').then(({ toast }) => toast.error(`Failed to save ${key}. Please try again.`)).catch(() => {});
        }
      }
      
      console.error(`Failed to persist ${key}:`, error);
    }
  }


  /**
   * Clear all server-side (Redis) cache for a tenant.
   * Call after saving customization to ensure store picks up changes immediately.
   */
  async clearServerCache(tenantId: string): Promise<void> {
    try {
      const scope = this.resolveTenantScope(tenantId);
      await this.requestTenantApi(`/api/tenant-data/${scope}/clear-cache`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      console.log(`[DataService] Server cache cleared for tenant ${scope}`);
    } catch (error) {
      console.warn('[DataService] Failed to clear server cache:', error);
    }
  }
  async listTenants(forceRefresh = false): Promise<Tenant[]> {
    // Check cache first for instant load (skip if force refresh)
    if (!forceRefresh) {
      const cached = getCachedData<Tenant[]>('tenants', 'global');
      if (cached && cached.length) {
        console.log('[DataService] Using cached tenant list');
        return cached;
      }
    }
    
    try {
      const response = await this.requestTenantApi<TenantApiListResponse>('/api/tenants');
      const tenants = Array.isArray(response?.data)
        ? response.data.map(doc => this.normalizeTenantDocument(doc))
        : [];
      // Always cache the result (even empty) and return it
      const sorted = tenants.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setCachedData('tenants', sorted, 'global');
      return sorted;
    } catch (error) {
      console.warn('Unable to load tenants from backend API', error);
    }

    return this.fetchMockTenants();
  }

  // Fast subdomain resolution - single API call instead of loading all tenants
  async resolveTenantBySubdomain(subdomain: string): Promise<{ id: string; name: string; subdomain: string } | null> {
    if (!subdomain) return null;
    
    // Check cache first for instant resolution
    const cached = getCachedData<{ id: string; name: string; subdomain: string }>(`tenant_resolve_${subdomain}`, 'global');
    if (cached) {
      console.log('[DataService] Using cached tenant resolution for:', subdomain);
      return cached;
    }
    
    try {
      const response = await this.requestTenantApi<{ data: { id?: unknown; _id?: unknown; name: string; subdomain: string; status: string } }>(
        `/api/tenants/resolve/${encodeURIComponent(subdomain)}`
      );
      const raw = response?.data as any;
      const rawId = raw?.id ?? raw?._id;
      const id = rawId != null ? String(rawId) : '';
      if (id) {
        const normalized = { id, name: String(raw?.name ?? ''), subdomain: String(raw?.subdomain ?? subdomain) };
        // Cache the resolved tenant for future loads
        setCachedData(`tenant_resolve_${subdomain}`, normalized, 'global');
        return normalized;
      }
    } catch (error) {
      console.warn('[DataService] Failed to resolve tenant by subdomain:', subdomain, error);
    }
    return null;
  }

  async seedTenant(payload: CreateTenantPayload): Promise<Tenant> {
    if (!payload?.name || !payload?.subdomain || !payload?.contactEmail) {
      throw new Error('name, subdomain and contactEmail are required');
    }
    if (!payload?.adminEmail || !payload?.adminPassword) {
      throw new Error('adminEmail and adminPassword are required');
    }

    const normalizedSubdomain = this.sanitizeTenantSlug(payload.subdomain);
    if (!normalizedSubdomain) {
      throw new Error('Subdomain must contain letters, numbers, or dashes.');
    }
    if (RESERVED_TENANT_SLUGS.includes(normalizedSubdomain)) {
      throw new Error('This subdomain is reserved. Choose another.');
    }

    const existingTenants = await this.listTenants();
    const slugConflict = existingTenants.some(
      tenant => this.sanitizeTenantSlug(tenant.subdomain) === normalizedSubdomain
    );
    if (slugConflict) {
      throw new Error('Subdomain already in use. Pick a different slug.');
    }
    const adminEmail = payload.adminEmail.trim().toLowerCase();
    const adminPassword = payload.adminPassword.trim();
    if (!/\S+@\S+\.\S+/.test(adminEmail)) {
      throw new Error('Provide a valid admin email');
    }
    if (adminPassword.length < 6) {
      throw new Error('Admin password must be at least 6 characters');
    }
    const now = new Date().toISOString();
    const baseTenant = this.omitUndefined<Omit<Tenant, 'id'>>({
      name: payload.name.trim(),
      subdomain: normalizedSubdomain,
      customDomain: undefined,
      contactEmail: payload.contactEmail.trim(),
      contactName: payload.contactName?.trim() || undefined,
      adminEmail,
      adminPassword,
      plan: payload.plan || 'starter',
      status: 'trialing',
      createdAt: now,
      updatedAt: now,
      onboardingCompleted: false,
      locale: 'en-US',
      currency: 'USD',
      branding: {},
      settings: {}
    });

    const apiPayload = {
      name: baseTenant.name,
      subdomain: normalizedSubdomain,
      contactEmail: baseTenant.contactEmail,
      contactName: baseTenant.contactName,
      adminEmail,
      adminPassword,
      plan: baseTenant.plan
    } satisfies CreateTenantPayload;

    const apiResponse = await this.requestTenantApi<TenantApiItemResponse>('/api/tenants', {
      method: 'POST',
      body: JSON.stringify(apiPayload)
    });
    if (apiResponse?.data) {
      return this.normalizeTenantDocument(apiResponse.data);
    }

    throw new Error('Unable to create tenant. Backend API is unavailable.');
  }

  async deleteTenant(tenantId: string): Promise<void> {
    if (!tenantId) {
      throw new Error('tenantId is required');
    }

    await this.requestTenantApi(`/api/tenants/${tenantId}`, {
      method: 'DELETE'
    });
  }

  // Review methods
  async getReviewSummaries(tenantId: string): Promise<Record<number, { reviewCount: number; avgRating: number }>> {
    const response = await this.requestTenantApi<{ summaries?: Record<number, { reviewCount: number; avgRating: number }> }>(`/api/reviews/summary/${tenantId}`);
    return response.summaries || {};
  }

  async getProductReviews(productId: number, tenantId: string) {
    const response = await this.requestTenantApi<{ reviews?: unknown[] }>(`/api/reviews/product/${productId}`, {
      headers: {
        'x-tenant-id': tenantId
      }
    });
    return response.reviews || [];
  }

  async submitReview(data: {
    productId: number;
    rating: number;
    comment: string;
    headline?: string;
  }, tenantId: string) {
    const token = this.getToken();
    if (!token) {
      throw new Error('Authentication required. Please login to submit a review.');
    }

    const response = await this.requestTenantApi<{ review?: unknown }>('/api/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-tenant-id': tenantId
      },
      body: JSON.stringify({ ...data, tenantId })
    });
    
    return response.review;
  }
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      // Check for both admin and customer/store tokens
      return (
        localStorage.getItem('admin_auth_token') || 
        sessionStorage.getItem('admin_auth_token') ||
        localStorage.getItem('customer_auth_token') ||
        sessionStorage.getItem('customer_auth_token') ||
        localStorage.getItem('store_auth_token') ||
        sessionStorage.getItem('store_auth_token') ||
        localStorage.getItem('user_auth_token') ||
        sessionStorage.getItem('user_auth_token') ||
        null
      );
    } catch {
      return null;
    }
  }

  async getMyReviews(tenantId?: string) {
    const token = this.getToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const url = tenantId 
      ? `/api/reviews/user/my-reviews?tenantId=${tenantId}`
      : '/api/reviews/user/my-reviews';

    const response = await this.requestTenantApi<{ reviews?: unknown[] }>(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.reviews || [];
  }

  async updateReview(reviewId: string, data: {
    rating?: number;
    comment?: string;
    headline?: string;
  }) {
    const token = this.getToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await this.requestTenantApi<{ review?: unknown }>(`/api/reviews/${reviewId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    return response.review;
  }

  async deleteReview(reviewId: string) {
    const token = this.getToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    await this.requestTenantApi(`/api/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  async markReviewHelpful(reviewId: string) {
    await this.requestTenantApi(`/api/reviews/${reviewId}/helpful`, {
      method: 'PATCH'
    });
  }

  // Admin: Get all reviews for a tenant
  async getAllReviewsForTenant(tenantId: string, params?: { status?: string; page?: number; limit?: number }) {
    const token = this.getToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const url = `/api/reviews/${tenantId}/all${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await this.requestTenantApi<{ 
      reviews?: unknown[]; 
      pagination?: { page: number; limit: number; total: number; pages: number };
    }>(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return {
      reviews: response.reviews || [],
      pagination: response.pagination
    };
  }

  // Admin: Update review status
  async updateReviewStatus(tenantId: string, reviewId: string, status: 'pending' | 'approved' | 'rejected') {
    const token = this.getToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await this.requestTenantApi<{ review?: unknown }>(`/api/reviews/${tenantId}/${reviewId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });

    return response.review;
  }

  // Admin: Add reply to review
  async replyToReview(tenantId: string, reviewId: string, reply: string) {
    const token = this.getToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await this.requestTenantApi<{ review?: unknown }>(`/api/reviews/${tenantId}/${reviewId}/reply`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reply })
    });

    return response.review;
  }

  // ─── Marketplace (cross-tenant aggregation) ─────────────────────────────────

  async getMarketplaceProducts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    brand?: string;
    store?: string;
    sort?: string;
  }): Promise<{
    products: Product[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.search) qs.set('search', params.search);
    if (params?.category) qs.set('category', params.category);
    if (params?.brand) qs.set('brand', params.brand);
    if (params?.store) qs.set('store', params.store);
    if (params?.sort) qs.set('sort', params.sort);

    const qsStr = qs.toString();
    const url = `/api/marketplace/products${qsStr ? `?${qsStr}` : ''}`;
    const res = await this.requestTenantApi<{ data: { products: Product[]; total: number; page: number; totalPages: number } }>(url);
    return res.data || { products: [], total: 0, page: 1, totalPages: 0 };
  }

  async getMarketplaceStores(): Promise<
    Array<{ id: string; name: string; slug: string; logo: string | null; primaryColor: string | null; productCount: number }>
  > {
    const res = await this.requestTenantApi<{ data: Array<{ id: string; name: string; slug: string; logo: string | null; primaryColor: string | null; productCount: number }> }>(
      '/api/marketplace/stores',
    );
    return res.data || [];
  }

  async getMarketplaceCategories(): Promise<
    Array<{ name: string; slug: string; image?: string; count: number }>
  > {
    const res = await this.requestTenantApi<{ data: Array<{ name: string; slug: string; image?: string; count: number }> }>(
      '/api/marketplace/categories',
    );
    return res.data || [];
  }
}

export const DataService = new DataServiceImpl();

export interface OfferPageBenefit {
  id: string;
  text: string;
}

export interface OfferPageData {
  productId?: number;
  productTitle: string;
  searchQuery?: string;
  imageUrl: string;
  offerEndDate: string;
  description: string;
  productOfferInfo?: string;
  paymentSectionTitle?: string;
  benefits?: OfferPageBenefit[];
  whyBuySection?: string;
  urlSlug: string;
  status: 'draft' | 'published';
  // Dynamic sections
  faqHeadline?: string;
  faqs?: { id: string; question: string; answer: string }[];
  reviewHeadline?: string;
  reviews?: { id: string; name: string; quote: string; rating: number; image?: string }[];
  videoLink?: string;
  productImages?: string[];
  backgroundColor?: string;
  textColor?: string;
  price?: number;
  originalPrice?: number;
}

export interface OfferPageResponse extends OfferPageData {
  _id: string;
  tenantId: string;
  views: number;
  orders: number;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}

export interface OfferPagesListResponse {
  data: OfferPageResponse[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

// Get all offer pages for tenant
export const getOfferPages = async (
  tenantId: string,
  status?: 'draft' | 'published',
  page = 1,
  limit = 20
): Promise<OfferPagesListResponse> => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  
  const response = await fetch(`${API_BASE_URL}/api/landing-page?${params}`, {
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'application/json',
      'x-tenant-id': tenantId
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch offer pages: ${response.statusText}`);
  }
  
  return response.json();
};

// Get single offer page by ID
export const getOfferPage = async (id: string, tenantId: string): Promise<OfferPageResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/landing-page/${id}`, {
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'application/json',
      'x-tenant-id': tenantId
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch offer page: ${response.statusText}`);
  }
  
  return response.json();
};

// Get offer page by slug (for public route)
export const getOfferPageBySlug = async (
  slug: string, 
  tenantId: string,
  incrementViews = true
): Promise<OfferPageResponse> => {
  const params = new URLSearchParams();
  params.append('tenantId', tenantId);
  if (incrementViews) params.append('incrementViews', 'true');
  
  const response = await fetch(`${API_BASE_URL}/api/landing-page/slug/${slug}?${params}`, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch offer page: ${response.statusText}`);
  }
  
  return response.json();
};

// Create new offer page
export const createOfferPage = async (tenantId: string, data: OfferPageData): Promise<OfferPageResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/landing-page`, {
    method: 'POST',
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'application/json',
      'x-tenant-id': tenantId
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('[createOfferPage] Validation error details:', errorData);
    throw new Error(errorData.error || `Failed to create offer page: ${response.statusText}`);
  }
  
  return response.json();
};

// Update existing offer page
export const updateOfferPage = async (
  tenantId: string,
  id: string, 
  data: Partial<OfferPageData>
): Promise<OfferPageResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/landing-page/${id}`, {
    method: 'PUT',
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'application/json',
      'x-tenant-id': tenantId
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to update offer page: ${response.statusText}`);
  }
  
  return response.json();
};

// Delete offer page
export const deleteOfferPage = async (tenantId: string, id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/landing-page/${id}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'application/json',
      'x-tenant-id': tenantId
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to delete offer page: ${response.statusText}`);
  }
};

// Increment order count for offer page
export const incrementOfferPageOrders = async (id: string): Promise<void> => {
  await fetch(`${API_BASE_URL}/api/landing-page/${id}/increment-orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });
};
