import { getTenantData, setTenantData } from './tenantDataService';

// ─── Interfaces ───────────────────────────────────────────────
export interface WebhookRegistration {
  id: string;
  tenantId: string;
  url: string;
  events: WebhookEvent[];
  secret?: string;           // HMAC secret for payload verification
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type WebhookEvent =
  | 'order.created'
  | 'order.updated'
  | 'order.delivered'
  | 'order.cancelled'
  | 'stock.updated'
  | 'stock.low'
  | 'price.changed'
  | 'customer.created'
  | 'customer.updated'
  | 'loyalty.earned'
  | 'loyalty.redeemed'
  | 'pos.sale'
  | 'pos.return';

export interface WebhookPayload {
  id: string;
  event: WebhookEvent;
  tenantId: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface WebhookDeliveryLog {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  url: string;
  payload: WebhookPayload;
  statusCode?: number;
  response?: string;
  success: boolean;
  attempts: number;
  lastAttemptAt: string;
  createdAt: string;
}

// ─── Webhook Management ──────────────────────────────────────

/** Get all webhook registrations for a tenant */
export async function getWebhooks(tenantId: string): Promise<WebhookRegistration[]> {
  const data = await getTenantData<WebhookRegistration[]>(tenantId, 'pos_webhooks');
  return data || [];
}

/** Register a new webhook */
export async function registerWebhook(
  tenantId: string,
  webhook: Omit<WebhookRegistration, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
): Promise<WebhookRegistration> {
  const webhooks = await getWebhooks(tenantId);

  const newWebhook: WebhookRegistration = {
    ...webhook,
    id: `wh_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    tenantId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  webhooks.push(newWebhook);
  await setTenantData(tenantId, 'pos_webhooks', webhooks);
  return newWebhook;
}

/** Update an existing webhook */
export async function updateWebhook(
  tenantId: string,
  webhookId: string,
  updates: Partial<Omit<WebhookRegistration, 'id' | 'tenantId' | 'createdAt'>>
): Promise<WebhookRegistration | null> {
  const webhooks = await getWebhooks(tenantId);
  const index = webhooks.findIndex((w) => w.id === webhookId);
  if (index === -1) return null;

  webhooks[index] = { ...webhooks[index], ...updates, updatedAt: new Date().toISOString() };
  await setTenantData(tenantId, 'pos_webhooks', webhooks);
  return webhooks[index];
}

/** Delete a webhook */
export async function deleteWebhook(tenantId: string, webhookId: string): Promise<boolean> {
  const webhooks = await getWebhooks(tenantId);
  const filtered = webhooks.filter((w) => w.id !== webhookId);
  if (filtered.length === webhooks.length) return false;
  await setTenantData(tenantId, 'pos_webhooks', filtered);
  return true;
}

// ─── Webhook Dispatch ────────────────────────────────────────

/** Dispatch a webhook event to all registered listeners for a tenant */
export async function dispatchWebhook(
  tenantId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<void> {
  const webhooks = await getWebhooks(tenantId);
  const active = webhooks.filter((w) => w.isActive && w.events.includes(event));

  if (active.length === 0) return;

  const payload: WebhookPayload = {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    event,
    tenantId,
    timestamp: new Date().toISOString(),
    data,
  };

  // Fire all webhooks in parallel (non-blocking)
  const deliveries = active.map((webhook) => deliverWebhook(tenantId, webhook, payload));
  // Don't await — fire and forget to not block the main flow
  Promise.allSettled(deliveries).catch((err) => {
    console.error(`[Webhook] Error dispatching ${event} for tenant ${tenantId}:`, err);
  });
}

/** Deliver a single webhook with retry */
async function deliverWebhook(
  tenantId: string,
  webhook: WebhookRegistration,
  payload: WebhookPayload,
  maxRetries: number = 3
): Promise<void> {
  const log: WebhookDeliveryLog = {
    id: `dl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    webhookId: webhook.id,
    event: payload.event,
    url: webhook.url,
    payload,
    success: false,
    attempts: 0,
    lastAttemptAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    log.attempts = attempt;
    log.lastAttemptAt = new Date().toISOString();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Webhook-Event': payload.event,
        'X-Webhook-Id': webhook.id,
        'X-Webhook-Timestamp': payload.timestamp,
      };

      // Add HMAC signature if secret is configured
      if (webhook.secret) {
        const crypto = await import('crypto');
        const signature = crypto
          .createHmac('sha256', webhook.secret)
          .update(JSON.stringify(payload))
          .digest('hex');
        headers['X-Webhook-Signature'] = `sha256=${signature}`;
      }

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      log.statusCode = response.status;
      log.response = await response.text().catch(() => '');

      if (response.ok) {
        log.success = true;
        break;
      }
    } catch (error) {
      log.response = error instanceof Error ? error.message : String(error);
    }

    // Wait before retry (exponential backoff)
    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
    }
  }

  // Save delivery log
  try {
    const logs = (await getTenantData<WebhookDeliveryLog[]>(tenantId, 'pos_webhook_logs')) || [];
    logs.unshift(log);
    if (logs.length > 500) logs.length = 500;
    await setTenantData(tenantId, 'pos_webhook_logs', logs);
  } catch (err) {
    console.error('[Webhook] Failed to save delivery log:', err);
  }

  if (!log.success) {
    console.warn(
      `[Webhook] Failed to deliver ${payload.event} to ${webhook.url} after ${maxRetries} attempts`
    );
  }
}

/** Get webhook delivery logs for a tenant */
export async function getWebhookLogs(tenantId: string): Promise<WebhookDeliveryLog[]> {
  return (await getTenantData<WebhookDeliveryLog[]>(tenantId, 'pos_webhook_logs')) || [];
}
