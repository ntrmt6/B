---
applyTo: "backend/**"
---

# Backend Instructions

## Tech Stack

- Runtime: Node.js 20 (Alpine in Docker)
- Language: TypeScript (ES2021 target, Node16 module resolution)
- Framework: Express.js
- Database: MongoDB with Mongoose ODM
- Cache: Redis via ioredis
- Validation: Zod schemas

## Project Structure

- `src/index.ts` — Application entry point
- `src/config/` — Environment config with Zod validation
- `src/models/` — Mongoose schemas and TypeScript interfaces
- `src/routes/` — Express route handlers
- `src/services/` — Business logic and external integrations
- `src/middleware/` — Express middleware (auth, error handling, subscription checks)
- `src/types/` — Shared TypeScript type definitions
- `src/utils/` — Utility functions
- `src/scripts/` — Seed and maintenance scripts

## Conventions

### Routes

- Each route file exports an `express.Router()`.
- Apply `authenticateToken` middleware for protected routes.
- Use `requireRole()` or `requirePermission()` for authorization.
- Validate request bodies with Zod schemas defined at the top of the file.
- Use `next(error)` to forward errors to the global error handler.

### Models

- Define a TypeScript interface (e.g., `IUser`) alongside each Mongoose schema.
- Always include `timestamps: true` in schema options.
- Add `tenantId` field to all tenant-scoped models with an index.
- Use `trim: true` on string fields and `lowercase: true` on email fields.
- Add descriptive validation messages (e.g., `'Please provide a name'`).

### Error Handling

- The global error handler is in `src/middleware/errorHandler.ts`.
- Auth middleware returns specific error codes: `TOKEN_EXPIRED`, `TOKEN_INVALID`, `TOKEN_REQUIRED`, `ACCOUNT_DEACTIVATED`.
- Always wrap audit log calls in try-catch to prevent crashes.
- Return appropriate HTTP status codes: 401 (auth), 402 (subscription), 403 (permissions), 404 (not found).

### Environment Variables

- Required: `MONGODB_URI`, `MONGODB_DB_NAME`
- Optional with defaults: `PORT` (5001), `JWT_SECRET`, `JWT_EXPIRES_IN` ('7d'), `ALLOWED_ORIGINS`
- Access via the validated `env` export from `src/config/env.ts`.

## Build

```bash
npm run build    # Compiles TypeScript to dist/
npm run dev      # Development with ts-node-dev (auto-restart)
```
