import { CourierConfig, PathaoConfig, Order } from '../types';

// Use backend proxy to avoid CORS issues
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return window.location.origin;
    }
  }
  return  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001';
};

const sanitizePhone = (value?: string) => {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('88') && digits.length > 11) return digits.slice(2);
  if (!digits.startsWith('0') && digits.length === 10) return `0${digits}`;
  return digits;
};

const normalizeInvoice = (id: string) => id.replace(/[^a-zA-Z0-9]/g, '').slice(-20) || `INV-${Date.now()}`;

const buildSteadfastPayload = (order: Order, config: CourierConfig) => {
  const payload: Record<string, unknown> = {
    invoice: normalizeInvoice(order.id),
    recipient_name: order.customer,
    recipient_phone: sanitizePhone(order.phone),
    recipient_address: order.location,
    recipient_city: order.division || 'Dhaka',
    cod_amount: Math.round(order.amount),
    note: config.instruction || `Delivery type: ${order.deliveryType || 'Regular'}`,
    delivery_type: order.deliveryType === 'Express' ? 'express' : 'regular',
    item_weight: 1,
    requested_delivery_time: order.deliveryType === 'Express' ? 'asap' : undefined,
    product_id: order.productId ? String(order.productId) : undefined,
    product_description: order.productName,
    customer_email: order.email,
  };
  return Object.fromEntries(Object.entries(payload).filter(([, val]) => val !== undefined && val !== null));
};

export interface CourierSyncResult {
  trackingId: string;
  reference?: string;
  payload: Record<string, unknown>;
  response: any;
}

export interface FraudCheckResult {
  status: string;
  riskScore?: number;
  remarks?: string;
  raw: any;
}

export interface CourierStatusResult {
  provider: 'Steadfast' | 'Pathao';
  trackingId: string;
  status: string;
  raw: any;
}

const titleCaseStatus = (value: string) => value
  .replace(/[_-]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .replace(/\b\w/g, (char) => char.toUpperCase());

const pickCourierStatus = (payload: any): string => {
  const candidates = [
    payload?.delivery_status,
    payload?.deliveryStatus,
    payload?.order_status,
    payload?.orderStatus,
    payload?.status,
    payload?.current_status,
    payload?.currentStatus,
    payload?.state,
    payload?.consignment?.delivery_status,
    payload?.consignment?.status,
    payload?.data?.delivery_status,
    payload?.data?.order_status,
    payload?.data?.status,
    Array.isArray(payload?.data) ? payload.data[0]?.delivery_status : undefined,
    Array.isArray(payload?.data) ? payload.data[0]?.status : undefined,
  ];

  const status = candidates.find((value) => typeof value === 'string' && value.trim());
  return status ? titleCaseStatus(status) : 'Status Unavailable';
};

const resolveTrackingId = (order: Order): string => {
  if (order.trackingId) {
    return order.trackingId;
  }

  if (!order.courierMeta) {
    return '';
  }

  const candidates = [
    order.courierMeta.tracking_id,
    order.courierMeta.trackingCode,
    order.courierMeta.consignment_id,
    order.courierMeta.invoice,
    order.courierMeta.data?.consignment_id,
    order.courierMeta.data?.tracking_code,
    order.courierMeta.consignment?.tracking_code,
  ];

  const match = candidates.find((value) => typeof value === 'string' || typeof value === 'number');
  return match ? String(match) : '';
};

export class CourierService {
  // ========== STEADFAST ==========
  static async sendToSteadfast(order: Order, config: CourierConfig): Promise<CourierSyncResult> {
    if (!config.apiKey || !config.secretKey) {
      throw new Error('Steadfast credentials are missing. Update Courier Settings and try again.');
    }
    if (!order.phone) {
      throw new Error('Customer phone number is missing for this order.');
    }

    const orderData = buildSteadfastPayload(order, config);

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/courier/steadfast/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          apiKey: config.apiKey.trim(),
          secretKey: config.secretKey.trim(),
          orderData
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || data?.message || 'Steadfast API request failed.');
      }

      const trackingId = data?.tracking_code || data?.consignment?.tracking_code || data?.consignment_id || data?.invoice;
      if (!trackingId) {
        throw new Error('Steadfast response did not include a tracking ID.');
      }

      return {
        trackingId,
        reference: data?.consignment_id || data?.consignment?.consignment_id || data?.invoice,
        payload: orderData,
        response: data
      };
    } catch (error) {
      throw error instanceof Error ? error : new Error('Unexpected error while contacting Steadfast.');
    }
  }

  static async checkFraudRisk(order: Order, config: CourierConfig): Promise<FraudCheckResult> {
    if (!config.apiKey || !config.secretKey) {
      throw new Error('Steadfast credentials are missing. Update Courier Settings and try again.');
    }
    if (!order.phone) {
      throw new Error('Customer phone number is required to run a fraud check.');
    }

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/courier/steadfast/fraud-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          apiKey: config.apiKey.trim(),
          secretKey: config.secretKey.trim(),
          phone: order.phone
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || data?.message || 'Fraud check failed.');
      }

      const deliveryCount = data?.delivery_count || 0;
      const cancelCount = data?.cancel_count || 0;
      const totalOrders = deliveryCount + cancelCount;
      
      let riskScore = 0;
      if (totalOrders > 0) {
        riskScore = Math.round((cancelCount / totalOrders) * 100);
      }

      return {
        status: data?.status || 'Unknown',
        riskScore,
        remarks: `Delivered: ${deliveryCount}, Cancelled: ${cancelCount}${data?.message ? ` - ${data.message}` : ''}`,
        raw: data?.raw || data,
      };
    } catch (error) {
      throw error instanceof Error ? error : new Error('Unexpected error during Steadfast fraud check.');
    }
  }

  static async getSteadfastStatus(order: Order, config: CourierConfig): Promise<CourierStatusResult> {
    if (!config.apiKey || !config.secretKey) {
      throw new Error('Steadfast credentials are missing.');
    }

    const trackingId = resolveTrackingId(order);
    if (!trackingId) {
      throw new Error('Steadfast tracking ID is missing.');
    }

    const response = await fetch(`${getApiBaseUrl()}/api/courier/steadfast/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        apiKey: config.apiKey.trim(),
        secretKey: config.secretKey.trim(),
        consignmentId: trackingId,
        trackingCode: trackingId,
        invoice: trackingId,
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.error || data?.message || 'Failed to fetch Steadfast status.');
    }

    return {
      provider: 'Steadfast',
      trackingId,
      status: pickCourierStatus(data),
      raw: data,
    };
  }

  // ========== PATHAO ==========
  static async sendToPathao(order: Order, config: PathaoConfig): Promise<CourierSyncResult> {
    if (!config.apiKey || !config.secretKey || !config.username || !config.password) {
      throw new Error('Pathao credentials are missing. Update Courier Settings and try again.');
    }
    if (!config.storeId) {
      throw new Error('Pathao Store ID is missing. Update Courier Settings and try again.');
    }
    if (!order.phone) {
      throw new Error('Customer phone number is missing for this order.');
    }

    // Map division names to Pathao city IDs
    const cityIdMap: Record<string, number> = {
      'dhaka': 1,
      'chittagong': 2,
      'chattogram': 2,
      'rajshahi': 3,
      'khulna': 4,
      'sylhet': 5,
      'barisal': 6,
      'barishal': 6,
      'rangpur': 7,
      'mymensingh': 8
    };

    // Try to determine city from order location/division
    const locationLower = (order.location || '').toLowerCase();
    const divisionLower = (order.division || '').toLowerCase();
    let recipientCity = 1; // Default to Dhaka

    for (const [cityName, cityId] of Object.entries(cityIdMap)) {
      if (locationLower.includes(cityName) || divisionLower.includes(cityName)) {
        recipientCity = cityId;
        break;
      }
    }

    const orderData = {
      invoice: normalizeInvoice(order.id),
      recipientName: order.customer,
      recipientPhone: sanitizePhone(order.phone),
      recipientAddress: order.location,
      recipientCity: order.pathaoCity || recipientCity, // Use order-specific or mapped city
      recipientZone: order.pathaoZone || 1, // Use order-specific zone or default
      recipientArea: order.pathaoArea || 1, // Required by Pathao API
      amountToCollect: Math.round(order.amount),
      itemDescription: order.productName || 'Product',
      itemQuantity: order.quantity || 1,
      itemWeight: order.weight || 0.5,
      itemType: 2, // 2 = Parcel (required by Pathao)
      deliveryType: order.deliveryType === 'Express' ? 12 : 48, // 12 = Same Day, 48 = Normal
      specialInstruction: config.instruction || `Delivery type: ${order.deliveryType || 'Regular'}`
    };

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/courier/pathao/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          apiKey: config.apiKey.trim(),
          secretKey: config.secretKey.trim(),
          username: config.username.trim(),
          password: config.password.trim(),
          storeId: config.storeId.trim(),
          orderData
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || data?.message || 'Pathao API request failed.');
      }

      const trackingId = data?.data?.consignment_id || data?.consignment_id || data?.data?.tracking_code || data?.tracking_code;
      if (!trackingId) {
        throw new Error('Pathao response did not include a tracking ID.');
      }

      return {
        trackingId,
        reference: data?.data?.consignment_id || data?.consignment_id,
        payload: orderData,
        response: data
      };
    } catch (error) {
      throw error instanceof Error ? error : new Error('Unexpected error while contacting Pathao.');
    }
  }

  // ========== LOAD PATHAO CONFIG ==========
  static async loadPathaoConfig(tenantId: string): Promise<PathaoConfig | null> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/courier/pathao/config`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': tenantId
        },
        credentials: 'include'
      });

      if (!response.ok) return null;

      const data = await response.json();
      return {
        apiKey: data.apiKey || '',
        secretKey: data.secretKey || '',
        username: data.username || '',
        password: data.password || '',
        storeId: data.storeId || '',
        instruction: data.instruction || ''
      };
    } catch {
      return null;
    }
  }

  static async getPathaoStatus(order: Order, config: PathaoConfig, tenantId: string): Promise<CourierStatusResult> {
    if (!config.apiKey || !config.secretKey || !config.username || !config.password) {
      throw new Error('Pathao credentials are missing.');
    }

    const trackingId = resolveTrackingId(order);
    if (!trackingId) {
      throw new Error('Pathao consignment ID is missing.');
    }

    const response = await fetch(`${getApiBaseUrl()}/api/courier/pathao/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Id': tenantId,
      },
      credentials: 'include',
      body: JSON.stringify({
        apiKey: config.apiKey.trim(),
        secretKey: config.secretKey.trim(),
        username: config.username.trim(),
        password: config.password.trim(),
        consignmentId: trackingId,
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.error || data?.message || 'Failed to fetch Pathao status.');
    }

    return {
      provider: 'Pathao',
      trackingId,
      status: pickCourierStatus(data),
      raw: data,
    };
  }
}
