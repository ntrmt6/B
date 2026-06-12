import { Router, Request } from 'express';
import { z } from 'zod';
import { authenticateToken, extractTenantId } from '../middleware/auth';
import {
  getWebhooks,
  registerWebhook,
  updateWebhook,
  deleteWebhook,
  getWebhookLogs,
  WebhookEvent,
} from '../services/webhookService';

export const webhooksRouter = Router();

webhooksRouter.use(extractTenantId);

function getTenantId(req: Request): string | null {
  return (req as any).tenantId || (req.headers['x-tenant-id'] as string) || null;
}

const VALID_EVENTS: WebhookEvent[] = [
  'order.created', 'order.updated', 'order.delivered', 'order.cancelled',
  'stock.updated', 'stock.low', 'price.changed',
  'customer.created', 'customer.updated',
  'loyalty.earned', 'loyalty.redeemed',
  'pos.sale', 'pos.return',
];

/** GET / — List all webhooks */
webhooksRouter.get('/', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const webhooks = await getWebhooks(tenantId);
    res.json({ data: webhooks });
  } catch (error) {
    next(error);
  }
});

/** POST / — Register a new webhook */
webhooksRouter.post('/', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const schema = z.object({
      url: z.string().url().refine((url) => {
        try {
          const parsed = new URL(url);
          // Only allow http/https protocols to prevent SSRF via file://, gopher://, etc.
          if (!['http:', 'https:'].includes(parsed.protocol)) return false;
          // Block private/reserved IPs
          const host = parsed.hostname.toLowerCase();
          if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '::1') return false;
          if (host.startsWith('10.') || host.startsWith('192.168.') || host.startsWith('172.')) return false;
          if (host === '169.254.169.254') return false; // AWS metadata
          return true;
        } catch { return false; }
      }, { message: 'URL must use http/https and must not point to private/internal addresses' }),
      events: z.array(z.enum(VALID_EVENTS as [WebhookEvent, ...WebhookEvent[]])).min(1),
      secret: z.string().optional(),
      description: z.string().optional(),
      isActive: z.boolean().default(true),
    });

    const data = schema.parse(req.body);
    const webhook = await registerWebhook(tenantId, data);
    res.status(201).json({ data: webhook, success: true });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    next(error);
  }
});

/** PUT /:id — Update a webhook */
webhooksRouter.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const schema = z.object({
      url: z.string().url().optional(),
      events: z.array(z.enum(VALID_EVENTS as [WebhookEvent, ...WebhookEvent[]])).optional(),
      secret: z.string().optional(),
      description: z.string().optional(),
      isActive: z.boolean().optional(),
    });

    const updates = schema.parse(req.body);
    const webhook = await updateWebhook(tenantId, req.params.id, updates);
    if (!webhook) return res.status(404).json({ error: 'Webhook not found' });

    res.json({ data: webhook, success: true });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    next(error);
  }
});

/** DELETE /:id — Delete a webhook */
webhooksRouter.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const deleted = await deleteWebhook(tenantId, req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Webhook not found' });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/** GET /logs — Get webhook delivery logs */
webhooksRouter.get('/logs', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const logs = await getWebhookLogs(tenantId);
    res.json({ data: logs });
  } catch (error) {
    next(error);
  }
});
