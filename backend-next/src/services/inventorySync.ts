import { getDatabase } from '../db/mongo';
import { getTenantData, setTenantData } from './tenantDataService';
import { getCached, setCachedWithTTL, invalidateTenantCache } from './redisCache';

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
  threshold: number;        // Below this → show "Out of Stock" online
  warehouseId?: string;     // Optional warehouse-specific rule
}

export interface StockEntry {
  productId: string | number;
  warehouseId: string;
  quantity: number;
  reservedQuantity: number; // Reserved for pending online orders
  updatedAt: string;
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

// ─── Stock Helpers ────────────────────────────────────────────

/** Get warehouse nodes for a tenant */
export async function getWarehouses(tenantId: string): Promise<WarehouseNode[]> {
  const data = await getTenantData<WarehouseNode[]>(tenantId, 'pos_warehouses');
  return data || [{ id: 'default', name: 'Main Store', branchId: 'main', isDefault: true }];
}

/** Set warehouse nodes for a tenant */
export async function setWarehouses(tenantId: string, warehouses: WarehouseNode[]): Promise<void> {
  await setTenantData(tenantId, 'pos_warehouses', warehouses);
}

/** Get buffer stock rules for a tenant */
export async function getBufferStockRules(tenantId: string): Promise<BufferStockRule[]> {
  const data = await getTenantData<BufferStockRule[]>(tenantId, 'pos_buffer_stock_rules');
  return data || [];
}

/** Set buffer stock rules for a tenant */
export async function setBufferStockRules(tenantId: string, rules: BufferStockRule[]): Promise<void> {
  await setTenantData(tenantId, 'pos_buffer_stock_rules', rules);
}

/** Get stock entries for a tenant */
export async function getStockEntries(tenantId: string): Promise<StockEntry[]> {
  const data = await getTenantData<StockEntry[]>(tenantId, 'pos_stock_entries');
  return data || [];
}

/** Atomic stock adjustment — reads, modifies, and writes in one flow */
export async function adjustStock(
  tenantId: string,
  productId: string | number,
  warehouseId: string,
  quantityDelta: number,
  movement: Omit<StockMovement, 'id' | 'previousQuantity' | 'newQuantity' | 'createdAt'>
): Promise<{ entry: StockEntry; movement: StockMovement }> {
  const entries = await getStockEntries(tenantId);
  let entryIndex = entries.findIndex(
    (e) => String(e.productId) === String(productId) && e.warehouseId === warehouseId
  );

  let previousQuantity = 0;
  if (entryIndex === -1) {
    entries.push({
      productId,
      warehouseId,
      quantity: 0,
      reservedQuantity: 0,
      updatedAt: new Date().toISOString(),
    });
    entryIndex = entries.length - 1;
  }
  previousQuantity = entries[entryIndex].quantity;
  entries[entryIndex].quantity = Math.max(0, previousQuantity + quantityDelta);
  entries[entryIndex].updatedAt = new Date().toISOString();

  await setTenantData(tenantId, 'pos_stock_entries', entries);

  // Also update product stock in the main products list
  await syncProductStock(tenantId, productId, entries);

  const movementRecord: StockMovement = {
    ...movement,
    id: `mv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    previousQuantity,
    newQuantity: entries[entryIndex].quantity,
    createdAt: new Date().toISOString(),
  };

  // Append movement log
  const movements = await getTenantData<StockMovement[]>(tenantId, 'pos_stock_movements') || [];
  movements.unshift(movementRecord);
  // Keep last 1000 movements
  if (movements.length > 1000) movements.length = 1000;
  await setTenantData(tenantId, 'pos_stock_movements', movements);

  return { entry: entries[entryIndex], movement: movementRecord };
}

/** Sync aggregated stock back to the product list */
async function syncProductStock(
  tenantId: string,
  productId: string | number,
  entries: StockEntry[]
): Promise<void> {
  const products = await getTenantData<any[]>(tenantId, 'products');
  if (!products || products.length === 0) return;

  // Sum stock across all warehouses for this product
  const totalStock = entries
    .filter((e) => String(e.productId) === String(productId))
    .reduce((sum, e) => sum + e.quantity, 0);

  const productIndex = products.findIndex(
    (p: any) => String(p.id) === String(productId)
  );
  if (productIndex !== -1) {
    products[productIndex].stock = totalStock;
    await setTenantData(tenantId, 'products', products);
  }
}

/** Check if a product is available (above buffer threshold) */
export async function isProductAvailable(
  tenantId: string,
  productId: string | number,
  warehouseId?: string
): Promise<{ available: boolean; effectiveStock: number; bufferThreshold: number }> {
  const entries = await getStockEntries(tenantId);
  const rules = await getBufferStockRules(tenantId);

  const relevantEntries = entries.filter(
    (e) =>
      String(e.productId) === String(productId) &&
      (!warehouseId || e.warehouseId === warehouseId)
  );
  const totalStock = relevantEntries.reduce((sum, e) => sum + (e.quantity - e.reservedQuantity), 0);

  const rule = rules.find(
    (r) =>
      String(r.productId) === String(productId) &&
      (!warehouseId || !r.warehouseId || r.warehouseId === warehouseId)
  );
  const threshold = rule?.threshold || 0;

  return {
    available: totalStock > threshold,
    effectiveStock: totalStock,
    bufferThreshold: threshold,
  };
}

/** Batch check availability for multiple products */
export async function checkBulkAvailability(
  tenantId: string,
  productIds: (string | number)[]
): Promise<Record<string, { available: boolean; stock: number; threshold: number }>> {
  const entries = await getStockEntries(tenantId);
  const rules = await getBufferStockRules(tenantId);

  const result: Record<string, { available: boolean; stock: number; threshold: number }> = {};
  for (const pid of productIds) {
    const stock = entries
      .filter((e) => String(e.productId) === String(pid))
      .reduce((sum, e) => sum + (e.quantity - e.reservedQuantity), 0);
    const rule = rules.find((r) => String(r.productId) === String(pid));
    const threshold = rule?.threshold || 0;
    result[String(pid)] = { available: stock > threshold, stock, threshold };
  }
  return result;
}

/** Transfer stock between warehouses */
export async function transferStock(
  tenantId: string,
  productId: string | number,
  fromWarehouseId: string,
  toWarehouseId: string,
  quantity: number,
  createdBy?: string
): Promise<{ fromEntry: StockEntry; toEntry: StockEntry }> {
  // Deduct from source
  const { entry: fromEntry } = await adjustStock(tenantId, productId, fromWarehouseId, -quantity, {
    productId,
    warehouseId: fromWarehouseId,
    type: 'transfer',
    quantity: -quantity,
    referenceId: toWarehouseId,
    note: `Transfer to ${toWarehouseId}`,
    createdBy,
  });

  // Add to destination
  const { entry: toEntry } = await adjustStock(tenantId, productId, toWarehouseId, quantity, {
    productId,
    warehouseId: toWarehouseId,
    type: 'transfer',
    quantity,
    referenceId: fromWarehouseId,
    note: `Transfer from ${fromWarehouseId}`,
    createdBy,
  });

  return { fromEntry, toEntry };
}
