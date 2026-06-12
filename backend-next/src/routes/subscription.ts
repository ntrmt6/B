/**
 * Subscription Routes
 * APIs for checking and managing tenant subscriptions
 */

import { Router } from 'express';
import { getTenantById, getTenantBySubdomain, updateTenant } from '../services/tenantsService';
import { 
  calculateTenantSubscriptionStatus, 
  getSubscriptionInfoForClient,
  createInitialSubscription,
  renewSubscription 
} from '../utils/subscriptionUtils';
import { authenticateToken } from '../middleware/auth';

export const subscriptionRouter = Router();

/**
 * GET /api/subscription/status
 * Get subscription status for a tenant
 * Query params: tenantId or subdomain (from header x-tenant-subdomain)
 */
subscriptionRouter.get('/status', async (req, res) => {
  try {
    const tenantId = req.query.tenantId as string || req.headers['x-tenant-id'] as string;
    const subdomain = req.headers['x-tenant-subdomain'] as string;

    if (!tenantId && !subdomain) {
      return res.status(400).json({ 
        error: 'Tenant ID or subdomain required',
        code: 'TENANT_REQUIRED'
      });
    }

    let tenant = null;
    if (tenantId) {
      tenant = await getTenantById(tenantId);
    } else if (subdomain) {
      tenant = await getTenantBySubdomain(subdomain);
    }

    if (!tenant) {
      return res.status(404).json({ 
        error: 'Tenant not found',
        code: 'TENANT_NOT_FOUND'
      });
    }

    const subscriptionInfo = getSubscriptionInfoForClient(tenant);

    res.json({
      success: true,
      subscription: subscriptionInfo,
    });
  } catch (error) {
    console.error('[Subscription] Status check error:', error);
    res.status(500).json({ 
      error: 'Failed to get subscription status',
      code: 'SUBSCRIPTION_CHECK_FAILED'
    });
  }
});

/**
 * GET /api/subscription/check
 * Quick check if subscription is valid (for blocking UI)
 */
subscriptionRouter.get('/check', async (req, res) => {
  try {
    const tenantId = req.query.tenantId as string || req.headers['x-tenant-id'] as string;
    const subdomain = req.headers['x-tenant-subdomain'] as string;

    if (!tenantId && !subdomain) {
      return res.json({ 
        valid: true, // No tenant context, allow
        message: 'No tenant context'
      });
    }

    let tenant = null;
    if (tenantId) {
      tenant = await getTenantById(tenantId);
    } else if (subdomain) {
      tenant = await getTenantBySubdomain(subdomain);
    }

    if (!tenant) {
      return res.json({ 
        valid: true, // Tenant not found, allow (might be new)
        message: 'Tenant not found'
      });
    }

    const status = calculateTenantSubscriptionStatus(tenant);

    res.json({
      valid: !status.isBlocked,
      daysRemaining: status.daysRemaining,
      daysOverdue: status.daysOverdue,
      isExpired: status.isExpired,
      isInGracePeriod: status.isInGracePeriod,
      isBlocked: status.isBlocked,
      packageEndDate: status.packageEndDate.toISOString(),
      graceEndDate: status.graceEndDate.toISOString(),
    });
  } catch (error) {
    console.error('[Subscription] Quick check error:', error);
    // On error, allow the request
    res.json({ valid: true, error: 'Check failed' });
  }
});

/**
 * POST /api/subscription/init
 * Initialize subscription for a tenant (admin only)
 * Used when migrating existing tenants or setting up new ones
 */
subscriptionRouter.post('/init', authenticateToken, async (req, res) => {
  try {
    // Only super_admin and tenant_admin can init subscription
    if (req.userRole !== 'super_admin' && req.userRole !== 'tenant_admin') {
      return res.status(403).json({ 
        error: 'Unauthorized',
        code: 'UNAUTHORIZED'
      });
    }

    const tenantId = req.body.tenantId || req.tenantId;

    if (!tenantId) {
      return res.status(400).json({ 
        error: 'Tenant ID required',
        code: 'TENANT_REQUIRED'
      });
    }

    const tenant = await getTenantById(tenantId);

    if (!tenant) {
      return res.status(404).json({ 
        error: 'Tenant not found',
        code: 'TENANT_NOT_FOUND'
      });
    }

    // Initialize subscription
    const subscription = createInitialSubscription();

    // Update tenant with subscription
    await updateTenant(tenantId, { subscription });

    res.json({
      success: true,
      message: 'Subscription initialized',
      subscription,
    });
  } catch (error) {
    console.error('[Subscription] Init error:', error);
    res.status(500).json({ 
      error: 'Failed to initialize subscription',
      code: 'SUBSCRIPTION_INIT_FAILED'
    });
  }
});

/**
 * POST /api/subscription/renew
 * Renew subscription for a tenant (admin/superadmin only)
 * In production, this would be called after payment verification
 */
subscriptionRouter.post('/renew', authenticateToken, async (req, res) => {
  try {
    // Only super_admin can renew subscriptions
    if (req.userRole !== 'super_admin') {
      return res.status(403).json({ 
        error: 'Unauthorized. Only super admin can renew subscriptions.',
        code: 'UNAUTHORIZED'
      });
    }

    const tenantId = req.body.tenantId;

    if (!tenantId) {
      return res.status(400).json({ 
        error: 'Tenant ID required',
        code: 'TENANT_REQUIRED'
      });
    }

    const tenant = await getTenantById(tenantId);

    if (!tenant) {
      return res.status(404).json({ 
        error: 'Tenant not found',
        code: 'TENANT_NOT_FOUND'
      });
    }

    // Renew subscription
    const subscription = renewSubscription(tenant.subscription);

    // Update tenant with renewed subscription
    await updateTenant(tenantId, { subscription });

    res.json({
      success: true,
      message: 'Subscription renewed successfully',
      subscription,
    });
  } catch (error) {
    console.error('[Subscription] Renew error:', error);
    res.status(500).json({ 
      error: 'Failed to renew subscription',
      code: 'SUBSCRIPTION_RENEW_FAILED'
    });
  }
});

/**
 * POST /api/subscription/dismiss-notification
 * Mark notification as shown for today
 */
subscriptionRouter.post('/dismiss-notification', async (req, res) => {
  try {
    const tenantId = req.body.tenantId || req.headers['x-tenant-id'] as string;
    const subdomain = req.headers['x-tenant-subdomain'] as string;

    if (!tenantId && !subdomain) {
      return res.status(400).json({ 
        error: 'Tenant ID or subdomain required',
        code: 'TENANT_REQUIRED'
      });
    }

    let tenant = null;
    let resolvedTenantId = tenantId;

    if (tenantId) {
      tenant = await getTenantById(tenantId);
    } else if (subdomain) {
      tenant = await getTenantBySubdomain(subdomain);
      resolvedTenantId = tenant?._id?.toString() || tenant?.id;
    }

    if (!tenant || !resolvedTenantId) {
      return res.status(404).json({ 
        error: 'Tenant not found',
        code: 'TENANT_NOT_FOUND'
      });
    }

    // Update last notification shown date, ensuring required fields exist
    const existingSubscription = tenant.subscription || {
      packageStartDate: tenant.createdAt || new Date().toISOString(),
      packageDays: 30,
      gracePeriodDays: 7,
      isBlocked: false,
    };
    
    const subscription = {
      ...existingSubscription,
      lastNotificationShown: new Date().toISOString(),
    };

    await updateTenant(resolvedTenantId, { subscription });

    res.json({
      success: true,
      message: 'Notification dismissed for today',
    });
  } catch (error) {
    console.error('[Subscription] Dismiss notification error:', error);
    res.status(500).json({ 
      error: 'Failed to dismiss notification',
      code: 'NOTIFICATION_DISMISS_FAILED'
    });
  }
});

export default subscriptionRouter;
