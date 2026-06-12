/**
 * On-Demand ISR Revalidation Endpoint
 *
 * Called by the backend when tenant data changes (products, theme, config)
 * to instantly purge stale cached pages and regenerate them.
 *
 * Security: Requires a shared REVALIDATION_SECRET token that must match
 * between backend and storefront. Requests without a valid secret are
 * rejected with 401.
 *
 * Usage:
 *   POST /api/revalidate
 *   Headers: { "x-revalidation-secret": "<secret>" }
 *   Body:    { "paths": ["/", "/product-details/some-slug"], "tags": ["products"] }
 *
 * The endpoint supports:
 *  - Path-based revalidation: specific URL paths to regenerate
 *  - Tag-based revalidation: logical content tags (products, theme, config)
 */
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

// Server-only env var — intentionally NOT prefixed with NEXT_PUBLIC_
// to prevent client-side exposure of the revalidation secret.
const REVALIDATION_SECRET = process.env.REVALIDATION_SECRET || '';

export async function POST(req: NextRequest) {
  // ── Auth: require shared secret ──
  const secret = req.headers.get('x-revalidation-secret') || '';

  if (!REVALIDATION_SECRET || secret !== REVALIDATION_SECRET) {
    return NextResponse.json(
      { error: 'Invalid revalidation secret' },
      { status: 401 },
    );
  }

  try {
    const body = await req.json();
    const paths: string[] = Array.isArray(body.paths) ? body.paths : [];
    const tags: string[] = Array.isArray(body.tags) ? body.tags : [];

    // Validate inputs - only allow safe path patterns
    const safePaths = paths.filter(
      (p) => typeof p === 'string' && p.startsWith('/') && p.length < 500,
    );
    const safeTags = tags.filter(
      (t) => typeof t === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(t),
    );

    const revalidated: string[] = [];

    // Revalidate specific paths
    for (const p of safePaths) {
      revalidatePath(p);
      revalidated.push(`path:${p}`);
    }

    // Revalidate by tag — use "max" profile for full cache invalidation
    // In Next.js 16+, revalidateTag requires a cache life profile as 2nd arg.
    for (const tag of safeTags) {
      revalidateTag(tag, 'max');
      revalidated.push(`tag:${tag}`);
    }

    return NextResponse.json({
      revalidated,
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Revalidate] Error:', error);
    return NextResponse.json(
      { error: 'Revalidation failed' },
      { status: 500 },
    );
  }
}
