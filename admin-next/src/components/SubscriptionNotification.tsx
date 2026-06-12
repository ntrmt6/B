/**
 * SubscriptionNotification Component
 * Shows notification banner in dashboard when subscription is about to expire (days 27-30)
 * Displayed once per day, dismissible
 */

import React, { useState } from 'react';
import { X, Clock, ExternalLink } from 'lucide-react';
import RenewSubscription from './dashboard/RenewSubscription';

interface SubscriptionNotificationProps {
  isVisible: boolean;
  onDismiss: () => void;
  daysRemaining: number;
  onRenew: () => void;
}

const SubscriptionNotification: React.FC<SubscriptionNotificationProps> = ({
  isVisible,
  onDismiss,
  daysRemaining,
  onRenew,
}) => {
  const [showRenewModal, setShowRenewModal] = useState(false);
  
  if (!isVisible) return null;

  const handleRenewClick = () => {
    setShowRenewModal(true);
  };

  // Determine urgency level
  const isUrgent = daysRemaining <= 2;
  const isWarning = daysRemaining <= 4 && daysRemaining > 2;

  const backgroundColor = isUrgent 
    ? '#fef2f2' 
    : isWarning 
    ? '#fffbeb' 
    : '#f0fdf4';
  
  const borderColor = isUrgent 
    ? '#fecaca' 
    : isWarning 
    ? '#fcd34d' 
    : '#bbf7d0';
  
  const textColor = isUrgent 
    ? '#991b1b' 
    : isWarning 
    ? '#92400e' 
    : '#166534';
  
  const iconColor = isUrgent 
    ? '#dc2626' 
    : isWarning 
    ? '#d97706' 
    : '#16a34a';

  return (
    <div
      style={{
        backgroundColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '12px',
        padding: '14px 18px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        animation: 'notification-slide-in 0.3s ease-out',
      }}
    >
      {/* Left side - Icon and message */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: isUrgent ? '#fee2e2' : isWarning ? '#fef3c7' : '#dcfce7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Clock size={20} color={iconColor} />
        </div>
        
        <div>
          <p
            style={{
              color: textColor,
              fontSize: '14px',
              fontWeight: 600,
              margin: 0,
              fontFamily: '"Poppins", sans-serif',
            }}
          >
            Subscription Expiring Soon
          </p>
          <p
            style={{
              color: textColor,
              fontSize: '13px',
              margin: '2px 0 0',
              opacity: 0.85,
              fontFamily: '"Inter", sans-serif',
            }}
          >
            {daysRemaining === 1 
              ? 'Your subscription expires tomorrow. Renew now to avoid interruption.'
              : daysRemaining === 0
              ? 'Your subscription expires today! Renew immediately.'
              : `Your subscription expires in ${daysRemaining} days. Renew now to ensure uninterrupted service.`
            }
          </p>
        </div>
      </div>

      {/* Right side - Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        {/* Renew button */}
        <button
          onClick={handleRenewClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#059669',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: '"Poppins", sans-serif',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#047857';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#059669';
          }}
        >
          Renew Now
          <ExternalLink size={14} />
        </button>

        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            padding: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = isUrgent ? '#fecaca' : isWarning ? '#fde68a' : '#bbf7d0';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="Dismiss for today"
        >
          <X size={18} color={textColor} />
        </button>
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes notification-slide-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

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
    </div>
  );
};

export default SubscriptionNotification;
