import { ObjectId, type Filter } from 'mongodb';
import bcrypt from 'bcryptjs';
import { getDatabase } from '../db/mongo';
import { User } from '../models/User';
import type { CreateTenantPayload, Tenant, ShopStatus } from '../types/tenant';

const sanitizeSubdomain = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);

const collectionName = 'tenants';

const normalizeTenantDocument = (tenant: Tenant | null): Tenant | null => {
  if (!tenant) {
    return null;
  }

  return {
    ...tenant,
    _id: tenant._id ? tenant._id.toString() : tenant._id
  };
};

export const listTenants = async (): Promise<Tenant[]> => {
  const db = await getDatabase();
  const docs = await db.collection<Tenant>(collectionName).find({}).sort({ createdAt: -1 }).toArray();
  return docs.map((tenant) => normalizeTenantDocument(tenant) as Tenant);
};

export const getTenantById = async (id: string) => {
  // Validate if id is a valid ObjectId format (24 hex chars)
  const isValidObjectId = /^[a-fA-F0-9]{24}$/.test(id);
  const db = await getDatabase();
  
  // If valid ObjectId, search by _id; otherwise try searching by subdomain
  let tenant = null;
  if (isValidObjectId) {
    tenant = await db.collection<Tenant>(collectionName).findOne({ _id: new ObjectId(id) });
  }
  
  // Fallback: if not found or invalid ObjectId, try subdomain
  if (!tenant) {
    tenant = await db.collection<Tenant>(collectionName).findOne({ subdomain: id });
  }
  
  return normalizeTenantDocument(tenant);
};

export const getTenantBySubdomain = async (subdomain: string) => {
  const db = await getDatabase();
  const tenant = await db.collection<Tenant>(collectionName).findOne({ subdomain: sanitizeSubdomain(subdomain) });
  return normalizeTenantDocument(tenant);
};

export const getTenantByCustomDomain = async (customDomain: string) => {
  const db = await getDatabase();
  const tenant = await db.collection<Tenant>(collectionName).findOne({ 
    customDomain: customDomain.toLowerCase().trim() 
  });
  return normalizeTenantDocument(tenant);
};

export const createTenant = async (payload: CreateTenantPayload): Promise<Tenant> => {
  const now = new Date().toISOString();
  const subdomain = sanitizeSubdomain(payload.subdomain);
  if (!subdomain) {
    throw new Error('Invalid subdomain');
  }

  const db = await getDatabase();
  const collection = db.collection<Tenant>(collectionName);
  
  // Check if subdomain already exists
  const existing = await collection.findOne({ subdomain });
  if (existing) {
    throw new Error('Subdomain already in use');
  }

  // Check if admin email already exists
  const existingUser = await User.findOne({ email: payload.adminEmail.trim().toLowerCase() });
  if (existingUser) {
    throw new Error('Admin email already registered');
  }

  // Create tenant record (DON'T store password here!)
  const tenant: Tenant = {
    id: undefined as any, // Will be set by MongoDB after insert
    name: payload.name.trim(),
    subdomain,
    contactEmail: payload.contactEmail.trim().toLowerCase(),
    contactName: payload.contactName?.trim(),
    adminEmail: payload.adminEmail.trim().toLowerCase(),
    // NOTE: Do NOT include adminPassword in tenant document
    plan: (payload.plan || 'starter') as Tenant['plan'],
    status: 'trialing',
    onboardingCompleted: false,
    createdAt: now,
    updatedAt: now,
    branding: {},
    settings: {},
    // Initialize subscription for 30-day package
    subscription: {
      packageStartDate: now,
      packageDays: 30,
      gracePeriodDays: 7,
      isBlocked: false,
    },
  };

  const result = await collection.insertOne(tenant);
  const tenantId = result.insertedId.toString();

  // Create tenant admin user with proper error handling
  try {
    const hashedPassword = await bcrypt.hash(payload.adminPassword.trim(), 12);
    
    const newUser = new User({
      name: payload.contactName?.trim() || payload.name.trim() + ' Admin',
      email: payload.adminEmail.trim().toLowerCase(),
      password: hashedPassword,
      role: 'tenant_admin',
      tenantId: tenantId,
      isActive: true,
    });
    
    await newUser.save();
    console.log(`[tenantsService] Created admin user: ${newUser.email} (ID: ${newUser._id}) for tenant: ${tenantId}`);
  } catch (userError) {
    // Rollback: delete the tenant if user creation fails
    console.error(`[tenantsService] Failed to create admin user:`, userError);
    await collection.deleteOne({ _id: result.insertedId });
    throw new Error(`Failed to create tenant admin: ${(userError as Error).message}`);
  }

  console.log(`[tenantsService] Created tenant "${tenant.name}" (${tenantId}) with admin: ${tenant.adminEmail}`);

  // Initialize default tenant data
  try {
    await initializeTenantData(tenantId, tenant.name);
  } catch (dataError) {
    console.error(`[tenantsService] Warning: Failed to initialize tenant data:`, dataError);
    // Don't rollback for data initialization failure - tenant and user are created
  }

  return { ...tenant, _id: tenantId };
};

// Initialize default data for a new tenant
const initializeTenantData = async (tenantId: string, tenantName: string) => {
  const db = await getDatabase();
  const tenantDataCollection = db.collection('tenant_data');
  const now = new Date().toISOString();

  // Default products (empty array, tenant will add their own)
  await tenantDataCollection.updateOne(
    { tenantId, key: 'products' },
    {
      $set: { data: [], updatedAt: now },
      $setOnInsert: { tenantId, key: 'products', createdAt: now }
    },
    { upsert: true }
  );

  // Default orders (empty array)
  await tenantDataCollection.updateOne(
    { tenantId, key: 'orders' },
    {
      $set: { data: [], updatedAt: now },
      $setOnInsert: { tenantId, key: 'orders', createdAt: now }
    },
    { upsert: true }
  );

  // Default theme config
  await tenantDataCollection.updateOne(
    { tenantId, key: 'theme_config' },
    {
      $set: {
        data: {
          primaryColor: '#10b981',
          secondaryColor: '#f97316',
          tertiaryColor: '#c026d3',
          fontColor: '#0f172a',
          hoverColor: '#f97316',
          surfaceColor: '#e2e8f0',
          fontFamily: 'Inter',
          borderRadius: 'rounded',
          darkMode: false
        },
        updatedAt: now
      },
      $setOnInsert: { tenantId, key: 'theme_config', createdAt: now }
    },
    { upsert: true }
  );

  // Default website config
  await tenantDataCollection.updateOne(
    { tenantId, key: 'website' },
    {
      $set: {
        data: {
          storeName: tenantName,
          tagline: 'Welcome to our store',
          currency: 'BDT',
          logo: null,
          favicon: null,
          socialLinks: {}
        },
        updatedAt: now
      },
      $setOnInsert: { tenantId, key: 'website', createdAt: now }
    },
    { upsert: true }
  );

  // Default categories
  await tenantDataCollection.updateOne(
    { tenantId, key: 'categories' },
    {
      $set: { data: [], updatedAt: now },
      $setOnInsert: { tenantId, key: 'categories', createdAt: now }
    },
    { upsert: true }
  );

  console.log(`[tenantsService] Initialized default data for tenant: ${tenantId}`);
};

export const deleteTenant = async (id: string) => {
  const db = await getDatabase();
  
  // Delete tenant record
  const filter: Filter<Tenant> = { _id: new ObjectId(id) };
  await db.collection<Tenant>(collectionName).deleteOne(filter);

  // Delete all tenant data
  await db.collection('tenant_data').deleteMany({ tenantId: id });

  // Delete tenant users
  await User.deleteMany({ tenantId: id });

  // Delete tenant roles
  await db.collection('roles').deleteMany({ tenantId: id });

  // Delete tenant permissions
  await db.collection('permissions').deleteMany({ tenantId: id });

  console.log(`[tenantsService] Deleted tenant and all associated data: ${id}`);
};

export const updateTenant = async (id: string, updates: Partial<Tenant>) => {
  const db = await getDatabase();
  const allowedUpdates = ['name', 'contactEmail', 'contactName', 'customDomain', 'plan', 'branding', 'settings'];
  const filteredUpdates: Record<string, any> = {};
  
  for (const key of allowedUpdates) {
    if (updates[key as keyof Tenant] !== undefined) {
      filteredUpdates[key] = updates[key as keyof Tenant];
    }
  }
  
  filteredUpdates.updatedAt = new Date().toISOString();
  
  await db.collection<Tenant>(collectionName).updateOne(
    { _id: new ObjectId(id) },
    { $set: filteredUpdates }
  );
  
  return getTenantById(id);
};

export const updateTenantStatus = async (id: string, status: Tenant['status']) => {
  const db = await getDatabase();
  await db.collection<Tenant>(collectionName).updateOne(
    { _id: new ObjectId(id) },
    { $set: { status, updatedAt: new Date().toISOString() } }
  );
};

// Update tenant shop status
export const updateTenantShopStatus = async (id: string, shopStatus: ShopStatus) => {
  const db = await getDatabase();
  await db.collection<Tenant>(collectionName).updateOne(
    { _id: new ObjectId(id) },
    { $set: { shopStatus, updatedAt: new Date().toISOString() } }
  );
};

// Get tenant users
export const getTenantUsers = async (tenantId: string) => {
  const users = await User.find({ tenantId }).select('-password').sort({ createdAt: -1 });
  return users;
};

// Get tenant stats
export const getTenantStats = async (tenantId: string) => {
  const db = await getDatabase();
  
  const [users, products, orders] = await Promise.all([
    User.countDocuments({ tenantId }),
    db.collection('tenant_data').findOne({ tenantId, key: 'products' }),
    db.collection('tenant_data').findOne({ tenantId, key: 'orders' })
  ]);
  
  return {
    userCount: users,
    productCount: Array.isArray(products?.data) ? products.data.length : 0,
    orderCount: Array.isArray(orders?.data) ? orders.data.length : 0
  };
};

// Get aggregated dashboard stats for super admin
export const getDashboardStats = async () => {
  const db = await getDatabase();
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Get all tenants
  const allTenants = await db.collection<Tenant>(collectionName).find({}).toArray();
  const totalTenants = allTenants.length;
  const activeTenants = allTenants.filter(t => t.status === 'active').length;

  // Tenant count comparison (7-day periods)
  const tenantsLastWeek = allTenants.filter(t => {
    const created = new Date(t.createdAt || 0);
    return created >= sevenDaysAgo && created <= now;
  }).length;
  const tenantsPrevWeek = allTenants.filter(t => {
    const created = new Date(t.createdAt || 0);
    return created >= fourteenDaysAgo && created < sevenDaysAgo;
  }).length;
  const tenantsChange = tenantsPrevWeek > 0
    ? Math.round(((tenantsLastWeek - tenantsPrevWeek) / tenantsPrevWeek) * 100 * 10) / 10
    : tenantsLastWeek > 0 ? 100 : 0;

  // Subscription distribution by plan
  const planCounts: Record<string, number> = { starter: 0, growth: 0, enterprise: 0 };
  allTenants.forEach(t => {
    const plan = (t.plan || 'starter') as string;
    if (plan in planCounts) {
      planCounts[plan]++;
    } else {
      planCounts.starter++;
    }
  });

  // Aggregate orders across all tenants
  const allOrderDocs = await db.collection('tenant_data').find({ key: 'orders' }).toArray();
  let totalOrders = 0;
  let ordersLastWeek = 0;
  let ordersPrevWeek = 0;
  for (const doc of allOrderDocs) {
    if (Array.isArray(doc.data)) {
      totalOrders += doc.data.length;
      for (const order of doc.data) {
        const orderDate = new Date(order.createdAt || order.date || 0);
        if (orderDate >= sevenDaysAgo && orderDate <= now) ordersLastWeek++;
        else if (orderDate >= fourteenDaysAgo && orderDate < sevenDaysAgo) ordersPrevWeek++;
      }
    }
  }
  const ordersChange = ordersPrevWeek > 0
    ? Math.round(((ordersLastWeek - ordersPrevWeek) / ordersPrevWeek) * 100 * 10) / 10
    : ordersLastWeek > 0 ? 100 : 0;

  // Total active users
  const totalUsers = await User.countDocuments({});
  // Users created in last 7 days vs previous 7 days
  const usersLastWeek = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo, $lte: now } });
  const usersPrevWeek = await User.countDocuments({ createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } });
  const usersChange = usersPrevWeek > 0
    ? Math.round(((usersLastWeek - usersPrevWeek) / usersPrevWeek) * 100 * 10) / 10
    : usersLastWeek > 0 ? 100 : 0;

  return {
    totalTenants,
    activeTenants,
    tenantsChange,
    totalOrders,
    ordersChange,
    totalUsers,
    usersChange,
    subscriptionDistribution: planCounts
  };
};

export const ensureTenantIndexes = async () => {
  const db = await getDatabase();
  await db.collection<Tenant>(collectionName).createIndex({ subdomain: 1 }, { unique: true });
  await db.collection<Tenant>(collectionName).createIndex({ customDomain: 1 }, { sparse: true });
  await db.collection<Tenant>(collectionName).createIndex({ adminEmail: 1 });
  await db.collection<Tenant>(collectionName).createIndex({ status: 1 });
  await db.collection('tenant_data').createIndex({ tenantId: 1, key: 1 }, { unique: true });
};