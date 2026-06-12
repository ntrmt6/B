// VendorService - Multi-Vendor Marketplace API operations
import type { Vendor, VendorSubOrder, CommissionResult } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001';

function getHeaders(tenantId: string): Record<string, string> {
  const token = localStorage.getItem('admin_auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Tenant-Id': tenantId,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const VendorService = {
  /** List all vendors for a tenant */
  async getVendors(tenantId: string, status?: string): Promise<Vendor[]> {
    const url = new URL(`${API_BASE_URL}/api/vendors/${tenantId}`);
    if (status) url.searchParams.set('status', status);
    const res = await fetch(url.toString(), { headers: getHeaders(tenantId) });
    if (!res.ok) throw new Error('Failed to fetch vendors');
    const json = await res.json();
    return json.data || [];
  },

  /** Get a single vendor */
  async getVendor(tenantId: string, vendorId: string): Promise<Vendor> {
    const res = await fetch(`${API_BASE_URL}/api/vendors/${tenantId}/${vendorId}`, {
      headers: getHeaders(tenantId),
    });
    if (!res.ok) throw new Error('Failed to fetch vendor');
    const json = await res.json();
    return json.data;
  },

  /** Create a new vendor */
  async createVendor(tenantId: string, data: Partial<Vendor>): Promise<Vendor> {
    const res = await fetch(`${API_BASE_URL}/api/vendors/${tenantId}`, {
      method: 'POST',
      headers: getHeaders(tenantId),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create vendor');
    }
    const json = await res.json();
    return json.data;
  },

  /** Update a vendor */
  async updateVendor(tenantId: string, vendorId: string, data: Partial<Vendor>): Promise<Vendor> {
    const res = await fetch(`${API_BASE_URL}/api/vendors/${tenantId}/${vendorId}`, {
      method: 'PUT',
      headers: getHeaders(tenantId),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update vendor');
    }
    const json = await res.json();
    return json.data;
  },

  /** Delete a vendor */
  async deleteVendor(tenantId: string, vendorId: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/vendors/${tenantId}/${vendorId}`, {
      method: 'DELETE',
      headers: getHeaders(tenantId),
    });
    if (!res.ok) throw new Error('Failed to delete vendor');
  },

  /** Get sub-orders for a specific vendor */
  async getVendorSubOrders(tenantId: string, vendorId: string): Promise<VendorSubOrder[]> {
    const res = await fetch(`${API_BASE_URL}/api/vendors/${tenantId}/${vendorId}/sub-orders`, {
      headers: getHeaders(tenantId),
    });
    if (!res.ok) throw new Error('Failed to fetch sub-orders');
    const json = await res.json();
    return json.data || [];
  },

  /** Preview commission breakdown for an order */
  async calculateCommission(
    tenantId: string,
    items: Array<{ vendorId?: string; price: number; quantity: number }>
  ): Promise<CommissionResult[]> {
    const res = await fetch(`${API_BASE_URL}/api/vendors/${tenantId}/calculate-commission`, {
      method: 'POST',
      headers: getHeaders(tenantId),
      body: JSON.stringify({ items }),
    });
    if (!res.ok) throw new Error('Failed to calculate commission');
    const json = await res.json();
    return json.data || [];
  },

  /** Trigger order splitting into vendor sub-orders */
  async splitOrder(
    tenantId: string,
    masterOrder: {
      masterOrderId: string;
      customer: string;
      phone?: string;
      email?: string;
      location?: string;
      items: any[];
      date: string;
      status?: string;
    }
  ): Promise<VendorSubOrder[]> {
    const res = await fetch(`${API_BASE_URL}/api/vendors/${tenantId}/split-order`, {
      method: 'POST',
      headers: getHeaders(tenantId),
      body: JSON.stringify(masterOrder),
    });
    if (!res.ok) throw new Error('Failed to split order');
    const json = await res.json();
    return json.data || [];
  },
};
