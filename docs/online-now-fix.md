# Online Now Feature — Root Cause Analysis & Fix

## Issue

The **"Online Now"** count on the tenant admin dashboard always showed **0** (or stale numbers), even when real customers were actively browsing the storefront.

## Root Cause

The application has two separate Next.js apps:

| App | Purpose |
|---|---|
| `admin-next` | Admin dashboard + embedded store preview |
| `storefront-next` | Customer-facing storefront (production) |

### How "Online Now" Works

1. **Tracking** — When a visitor views a page, the storefront sends `POST /api/visitors/:tenantId/track` to the backend. This updates the `lastVisit` timestamp in the `visitors` MongoDB collection.
2. **Counting** — The admin dashboard polls `GET /api/visitors/:tenantId/online` every 30 seconds. The backend counts visitors where `lastVisit >= now − 5 minutes`.

### What Was Broken

The `trackPageView()` function existed **only in `admin-next`** (`src/hooks/useVisitorStats.ts`), and was only called from:

- `useStoreHome.ts` (admin-side store preview)
- `StoreCheckout.tsx` (admin-side checkout view)
- `StoreProductDetail.tsx` (admin-side product detail view)

The **`storefront-next` app had no visitor tracking at all**. Since real customers visit the storefront via `storefront-next`, their visits were never recorded. The `visitors` collection was never updated with fresh `lastVisit` timestamps, so the online count was always 0.

### Why It Happened

When `storefront-next` was created as a separate Next.js app (split from `admin-next`), the visitor tracking logic was not ported over. The tracking code remained only in the `admin-next` hooks, which are not used by the `storefront-next` app.

## Fix Applied

### 1. Created `VisitorTracker` Component

**File:** `storefront-next/app/components/VisitorTracker.tsx`

A lightweight client component that:

- **Tracks page views** — Fires `POST /api/visitors/:tenantId/track` on every client-side navigation (throttled to once per 5 seconds per page).
- **Sends heartbeats** — Re-fires the tracking call every **2 minutes** to keep the visitor in the "online" window (backend uses a 5-minute sliding window).
- **Generates a persistent visitor ID** — Stored in `localStorage` as `_vid`, consistent with the existing `admin-next` implementation.
- **Detects device/browser** — Sends device type (Mobile/Tablet/Desktop) and browser name, consistent with the existing tracking format.

### 2. Integrated into Storefront Providers

**File:** `storefront-next/app/providers.tsx`

The `VisitorTracker` component is mounted inside the `AppProvider`, so it runs on every storefront page automatically. It receives the `activeTenantId` from the provider context.

## Data Flow (After Fix)

```
Customer visits storefront-next
        │
        ▼
VisitorTracker fires POST /api/visitors/:tenantId/track
        │
        ▼
Backend updates visitors.lastVisit = now (MongoDB)
        │
        ▼
Every 2 min: heartbeat re-fires track (keeps lastVisit fresh)
        │
        ▼
Admin dashboard polls GET /api/visitors/:tenantId/online
        │
        ▼
Backend counts WHERE lastVisit >= now − 5 min
        │
        ▼
Dashboard displays "Online Now: X"
```

## Key Files

| File | Role |
|---|---|
| `storefront-next/app/components/VisitorTracker.tsx` | Client-side tracking + heartbeat |
| `storefront-next/app/providers.tsx` | Mounts VisitorTracker in provider tree |
| `backend-next/src/routes/visitors.ts` | Backend tracking endpoint (`POST /:tenantId/track`) and online query (`GET /:tenantId/online`) |
| `admin-next/src/components/dashboard/FigmaAnalyticsChart.tsx` | Dashboard component that displays "Online Now" |
| `admin-next/src/hooks/useVisitorStats.ts` | Original tracking code (admin-next only) |

## Monitoring & Debugging

### Verify tracking is working

Open the storefront in a browser and check the Network tab. You should see:

- `POST /api/visitors/:tenantId/track` on every page navigation
- The same request repeating every ~2 minutes (heartbeat)

### Verify online count

In the admin dashboard, the "Online Now" card should update within 30 seconds of a storefront visit.

### MongoDB query to check visitors

```javascript
// Find visitors active in the last 5 minutes for a specific tenant
db.visitors.find({
  tenantId: "<your-tenant-id>",
  lastVisit: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
}).count()
```

## Future Considerations

1. **Visibility API** — Consider pausing heartbeats when the browser tab is hidden (`document.hidden`) to avoid counting inactive tabs as "online".
2. **Rate limiting** — The backend `track` endpoint has no rate limiter; consider adding one for production if abuse is a concern.
3. **Server-side tracking** — For even more accurate counts, consider tracking at the middleware/edge level instead of relying on client-side JavaScript.
