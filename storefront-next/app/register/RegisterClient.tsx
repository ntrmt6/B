'use client';
import { Suspense, useEffect } from 'react';
import dynamic from 'next/dynamic';

const TenantRegistration = dynamic(() => import('@/views/TenantRegistration'), { ssr: false });

export default function RegisterClient() {
  useEffect(() => {
    const savedAdminUrl = localStorage.getItem('shopbdit_admin_url');
    if (savedAdminUrl) {
      window.location.href = savedAdminUrl;
    }
  }, []);

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
