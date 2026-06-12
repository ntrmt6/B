import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import { getTenantData, setTenantData } from '../services/tenantDataService';

export const tenantConfigRouter = Router();

const CONFIG_KEY = 'tenant_config';

const TenantConfigSchema = z.object({
  appName: z.string().min(1).max(100).optional(),
  appDescription: z.string().max(500).optional(),
  logoChar: z.string().max(10).optional(),
  logoUrl: z.string().url().optional(),
  language: z.string().max(10).optional(),
  locale: z.string().max(20).optional(),
  currency: z.object({
    symbol: z.string().max(10),
    code: z.string().max(10),
    locale: z.string().max(20),
    decimals: z.number().int().min(0).max(6),
  }).optional(),
  expenseCategories: z.array(z.string().max(100)).max(50).optional(),
  orderStatuses: z.array(z.string().max(100)).max(20).optional(),
  entityTypes: z.array(z.string().max(100)).max(20).optional(),
}).strict();

// GET /api/tenant-config — fetch tenant configuration
tenantConfigRouter.get('/', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || (req as unknown as Record<string, unknown>).tenantId as string;
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    const config = await getTenantData(tenantId, CONFIG_KEY);
    res.json(config || {});
  } catch (error) {
    next(error);
  }
});

// PUT /api/tenant-config — update tenant configuration
tenantConfigRouter.put('/', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || (req as unknown as Record<string, unknown>).tenantId as string;
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    const parsed = TenantConfigSchema.parse(req.body);

    // Merge with existing config
    const existing = await getTenantData<Record<string, unknown>>(tenantId, CONFIG_KEY) || {};
    const merged = { ...existing, ...parsed };

    await setTenantData(tenantId, CONFIG_KEY, merged);
    res.json(merged);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid config', errors: error.errors });
    }
    next(error);
  }
});
