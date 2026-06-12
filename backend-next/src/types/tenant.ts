import type { ObjectId } from 'mongodb';

export interface BaseModel {
  _id?: string | ObjectId;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant extends BaseModel {
  id: any;
  name: string;
  subdomain: string;
  customDomain?: string | null;
  contactEmail: string;
  contactName?: string;
  adminEmail: string;
  // NOTE: adminPassword should NOT be stored in tenant document
  // It's only used during creation to create the admin user
  adminAuthUid?: string;
  plan: 'starter' | 'growth' | 'enterprise' | string;
  status: 'trialing' | 'active' | 'suspended' | 'archived' | string;
  onboardingCompleted: boolean;
  branding?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  };
  settings?: {
    currency?: string;
    timezone?: string;
    language?: string;
    [key: string]: unknown;
  };
  // Subscription/Package Management
  subscription?: {
    packageStartDate: string; // ISO date string when package started
    packageDays: number; // Number of days in package (default 30)
    lastRenewalDate?: string; // ISO date of last renewal
    gracePeriodDays: number; // Days after expiry before hard block (default 7)
    isBlocked: boolean; // If true, block all API calls
    lastNotificationShown?: string; // Date when last daily notification was shown
    renewalDismissedAt?: string; // When user dismissed the renewal popup
  };
  // Shop Status - managed by super admin
  shopStatus?: ShopStatus;
}

export interface ShopStatus {
  isTrialing: boolean;
  isStartups: boolean;
  isEnterprise: boolean;
  isPremium: boolean;
  isExpired: boolean;
  isSuspended: boolean;
  isBlocked: boolean;
}

export interface CreateTenantPayload {
  name: string;
  subdomain: string;
  contactEmail: string;
  contactName?: string;
  adminEmail: string;
  adminPassword: string; // Used only for creating admin user, not stored
  plan?: Tenant['plan'];
}