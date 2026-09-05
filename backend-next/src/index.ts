import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import compression from 'compression';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { env } from './config/env';
import { connectMongo, disconnectMongo } from './db/mongo';
import { errorHandler } from './middleware/errorHandler';
import { healthRouter } from './routes/health';
import { tenantsRouter } from './routes/tenants';
import { tenantDataRouter } from './routes/tenantData';
import { ordersRouter } from './routes/orders';
import { ensureTenantIndexes } from './services/tenantsService';
import { expensesRouter } from './routes/expenses';
import { profitLossRouter } from './routes/profitLoss';
import { incomesRouter } from './routes/incomes';
import purchasesRouter from './routes/purchases';
import dueListRoutes from './routes/dueListRoutes';
import duebookAuthRouter from './routes/duebookAuth';
import duebookInventoryRouter from './routes/duebookInventory';
import { duebookSocialRouter } from './routes/duebookSocial';
import reminderRoutes from './routes/reminderRoutes';
import { startReminderScheduler } from './services/reminderScheduler';
import publicDueViewRouter from './routes/publicDueView';
import publicRegisterRouter from './routes/publicRegister';
import uploadRouter from './routes/upload';
import authRouter from './routes/auth';
import reviewsRouter from './routes/reviews';
import { notificationsRouter } from './routes/notifications';
import { courierRouter } from './routes/courier';
import { facebookPixelRouter } from './routes/facebookPixel';
import supportRouter from './routes/support';
import contactRouter from './routes/contact';
import chatRouter from './routes/chat';
import { User } from './models/User';
import imageOptimizeRouter from './routes/imageOptimize';
import { imageCacheHeaders, apiCacheHeaders } from './middleware/cacheHeaders';
import { subscriptionsRouter } from './routes/subscriptions';
import auditLogsRouter from './routes/auditLogs';
import cloudflareUploadRouter from './routes/cloudflareUpload';
import offerPagesRouter from './routes/offerPages';
import apkBuilderRouter from './routes/apkBuilder';
import faviconRouter from './routes/favicon';

import aiAssistantRouter from './routes/aiAssistant';
import smsRouter from './routes/sms';
import { visitorsRouter } from './routes/visitors';
import imageSearchRouter from './routes/imageSearch';
import { checkTenantSubscription, addSubscriptionHeaders } from './middleware/subscriptionCheck';
import { subscriptionRouter } from './routes/subscription';
import ragChatRouter from './routes/ragChat';
import unfilteredImagesRouter from './routes/unfilteredImages';
import { tenantConfigRouter } from './routes/tenantConfig';
import { tenantFeaturesRouter } from './routes/tenantFeatures';
import { vendorRouter } from './routes/vendors';
import { marketplaceRouter } from './routes/marketplace';
import { cashboxRouter } from './routes/cashbox';
import { inventoryRouter } from './routes/inventory';
import { webhooksRouter } from './routes/webhooks';
import { loyaltyRouter } from './routes/loyalty';
import { posRouter } from './routes/pos';
import { storiesRouter } from './routes/stories';
import imagekitAuthRouter from './routes/imagekitAuth';
import { storesDirectoryRouter } from './routes/storesDirectory';
import { blogRouter } from './routes/blog';
import { ensureCacheReady, isAllowedCustomDomainOrigin, refreshCustomDomainsCache } from './services/customDomainService';

const app = express();
const httpServer = createServer(app);

// VERY FIRST: Handle preflight OPTIONS requests before anything else
// This MUST be before any other middleware
app.options('*', (req: Request, res: Response) => {
  const origin = (req.headers.origin as string) || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-tenant-subdomain, X-Tenant-Subdomain, x-tenant-id, X-Tenant-Id, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Cache-Control', 'no-store'); // Prevent Cloudflare caching
  res.status(204).end();
  // COOP removed - was blocking Firebase popup auth window.closed detection
  // res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
});

// Socket.IO setup
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: (origin: string | string[] | undefined, callback: (arg0: Error | null, arg1: boolean | undefined) => void) => {
      // Allow requests with no origin (same-origin requests)
      if (!origin) return callback(null, true);

      // Get allowed origins from environment
      const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);
      const systemnextPattern = /^https?:\/\/([a-z0-9-]+\.)?systemnextit\.com$/i;
      const systemnextWebsitePattern = /^https?:\/\/([a-z0-9-]+\.)?systemnextit\.website$/i;
      const cartngetPattern = /^https?:\/\/([a-z0-9-]+\.)?cartnget\.shop$/i;
      const shopbdPattern = /^https?:\/\/([a-z0-9-]+\.)?shopbdit\.com$/i;
      const allinbanglaPattern = /^https?:\/\/([a-z0-9-]+\.)?allinbangla\.com$/i;
      // Support localhost with subdomains: store.localhost:3000, admin.localhost:5173, etc.
      const localhostPattern = /^https?:\/\/([a-z0-9-]+\.)?localhost(:\d+)?$/i;
      const origins = Array.isArray(origin) ? origin : [origin];
      const isAllowed = origins.some(o =>
        systemnextPattern.test(o) || systemnextWebsitePattern.test(o) ||
        cartngetPattern.test(o) ||
        shopbdPattern.test(o) ||
        allinbanglaPattern.test(o) ||
        localhostPattern.test(o) ||
        allowedOrigins.includes(o) ||
        allowedOrigins.some(allowed => allowed.includes('*') && new RegExp(allowed.replace(/\*/g, '.*')).test(o)) ||
        isAllowedCustomDomainOrigin(o) // Check custom domains from database
      );
      if (isAllowed) {
        return callback(null, true);
      }
      console.warn('[Socket.IO CORS] Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST']
  },
  allowEIO3: true, // Allow Engine.IO v3 clients
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Make io accessible in routes
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('[Socket.IO] Client connected:', socket.id);
  
  socket.on('error', (error) => {
    console.error(`[Socket.IO] Socket error on ${socket.id}:`, error);
  });
  
  // Join tenant-specific room - validate tenantId is not empty/suspicious
  socket.on('join-tenant', (tenantId: string) => {
    // Basic validation: only allow joining if a valid tenantId is provided
    if (!tenantId || typeof tenantId !== 'string' || tenantId.length < 2 || tenantId.length > 100) {
      console.warn(`[Socket.IO] Invalid tenant join attempt from ${socket.id}: ${tenantId}`);
      return;
    }
    // Sanitize: only allow alphanumeric, hyphens, underscores
    const sanitized = tenantId.replace(/[^a-zA-Z0-9_-]/g, '');
    if (sanitized !== tenantId) {
      console.warn(`[Socket.IO] Suspicious tenant join from ${socket.id}: ${tenantId}`);
      return;
    }
    socket.join(`tenant:${sanitized}`);
    console.log(`[Socket.IO] Socket ${socket.id} joined tenant:${sanitized}`);
  });
  
  // Leave tenant room
  socket.on('leave-tenant', (tenantId: string) => {
    socket.leave(`tenant:${tenantId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('[Socket.IO] Client disconnected:', socket.id);
  });
});

// CORS - Allow all origins for now (wildcard) to support all subdomains + custom domains
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (same-origin, mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    // Allow all allinbangla.com, cartnget.shop, and shopbdit.com subdomains
    const systemnextPattern = /^https?:\/\/([a-z0-9-]+\.)?systemnextit\.com$/i;
    const systemnextWebsitePattern = /^https?:\/\/([a-z0-9-]+\.)?systemnextit\.website$/i;
    const cartngetPattern = /^https?:\/\/([a-z0-9-]+\.)?cartnget\.shop$/i;
    const shopbdPattern = /^https?:\/\/([a-z0-9-]+\.)?shopbdit\.com$/i;
    const allinbanglaPattern = /^https?:\/\/([a-z0-9-]+\.)?allinbangla\.com$/i;
    // Support localhost with subdomains: store.localhost:3000, admin.localhost:5173, etc.
    const localhostPattern = /^https?:\/\/([a-z0-9-]+\.)?localhost(:\d+)?$/i;

    // Check against allowed origin patterns
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);
    if (
      systemnextPattern.test(origin) || systemnextWebsitePattern.test(origin) ||
      cartngetPattern.test(origin) || shopbdPattern.test(origin) ||
      allinbanglaPattern.test(origin) || localhostPattern.test(origin) ||
      allowedOrigins.includes(origin) ||
      isAllowedCustomDomainOrigin(origin) // Check custom domains from database
    ) {
      return callback(null, true);
    }

    console.warn('[CORS] Blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-subdomain', 'X-Tenant-Subdomain', 'x-tenant-id', 'X-Tenant-Id', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 86400, // 24 hours - cache preflight
};

app.use(cors(corsOptions));

// Ensure no-store on CORS responses to prevent Cloudflare caching issues
// Ensure cache control header and options handling
app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    next();
});

// Handle preflight OPTIONS requests explicitly for all routes
app.options('*', cors(corsOptions));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use(compression() as any);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(morgan('dev'));

// Debugging middleware to log request path and host
// Debug middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[DEBUG] Path: ${req.path} | Host: ${req.headers.host}`);
    next();
});

// Subscription check middleware - blocks API calls for expired tenants
app.use(checkTenantSubscription);

// Add subscription status headers to responses
app.use(addSubscriptionHeaders);

// Serve static files for uploaded images
// Use image optimization route first (handles ?w=&q= params)
// Apply cache headers to uploads
const uploadsDir = env.uploadDir || path.join(process.cwd(), 'uploads');
app.use('/uploads', imageCacheHeaders, imageOptimizeRouter);
// Fallback to static files for non-optimized requests
app.use('/uploads', express.static(uploadsDir));

app.get('/', (_req: any, res: { json: (arg0: { name: string; version: string; }) => void; }) => {
  res.json({ name: 'seven-days-backend', version: '2.0' });
});

app.use('/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/visitors', visitorsRouter);
app.use('/api/tenants', tenantsRouter);
app.use('/api/tenant-data', unfilteredImagesRouter);
app.use('/api/tenant-data', tenantDataRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/incomes', incomesRouter);
app.use('/api/purchases', purchasesRouter);
app.use('/api/profit-loss', profitLossRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/courier', courierRouter);
app.use('/api/facebook-pixel', facebookPixelRouter);
app.use('/api/support', supportRouter);
app.use('/api/contact', contactRouter);
app.use('/api/guestchat', chatRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/audit-logs', auditLogsRouter);
app.use('/api/cloudflare', cloudflareUploadRouter);
app.use('/api/landing-page', offerPagesRouter);
app.use('/api/apk-builder', apkBuilderRouter);
app.use('/api/favicon', faviconRouter);
app.use('/api/ai-assistant', aiAssistantRouter);
app.use('/api/sms', smsRouter);
app.use('/api/image-search', imageSearchRouter);
app.use('/api/subscription', subscriptionRouter);
app.use('/api/chat', ragChatRouter);
app.use('/api/tenant-config', tenantConfigRouter);
app.use('/api/tenant-features', tenantFeaturesRouter);
app.use('/api/cashbox', cashboxRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/loyalty', loyaltyRouter);
app.use('/api/pos', posRouter);
app.use('/api/stories', storiesRouter);
app.use('/api/vendors', vendorRouter);
app.use('/api/marketplace', marketplaceRouter);
app.use('/api/stores', storesDirectoryRouter);
app.use('/api/v1', imagekitAuthRouter);
app.use('/api/super-admin/blog', blogRouter);
app.use('/api', publicDueViewRouter);
app.use('/api', publicRegisterRouter);
app.use('/api/duebook/auth', duebookAuthRouter);
app.use('/api/duebook/inventory', duebookInventoryRouter);
app.use('/api/duebook/social', duebookSocialRouter);
app.use('/api', dueListRoutes);
app.use('/api', reminderRoutes);

app.use('/', uploadRouter);

app.use(errorHandler);

// Seed default super admin user
const seedDefaultAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@admin.com';
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (!existingAdmin) {
      if (!adminPassword) {
        console.warn('[backend] ADMIN_PASSWORD env var not set. Skipping default admin seed. Set ADMIN_EMAIL and ADMIN_PASSWORD to create initial admin.');
        return;
      }
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      
      const superAdmin = new User({
        name: 'Super Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'super_admin',
        isActive: true
      });
      
      await superAdmin.save();
      console.log('[backend] Default super admin created with configured credentials');
    } else {
      console.log('[backend] Super admin already exists');
    }
  } catch (error) {
    console.error('[backend] Error seeding admin:', error);
  }
};

const bootstrap = async () => {
  // Connect native MongoDB client eagerly for fast initial API calls
  try {
    await connectMongo();
  } catch (err) {
    console.error('[backend] Native MongoDB connection error:', err);
    process.exit(1);
  }

  // Connect Mongoose for Entity/Transaction models
  try {
    await mongoose.connect(env.mongoUri, {
      dbName: env.mongoDbName,
      maxPoolSize: 20,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
    });
    console.log('[backend] Mongoose connected to MongoDB');

    // Seed default super admin user
    await seedDefaultAdmin();

    // Initialize custom domains cache for CORS
    await refreshCustomDomainsCache();
    console.log('[backend] Custom domains cache initialized');
  } catch (err) {
    console.error('[backend] Mongoose connection error:', err);
    process.exit(1);
  }

  try {
    await ensureTenantIndexes();
  } catch (indexError) {
    console.warn('[backend] Tenant index creation failed (non-fatal):', indexError);
  }

  try {
    startReminderScheduler();
  } catch (schedErr) {
    console.warn('[backend] Reminder scheduler failed to start (non-fatal):', schedErr);
  }
  
  // Changed from app.listen to httpServer.listen for Socket.IO
  // Explicitly bind to 0.0.0.0 to ensure IPv4 compatibility
  httpServer.listen(env.port, '0.0.0.0', () => {
    console.log(`[backend] API listening on port ${env.port} (0.0.0.0)`);
  });
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('[backend] Unhandled Promise Rejection:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[backend] Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`[backend] ${signal} received, shutting down gracefully...`);
  try {
    httpServer.close(() => {
      console.log('[backend] HTTP server closed');
    });
    await mongoose.connection.close();
    console.log('[backend] Mongoose connection closed');
    await disconnectMongo();
    console.log('[backend] Native MongoDB connection closed');
    process.exit(0);
  } catch (err) {
    console.error('[backend] Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

bootstrap().catch((err) => {
  console.error('[backend] Bootstrap failed:', err);
  process.exit(1);
});