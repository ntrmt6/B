import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticateToken, requireAdmin, requirePermission } from '../middleware/auth';
import {
  createVendor,
  getVendors,
  getVendorById,
  updateVendor,
  deleteVendor,
  getVendorSubOrders,
  calculateOrderCommissions,
  splitOrderByVendor,
  revalidateVendorData,
} from '../services/vendorService';
import { createAuditLog } from './auditLogs';

export const vendorRouter = Router();

// ─── Validation Schemas ────────────────────────────────────────────────────

const createVendorSchema = z.object({
  name: z.string().min(1, 'Vendor name is required').trim(),
  slug: z.string().min(1, 'Vendor slug is required').trim().toLowerCase(),
  email: z.string().email('Valid email is required').trim().toLowerCase(),
  phone: z.string().optional(),
  description: z.string().optional(),
  logo: z.string().optional(),
  commissionRate: z.number().min(0).max(100).default(10),
  status: z.enum(['pending', 'active', 'suspended', 'rejected']).default('pending'),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  bankInfo: z.object({
    accountName: z.string().optional(),
    accountNumber: z.string().optional(),
    bankName: z.string().optional(),
    routingNumber: z.string().optional(),
  }).optional(),
});

const updateVendorSchema = createVendorSchema.partial();

const setupDomainSchema = z.object({
  customDomain: z.string().min(3, 'Domain must be at least 3 characters').trim().toLowerCase(),
});

const splitOrderSchema = z.object({
  masterOrderId: z.string().min(1),
  customer: z.string().min(1),
  phone: z.string().optional(),
  email: z.preprocess(
    (val) => (val === '' || val === undefined || val === null) ? undefined : val,
    z.string().email().optional()
  ),
  location: z.string().optional(),
  items: z.array(z.object({
    productId: z.union([z.number(), z.string()]).optional(),
    id: z.union([z.number(), z.string()]).optional(),
    vendorId: z.string().optional(),
    price: z.number().optional(),
    quantity: z.number().optional(),
    name: z.string().optional(),
    image: z.string().optional(),
    variant: z.object({ color: z.string(), size: z.string() }).optional(),
  }).passthrough()),
  date: z.string(),
  status: z.string().default('Confirmed'),
});

// ─── Routes ────────────────────────────────────────────────────────────────

import { Vendor } from '../models/Vendor';
import dns from 'dns';
import { promisify } from 'util';

const dnsResolve4 = promisify(dns.resolve4);
const dnsResolveCname = promisify(dns.resolveCname);

const SERVER_IP = '159.198.47.126';

// GET /api/vendors/by-domain/:domain — Get vendor by custom domain (PUBLIC - must be before :tenantId routes)
vendorRouter.get(
  '/by-domain/:domain',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { domain } = req.params;
      const vendor = await Vendor.findOne({
        customDomain: domain.toLowerCase(),
        status: 'active'
      });

      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }

      res.json({ data: vendor });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/vendors/:tenantId — List all vendors for a tenant
vendorRouter.get(
  '/:tenantId',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req.params;
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const vendors = await getVendors(tenantId, status);
      res.json({ data: vendors });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/vendors/:tenantId/:vendorId — Get single vendor
vendorRouter.get(
  '/:tenantId/:vendorId',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, vendorId } = req.params;
      const vendor = await getVendorById(tenantId, vendorId);
      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }
      res.json({ data: vendor });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/vendors/:tenantId — Create a new vendor
vendorRouter.post(
  '/:tenantId',
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req.params;
      const parsed = createVendorSchema.parse(req.body);
      const vendor = await createVendor(tenantId, parsed);

      // Audit log
      try {
        await createAuditLog({
          tenantId,
          userId: req.userId || '',
          userName: (req as any).user?.name || '',
          userRole: (req as any).userRole || '',
          action: 'Created vendor: ' + vendor.name,
          actionType: 'create',
          resourceType: 'other',
          resourceId: vendor._id.toString(),
          resourceName: vendor.name,
          details: `Created vendor ${vendor.name} (${vendor.email})`,
        });
      } catch { /* non-blocking */ }

      revalidateVendorData(tenantId);
      res.status(201).json({ data: vendor });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      next(error);
    }
  }
);

// PUT /api/vendors/:tenantId/:vendorId — Update a vendor
vendorRouter.put(
  '/:tenantId/:vendorId',
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, vendorId } = req.params;
      const parsed = updateVendorSchema.parse(req.body);
      const vendor = await updateVendor(tenantId, vendorId, parsed);
      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }

      try {
        await createAuditLog({
          tenantId,
          userId: req.userId || '',
          userName: (req as any).user?.name || '',
          userRole: (req as any).userRole || '',
          action: 'Updated vendor: ' + vendorId,
          actionType: 'update',
          resourceType: 'other',
          resourceId: vendorId,
          details: `Updated vendor fields: ${Object.keys(parsed).join(', ')}`,
        });
      } catch { /* non-blocking */ }

      revalidateVendorData(tenantId);
      res.json({ data: vendor });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      next(error);
    }
  }
);

// DELETE /api/vendors/:tenantId/:vendorId — Delete a vendor
vendorRouter.delete(
  '/:tenantId/:vendorId',
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, vendorId } = req.params;
      const deleted = await deleteVendor(tenantId, vendorId);
      if (!deleted) {
        return res.status(404).json({ error: 'Vendor not found' });
      }

      try {
        await createAuditLog({
          tenantId,
          userId: req.userId || '',
          userName: (req as any).user?.name || '',
          userRole: (req as any).userRole || '',
          action: 'Deleted vendor: ' + vendorId,
          actionType: 'delete',
          resourceType: 'other',
          resourceId: vendorId,
          details: `Deleted vendor ${vendorId}`,
        });
      } catch { /* non-blocking */ }

      revalidateVendorData(tenantId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/vendors/:tenantId/:vendorId/sub-orders — Get sub-orders for a vendor
vendorRouter.get(
  '/:tenantId/:vendorId/sub-orders',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, vendorId } = req.params;
      const subOrders = await getVendorSubOrders(tenantId, vendorId);
      res.json({ data: subOrders });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/vendors/:tenantId/split-order — Split a master order into sub-orders
vendorRouter.post(
  '/:tenantId/split-order',
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req.params;
      const parsed = splitOrderSchema.parse(req.body);
      const subOrders = await splitOrderByVendor(tenantId, {
        id: parsed.masterOrderId,
        customer: parsed.customer,
        phone: parsed.phone,
        email: parsed.email,
        location: parsed.location,
        items: parsed.items,
        date: parsed.date,
        status: parsed.status,
      });
      res.json({ data: subOrders, count: subOrders.length });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      next(error);
    }
  }
);

// POST /api/vendors/:tenantId/calculate-commission — Preview commission breakdown
vendorRouter.post(
  '/:tenantId/calculate-commission',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req.params;
      const { items } = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'items array is required' });
      }
      const commissions = await calculateOrderCommissions(tenantId, items);
      res.json({ data: commissions });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Vendor Domain Routes ───────────────────────────────────────────────────

// POST /api/vendors/:tenantId/:vendorId/setup-domain — Setup custom domain for vendor
vendorRouter.post(
  '/:tenantId/:vendorId/setup-domain',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, vendorId } = req.params;
      const parsed = setupDomainSchema.parse(req.body);
      const customDomain = parsed.customDomain.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/.*$/, '');

      // Validate domain format
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
      if (!domainRegex.test(customDomain)) {
        return res.status(400).json({ error: 'Invalid domain format' });
      }

      // Check if domain is already in use by another vendor
      const existingVendor = await Vendor.findOne({
        customDomain,
        _id: { $ne: vendorId }
      });
      if (existingVendor) {
        return res.status(400).json({ error: 'This domain is already in use by another vendor' });
      }

      // Update vendor with custom domain
      const vendor = await Vendor.findOneAndUpdate(
        { _id: vendorId, tenantId },
        { customDomain, domainVerified: false },
        { new: true }
      );

      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }

      // Audit log
      try {
        await createAuditLog({
          tenantId,
          userId: req.userId || '',
          userName: (req as any).user?.name || '',
          userRole: (req as any).userRole || '',
          action: 'Setup custom domain for vendor: ' + vendor.name,
          actionType: 'update',
          resourceType: 'other',
          resourceId: vendorId,
          resourceName: vendor.name,
          details: `Set custom domain to ${customDomain}`,
        });
      } catch { /* non-blocking */ }

      res.json({
        success: true,
        customDomain,
        dnsInstructions: {
          aRecord: { type: 'A', name: '@', value: SERVER_IP, ttl: 'Auto' },
          cnameRecord: { type: 'CNAME', name: 'www', value: customDomain, ttl: 'Auto' },
          notes: 'Set Proxy Status to Proxied and SSL mode to Flexible in Cloudflare',
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      next(error);
    }
  }
);

// GET /api/vendors/:tenantId/:vendorId/verify-domain — Verify DNS records for vendor domain
vendorRouter.get(
  '/:tenantId/:vendorId/verify-domain',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, vendorId } = req.params;
      const domain = typeof req.query.domain === 'string' ? req.query.domain : undefined;

      const vendor = await Vendor.findOne({ _id: vendorId, tenantId });
      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }

      const domainToVerify = domain || vendor.customDomain;
      if (!domainToVerify) {
        return res.status(400).json({ error: 'No domain to verify' });
      }

      let aRecordValid = false;
      let aRecordValue: string | null = null;
      let cnameValid = false;
      let cnameValue: string | null = null;

      // Check A record
      try {
        const aRecords = await dnsResolve4(domainToVerify);
        if (aRecords && aRecords.length > 0) {
          aRecordValue = aRecords[0];
          aRecordValid = aRecords.includes(SERVER_IP);
        }
      } catch {
        // DNS lookup failed, record not found
      }

      // Check CNAME for www subdomain
      try {
        const cnameRecords = await dnsResolveCname(`www.${domainToVerify}`);
        if (cnameRecords && cnameRecords.length > 0) {
          cnameValue = cnameRecords[0];
          cnameValid = cnameRecords.some(r =>
            r.toLowerCase().replace(/\.$/, '') === domainToVerify.toLowerCase()
          );
        }
      } catch {
        // CNAME lookup failed
      }

      const dnsVerified = aRecordValid;

      // Update vendor verification status if checking their saved domain
      if (!domain && vendor.customDomain === domainToVerify && dnsVerified !== vendor.domainVerified) {
        await Vendor.updateOne(
          { _id: vendorId, tenantId },
          { domainVerified: dnsVerified }
        );
      }

      res.json({
        dnsVerified,
        dnsStatus: {
          aRecord: {
            valid: aRecordValid,
            value: aRecordValue,
            expected: SERVER_IP,
          },
          cname: {
            valid: cnameValid,
            value: cnameValue,
            expected: domainToVerify,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/vendors/:tenantId/:vendorId/custom-domain — Remove custom domain from vendor
vendorRouter.delete(
  '/:tenantId/:vendorId/custom-domain',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, vendorId } = req.params;

      const vendor = await Vendor.findOneAndUpdate(
        { _id: vendorId, tenantId },
        { $unset: { customDomain: 1, domainVerified: 1 } },
        { new: true }
      );

      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }

      // Audit log
      try {
        await createAuditLog({
          tenantId,
          userId: req.userId || '',
          userName: (req as any).user?.name || '',
          userRole: (req as any).userRole || '',
          action: 'Removed custom domain for vendor: ' + vendor.name,
          actionType: 'update',
          resourceType: 'other',
          resourceId: vendorId,
          resourceName: vendor.name,
          details: 'Removed custom domain',
        });
      } catch { /* non-blocking */ }

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);
