/**
 * useSubscription Hook
 * Manages tenant subscription state and renewal popup visibility
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  calculateSubscriptionStatus,
  SubscriptionInfo,
  SubscriptionStatus,
  wasNotificationDismissedToday,
  dismissNotificationForToday,
} from '../utils/subscriptionUtils';

interface UseSubscriptionOptions {
  tenantId?: string;
  subscription?: SubscriptionInfo | null;
  enabled?: boolean;
}

interface UseSubscriptionReturn {
  status: SubscriptionStatus;
  // Notification (days 27-30, once per day)
  showNotification: boolean;
  dismissNotification: () => void;
  // Renewal popup (after day 30)
  showRenewalPopup: boolean;
  dismissRenewalPopup: () => void;
  canDismissPopup: boolean;
  // Actions
  handleRenew: () => void;
  // Computed values
  isBlocked: boolean;
  daysRemaining: number;
  daysOverdue: number;
  expiryMessage: string;
}

const POPUP_DISMISS_KEY_PREFIX = 'subscription_popup_dismissed_';

/**
 * Get storage key for popup dismissal tracking
 */
function getPopupDismissKey(tenantId: string): string {
  return `${POPUP_DISMISS_KEY_PREFIX}${tenantId}`;
}

/**
 * Check if popup was dismissed in this session
 * During grace period, popup can be dismissed once per session (reload shows it again)
 * After grace period, popup cannot be dismissed
 */
function wasPopupDismissedThisSession(tenantId: string): boolean {
  if (!tenantId) return false;
  try {
    return sessionStorage.getItem(getPopupDismissKey(tenantId)) === 'true';
  } catch {
    return false;
  }
}

function setPopupDismissedThisSession(tenantId: string): void {
  if (!tenantId) return;
  try {
    sessionStorage.setItem(getPopupDismissKey(tenantId), 'true');
  } catch {
    // Ignore storage errors
  }
}

export function useSubscription({
  tenantId,
  subscription,
  enabled = true,
}: UseSubscriptionOptions): UseSubscriptionReturn {
  const [notificationDismissed, setNotificationDismissed] = useState(false);
  const [popupDismissed, setPopupDismissed] = useState(false);

  // Calculate subscription status
  const status = useMemo(() => {
    return calculateSubscriptionStatus(subscription);
  }, [subscription]);

  // Check if notification was already dismissed today on mount
  useEffect(() => {
    if (tenantId && enabled) {
      const dismissed = wasNotificationDismissedToday(tenantId);
      setNotificationDismissed(dismissed);
      
      // Check session storage for popup dismissal
      const popupDismissedSession = wasPopupDismissedThisSession(tenantId);
      setPopupDismissed(popupDismissedSession);
    }
  }, [tenantId, enabled]);

  // Dismiss notification for today
  const dismissNotification = useCallback(() => {
    if (tenantId) {
      dismissNotificationForToday(tenantId);
      setNotificationDismissed(true);
    }
  }, [tenantId]);

  // Dismiss popup for this session (only allowed during grace period)
  const dismissRenewalPopup = useCallback(() => {
    if (tenantId && status.canDismissPopup) {
      setPopupDismissedThisSession(tenantId);
      setPopupDismissed(true);
    }
  }, [tenantId, status.canDismissPopup]);

  // Callback for renewal action (does not open URL - modal handles that)
  const handleRenew = useCallback(() => {
    // This is just a callback to track that renewal was triggered
    // The actual modal/WhatsApp flow is handled by the RenewSubscription component
  }, []);

  // Determine what to show
  const showNotification = enabled && 
    status.shouldShowNotification && 
    !notificationDismissed && 
    !status.isExpired;

  const showRenewalPopup = enabled && 
    status.shouldShowRenewalPopup && 
    !popupDismissed;

  // Get expiry message
  const expiryMessage = useMemo(() => {
    if (status.isBlocked) {
      return 'Your subscription has expired. Please renew to continue using the platform.';
    }
    
    if (status.isInGracePeriod) {
      const graceDaysLeft = 7 - status.daysOverdue;
      return `Your subscription expired ${status.daysOverdue} day${status.daysOverdue !== 1 ? 's' : ''} ago. You have ${graceDaysLeft} day${graceDaysLeft !== 1 ? 's' : ''} left to renew before your account is blocked.`;
    }
    
    if (status.isExpired) {
      return 'Your subscription has expired. Please renew to continue.';
    }
    
    if (status.daysRemaining <= 4) {
      return `Your subscription expires in ${status.daysRemaining} day${status.daysRemaining !== 1 ? 's' : ''}. Renew now to avoid service interruption.`;
    }
    
    return '';
  }, [status]);

  return {
    status,
    showNotification,
    dismissNotification,
    showRenewalPopup,
    dismissRenewalPopup,
    canDismissPopup: status.canDismissPopup,
    handleRenew,
    isBlocked: status.isBlocked,
    daysRemaining: status.daysRemaining,
    daysOverdue: status.daysOverdue,
    expiryMessage,
  };
}

export default useSubscription;
