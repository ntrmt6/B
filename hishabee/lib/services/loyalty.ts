import api from '@/lib/api';

// ─── Interfaces ───────────────────────────────────────────────

export interface LoyaltyConfig {
  enabled: boolean;
  pointsPerCurrencyUnit: number;
  currencyPerPoint: number;
  minimumRedeemPoints: number;
}

export interface LoyaltyAccount {
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  currentBalance: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  lastActivityAt: string;
  createdAt: string;
}

export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  type: 'earn' | 'redeem' | 'adjustment' | 'expire';
  points: number;
  orderId?: string;
  source: 'online' | 'pos' | 'admin';
  description: string;
  createdAt: string;
  createdBy?: string;
}

export interface CustomerProfile {
  customerId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  onlineOrderCount: number;
  posOrderCount: number;
  totalSpent: number;
  loyaltyPoints: number;
  lastOrderAt?: string;
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Loyalty Config APIs ──────────────────────────────────────

export async function fetchLoyaltyConfig(tenantId: string): Promise<LoyaltyConfig> {
  const res = await api.get('/loyalty/config', { headers: { 'X-Tenant-Id': tenantId } });
  return res.data?.data || { enabled: false, pointsPerCurrencyUnit: 1, currencyPerPoint: 1, minimumRedeemPoints: 100 };
}

export async function saveLoyaltyConfig(tenantId: string, config: LoyaltyConfig): Promise<void> {
  await api.put('/loyalty/config', config, { headers: { 'X-Tenant-Id': tenantId } });
}

// ─── Loyalty Account APIs ─────────────────────────────────────

export async function fetchLoyaltyAccounts(tenantId: string): Promise<LoyaltyAccount[]> {
  const res = await api.get('/loyalty/accounts', { headers: { 'X-Tenant-Id': tenantId } });
  return res.data?.data || [];
}

export async function fetchLoyaltyAccount(tenantId: string, customerId: string): Promise<LoyaltyAccount | null> {
  try {
    const res = await api.get(`/loyalty/accounts/${customerId}`, { headers: { 'X-Tenant-Id': tenantId } });
    return res.data?.data || null;
  } catch {
    return null;
  }
}

export async function earnLoyaltyPoints(
  tenantId: string,
  data: { customerId: string; customerName: string; customerPhone?: string; amount: number; orderId?: string; source?: string }
): Promise<{ pointsEarned: number; newBalance: number; tier: string }> {
  const res = await api.post('/loyalty/earn', data, { headers: { 'X-Tenant-Id': tenantId } });
  return res.data?.data;
}

export async function redeemLoyaltyPoints(
  tenantId: string,
  data: { customerId: string; points: number; orderId?: string; source?: string }
): Promise<{ pointsRedeemed: number; discountAmount: number; newBalance: number }> {
  const res = await api.post('/loyalty/redeem', data, { headers: { 'X-Tenant-Id': tenantId } });
  return res.data?.data;
}

export async function fetchLoyaltyTransactions(tenantId: string, customerId: string): Promise<LoyaltyTransaction[]> {
  const res = await api.get(`/loyalty/transactions/${customerId}`, { headers: { 'X-Tenant-Id': tenantId } });
  return res.data?.data || [];
}

// ─── Customer Profile APIs ────────────────────────────────────

export async function fetchCustomerProfiles(tenantId: string): Promise<CustomerProfile[]> {
  const res = await api.get('/loyalty/customers', { headers: { 'X-Tenant-Id': tenantId } });
  return res.data?.data || [];
}

export async function fetchCustomerProfile(tenantId: string, customerId: string): Promise<(CustomerProfile & { purchaseHistory?: Record<string, unknown>[]; loyalty?: LoyaltyAccount | null }) | null> {
  try {
    const res = await api.get(`/loyalty/customers/${customerId}`, { headers: { 'X-Tenant-Id': tenantId } });
    return res.data?.data || null;
  } catch {
    return null;
  }
}

export async function saveCustomerProfile(
  tenantId: string,
  data: { customerId?: string; name: string; phone?: string; email?: string; address?: string; tags?: string[]; notes?: string }
): Promise<CustomerProfile> {
  const res = await api.post('/loyalty/customers', data, { headers: { 'X-Tenant-Id': tenantId } });
  return res.data?.data;
}
