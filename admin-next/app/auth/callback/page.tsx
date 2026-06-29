'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getPrimaryDomain } from '@/utils/appHelpers';

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setImpersonationSession } = useAuth();
  const [status, setStatus] = useState<'validating' | 'success' | 'error'>('validating');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const validateImpersonationToken = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setErrorMessage('No authentication token provided');
        return;
      }

      try {
        const domain = getPrimaryDomain() || 'allinbangla.com';
        const apiUrl = `https://${domain}/api/auth/validate-impersonation`;

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ token })
        });

        const data = await response.json();

        if (!response.ok) {
          setStatus('error');
          setErrorMessage(data.error || 'Token validation failed');
          return;
        }

        if (data.success) {
          // Set the impersonation session
          setImpersonationSession(data.token, data.user, data.permissions);
          setStatus('success');

          // Redirect to admin dashboard after a brief moment
          setTimeout(() => {
            router.push('/admin');
          }, 1500);
        } else {
          setStatus('error');
          setErrorMessage('Failed to establish session');
        }
      } catch (error) {
        console.error('Impersonation validation error:', error);
        setStatus('error');
        setErrorMessage('Network error during authentication');
      }
    };

    validateImpersonationToken();
  }, [searchParams, router, setImpersonationSession]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        {status === 'validating' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900">Authenticating...</h2>
            <p className="mt-2 text-sm text-gray-600">
              Please wait while we validate your session.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4">
              <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Authentication Successful</h2>
            <p className="mt-2 text-sm text-gray-600">
              Redirecting to dashboard...
            </p>
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                You are viewing in Super Admin Ghost Mode
              </p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Authentication Failed</h2>
            <p className="mt-2 text-sm text-red-600">
              {errorMessage}
            </p>
            <button
              onClick={() => router.push('/admin/login')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
