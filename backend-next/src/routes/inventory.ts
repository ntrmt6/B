import { Router, Request } from 'express';
import { z } from 'zod';
import { Server as SocketIOServer } from 'socket.io';
import { authenticateToken, extractTenantId } from '../middleware/auth';
import { createAuditLog } from './auditLogs';
import {
  getWarehouses,
  setWarehouses,
  getBufferStockRules,
  setBufferStockRules,
  getStockEntries,
  adjustStock,
  transferStock,
  isProductAvailable,
  checkBulkAvailability,
  WarehouseNode,
  BufferStockRule,
  StockMovement,
} from '../services/inventorySync';
import { getTenantData } from '../services/tenantDataService';
import { dispatchWebhook } from '../services/webhookService';

export const inventoryRouter = Router();

inventoryRouter.use(extractTenantId);

function getTenantId(req: Request): string | null {
  return (req as any).tenantId || req.headers['x-tenant-id'] as string || null;
}

function emitInventoryUpdate(req: Request, tenantId: string, event: string, data: unknown) {
  const io = req.app.get('io') as SocketIOServer | undefined;
  if (io) {
    io.to(`tenant:${tenantId}`).emit(event, { tenantId, data, timestamp: Date.now() });
  }
}

// ─── Warehouse Management ─────────────────────────────────────

/** GET /warehouses — List all warehouses */
inventoryRouter.get('/warehouses', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const warehouses = await getWarehouses(tenantId);
    res.json({ data: warehouses });
  } catch (error) {
    next(error);
  }
});

/** POST /warehouses — Add a warehouse */
inventoryRouter.post('/warehouses', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const schema = z.object({
      name: z.string().min(1),
      branchId: z.string().min(1),
      address: z.string().optional(),
      isDefault: z.boolean().default(false),
    });

    const data = schema.parse(req.body);
    const warehouses = await getWarehouses(tenantId);
    const newWarehouse: WarehouseNode = {
      ...data,
      id: `wh_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    };

    // If new warehouse is default, unset others
    if (data.isDefault) {
      warehouses.forEach((w) => (w.isDefault = false));
    }

    warehouses.push(newWarehouse);
    await setWarehouses(tenantId, warehouses);

    try {
      await createAuditLog({
        tenantId,
        userId: (req as any).user?._id || 'system',
        userName: (req as any).user?.name || 'System',
        userRole: (req as any).user?.role || 'system',
        action: 'Warehouse Created',
        actionType: 'create',
        resourceType: 'inventory',
        resourceId: newWarehouse.id,
        resourceName: newWarehouse.name,
        details: `Warehouse "${newWarehouse.name}" created for branch ${newWarehouse.branchId}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'success',
      });
    } catch (auditError) {
      console.warn('[Inventory] Audit log failed:', auditError);
    }

    res.status(201).json({ data: newWarehouse, success: true });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    next(error);
  }
});

/** DELETE /warehouses/:id — Remove a warehouse */
inventoryRouter.delete('/warehouses/:id', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const warehouses = await getWarehouses(tenantId);
    const filtered = warehouses.filter((w) => w.id !== req.params.id);
    if (filtered.length === warehouses.length) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    await setWarehouses(tenantId, filtered);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ─── Buffer Stock Rules ───────────────────────────────────────

/** GET /buffer-rules — List buffer stock rules */
inventoryRouter.get('/buffer-rules', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const rules = await getBufferStockRules(tenantId);
    res.json({ data: rules });
  } catch (error) {
    next(error);
  }
});

/** PUT /buffer-rules — Save buffer stock rules (replaces all) */
inventoryRouter.put('/buffer-rules', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const schema = z.array(
      z.object({
        productId: z.union([z.string(), z.number()]),
        threshold: z.number().min(0),
        warehouseId: z.string().optional(),
      })
    );

    const rules = schema.parse(req.body.rules || req.body);
    await setBufferStockRules(tenantId, rules);
    res.json({ data: rules, success: true });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    next(error);
  }
});

// ─── Stock Operations ─────────────────────────────────────────

/** GET /stock — List all stock entries */
inventoryRouter.get('/stock', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const entries = await getStockEntries(tenantId);
    const warehouses = await getWarehouses(tenantId);
    const rules = await getBufferStockRules(tenantId);

    // Enrich stock entries with warehouse names and buffer status
    const enriched = entries.map((entry) => {
      const warehouse = warehouses.find((w) => w.id === entry.warehouseId);
      const rule = rules.find(
        (r) =>
          String(r.productId) === String(entry.productId) &&
          (!r.warehouseId || r.warehouseId === entry.warehouseId)
      );
      return {
        ...entry,
        warehouseName: warehouse?.name || entry.warehouseId,
        bufferThreshold: rule?.threshold || 0,
        availableOnline: entry.quantity - entry.reservedQuantity > (rule?.threshold || 0),
      };
    });

    res.json({ data: enriched });
  } catch (error) {
    next(error);
  }
});

/** POST /stock/adjust — Adjust stock for a product */
inventoryRouter.post('/stock/adjust', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const schema = z.object({
      productId: z.union([z.string(), z.number()]),
      warehouseId: z.string().default('default'),
      quantity: z.number(),
      type: z.enum(['sale', 'purchase', 'adjustment', 'return']),
      orderId: z.string().optional(),
      note: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const { entry, movement } = await adjustStock(
      tenantId,
      data.productId,
      data.warehouseId,
      data.quantity,
      {
        productId: data.productId,
        warehouseId: data.warehouseId,
        type: data.type,
        quantity: data.quantity,
        orderId: data.orderId,
        note: data.note,
        createdBy: (req as any).user?.name || 'system',
      }
    );

    // Emit real-time stock update
    emitInventoryUpdate(req, tenantId, 'stock-updated', { entry, movement });

    // Dispatch webhook
    await dispatchWebhook(tenantId, 'stock.updated', {
      productId: data.productId,
      warehouseId: data.warehouseId,
      previousQuantity: movement.previousQuantity,
      newQuantity: movement.newQuantity,
      type: data.type,
    });

    // Check if stock is now below buffer threshold
    const availability = await isProductAvailable(tenantId, data.productId, data.warehouseId);
    if (!availability.available) {
      await dispatchWebhook(tenantId, 'stock.low', {
        productId: data.productId,
        warehouseId: data.warehouseId,
        currentStock: availability.effectiveStock,
        threshold: availability.bufferThreshold,
      });
      emitInventoryUpdate(req, tenantId, 'stock-low', {
        productId: data.productId,
        stock: availability.effectiveStock,
        threshold: availability.bufferThreshold,
      });
    }

    res.json({ data: { entry, movement }, success: true });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    next(error);
  }
});

/** POST /stock/transfer — Transfer stock between warehouses */
inventoryRouter.post('/stock/transfer', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const schema = z.object({
      productId: z.union([z.string(), z.number()]),
      fromWarehouseId: z.string(),
      toWarehouseId: z.string(),
      quantity: z.number().positive(),
    });

    const data = schema.parse(req.body);
    const result = await transferStock(
      tenantId,
      data.productId,
      data.fromWarehouseId,
      data.toWarehouseId,
      data.quantity,
      (req as any).user?.name
    );

    emitInventoryUpdate(req, tenantId, 'stock-transferred', result);

    res.json({ data: result, success: true });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    next(error);
  }
});

/** GET /stock/availability/:productId — Check product availability */
inventoryRouter.get('/stock/availability/:productId', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const availability = await isProductAvailable(
      tenantId,
      req.params.productId,
      req.query.warehouseId as string | undefined
    );
    res.json({ data: availability });
  } catch (error) {
    next(error);
  }
});

/** POST /stock/bulk-availability — Check availability for multiple products */
inventoryRouter.post('/stock/bulk-availability', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const schema = z.object({ productIds: z.array(z.union([z.string(), z.number()])) });
    const { productIds } = schema.parse(req.body);

    const availability = await checkBulkAvailability(tenantId, productIds);
    res.json({ data: availability });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    next(error);
  }
});

/** GET /movements — Get stock movement history */
inventoryRouter.get('/movements', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const movements =
      (await getTenantData<StockMovement[]>(tenantId, 'pos_stock_movements')) || [];

    // Optional filters
    const { productId, warehouseId, type, limit } = req.query;
    let filtered = movements;
    if (productId) filtered = filtered.filter((m) => String(m.productId) === String(productId));
    if (warehouseId) filtered = filtered.filter((m) => m.warehouseId === warehouseId);
    if (type) filtered = filtered.filter((m) => m.type === type);
    const parsedLimit = limit ? Math.min(Math.max(1, parseInt(String(limit), 10) || 100), 1000) : undefined;
    if (parsedLimit) filtered = filtered.slice(0, parsedLimit);

    res.json({ data: filtered });
  } catch (error) {
    next(error);
  }
});
