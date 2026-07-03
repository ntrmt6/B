import { config } from 'dotenv';
config();

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'cws';

// Store Configuration
const STORE_CONFIG = {
  // Basic Info
  storeName: 'All In Bangla',
  tagline: 'Your One-Stop Online Shop',
  shortDescription: 'All In Bangla - Your trusted online shopping destination in Bangladesh',

  // Contact Info
  whatsappNumber: '+8801798923162',
  contactEmail: 'ntrmt6@gmail.com',
  contactPhone: '+8801798923162',

  // Currency
  shopCurrency: 'BDT',
  shopCountry: 'Bangladesh',
};

// Theme Configuration (Blue theme)
const THEME_CONFIG = {
  primaryColor: '#3b82f6',      // Blue
  secondaryColor: '#1d4ed8',    // Darker blue
  tertiaryColor: '#60a5fa',     // Lighter blue
  fontColor: '#0f172a',         // Dark text
  hoverColor: '#2563eb',        // Blue hover
  surfaceColor: '#f1f5f9',      // Light gray surface
  fontFamily: 'Inter',
  borderRadius: 'rounded',
  darkMode: false,
  headerStyle: 'style1',
  mobileHeaderStyle: 'style1',
  footerStyle: 'style1',
  productCardStyle: 'style1',
  categorySectionStyle: 'style1',
  bottomNavStyle: 'style1',
};

// Payment Methods Configuration
const PAYMENT_METHODS = [
  {
    id: 'bkash-1',
    provider: 'bkash',
    name: 'bKash',
    isEnabled: true,
    paymentType: 'personal',
    accountNumber: '01784358352',
    accountName: 'All In Bangla',
    paymentInstruction: 'Send money to 01784358352 and provide Transaction ID',
    logo: null,
  },
  {
    id: 'cod-1',
    provider: 'cod',
    name: 'Cash on Delivery',
    isEnabled: true,
    paymentType: 'cod',
    accountNumber: '',
    accountName: '',
    paymentInstruction: 'Pay cash when you receive your order',
    logo: null,
  },
];

// Delivery Configuration
const DELIVERY_CONFIG = [
  {
    id: 'regular-1',
    type: 'Regular',
    isEnabled: true,
    division: 'Dhaka',
    insideCharge: 40,
    outsideCharge: 80,
    freeThreshold: 0,
    note: 'Regular delivery within 2-3 days',
  },
];

async function configureStore() {
  console.log('\n🛠️  Configuring Store...\n');
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

    const tenantDataCollection = db.collection('tenant_data');
    const tenantsCollection = db.collection('tenants');

    // Get main tenant ID
    const tenant = await tenantsCollection.findOne({ subdomain: 'main' });
    if (!tenant) {
      throw new Error('Main tenant not found. Please run create-main-tenant.ts first.');
    }
    const tenantId = tenant._id.toString();
    console.log(`📍 Tenant ID: ${tenantId}\n`);

    const now = new Date().toISOString();

    // 1. Update Website Configuration
    console.log('1️⃣  Updating website configuration...');
    await tenantDataCollection.updateOne(
      { tenantId, key: 'website_config' },
      {
        $set: {
          data: {
            storeName: STORE_CONFIG.storeName,
            websiteName: STORE_CONFIG.storeName,
            shortDescription: STORE_CONFIG.shortDescription,
            whatsappNumber: STORE_CONFIG.whatsappNumber,
            shopCurrency: STORE_CONFIG.shopCurrency,
            shopCountry: STORE_CONFIG.shopCountry,
            headerLogo: null,
            footerLogo: null,
            favicon: null,
            emails: [STORE_CONFIG.contactEmail],
            phones: [STORE_CONFIG.contactPhone],
            addresses: ['Bangladesh'],
            socialLinks: [],
            footerQuickLinks: [],
            footerUsefulLinks: [],
            aboutUs: '',
            privacyPolicy: '',
            termsAndConditions: '',
            returnPolicy: '',
          },
          updatedAt: now,
        },
        $setOnInsert: { tenantId, key: 'website_config', createdAt: now }
      },
      { upsert: true }
    );
    console.log('   ✅ Website configuration updated');

    // Also update the simpler 'website' key for compatibility
    await tenantDataCollection.updateOne(
      { tenantId, key: 'website' },
      {
        $set: {
          data: {
            storeName: STORE_CONFIG.storeName,
            tagline: STORE_CONFIG.tagline,
            currency: STORE_CONFIG.shopCurrency,
            logo: null,
            favicon: null,
            socialLinks: {},
          },
          updatedAt: now,
        },
        $setOnInsert: { tenantId, key: 'website', createdAt: now }
      },
      { upsert: true }
    );

    // 2. Update Theme Configuration
    console.log('2️⃣  Updating theme configuration...');
    await tenantDataCollection.updateOne(
      { tenantId, key: 'theme_config' },
      {
        $set: {
          data: THEME_CONFIG,
          updatedAt: now,
        },
        $setOnInsert: { tenantId, key: 'theme_config', createdAt: now }
      },
      { upsert: true }
    );
    console.log('   ✅ Theme configuration updated (Blue theme)');

    // 3. Update Payment Methods
    console.log('3️⃣  Configuring payment methods...');
    await tenantDataCollection.updateOne(
      { tenantId, key: 'payment_methods' },
      {
        $set: {
          data: PAYMENT_METHODS,
          updatedAt: now,
        },
        $setOnInsert: { tenantId, key: 'payment_methods', createdAt: now }
      },
      { upsert: true }
    );
    console.log('   ✅ Payment methods configured (bKash + COD)');

    // 4. Update Delivery Configuration
    console.log('4️⃣  Setting up delivery charges...');
    await tenantDataCollection.updateOne(
      { tenantId, key: 'delivery_config' },
      {
        $set: {
          data: DELIVERY_CONFIG,
          updatedAt: now,
        },
        $setOnInsert: { tenantId, key: 'delivery_config', createdAt: now }
      },
      { upsert: true }
    );
    console.log('   ✅ Delivery charges configured');

    // Update tenant record with contact info
    await tenantsCollection.updateOne(
      { _id: tenant._id },
      {
        $set: {
          contactEmail: STORE_CONFIG.contactEmail,
          updatedAt: now,
        }
      }
    );

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  🎉 Store Configuration Complete!');
    console.log('  ───────────────────────────────────────────────────');
    console.log(`  Store Name:     ${STORE_CONFIG.storeName}`);
    console.log(`  Tagline:        ${STORE_CONFIG.tagline}`);
    console.log(`  WhatsApp:       ${STORE_CONFIG.whatsappNumber}`);
    console.log(`  Email:          ${STORE_CONFIG.contactEmail}`);
    console.log(`  Theme:          Blue (#3b82f6)`);
    console.log(`  Payments:       bKash (01784358352) + COD`);
    console.log(`  Delivery:       ৳40 (Dhaka) / ৳80 (Outside)`);
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Configuration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');
  }
}

configureStore();
