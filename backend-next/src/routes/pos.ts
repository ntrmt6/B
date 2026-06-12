import { Router, Request } from 'express';
import { z } from 'zod';
import { authenticateToken, extractTenantId } from '../middleware/auth';
import { getTenantData, setTenantData } from '../services/tenantDataService';
import { adjustStock } from '../services/inventorySync';
import { dispatchWebhook } from '../services/webhookService';
import { Server as SocketIOServer } from 'socket.io';
import { createAuditLog } from './auditLogs';

export const posRouter = Router();

posRouter.use(extractTenantId);

function getTenantId(req: Request): string | null {
  return (req as any).tenantId || (req.headers['x-tenant-id'] as string) || null;
}

function emitPosEvent(req: Request, tenantId: string, event: string, data: unknown) {
  const io = req.app.get('io') as SocketIOServer | undefined;
  if (io) {
    io.to(`tenant:${tenantId}`).emit(event, { tenantId, data, timestamp: Date.now() });
  }
}

// ─── Interfaces ───────────────────────────────────────────────

interface HardwareMapping {
  id: string;
  registerId: string;
  registerName: string;
  branchId: string;
  printerName?: string;
  printerIp?: string;
  receiptTemplate?: string;
  isActive: boolean;
  createdAt: string;
}

interface TaxRule {
  id: string;
  name: string;
  rate: number;          // Percentage, e.g. 15 = 15%
  type: 'inclusive' | 'exclusive';
  appliesTo: 'all' | 'category' | 'product';
  categoryId?: string;
  productId?: string | number;
  region?: string;
  isActive: boolean;
}

interface BOPISOrder {
  orderId: string;
  customerName: string;
  customerPhone?: string;
  items: Array<{ productId: string | number; productName: string; quantity: number }>;
  status: 'pending_pickup' | 'ready_for_pickup' | 'picked_up' | 'cancelled';
  onlineOrderDate: string;
  readyAt?: string;
  pickedUpAt?: string;
  assignedStaff?: string;
  branchId: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ReturnRequest {
  id: string;
  originalOrderId: string;
  customerName: string;
  customerPhone?: string;
  items: Array<{
    productId: string | number;
    productName: string;
    quantity: number;
    returnReason: string;
  }>;
  refundAmount: number;
  refundMethod: 'original_gateway' | 'cash' | 'store_credit';
  status: 'pending' | 'approved' | 'processed' | 'rejected';
  source: 'online' | 'pos';
  returnedToWarehouseId?: string;
  processedBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface OfflineTransaction {
  id: string;
  type: 'sale' | 'return' | 'adjustment';
  payload: Record<string, unknown>;
  createdAt: string;
  syncedAt?: string;
  status: 'pending' | 'synced' | 'failed';
  error?: string;
}

// ─── Hardware Mapping ─────────────────────────────────────────

/** GET /hardware — List hardware mappings */
posRouter.get('/hardware', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const mappings = (await getTenantData<HardwareMapping[]>(tenantId, 'pos_hardware_mappings')) || [];
    res.json({ data: mappings });
  } catch (error) {
    next(error);
  }
});

/** POST /hardware — Add hardware mapping */
posRouter.post('/hardware', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const schema = z.object({
      registerId: z.string().min(1),
      registerName: z.string().min(1),
      branchId: z.string().min(1),
      printerName: z.string().optional(),
      printerIp: z.string().optional(),
      receiptTemplate: z.string().optional(),
      isActive: z.boolean().default(true),
    });

    const data = schema.parse(req.body);
    const mappings = (await getTenantData<HardwareMapping[]>(tenantId, 'pos_hardware_mappings')) || [];

    const mapping: HardwareMapping = {
      ...data,
      id: `hw_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    };

    mappings.push(mapping);
    await setTenantData(tenantId, 'pos_hardware_mappings', mappings);

    res.status(201).json({ data: mapping, success: true });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    next(error);
  }
});

/** PUT /hardware/:id — Update hardware mapping */
posRouter.put('/hardware/:id', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const updateSchema = z.object({
      registerId: z.string().min(1).optional(),
      registerName: z.string().min(1).optional(),
      branchId: z.string().min(1).optional(),
      printerName: z.string().optional(),
      printerIp: z.string().optional(),
      receiptTemplate: z.string().optional(),
      isActive: z.boolean().optional(),
    });

    const updates = updateSchema.parse(req.body);
    const mappings = (await getTenantData<HardwareMapping[]>(tenantId, 'pos_hardware_mappings')) || [];
    const index = mappings.findIndex((m) => m.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Hardware mapping not found' });

    mappings[index] = { ...mappings[index], ...updates };
    await setTenantData(tenantId, 'pos_hardware_mappings', mappings);

    res.json({ data: mappings[index], success: true });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    next(error);
  }
});

/** DELETE /hardware/:id — Remove hardware mapping */
posRouter.delete('/hardware/:id', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const mappings = (await getTenantData<HardwareMapping[]>(tenantId, 'pos_hardware_mappings')) || [];
    const filtered = mappings.filter((m) => m.id !== req.params.id);
    if (filtered.length === mappings.length) return res.status(404).json({ error: 'Not found' });

    await setTenantData(tenantId, 'pos_hardware_mappings', filtered);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ─── Tax Configuration ────────────────────────────────────────

/** GET /tax-rules — List tax rules */
posRouter.get('/tax-rules', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const rules = (await getTenantData<TaxRule[]>(tenantId, 'pos_tax_rules')) || [];
    res.json({ data: rules });
  } catch (error) {
    next(error);
  }
});

/** PUT /tax-rules — Save tax rules (replaces all) */
posRouter.put('/tax-rules', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const schema = z.array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1),
        rate: z.number().min(0).max(100),
        type: z.enum(['inclusive', 'exclusive']),
        appliesTo: z.enum(['all', 'category', 'product']),
        categoryId: z.string().optional(),
        productId: z.union([z.string(), z.number()]).optional(),
        region: z.string().optional(),
        isActive: z.boolean().default(true),
      })
    );

    const rules: TaxRule[] = schema.parse(req.body.rules || req.body).map((r) => ({
      ...r,
      id: r.id || `tax_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    }));

    await setTenantData(tenantId, 'pos_tax_rules', rules);
    res.json({ data: rules, success: true });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    next(error);
  }
});

// ─── BOPIS (Buy Online, Pick Up In-Store) ─────────────────────

/** GET /bopis — List BOPIS orders */
posRouter.get('/bopis', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const orders = (await getTenantData<BOPISOrder[]>(tenantId, 'pos_bopis_orders')) || [];

    // Filter by status if requested
    const { status, branchId } = req.query;
    let filtered = orders;
    if (status) filtered = filtered.filter((o) => o.status === status);
    if (branchId) filtered = filtered.filter((o) => o.branchId === branchId);

    res.json({ data: filtered });
  } catch (error) {
    next(error);
  }
});

/** POST /bopis — Create a BOPIS order from an online order */
posRouter.post('/bopis', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const schema = z.object({
      orderId: z.string(),
      customerName: z.string(),
      customerPhone: z.string().optional(),
      items: z.array(z.object({
        productId: z.union([z.string(), z.number()]),
        productName: z.string(),
        quantity: z.number().positive(),
      })),
      branchId: z.string().default('main'),
      notes: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const orders = (await getTenantData<BOPISOrder[]>(tenantId, 'pos_bopis_orders')) || [];

    const now = new Date().toISOString();
    const bopis: BOPISOrder = {
      ...data,
      status: 'pending_pickup',
      onlineOrderDate: now,
      createdAt: now,
      updatedAt: now,
    };

    orders.unshift(bopis);
    await setTenantData(tenantId, 'pos_bopis_orders', orders);

    // Alert POS staff via Socket.IO
    emitPosEvent(req, tenantId, 'bopis-new', bopis);

    res.status(201).json({ data: bopis, success: true });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    next(error);
  }
});

/** PATCH /bopis/:orderId — Update BOPIS order status */
posRouter.patch('/bopis/:orderId', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const schema = z.object({
      status: z.enum(['pending_pickup', 'ready_for_pickup', 'picked_up', 'cancelled']),
      assignedStaff: z.string().optional(),
      notes: z.string().optional(),
    });

    const updates = schema.parse(req.body);
    const orders = (await getTenantData<BOPISOrder[]>(tenantId, 'pos_bopis_orders')) || [];
    const index = orders.findIndex((o) => o.orderId === req.params.orderId);
    if (index === -1) return res.status(404).json({ error: 'BOPIS order not found' });

    const now = new Date().toISOString();
    orders[index] = { ...orders[index], ...updates, updatedAt: now };
    if (updates.status === 'ready_for_pickup') orders[index].readyAt = now;
    if (updates.status === 'picked_up') orders[index].pickedUpAt = now;

    await setTenantData(tenantId, 'pos_bopis_orders', orders);

    emitPosEvent(req, tenantId, 'bopis-updated', orders[index]);

    try {
      await createAuditLog({
        tenantId,
        userId: (req as any).user?._id || 'system',
        userName: (req as any).user?.name || 'System',
        userRole: (req as any).user?.role || 'system',
        action: `BOPIS Status: ${updates.status}`,
        actionType: 'update',
        resourceType: 'order',
        resourceId: req.params.orderId,
        resourceName: `BOPIS ${req.params.orderId}`,
        details: `BOPIS order ${req.params.orderId} marked as ${updates.status}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'success',
      });
    } catch (auditError) {
      console.warn('[POS] Audit log failed:', auditError);
    }

    res.json({ data: orders[index], success: true });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    next(error);
  }
});

// ─── In-Store Returns ─────────────────────────────────────────

/** GET /returns — List return requests */
posRouter.get('/returns', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const returns = (await getTenantData<ReturnRequest[]>(tenantId, 'pos_returns')) || [];
    const { status } = req.query;
    const filtered = status ? returns.filter((r) => r.status === status) : returns;
    res.json({ data: filtered });
  } catch (error) {
    next(error);
  }
});

/** POST /returns — Create an in-store return for online/POS purchase */
posRouter.post('/returns', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const schema = z.object({
      originalOrderId: z.string(),
      customerName: z.string(),
      customerPhone: z.string().optional(),
      items: z.array(z.object({
        productId: z.union([z.string(), z.number()]),
        productName: z.string(),
        quantity: z.number().positive(),
        returnReason: z.string(),
      })),
      refundAmount: z.number().min(0),
      refundMethod: z.enum(['original_gateway', 'cash', 'store_credit']).default('cash'),
      source: z.enum(['online', 'pos']).default('pos'),
      returnedToWarehouseId: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const returns = (await getTenantData<ReturnRequest[]>(tenantId, 'pos_returns')) || [];

    const now = new Date().toISOString();
    const returnReq: ReturnRequest = {
      ...data,
      id: `ret_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      status: 'pending',
      processedBy: (req as any).user?.name,
      createdAt: now,
      updatedAt: now,
    };

    returns.unshift(returnReq);
    await setTenantData(tenantId, 'pos_returns', returns);

    emitPosEvent(req, tenantId, 'return-created', returnReq);
    await dispatchWebhook(tenantId, 'pos.return', { returnId: returnReq.id, ...data });

    res.status(201).json({ data: returnReq, success: true });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    next(error);
  }
});

/** PATCH /returns/:id — Process a return (approve/reject/complete) */
posRouter.patch('/returns/:id', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const schema = z.object({
      status: z.enum(['approved', 'processed', 'rejected']),
      returnedToWarehouseId: z.string().optional(),
    });

    const updates = schema.parse(req.body);
    const returns = (await getTenantData<ReturnRequest[]>(tenantId, 'pos_returns')) || [];
    const index = returns.findIndex((r) => r.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Return not found' });

    returns[index] = { ...returns[index], ...updates, updatedAt: new Date().toISOString() };

    // If processed, restock items
    if (updates.status === 'processed') {
      const warehouseId = updates.returnedToWarehouseId || returns[index].returnedToWarehouseId || 'default';
      for (const item of returns[index].items) {
        try {
          await adjustStock(tenantId, item.productId, warehouseId, item.quantity, {
            productId: item.productId,
            warehouseId,
            type: 'return',
            quantity: item.quantity,
            referenceId: returns[index].originalOrderId,
            note: `Return restock from order ${returns[index].originalOrderId}`,
            createdBy: (req as any).user?.name,
          });
        } catch (stockError) {
          console.warn('[POS] Stock adjustment failed for return:', stockError);
        }
      }
    }

    await setTenantData(tenantId, 'pos_returns', returns);

    try {
      await createAuditLog({
        tenantId,
        userId: (req as any).user?._id || 'system',
        userName: (req as any).user?.name || 'System',
        userRole: (req as any).user?.role || 'system',
        action: `Return ${updates.status}`,
        actionType: 'update',
        resourceType: 'order',
        resourceId: req.params.id,
        resourceName: `Return ${req.params.id}`,
        details: `Return ${req.params.id} for order ${returns[index].originalOrderId} marked as ${updates.status}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'success',
      });
    } catch (auditError) {
      console.warn('[POS] Audit log failed:', auditError);
    }

    res.json({ data: returns[index], success: true });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    next(error);
  }
});

// ─── Offline Transaction Sync ─────────────────────────────────

/** POST /offline-sync — Sync cached offline transactions */
posRouter.post('/offline-sync', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const schema = z.object({
      transactions: z.array(z.object({
        id: z.string(),
        type: z.enum(['sale', 'return', 'adjustment']),
        payload: z.record(z.unknown()),
        createdAt: z.string(),
      })),
    });

    const { transactions } = schema.parse(req.body);

    const results: Array<{ id: string; status: 'synced' | 'failed'; error?: string }> = [];
    const offlineLog = (await getTenantData<OfflineTransaction[]>(tenantId, 'pos_offline_log')) || [];

    for (const tx of transactions) {
      try {
        // Process each offline transaction based on type
        // The actual processing would delegate to order creation, stock adjustment, etc.
        offlineLog.push({
          ...tx,
          syncedAt: new Date().toISOString(),
          status: 'synced',
        });
        results.push({ id: tx.id, status: 'synced' });
      } catch (err) {
        offlineLog.push({
          ...tx,
          syncedAt: new Date().toISOString(),
          status: 'failed',
          error: err instanceof Error ? err.message : String(err),
        });
        results.push({ id: tx.id, status: 'failed', error: err instanceof Error ? err.message : String(err) });
      }
    }

    // Keep last 500 offline logs
    if (offlineLog.length > 500) offlineLog.length = 500;
    await setTenantData(tenantId, 'pos_offline_log', offlineLog);

    emitPosEvent(req, tenantId, 'offline-synced', { count: transactions.length });

    res.json({ data: results, success: true });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    next(error);
  }
});
