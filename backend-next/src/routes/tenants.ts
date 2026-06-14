import { Router } from 'express';
import { z } from 'zod';
import { 
  createTenant, 
  deleteTenant, 
  listTenants, 
  getTenantById, 
  getTenantBySubdomain,
  getTenantByCustomDomain,
  updateTenantStatus,
  updateTenant,
  updateTenantShopStatus,
  getTenantUsers,
  getTenantStats,
  getDashboardStats
} from '../services/tenantsService';
import { getTenantData, setTenantData } from '../services/tenantDataService';
import { env } from '../config/env';
import type { CreateTenantPayload, ShopStatus } from '../types/tenant';
import { authenticateToken, requireAdmin, requireRole } from '../middleware/auth';

const DEFAULT_SHOP_STATUS: ShopStatus = {
  isTrialing: false,
  isStartups: false,
  isEnterprise: false,
  isPremium: false,
  isExpired: false,
  isSuspended: false,
  isBlocked: false,
};

const createTenantSchema = z.object({
  name: z.string().min(2),
  subdomain: z.string().min(2),
  contactEmail: z.string().email(),
  contactName: z.string().optional(),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(6),
  phone: z.string().optional(),
  plan: z.enum(['starter', 'growth', 'enterprise']).optional()
});

// Public registration schema (same as create but for self-registration)
const publicRegisterSchema = z.object({
  name: z.string().min(2, 'Shop name must be at least 2 characters'),
  subdomain: z.string().min(2, 'Subdomain must be at least 2 characters').max(30),
  contactEmail: z.string().email('Invalid email address'),
  contactName: z.string().min(2, 'Name must be at least 2 characters'),
  adminEmail: z.string().email('Invalid email address'),
  adminPassword: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  plan: z.enum(['starter', 'growth', 'enterprise']).optional()
});

// Reserved subdomains that cannot be used
const RESERVED_SUBDOMAINS = [
  'www', 'admin', 'superadmin', 'api', 'app', 'mail', 'smtp', 'ftp', 
  'cpanel', 'webmail', 'ns1', 'ns2', 'test', 'demo', 'staging', 'dev',
  'blog', 'shop', 'store', 'help', 'support', 'status', 'cdn', 'static',
  'images', 'assets', 'files', 'media', 'download', 'uploads'
];

const updateTenantSchema = z.object({
  name: z.string().min(2).optional(),
  contactEmail: z.string().email().optional(),
  contactName: z.string().optional(),
  customDomain: z.string().optional().nullable(),
  plan: z.enum(['starter', 'growth', 'enterprise']).optional(),
  branding: z.record(z.any()).optional(),
  settings: z.record(z.any()).optional()
});

const updateStatusSchema = z.object({
  status: z.enum(['trialing', 'active', 'suspended', 'archived'])
});

const updateShopStatusSchema = z.object({
  isTrialing: z.boolean().optional(),
  isStartups: z.boolean().optional(),
  isEnterprise: z.boolean().optional(),
  isPremium: z.boolean().optional(),
  isExpired: z.boolean().optional(),
  isSuspended: z.boolean().optional(),
  isBlocked: z.boolean().optional(),
});

export const tenantsRouter = Router();

// ==================== PUBLIC ROUTES (No Auth Required) ====================

// GET /api/tenants/check-subdomain/:subdomain - Check if subdomain is available (PUBLIC)
tenantsRouter.get('/check-subdomain/:subdomain', async (req, res) => {
  try {
    const subdomain = req.params.subdomain.toLowerCase().trim();
    
    // Validate subdomain format
    if (subdomain.length < 3) {
      return res.json({ available: false, reason: 'Subdomain must be at least 2 characters' });
    }
    
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(subdomain) && subdomain.length > 2) {
      return res.json({ available: false, reason: 'Invalid subdomain format' });
    }
    
    // Check reserved subdomains
    if (RESERVED_SUBDOMAINS.includes(subdomain)) {
      return res.json({ available: false, reason: 'This subdomain is reserved' });
    }
    
    // Check if subdomain exists
    const existing = await getTenantBySubdomain(subdomain);
    
    res.json({ 
      available: !existing,
      reason: existing ? 'Subdomain already in use' : null
    });
  } catch (error) {
    console.error('Subdomain check error:', error);
    res.status(500).json({ available: false, reason: 'Check failed' });
  }
});

// POST /api/tenants/register - Public tenant registration (14-day trial)
tenantsRouter.post('/register', async (req, res) => {
  try {
    const payload = publicRegisterSchema.parse(req.body);
    const subdomain = payload.subdomain.toLowerCase().trim();
    
    // Validate subdomain isn't reserved
    if (RESERVED_SUBDOMAINS.includes(subdomain)) {
      return res.status(400).json({ error: 'This subdomain is reserved and cannot be used' });
    }
    
    // Create tenant with trial status
    const tenantPayload: CreateTenantPayload = {
      name: payload.name.trim(),
      subdomain: subdomain,
      contactEmail: payload.contactEmail.trim().toLowerCase(),
      contactName: payload.contactName?.trim(),
      adminEmail: payload.adminEmail.trim().toLowerCase(),
      adminPassword: payload.adminPassword,
      plan: 'starter' // Default to starter plan for self-registration
    };
    
    const tenant = await createTenant(tenantPayload);
    
    // Calculate trial end date (14 days from now)
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);
    
    res.status(201).json({ 
      success: true,
      data: {
        id: tenant._id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        status: 'trialing',
        trialEndsAt: trialEndDate.toISOString(),
        shopUrl: `https://${tenant.subdomain}.${env.primaryDomain || 'localhost'}`,
        adminUrl: `https://admin.${env.primaryDomain || 'localhost'}`
      },
      message: `🎉 Your shop "${tenant.name}" has been created! 14-day free trial started.`
    });
  } catch (error) {
    console.error('Public registration error:', error);
    
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return res.status(400).json({ error: firstError.message });
    }
    
    if (error instanceof Error) {
      // Handle specific error messages
      if (error.message.includes('Subdomain already in use')) {
        return res.status(400).json({ error: 'এই সাবডোমেইন ইতোমধ্যে ব্যবহৃত হয়েছে। অন্য একটি বেছে নিন।' });
      }
      if (error.message.includes('Admin email already registered')) {
        return res.status(400).json({ error: 'এই ইমেইল দিয়ে আগেই রেজিস্ট্রেশন করা হয়েছে।' });
      }
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// GET /api/tenants/by-domain/:domain - Get tenant by custom domain (PUBLIC)
// Used by frontend to resolve tenant when accessing via custom domain like shopbdit.com
tenantsRouter.get('/by-domain/:domain', async (req, res) => {
  try {
    const domain = req.params.domain.toLowerCase().trim();
    
    // Validate domain format
    if (!domain || !/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(domain)) {
      return res.status(400).json({ error: 'Invalid domain format' });
    }
    
    // Find tenant with this custom domain
    const tenant = await getTenantByCustomDomain(domain);
    
    if (!tenant || tenant.status === 'archived') {
      return res.status(404).json({ error: 'No tenant found for this domain' });
    }
    
    res.json({ 
      tenantId: tenant.subdomain,
      subdomain: tenant.subdomain,
      name: tenant.name
    });
  } catch (error) {
    console.error('Domain lookup error:', error);
    res.status(500).json({ error: 'Domain lookup failed' });
  }
});

// ==================== PROTECTED ROUTES ====================

// GET /api/tenants - List all tenants
tenantsRouter.get('/', authenticateToken, requireAdmin, 
  async (_req, res, next) => {
    try {
      const tenants = await listTenants();
      res.json({ data: tenants });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/tenants/dashboard-stats - Get aggregated dashboard stats (super_admin)
tenantsRouter.get('/dashboard-stats', authenticateToken, requireRole('super_admin'),
  async (_req, res, next) => {
    try {
      const stats = await getDashboardStats();
      res.json({ data: stats });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/tenants/export - Export tenants as CSV (super_admin)
tenantsRouter.get('/export', authenticateToken, requireRole('super_admin'),
  async (_req, res, next) => {
    try {
      const tenants = await listTenants();
      
      // Generate CSV
      const headers = ['Name', 'Subdomain', 'Contact Email', 'Plan', 'Status', 'Created At'];
      const csvRows = [headers.join(',')];
      
      for (const tenant of tenants) {
        const row = [
          `"${(tenant.name || '').replace(/"/g, '""')}"`,
          tenant.subdomain || '',
          tenant.contactEmail || '',
          tenant.plan || 'starter',
          tenant.status || 'active',
          tenant.createdAt || ''
        ];
        csvRows.push(row.join(','));
      }
      
      const csv = csvRows.join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="tenants-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/tenants/resolve/:subdomain - Resolve tenant by subdomain (public)
tenantsRouter.get('/resolve/:subdomain', async (req, res, next) => {
  try {
    const tenant = await getTenantBySubdomain(req.params.subdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    // Only return public info
    res.json({ 
      data: {
        id: String(tenant._id),
        name: tenant.name,
        subdomain: tenant.subdomain,
        status: tenant.status,
        branding: tenant.branding
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/tenants/:id - Get tenant by ID
tenantsRouter.get('/:id', authenticateToken, 
  async (req, res, next) => {
    try {
      const tenant = await getTenantById(req.params.id);
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }
      
      res.json({ data: tenant });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/tenants/:id/users - Get tenant users
tenantsRouter.get('/:id/users', authenticateToken, requireAdmin,
  async (req, res, next) => {
    try {
      const users = await getTenantUsers(req.params.id);
      res.json({ data: users });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/tenants/:id/stats - Get tenant statistics
tenantsRouter.get('/:id/stats', authenticateToken, requireAdmin,
  async (req, res, next) => {
    try {
      const stats = await getTenantStats(req.params.id);
      res.json({ data: stats });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/tenants - Create new tenant
tenantsRouter.post('/', authenticateToken, requireRole('super_admin'), 
  async (req, res, next) => {
    try {
      const payload = createTenantSchema.parse(req.body) as CreateTenantPayload;
      const tenant = await createTenant(payload);
      res.status(201).json({ 
        data: tenant,
        message: `Tenant "${tenant.name}" created successfully with admin user ${tenant.adminEmail}`
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }
);

// PUT /api/tenants/:id - Update tenant
tenantsRouter.put('/:id', authenticateToken, requireAdmin,
  async (req, res, next) => {
    try {
      const updates = updateTenantSchema.parse(req.body);
      const tenant = await updateTenant(req.params.id, updates);
      res.json({ data: tenant });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      next(error);
    }
  }
);

// PATCH /api/tenants/:id/status - Update tenant status
tenantsRouter.patch('/:id/status', authenticateToken, requireRole('super_admin'), 
  async (req, res, next) => {
    try {
      const { status } = updateStatusSchema.parse(req.body);
      await updateTenantStatus(req.params.id, status);
      res.json({ data: { id: req.params.id, status } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      next(error);
    }
  }
);

// PATCH /api/tenants/:id/shop-status - Update tenant shop status (super admin only)
tenantsRouter.patch('/:id/shop-status', authenticateToken, requireRole('super_admin'),
  async (req, res, next) => {
    try {
      const shopStatus = updateShopStatusSchema.parse(req.body);
      const tenant = await getTenantById(req.params.id);
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }
      const updatedShopStatus = { ...DEFAULT_SHOP_STATUS, ...(tenant.shopStatus || {}), ...shopStatus };
      await updateTenantShopStatus(req.params.id, updatedShopStatus);
      res.json({ data: { id: req.params.id, shopStatus: updatedShopStatus } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      next(error);
    }
  }
);

// DELETE /api/tenants/:id - Delete tenant
tenantsRouter.delete('/:id', authenticateToken, requireRole('super_admin'), 
  async (req, res, next) => {
    try {
      await deleteTenant(req.params.id);
      res.json({ data: { id: req.params.id }, message: 'Tenant deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/tenants/:id/setup-domain - Setup custom domain
tenantsRouter.post('/:id/setup-domain', authenticateToken, requireAdmin,
  async (req, res, next) => {
    try {
      const { customDomain } = z.object({
        customDomain: z.string().min(3).regex(/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/, 'Invalid domain format')
      }).parse(req.body);

      const tenantId = req.params.id;

      // Get tenant to verify it exists
      const tenant = await getTenantById(tenantId);
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      // Check if domain is already used by another tenant
      const existingTenant = await getTenantByCustomDomain(customDomain.toLowerCase());
      if (existingTenant && existingTenant._id?.toString() !== tenantId && existingTenant.subdomain !== tenantId) {
        return res.status(400).json({
          error: 'This domain is already registered to another shop'
        });
      }

      // Save the custom domain to the tenant
      await updateTenant(tenantId, { customDomain: customDomain.toLowerCase() });

      console.log(`[Domain Setup] Custom domain "${customDomain}" saved for tenant: ${tenantId}`);

      res.json({
        success: true,
        data: {
          customDomain: customDomain.toLowerCase(),
          tenantId,
          message: 'Custom domain saved successfully. Please configure your DNS settings as instructed.',
          dnsInstructions: {
            aRecord: {
              type: 'A',
              name: '@',
              value: '159.198.47.126',
              ttl: 'Auto'
            },
            cnameRecord: {
              type: 'CNAME',
              name: 'www',
              value: customDomain.toLowerCase(),
              ttl: 'Auto'
            },
            notes: 'Set Proxy Status to Proxied and SSL mode to Flexible in Cloudflare. Allow up to 24 hours for DNS propagation.'
          }
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      next(error);
    }
  }
);

// GET /api/tenants/:id/verify-domain - Verify DNS for a domain
tenantsRouter.get('/:id/verify-domain',
  async (req, res, next) => {
    try {
      const { domain } = z.object({
        domain: z.string().min(3)
      }).parse(req.query);

      const dns = require('dns').promises;
      const targetIP = '159.198.47.126';

      let aRecordValid = false;
      let cnameValid = false;
      let aRecordValue = null;
      let cnameValue = null;

      // Check A record for the domain
      try {
        const addresses = await dns.resolve4(domain);
        aRecordValue = addresses[0] || null;
        aRecordValid = addresses.includes(targetIP);
      } catch (e) {
        // A record not found or DNS error
      }

      // Check CNAME for www subdomain
      try {
        const cnames = await dns.resolveCname(`www.${domain}`);
        cnameValue = cnames[0] || null;
        cnameValid = cnames.some((cname: string) =>
          cname.toLowerCase() === domain.toLowerCase() ||
          cname.toLowerCase() === `${domain}.`.toLowerCase()
        );
      } catch (e) {
        // CNAME not found - might be using A record for www instead
        try {
          const wwwAddresses = await dns.resolve4(`www.${domain}`);
          if (wwwAddresses.includes(targetIP)) {
            cnameValid = true;
            cnameValue = 'A record pointing to server';
          }
        } catch (e2) {
          // www subdomain not configured
        }
      }

      const dnsVerified = aRecordValid;

      res.json({
        success: dnsVerified,
        dnsVerified,
        domain,
        dnsStatus: {
          aRecord: {
            valid: aRecordValid,
            value: aRecordValue,
            expected: targetIP
          },
          cname: {
            valid: cnameValid,
            value: cnameValue,
            expected: domain
          }
        },
        message: dnsVerified
          ? 'DNS is properly configured!'
          : 'DNS is not yet configured. Please add the A record pointing to ' + targetIP
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      next(error);
    }
  }
);

// DELETE /api/tenants/:id/custom-domain - Remove custom domain
tenantsRouter.delete('/:id/custom-domain', authenticateToken, requireAdmin,
  async (req, res, next) => {
    try {
      const tenantId = req.params.id;

      const tenant = await getTenantById(tenantId);
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      if (!tenant.customDomain) {
        return res.status(400).json({ error: 'No custom domain configured' });
      }

      const customDomain = tenant.customDomain;

      // Remove the custom domain from the tenant
      await updateTenant(tenantId, { customDomain: null });

      console.log(`[Domain Removal] Custom domain "${customDomain}" removed for tenant: ${tenantId}`);

      res.json({
        success: true,
        message: 'Custom domain removed successfully',
        domain: customDomain
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== APP REQUEST ROUTES ====================

// Schema for app request
const appRequestSchema = z.object({
  appTitle: z.string().min(2, 'App title must be at least 2 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  platforms: z.object({
    android: z.boolean(),
    ios: z.boolean()
  }),
  priority: z.enum(['Low', 'Standard', 'High (ASAP)'])
});

// Interface for app request
interface AppRequest {
  id: string;
  tenantId: string;
  tenantName?: string;
  appTitle: string;
  description: string;
  platforms: { android: boolean; ios: boolean };
  priority: 'Low' | 'Standard' | 'High (ASAP)';
  status: 'pending' | 'in-progress' | 'completed' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

// POST /api/tenants/:id/app-requests - Create new app request
tenantsRouter.post('/:id/app-requests', async (req, res, next) => {
  try {
    const tenantId = req.params.id;
    const validation = appRequestSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.error.errors 
      });
    }
    
    const { appTitle, description, platforms, priority } = validation.data;
    
    // Get tenant info
    const tenant = await getTenantById(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    // Get existing app requests for this tenant
    const existingRequests = await getTenantData<AppRequest[]>(tenantId, 'app_requests') || [];
    
    // Create new request
    const newRequest: AppRequest = {
      id: `apr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tenantId,
      tenantName: tenant.name,
      appTitle,
      description,
      platforms,
      priority,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Save to tenant's data
    await setTenantData(tenantId, 'app_requests', [...existingRequests, newRequest]);
    
    // Also save to global app requests for super admin view
    const globalRequests = await getTenantData<AppRequest[]>('global', 'all_app_requests') || [];
    await setTenantData('global', 'all_app_requests', [...globalRequests, newRequest]);
    
    console.log(`[AppRequest] New request created for tenant ${tenantId}:`, newRequest.id);
    
    res.status(201).json({ 
      success: true, 
      message: 'App request submitted successfully',
      request: newRequest 
    });
  } catch (error) {
    console.error('Error creating app request:', error);
    next(error);
  }
});

// GET /api/tenants/:id/app-requests - Get app requests for a tenant
tenantsRouter.get('/:id/app-requests', async (req, res, next) => {
  try {
    const tenantId = req.params.id;
    const requests = await getTenantData<AppRequest[]>(tenantId, 'app_requests') || [];
    res.json({ success: true, requests });
  } catch (error) {
    next(error);
  }
});

// GET /api/tenants/app-requests/all - Get ALL app requests (for super admin)
tenantsRouter.get('/app-requests/all', authenticateToken, requireRole('super_admin'), async (req, res, next) => {
  try {
    const allRequests = await getTenantData<AppRequest[]>('global', 'all_app_requests') || [];
    // Sort by createdAt descending (newest first)
    allRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ success: true, requests: allRequests });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/tenants/app-requests/:requestId/status - Update app request status (super admin)
tenantsRouter.patch('/app-requests/:requestId/status', authenticateToken, requireRole('super_admin'), async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'in-progress', 'completed', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    // Update in global list
    const allRequests = await getTenantData<AppRequest[]>('global', 'all_app_requests') || [];
    const requestIndex = allRequests.findIndex(r => r.id === requestId);
    
    if (requestIndex === -1) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    const request = allRequests[requestIndex];
    request.status = status;
    request.updatedAt = new Date().toISOString();
    allRequests[requestIndex] = request;
    
    await setTenantData('global', 'all_app_requests', allRequests);
    
    // Also update in tenant's data
    const tenantRequests = await getTenantData<AppRequest[]>(request.tenantId, 'app_requests') || [];
    const tenantRequestIndex = tenantRequests.findIndex(r => r.id === requestId);
    if (tenantRequestIndex !== -1) {
      tenantRequests[tenantRequestIndex] = request;
      await setTenantData(request.tenantId, 'app_requests', tenantRequests);
    }
    
    res.json({ success: true, request });
  } catch (error) {
    next(error);
  }
});
