import { Router, Request, Response, NextFunction } from 'express';
import { getDatabase } from '../db/mongo';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// All courier routes require authentication
router.use(authenticateToken);
router.use(requireAdmin);

const STEADFAST_BASE_URL = 'https://portal.steadfast.com.bd/api/v1';
const PATHAO_BASE_URL = 'https://api-hermes.pathao.com';

// Common headers for Steadfast API
const getSteadfastHeaders = (apiKey: string, secretKey: string) => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Api-Key': apiKey.trim(),
  'Secret-Key': secretKey.trim(),
});

// Pathao token cache
const pathaoTokenCache: Map<string, { token: string; expiresAt: number }> = new Map();

// Get Pathao access token
const getPathaoToken = async (apiKey: string, secretKey: string, username: string, password: string, tenantId: string): Promise<string> => {
  const cached = pathaoTokenCache.get(tenantId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.token;
  }

  console.log('[Pathao] Getting new access token...');
  
  const response = await fetch(`${PATHAO_BASE_URL}/aladdin/api/v1/issue-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      client_id: apiKey,
      client_secret: secretKey,
      username: username,
      password: password,
      grant_type: 'password'
    })
  });

  const data = await response.json();
  
  if (!response.ok || !data.access_token) {
    console.error('[Pathao] Token error:', data);
    throw new Error(data.message || data.error || 'Failed to get Pathao access token');
  }

  const expiresAt = Date.now() + (50 * 60 * 1000);
  pathaoTokenCache.set(tenantId, { token: data.access_token, expiresAt });
  
  console.log('[Pathao] Got new access token');
  return data.access_token;
};

// ========== STEADFAST CONFIG ==========

router.get('/config', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const db = await getDatabase();
    const config = await db.collection('courier_configs').findOne({ tenantId });
    
    res.json({
      apiKey: config?.apiKey ? `${config.apiKey.substring(0, 4)}${'*'.repeat(Math.max(0, config.apiKey.length - 4))}` : '',
      secretKey: config?.secretKey ? '********' : '',
      instruction: config?.instruction || '',
      hasCredentials: !!(config?.apiKey && config?.secretKey)
    });
  } catch (error) {
    console.error('[Courier] Get config error:', error);
    res.status(500).json({ error: 'Failed to get courier config' });
  }
});

router.post('/config', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { apiKey, secretKey, instruction } = req.body;
    const db = await getDatabase();

    await db.collection('courier_configs').updateOne(
      { tenantId },
      {
        $set: { tenantId, apiKey: apiKey || '', secretKey: secretKey || '', instruction: instruction || '', updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );

    console.log(`[Courier] Saved config for tenant ${tenantId}`);
    res.json({ success: true, message: 'Courier config saved successfully' });
  } catch (error) {
    console.error('[Courier] Save config error:', error);
    res.status(500).json({ error: 'Failed to save courier config' });
  }
});

// ========== STEADFAST ROUTES ==========

router.post('/steadfast/test-credentials', async (req: Request, res: Response) => {
  try {
    const { apiKey, secretKey } = req.body;

    if (!apiKey || !secretKey) {
      return res.status(400).json({ error: 'API Key and Secret Key are required' });
    }

    const response = await fetch(`${STEADFAST_BASE_URL}/get_balance`, {
      method: 'GET',
      headers: getSteadfastHeaders(apiKey, secretKey),
    });

    const responseText = await response.text();
    console.log('[Courier] Test credentials response:', response.status);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return res.status(502).json({
        valid: false,
        error: 'Steadfast API returned an invalid response.',
        status: response.status
      });
    }

    if (response.status === 500 && data?.message === 'Server Error') {
      return res.json({
        valid: false,
        error: 'Steadfast returned a server error. Credentials may be invalid or account needs activation.',
        hint: 'Please verify your API credentials on portal.steadfast.com.bd',
        status: response.status
      });
    }

    if (response.ok && data) {
      return res.json({
        valid: true,
        balance: data.current_balance || data.balance,
        message: 'API credentials are valid!'
      });
    }

    return res.json({
      valid: false,
      error: data?.message || 'Failed to verify credentials',
      status: response.status
    });
  } catch (error) {
    console.error('[Courier] Test credentials error:', error);
    res.status(500).json({ valid: false, error: 'Failed to connect to Steadfast API' });
  }
});

router.post('/steadfast/create-order', async (req: Request, res: Response) => {
  try {
    const { apiKey, secretKey, orderData } = req.body;

    if (!apiKey || !secretKey) {
      return res.status(400).json({ error: 'API Key and Secret Key are required' });
    }

    if (!orderData) {
      return res.status(400).json({ error: 'Order data is required' });
    }

    console.log('[Courier] Sending to Steadfast:', apiKey.substring(0, 8) + '...');

    const response = await fetch(`${STEADFAST_BASE_URL}/create_order`, {
      method: 'POST',
      headers: getSteadfastHeaders(apiKey, secretKey),
      body: JSON.stringify(orderData),
    });

    const responseText = await response.text();
    console.log('[Courier] Steadfast response:', response.status);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return res.status(502).json({
        error: 'Steadfast API returned an error.',
        status: response.status,
        hint: 'Please verify your API credentials.'
      });
    }

    if (response.status === 500) {
      return res.status(502).json({
        error: data?.message || 'Steadfast server error.',
        status: response.status
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.message || data?.errors?.[0] || 'Steadfast API request failed',
        details: data
      });
    }

    res.json(data);
  } catch (error) {
    console.error('[Courier] Steadfast create order error:', error);
    res.status(500).json({ error: 'Failed to connect to Steadfast API' });
  }
});

router.post('/steadfast/fraud-check', async (req: Request, res: Response) => {
  try {
    const { apiKey, secretKey, phone } = req.body;

    if (!apiKey || !secretKey || !phone) {
      return res.status(400).json({ error: 'API Key, Secret Key, and Phone are required' });
    }

    let sanitizedPhone = phone.replace(/\D/g, '');
    if (sanitizedPhone.startsWith('88') && sanitizedPhone.length > 11) {
      sanitizedPhone = sanitizedPhone.slice(2);
    }
    if (!sanitizedPhone.startsWith('0') && sanitizedPhone.length === 10) {
      sanitizedPhone = `0${sanitizedPhone}`;
    }

    const response = await fetch(`${STEADFAST_BASE_URL}/status_by_phone/${sanitizedPhone}`, {
      method: 'GET',
      headers: getSteadfastHeaders(apiKey, secretKey),
    });

    const responseText = await response.text();
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return res.json({ status: 'New Customer', delivery_count: 0, cancel_count: 0 });
    }

    if (!response.ok) {
      return res.json({ status: 'No History', delivery_count: 0, cancel_count: 0 });
    }

    let deliveryCount = 0;
    let cancelCount = 0;
    let fraudStatus = 'Unknown';

    if (Array.isArray(data)) {
      data.forEach((order: any) => {
        const status = (order.delivery_status || '').toLowerCase();
        if (status === 'delivered') deliveryCount++;
        if (status === 'cancelled' || status === 'partial_delivered' || status === 'returned') cancelCount++;
      });
      
      const total = deliveryCount + cancelCount;
      if (total === 0) fraudStatus = 'New Customer';
      else if (cancelCount === 0) fraudStatus = 'Safe';
      else if (cancelCount / total > 0.5) fraudStatus = 'High Risk';
      else if (cancelCount / total > 0.25) fraudStatus = 'Medium Risk';
      else fraudStatus = 'Low Risk';
    }

    res.json({ status: fraudStatus, delivery_count: deliveryCount, cancel_count: cancelCount, raw: data });
  } catch (error) {
    console.error('[Courier] Fraud check error:', error);
    res.json({ status: 'Check Failed', delivery_count: 0, cancel_count: 0 });
  }
});

router.post('/steadfast/status', async (req: Request, res: Response) => {
  try {
    const { apiKey, secretKey, consignmentId, trackingCode, invoice } = req.body;

    if (!apiKey || !secretKey) {
      return res.status(400).json({ error: 'API Key and Secret Key are required' });
    }

    let endpoint = '';
    if (consignmentId) endpoint = `${STEADFAST_BASE_URL}/status_by_cid/${consignmentId}`;
    else if (trackingCode) endpoint = `${STEADFAST_BASE_URL}/status_by_trackingcode/${trackingCode}`;
    else if (invoice) endpoint = `${STEADFAST_BASE_URL}/status_by_invoice/${invoice}`;
    else return res.status(400).json({ error: 'consignmentId, trackingCode, or invoice is required' });

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: getSteadfastHeaders(apiKey, secretKey),
    });

    const responseText = await response.text();
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return res.status(502).json({ error: 'Steadfast API returned an invalid response' });
    }

    if (!response.ok) {
      return res.status(response.status).json({ error: data?.message || 'Steadfast API request failed', details: data });
    }

    res.json(data);
  } catch (error) {
    console.error('[Courier] Status check error:', error);
    res.status(500).json({ error: 'Failed to connect to Steadfast API' });
  }
});

// ========== PATHAO CONFIG ==========

router.get('/pathao/config', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const db = await getDatabase();
    const config = await db.collection('pathao_configs').findOne({ tenantId });
    
    res.json({
      apiKey: config?.apiKey || '',
      secretKey: config?.secretKey || '',
      username: config?.username || '',
      password: config?.password || '',
      storeId: config?.storeId || '',
      instruction: config?.instruction || ''
    });
  } catch (error) {
    console.error('[Pathao] Get config error:', error);
    res.status(500).json({ error: 'Failed to get Pathao config' });
  }
});

router.post('/pathao/config', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { apiKey, secretKey, username, password, storeId, instruction } = req.body;
    const db = await getDatabase();

    await db.collection('pathao_configs').updateOne(
      { tenantId },
      {
        $set: {
          tenantId,
          apiKey: apiKey || '',
          secretKey: secretKey || '',
          username: username || '',
          password: password || '',
          storeId: storeId || '',
          instruction: instruction || '',
          updatedAt: new Date()
        },
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );

    pathaoTokenCache.delete(tenantId);
    console.log(`[Pathao] Saved config for tenant ${tenantId}`);
    res.json({ success: true, message: 'Pathao config saved successfully' });
  } catch (error) {
    console.error('[Pathao] Save config error:', error);
    res.status(500).json({ error: 'Failed to save Pathao config' });
  }
});

// ========== PATHAO ROUTES ==========

router.post('/pathao/test-credentials', async (req: Request, res: Response) => {
  try {
    const { apiKey, secretKey, username, password } = req.body;

    if (!apiKey || !secretKey || !username || !password) {
      return res.status(400).json({ valid: false, error: 'All credentials are required' });
    }

    console.log('[Pathao] Testing credentials for:', username);

    const response = await fetch(`${PATHAO_BASE_URL}/aladdin/api/v1/issue-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        client_id: apiKey.trim(),
        client_secret: secretKey.trim(),
        username: username.trim(),
        password: password.trim(),
        grant_type: 'password'
      })
    });

    const responseText = await response.text();
    console.log('[Pathao] Test response:', response.status);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return res.json({ valid: false, error: 'Pathao API returned an invalid response' });
    }

    if (response.ok && data.access_token) {
      return res.json({ valid: true, message: 'Pathao credentials are valid! Connection successful.' });
    }

    return res.json({ valid: false, error: data.message || data.error || 'Invalid credentials' });
  } catch (error) {
    console.error('[Pathao] Test credentials error:', error);
    res.status(500).json({ valid: false, error: 'Failed to connect to Pathao API' });
  }
});

router.post('/pathao/stores', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'temp';
    const { apiKey, secretKey, username, password } = req.body;

    if (!apiKey || !secretKey || !username || !password) {
      return res.status(400).json({ error: 'Credentials are required' });
    }

    const token = await getPathaoToken(apiKey, secretKey, username, password, tenantId);

    const response = await fetch(`${PATHAO_BASE_URL}/aladdin/api/v1/stores`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' }
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || 'Failed to fetch stores' });
    }
    res.json(data);
  } catch (error: any) {
    console.error('[Pathao] Get stores error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch Pathao stores' });
  }
});

router.post('/pathao/cities', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'temp';
    const { apiKey, secretKey, username, password } = req.body;

    if (!apiKey || !secretKey || !username || !password) {
      return res.status(400).json({ error: 'Credentials are required' });
    }

    const token = await getPathaoToken(apiKey, secretKey, username, password, tenantId);

    const response = await fetch(`${PATHAO_BASE_URL}/aladdin/api/v1/countries/1/city-list`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' }
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || 'Failed to fetch cities' });
    }
    res.json(data);
  } catch (error: any) {
    console.error('[Pathao] Get cities error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch Pathao cities' });
  }
});

router.post('/pathao/zones', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'temp';
    const { apiKey, secretKey, username, password, cityId } = req.body;

    if (!apiKey || !secretKey || !username || !password) {
      return res.status(400).json({ error: 'Credentials are required' });
    }
    if (!cityId) {
      return res.status(400).json({ error: 'City ID is required' });
    }

    const token = await getPathaoToken(apiKey, secretKey, username, password, tenantId);

    const response = await fetch(`${PATHAO_BASE_URL}/aladdin/api/v1/cities/${cityId}/zone-list`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' }
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || 'Failed to fetch zones' });
    }
    res.json(data);
  } catch (error: any) {
    console.error('[Pathao] Get zones error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch Pathao zones' });
  }
});

router.post('/pathao/areas', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'temp';
    const { apiKey, secretKey, username, password, zoneId } = req.body;

    if (!apiKey || !secretKey || !username || !password) {
      return res.status(400).json({ error: 'Credentials are required' });
    }
    if (!zoneId) {
      return res.status(400).json({ error: 'Zone ID is required' });
    }

    const token = await getPathaoToken(apiKey, secretKey, username, password, tenantId);

    const response = await fetch(`${PATHAO_BASE_URL}/aladdin/api/v1/zones/${zoneId}/area-list`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' }
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || 'Failed to fetch areas' });
    }
    res.json(data);
  } catch (error: any) {
    console.error('[Pathao] Get areas error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch Pathao areas' });
  }
});

router.post('/pathao/create-order', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'temp';
    const { apiKey, secretKey, username, password, storeId, orderData } = req.body;

    if (!apiKey || !secretKey || !username || !password) {
      return res.status(400).json({ error: 'Credentials are required' });
    }
    if (!storeId) {
      return res.status(400).json({ error: 'Store ID is required' });
    }
    if (!orderData) {
      return res.status(400).json({ error: 'Order data is required' });
    }

    console.log('[Pathao] Creating order for store:', storeId);

    const token = await getPathaoToken(apiKey, secretKey, username, password, tenantId);

    const pathaoOrderData = {
      store_id: parseInt(storeId),
      merchant_order_id: orderData.invoice || orderData.orderId,
      recipient_name: orderData.recipientName,
      recipient_phone: orderData.recipientPhone,
      recipient_address: orderData.recipientAddress,
      recipient_city: orderData.recipientCity || 1, // Default to Dhaka
      recipient_zone: orderData.recipientZone || 1, // Default zone
      recipient_area: orderData.recipientArea || 1, // Required - default area
      delivery_type: orderData.deliveryType || 48,
      item_type: orderData.itemType || 2,
      special_instruction: orderData.specialInstruction || '',
      item_quantity: orderData.itemQuantity || 1,
      item_weight: orderData.itemWeight || 0.5,
      amount_to_collect: orderData.amountToCollect || 0,
      item_description: orderData.itemDescription || ''
    };

    console.log('[Pathao] Order payload:', JSON.stringify(pathaoOrderData, null, 2));

    const response = await fetch(`${PATHAO_BASE_URL}/aladdin/api/v1/orders`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(pathaoOrderData)
    });

    const responseText = await response.text();
    console.log('[Pathao] Create order response:', response.status);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return res.status(502).json({ error: 'Pathao API returned an invalid response' });
    }

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || data.errors || 'Failed to create Pathao order', details: data });
    }

    console.log('[Pathao] Order created successfully');
    res.json(data);
  } catch (error: any) {
    console.error('[Pathao] Create order error:', error);
    res.status(500).json({ error: error.message || 'Failed to create Pathao order' });
  }
});

router.post('/pathao/status', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'temp';
    const { apiKey, secretKey, username, password, consignmentId } = req.body;

    if (!apiKey || !secretKey || !username || !password) {
      return res.status(400).json({ error: 'Credentials are required' });
    }
    if (!consignmentId) {
      return res.status(400).json({ error: 'Consignment ID is required' });
    }

    const token = await getPathaoToken(apiKey, secretKey, username, password, tenantId);

    const response = await fetch(`${PATHAO_BASE_URL}/aladdin/api/v1/orders/${encodeURIComponent(String(consignmentId))}/info`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    const responseText = await response.text();

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return res.status(502).json({ error: 'Pathao API returned an invalid response' });
    }

    if (!response.ok) {
      return res.status(response.status).json({ error: data?.message || data?.error || 'Failed to fetch Pathao order status', details: data });
    }

    res.json(data);
  } catch (error: any) {
    console.error('[Pathao] Status check error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch Pathao order status' });
  }
});

router.post('/pathao/price-calculation', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'temp';
    const { apiKey, secretKey, username, password, storeId, recipientCity, recipientZone, itemWeight, deliveryType } = req.body;

    if (!apiKey || !secretKey || !username || !password) {
      return res.status(400).json({ error: 'Credentials are required' });
    }

    const token = await getPathaoToken(apiKey, secretKey, username, password, tenantId);

    const response = await fetch(`${PATHAO_BASE_URL}/aladdin/api/v1/merchant/price-plan`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        store_id: parseInt(storeId),
        recipient_city: recipientCity,
        recipient_zone: recipientZone,
        item_weight: itemWeight || 0.5,
        delivery_type: deliveryType || 48
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || 'Failed to calculate price' });
    }
    res.json(data);
  } catch (error: any) {
    console.error('[Pathao] Price calculation error:', error);
    res.status(500).json({ error: error.message || 'Failed to calculate Pathao price' });
  }
});

export const courierRouter = router;
