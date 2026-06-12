'use client';

/**
 * Admin Login Page
 * Route: /admin/login
 */
import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../providers';
import dynamic from 'next/dynamic';

const AdminLogin = dynamic(() => import('@/views/AdminLogin'), { ssr: false });

export default function AdminLoginPage() {
  const router = useRouter();
  const app = useApp();

  return (
    <div className="admin-font-scope">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      }>
        <AdminLogin
          onLoginSuccess={(loggedUser: any) => {
            app.setUser(loggedUser);
            if (loggedUser.role === 'super_admin') {
              router.push('/admin/dashboard');
            } else {
              router.push('/admin/dashboard');
            }
          }}
        />
      </Suspense>
    </div>
  );
}
