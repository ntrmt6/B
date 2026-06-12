import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken, requireRole } from '../middleware/auth';
import { getTenantData, setTenantData } from '../services/tenantDataService';

export const tenantFeaturesRouter = Router();

const FEATURES_KEY = 'tenant_features';

/**
 * Tenant Feature Control System
 * 
 * Allows super admins to control which dashboard sections are available to each tenant.
 * Each section can be: 'enabled' (full access), 'disabled' (hidden), or 'premium' (shows upgrade prompt).
 * 
 * Data is stored per-tenant in the tenant_data collection using the 'tenant_features' key.
 */

// Schema for a single section config
const SectionConfigSchema = z.object({
  enabled: z.boolean(),
  premium: z.boolean(),
});

// Schema for the full tenant features configuration
const TenantFeaturesSchema = z.object({
  sections: z.record(z.string(), SectionConfigSchema),
  updatedBy: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type SectionConfig = z.infer<typeof SectionConfigSchema>;
export type TenantFeaturesConfig = z.infer<typeof TenantFeaturesSchema>;

// GET /api/tenant-features/my-config — tenant gets its own feature configuration
tenantFeaturesRouter.get('/my-config', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || req.tenantId;
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    const config = await getTenantData<TenantFeaturesConfig>(tenantId, FEATURES_KEY);
    res.json({ data: config || { sections: {} } });
  } catch (error) {
    next(error);
  }
});

// GET /api/tenant-features/:tenantId — super admin gets a specific tenant's features
tenantFeaturesRouter.get('/:tenantId', authenticateToken, requireRole('super_admin'), async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    const config = await getTenantData<TenantFeaturesConfig>(tenantId, FEATURES_KEY);
    res.json({ data: config || { sections: {} } });
  } catch (error) {
    next(error);
  }
});

// PUT /api/tenant-features/:tenantId — super admin updates a tenant's feature configuration
tenantFeaturesRouter.put('/:tenantId', authenticateToken, requireRole('super_admin'), async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    const parsed = TenantFeaturesSchema.parse(req.body);

    // Add metadata
    const config: TenantFeaturesConfig = {
      ...parsed,
      updatedBy: req.userId || 'unknown',
      updatedAt: new Date().toISOString(),
    };

    await setTenantData(tenantId, FEATURES_KEY, config);
    res.json({ data: config, message: 'Tenant features updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid feature configuration', errors: error.errors });
    }
    next(error);
  }
});
