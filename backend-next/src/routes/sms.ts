import express, { Request, Response, NextFunction } from 'express';
import { smsService } from '../services/smsService';
import { SMSHistory } from '../models/SMSHistory';
import { SMSConfig } from '../models/SMSConfig';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();

// All SMS routes require authentication
router.use(authenticateToken);
router.use(requireAdmin);

// Get SMS Config for tenant (mask sensitive keys)
router.get('/config', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }
    
    let config = await SMSConfig.findOne({ tenantId });
    if (!config) {
      return res.json({
        provider: 'greenweb',
        apiKey: '',
        apiToken: '',
        apiUrl: '',
        userId: '',
        senderId: '',
        voiceSupported: false,
        isActive: false,
      });
    }
    
    res.json({
      provider: config.provider,
      apiKey: config.apiKey ? `${config.apiKey.substring(0, 4)}${'*'.repeat(Math.max(0, config.apiKey.length - 4))}` : '',
      apiToken: config.apiToken ? '********' : '',
      apiUrl: config.apiUrl,
      userId: config.userId,
      senderId: config.senderId,
      voiceSupported: config.voiceSupported,
      isActive: config.isActive,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch SMS config' });
  }
});

// Save SMS Config for tenant
router.post('/config', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const { provider, apiKey, apiToken, apiUrl, userId, senderId, voiceSupported, isActive } = req.body;

    const config = await SMSConfig.findOneAndUpdate(
      { tenantId },
      {
        $set: {
          provider: provider || 'greenweb',
          apiKey: apiKey || '',
          apiToken: apiToken || '',
          apiUrl: apiUrl || '',
          userId: userId || '',
          senderId: senderId || '',
          voiceSupported: voiceSupported || false,
          isActive: isActive !== undefined ? isActive : true,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          tenantId,
          createdAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'SMS configuration saved successfully',
      config: {
        provider: config.provider,
        apiKey: config.apiKey,
        apiToken: config.apiToken,
        apiUrl: config.apiUrl,
        userId: config.userId,
        senderId: config.senderId,
        voiceSupported: config.voiceSupported,
        isActive: config.isActive,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to save SMS config' });
  }
});

// Get SMS balance
router.get('/balance', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const balance = await smsService.getBalance(tenantId);
    res.json(balance);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch balance' });
  }
});

// Get SMS history
router.get('/history', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }
    const history = await SMSHistory.find({ tenantId }).sort({ createdAt: -1 }).limit(50);
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch history' });
  }
});

// Send SMS
router.post('/send', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const { recipients, message, type = 'sms' } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'Recipients required' });
    }
    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    const historyRecord = new SMSHistory({
      tenantId,
      recipients: recipients.map((r: any) => r.phone),
      message,
      type,
      status: 'pending',
    });
    await historyRecord.save();

    const result = await smsService.sendSMS(tenantId, recipients, message);

    historyRecord.status = result.sentCount > 0 && result.failedCount > 0 ? 'partial' 
                          : result.sentCount > 0 ? 'sent' : 'failed';
    historyRecord.sentCount = result.sentCount;
    historyRecord.failedCount = result.failedCount;
    historyRecord.results = result.results.map((r, i) => ({
      phone: recipients[i]?.phone || '',
      success: r.success,
      error: r.error,
      messageId: r.messageId,
    }));
    await historyRecord.save();

    res.json({
      success: result.sentCount > 0,
      sentCount: result.sentCount,
      failedCount: result.failedCount,
      historyId: historyRecord._id,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to send SMS' });
  }
});

// Send Voice Message
router.post('/send-voice', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const { recipients, message } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'Recipients required' });
    }
    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    const historyRecord = new SMSHistory({
      tenantId,
      recipients: recipients.map((r: any) => r.phone),
      message,
      type: 'voice',
      status: 'pending',
    });
    await historyRecord.save();

    const result = await smsService.sendVoiceMessage(tenantId, recipients, message);

    historyRecord.status = result.sentCount > 0 && result.failedCount > 0 ? 'partial' 
                          : result.sentCount > 0 ? 'sent' : 'failed';
    historyRecord.sentCount = result.sentCount;
    historyRecord.failedCount = result.failedCount;
    await historyRecord.save();

    res.json({
      success: result.sentCount > 0,
      sentCount: result.sentCount,
      failedCount: result.failedCount,
      historyId: historyRecord._id,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to send voice message' });
  }
});

export default router;
