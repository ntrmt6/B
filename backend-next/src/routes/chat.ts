import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { GuestMessage } from '../models/GuestMessage';
import { getTenantData, setTenantData } from '../services/tenantDataService';
import { getTenantBySubdomain } from '../services/tenantsService';
import { deleteCached } from '../services/redisCache';
import { authenticateToken } from '../middleware/auth';
import { Server as SocketIOServer } from 'socket.io';

const chatRouter = Router();

// ---------------------------------------------------------------------------
// Rate limiter (in-memory, no external dependency)
// ---------------------------------------------------------------------------
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

const checkRateLimit = (key: string): boolean => {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
};

// Purge stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}, 5 * 60_000);

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
const publicMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().min(5).max(100),
  senderName: z.string().max(100).optional(),
  senderEmail: z.string().email().optional(),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const isObjectIdLike = (str: string): boolean => /^[a-f\d]{24}$/i.test(str);

/** Resolve a tenantId param that may be a slug or ObjectId. */
const resolveTenantId = async (
  tenantIdOrSlug: string,
  subdomainHeader?: string,
): Promise<string | null> => {
  if (isObjectIdLike(tenantIdOrSlug)) return tenantIdOrSlug;

  // Try the param as a subdomain slug
  try {
    const tenant = await getTenantBySubdomain(tenantIdOrSlug);
    if (tenant?._id) return tenant._id.toString();
  } catch {}

  // Fallback: use X-Tenant-Subdomain header
  if (subdomainHeader && subdomainHeader !== tenantIdOrSlug) {
    try {
      const tenant = await getTenantBySubdomain(subdomainHeader);
      if (tenant?._id) return tenant._id.toString();
    } catch {}
  }

  return null;
};

/** Push the guest message into the tenant-data chat_messages array so the
 *  admin chat panel (which reads from tenant-data) sees it in real-time. */
const syncToTenantData = async (resolvedTenantId: string, chatMsg: Record<string, unknown>) => {
  try {
    const existing = await getTenantData<unknown[]>(resolvedTenantId, 'chat_messages');
    const messages = Array.isArray(existing) ? existing : [];
    messages.push(chatMsg);
    await setTenantData(resolvedTenantId, 'chat_messages', messages);
    await deleteCached(`tenant:${resolvedTenantId}:chat_messages`);
    return messages;
  } catch (err) {
    console.warn('[GuestChat] Failed to sync to tenant-data:', err);
    return null;
  }
};

/** Emit Socket.IO events to the tenant room. */
const emitChatUpdate = (req: Request, tenantId: string, messages: unknown[] | null) => {
  const io = req.app.get('io') as SocketIOServer | undefined;
  if (!io) return;

  const payload = { tenantId, key: 'chat_messages', data: messages, timestamp: Date.now() };
  io.to(`tenant:${tenantId}`).emit('data-update', payload);
  io.to(`tenant:${tenantId}`).emit('chat-update', payload);
};

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * POST /api/guestchat/:tenantId/chats
 *
 * Public endpoint — no JWT required.
 * Persists a guest chat message to the GuestMessage collection AND syncs it
 * into the tenant-data chat_messages array for the admin panel.
 */
chatRouter.post('/:tenantId/chats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = publicMessageSchema.parse(req.body);
    const subdomainHeader = req.headers['x-tenant-subdomain'] as string | undefined;

    // Rate limit
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(`${ip}:${body.sessionId}`)) {
      return res.status(429).json({ error: 'Too many messages. Please slow down.', code: 'RATE_LIMITED' });
    }

    // Resolve tenantId
    const resolvedTenantId = await resolveTenantId(req.params.tenantId, subdomainHeader);
    if (!resolvedTenantId) {
      return res.status(400).json({ error: 'Invalid tenant', code: 'TENANT_NOT_FOUND' });
    }

    const shortId = body.sessionId.slice(-6).toUpperCase();
    const displayName = body.senderName || `Guest ${shortId}`;

    // 1. Save to GuestMessage collection (proper Mongoose model)
    const guestMsg = await GuestMessage.create({
      tenantId: resolvedTenantId,
      sessionId: body.sessionId,
      senderId: undefined,               // no authenticated user
      senderName: displayName,
      senderEmail: body.senderEmail || undefined,
      text: body.message,
      sender: 'customer',
      isGuest: true,
      isRead: false,
    });

    // 2. Build a ChatMessage-compatible object for tenant-data sync
    const chatMsg = {
      id: guestMsg._id.toString(),
      sender: 'customer' as const,
      text: body.message,
      timestamp: guestMsg.createdAt.getTime(),
      customerName: displayName,
      guestSessionId: body.sessionId,
      authorName: displayName,
      authorRole: 'customer' as const,
      isGuest: true,
    };

    // 3. Sync into tenant-data so admin chat panel gets it
    const allMessages = await syncToTenantData(resolvedTenantId, chatMsg);

    // 4. Emit socket events
    emitChatUpdate(req, resolvedTenantId, allMessages);

    res.status(201).json({
      success: true,
      message: {
        id: guestMsg._id.toString(),
        sessionId: body.sessionId,
        text: body.message,
        sender: 'customer',
        senderName: displayName,
        isGuest: true,
        timestamp: guestMsg.createdAt.getTime(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors, code: 'VALIDATION_ERROR' });
    }
    next(error);
  }
});

/**
 * GET /api/guestchat/:tenantId/chats/:sessionId
 *
 * Public endpoint — fetch all messages for a given guest session.
 * Returns both guest and admin replies in chronological order.
 */
chatRouter.get('/:tenantId/chats/:sessionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subdomainHeader = req.headers['x-tenant-subdomain'] as string | undefined;
    const resolvedTenantId = await resolveTenantId(req.params.tenantId, subdomainHeader);
    if (!resolvedTenantId) {
      return res.status(400).json({ error: 'Invalid tenant', code: 'TENANT_NOT_FOUND' });
    }

    const { sessionId } = req.params;
    if (!sessionId || sessionId.length < 5) {
      return res.status(400).json({ error: 'Invalid sessionId' });
    }

    const messages = await GuestMessage.find({
      tenantId: resolvedTenantId,
      sessionId,
    })
      .sort({ createdAt: 1 })
      .lean();

    res.json({
      messages: messages.map((m) => ({
        id: m._id.toString(),
        sessionId: m.sessionId,
        text: m.text,
        sender: m.sender,
        senderName: m.senderName,
        isGuest: m.isGuest,
        isRead: m.isRead,
        timestamp: m.createdAt.getTime(),
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/guestchat/:tenantId/sessions
 *
 * Admin-only — list all active guest chat sessions for a tenant.
 */
chatRouter.get('/:tenantId/sessions', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subdomainHeader = req.headers['x-tenant-subdomain'] as string | undefined;
    const resolvedTenantId = await resolveTenantId(req.params.tenantId, subdomainHeader);
    if (!resolvedTenantId) {
      return res.status(400).json({ error: 'Invalid tenant', code: 'TENANT_NOT_FOUND' });
    }

    // Aggregate: group by sessionId, get last message + count
    const sessions = await GuestMessage.aggregate([
      { $match: { tenantId: resolvedTenantId } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$sessionId',
          lastMessage: { $first: '$text' },
          lastSender: { $first: '$sender' },
          senderName: { $first: '$senderName' },
          messageCount: { $sum: 1 },
          unreadCount: { $sum: { $cond: [{ $and: [{ $eq: ['$isRead', false] }, { $eq: ['$sender', 'customer'] }] }, 1, 0] } },
          lastActivity: { $first: '$createdAt' },
        },
      },
      { $sort: { lastActivity: -1 } },
    ]);

    res.json({
      sessions: sessions.map((s) => ({
        sessionId: s._id,
        senderName: s.senderName,
        lastMessage: s.lastMessage,
        lastSender: s.lastSender,
        messageCount: s.messageCount,
        unreadCount: s.unreadCount,
        lastActivity: s.lastActivity,
      })),
    });
  } catch (error) {
    next(error);
  }
});

export default chatRouter;
