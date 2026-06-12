import { Router, Request, Response } from 'express';
import { getDatabase } from '../db/mongo';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();

const FB_GRAPH_API = 'https://graph.facebook.com/v18.0';

// ========== CONFIG ENDPOINTS ==========

// GET /api/facebook-pixel/config — fetch pixel config for the tenant
router.get('/config', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const db = await getDatabase();
    const config = await db.collection('facebook_pixel_configs').findOne({ tenantId });

    res.json({
      data: {
        pixelId: config?.pixelId || '',
        accessToken: config?.accessToken || '',
        enableTestEvent: config?.enableTestEvent || false,
        isEnabled: config?.isEnabled || false,
      }
    });
  } catch (error) {
    console.error('[FacebookPixel] Get config error:', error);
    res.status(500).json({ error: 'Failed to get Facebook Pixel config' });
  }
});

// POST /api/facebook-pixel/config — save pixel config for the tenant
router.post('/config', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { pixelId, accessToken, enableTestEvent, isEnabled } = req.body;

    const db = await getDatabase();
    await db.collection('facebook_pixel_configs').updateOne(
      { tenantId },
      {
        $set: {
          tenantId,
          pixelId: (pixelId || '').trim(),
          accessToken: (accessToken || '').trim(),
          enableTestEvent: !!enableTestEvent,
          isEnabled: !!isEnabled,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    console.log('[FacebookPixel] Saved config for tenant ' + tenantId);
    res.json({ success: true, message: 'Facebook Pixel config saved' });
  } catch (error) {
    console.error('[FacebookPixel] Save config error:', error);
    res.status(500).json({ error: 'Failed to save Facebook Pixel config' });
  }
});

// ========== SERVER-SIDE CONVERSIONS API ==========

// POST /api/facebook-pixel/event — send server-side event via Conversions API
router.post('/event', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const db = await getDatabase();
    const config = await db.collection('facebook_pixel_configs').findOne({ tenantId });

    if (!config || !config.isEnabled || !config.pixelId || !config.accessToken) {
      return res.status(400).json({ error: 'Facebook Pixel is not configured or disabled' });
    }

    const { eventName, eventData, userData, eventSourceUrl, eventId } = req.body;

    if (!eventName) {
      return res.status(400).json({ error: 'eventName is required' });
    }

    // Hash user data fields for privacy (SHA-256, lowercase)
    const hashField = (value?: string): string | undefined => {
      if (!value) return undefined;
      return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
    };

    const hashedUserData: Record<string, string | string[] | undefined> = {};
    if (userData) {
      if (userData.email) hashedUserData.em = [hashField(userData.email)!];
      if (userData.phone) hashedUserData.ph = [hashField(userData.phone)!];
      if (userData.firstName) hashedUserData.fn = [hashField(userData.firstName)!];
      if (userData.lastName) hashedUserData.ln = [hashField(userData.lastName)!];
      if (userData.city) hashedUserData.ct = [hashField(userData.city)!];
      if (userData.country) hashedUserData.country = [hashField(userData.country)!];
      if (userData.zip) hashedUserData.zp = [hashField(userData.zip)!];
      // Client-side identifiers (not hashed)
      if (userData.fbc) hashedUserData.fbc = userData.fbc;
      if (userData.fbp) hashedUserData.fbp = userData.fbp;
      if (userData.clientIpAddress) hashedUserData.client_ip_address = userData.clientIpAddress;
      if (userData.clientUserAgent) hashedUserData.client_user_agent = userData.clientUserAgent;
    }

    const eventPayload: Record<string, unknown> = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      user_data: hashedUserData,
    };

    if (eventSourceUrl) eventPayload.event_source_url = eventSourceUrl;
    if (eventId) eventPayload.event_id = eventId;

    if (eventData) {
      eventPayload.custom_data = {
        ...(eventData.value !== undefined && { value: String(eventData.value) }),
        ...(eventData.currency && { currency: eventData.currency }),
        ...(eventData.contentName && { content_name: eventData.contentName }),
        ...(eventData.contentCategory && { content_category: eventData.contentCategory }),
        ...(eventData.contentIds && { content_ids: eventData.contentIds }),
        ...(eventData.contentType && { content_type: eventData.contentType }),
        ...(eventData.numItems !== undefined && { num_items: eventData.numItems }),
        ...(eventData.orderId && { order_id: eventData.orderId }),
      };
    }

    const payload: Record<string, unknown> = {
      data: [eventPayload],
      access_token: config.accessToken,
    };

    if (config.enableTestEvent) {
      payload.test_event_code = 'TEST' + config.pixelId.slice(-5);
    }

    const fbResponse = await fetch(
      FB_GRAPH_API + '/' + config.pixelId + '/events',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    const fbResult = await fbResponse.json();

    if (!fbResponse.ok) {
      console.error('[FacebookPixel] Conversions API error for tenant ' + tenantId + ':', fbResult);
      return res.status(fbResponse.status).json({
        error: 'Facebook Conversions API error',
        details: (fbResult as any).error?.message || fbResult,
      });
    }

    console.log('[FacebookPixel] Event sent for tenant ' + tenantId + ':', fbResult);
    res.json({ success: true, result: fbResult });
  } catch (error) {
    console.error('[FacebookPixel] Event send error:', error);
    res.status(500).json({ error: 'Failed to send event to Facebook' });
  }
});

export const facebookPixelRouter = router;
