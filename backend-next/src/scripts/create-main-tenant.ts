import { config } from 'dotenv';
config();

import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import { User } from '../models/User';

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'cws';

async function createMainTenant() {
  console.log('\n🏪 Creating Main Store Tenant...\n');
  console.log(`📦 Database: ${MONGODB_DB_NAME}`);

  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DB_NAME,
    });
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    const tenantsCollection = db.collection('tenants');
    const tenantDataCollection = db.collection('tenant_data');

    // Check if main tenant already exists
    let tenant = await tenantsCollection.findOne({ subdomain: 'main' });

    const now = new Date().toISOString();

    if (tenant) {
      console.log('⚠️  Main tenant already exists. Updating...');
      await tenantsCollection.updateOne(
        { subdomain: 'main' },
        {
          $set: {
            name: 'All In Bangla - Main Store',
            customDomain: 'allinbangla.com',
            adminEmail: 'admin@allinbangla.com',
            status: 'active',
            plan: 'enterprise',
            multiVendorEnabled: true,
            updatedAt: now,
          }
        }
      );
      console.log('✅ Main tenant updated');
    } else {
      // Create new main tenant
      const tenantDoc = {
        name: 'All In Bangla - Main Store',
        subdomain: 'main',
        customDomain: 'allinbangla.com',
        contactEmail: 'admin@allinbangla.com',
        contactName: 'Admin',
        adminEmail: 'admin@allinbangla.com',
        plan: 'enterprise',
        status: 'active',
        onboardingCompleted: true,
        multiVendorEnabled: true,
        createdAt: now,
        updatedAt: now,
        branding: {},
        settings: {},
        shopStatus: {
          isTrialing: false,
          isEnterprise: true,
          isPremium: true,
        },
        subscription: {
          packageStartDate: now,
          packageDays: 365,
          gracePeriodDays: 30,
          isBlocked: false,
        },
      };

      const result = await tenantsCollection.insertOne(tenantDoc);
      tenant = { ...tenantDoc, _id: result.insertedId };
      console.log('✅ Main tenant created');
    }

    const tenantId = tenant._id.toString();

    // Update super admin user with tenant ID
    const adminUser = await User.findOne({ email: 'admin@allinbangla.com' });
    if (adminUser) {
      adminUser.tenantId = tenantId;
      await adminUser.save();
      console.log('✅ Super admin linked to main tenant');
    }

    // Initialize default tenant data
    const defaultData = [
      { key: 'products', data: [] },
      { key: 'orders', data: [] },
      { key: 'categories', data: [] },
      {
        key: 'theme_config',
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
        }
      },
      {
        key: 'website',
        data: {
          storeName: 'All In Bangla',
          tagline: 'Your One-Stop Online Shop',
          currency: 'BDT',
          logo: null,
          favicon: null,
          socialLinks: {}
        }
      }
    ];

    for (const item of defaultData) {
      await tenantDataCollection.updateOne(
        { tenantId, key: item.key },
        {
          $set: { data: item.data, updatedAt: now },
          $setOnInsert: { tenantId, key: item.key, createdAt: now }
        },
        { upsert: true }
      );
    }
    console.log('✅ Default tenant data initialized');

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  Main Store Setup Complete!');
    console.log('  ───────────────────────────');
    console.log(`  Tenant ID:    ${tenantId}`);
    console.log(`  Store Name:   All In Bangla - Main Store`);
    console.log(`  Domain:       allinbangla.com`);
    console.log(`  Admin Email:  admin@allinbangla.com`);
    console.log(`  Plan:         Enterprise`);
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Failed to create main tenant:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');
  }
}

createMainTenant();
