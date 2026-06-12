/**
 * Subscription Management Utilities
 * Handles package expiry checking, notification triggers, and renewal status
 */

export interface SubscriptionInfo {
  packageStartDate: string;
  packageDays: number;
  gracePeriodDays: number;
  isBlocked: boolean;
  lastNotificationShown?: string;
  renewalDismissedAt?: string;
  lastRenewalDate?: string;
}

export interface SubscriptionStatus {
  daysRemaining: number;
  daysOverdue: number;
  isExpired: boolean;
  isInGracePeriod: boolean;
  isBlocked: boolean;
  shouldShowNotification: boolean; // Days 27-30: show once daily
  shouldShowRenewalPopup: boolean; // After day 30: show on every login/reload
  canDismissPopup: boolean; // First 7 days after expiry: can close popup
  expiryDate: Date;
  packageEndDate: Date;
  graceEndDate: Date;
}

const DEFAULT_PACKAGE_DAYS = 30;
const DEFAULT_GRACE_PERIOD_DAYS = 7;
const NOTIFICATION_START_DAY = 26; // Start showing notification 4 days before expiry (days 27-30)

/**
 * Calculate subscription status from subscription info
 */
export function calculateSubscriptionStatus(
  subscription: SubscriptionInfo | undefined | null,
  currentDate: Date = new Date()
): SubscriptionStatus {
  // Default values if no subscription info
  if (!subscription || !subscription.packageStartDate) {
    return {
      daysRemaining: DEFAULT_PACKAGE_DAYS,
      daysOverdue: 0,
      isExpired: false,
      isInGracePeriod: false,
      isBlocked: false,
      shouldShowNotification: false,
      shouldShowRenewalPopup: false,
      canDismissPopup: true,
      expiryDate: new Date(Date.now() + DEFAULT_PACKAGE_DAYS * 24 * 60 * 60 * 1000),
      packageEndDate: new Date(Date.now() + DEFAULT_PACKAGE_DAYS * 24 * 60 * 60 * 1000),
      graceEndDate: new Date(Date.now() + (DEFAULT_PACKAGE_DAYS + DEFAULT_GRACE_PERIOD_DAYS) * 24 * 60 * 60 * 1000),
    };
  }

  const packageDays = subscription.packageDays || DEFAULT_PACKAGE_DAYS;
  const gracePeriodDays = subscription.gracePeriodDays || DEFAULT_GRACE_PERIOD_DAYS;
  
  const startDate = new Date(subscription.packageStartDate);
  const packageEndDate = new Date(startDate);
  packageEndDate.setDate(packageEndDate.getDate() + packageDays);
  
  const graceEndDate = new Date(packageEndDate);
  graceEndDate.setDate(graceEndDate.getDate() + gracePeriodDays);
  
  // Calculate days
  const msPerDay = 24 * 60 * 60 * 1000;
  const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  const endDay = new Date(packageEndDate.getFullYear(), packageEndDate.getMonth(), packageEndDate.getDate());
  
  const diffMs = endDay.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffMs / msPerDay);
  const daysOverdue = daysRemaining < 0 ? Math.abs(daysRemaining) : 0;
  
  const isExpired = daysRemaining <= 0;
  const isInGracePeriod = isExpired && daysOverdue <= gracePeriodDays;
  const isBlocked = subscription.isBlocked || daysOverdue > gracePeriodDays;
  
  // Check if should show daily notification (days 27-30, i.e., 4-1 days remaining)
  const daysUsed = packageDays - daysRemaining;
  const shouldShowNotificationBasedOnDays = daysUsed >= NOTIFICATION_START_DAY && daysRemaining > 0;
  
  // Check if notification was already shown today
  let notificationShownToday = false;
  if (subscription.lastNotificationShown) {
    const lastShown = new Date(subscription.lastNotificationShown);
    const lastShownDay = new Date(lastShown.getFullYear(), lastShown.getMonth(), lastShown.getDate());
    notificationShownToday = today.getTime() === lastShownDay.getTime();
  }
  
  const shouldShowNotification = shouldShowNotificationBasedOnDays && !notificationShownToday;
  
  // Show renewal popup after package expires
  const shouldShowRenewalPopup = isExpired;
  
  // Can dismiss popup only during grace period
  const canDismissPopup = isInGracePeriod;
  
  return {
    daysRemaining: Math.max(0, daysRemaining),
    daysOverdue,
    isExpired,
    isInGracePeriod,
    isBlocked,
    shouldShowNotification,
    shouldShowRenewalPopup,
    canDismissPopup,
    expiryDate: packageEndDate,
    packageEndDate,
    graceEndDate,
  };
}

/**
 * Format days remaining for display
 */
export function formatDaysRemaining(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return '1 day';
  return `${days} days`;
}

/**
 * Format expiry message based on status
 */
export function getExpiryMessage(status: SubscriptionStatus): string {
  if (status.isBlocked) {
    return 'Your subscription has expired. Please renew to continue using the platform.';
  }
  
  if (status.isInGracePeriod) {
    const graceDaysLeft = DEFAULT_GRACE_PERIOD_DAYS - status.daysOverdue;
    return `Your subscription expired ${status.daysOverdue} day${status.daysOverdue !== 1 ? 's' : ''} ago. You have ${graceDaysLeft} day${graceDaysLeft !== 1 ? 's' : ''} left to renew before your account is blocked.`;
  }
  
  if (status.isExpired) {
    return 'Your subscription has expired. Please renew to continue.';
  }
  
  if (status.daysRemaining <= 4) {
    return `Your subscription expires in ${formatDaysRemaining(status.daysRemaining)}. Renew now to avoid service interruption.`;
  }
  
  return '';
}

/**
 * Get notification severity based on days remaining/overdue
 */
export function getNotificationSeverity(status: SubscriptionStatus): 'info' | 'warning' | 'error' {
  if (status.isBlocked) return 'error';
  if (status.isExpired) return 'error';
  if (status.daysRemaining <= 2) return 'error';
  if (status.daysRemaining <= 4) return 'warning';
  return 'info';
}

/**
 * Storage key for tracking daily notification dismissal
 */
export function getNotificationDismissKey(tenantId: string): string {
  return `subscription_notification_dismissed_${tenantId}`;
}

/**
 * Check if notification was dismissed today
 */
export function wasNotificationDismissedToday(tenantId: string): boolean {
  try {
    const key = getNotificationDismissKey(tenantId);
    const dismissed = localStorage.getItem(key);
    if (!dismissed) return false;
    
    const dismissedDate = new Date(dismissed);
    const today = new Date();
    
    return (
      dismissedDate.getFullYear() === today.getFullYear() &&
      dismissedDate.getMonth() === today.getMonth() &&
      dismissedDate.getDate() === today.getDate()
    );
  } catch {
    return false;
  }
}

/**
 * Mark notification as dismissed for today
 */
export function dismissNotificationForToday(tenantId: string): void {
  try {
    const key = getNotificationDismissKey(tenantId);
    localStorage.setItem(key, new Date().toISOString());
  } catch {
    // Ignore storage errors
  }
}

/**
 * Renewal URL - configurable via env var
 */
const _renewalDomain = (process.env.NEXT_PUBLIC_PRIMARY_DOMAIN || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
export const RENEWAL_URL = _renewalDomain ? `https://${_renewalDomain}/renew` : '/renew';
