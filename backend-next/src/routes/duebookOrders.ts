import { Router, Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { Order, IOrderItem, OrderStatus, OrderPayment } from '../models/Order';
import { Entity } from '../models/Entity';
import { Transaction } from '../models/Transaction';
import { MenuItem } from '../models/MenuItem';
import { duebookAuth } from '../middleware/duebookRoleAuth';
import { computeOrderTotal, isValidStatusTransition, isBakiPayable, snapshotItem } from '../lib/orderLogic';

const router = Router();

router.use(duebookAuth);

const getTenantId = (req: Request): string =>
  (req.tenantId as string) || (req.headers['x-tenant-id'] as string) || '';

const getRole = (req: Request): 'owner' | 'employee' => {
  const r = (req.userRole || (req.user as any)?.role || '').toString();
  return r === 'employee' ? 'employee' : 'owner';
};

const roomFor = (tid: string) => `tenant:${tid.replace(/[^a-zA-Z0-9_-]/g, '')}`;
const shortCode = () => Math.random().toString(36).slice(2, 6).toUpperCase();

// GET today's orders (or window via ?from&to)
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });
    const { from, to, status } = req.query;
    const filter: Record<string, unknown> = { tenantId };
    if (status) filter.status = status;
    if (from || to) {
      const range: Record<string, Date> = {};
      if (from) range.$gte = new Date(from as string);
      if (to) {
        const d = new Date(to as string);
        d.setHours(23, 59, 59, 999);
        range.$lte = d;
      }
      filter.createdAt = range;
    } else {
      // default: today
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      filter.createdAt = { $gte: start };
    }
    const rows = await Order.find(filter).sort({ createdAt: 1 }).limit(500).lean();
    res.json(rows);
  } catch (err) {
    console.error('orders list error:', err);
    res.status(500).json({ error: 'Error fetching orders' });
  }
});

// POST create order (owner only)
router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });
    const role = getRole(req);
    if (role !== 'owner') return res.status(403).json({ error: 'Only owner can create orders' });

    const { items, customerName, entityId, note, paymentMethod } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'items required' });
    if (!['nagad', 'bkash', 'baki'].includes(paymentMethod)) return res.status(400).json({ error: 'invalid paymentMethod' });

    // Snapshot items — trust incoming names/prices but re-validate against current menu when possible
    const ids = items.map((i: IOrderItem) => i.menuItemId).filter(Boolean);
    const menu = ids.length ? await MenuItem.find({ tenantId, _id: { $in: ids } }).lean() : [];
    const menuMap = new Map(menu.map((m) => [String(m._id), m]));

    const snapItems: IOrderItem[] = items.map((raw: IOrderItem) => {
      const src = raw.menuItemId ? menuMap.get(raw.menuItemId) : undefined;
      const merged: IOrderItem = {
        menuItemId: raw.menuItemId,
        nameBn: (src?.nameBn || raw.nameBn || ''),
        priceAt: typeof raw.priceAt === 'number' && raw.priceAt >= 0
          ? raw.priceAt
          : (src?.price ?? 0),
        qty: raw.qty,
        note: raw.note,
      };
      return snapshotItem(merged);
    }).filter((i: IOrderItem | null): i is IOrderItem => i !== null);

    if (snapItems.length === 0) return res.status(400).json({ error: 'no valid items' });

    if (!isBakiPayable(paymentMethod, entityId)) {
      return res.status(400).json({ error: 'baki requires entityId' });
    }

    const total = computeOrderTotal(snapItems);

    let linkedEntityId: string | undefined;
    let entityNameForTx: string | undefined;
    if (paymentMethod === 'baki') {
      const ent = await Entity.findOne({ _id: entityId, tenantId }).lean();
      if (!ent) return res.status(400).json({ error: 'entity not found' });
      linkedEntityId = String(ent._id);
      entityNameForTx = ent.name;
    }

    const order = await Order.create({
      tenantId,
      code: shortCode(),
      items: snapItems,
      customerName: typeof customerName === 'string' ? customerName.trim().slice(0, 80) : undefined,
      entityId: linkedEntityId,
      note: typeof note === 'string' ? note.trim().slice(0, 240) : undefined,
      paymentMethod: paymentMethod as OrderPayment,
      total,
      status: 'new',
      createdByRole: 'owner',
    });

    // Baki linkage — create a Pending INCOME Transaction so due totals update
    if (paymentMethod === 'baki' && linkedEntityId && entityNameForTx) {
      const tx = await Transaction.create({
        tenantId,
        entityId: linkedEntityId,
        entityName: entityNameForTx,
        amount: total,
        direction: 'INCOME',
        transactionDate: new Date(),
        notes: `অর্ডার #${order.code}`,
        status: 'Pending',
      });
      await Entity.findByIdAndUpdate(linkedEntityId, { $inc: { totalOwedToMe: total } });
      order.linkedTxId = tx._id;
      await order.save();
    }

    const io = req.app.get('io') as SocketIOServer | undefined;
    if (io) io.to(roomFor(tenantId)).emit('order:new', order);

    res.status(201).json(order);
  } catch (err) {
    console.error('order create error:', err);
    res.status(500).json({ error: 'Error creating order' });
  }
});

// PATCH order status — { status }
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });
    const { status } = req.body || {};
    if (!['making', 'ready', 'cancelled'].includes(status)) return res.status(400).json({ error: 'invalid status' });
    const order = await Order.findOne({ _id: req.params.id, tenantId });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!isValidStatusTransition(order.status, status)) {
      return res.status(400).json({ error: `Cannot go from ${order.status} to ${status}` });
    }

    order.status = status;
    if (status === 'cancelled') {
      const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 200) : '';
      if (reason) order.cancelledReason = reason;
      if (order.linkedTxId) {
        // Reverse the baki transaction (delete + reverse totals) since order was cancelled
        const tx = await Transaction.findOneAndDelete({ _id: order.linkedTxId, tenantId });
        if (tx && tx.status === 'Pending') {
          const field = tx.direction === 'INCOME' ? 'totalOwedToMe' : 'totalIOweThemNumber';
          await Entity.findByIdAndUpdate(tx.entityId, { $inc: { [field]: -tx.amount } });
        }
        order.linkedTxId = undefined;
      }
    }
    await order.save();

    const io = req.app.get('io') as SocketIOServer | undefined;
    if (io) io.to(roomFor(tenantId)).emit('order:status', order);

    res.json(order);
  } catch (err) {
    console.error('order status error:', err);
    res.status(500).json({ error: 'Error updating status' });
  }
});

// PATCH order edit (owner only, and only while status === 'new')
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });
    const role = getRole(req);
    if (role !== 'owner') return res.status(403).json({ error: 'Only owner can edit orders' });

    const order = await Order.findOne({ _id: req.params.id, tenantId });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'new') return res.status(400).json({ error: 'Can only edit new orders' });

    const { items, note, customerName } = req.body || {};
    if (Array.isArray(items) && items.length > 0) {
      const snap: IOrderItem[] = items
        .map((raw: IOrderItem) => snapshotItem(raw))
        .filter((i: IOrderItem | null): i is IOrderItem => i !== null);
      if (snap.length === 0) return res.status(400).json({ error: 'no valid items' });
      order.items = snap;
      const newTotal = computeOrderTotal(snap);
      // If linked to baki, adjust the paired transaction + entity total
      if (order.linkedTxId && newTotal !== order.total) {
        const delta = newTotal - order.total;
        const tx = await Transaction.findOne({ _id: order.linkedTxId, tenantId });
        if (tx && tx.status === 'Pending') {
          tx.amount = newTotal;
          await tx.save();
          const field = tx.direction === 'INCOME' ? 'totalOwedToMe' : 'totalIOweThemNumber';
          await Entity.findByIdAndUpdate(tx.entityId, { $inc: { [field]: delta } });
        }
      }
      order.total = newTotal;
    }
    if (typeof note === 'string') order.note = note.trim().slice(0, 240);
    if (typeof customerName === 'string') order.customerName = customerName.trim().slice(0, 80);

    await order.save();

    const io = req.app.get('io') as SocketIOServer | undefined;
    if (io) io.to(roomFor(tenantId)).emit('order:updated', order);

    res.json(order);
  } catch (err) {
    console.error('order edit error:', err);
    res.status(500).json({ error: 'Error editing order' });
  }
});

// GET daily summary
router.get('/summary/today', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const orders = await Order.find({ tenantId, createdAt: { $gte: start } }).lean();
    const active = orders.filter((o) => o.status !== 'cancelled');
    const perItem: Record<string, number> = {};
    let cash = 0, digital = 0, baki = 0;
    for (const o of active) {
      for (const i of o.items) perItem[i.nameBn] = (perItem[i.nameBn] || 0) + i.qty;
      if (o.paymentMethod === 'nagad') cash += o.total;
      else if (o.paymentMethod === 'bkash') digital += o.total;
      else if (o.paymentMethod === 'baki') baki += o.total;
    }
    res.json({
      orderCount: active.length,
      cancelled: orders.length - active.length,
      perItem,
      totals: { cash, digital, baki, all: cash + digital + baki },
    });
  } catch (err) {
    console.error('order summary error:', err);
    res.status(500).json({ error: 'Error fetching summary' });
  }
});

export default router;
