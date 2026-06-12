/**
 * Error Reporter Utility
 * Shows error toasts with a "Send to WhatsApp" button for reporting errors.
 * Uses the same WhatsApp number as the global error boundary (01798923162).
 */
import React from 'react';
import toast from 'react-hot-toast';

const WHATSAPP_PHONE = '8801798923162';

/**
 * Build a WhatsApp URL with a pre-filled error message
 */
export const buildErrorWhatsAppUrl = (context: string, errorMessage: string, details?: string): string => {
  const timestamp = new Date().toISOString();
  const page = typeof window !== 'undefined' ? window.location.href : 'unknown';
  const message = [
    `🚨 *Error Report*`,
    ``,
    `*Context:* ${context}`,
    `*Time:* ${timestamp}`,
    `*Page:* ${page}`,
    `*Error:* ${errorMessage}`,
    details ? `\n*Details:* ${details}` : '',
  ].filter(Boolean).join('\n');

  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
};

const ErrorToastContent: React.FC<{ toastId: string; errorMessage: string; whatsappUrl: string }> = ({ toastId, errorMessage, whatsappUrl }) =>
  React.createElement('div', { className: 'flex flex-col gap-2 max-w-[300px]' },
    React.createElement('span', { className: 'text-sm font-medium text-red-800' }, errorMessage),
    React.createElement('a', {
      href: whatsappUrl,
      target: '_blank',
      rel: 'noopener noreferrer',
      onClick: () => toast.dismiss(toastId),
      className: 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-green-500 hover:bg-green-600 rounded-md w-fit cursor-pointer no-underline transition-colors',
    }, '📱 Send Error Report')
  );

/**
 * Show an error toast with a WhatsApp "Send" report button.
 * The toast stays visible for 8 seconds so the user has time to click the button.
 */
export const showErrorWithWhatsApp = (
  context: string,
  errorMessage: string,
  details?: string
): void => {
  const whatsappUrl = buildErrorWhatsAppUrl(context, errorMessage, details);

  toast(
    (t) => React.createElement(ErrorToastContent, { toastId: t.id, errorMessage, whatsappUrl }),
    { duration: 8000, icon: '❌' }
  );
};
