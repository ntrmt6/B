import api from '@/lib/api';

export interface WebhookRegistration {
  id: string;
  tenantId: string;
  url: string;
  events: string[];
  secret?: string;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDeliveryLog {
  id: string;
  webhookId: string;
  event: string;
  url: string;
  statusCode?: number;
  success: boolean;
  attempts: number;
  lastAttemptAt: string;
  createdAt: string;
}

export async function fetchWebhooks(tenantId: string): Promise<WebhookRegistration[]> {
  const res = await api.get('/webhooks', { headers: { 'X-Tenant-Id': tenantId } });
  return res.data?.data || [];
}

export async function createWebhook(
  tenantId: string,
  data: { url: string; events: string[]; secret?: string; description?: string; isActive?: boolean }
): Promise<WebhookRegistration> {
  const res = await api.post('/webhooks', data, { headers: { 'X-Tenant-Id': tenantId } });
  return res.data?.data;
}

export async function updateWebhook(tenantId: string, id: string, data: Partial<WebhookRegistration>): Promise<WebhookRegistration> {
  const res = await api.put(`/webhooks/${id}`, data, { headers: { 'X-Tenant-Id': tenantId } });
  return res.data?.data;
}

export async function deleteWebhook(tenantId: string, id: string): Promise<void> {
  await api.delete(`/webhooks/${id}`, { headers: { 'X-Tenant-Id': tenantId } });
}

export async function fetchWebhookLogs(tenantId: string): Promise<WebhookDeliveryLog[]> {
  const res = await api.get('/webhooks/logs', { headers: { 'X-Tenant-Id': tenantId } });
  return res.data?.data || [];
}
