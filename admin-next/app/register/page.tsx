'use client';

/**
 * Tenant Registration Page
 * Route: /register
 */
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const TenantRegistration = dynamic(() => import('@/views/TenantRegistration'), { ssr: false });

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    }>
      <TenantRegistration />
    </Suspense>
  );
}
