'use client';

import { useEffect, useState } from 'react';

/**
 * Root-level error boundary for the entire Next.js app.
 * This catches errors that even the root layout cannot handle.
 * Shows a "Send the Issue" button that sends error logs via WhatsApp.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [sent, setSent] = useState(false);

  // Defensive: error may be null/undefined in rare Next.js edge cases
  const safeError = error ?? { message: 'Unknown error (null error object)', digest: undefined, stack: undefined };

  useEffect(() => {
    console.error('[Global Error]', JSON.stringify({
      message: safeError.message,
      digest: safeError.digest,
      stack: safeError.stack,
    }));
  }, [safeError]);

  const sendErrorToWhatsApp = () => {
    const phone = '8801798923162';
    const timestamp = new Date().toISOString();
    const errorMessage = [
      `🚨 *Critical App Error Report*`,
      ``,
      `*Time:* ${timestamp}`,
      `*Page:* ${typeof window !== 'undefined' ? window.location.href : 'unknown'}`,
      `*Error:* ${safeError.message || 'Unknown error'}`,
      `*Digest:* ${safeError.digest || 'N/A'}`,
      ``,
      `*Stack Trace:*`,
      safeError.stack ? safeError.stack.substring(0, 500) : 'No stack trace available',
    ].join('\n');

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(errorMessage)}`;
    window.open(whatsappUrl, '_blank');
    setSent(true);
  };

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f9fafb' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ maxWidth: '448px', width: '100%', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '32px', textAlign: 'center' }}>
            {/* Error Icon */}
            <div style={{ margin: '0 auto 24px', width: '64px', height: '64px', backgroundColor: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#dc2626" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>

            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
              Something Went Wrong
            </h1>
            <p style={{ color: '#6b7280', marginBottom: '8px' }}>
              The application encountered a critical error.
            </p>
            <p style={{ fontSize: '14px', color: '#dc2626', backgroundColor: '#fef2f2', borderRadius: '8px', padding: '12px', marginBottom: '24px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {safeError.message || 'An unexpected error occurred'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Send the Issue Button */}
              <button
                onClick={sendErrorToWhatsApp}
                disabled={sent}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '16px',
                  color: 'white',
                  backgroundColor: sent ? '#22c55e' : '#16a34a',
                  border: 'none',
                  cursor: sent ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background-color 0.2s',
                }}
              >
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {sent ? 'Issue Sent ✓' : 'Send the Issue'}
              </button>

              {/* Try Again Button */}
              <button
                onClick={reset}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '16px',
                  color: '#374151',
                  backgroundColor: '#f3f4f6',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
