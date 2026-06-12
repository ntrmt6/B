import api from '@/lib/api';

// ─── Interfaces ───────────────────────────────────────────────

export interface WarehouseNode {
  id: string;
  name: string;
  branchId: string;
  address?: string;
  isDefault: boolean;
}

export interface BufferStockRule {
  productId: string | number;
  threshold: number;
  warehouseId?: string;
}

export interface StockEntry {
  productId: string | number;
  warehouseId: string;
  quantity: number;
  reservedQuantity: number;
  updatedAt: string;
  warehouseName?: string;
  bufferThreshold?: number;
  availableOnline?: boolean;
}

export interface StockMovement {
  id: string;
  productId: string | number;
  warehouseId: string;
  type: 'sale' | 'purchase' | 'adjustment' | 'transfer' | 'return';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  orderId?: string;
  referenceId?: string;
  note?: string;
  createdAt: string;
  createdBy?: string;
}

// ─── Warehouse APIs ───────────────────────────────────────────

export async function fetchWarehouses(tenantId: string): Promise<WarehouseNode[]> {
  const res = await api.get('/inventory/warehouses', { headers: { 'X-Tenant-Id': tenantId } });
  return res.data?.data || [];
}

export async function createWarehouse(tenantId: string, data: Omit<WarehouseNode, 'id'>): Promise<WarehouseNode> {
  const res = await api.post('/inventory/warehouses', data, { headers: { 'X-Tenant-Id': tenantId } });
  return res.data?.data;
}

export async function deleteWarehouse(tenantId: string, id: string): Promise<void> {
  await api.delete(`/inventory/warehouses/${id}`, { headers: { 'X-Tenant-Id': tenantId } });
}

// ─── Buffer Stock APIs ────────────────────────────────────────

export async function fetchBufferRules(tenantId: string): Promise<BufferStockRule[]> {
  const res = await api.get('/inventory/buffer-rules', { headers: { 'X-Tenant-Id': tenantId } });
  return res.data?.data || [];
}

export async function saveBufferRules(tenantId: string, rules: BufferStockRule[]): Promise<void> {
  await api.put('/inventory/buffer-rules', { rules }, { headers: { 'X-Tenant-Id': tenantId } });
}

// ─── Stock APIs ───────────────────────────────────────────────

export async function fetchStockEntries(tenantId: string): Promise<StockEntry[]> {
  const res = await api.get('/inventory/stock', { headers: { 'X-Tenant-Id': tenantId } });
  return res.data?.data || [];
}

export async function adjustStock(
  tenantId: string,
  data: { productId: string | number; warehouseId: string; quantity: number; type: string; note?: string }
): Promise<{ entry: StockEntry; movement: StockMovement }> {
  const res = await api.post('/inventory/stock/adjust', data, { headers: { 'X-Tenant-Id': tenantId } });
  return res.data?.data;
}

export async function transferStock(
  tenantId: string,
  data: { productId: string | number; fromWarehouseId: string; toWarehouseId: string; quantity: number }
): Promise<void> {
  await api.post('/inventory/stock/transfer', data, { headers: { 'X-Tenant-Id': tenantId } });
}

export async function fetchStockMovements(
  tenantId: string,
  params?: Record<string, string>
): Promise<StockMovement[]> {
  const res = await api.get('/inventory/movements', { params, headers: { 'X-Tenant-Id': tenantId } });
  return res.data?.data || [];
}
