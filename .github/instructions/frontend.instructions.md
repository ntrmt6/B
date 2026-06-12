---
applyTo: "admin-next/**"
---

# Frontend Instructions

## Tech Stack

- Framework: Next.js 14.2 (App Router)
- Language: TypeScript (ES2017 target)
- UI: React 18, TailwindCSS 3
- State: React Context (AuthContext, ThemeContext, LanguageContext, DarkModeContext)
- Icons: lucide-react
- Notifications: react-hot-toast
- Charts: Recharts
- Drag & Drop: @dnd-kit

## Project Structure

- `app/` — Next.js App Router pages and layouts
- `src/components/` — Reusable React components
- `src/hooks/` — Custom React hooks (useAuth, useTenant, useCart, etc.)
- `src/context/` — React Context providers
- `src/services/` — API service modules
- `src/types.ts` — Shared TypeScript type definitions
- `src/utils/` — Utility functions
- `src/styles/` — Global styles
- `public/` — Static assets

## Conventions

### Components

- Use functional components with TypeScript interfaces for props.
- Define interfaces for component state and form data shapes.
- Use `useState` for local state and React Context for shared state.
- Use `useCallback` for memoized event handlers passed to children.
- Style exclusively with TailwindCSS utility classes.

### API Communication

- Environment variables in `.env` use the `NEXT_PUBLIC_` prefix (e.g., `NEXT_PUBLIC_API_BASE_URL`).
- Source code references `process.env.VITE_API_BASE_URL` — this is a legacy Vite convention mapped automatically via `next.config.mjs` webpack defines.
- Frontend services in `src/services/` handle API calls with dynamic URL resolution.
- `getApiUrl()` in authService resolves the correct API URL based on environment (localhost vs production).
- Include tenant context via `X-Tenant` headers or subdomain.

### Path Aliases

- `@/*` maps to `src/*` (configured in tsconfig.json).

### Authorization

- Resource types are defined in `AuthContext` (dashboard, orders, products, customers, etc.).
- Action types: `read`, `write`, `edit`, `delete`.
- Use permission checks from AuthContext before rendering protected UI.

## Build & Lint

```bash
npm run build    # Next.js production build
npm run dev      # Development server
npm run lint     # ESLint check
```
