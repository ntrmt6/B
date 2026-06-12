/**
 * SubscriptionRenewalPopup Component
 * Shows renewal popup when subscription is expired
 * - After day 30: Popup with Close + Renew buttons
 * - After day 37 (grace period ends): Permanent popup, no close button
 */

import React, { useState } from 'react';
import { X, AlertTriangle, Clock, ExternalLink } from 'lucide-react';
import RenewSubscription from './dashboard/RenewSubscription';

interface SubscriptionRenewalPopupProps {
  isOpen: boolean;
  onClose?: () => void;
  onRenew: () => void;
  canDismiss: boolean;
  daysOverdue: number;
  isBlocked: boolean;
  expiryMessage: string;
}

const SubscriptionRenewalPopup: React.FC<SubscriptionRenewalPopupProps> = ({
  isOpen,
  onClose,
  onRenew,
  canDismiss,
  daysOverdue,
  isBlocked,
  expiryMessage,
}) => {
  const [showRenewModal, setShowRenewModal] = useState(false);
  
  if (!isOpen) return null;

  const handleRenewClick = () => {
    setShowRenewModal(true);
  };

  const handleClose = () => {
    if (canDismiss && onClose) {
      onClose();
    }
  };

  const graceDaysLeft = Math.max(0, 7 - daysOverdue);

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}
        onClick={canDismiss ? handleClose : undefined}
      >
        {/* Popup Container */}
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxWidth: '450px',
            width: '100%',
            overflow: 'hidden',
            animation: 'popup-scale-in 0.3s ease-out',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with warning banner */}
          <div
            style={{
              background: isBlocked 
                ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
                : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              padding: '24px',
              position: 'relative',
            }}
          >
            {/* Close button - only shown if can dismiss */}
            {canDismiss && (
              <button
                onClick={handleClose}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                <X size={20} color="#fff" />
              </button>
            )}

            {/* Icon */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <AlertTriangle size={32} color="#fff" />
            </div>

            {/* Title */}
            <h2
              style={{
                color: '#fff',
                fontSize: '24px',
                fontWeight: 700,
                textAlign: 'center',
                margin: 0,
                fontFamily: '"Poppins", sans-serif',
              }}
            >
              {isBlocked ? 'Account Blocked' : 'Subscription Expired'}
            </h2>
          </div>

          {/* Content */}
          <div style={{ padding: '24px' }}>
            {/* Message */}
            <p
              style={{
                color: '#374151',
                fontSize: '15px',
                lineHeight: 1.6,
                textAlign: 'center',
                margin: '0 0 20px',
                fontFamily: '"Inter", sans-serif',
              }}
            >
              {expiryMessage}
            </p>

            {/* Grace period warning */}
            {!isBlocked && graceDaysLeft > 0 && (
              <div
                style={{
                  backgroundColor: '#fef3c7',
                  border: '1px solid #fcd34d',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '20px',
                }}
              >
                <Clock size={20} color="#d97706" />
                <span
                  style={{
                    color: '#92400e',
                    fontSize: '14px',
                    fontWeight: 500,
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  {graceDaysLeft} day{graceDaysLeft !== 1 ? 's' : ''} remaining in grace period
                </span>
              </div>
            )}

            {/* Blocked warning */}
            {isBlocked && (
              <div
                style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  marginBottom: '20px',
                }}
              >
                <p
                  style={{
                    color: '#991b1b',
                    fontSize: '14px',
                    margin: 0,
                    fontFamily: '"Inter", sans-serif',
                    lineHeight: 1.5,
                  }}
                >
                  <strong>Important:</strong> All store operations are currently blocked. 
                  Your customers cannot place orders until you renew your subscription.
                </p>
              </div>
            )}

            {/* Buttons */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Renew Button */}
              <button
                onClick={handleRenewClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '16px 24px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: '"Poppins", sans-serif',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(5, 150, 105, 0.5)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(5, 150, 105, 0.4)';
                }}
              >
                <span>Renew Subscription</span>
                <ExternalLink size={18} />
              </button>

              {/* Close Button - only shown if can dismiss */}
              {canDismiss && (
                <button
                  onClick={handleClose}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    color: '#6b7280',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '14px 24px',
                    fontSize: '15px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: '"Inter", sans-serif',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  Remind Me Later
                </button>
              )}
            </div>

            {/* Help text */}
            <p
              style={{
                color: '#9ca3af',
                fontSize: '13px',
                textAlign: 'center',
                margin: '16px 0 0',
                fontFamily: '"Inter", sans-serif',
              }}
            >
              Need help? Contact support at{' '}
              <a
                href="mailto:support@systemnextit.com"
                style={{ color: '#059669', textDecoration: 'none' }}
              >
                support@systemnextit.com
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* RenewSubscription Modal */}
      {showRenewModal && (
        <RenewSubscription 
          isOpen={showRenewModal}
          onClose={() => {
            setShowRenewModal(false);
            onRenew?.();
          }}
        />
      )}

      {/* Animation keyframes */}
      <style>{`
        @keyframes popup-scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
};

export default SubscriptionRenewalPopup;
