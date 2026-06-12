# Admin-MainBeta — Multi-Tenant SaaS E-Commerce Platform

A full-stack, multi-tenant SaaS platform for e-commerce store management.
Each tenant gets their own branded storefront, admin dashboard, and data isolation — all running on shared infrastructure.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Storefront (storefront-next)](#storefront-storefront-next)
- [Admin Dashboard (admin-next)](#admin-dashboard-admin-next)
- [Backend API (backend-next)](#backend-api-backend-next)
- [ISR (Incremental Static Regeneration)](#isr-incremental-static-regeneration)
- [Multi-Tenancy](#multi-tenancy)
- [Authentication & Authorization](#authentication--authorization)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        NGINX Reverse Proxy                      │
│  *.allinbangla.com  |  *.cartnget.shop  |  *.systemnextit.website│
├───────────────┬──────────────┬────────────────┬─────────────────┤
│  Storefront   │   Admin      │   Backend API  │   Hishabee      │
│  Next.js 16   │   Next.js 14 │   Express.js   │   Next.js 15    │
│  Port 3000    │   Port 3001  │   Port 5001    │   Port 3002     │
├───────────────┴──────────────┴────────────────┴─────────────────┤
│                      MongoDB + Redis                            │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Customer** visits `store.allinbangla.com`
2. **Nginx** routes to storefront-next based on subdomain
3. **Next.js** middleware detects tenant from `host` header
4. **Server Components** fetch tenant data from backend API (with ISR caching)
5. **Client Components** hydrate and handle interactivity (cart, chat, auth)
6. **Backend API** reads/writes tenant-scoped data from MongoDB with Redis caching

---

## Project Structure

```
admin-mainbeta/
├── storefront-next/        # Customer-facing storefront (Next.js 16)
├── admin-next/             # Admin dashboard (Next.js 14)
├── backend-next/           # Express.js API server
├── hishabee/               # Accounting/bookkeeping app (Next.js 15)
├── deploy/                 # Nginx configs, systemd services, deployment scripts
├── docs/                   # Architecture documentation
├── vercel.json             # Vercel deployment config
└── package.json            # Monorepo root
```

---

## Storefront (storefront-next)

The customer-facing store powered by **Next.js 16** with ISR for optimal performance.

### Directory Structure

```
storefront-next/
├── app/
│   ├── layout.tsx                     # Root layout (preconnect hints, global CSS)
│   ├── page.tsx                       # Home page (ISR: 60s revalidation)
│   ├── store-home-client.tsx          # Client-side store rendering
│   ├── providers.tsx                  # AppProvider (state, auth, cart, chat)
│   ├── robots.ts                      # Dynamic robots.txt per tenant
│   ├── sitemap.ts                     # Dynamic sitemap per tenant (ISR: 300s)
│   ├── globals.css                    # TailwindCSS global styles
│   │
│   ├── product-details/[slug]/        # Product detail pages (ISR: 60s)
│   │   ├── page.tsx                   #   Server: SEO metadata via fetchSlimBootstrap
│   │   └── ProductDetailClient.tsx    #   Client: full product UI
│   │
│   ├── all-products/                  # Product catalog (ISR: 60s)
│   │   ├── page.tsx                   #   Server: metadata generation
│   │   └── AllProductsClient.tsx      #   Client: search, filter, grid
│   │
│   ├── categories/page.tsx            # Category browser (client-only)
│   ├── checkout/page.tsx              # Checkout flow (client-only, no ISR)
│   ├── profile/page.tsx               # User profile (client-only, auth required)
│   ├── register/page.tsx              # Tenant registration
│   ├── success-order/page.tsx         # Order confirmation
│   │
│   ├── offer/[slug]/page.tsx          # Offer landing pages (client-only)
│   ├── p/[slug]/page.tsx              # Product short links (client-only)
│   │
│   ├── about/page.tsx                 # Static content pages
│   ├── privacy/page.tsx               #   (share StaticPage component)
│   ├── terms/page.tsx                 #
│   ├── refund-policy/page.tsx         #
│   ├── return-policy/page.tsx         #
│   │
│   ├── api/
│   │   ├── [[...path]]/route.ts       # API proxy to backend (all HTTP methods)
│   │   └── revalidate/route.ts        # On-demand ISR revalidation endpoint
│   │
│   └── components/
│       ├── VisitorTracker.tsx          # Client: visitor tracking + heartbeats
│       └── ui/button.tsx              # UI primitives
│
├── lib/
│   ├── tenant.ts                      # Server-side tenant resolution (React cache)
│   ├── theme.ts                       # Theme utility functions
│   ├── helmet-shim.tsx                # react-helmet-async shim for Next.js
│   └── utils.ts                       # General utilities
│
├── next.config.mjs                    # Webpack aliases, image domains, env mapping
├── package.json                       # Dependencies: Next.js 16, React 18
└── tsconfig.json                      # TypeScript configuration
```

### Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| next | ^16.2.0 | Framework (App Router) |
| react | ^18.3.1 | UI library |
| firebase | ^12.9.0 | Social auth (Google, Facebook) |
| socket.io-client | ^4.8.3 | Real-time updates |
| swiper | ^12.1.2 | Image carousels |
| zod | ^3.24.0 | Validation |
| react-hot-toast | ^2.6.0 | Toast notifications |

---

## Admin Dashboard (admin-next)

The admin panel powered by **Next.js 14** for store management.

### Directory Structure

```
admin-next/
├── app/
│   ├── layout.tsx                     # Root layout
│   ├── page.tsx                       # Root redirect
│   ├── providers.tsx                  # Full AppProvider (admin + storefront state)
│   ├── middleware.ts                  # Tenant detection from subdomain
│   │
│   ├── admin/
│   │   ├── login/page.tsx             # Admin login
│   │   └── [[...section]]/page.tsx    # Dynamic admin routes (/admin/dashboard, etc.)
│   │
│   ├── [Storefront routes]            # Customer-facing pages (same as storefront)
│   └── api/[[...path]]/route.ts       # API proxy to backend
│
├── src/
│   ├── components/                    # Admin + storefront React components
│   │   ├── dashboard/                 # Analytics, charts, stats
│   │   ├── store/                     # Storefront theme components
│   │   ├── AdminCustomization/        # Theme builder, customization
│   │   └── ...                        # Products, orders, customers, etc.
│   │
│   ├── hooks/                         # Custom React hooks
│   │   ├── useAuth.ts                 # Authentication state
│   │   ├── useTenant.ts               # Tenant resolution
│   │   ├── useCart.ts                  # Shopping cart logic
│   │   ├── useAppState.ts             # Global app state
│   │   ├── useAppEffects.ts           # Data loading (bootstrap + deferred)
│   │   └── ...
│   │
│   ├── context/                       # React Context providers
│   │   ├── AuthContext.tsx             # Auth + RBAC permissions
│   │   ├── ThemeContext.tsx            # Theme settings
│   │   ├── LanguageContext.tsx         # i18n support
│   │   └── DarkModeContext.tsx         # Dark mode toggle
│   │
│   ├── services/                      # API service modules
│   │   ├── authService.ts             # Login, register, token management
│   │   ├── DataService.ts             # Tenant data CRUD
│   │   ├── OrderService.ts            # Order operations
│   │   └── ...
│   │
│   ├── views/                         # Full-page view components
│   │   ├── StoreHome.tsx              # Storefront home (theme switching)
│   │   ├── StoreCheckout.tsx          # Checkout flow
│   │   ├── StoreProfile.tsx           # Customer profile
│   │   └── ...
│   │
│   ├── types.ts                       # Shared TypeScript interfaces
│   └── utils/                         # Utility functions
│
├── lib/                               # Shared lib (tenant, theme)
├── next.config.mjs                    # Config with admin redirects
└── package.json                       # Dependencies: Next.js 14, React 18
```

### Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| next | ^14.2.35 | Framework (App Router) |
| react | ^18.3.1 | UI library |
| @dnd-kit/* | ^6-10 | Drag-and-drop (product ordering) |
| recharts | 2.12.0 | Analytics charts |
| firebase | ^12.9.0 | Social auth |
| xlsx | ^0.18.5 | Excel import/export |
| @google/generative-ai | ^0.24.1 | AI assistant (Gemini) |

---

## Backend API (backend-next)

Express.js API server with MongoDB, Redis, and Socket.IO.

### Directory Structure

```
backend-next/
├── src/
│   ├── index.ts                       # Server entry (Express + Socket.IO)
│   ├── config/
│   │   └── env.ts                     # Zod-validated environment config
│   │
│   ├── db/
│   │   └── mongo.ts                   # MongoDB connection (native + Mongoose)
│   │
│   ├── middleware/
│   │   ├── auth.ts                    # JWT auth, role checks, tenant extraction
│   │   ├── errorHandler.ts            # Global error handler
│   │   ├── cacheHeaders.ts            # Cache-Control headers
│   │   └── subscriptionCheck.ts       # Subscription validation
│   │
│   ├── models/                        # Mongoose schemas (17 models)
│   │   ├── User.ts                    # User model with roles
│   │   ├── Entity.ts                  # Generic tenant entity
│   │   ├── Permission.ts             # RBAC permissions
│   │   ├── Role.ts                    # Role definitions
│   │   └── ...                        # Invoice, Review, Notification, etc.
│   │
│   ├── routes/                        # Express routers (41 modules)
│   │   ├── tenantData.ts              # Core: CRUD for all tenant data + ISR triggers
│   │   ├── tenants.ts                 # Tenant management + registration
│   │   ├── auth.ts                    # Login, JWT, social auth
│   │   ├── orders.ts                  # Order management
│   │   ├── webhooks.ts                # Webhook CRUD + dispatch
│   │   ├── visitors.ts                # Visitor tracking
│   │   ├── pos.ts                     # Point of Sale
│   │   ├── inventory.ts               # Stock management
│   │   └── ...                        # 33 more route modules
│   │
│   ├── services/
│   │   ├── tenantDataService.ts       # Tenant data isolation (MongoDB)
│   │   ├── redisCache.ts              # Redis caching layer
│   │   ├── isrRevalidation.ts         # ISR on-demand revalidation triggers
│   │   ├── webhookService.ts          # Webhook dispatch with HMAC + retry
│   │   ├── emailService.ts            # Nodemailer email sending
│   │   ├── smsService.ts              # SMS gateway integration
│   │   ├── cloudflareR2.ts            # Cloudflare R2 file storage
│   │   └── ...
│   │
│   ├── utils/
│   │   └── embeddings.ts              # Vector embeddings for RAG search
│   │
│   └── scripts/                       # Database seed/maintenance scripts
│
├── Dockerfile                         # Docker image (Node 20 Alpine)
├── package.json                       # Dependencies
└── tsconfig.json                      # TypeScript config
```

### Key API Routes

| Route | Auth | Purpose |
|-------|------|---------|
| `GET /api/tenant-data/:id/bootstrap` | Public | Bootstrap data (products, theme, config) |
| `GET /api/tenant-data/:id/website-config` | Public | Lightweight config for SEO |
| `PUT /api/tenant-data/:id/:key` | Admin | Save tenant data + trigger ISR |
| `POST /api/tenant-data/:id/clear-cache` | Admin | Flush Redis + trigger ISR |
| `GET /api/tenants/resolve/:subdomain` | Public | Subdomain → tenant ID |
| `POST /api/auth/login` | Public | JWT authentication |
| `GET /api/orders` | Auth | Order list |
| `POST /api/webhooks` | Auth | Register webhook |
| `POST /api/visitors/:id/track` | Public | Visitor tracking |

### Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| express | ^4.19.2 | HTTP framework |
| mongoose | ^8.23.0 | MongoDB ODM |
| ioredis | ^5.9.3 | Redis client |
| jsonwebtoken | ^9.0.3 | JWT auth |
| socket.io | ^4.8.3 | WebSocket server |
| sharp | ^0.33.5 | Image optimization |
| @aws-sdk/client-s3 | ^3.965.0 | S3/R2 file storage |
| zod | ^3.23.8 | Request validation |

---

## ISR (Incremental Static Regeneration)

The storefront uses **Next.js ISR** to serve pre-rendered pages that stay fresh through a dual strategy:

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                   ISR Revalidation Flow                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. INITIAL REQUEST → Next.js renders page + caches HTML     │
│                                                              │
│  2. SUBSEQUENT REQUESTS → Served from cache (fast!)          │
│     └─ If cache age > revalidate period → background regen   │
│                                                              │
│  3. ON-DEMAND REVALIDATION (instant):                        │
│     Admin saves products → Backend API                       │
│       → POST /api/revalidate (REVALIDATION_SECRET)           │
│       → revalidatePath('/') + revalidateTag('products')      │
│       → Next page request gets fresh content                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Revalidation Timers

| Page | `revalidate` | Cache Tags | Purpose |
|------|-------------|------------|---------|
| `/` (Home) | 60s | `config`, `products` | Product grid, theme |
| `/product-details/[slug]` | 60s | `products` | Product SEO metadata |
| `/all-products` | 60s | `products` | Product catalog metadata |
| `/sitemap.xml` | 300s | `products` | Search engine sitemap |

### Data Fetch Revalidation (in `lib/tenant.ts`)

| Fetch | `revalidate` | Cache Tags | Purpose |
|-------|-------------|------------|---------|
| Tenant resolution | 3600s (1hr) | `tenant-resolve-{subdomain}` | Subdomain → ID mapping |
| Website config | 300s (5min) | `config`, `tenant-{id}-config` | Shop name, theme, SEO |
| Slim bootstrap | 60s | `products`, `tenant-{id}-products` | Product metadata |

### On-Demand Revalidation

The backend triggers instant ISR revalidation when data changes:

```
Admin saves products
    ↓
PUT /api/tenant-data/:tenantId/products
    ↓
Backend invalidates Redis cache
    ↓
Backend calls revalidateProducts(tenantId)
    ↓
POST storefront/api/revalidate
  Headers: { "x-revalidation-secret": REVALIDATION_SECRET }
  Body:    { "paths": ["/", "/all-products"], "tags": ["products", "tenant-{id}-products"] }
    ↓
Next.js purges cached pages
    ↓
Next visitor gets freshly generated page
```

### Security

The `/api/revalidate` endpoint is protected:
- **Shared secret** (`REVALIDATION_SECRET`) must match between backend and storefront
- Only `POST` method accepted
- Path inputs validated (must start with `/`, max 500 chars)
- Tag inputs validated (alphanumeric + hyphens/underscores, max 100 chars)
- Backend calls are fire-and-forget with 5s timeout (never block admin API)

### Trigger Points

ISR revalidation is triggered automatically when:

| Action | Tags Revalidated | Paths Revalidated |
|--------|-----------------|-------------------|
| Products saved | `products` | `/`, `/all-products`, `/sitemap.xml` |
| Categories/brands/tags saved | `products` | `/`, `/all-products`, `/sitemap.xml` |
| Theme config saved | `config` | `/` |
| Website config saved | `config` | `/` |
| Store studio config saved | `products` + `config` | `/`, `/all-products`, `/sitemap.xml` |
| Cache cleared | `products` + `config` | `/`, `/all-products`, `/sitemap.xml` |

---

## Multi-Tenancy

### Tenant Detection

```
Request: store1.allinbangla.com/product-details/red-shirt
                   ↓
middleware.ts extracts "store1" from host header
                   ↓
Sets x-tenant-id header → passed to all server components
                   ↓
lib/tenant.ts resolves "store1" → MongoDB tenant ID
                   ↓
Bootstrap fetch: /api/tenant-data/{tenantId}/bootstrap
                   ↓
Tenant-scoped products, theme, config returned
```

### Supported Domains

| Domain | Purpose |
|--------|---------|
| `*.allinbangla.com` | Primary domain |
| `*.cartnget.shop` | Additional domain |
| `*.systemnextit.website` | Development domain |
| `*.localhost` | Local development |

### System Subdomains (Not Tenant)

`www`, `admin`, `superadmin`, `api` — these are routed to admin or backend, not storefronts.

---

## Authentication & Authorization

### JWT Flow

```
POST /api/auth/login { email, password }
    ↓
Backend verifies credentials → signs JWT { userId, email, role, tenantId }
    ↓
Client stores token → sends as "Authorization: Bearer <token>"
    ↓
authenticateToken middleware verifies + attaches user to request
```

### Roles

| Role | Access Level |
|------|-------------|
| `super_admin` | All tenants, all resources |
| `admin` / `tenant_admin` | Own tenant, all resources except tenant management |
| `staff` | Own tenant, role-based permissions (RBAC) |
| `customer` | Own profile, orders, cart, chat |

### Granular RBAC

Resources: `dashboard`, `orders`, `products`, `customers`, `inventory`, `catalog`, `landing_pages`, `gallery`, `reviews`, `expenses`, `income`, `profit_loss`, `customization`, `settings`, `admin_control`, `tenants`

Actions: `read`, `write`, `edit`, `delete`

---

## Deployment

### VPS Deployment (Self-Hosted)

```
deploy/
├── nginx/
│   ├── nginx.conf                     # Main config
│   ├── sites-available/
│   │   ├── admin.allinbangla.com.conf
│   │   ├── api.allinbangla.com.conf
│   │   └── storefront.allinbangla.com.conf
│   └── snippets/ssl-params.conf       # TLS security headers
│
├── systemd/
│   ├── admin-next.service             # Admin dashboard daemon
│   ├── backend-api.service            # Backend API daemon
│   └── storefront-next.service        # Storefront daemon
│
├── setup-vps.sh                       # Initial VPS provisioning
└── redeploy.sh                        # Quick redeploy script
```

### Service Ports

| Service | Port | Process Manager |
|---------|------|-----------------|
| storefront-next | 3000 | systemd |
| admin-next | 3001 | systemd |
| backend-next | 5001 | systemd |
| MongoDB | 27017 | systemd |
| Redis | 6379 | systemd |

### Quick Redeploy

```bash
# Redeploy a single service
./deploy/redeploy.sh storefront
./deploy/redeploy.sh backend
./deploy/redeploy.sh admin
```

---

## Environment Variables

### Storefront (storefront-next/.env)

```bash
# Required
NEXT_PUBLIC_API_BASE_URL=http://localhost:5001     # Backend API URL

# ISR (required for on-demand revalidation)
REVALIDATION_SECRET=your-strong-secret-here        # Shared secret for /api/revalidate

# Optional
NEXT_PUBLIC_CDN_BASE_URL=                          # CDN URL for assets
NEXT_PUBLIC_PRIMARY_DOMAIN=allinbangla.com         # Primary domain
NEXT_PUBLIC_ADDITIONAL_DOMAINS=cartnget.shop        # Comma-separated extra domains

# Firebase Auth
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
```

### Backend (backend-next/.env)

```bash
# Required
MONGODB_URI=mongodb://localhost:27017              # MongoDB connection
MONGODB_DB_NAME=admin-mainbeta                     # Database name

# Authentication
JWT_SECRET=your-jwt-secret                         # JWT signing secret
JWT_EXPIRES_IN=7d                                  # Token expiry

# ISR (required for on-demand revalidation)
STOREFRONT_URL=http://localhost:3000               # Storefront URL
REVALIDATION_SECRET=your-strong-secret-here        # Must match storefront

# Optional
PORT=5001                                          # API server port
ALLOWED_ORIGINS=                                   # CORS origins
REDIS_URL=redis://127.0.0.1:6379                   # Redis URL
PRIMARY_DOMAIN=allinbangla.com                     # Primary domain

# File Storage
AWS_ACCESS_KEY_ID=                                 # S3/R2 access key
AWS_SECRET_ACCESS_KEY=                             # S3/R2 secret key

# External Services
IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=
GOOGLE_API_KEY=                                    # Gemini AI
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB 7+
- Redis 7+ (optional, gracefully degrades)

### Development Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd admin-mainbeta

# 2. Install dependencies
npm install                          # Root monorepo
cd backend-next && npm install       # Backend
cd ../storefront-next && npm install # Storefront
cd ../admin-next && npm install      # Admin

# 3. Configure environment
cp backend-next/.env.example backend-next/.env
cp storefront-next/.env.example storefront-next/.env

# 4. Generate a shared ISR revalidation secret (MUST be same for both)
SECRET=$(openssl rand -hex 32)
echo "REVALIDATION_SECRET=$SECRET" >> backend-next/.env
echo "REVALIDATION_SECRET=$SECRET" >> storefront-next/.env

echo "STOREFRONT_URL=http://localhost:3000" >> backend-next/.env

# 5. Start services
cd backend-next && npm run dev       # Starts on port 5001
cd storefront-next && npm run dev    # Starts on port 3000
cd admin-next && npm run dev         # Starts on port 3001
```

### Build for Production

```bash
# Backend
cd backend-next && npm run build     # Compiles TypeScript to dist/

# Storefront
cd storefront-next && npm run build  # Next.js production build with ISR

# Admin
cd admin-next && npm run build       # Next.js production build
```

---

## Key Technologies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Storefront** | Next.js 16, React 18, TailwindCSS | Customer-facing UI with ISR |
| **Admin** | Next.js 14, React 18, TailwindCSS | Admin dashboard |
| **Backend** | Express.js, TypeScript | REST API server |
| **Database** | MongoDB + Mongoose | Primary data store |
| **Cache** | Redis (ioredis) | Data caching + session store |
| **Real-time** | Socket.IO | Live updates (orders, chat) |
| **Auth** | JWT + Firebase | Token auth + social login |
| **File Storage** | AWS S3, Cloudflare R2 | Image/file uploads |
| **AI** | Google Gemini | AI assistant, RAG chatbot |
| **Images** | Sharp, ImageKit | Optimization + CDN delivery |
| **Webhooks** | Custom (HMAC + retry) | External integrations |
| **Email** | Nodemailer | Transactional email |
| **SMS** | Custom gateway | Order notifications |
# B
