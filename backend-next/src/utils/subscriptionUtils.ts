/**
 * Backend Subscription Utilities
 * Server-side subscription checking and validation
 */

import type { Tenant } from '../types/tenant';

export interface SubscriptionStatus {
  daysRemaining: number;
  daysOverdue: number;
  isExpired: boolean;
  isInGracePeriod: boolean;
  isBlocked: boolean;
  packageEndDate: Date;
  graceEndDate: Date;
}

const DEFAULT_PACKAGE_DAYS = 30;
const DEFAULT_GRACE_PERIOD_DAYS = 7;

/**
 * Calculate subscription status for a tenant
 */
export function calculateTenantSubscriptionStatus(tenant: Tenant): SubscriptionStatus {
  const subscription = tenant.subscription;
  
  // If no subscription info, treat as new/valid tenant (for backwards compatibility)
  if (!subscription || !subscription.packageStartDate) {
    const now = new Date();
    return {
      daysRemaining: DEFAULT_PACKAGE_DAYS,
      daysOverdue: 0,
      isExpired: false,
      isInGracePeriod: false,
      isBlocked: false,
      packageEndDate: new Date(now.getTime() + DEFAULT_PACKAGE_DAYS * 24 * 60 * 60 * 1000),
      graceEndDate: new Date(now.getTime() + (DEFAULT_PACKAGE_DAYS + DEFAULT_GRACE_PERIOD_DAYS) * 24 * 60 * 60 * 1000),
    };
  }

  const packageDays = subscription.packageDays || DEFAULT_PACKAGE_DAYS;
  const gracePeriodDays = subscription.gracePeriodDays || DEFAULT_GRACE_PERIOD_DAYS;
  
  const startDate = new Date(subscription.packageStartDate);
  const packageEndDate = new Date(startDate);
  packageEndDate.setDate(packageEndDate.getDate() + packageDays);
  
  const graceEndDate = new Date(packageEndDate);
  graceEndDate.setDate(graceEndDate.getDate() + gracePeriodDays);
  
  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  
  const diffMs = packageEndDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / msPerDay);
  const daysOverdue = daysRemaining < 0 ? Math.abs(daysRemaining) : 0;
  
  const isExpired = daysRemaining <= 0;
  const isInGracePeriod = isExpired && daysOverdue <= gracePeriodDays;
  const isBlocked = subscription.isBlocked || daysOverdue > gracePeriodDays;
  
  return {
    daysRemaining: Math.max(0, daysRemaining),
    daysOverdue,
    isExpired,
    isInGracePeriod,
    isBlocked,
    packageEndDate,
    graceEndDate,
  };
}

/**
 * Check if API calls should be blocked for this tenant
 */
export function shouldBlockTenantApiCalls(tenant: Tenant): boolean {
  const status = calculateTenantSubscriptionStatus(tenant);
  return status.isBlocked;
}

/**
 * Get subscription info for API response (safe to send to frontend)
 */
export function getSubscriptionInfoForClient(tenant: Tenant): {
  packageStartDate: string | null;
  packageDays: number;
  gracePeriodDays: number;
  isBlocked: boolean;
  lastNotificationShown: string | null;
  status: SubscriptionStatus;
} {
  const subscription = tenant.subscription;
  const status = calculateTenantSubscriptionStatus(tenant);
  
  return {
    packageStartDate: subscription?.packageStartDate || null,
    packageDays: subscription?.packageDays || DEFAULT_PACKAGE_DAYS,
    gracePeriodDays: subscription?.gracePeriodDays || DEFAULT_GRACE_PERIOD_DAYS,
    isBlocked: status.isBlocked,
    lastNotificationShown: subscription?.lastNotificationShown || null,
    status,
  };
}

/**
 * Initialize subscription for new tenant
 */
export function createInitialSubscription(): Tenant['subscription'] {
  return {
    packageStartDate: new Date().toISOString(),
    packageDays: DEFAULT_PACKAGE_DAYS,
    gracePeriodDays: DEFAULT_GRACE_PERIOD_DAYS,
    isBlocked: false,
  };
}

/**
 * Renew subscription (reset package start date)
 */
export function renewSubscription(currentSubscription?: Tenant['subscription']): Tenant['subscription'] {
  return {
    packageStartDate: new Date().toISOString(),
    packageDays: currentSubscription?.packageDays || DEFAULT_PACKAGE_DAYS,
    gracePeriodDays: currentSubscription?.gracePeriodDays || DEFAULT_GRACE_PERIOD_DAYS,
    isBlocked: false,
    lastRenewalDate: new Date().toISOString(),
    lastNotificationShown: undefined,
    renewalDismissedAt: undefined,
  };
}
