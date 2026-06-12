/**
 * useAuth - Authentication handlers extracted from App.tsx
 */

import { useCallback, Dispatch, SetStateAction } from 'react';
import type { User, Tenant } from '../types';
import { isAdminRole, getAuthErrorMessage, getHostTenantSlug, getApiUrl, getPrimaryDomain } from '../utils/appHelpers';

// Firebase is lazy-loaded to avoid ~150KB+ in the initial client bundle.
// It's only needed when the user triggers Google sign-in.
let cachedFirebaseAuth: typeof import('firebase/auth') | null = null;
let cachedFirebaseConfig: { auth: import('firebase/auth').Auth; provider: import('firebase/auth').GoogleAuthProvider } | null = null;

async function getFirebase() {
  if (!cachedFirebaseAuth || !cachedFirebaseConfig) {
    const [authModule, configModule] = await Promise.all([
      import('firebase/auth'),
      import('../config/firebase'),
    ]);
    cachedFirebaseAuth = authModule;
    cachedFirebaseConfig = configModule;
  }
  return { firebaseAuth: cachedFirebaseAuth, firebaseConfig: cachedFirebaseConfig };
}

// Default tenant ID
const DEFAULT_TENANT_ID = '';  // Empty to prevent data leaking to real tenant

// API Base URL - derived from env var or current hostname
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL
  ? String(process.env.NEXT_PUBLIC_API_BASE_URL)
  : (() => {
    const domain = getPrimaryDomain();
    if (domain && domain !== 'localhost:3000') return `https://${domain}`;
    // In browser, extract from current location; during SSR, return empty
    if (typeof window !== 'undefined') {
      const parts = window.location.hostname.split('.');
      const root = parts.length > 2 ? parts.slice(-2).join('.') : window.location.hostname;
      return `${window.location.protocol}//${root}`;
    }
    return '';
  })();

// Use canonical tenant resolution from appHelpers (supports all domains)
const getTenantSubdomain = (): string | null => getHostTenantSlug();

interface UseAuthOptions {
  tenants: Tenant[];
  users: User[];
  activeTenantId: string;
  setUser: (user: User | null) => void;
  setUsers: Dispatch<SetStateAction<User[]>>;
  setActiveTenantId: (id: string) => void;
  setCurrentView: (view: string) => void;
  setAdminSection: (section: string) => void;
  setSelectedVariant: (variant: null) => void;
}

export function useAuth({
  tenants,
  users,
  activeTenantId,
  setUser,
  setUsers,
  setActiveTenantId,
  setCurrentView,
  setAdminSection,
  setSelectedVariant,
}: UseAuthOptions) {
  const tryLegacyLogin = useCallback((email: string, pass: string): boolean => {
    const formattedEmail = email.trim();
    const formattedPass = pass.trim();
    const formattedEmailLower = formattedEmail.toLowerCase();

    const tenantAdmin = tenants.find(
      (tenant) => tenant.adminEmail?.toLowerCase() === formattedEmailLower && tenant.adminPassword === formattedPass
    );
    if (tenantAdmin) {
      // Check if this tenant_admin exists in users array (with saved profile data)
      const existingUser = users.find(u => u.email?.toLowerCase() === formattedEmailLower);
      const adminUser: User = existingUser ? {
        ...existingUser,
        tenantId: tenantAdmin.id
      } : {
        name: `${tenantAdmin.name} Admin`,
        email: formattedEmail,
        role: 'tenant_admin',
        tenantId: tenantAdmin.id
      };
      setUser(adminUser);
      if (tenantAdmin.id !== activeTenantId) {
        setActiveTenantId(tenantAdmin.id);
      }
      setAdminSection('dashboard');
      setCurrentView('admin');
      return true;
    }

    if (formattedEmailLower === 'admin@admin.com' && formattedPass === 'admin121') {
      const admin: User = {
        name: 'Super Admin',
        email: 'admin@admin.com',
        role: 'super_admin',
        tenantId: activeTenantId || DEFAULT_TENANT_ID
      };
      setUser(admin);
      const resolvedId = admin.tenantId || activeTenantId || DEFAULT_TENANT_ID;
      if (resolvedId !== activeTenantId) {
        setActiveTenantId(resolvedId);
      }
      setAdminSection('dashboard');
      setCurrentView('admin');
      return true;
    }

    if (formattedEmailLower === 'admin@super.com' && formattedPass === 'admin121') {
      const admin: User = {
        name: 'Super Admin',
        email: 'admin@super.com',
        role: 'super_admin',
        tenantId: activeTenantId || DEFAULT_TENANT_ID
      };
      setUser(admin);
      const resolvedId = admin.tenantId || activeTenantId || DEFAULT_TENANT_ID;
      if (resolvedId !== activeTenantId) {
        setActiveTenantId(resolvedId);
      }
      setAdminSection('dashboard');
      setCurrentView('admin');
      return true;
    }

    const foundUser = users.find(
      (u) => u.email?.toLowerCase() === formattedEmailLower && u.password === formattedPass
    );
    if (foundUser) {
      const userWithTenant = {
        ...foundUser,
        tenantId: foundUser.tenantId || activeTenantId || DEFAULT_TENANT_ID,
      };
      setUser(userWithTenant);
      const resolvedId = userWithTenant.tenantId || activeTenantId || DEFAULT_TENANT_ID;
      if (resolvedId !== activeTenantId) {
        setActiveTenantId(resolvedId);
      }
      if (!foundUser.tenantId) {
        setUsers((prev) => prev.map((u) => (u.email === foundUser.email ? userWithTenant : u)));
      }
      if (isAdminRole(userWithTenant.role)) {
        setCurrentView('admin');
        setAdminSection('dashboard');
      }
      return true;
    }

    return false;
  }, [tenants, users, activeTenantId, setUser, setActiveTenantId, setAdminSection, setCurrentView, setUsers]);

  const handleLogin = useCallback(async (email: string, pass: string): Promise<boolean> => {
    const normalizedEmail = email.trim();
    const normalizedPass = pass.trim();
    
    const subdomain = getTenantSubdomain();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (subdomain) {
      headers['x-tenant-subdomain'] = subdomain;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email: normalizedEmail, password: normalizedPass }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Invalid email or password.');
    }
    
    const data = await response.json();
    
    // Block admin login from store - redirect to /admin/login
    if (isAdminRole(data.user.role)) {
      throw new Error('Admin users must login at /admin/login');
    }
    
    // Store JWT token for RBAC API calls (customers only)
    localStorage.setItem('admin_auth_token', data.token);
    localStorage.setItem('admin_auth_user', JSON.stringify(data.user));
    localStorage.setItem('admin_auth_permissions', JSON.stringify(data.permissions || []));
    
    const loggedInUser: User = {
      name: data.user.name,
      email: data.user.email,
      role: data.user.role,
      // Prefer activeTenantId (already resolved UUID from subdomain) over API's tenantId (may be slug)
      tenantId: activeTenantId || data.user.tenantId || DEFAULT_TENANT_ID
    };
    setUser(loggedInUser);
    // Only update activeTenantId if it actually changed to prevent re-render loop
    const newTenantId = loggedInUser.tenantId || activeTenantId || DEFAULT_TENANT_ID;
    if (newTenantId !== activeTenantId) {
      setActiveTenantId(newTenantId);
    }
    
    return true;
  }, [activeTenantId, setUser, setActiveTenantId]);


  const handleRegister = useCallback(async (newUser: User): Promise<boolean> => {
    if (!newUser.email || !newUser.password) {
      throw new Error('Email and password are required');
    }
    
    const normalizedEmail = newUser.email.trim().toLowerCase();
    const subdomain = getTenantSubdomain();
    
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (subdomain) {
        headers['x-tenant-subdomain'] = subdomain;
      }
      
      // Call API to register user in database
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: newUser.name,
          email: normalizedEmail,
          password: newUser.password,
          phone: newUser.phone || '',
          tenantId: activeTenantId || newUser.tenantId || subdomain
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle email already exists error
        if (response.status === 409 || data.error?.includes('already')) {
          throw new Error('This email is already registered. Please try logging in instead.');
        }
        throw new Error(data.error || data.message || 'Registration failed. Please try again.');
      }
      
      // Store JWT token for authenticated API calls
      localStorage.setItem('admin_auth_token', data.token);
      localStorage.setItem('admin_auth_user', JSON.stringify(data.user));
      localStorage.setItem('admin_auth_permissions', JSON.stringify(data.permissions || []));
      
      const registeredUser: User = {
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone,
        role: data.user.role || 'customer',
        // Prefer activeTenantId (already resolved UUID) over API/subdomain slug
        tenantId: activeTenantId || data.user.tenantId || subdomain
      };

      setUser(registeredUser);
      setUsers((prev) => [...prev.filter((u) => u.email !== registeredUser.email), registeredUser]);
      // Don't override activeTenantId for customers — storefront tenant is subdomain-driven
      if (registeredUser.tenantId && registeredUser.tenantId !== activeTenantId && !activeTenantId) {
        setActiveTenantId(registeredUser.tenantId);
      }
      
      return true;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Registration failed');
    }
  }, [activeTenantId, setUsers, setUser, setActiveTenantId]);

  const handleGoogleLogin = useCallback(async (): Promise<boolean> => {
    try {
      const tenantIdToUse = activeTenantId || DEFAULT_TENANT_ID;
      const tenantSubdomain = getTenantSubdomain();

      // Lazy-load Firebase only when user triggers Google sign-in
      const { firebaseAuth, firebaseConfig } = await getFirebase();

      // Use popup for Google sign-in (avoids redirect/iframe/X-Frame-Options issues)
      const result = await firebaseAuth.signInWithPopup(firebaseConfig.auth, firebaseConfig.provider);
      const user = result.user;

      if (!user) {
        throw new Error('No user data received from Google');
      }

      const credential = firebaseAuth.GoogleAuthProvider.credentialFromResult(result);
      const idToken = credential?.idToken || (await user.getIdToken());

      // Send the ID token to backend for verification and user creation/login
      const payload: any = {
        idToken,
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
        provider: 'google',
        role: 'customer'
      };

      if (tenantSubdomain && tenantSubdomain !== 'www' && tenantSubdomain !== 'admin') {
        payload.tenantSubdomain = tenantSubdomain;
      } else if (tenantIdToUse) {
        payload.tenantId = tenantIdToUse;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Google login failed');
      }

      const data = await response.json();

      if (data.user) {
        // Prefer activeTenantId (resolved UUID) over API's tenantId (may be slug)
        const userWithResolvedTenant = {
          ...data.user,
          tenantId: activeTenantId || data.user.tenantId
        };
        setUser(userWithResolvedTenant);
        localStorage.setItem('admin_auth_user', JSON.stringify(userWithResolvedTenant));
      }

      if (data.token) {
        localStorage.setItem('admin_auth_token', data.token);
      }

      // Don't override activeTenantId for customers — storefront tenant is subdomain-driven
      if (data.user?.tenantId && data.user.tenantId !== activeTenantId && !activeTenantId) {
        setActiveTenantId(data.user.tenantId);
      }

      return true;
    } catch (error: any) {
      console.error('Google login error:', error);
      throw new Error(error.message || 'Failed to initiate Google sign-in');
    }
  }, [activeTenantId, setUser, setActiveTenantId]);

  const processGoogleRedirect = useCallback(async (): Promise<boolean> => {
    try {
      // Lazy-load Firebase only when processing redirect result
      const { firebaseAuth, firebaseConfig } = await getFirebase();

      // Check for redirect result after returning from Google
      const result = await firebaseAuth.getRedirectResult(firebaseConfig.auth);
      
      if (!result) {
        // No redirect result - user didn't come from Google auth
        return false;
      }

      const user = result.user;
      
      if (!user) {
        throw new Error('No user data received from Google');
      }

      // Get the Google OAuth ID token (NOT the Firebase ID token)
      // GoogleAuthProvider.credentialFromResult returns the Google OAuth credential
      const credential = firebaseAuth.GoogleAuthProvider.credentialFromResult(result);
      const idToken = credential?.idToken || (await user.getIdToken());
      
      // Get tenant info
      const tenantIdToUse = activeTenantId || DEFAULT_TENANT_ID;
      const tenantSubdomain = getTenantSubdomain();

      // Send the ID token to backend for verification and user creation/login
      const payload: any = {
        idToken,
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
        provider: 'google',
        role: 'customer'
      };

      if (tenantSubdomain && tenantSubdomain !== 'www' && tenantSubdomain !== 'admin') {
        payload.tenantSubdomain = tenantSubdomain;
      } else if (tenantIdToUse) {
        payload.tenantId = tenantIdToUse;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Google login failed');
      }

      const data = await response.json();

      // Store the user and tokens
      if (data.user) {
        // Prefer activeTenantId (resolved UUID) over API's tenantId (may be slug)
        const userWithResolvedTenant = {
          ...data.user,
          tenantId: activeTenantId || data.user.tenantId
        };
        setUser(userWithResolvedTenant);
        localStorage.setItem('admin_auth_user', JSON.stringify(userWithResolvedTenant));
      }

      if (data.token) {
        localStorage.setItem('admin_auth_token', data.token);
      }

      // Don't override activeTenantId for customers — storefront tenant is subdomain-driven
      if (data.user?.tenantId && data.user.tenantId !== activeTenantId && !activeTenantId) {
        setActiveTenantId(data.user.tenantId);
      }

      return true;
    } catch (error: any) {
      console.error('Google login error:', error);

      // Clean up on error
      localStorage.removeItem('google_login_tenant');
      localStorage.removeItem('google_login_subdomain');
      throw new Error(error.message || 'Failed to complete Google sign-in');
    }
  }, [activeTenantId, setUser, setActiveTenantId]);

  const handleLogout = useCallback(async () => {
    // Clear JWT tokens
    localStorage.removeItem('admin_auth_token');
    localStorage.removeItem('admin_auth_user');
    localStorage.removeItem('admin_auth_permissions');
    
    // Clear admin section from sessionStorage
    try {
      sessionStorage.removeItem('adminSection');
    } catch (e) {
      // Ignore storage errors
    }
    
    setUser(null);
    setSelectedVariant(null);
    setAdminSection('dashboard');
    
    // Check if on /admin path (tenant subdomain admin access)
    const isOnAdminPath = typeof window !== 'undefined' && 
      (window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/'));
    
    // Check if on admin.* or superadmin.* subdomain
    const isAdminSubdomain = typeof window !== 'undefined' && 
      window.location.hostname.startsWith('admin.');
    const isSuperAdminSubdomain = typeof window !== 'undefined' && 
      window.location.hostname.startsWith('superadmin.');
    
    if (isAdminSubdomain || isSuperAdminSubdomain) {
      // On admin/superadmin subdomain, show login page
      setCurrentView('admin-login');
    } else if (isOnAdminPath) {
      // On tenant subdomain with /admin path, redirect to store home
      setCurrentView('store');
      window.location.href = '/';
    } else {
      setCurrentView('store');
    }
  }, [setUser, setCurrentView, setSelectedVariant, setAdminSection]);

  const handleUpdateProfile = useCallback((updatedUser: User) => {
    const userWithTenant = { ...updatedUser, tenantId: updatedUser.tenantId || activeTenantId };
    setUser(userWithTenant);
    setUsers(prev => {
      // Check if user exists in array
      const exists = prev.some(u => u.email === updatedUser.email);
      if (exists) {
        // Update existing user
        return prev.map(u => u.email === updatedUser.email ? userWithTenant : u);
      } else {
        // Add user if they don't exist (e.g., tenant_admin created from tenant credentials)
        return [...prev, userWithTenant];
      }
    });
  }, [activeTenantId, setUser, setUsers]);

  return {
    tryLegacyLogin,
    handleLogin,
    handleRegister,
    handleGoogleLogin,
    processGoogleRedirect,
    handleLogout,
    handleUpdateProfile,
  };
}
