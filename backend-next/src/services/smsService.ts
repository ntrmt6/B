import axios from 'axios';
import { SMSConfig } from '../models/SMSConfig';

interface SMSRecipient {
  phone: string;
  name?: string;
}

interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface BalanceResult {
  smsBalance: number;
  minuteBalance: number;
}

interface TenantSMSConfig {
  provider: 'greenweb' | 'ssl_wireless' | 'bulksmsbd' | 'custom';
  apiKey?: string;
  apiToken?: string;
  apiUrl?: string;
  userId?: string;
  senderId?: string;
  voiceSupported: boolean;
  isActive: boolean;
}

class SMSService {
  private getDefaultConfig(): TenantSMSConfig {
    return {
      provider: (process.env.SMS_PROVIDER as TenantSMSConfig['provider']) || 'greenweb',
      apiKey: process.env.SMS_API_KEY || process.env.GREENWEB_API_TOKEN || '',
      apiToken: process.env.GREENWEB_API_TOKEN || '',
      senderId: process.env.SMS_SENDER_ID || '8809617624588',
      voiceSupported: false,
      isActive: !!process.env.GREENWEB_API_TOKEN,
    };
  }

  private async getTenantConfig(tenantId?: string): Promise<TenantSMSConfig> {
    if (tenantId) {
      try {
        const config = await SMSConfig.findOne({ tenantId });
        if (config && config.isActive) {
          return {
            provider: (config.provider as TenantSMSConfig['provider']),
            apiKey: config.apiKey || '',
            apiToken: config.apiToken || '',
            apiUrl: config.apiUrl || '',
            userId: config.userId || '',
            senderId: config.senderId || '',
            voiceSupported: config.voiceSupported,
            isActive: config.isActive,
          };
        }
      } catch (error) {
        console.error('Error fetching tenant SMS config:', error);
      }
    }
    return this.getDefaultConfig();
  }

  private formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('88')) return cleaned;
    if (cleaned.startsWith('0')) return '88' + cleaned;
    return '880' + cleaned;
  }

  async getBalance(tenantId?: string): Promise<BalanceResult> {
    try {
      const config = await this.getTenantConfig(tenantId);
      
      if (config.provider === 'greenweb' && config.apiToken) {
        const response = await axios.get(
          `http://api.greenweb.com.bd/api2.php?token=${config.apiToken}&balance`
        );
        const balance = parseFloat(response.data) || 0;
        return { smsBalance: Math.floor(balance / 0.25), minuteBalance: 0 };
      }
      
      if (config.provider === 'ssl_wireless' && config.apiKey) {
        try {
          const response = await axios.get(
            `https://smsplus.sslwireless.com/api/v3/balance?api_token=${config.apiKey}`
          );
          const balance = parseFloat(response.data?.balance) || 0;
          return { smsBalance: Math.floor(balance), minuteBalance: 0 };
        } catch (error) {
          console.error('SSL Wireless balance error:', error);
        }
      }
      
      if (config.provider === 'bulksmsbd' && config.apiKey) {
        try {
          const response = await axios.get(
            `https://bulksmsbd.net/api/getBalanceApi?api_key=${config.apiKey}`
          );
          const balance = parseFloat(response.data?.balance) || 0;
          return { smsBalance: Math.floor(balance), minuteBalance: 0 };
        } catch (error) {
          console.error('BulkSMSBD balance error:', error);
        }
      }

      return { smsBalance: 0, minuteBalance: 0 };
    } catch (error) {
      console.error('Error fetching SMS balance:', error);
      return { smsBalance: 0, minuteBalance: 0 };
    }
  }

  async sendSMS(tenantId: string, recipients: SMSRecipient[], message: string): Promise<{ results: SMSResult[]; sentCount: number; failedCount: number }> {
    const results: SMSResult[] = [];
    let sentCount = 0;
    let failedCount = 0;

    const config = await this.getTenantConfig(tenantId);

    if (!config.isActive) {
      return {
        results: recipients.map(() => ({ success: false, error: 'SMS not configured for this tenant' })),
        sentCount: 0,
        failedCount: recipients.length,
      };
    }

    for (const recipient of recipients) {
      try {
        const phone = this.formatPhone(recipient.phone);
        let result: SMSResult;

        switch (config.provider) {
          case 'greenweb':
            result = await this.sendViaGreenweb(config, phone, message);
            break;
          case 'ssl_wireless':
            result = await this.sendViaSSLWireless(config, phone, message);
            break;
          case 'bulksmsbd':
            result = await this.sendViaBulkSMSBD(config, phone, message);
            break;
          case 'custom':
            result = await this.sendViaCustomAPI(config, phone, message);
            break;
          default:
            result = { success: false, error: 'No SMS provider configured' };
        }

        results.push(result);
        if (result.success) sentCount++;
        else failedCount++;

        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error: any) {
        results.push({ success: false, error: error.message });
        failedCount++;
      }
    }

    return { results, sentCount, failedCount };
  }

  private async sendViaGreenweb(config: TenantSMSConfig, phone: string, message: string): Promise<SMSResult> {
    try {
      const response = await axios.get('http://api.greenweb.com.bd/api.php', {
        params: {
          token: config.apiToken,
          to: phone,
          message: message,
        },
      });

      const responseText = response.data?.toString() || '';
      if (responseText.includes('Ok:') || responseText.includes('ok:')) {
        return { success: true, messageId: responseText.split(':')[1]?.trim() };
      }
      return { success: false, error: responseText || 'Unknown error' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private async sendViaSSLWireless(config: TenantSMSConfig, phone: string, message: string): Promise<SMSResult> {
    try {
      const response = await axios.post('https://smsplus.sslwireless.com/api/v3/send-sms', {
        api_token: config.apiKey,
        sid: config.senderId || 'SYSTEMNE',
        msisdn: phone,
        sms: message,
        csms_id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      });

      if (response.data?.status === 'SUCCESS') {
        return { success: true, messageId: response.data?.smsinfo?.[0]?.sms_id };
      }
      return { success: false, error: response.data?.error_message || 'Unknown error' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private async sendViaBulkSMSBD(config: TenantSMSConfig, phone: string, message: string): Promise<SMSResult> {
    try {
      const response = await axios.post('https://bulksmsbd.net/api/smsapi', {
        api_key: config.apiKey,
        senderid: config.senderId || 'SYSTEMNE',
        number: phone,
        message: message,
      });

      if (response.data?.response_code === 202) {
        return { success: true, messageId: response.data?.message_id };
      }
      return { success: false, error: response.data?.error_message || 'Unknown error' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private async sendViaCustomAPI(config: TenantSMSConfig, phone: string, message: string): Promise<SMSResult> {
    if (!config.apiUrl) {
      return { success: false, error: 'Custom API URL not configured' };
    }

    try {
      const response = await axios.post(config.apiUrl, {
        api_key: config.apiKey,
        api_token: config.apiToken,
        sender_id: config.senderId,
        user_id: config.userId,
        phone: phone,
        message: message,
      });

      if (response.data?.success || response.data?.status === 'success' || response.status === 200) {
        return { success: true, messageId: response.data?.message_id || response.data?.id };
      }
      return { success: false, error: response.data?.error || response.data?.message || 'Unknown error' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async sendVoiceMessage(tenantId: string, recipients: SMSRecipient[], message: string): Promise<{ results: SMSResult[]; sentCount: number; failedCount: number }> {
    const config = await this.getTenantConfig(tenantId);

    if (!config.voiceSupported) {
      return {
        results: recipients.map(() => ({ success: false, error: 'Voice messages not supported by current provider' })),
        sentCount: 0,
        failedCount: recipients.length,
      };
    }

    return {
      results: recipients.map(() => ({ success: false, error: 'Voice messages not implemented for this provider' })),
      sentCount: 0,
      failedCount: recipients.length,
    };
  }
}

export const smsService = new SMSService();
export default smsService;
