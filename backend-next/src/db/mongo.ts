import { MongoClient, Db } from 'mongodb';
import { env } from '../config/env';

let client: MongoClient | null = null;
let database: Db | null = null;

/**
 * Connect the MongoDB client eagerly.
 * Call this during server bootstrap to avoid slow initial API calls.
 */
export const connectMongo = async () => {
  if (client) {
    return client;
  }
  client = new MongoClient(env.mongoUri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    maxPoolSize: 20,
    minPoolSize: 5,
  });
  await client.connect();
  database = client.db(env.mongoDbName);
  console.log('[mongo] Native MongoDB client connected');
  
  // Create indexes for faster queries
  try {
    await ensureIndexes(database);
  } catch (indexError) {
    console.warn('[mongo] Index creation failed (non-fatal):', indexError);
  }
  
  return client;
};

/**
 * Create database indexes for optimal query performance
 */
const ensureIndexes = async (db: Db) => {
  try {
    // Compound index for tenant_data collection - critical for bootstrap/secondary queries
    await db.collection('tenant_data').createIndex(
      { tenantId: 1, key: 1 },
      { unique: true, background: true }
    );
    
    // Indexes for expenses collection - faster business report queries
    await db.collection('expenses').createIndex(
      { tenantId: 1, date: -1 },
      { background: true }
    );
    await db.collection('expenses').createIndex(
      { tenantId: 1, status: 1, category: 1 },
      { background: true }
    );
    
    // Indexes for incomes collection - faster business report queries  
    await db.collection('incomes').createIndex(
      { tenantId: 1, date: -1 },
      { background: true }
    );
    await db.collection('incomes').createIndex(
      { tenantId: 1, status: 1, category: 1 },
      { background: true }
    );
    
    await db.collection('visitors').createIndex(
      { tenantId: 1, visitorId: 1 },
      { unique: true, background: true }
    );
    await db.collection('visitors').createIndex(
      { tenantId: 1, lastVisit: -1 },
      { background: true }
    );

    await db.collection('page_views').createIndex(
      { tenantId: 1, timestamp: -1 },
      { background: true }
    );
    await db.collection('page_views').createIndex(
      { tenantId: 1, visitorId: 1, timestamp: -1 },
      { background: true }
    );

    await db.collection('visitor_events').createIndex(
      { tenantId: 1, eventType: 1, timestamp: -1 },
      { background: true }
    );
    await db.collection('visitor_events').createIndex(
      { tenantId: 1, visitorId: 1, timestamp: -1 },
      { background: true }
    );
    
    // Indexes for orders collection - critical for storefront order lookups
    await db.collection('orders').createIndex(
      { tenantId: 1, createdAt: -1 },
      { background: true }
    );
    await db.collection('orders').createIndex(
      { tenantId: 1, phone: 1 },
      { background: true }
    );

    // Indexes for product_embeddings collection - storefront product search
    await db.collection('product_embeddings').createIndex(
      { tenantId: 1, productId: 1 },
      { unique: true, background: true }
    );
    await db.collection('product_embeddings').createIndex(
      { tenantId: 1, status: 1 },
      { background: true }
    );

    // Indexes for purchases collection - purchase report queries
    await db.collection('purchases').createIndex(
      { tenantId: 1, createdAt: -1 },
      { background: true }
    );

    // Indexes for tenants collection - stores directory and sitemap queries
    await db.collection('tenants').createIndex(
      { status: 1, 'shopStatus.isBlocked': 1 },
      { background: true }
    );
    await db.collection('tenants').createIndex(
      { status: 1, createdAt: -1 },
      { background: true }
    );

    console.log('[mongo] Indexes ensured for tenant_data, expenses, incomes, visitors, page_views, visitor_events, orders, product_embeddings, purchases, tenants');
  } catch (error: any) {
    // Code 48 = index already exists (not an error)
    if (error?.code === 48) {
      console.log('[mongo] Indexes already exist');
    } else {
      console.warn('[mongo] Index creation issue:', error?.message || error);
    }
  }
};

export const getMongoClient = async () => {
  if (client) {
    return client;
  }
  // Fallback: connect lazily if not already connected
  return connectMongo();
};

export const getDatabase = async () => {
  if (database) {
    return database;
  }
  await getMongoClient();
  if (!database) {
    database = client!.db(env.mongoDbName);
  }
  return database;
};

export const disconnectMongo = async () => {
  if (client) {
    await client.close();
    client = null;
    database = null;
  }
};
