'use client';

import { useEffect, useState, useCallback } from 'react';

interface ErrorInfo {
  message: string;
  stack?: string;
  source?: string;
  timestamp: string;
}

/**
 * GlobalErrorListener - Catches unhandled errors and promise rejections at the window level.
 * When an error occurs, shows a floating "Send the Issue" button that sends error details
 * to the developer's WhatsApp.
 */
export function GlobalErrorListener({ children }: { children: React.ReactNode }) {
  const [errors, setErrors] = useState<ErrorInfo[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [sent, setSent] = useState(false);

  const addError = useCallback((errorInfo: ErrorInfo) => {
    setErrors(prev => {
      // Prevent duplicates
      if (prev.some(e => e.message === errorInfo.message)) return prev;
      return [...prev, errorInfo].slice(-5); // Keep last 5 errors
    });
    setShowPanel(true);
    setSent(false);
  }, []);

  useEffect(() => {
    // Catch unhandled errors
    const handleError = (event: ErrorEvent) => {
      addError({
        message: event.message || 'Unknown error',
        stack: event.error?.stack,
        source: `${event.filename}:${event.lineno}:${event.colno}`,
        timestamp: new Date().toISOString(),
      });
    };

    // Catch unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      addError({
        message: reason?.message || String(reason) || 'Unhandled promise rejection',
        stack: reason?.stack,
        source: 'Promise rejection',
        timestamp: new Date().toISOString(),
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [addError]);

  const sendErrorToWhatsApp = () => {
    const phone = '8801798923162';
    const errorLog = errors
      .map((e, i) => [
        `--- Error ${i + 1} ---`,
        `Time: ${e.timestamp}`,
        `Message: ${e.message}`,
        e.source ? `Source: ${e.source}` : '',
        e.stack ? `Stack: ${e.stack.substring(0, 200)}` : '',
      ].filter(Boolean).join('\n'))
      .join('\n\n');

    const fullMessage = [
      `🚨 *Frontend Error Report*`,
      ``,
      `*Page:* ${window.location.href}`,
      `*User Agent:* ${navigator.userAgent.substring(0, 100)}`,
      `*Errors (${errors.length}):*`,
      ``,
      errorLog,
    ].join('\n');

    const MAX_WHATSAPP_MESSAGE_LENGTH = 2000;
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(fullMessage.substring(0, MAX_WHATSAPP_MESSAGE_LENGTH))}`;
    window.open(whatsappUrl, '_blank');
    setSent(true);
  };

  return (
    <>
      {children}
      {showPanel && errors.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            alignItems: 'flex-end',
          }}
        >
          {/* Error count badge */}
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            padding: '8px 16px',
            fontSize: '13px',
            color: '#991b1b',
            maxWidth: '300px',
          }}>
            ⚠️ {errors.length} error{errors.length > 1 ? 's' : ''} detected
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Send the Issue Button */}
            <button
              onClick={sendErrorToWhatsApp}
              disabled={sent}
              style={{
                padding: '10px 20px',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '14px',
                color: 'white',
                backgroundColor: sent ? '#22c55e' : '#16a34a',
                border: 'none',
                cursor: sent ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transition: 'all 0.2s',
              }}
            >
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {sent ? 'Sent ✓' : 'Send the Issue'}
            </button>

            {/* Dismiss Button */}
            <button
              onClick={() => { setShowPanel(false); setErrors([]); }}
              style={{
                padding: '10px 14px',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '14px',
                color: '#6b7280',
                backgroundColor: '#f3f4f6',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                transition: 'all 0.2s',
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
