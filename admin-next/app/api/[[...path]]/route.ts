import { NextRequest, NextResponse } from 'next/server';

/**
 * Catch-all API proxy route.
 * Forwards requests to the backend server specified by NEXT_PUBLIC_API_BASE_URL.
 * Prevents Next.js from returning HTML 404 pages for API calls when the
 * client-side API_BASE_URL is empty or misconfigured.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

async function handler(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path } = await params;
  const apiPath = `/api/${(path ?? []).join('/')}`;
  const search = req.nextUrl.search;

  if (!BACKEND_URL) {
    return NextResponse.json(
      { error: 'Backend API URL is not configured. Set NEXT_PUBLIC_API_BASE_URL in your environment.' },
      { status: 502 }
    );
  }

  const targetUrl = `${BACKEND_URL}${apiPath}${search}`;

  try {
    const headers = new Headers(req.headers);
    headers.delete('host');

    const res = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
      // @ts-expect-error duplex is required for streaming request bodies
      duplex: 'half',
    });

    const contentType = res.headers.get('content-type') || '';
    const body = await res.arrayBuffer();

    return new NextResponse(body, {
      status: res.status,
      headers: {
        'content-type': contentType,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Backend unreachable at ${BACKEND_URL}. ${err.message || ''}` },
      { status: 502 }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
