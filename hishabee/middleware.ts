import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Login page is always accessible
  if (request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.next();
  }

  // API routes pass through
  if (request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Static files pass through
  if (request.nextUrl.pathname.startsWith('/_next') || request.nextUrl.pathname.includes('.')) {
    return NextResponse.next();
  }

  // Check for auth token in cookies or let client-side handle it
  // We'll rely on client-side auth check since token is in localStorage
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
