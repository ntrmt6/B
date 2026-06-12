/**
 * API Proxy — forwards all /api/* requests to the backend server.
 * This avoids CORS issues in development and keeps the API base URL
 * consistent with the storefront origin.
 *
 * Backend URL: process.env.NEXT_PUBLIC_API_BASE_URL (e.g. http://localhost:5001)
 */
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001';

type RouteContext = {
  params: Promise<{
    path?: string[];
  }>;
};

export async function GET(req: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  return proxy(req, path);
}
export async function POST(req: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  return proxy(req, path);
}
export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  return proxy(req, path);
}
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  return proxy(req, path);
}
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  return proxy(req, path);
}

async function proxy(req: NextRequest, pathSegments?: string[]) {
  const path = pathSegments?.join('/') ?? '';
  const { search } = new URL(req.url);
  const targetUrl = `${BACKEND_URL}/api/${path}${search}`;

  const headers = new Headers(req.headers);
  // Remove host header so the backend doesn't get confused
  headers.delete('host');

  const init: RequestInit = {
    method: req.method,
    headers,
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = req.body as BodyInit;
    // @ts-ignore — duplex is needed for streaming bodies in Node 18+
    init.duplex = 'half';
  }

  const upstream = await fetch(targetUrl, init);

  const responseHeaders = new Headers(upstream.headers);
  // Remove encoding headers that Next.js handles itself
  responseHeaders.delete('content-encoding');
  responseHeaders.delete('transfer-encoding');

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
