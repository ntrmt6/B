import { Vendor, IVendor } from '../models/Vendor';
import { getTenantData, setTenantData } from './tenantDataService';
import { revalidateProducts } from './isrRevalidation';

// ─── Commission Calculation ────────────────────────────────────────────────

export interface CommissionResult {
  vendorId: string;
  vendorName: string;
  subtotal: number;
  commissionRate: number;
  commissionAmount: number;
  vendorPayout: number;
}

/**
 * Calculate commission for a single vendor's portion of an order.
 * The tenant keeps `commissionRate`% of the subtotal; the vendor receives the rest.
 */
export function calculateCommission(
  subtotal: number,
  commissionRate: number
): { commissionAmount: number; vendorPayout: number } {
  const rate = Math.max(0, Math.min(100, commissionRate));
  const commissionAmount = Math.round((subtotal * rate / 100) * 100) / 100;
  const vendorPayout = Math.round((subtotal - commissionAmount) * 100) / 100;
  return { commissionAmount, vendorPayout };
}

/**
 * Calculate commission breakdown for all vendors in a multi-item order.
 * Groups items by vendorId, looks up each vendor's commission rate,
 * then returns per-vendor totals.
 */
export async function calculateOrderCommissions(
  tenantId: string,
  items: Array<{ vendorId?: string; price: number; quantity: number }>
): Promise<CommissionResult[]> {
  // Collect unique vendorIds
  const vendorIds = [...new Set(items.filter(i => i.vendorId).map(i => i.vendorId!))];
  if (vendorIds.length === 0) return [];

  // Fetch vendors in one query
  const vendors = await Vendor.find({ tenantId, _id: { $in: vendorIds }, status: 'active' }).lean();
  const vendorMap = new Map(vendors.map(v => [v._id.toString(), v]));

  const results: CommissionResult[] = [];

  for (const vendorId of vendorIds) {
    const vendor = vendorMap.get(vendorId);
    if (!vendor) continue;

    const vendorItems = items.filter(i => i.vendorId === vendorId);
    const subtotal = vendorItems.reduce((sum, i) => sum + (i.price * (i.quantity || 1)), 0);
    const { commissionAmount, vendorPayout } = calculateCommission(subtotal, vendor.commissionRate);

    results.push({
      vendorId,
      vendorName: vendor.name,
      subtotal,
      commissionRate: vendor.commissionRate,
      commissionAmount,
      vendorPayout,
    });
  }

  return results;
}

// ─── Order Splitting ───────────────────────────────────────────────────────

export interface SubOrder {
  id: string;
  masterOrderId: string;
  vendorId: string;
  vendorName: string;
  tenantId: string;
  customer: string;
  phone?: string;
  email?: string;
  location?: string;
  items: any[];
  amount: number;
  commissionRate: number;
  commissionAmount: number;
  vendorPayout: number;
  status: string;
  date: string;
  createdAt: string;
}

/**
 * Split a master order into vendor-specific sub-orders.
 *
 * This is called after a master order is confirmed/paid. It:
 * 1. Groups items by vendorId
 * 2. Creates a sub-order for each vendor
 * 3. Calculates commission for each sub-order
 * 4. Stores sub-orders as tenant data
 * 5. Updates vendor sales totals
 *
 * Items without a vendorId are treated as tenant-direct sales (no sub-order).
 */
export async function splitOrderByVendor(
  tenantId: string,
  masterOrder: {
    id: string;
    customer: string;
    phone?: string;
    email?: string;
    location?: string;
    items: Array<{
      productId?: number | string;
      id?: number | string;
      vendorId?: string;
      price?: number;
      quantity?: number;
      name?: string;
      image?: string;
      variant?: { color: string; size: string };
      [key: string]: any;
    }>;
    date: string;
    status: string;
  }
): Promise<SubOrder[]> {
  const items = masterOrder.items || [];

  // Group items by vendorId (skip items without a vendor)
  const vendorGroups = new Map<string, typeof items>();
  for (const item of items) {
    if (!item.vendorId) continue;
    const group = vendorGroups.get(item.vendorId) || [];
    group.push(item);
    vendorGroups.set(item.vendorId, group);
  }

  if (vendorGroups.size === 0) return [];

  // Fetch vendors
  const vendorIds = [...vendorGroups.keys()];
  const vendors = await Vendor.find({ tenantId, _id: { $in: vendorIds } }).lean();
  const vendorMap = new Map(vendors.map(v => [v._id.toString(), v]));

  const subOrders: SubOrder[] = [];
  const now = new Date().toISOString();

  for (const [vendorId, vendorItems] of vendorGroups) {
    const vendor = vendorMap.get(vendorId);
    if (!vendor) continue;

    const subtotal = vendorItems.reduce((sum, i) => sum + ((i.price || 0) * (i.quantity || 1)), 0);
    const { commissionAmount, vendorPayout } = calculateCommission(subtotal, vendor.commissionRate);

    const subOrder: SubOrder = {
      id: `${masterOrder.id}-V${vendorId.slice(-6)}`,
      masterOrderId: masterOrder.id,
      vendorId,
      vendorName: vendor.name,
      tenantId,
      customer: masterOrder.customer,
      phone: masterOrder.phone,
      email: masterOrder.email,
      location: masterOrder.location,
      items: vendorItems,
      amount: subtotal,
      commissionRate: vendor.commissionRate,
      commissionAmount,
      vendorPayout,
      status: masterOrder.status,
      date: masterOrder.date,
      createdAt: now,
    };

    subOrders.push(subOrder);

    // Update vendor totals (non-blocking)
    try {
      await Vendor.updateOne(
        { _id: vendorId, tenantId },
        {
          $inc: {
            totalSales: subtotal,
            totalCommission: commissionAmount,
            balance: vendorPayout,
          },
        }
      );
    } catch (err) {
      console.error(`[Vendor] Failed to update totals for vendor ${vendorId}:`, err);
    }
  }

  // Persist sub-orders as tenant data
  if (subOrders.length > 0) {
    try {
      const existing = (await getTenantData<SubOrder[]>(tenantId, 'vendor_sub_orders')) || [];
      existing.push(...subOrders);
      await setTenantData(tenantId, 'vendor_sub_orders', existing);
    } catch (err) {
      console.error('[Vendor] Failed to persist sub-orders:', err);
    }
  }

  return subOrders;
}

// ─── Vendor CRUD helpers ───────────────────────────────────────────────────

/**
 * Create a new vendor for a tenant.
 */
export async function createVendor(
  tenantId: string,
  data: Partial<IVendor>
): Promise<IVendor> {
  const vendor = new Vendor({
    ...data,
    tenantId,
    totalSales: 0,
    totalCommission: 0,
    balance: 0,
  });
  await vendor.save();
  return vendor;
}

/**
 * Get all vendors for a tenant, optionally filtered by status.
 */
export async function getVendors(
  tenantId: string,
  status?: string
): Promise<IVendor[]> {
  const filter: Record<string, unknown> = { tenantId };
  if (status) filter.status = status;
  return Vendor.find(filter).sort({ createdAt: -1 }).lean() as unknown as IVendor[];
}

/**
 * Get a single vendor by ID (with tenant isolation).
 */
export async function getVendorById(
  tenantId: string,
  vendorId: string
): Promise<IVendor | null> {
  return Vendor.findOne({ _id: vendorId, tenantId }).lean() as unknown as IVendor | null;
}

/**
 * Update a vendor (with tenant isolation).
 */
export async function updateVendor(
  tenantId: string,
  vendorId: string,
  updates: Partial<IVendor>
): Promise<IVendor | null> {
  // Prevent overwriting tenant-scoped fields
  const { tenantId: _ignoredTenantId, _id: _ignoredId, totalSales: _ignoredTotalSales, totalCommission: _ignoredTotalCommission, ...safeUpdates } = updates as any;
  return Vendor.findOneAndUpdate(
    { _id: vendorId, tenantId },
    { $set: safeUpdates },
    { new: true }
  ).lean() as unknown as IVendor | null;
}

/**
 * Delete a vendor (with tenant isolation).
 */
export async function deleteVendor(
  tenantId: string,
  vendorId: string
): Promise<boolean> {
  const result = await Vendor.deleteOne({ _id: vendorId, tenantId });
  return result.deletedCount > 0;
}

/**
 * Get sub-orders for a specific vendor.
 */
export async function getVendorSubOrders(
  tenantId: string,
  vendorId: string
): Promise<SubOrder[]> {
  const allSubOrders = (await getTenantData<SubOrder[]>(tenantId, 'vendor_sub_orders')) || [];
  return allSubOrders.filter(so => so.vendorId === vendorId);
}

/**
 * Trigger ISR revalidation after vendor/product changes.
 */
export function revalidateVendorData(tenantId: string): void {
  revalidateProducts(tenantId);
}
