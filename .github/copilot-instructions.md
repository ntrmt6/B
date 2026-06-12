# Copilot Instructions

## Project Overview

This is a full-stack multi-tenant SaaS application for e-commerce store management. It consists of:

- **`backend/`** — Express.js API server (TypeScript, MongoDB, Redis)
- **`admin-next/`** — Next.js 14 admin dashboard (TypeScript, React 18, TailwindCSS)

## Build, Lint, and Test Commands

### Backend (`backend/`)

```bash
npm run build        # TypeScript compilation (tsc)
npm run dev          # Development server with hot reload (ts-node-dev, port 5001)
npm start            # Production server (node dist/index.js)
```

### Frontend (`admin-next/`)

```bash
npm run build        # Next.js production build
npm run dev          # Development server (default port 3000)
npm run lint         # ESLint via next lint
```

There is no test suite in this project. Do not add test infrastructure unless explicitly asked.

## Architecture

### Multi-Tenancy

- Tenant isolation is achieved via `tenantId` field on all data models.
- Subdomain-based tenant resolution (e.g., `store1.allinbangla.com`).
- `X-Tenant` headers carry tenant context in API requests.
- The `getCurrentSubdomain()` utility resolves the current tenant from the hostname.

### Authentication & Authorization

- JWT bearer tokens for API authentication (`Authorization: Bearer <token>`).
- Auth middleware in `backend/src/middleware/auth.ts` validates tokens and checks account status.
- Five user roles: `customer`, `admin`, `tenant_admin`, `super_admin`, `staff`.
- Permission-based access control using `RESOURCES` and `ACTIONS` enums.
- Social auth supported via Firebase (Google, Facebook providers).

### Backend Patterns

- **Routes** are in `backend/src/routes/` — each file exports an Express router.
- **Models** are in `backend/src/models/` — Mongoose schemas with TypeScript interfaces (e.g., `IUser`, `IEntity`).
- **Services** are in `backend/src/services/` — business logic layer (e.g., `tenantDataService.ts`, `redisCache.ts`).
- **Middleware** is in `backend/src/middleware/` — auth, error handling, subscription checks, cache headers.
- **Config** is in `backend/src/config/` — Zod-validated environment variables (`env.ts`).

### Frontend Patterns

- **Components** are in `admin-next/src/components/` — functional React components with TypeScript interfaces.
- **Hooks** are in `admin-next/src/hooks/` — custom hooks extracted from components (e.g., `useAuth`, `useTenant`).
- **Context** is in `admin-next/src/context/` — React Context providers (`AuthContext`, `ThemeContext`, `LanguageContext`, `DarkModeContext`).
- **Services** are in `admin-next/src/services/` — API service modules (e.g., `authService.ts`, `OrderService.ts`).
- Path alias `@/*` maps to `admin-next/src/*`.

## Coding Conventions

### General

- TypeScript strict mode is enabled in both backend and frontend.
- Use Zod for request validation on the backend.
- Environment variables in `.env` files use the `NEXT_PUBLIC_` prefix (e.g., `NEXT_PUBLIC_API_BASE_URL`).
- Source code references `process.env.VITE_*` variables — these are legacy Vite conventions mapped via `next.config.mjs` webpack defines.
- Backend environment variables are validated via Zod in `backend/src/config/env.ts`.

### Backend

- Use `express.Router()` for route definitions.
- Mongoose schemas should include `timestamps: true` and appropriate indexes.
- Use `trim: true` and `lowercase: true` on string fields where applicable.
- Wrap audit log calls in try-catch to prevent crashes.
- Use the `next(error)` pattern to forward errors to the global error handler.
- Auth-specific errors use status codes: 401 (unauthorized), 402 (subscription expired), 403 (forbidden).

### Frontend

- Use functional components with React hooks (no class components).
- Use `useState` for local component state, React Context for shared state.
- Use `useCallback` for memoized event handlers.
- Style with TailwindCSS utility classes.
- Use `react-hot-toast` for toast notifications.
- Use `lucide-react` for icons.

## File Storage

- AWS S3 and Cloudflare R2 for file uploads.
- Image optimization via Sharp on the backend.
- Remote image patterns configured for Cloudflare CDN domains.

## Key Dependencies

### Backend

- Express, Mongoose, ioredis, jsonwebtoken, bcryptjs, Zod, Sharp, Socket.io, Nodemailer

### Frontend

- Next.js 14, React 18, TailwindCSS, Firebase, Axios, Recharts, @dnd-kit, Zod, Socket.io-client
