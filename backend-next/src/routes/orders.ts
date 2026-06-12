import { Router, Request } from 'express';
import { z } from 'zod';
import { getTenantData, setTenantData } from '../services/tenantDataService';
import { Server as SocketIOServer } from 'socket.io';
import { Notification } from '../models/Notification';
import { createAuditLog } from './auditLogs';
import { authenticateToken, optionalAuth, requireAdmin } from '../middleware/auth';
import { adjustStock } from '../services/inventorySync';
import { dispatchWebhook } from '../services/webhookService';

export const ordersRouter = Router();

// Order schema for validation
const orderSchema = z.object({
  id: z.string(),
  tenantId: z.string().optional(),
  customer: z.string(),
  location: z.string().optional(),
  amount: z.number(),
  date: z.string(),
  status: z.enum(['Pending', 'Confirmed', 'On Hold', 'Processing', 'Shipped', 'Sent to Courier', 'Delivered', 'Cancelled', 'Return', 'Refund', 'Returned Receive', 'Returned', 'Incomplete']).default('Pending'),
  email: z.preprocess((val) => (val === '' || val === undefined || val === null) ? undefined : val, z.string().email().optional()),
  phone: z.string().optional(),
  division: z.string().optional(),
  district: z.string().optional(),
  promoCode: z.string().optional(),
  promoDiscount: z.number().optional(),
  variant: z.object({
    color: z.string(),
    size: z.string()
  }).optional(),
  productId: z.union([z.number(), z.string()]).optional(),
  productName: z.string().optional(),
  productImage: z.string().optional().nullable(),
  sku: z.string().optional(),
  quantity: z.number().default(1),
  deliveryType: z.string().optional(),
  deliveryCharge: z.number().optional(),
  trackingId: z.string().optional(),
  courierProvider: z.string().optional(),
  notes: z.string().optional(),
  source: z.enum(['store', 'landing_page', 'admin']).optional(),
  landingPageId: z.string().optional(),
  createdAt: z.string().optional(),
  items: z.array(z.any()).optional(),
  weight: z.number().optional(),
  pathaoArea: z.number().optional(),
  pathaoZone: z.number().optional(),
  pathaoCity: z.number().optional(),
  // Payment method info (for manual MFS payments)
  paymentMethod: z.string().optional(),
  paymentMethodId: z.string().optional(),
  transactionId: z.string().optional(),
  customerPaymentPhone: z.string().optional(),
  stockDeducted: z.boolean().optional(),
  // Multi-vendor fields
  vendorId: z.string().optional(),
  isMasterOrder: z.boolean().optional(),
  masterOrderId: z.string().optional(),
  subOrderIds: z.array(z.string()).optional(),
});
// order interface
export interface Order {
  id: string;
  tenantId?: string;
  customer: string;
  location: string;
  amount: number;
  date: string;
  status: 'Pending' | 'Confirmed' | 'On Hold' | 'Processing' | 'Shipped' | 'Sent to Courier' | 'Delivered' | 'Cancelled' | 'Return' | 'Refund' | 'Returned Receive' | 'Returned' | 'Incomplete';
  email?: string;
  trackingId?: string;
  phone?: string;
  division?: string;
  district?: string;
  promoCode?: string;
  promoDiscount?: number;
  variant?: { color: string; size: string };
  productId?: number | string;
  productName?: string;
  productImage?: string;
  sku?: string;
  quantity?: number;
  items?: Array<{
    productId?: number | string;
    id?: number | string;
    quantity?: number;
    variant?: { color: string; size: string };
    vendorId?: string;
    [key: string]: any;
  }>;
  deliveryType?: 'Regular' | 'Express' | 'Free';
  deliveryCharge?: number;
  courierProvider?: 'Steadfast' | 'Pathao';
  courierMeta?: Record<string, any>;
  source?: 'store' | 'landing_page' | 'admin';
  landingPageId?: string;
  // Payment method info (for manual MFS payments)
  paymentMethod?: string;
  paymentMethodId?: string;
  transactionId?: string;
  customerPaymentPhone?: string;
  stockDeducted?: boolean;
  // Multi-vendor fields
  vendorId?: string;
  isMasterOrder?: boolean;
  masterOrderId?: string;
  subOrderIds?: string[];
}

// type Order = z.infer<typeof orderSchema>;

// Helper to emit Socket.IO events
const emitOrderUpdate = (req: Request, tenantId: string, event: string, data: unknown) => {
  const io = req.app.get('io') as SocketIOServer | undefined;
  if (io) {
    io.to(`tenant:${tenantId}`).emit(event, { tenantId, data, timestamp: Date.now() });
    io.emit('order-update-global', { tenantId, event, timestamp: Date.now() });
    console.log(`[Socket.IO] Emitted ${event} for tenant ${tenantId}`);
  }
};

// Helper to reduce product stock when an order is delivered
const reduceStockOnDelivery = async (tenantId: string, order: Order & { stockDeducted?: boolean }): Promise<boolean> => {
  try {
    // Prevent double deduction
    if (order.stockDeducted) {
      console.log(`[Stock] Order ${order.id} already had stock deducted, skipping`);
      return false;
    }

    const products = await getTenantData<any[]>(tenantId, 'products');
    if (!products || products.length === 0) {
      console.warn(`[Stock] No products found for tenant ${tenantId}`);
      return false;
    }

    let stockUpdated = false;
    const quantity = Math.max(1, Number(order.quantity) || 1);

    // Handle single-product order
    if (order.productId) {
      const productIndex = products.findIndex((p: any) => p.id === order.productId || p.id === Number(order.productId));
      if (productIndex !== -1) {
        const product = products[productIndex];
        const currentStock = Number(product.stock) || 0;
        product.stock = Math.max(0, currentStock - quantity);

        // Also reduce variant stock if order has a variant
        if (order.variant && product.variantStock && Array.isArray(product.variantStock)) {
          const variantIndex = product.variantStock.findIndex(
            (vs: any) => vs.color === order.variant?.color && vs.size === order.variant?.size
          );
          if (variantIndex !== -1) {
            const currentVariantStock = Number(product.variantStock[variantIndex].stock) || 0;
            product.variantStock[variantIndex].stock = Math.max(0, currentVariantStock - quantity);
          }
        }

        products[productIndex] = product;
        stockUpdated = true;
        console.log(`[Stock] Reduced stock for product ${product.name || product.id}: ${currentStock} → ${product.stock} (qty: ${quantity})`);
      }
    }

    // Handle multi-item order
    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
      for (const item of order.items) {
        const itemProductId = item.productId || item.id;
        const itemQuantity = Math.max(1, Number(item.quantity) || 1);
        if (!itemProductId) continue;

        const productIndex = products.findIndex((p: any) => p.id === itemProductId || p.id === Number(itemProductId));
        if (productIndex !== -1) {
          const product = products[productIndex];
          const currentStock = Number(product.stock) || 0;
          product.stock = Math.max(0, currentStock - itemQuantity);

          if (item.variant && product.variantStock && Array.isArray(product.variantStock)) {
            const variantIndex = product.variantStock.findIndex(
              (vs: any) => vs.color === item.variant?.color && vs.size === item.variant?.size
            );
            if (variantIndex !== -1) {
              const currentVariantStock = Number(product.variantStock[variantIndex].stock) || 0;
              product.variantStock[variantIndex].stock = Math.max(0, currentVariantStock - itemQuantity);
            }
          }

          products[productIndex] = product;
          stockUpdated = true;
          console.log(`[Stock] Reduced stock for item ${product.name || product.id}: ${currentStock} → ${product.stock} (qty: ${itemQuantity})`);
        }
      }
    }

    if (stockUpdated) {
      await setTenantData(tenantId, 'products', products);
      console.log(`[Stock] Product stock updated for tenant ${tenantId} (order ${order.id} delivered)`);
    }

    return stockUpdated;
  } catch (error) {
    console.error(`[Stock] Error reducing stock for order ${order.id}:`, error);
    return false;
  }
};

// Get all orders for a tenant (with optional filtering and pagination)
ordersRouter.get('/:tenantId', async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId is required' });
    }

    // Optional query parameters
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : undefined;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
    const perPage = req.query.perPage ? parseInt(req.query.perPage as string, 10) : undefined;

    let orders = (await getTenantData<Order[]>(tenantId, 'orders')) || [];

    // filter by status if requested
    if (status) {
      orders = orders.filter(o => o.status === status);
    }

    // simple text search on customer name or order id
    if (search) {
      orders = orders.filter(o =>
        (o.customer && o.customer.toLowerCase().includes(search)) ||
        (o.id && o.id.toLowerCase().includes(search))
      );
    }

    // apply pagination if requested
    if (page !== undefined && perPage !== undefined && perPage > 0) {
      const start = (page - 1) * perPage;
      orders = orders.slice(start, start + perPage);
    }

    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({ data: orders });
  } catch (error) {
    console.error('[Orders] Error fetching orders:', error);
    next(error);
  }
});

// Create a new order
ordersRouter.post('/:tenantId', async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId is required' });
    }
    
    const orderData = orderSchema.parse({
      ...req.body,
      tenantId,
      id: req.body.id || `#${Math.floor(1000 + Math.random() * 9000)}`,
      date: req.body.date || new Date().toISOString()
    });
    
    // Get existing orders
    const existingOrders = await getTenantData<Order[]>(tenantId, 'orders') || [];
    
    // Check if we should update an existing order (for incomplete/draft orders)
    const existingIndex = existingOrders.findIndex(o => o.id === orderData.id);
    let updatedOrders: any[];

    if (existingIndex > -1) {
      // Update existing order (likely a draft being finalized or updated)
      updatedOrders = [...existingOrders];
      updatedOrders[existingIndex] = { ...existingOrders[existingIndex], ...orderData };
    } else {
      // Add new order at the beginning
      updatedOrders = [orderData, ...existingOrders];
    }
    
    // Save orders
    await setTenantData(tenantId, 'orders', updatedOrders);
    
    // Emit real-time update
    emitOrderUpdate(req, tenantId, existingIndex > -1 ? 'order-updated' : 'new-order', orderData);
    
    // Only create audit logs and notifications for REAL orders (not incomplete drafts)
    if (orderData.status !== 'Incomplete') {
      // Create audit log (non-blocking - don't let failures affect the order response)
      const user = (req as any).user;
      try {
        await createAuditLog({
          tenantId,
          userId: user?._id || user?.id || 'system',
          userName: user?.name || orderData.customer || 'Customer',
          userRole: user?.role || 'customer',
          action: existingIndex > -1 ? 'Order Finalized' : 'Order Created',
          actionType: existingIndex > -1 ? 'update' : 'create',
          resourceType: 'order',
          resourceId: orderData.id,
          resourceName: `Order ${orderData.id}`,
          details: `New order ${orderData.id} created by ${orderData.customer} for ৳${orderData.amount}`,
          metadata: { amount: orderData.amount, productName: orderData.productName, source: orderData.source },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          status: 'success'
        });
      } catch (auditError) {
        console.warn('[Orders] Audit log failed:', auditError);
      }
      
      // Create notification for admin
      try {
        const notification = await Notification.create({
          tenantId,
          type: 'order',
          title: `নতুন অর্ডার ${orderData.id}`,
          message: `${orderData.customer} থেকে ৳${orderData.amount.toLocaleString()} টাকার অর্ডার এসেছে`,
          data: {
            orderId: orderData.id,
            customerName: orderData.customer,
            amount: orderData.amount,
            productName: orderData.productName,
            phone: orderData.phone
          }
        });

        // Emit socket event for real-time notification with sound trigger
        const io = req.app.get('io') as SocketIOServer | undefined;
        if (io) {
          io.to(`tenant:${tenantId}`).emit('new-notification', notification);
          console.log(`[Notification] Sent new order notification to tenant ${tenantId}`);
        }
      } catch (notifError) {
        console.warn('[Orders] Failed to create notification:', notifError);
      }
    }
    
    console.log(`[Orders] New order ${orderData.id} created for tenant ${tenantId}`);

    // Dispatch webhook for new order (non-blocking)
    try {
      await dispatchWebhook(tenantId, 'order.created', {
        orderId: orderData.id,
        customer: orderData.customer,
        amount: orderData.amount,
        source: orderData.source,
        items: orderData.items,
      });
    } catch (webhookError) {
      console.warn('[Orders] Webhook dispatch failed:', webhookError);
    }

    // Deduct inventory on POS sales immediately (source='store' or 'admin')
    if (orderData.source === 'store' || orderData.source === 'admin') {
      try {
        if (orderData.items && Array.isArray(orderData.items) && orderData.items.length > 0) {
          for (const item of orderData.items) {
            const pid = item.productId || item.id;
            if (!pid) continue;
            await adjustStock(tenantId, pid, 'default', -(item.quantity || 1), {
              productId: pid,
              warehouseId: 'default',
              type: 'sale',
              quantity: -(item.quantity || 1),
              orderId: orderData.id,
              note: `POS sale - order ${orderData.id}`,
            });
          }
        } else if (orderData.productId) {
          await adjustStock(tenantId, orderData.productId, 'default', -(orderData.quantity || 1), {
            productId: orderData.productId,
            warehouseId: 'default',
            type: 'sale',
            quantity: -(orderData.quantity || 1),
            orderId: orderData.id,
            note: `POS sale - order ${orderData.id}`,
          });
        }
        await dispatchWebhook(tenantId, 'pos.sale', {
          orderId: orderData.id,
          amount: orderData.amount,
        });
      } catch (stockError) {
        console.warn('[Orders] POS stock adjustment failed:', stockError);
      }
    }

    res.status(201).json({ data: orderData, success: true });
  } catch (error) {
console.error('[Orders] Error creating order:', error instanceof Error ? error.message : String(error));
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    next(error);
  }
});

// Update an order
ordersRouter.put('/:tenantId/:orderId', authenticateToken, requireAdmin, async (req, res, next) => {
  // Tenant isolation: non-super-admin can only modify their own tenant's orders
  if (req.userRole !== 'super_admin' && req.tenantId && req.params.tenantId !== req.tenantId) {
    return res.status(403).json({ error: 'Cannot modify orders from another tenant' });
  }
  try {
    const { tenantId, orderId } = req.params;
    if (!tenantId || !orderId) {
      return res.status(400).json({ error: 'tenantId and orderId are required' });
    }
    
    // Get existing orders
    const existingOrders = await getTenantData<Order[]>(tenantId, 'orders') || [];
    
    // Find and update the order
    const orderIndex = existingOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const oldOrder = existingOrders[orderIndex];
    const updatedOrder = { ...oldOrder, ...req.body };

    // Reduce product stock when status changes to Delivered
    const statusChanged = oldOrder.status !== updatedOrder.status;
    if (statusChanged && updatedOrder.status === 'Delivered' && !oldOrder.stockDeducted) {
      const stockReduced = await reduceStockOnDelivery(tenantId, oldOrder);
      if (stockReduced) {
        updatedOrder.stockDeducted = true;
      }
    }

    existingOrders[orderIndex] = updatedOrder;
    
    // Save orders
    await setTenantData(tenantId, 'orders', existingOrders);
    
    // Emit real-time update
    emitOrderUpdate(req, tenantId, 'order-updated', updatedOrder);
    
    // Create audit log (non-blocking)
    const user = (req as any).user;
    try {
      await createAuditLog({
        tenantId,
        userId: user?._id || user?.id || 'system',
        userName: user?.name || 'System',
        userRole: user?.role || 'system',
        action: statusChanged ? `Order Status: ${oldOrder.status} → ${updatedOrder.status}` : 'Order Updated',
        actionType: 'update',
        resourceType: 'order',
        resourceId: orderId,
        resourceName: `Order ${orderId}`,
        details: statusChanged 
          ? `Order ${orderId} status changed from ${oldOrder.status} to ${updatedOrder.status}`
          : `Order ${orderId} updated`,
        metadata: { oldStatus: oldOrder.status, newStatus: updatedOrder.status, changes: req.body },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'success'
      });
    } catch (auditError) {
      console.warn('[Orders] Audit log failed for PUT order update:', auditError);
    }
    
    console.log(`[Orders] Order ${orderId} updated for tenant ${tenantId}`);

    // Dispatch webhook for order updates (non-blocking)
    try {
      if (statusChanged) {
        const webhookEvent = updatedOrder.status === 'Delivered' ? 'order.delivered' as const
          : updatedOrder.status === 'Cancelled' ? 'order.cancelled' as const
          : 'order.updated' as const;
        await dispatchWebhook(tenantId, webhookEvent, {
          orderId,
          oldStatus: oldOrder.status,
          newStatus: updatedOrder.status,
          amount: updatedOrder.amount,
        });
      } else {
        await dispatchWebhook(tenantId, 'order.updated', { orderId, changes: req.body });
      }
    } catch (webhookError) {
      console.warn('[Orders] Webhook dispatch failed:', webhookError);
    }

    res.json({ data: updatedOrder, success: true });
  } catch (error) {
    console.error('[Orders] Error updating order:', error);
    next(error);
  }
});


// Update an order (PATCH - same as PUT for compatibility)
ordersRouter.patch('/:tenantId/:orderId', authenticateToken, requireAdmin, async (req, res, next) => {
  // Tenant isolation: non-super-admin can only modify their own tenant's orders
  if (req.userRole !== 'super_admin' && req.tenantId && req.params.tenantId !== req.tenantId) {
    return res.status(403).json({ error: 'Cannot modify orders from another tenant' });
  }
  try {
    const { tenantId, orderId } = req.params;
    if (!tenantId || !orderId) {
      return res.status(400).json({ error: 'tenantId and orderId are required' });
    }
    
    // Get existing orders
    const existingOrders = await getTenantData<Order[]>(tenantId, 'orders') || [];
    
    // Find and update the order
    const orderIndex = existingOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const oldOrder = existingOrders[orderIndex];
    const updatedOrder = { ...oldOrder, ...req.body };

    // Reduce product stock when status changes to Delivered
    const statusChanged = oldOrder.status !== updatedOrder.status;
    if (statusChanged && updatedOrder.status === 'Delivered' && !oldOrder.stockDeducted) {
      const stockReduced = await reduceStockOnDelivery(tenantId, oldOrder);
      if (stockReduced) {
        updatedOrder.stockDeducted = true;
      }
    }

    existingOrders[orderIndex] = updatedOrder;
    
    // Save orders
    await setTenantData(tenantId, 'orders', existingOrders);
    
    // Emit real-time update
    emitOrderUpdate(req, tenantId, 'order-updated', updatedOrder);
    
    // Create audit log (non-blocking)
    const user = (req as any).user;
    try {
      await createAuditLog({
        tenantId,
        userId: user?._id || user?.id || 'system',
        userName: user?.name || 'System',
        userRole: user?.role || 'system',
        action: statusChanged ? `Order Status: ${oldOrder.status} → ${updatedOrder.status}` : 'Order Updated',
        actionType: 'update',
        resourceType: 'order',
        resourceId: orderId,
        resourceName: `Order ${orderId}`,
        details: statusChanged 
          ? `Order ${orderId} status changed from ${oldOrder.status} to ${updatedOrder.status}`
          : `Order ${orderId} updated`,
        metadata: { oldStatus: oldOrder.status, newStatus: updatedOrder.status, changes: req.body },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'success'
      });
    } catch (auditError) {
      console.warn('[Orders] Audit log failed for PATCH order update:', auditError);
    }
    
    console.log(`[Orders] Order ${orderId} updated for tenant ${tenantId}`);

    // Dispatch webhook for PATCH order updates (non-blocking)
    try {
      if (statusChanged) {
        const webhookEvent = updatedOrder.status === 'Delivered' ? 'order.delivered' as const
          : updatedOrder.status === 'Cancelled' ? 'order.cancelled' as const
          : 'order.updated' as const;
        await dispatchWebhook(tenantId, webhookEvent, {
          orderId,
          oldStatus: oldOrder.status,
          newStatus: updatedOrder.status,
          amount: updatedOrder.amount,
        });
      } else {
        await dispatchWebhook(tenantId, 'order.updated', { orderId, changes: req.body });
      }
    } catch (webhookError) {
      console.warn('[Orders] Webhook dispatch failed:', webhookError);
    }

    res.json({ data: updatedOrder, success: true });
  } catch (error) {
    console.error('[Orders] Error updating order:', error);
    next(error);
  }
});
// Delete an order
ordersRouter.delete('/:tenantId/:orderId', authenticateToken, requireAdmin, async (req, res, next) => {
  // Tenant isolation: non-super-admin can only delete their own tenant's orders
  if (req.userRole !== 'super_admin' && req.tenantId && req.params.tenantId !== req.tenantId) {
    return res.status(403).json({ error: 'Cannot delete orders from another tenant' });
  }
  try {
    const { tenantId, orderId } = req.params;
    if (!tenantId || !orderId) {
      return res.status(400).json({ error: 'tenantId and orderId are required' });
    }
    
    // Get existing orders
    const existingOrders = await getTenantData<Order[]>(tenantId, 'orders') || [];
    
    // Find the order before deleting
    const orderToDelete = existingOrders.find(o => o.id === orderId);
    
    // Filter out the order to delete
    const updatedOrders = existingOrders.filter(o => o.id !== orderId);
    
    if (updatedOrders.length === existingOrders.length) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Save orders
    await setTenantData(tenantId, 'orders', updatedOrders);
    
    // Emit real-time update
    emitOrderUpdate(req, tenantId, 'order-deleted', { orderId });
    
    // Create audit log (non-blocking)
    const user = (req as any).user;
    try {
      await createAuditLog({
        tenantId,
        userId: user?._id || user?.id || 'system',
        userName: user?.name || 'System',
        userRole: user?.role || 'system',
        action: 'Order Deleted',
        actionType: 'delete',
        resourceType: 'order',
        resourceId: orderId,
        resourceName: `Order ${orderId}`,
        details: `Order ${orderId} (${orderToDelete?.customer || 'Unknown'}) deleted`,
        metadata: { deletedOrder: orderToDelete },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'success'
      });
    } catch (auditError) {
      console.warn('[Orders] Audit log failed for order delete:', auditError);
    }
    
    console.log(`[Orders] Order ${orderId} deleted for tenant ${tenantId}`);
    res.json({ success: true });
  } catch (error) {
    console.error('[Orders] Error deleting order:', error);
    next(error);
  }
});
