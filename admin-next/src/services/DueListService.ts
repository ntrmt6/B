import { DueEntity, DueTransaction, CreateDueTransactionPayload, CreateEntityPayload } from '../types';
import { getAuthHeader } from './authService';

// Get API base URL - use same origin in production
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return window.location.origin;
    }
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001';
};

// Get tenant ID from localStorage
const getTenantId = (): string => {
  if (typeof window !== 'undefined') {
    // Try multiple possible localStorage keys
    return localStorage.getItem('activeTenantId') 
        || localStorage.getItem('tenantId') 
        || localStorage.getItem('tenant_id')
        || '';
  }
  return '';
};

class DueListService {
  private tenantIdOverride: string | null = null;

  // Allow setting tenant ID explicitly
  setTenantId(tenantId: string) {
    this.tenantIdOverride = tenantId;
    // Also save to localStorage for future use
    if (typeof window !== 'undefined' && tenantId) {
      localStorage.setItem('activeTenantId', tenantId);
    }
  }

  private getEffectiveTenantId(): string {
    return this.tenantIdOverride || getTenantId();
  }

  private getHeaders(): HeadersInit {
    const tenantId = this.getEffectiveTenantId();
    return {
      'Content-Type': 'application/json',
      'X-Tenant-Id': tenantId,
      'Cache-Control': 'no-cache, no-store',
      ...getAuthHeader()
    };
  }

  // ============ ENTITY ENDPOINTS ============

  /**
   * Get all entities with optional type and search filters
   */
  async getEntities(type?: string, search?: string): Promise<DueEntity[]> {
    try {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (search) params.append('search', search);

      const response = await fetch(
        `${getApiBaseUrl()}/api/entities${params.toString() ? `?${params}` : ''}`,
        { headers: this.getHeaders(), cache: 'no-store' }
      );
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to fetch entities');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching entities:', error);
      throw error;
    }
  }

  /**
   * Get a single entity by ID
   */
  async getEntity(id: string): Promise<DueEntity> {
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/entities/${id}`,
        { headers: this.getHeaders() }
      );
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to fetch entity');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching entity:', error);
      throw error;
    }
  }

  /**
   * Create a new entity (Customer, Supplier, or Employee)
   */
  async createEntity(payload: CreateEntityPayload): Promise<DueEntity> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/entities`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to create entity');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating entity:', error);
      throw error;
    }
  }

  /**
   * Update an existing entity
   */
  async updateEntity(id: string, payload: Partial<CreateEntityPayload>): Promise<DueEntity> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/entities/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to update entity');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating entity:', error);
      throw error;
    }
  }

  /**
   * Delete an entity
   */
  async deleteEntity(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/entities/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to delete entity');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting entity:', error);
      throw error;
    }
  }

  // ============ TRANSACTION ENDPOINTS ============

  /**
   * Get transactions with optional filters
   */
  async getTransactions(
    entityId?: string,
    from?: string,
    to?: string,
    status?: string
  ): Promise<DueTransaction[]> {
    try {
      const params = new URLSearchParams();
      if (entityId) params.append('entityId', entityId);
      if (from) params.append('from', from);
      if (to) params.append('to', to);
      if (status) params.append('status', status);

      const response = await fetch(
        `${getApiBaseUrl()}/api/transactions${params.toString() ? `?${params}` : ''}`,
        { headers: this.getHeaders(), cache: 'no-store' }
      );
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to fetch transactions');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  /**
   * Get a single transaction by ID
   */
  async getTransaction(id: string): Promise<DueTransaction> {
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/transactions/${id}`,
        { headers: this.getHeaders() }
      );
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to fetch transaction');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw error;
    }
  }

  /**
   * Create a new transaction
   */
  async createTransaction(payload: CreateDueTransactionPayload): Promise<DueTransaction> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/transactions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to create transaction');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  /**
   * Update transaction status (Pending, Paid, Cancelled)
   */
  async updateTransactionStatus(id: string, status: string): Promise<DueTransaction> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/transactions/${id}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to update transaction');
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }

  /**
   * Delete a transaction
   */
  async deleteTransaction(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/transactions/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to delete transaction');
      }
      return await response.json();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }
}

export const dueListService = new DueListService();
