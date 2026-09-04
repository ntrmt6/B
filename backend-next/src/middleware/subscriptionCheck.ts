/**
 * Subscription Check Middleware
 * Blocks API calls for tenants whose subscription has expired beyond grace period
 */

import { Request, Response, NextFunction } from 'express';
import { getTenantById, getTenantBySubdomain } from '../services/tenantsService';
import { shouldBlockTenantApiCalls, calculateTenantSubscriptionStatus } from '../utils/subscriptionUtils';

// Routes that should be exempt from subscription check
const EXEMPT_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/me',
  '/api/auth/refresh',
  '/api/tenants/register',
  '/api/tenants/check-subdomain',
  '/api/tenants/by-domain',
  '/api/subscription/status', // Allow checking subscription status
  '/api/subscription/check',
  '/api/notifications/dashboard-banners', // Super admin banner management
  '/api/notifications/broadcast', // Super admin broadcast notifications
  '/api/super-admin', // All super admin routes (blog, etc.) - not tenant-scoped
  '/api/visitors', // Visitor tracking is a public storefront operation
  '/api/reviews', // Allow public review reads
  '/api/contact', // Allow public contact form submissions
  '/health',
  '/api/health',
  // DueBook is a standalone app with self-tenancy (tenantId = userId).
  // It does not participate in shop subscriptions, so exempt all its routes.
  '/api/duebook',
  '/api/entities',
  '/api/transactions',
  '/api/ai/situation-coach',
  '/api/ai/parse-intent',
  '/api/public/duebook',
];

// Routes that should be exempt for storefront operations (customers can still browse)
const STOREFRONT_EXEMPT_ROUTES = [
  '/api/products',
  '/api/categories',
  '/api/tenant-data',
];

/**
 * Check if the request path is exempt from subscription checks
 */
function isExemptRoute(path: string): boolean {
  return EXEMPT_ROUTES.some(exempt => path.startsWith(exempt));
}

/**
 * Check if the request is a storefront GET request (should be allowed even when blocked)
 */
function isStorefrontReadRequest(method: string, path: string): boolean {
  if (method !== 'GET') return false;
  return STOREFRONT_EXEMPT_ROUTES.some(exempt => path.startsWith(exempt));
}

/**
 * Middleware to check tenant subscription status
 * Blocks write operations for expired tenants
 */
export const checkTenantSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Skip check for exempt routes
    if (isExemptRoute(req.path)) {
      return next();
    }

    // Get tenant ID from various sources
    const tenantId = req.tenantId || 
      req.headers['x-tenant-id'] as string ||
      req.query.tenantId as string;
    
    const tenantSubdomain = req.headers['x-tenant-subdomain'] as string;

    // If no tenant context, allow the request (might be a public route)
    if (!tenantId && !tenantSubdomain) {
      return next();
    }

    // Fetch tenant
    let tenant = null;
    if (tenantId) {
      tenant = await getTenantById(tenantId);
    } else if (tenantSubdomain) {
      tenant = await getTenantBySubdomain(tenantSubdomain);
    }

    // If tenant not found, allow the request (might be handled by route)
    if (!tenant) {
      return next();
    }

    // Check if tenant subscription is blocked
    const isBlocked = shouldBlockTenantApiCalls(tenant);

    if (isBlocked) {
      // Allow storefront read operations even when blocked
      if (isStorefrontReadRequest(req.method, req.path)) {
        // Add header to indicate subscription is expired (frontend can show message)
        res.setHeader('X-Subscription-Expired', 'true');
        return next();
      }

      // Block all write operations and admin operations
      const status = calculateTenantSubscriptionStatus(tenant);
      
      return res.status(402).json({
        error: 'Subscription expired',
        code: 'SUBSCRIPTION_BLOCKED',
        message: 'Your subscription has expired. Please renew to continue using the platform.',
        details: {
          isBlocked: true,
          daysOverdue: status.daysOverdue,
          renewalUrl: 'https://systemnextit.com/renew',
        }
      });
    }

    // Add subscription status to request for downstream use
    const status = calculateTenantSubscriptionStatus(tenant);
    (req as any).subscriptionStatus = status;

    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    // Fail securely - block the request on error rather than allowing bypass
    return res.status(503).json({
      error: 'Service temporarily unavailable',
      code: 'SUBSCRIPTION_CHECK_FAILED',
      message: 'Unable to verify subscription status. Please try again.',
    });
  }
};

/**
 * Middleware to add subscription info headers to response
 * Useful for frontend to know subscription status without extra API call
 */
export const addSubscriptionHeaders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tenantId = req.tenantId || req.headers['x-tenant-id'] as string;
    const tenantSubdomain = req.headers['x-tenant-subdomain'] as string;

    if (!tenantId && !tenantSubdomain) {
      return next();
    }

    let tenant = null;
    if (tenantId) {
      tenant = await getTenantById(tenantId);
    } else if (tenantSubdomain) {
      tenant = await getTenantBySubdomain(tenantSubdomain);
    }

    if (tenant) {
      const status = calculateTenantSubscriptionStatus(tenant);
      
      // Add subscription info to response headers
      res.setHeader('X-Subscription-Days-Remaining', status.daysRemaining.toString());
      res.setHeader('X-Subscription-Expired', status.isExpired.toString());
      res.setHeader('X-Subscription-Blocked', status.isBlocked.toString());
    }

    next();
  } catch (error) {
    // Ignore errors, just continue
    next();
  }
};

export default checkTenantSubscription;
