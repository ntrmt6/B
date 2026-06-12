import { Router, Request } from 'express';
import { z } from 'zod';
import { authenticateToken, extractTenantId } from '../middleware/auth';
import { getTenantData, setTenantData } from '../services/tenantDataService';
import { dispatchWebhook } from '../services/webhookService';

export const loyaltyRouter = Router();

loyaltyRouter.use(extractTenantId);

function getTenantId(req: Request): string | null {
  return (req as any).tenantId || (req.headers['x-tenant-id'] as string) || null;
}

// ─── Interfaces ───────────────────────────────────────────────

interface LoyaltyConfig {
  enabled: boolean;
  pointsPerCurrencyUnit: number;  // e.g., 1 point per ৳100 spent
  currencyPerPoint: number;        // e.g., ৳1 per point
  minimumRedeemPoints: number;
}

interface LoyaltyAccount {
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

interface LoyaltyTransaction {
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

interface CustomerProfile {
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

// ─── Helper: determine tier by points ─────────────────────────
function computeTier(totalEarned: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
  if (totalEarned >= 10000) return 'platinum';
  if (totalEarned >= 5000) return 'gold';
  if (totalEarned >= 1000) return 'silver';
  return 'bronze';
}

// ─── Loyalty Configuration ────────────────────────────────────

/** GET /config — Get loyalty program config */
loyaltyRouter.get('/config', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const config = await getTenantData<LoyaltyConfig>(tenantId, 'pos_loyalty_config');
    res.json({
      data: config || {
        enabled: false,
        pointsPerCurrencyUnit: 1,
        currencyPerPoint: 1,
        minimumRedeemPoints: 100,
      },
    });
  } catch (error) {
    next(error);
  }
});

/** PUT /config — Update loyalty program config */
loyaltyRouter.put('/config', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const schema = z.object({
      enabled: z.boolean(),
      pointsPerCurrencyUnit: z.number().min(0),
      currencyPerPoint: z.number().min(0),
      minimumRedeemPoints: z.number().min(0),
    });

    const config = schema.parse(req.body);
    await setTenantData(tenantId, 'pos_loyalty_config', config);
    res.json({ data: config, success: true });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    next(error);
  }
});

// ─── Loyalty Accounts ─────────────────────────────────────────

/** GET /accounts — List all loyalty accounts */
loyaltyRouter.get('/accounts', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const accounts = (await getTenantData<LoyaltyAccount[]>(tenantId, 'pos_loyalty_accounts')) || [];
    res.json({ data: accounts });
  } catch (error) {
    next(error);
  }
});

/** GET /accounts/:customerId — Get a specific loyalty account */
loyaltyRouter.get('/accounts/:customerId', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const accounts = (await getTenantData<LoyaltyAccount[]>(tenantId, 'pos_loyalty_accounts')) || [];
    const account = accounts.find((a) => a.customerId === req.params.customerId);
    if (!account) return res.status(404).json({ error: 'Loyalty account not found' });

    res.json({ data: account });
  } catch (error) {
    next(error);
  }
});

/** POST /earn — Earn loyalty points */
loyaltyRouter.post('/earn', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const schema = z.object({
      customerId: z.string(),
      customerName: z.string(),
      customerPhone: z.string().optional(),
      customerEmail: z.string().optional(),
      amount: z.number().positive(),
      orderId: z.string().optional(),
      source: z.enum(['online', 'pos', 'admin']).default('pos'),
    });

    const data = schema.parse(req.body);

    // Get loyalty config
    const config = await getTenantData<LoyaltyConfig>(tenantId, 'pos_loyalty_config');
    if (!config?.enabled) {
      return res.status(400).json({ error: 'Loyalty program is not enabled' });
    }

    const pointsEarned = Math.floor(data.amount / (config.pointsPerCurrencyUnit || 1));
    if (pointsEarned <= 0) {
      return res.json({ data: { pointsEarned: 0 }, success: true });
    }

    // Update or create loyalty account
    const accounts = (await getTenantData<LoyaltyAccount[]>(tenantId, 'pos_loyalty_accounts')) || [];
    let accountIndex = accounts.findIndex((a) => a.customerId === data.customerId);

    if (accountIndex === -1) {
      accounts.push({
        customerId: data.customerId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        totalPointsEarned: 0,
        totalPointsRedeemed: 0,
        currentBalance: 0,
        tier: 'bronze',
        lastActivityAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
      accountIndex = accounts.length - 1;
    }

    accounts[accountIndex].totalPointsEarned += pointsEarned;
    accounts[accountIndex].currentBalance += pointsEarned;
    accounts[accountIndex].tier = computeTier(accounts[accountIndex].totalPointsEarned);
    accounts[accountIndex].lastActivityAt = new Date().toISOString();

    await setTenantData(tenantId, 'pos_loyalty_accounts', accounts);

    // Log transaction
    const transactions = (await getTenantData<LoyaltyTransaction[]>(tenantId, 'pos_loyalty_transactions')) || [];
    const tx: LoyaltyTransaction = {
      id: `lt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      customerId: data.customerId,
      type: 'earn',
      points: pointsEarned,
      orderId: data.orderId,
      source: data.source,
      description: `Earned ${pointsEarned} points from ৳${data.amount} purchase`,
      createdAt: new Date().toISOString(),
      createdBy: (req as any).user?.name,
    };
    transactions.unshift(tx);
    if (transactions.length > 2000) transactions.length = 2000;
    await setTenantData(tenantId, 'pos_loyalty_transactions', transactions);

    // Dispatch webhook
    await dispatchWebhook(tenantId, 'loyalty.earned', {
      customerId: data.customerId,
      pointsEarned,
      newBalance: accounts[accountIndex].currentBalance,
      orderId: data.orderId,
    });

    res.json({
      data: {
        pointsEarned,
        newBalance: accounts[accountIndex].currentBalance,
        tier: accounts[accountIndex].tier,
      },
      success: true,
    });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    next(error);
  }
});

/** POST /redeem — Redeem loyalty points */
loyaltyRouter.post('/redeem', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const schema = z.object({
      customerId: z.string(),
      points: z.number().positive(),
      orderId: z.string().optional(),
      source: z.enum(['online', 'pos', 'admin']).default('pos'),
    });

    const data = schema.parse(req.body);

    const config = await getTenantData<LoyaltyConfig>(tenantId, 'pos_loyalty_config');
    if (!config?.enabled) {
      return res.status(400).json({ error: 'Loyalty program is not enabled' });
    }

    if (data.points < (config.minimumRedeemPoints || 0)) {
      return res.status(400).json({ error: `Minimum ${config.minimumRedeemPoints} points required to redeem` });
    }

    const accounts = (await getTenantData<LoyaltyAccount[]>(tenantId, 'pos_loyalty_accounts')) || [];
    const accountIndex = accounts.findIndex((a) => a.customerId === data.customerId);
    if (accountIndex === -1) return res.status(404).json({ error: 'Loyalty account not found' });

    if (accounts[accountIndex].currentBalance < data.points) {
      return res.status(400).json({ error: 'Insufficient loyalty points' });
    }

    const discountAmount = data.points * (config.currencyPerPoint || 1);

    accounts[accountIndex].totalPointsRedeemed += data.points;
    accounts[accountIndex].currentBalance -= data.points;
    accounts[accountIndex].lastActivityAt = new Date().toISOString();

    await setTenantData(tenantId, 'pos_loyalty_accounts', accounts);

    // Log transaction
    const transactions = (await getTenantData<LoyaltyTransaction[]>(tenantId, 'pos_loyalty_transactions')) || [];
    const tx: LoyaltyTransaction = {
      id: `lt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      customerId: data.customerId,
      type: 'redeem',
      points: -data.points,
      orderId: data.orderId,
      source: data.source,
      description: `Redeemed ${data.points} points for ৳${discountAmount} discount`,
      createdAt: new Date().toISOString(),
      createdBy: (req as any).user?.name,
    };
    transactions.unshift(tx);
    if (transactions.length > 2000) transactions.length = 2000;
    await setTenantData(tenantId, 'pos_loyalty_transactions', transactions);

    await dispatchWebhook(tenantId, 'loyalty.redeemed', {
      customerId: data.customerId,
      pointsRedeemed: data.points,
      discountAmount,
      newBalance: accounts[accountIndex].currentBalance,
    });

    res.json({
      data: {
        pointsRedeemed: data.points,
        discountAmount,
        newBalance: accounts[accountIndex].currentBalance,
      },
      success: true,
    });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    next(error);
  }
});

/** GET /transactions/:customerId — Get loyalty transaction history */
loyaltyRouter.get('/transactions/:customerId', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const transactions = (await getTenantData<LoyaltyTransaction[]>(tenantId, 'pos_loyalty_transactions')) || [];
    const filtered = transactions.filter((t) => t.customerId === req.params.customerId);
    res.json({ data: filtered });
  } catch (error) {
    next(error);
  }
});

// ─── Unified Customer Profiles ────────────────────────────────

/** GET /customers — Get unified customer profiles with cross-channel data */
loyaltyRouter.get('/customers', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const profiles = (await getTenantData<CustomerProfile[]>(tenantId, 'pos_customer_profiles')) || [];
    res.json({ data: profiles });
  } catch (error) {
    next(error);
  }
});

/** GET /customers/:customerId — Get a specific customer profile */
loyaltyRouter.get('/customers/:customerId', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const profiles = (await getTenantData<CustomerProfile[]>(tenantId, 'pos_customer_profiles')) || [];
    const profile = profiles.find((p) => p.customerId === req.params.customerId);
    if (!profile) return res.status(404).json({ error: 'Customer profile not found' });

    // Also fetch purchase history from orders
    const orders = (await getTenantData<any[]>(tenantId, 'orders')) || [];
    const customerOrders = orders.filter(
      (o: any) =>
        o.phone === profile.phone ||
        o.email === profile.email ||
        o.customer === profile.name
    );

    // Get loyalty info
    const accounts = (await getTenantData<LoyaltyAccount[]>(tenantId, 'pos_loyalty_accounts')) || [];
    const loyaltyAccount = accounts.find((a) => a.customerId === profile.customerId);

    res.json({
      data: {
        ...profile,
        purchaseHistory: customerOrders.slice(0, 50),
        loyalty: loyaltyAccount || null,
      },
    });
  } catch (error) {
    next(error);
  }
});

/** POST /customers — Create or update a unified customer profile */
loyaltyRouter.post('/customers', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const schema = z.object({
      customerId: z.string().optional(),
      name: z.string().min(1),
      phone: z.string().optional(),
      email: z.string().optional(),
      address: z.string().optional(),
      tags: z.array(z.string()).default([]),
      notes: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const profiles = (await getTenantData<CustomerProfile[]>(tenantId, 'pos_customer_profiles')) || [];

    const customerId = data.customerId || `cust_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const existingIndex = profiles.findIndex((p) => p.customerId === customerId);

    const now = new Date().toISOString();
    if (existingIndex !== -1) {
      profiles[existingIndex] = {
        ...profiles[existingIndex],
        ...data,
        customerId,
        updatedAt: now,
      };
    } else {
      profiles.push({
        customerId,
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        onlineOrderCount: 0,
        posOrderCount: 0,
        totalSpent: 0,
        loyaltyPoints: 0,
        tags: data.tags,
        notes: data.notes,
        createdAt: now,
        updatedAt: now,
      });
    }

    await setTenantData(tenantId, 'pos_customer_profiles', profiles);

    await dispatchWebhook(tenantId, existingIndex !== -1 ? 'customer.updated' : 'customer.created', {
      customerId,
      name: data.name,
    });

    const saved = profiles.find((p) => p.customerId === customerId)!;
    res.status(existingIndex !== -1 ? 200 : 201).json({ data: saved, success: true });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    next(error);
  }
});
