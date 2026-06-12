import api from '@/lib/api';

// ─── Interfaces ───────────────────────────────────────────────

export interface HardwareMapping {
  id: string;
  registerId: string;
  registerName: string;
  branchId: string;
  printerName?: string;
  printerIp?: string;
  receiptTemplate?: string;
  isActive: boolean;
  createdAt: string;
}

export interface TaxRule {
  id?: string;
  name: string;
  rate: number;
  type: 'inclusive' | 'exclusive';
  appliesTo: 'all' | 'category' | 'product';
  categoryId?: string;
  productId?: string | number;
  region?: string;
  isActive: boolean;
}

export interface BOPISOrder {
  orderId: string;
  customerName: string;
  customerPhone?: string;
  items: Array<{ productId: string | number; productName: string; quantity: number }>;
  status: 'pending_pickup' | 'ready_for_pickup' | 'picked_up' | 'cancelled';
  onlineOrderDate: string;
  readyAt?: string;
  pickedUpAt?: string;
  assignedStaff?: string;
  branchId: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnRequest {
  id: string;
  originalOrderId: string;
  customerName: string;
  customerPhone?: string;
  items: Array<{
    productId: string | number;
    productName: string;
    quantity: number;
    returnReason: string;
  }>;
  refundAmount: number;
  refundMethod: 'original_gateway' | 'cash' | 'store_credit';
  status: 'pending' | 'approved' | 'processed' | 'rejected';
  source: 'online' | 'pos';
  returnedToWarehouseId?: string;
  processedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Hardware Mapping APIs ────────────────────────────────────

export async function fetchHardwareMappings(tenantId: string): Promise<HardwareMapping[]> {
  const res = await api.get('/pos/hardware', { headers: { 'X-Tenant-Id': tenantId } });
  return res.data?.data || [];
}

export async function createHardwareMapping(tenantId: string, data: Omit<HardwareMapping, 'id' | 'createdAt'>): Promise<HardwareMapping> {
  const res = await api.post('/pos/hardware', data, { headers: { 'X-Tenant-Id': tenantId } });
  return res.data?.data;
}

export async function updateHardwareMapping(tenantId: string, id: string, data: Partial<HardwareMapping>): Promise<HardwareMapping> {
  const res = await api.put(`/pos/hardware/${id}`, data, { headers: { 'X-Tenant-Id': tenantId } });
  return res.data?.data;
}

export async function deleteHardwareMapping(tenantId: string, id: string): Promise<void> {
  await api.delete(`/pos/hardware/${id}`, { headers: { 'X-Tenant-Id': tenantId } });
}

// ─── Tax Rules APIs ───────────────────────────────────────────

export async function fetchTaxRules(tenantId: string): Promise<TaxRule[]> {
  const res = await api.get('/pos/tax-rules', { headers: { 'X-Tenant-Id': tenantId } });
  return res.data?.data || [];
}

export async function saveTaxRules(tenantId: string, rules: TaxRule[]): Promise<void> {
  await api.put('/pos/tax-rules', { rules }, { headers: { 'X-Tenant-Id': tenantId } });
}

// ─── BOPIS APIs ───────────────────────────────────────────────

export async function fetchBOPISOrders(tenantId: string, params?: Record<string, string>): Promise<BOPISOrder[]> {
  const res = await api.get('/pos/bopis', { params, headers: { 'X-Tenant-Id': tenantId } });
  return res.data?.data || [];
}

export async function createBOPISOrder(tenantId: string, data: Omit<BOPISOrder, 'status' | 'onlineOrderDate' | 'createdAt' | 'updatedAt'>): Promise<BOPISOrder> {
  const res = await api.post('/pos/bopis', data, { headers: { 'X-Tenant-Id': tenantId } });
  return res.data?.data;
}

export async function updateBOPISStatus(tenantId: string, orderId: string, updates: { status: string; assignedStaff?: string; notes?: string }): Promise<BOPISOrder> {
  const res = await api.patch(`/pos/bopis/${orderId}`, updates, { headers: { 'X-Tenant-Id': tenantId } });
  return res.data?.data;
}

// ─── Returns APIs ─────────────────────────────────────────────

export async function fetchReturns(tenantId: string, params?: Record<string, string>): Promise<ReturnRequest[]> {
  const res = await api.get('/pos/returns', { params, headers: { 'X-Tenant-Id': tenantId } });
  return res.data?.data || [];
}

export async function createReturn(tenantId: string, data: Omit<ReturnRequest, 'id' | 'status' | 'processedBy' | 'createdAt' | 'updatedAt'>): Promise<ReturnRequest> {
  const res = await api.post('/pos/returns', data, { headers: { 'X-Tenant-Id': tenantId } });
  return res.data?.data;
}

export async function processReturn(tenantId: string, id: string, updates: { status: string; returnedToWarehouseId?: string }): Promise<ReturnRequest> {
  const res = await api.patch(`/pos/returns/${id}`, updates, { headers: { 'X-Tenant-Id': tenantId } });
  return res.data?.data;
}

// ─── Offline Sync API ─────────────────────────────────────────

export async function syncOfflineTransactions(
  tenantId: string,
  transactions: Array<{ id: string; type: string; payload: Record<string, unknown>; createdAt: string }>
): Promise<Array<{ id: string; status: 'synced' | 'failed'; error?: string }>> {
  const res = await api.post('/pos/offline-sync', { transactions }, { headers: { 'X-Tenant-Id': tenantId } });
  return res.data?.data || [];
}
