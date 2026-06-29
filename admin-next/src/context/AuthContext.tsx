import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getHostTenantSlug, getPrimaryDomain } from '../utils/appHelpers';

// Types
export type ResourceType = 
  | 'dashboard'
  | 'orders'
  | 'products'
  | 'customers'
  | 'inventory'
  | 'catalog'
  | 'landing_pages'
  | 'gallery'
  | 'reviews'
  | 'daily_target'
  | 'business_report'
  | 'expenses'
  | 'income'
  | 'due_book'
  | 'profit_loss'
  | 'notes'
  | 'customization'
  | 'settings'
  | 'admin_control'
  | 'tenants'
  | 'vendors';

export type ActionType = 'read' | 'write' | 'edit' | 'delete';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  username?: string;
  image?: string;
  role: 'customer' | 'admin' | 'tenant_admin' | 'super_admin' | 'staff';
  roleId?: string;
  roleDetails?: {
    _id: string;
    name: string;
    description: string;
    permissions?: Array<{
      resource: ResourceType;
      actions: ActionType[];
    }>;
  };
  tenantId?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
  isImpersonating?: boolean; // True if super admin is viewing as tenant
}

export type Permissions = Record<string, ActionType[]>;

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  permissions: Permissions;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isImpersonating: boolean; // True if super admin is viewing as tenant
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  phone?: string;
  tenantId?: string;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateUser: (user: Partial<AuthUser>) => void;
  hasPermission: (resource: ResourceType, action: ActionType) => boolean;
  hasAnyPermission: (permissions: Array<{ resource: ResourceType; action: ActionType }>) => boolean;
  hasAllPermissions: (permissions: Array<{ resource: ResourceType; action: ActionType }>) => boolean;
  canRead: (resource: ResourceType) => boolean;
  canWrite: (resource: ResourceType) => boolean;
  canEdit: (resource: ResourceType) => boolean;
  canDelete: (resource: ResourceType) => boolean;
  clearError: () => void;
  endImpersonation: () => Promise<void>; // End impersonation and return to super admin
  setImpersonationSession: (token: string, user: AuthUser, permissions: Permissions) => void; // Set session from impersonation callback
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Use canonical tenant resolution from appHelpers (supports all domains)
const getTenantSubdomain = (): string | null => getHostTenantSlug();

const API_BASE_URL = typeof window !== 'undefined' && (window as any).__ENV__?.NEXT_PUBLIC_API_BASE_URL
  ? String((window as any).__ENV__.NEXT_PUBLIC_API_BASE_URL)
  : (() => {
    const domain = getPrimaryDomain();
    if (domain && domain !== 'localhost') return `https://${domain}`;
    // In browser, extract from current location; during SSR, return empty
    if (typeof window !== 'undefined') {
      const parts = window.location.hostname.split('.');
      const root = parts.length > 2 ? parts.slice(-2).join('.') : window.location.hostname;
      return `${window.location.protocol}//${root}`;
    }
    return '';
  })();

const TOKEN_KEY = 'admin_auth_token';
const USER_KEY = 'admin_auth_user';
const PERMISSIONS_KEY = 'admin_auth_permissions';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    permissions: {},
    isAuthenticated: false,
    isLoading: true,
    error: null,
    isImpersonating: false
  });

  // Load stored auth data on mount
  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);
        const storedPermissions = localStorage.getItem(PERMISSIONS_KEY);

        if (storedToken && storedUser) {
          const user = JSON.parse(storedUser);
          const permissions = storedPermissions ? JSON.parse(storedPermissions) : {};

          // Validate token with backend
          try {
            const subdomain = getTenantSubdomain();
            const headers: Record<string, string> = {
              'Authorization': `Bearer ${storedToken}`,
              'Content-Type': 'application/json'
            };
            if (subdomain) {
              headers['x-tenant-subdomain'] = subdomain;
            }
            
            const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
              headers
            });

            if (response.ok) {
              const data = await response.json();
              const isImpersonating = data.user?.isImpersonating || user?.isImpersonating || false;
              setState({
                user: { ...data.user, isImpersonating },
                token: storedToken,
                permissions: data.permissions,
                isAuthenticated: true,
                isLoading: false,
                error: null,
                isImpersonating
              });

              // Update stored data with fresh data
              localStorage.setItem(USER_KEY, JSON.stringify(data.user));
              localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(data.permissions));
            } else if (response.status === 401) {
              // Token is definitively invalid (expired/revoked), clear storage silently
              // This is expected for users using the legacy auth system
              clearStorage();
              setState(prev => ({ ...prev, isLoading: false }));
            } else {
              // Other errors (500, network issues) - keep cached session
              console.warn('[Auth] Token validation failed with status:', response.status, '- using cached session');
              const isImpersonating = user?.isImpersonating || false;
              setState({
                user,
                token: storedToken,
                permissions,
                isAuthenticated: true,
                isLoading: false,
                error: null,
                isImpersonating
              });
            }
          } catch (error) {
            // Network error, use stored data - don't logout user
            console.warn('[Auth] Network error during token validation, using cached session');
            const isImpersonating = user?.isImpersonating || false;
            setState({
              user,
              token: storedToken,
              permissions,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              isImpersonating
            });
          }
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Error loading stored auth:', error);
        clearStorage();
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadStoredAuth();
  }, []);

  const clearStorage = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(PERMISSIONS_KEY);
  };

  const login = useCallback(async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const subdomain = getTenantSubdomain();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (subdomain) {
        headers['x-tenant-subdomain'] = subdomain;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers,
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific backend error codes
        const errorCode = data.code || '';
        if (errorCode === 'ACCOUNT_DEACTIVATED') {
          throw new Error('Your account has been deactivated. Contact support.');
        }
        if (response.status === 402 || errorCode === 'SUBSCRIPTION_BLOCKED') {
          throw new Error('Your subscription has expired. Please renew to continue.');
        }
        if (response.status === 503) {
          throw new Error('Service temporarily unavailable. Please try again later.');
        }
        throw new Error(data.error || 'Login failed');
      }

      // Store auth data
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(data.permissions));

      setState({
        user: data.user,
        token: data.token,
        permissions: data.permissions,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message
      }));
      throw error;
    }
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const subdomain = getTenantSubdomain();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (subdomain) {
        headers['x-tenant-subdomain'] = subdomain;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers,
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific backend error codes
        const errorCode = data.code || '';
        if (errorCode === 'ACCOUNT_DEACTIVATED') {
          throw new Error('Your account has been deactivated. Contact support.');
        }
        if (response.status === 402 || errorCode === 'SUBSCRIPTION_BLOCKED') {
          throw new Error('Your subscription has expired. Please renew to continue.');
        }
        if (response.status === 503) {
          throw new Error('Service temporarily unavailable. Please try again later.');
        }
        throw new Error(data.error || 'Registration failed');
      }

      // Store auth data
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(data.permissions));

      setState({
        user: data.user,
        token: data.token,
        permissions: data.permissions,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message
      }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    // Call logout API to clear cookies across all subdomains
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (state.token) {
        headers['Authorization'] = `Bearer ${state.token}`;
      }
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers,
        credentials: 'include'
      });
    } catch (error) {
      console.warn('[Auth] Logout API call failed:', error);
    }

    clearStorage();
    setState({
      user: null,
      token: null,
      permissions: {},
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isImpersonating: false
    });
  }, [state.token]);

  const refreshToken = useCallback(async () => {
    if (!state.token) return;

    try {
      const subdomain = getTenantSubdomain();
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${state.token}`,
        'Content-Type': 'application/json'
      };
      if (subdomain) {
        headers['x-tenant-subdomain'] = subdomain;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem(TOKEN_KEY, data.token);
        setState(prev => ({ ...prev, token: data.token }));
      } else {
        logout();
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
  }, [state.token, logout]);

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setState(prev => {
      if (!prev.user) return prev;
      const updatedUser = { ...prev.user, ...updates };
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      return { ...prev, user: updatedUser };
    });
  }, []);

  const hasPermission = useCallback((resource: ResourceType, action: ActionType): boolean => {
    // Super admin has all permissions
    if (state.user?.role === 'super_admin') return true;
    
    // Admin has all permissions except tenants
    if (state.user?.role === 'admin' && resource !== 'tenants') return true;

    // Check specific permissions
    const resourcePermissions = state.permissions[resource];
    return resourcePermissions?.includes(action) ?? false;
  }, [state.user, state.permissions]);

  const hasAnyPermission = useCallback((permissions: Array<{ resource: ResourceType; action: ActionType }>): boolean => {
    return permissions.some(({ resource, action }) => hasPermission(resource, action));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((permissions: Array<{ resource: ResourceType; action: ActionType }>): boolean => {
    return permissions.every(({ resource, action }) => hasPermission(resource, action));
  }, [hasPermission]);

  const canRead = useCallback((resource: ResourceType): boolean => {
    return hasPermission(resource, 'read');
  }, [hasPermission]);

  const canWrite = useCallback((resource: ResourceType): boolean => {
    return hasPermission(resource, 'write');
  }, [hasPermission]);

  const canEdit = useCallback((resource: ResourceType): boolean => {
    return hasPermission(resource, 'edit');
  }, [hasPermission]);

  const canDelete = useCallback((resource: ResourceType): boolean => {
    return hasPermission(resource, 'delete');
  }, [hasPermission]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // End impersonation and return to super admin panel
  const endImpersonation = useCallback(async () => {
    if (!state.token || !state.isImpersonating) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/end-impersonation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${state.token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        clearStorage();
        // Redirect to super admin panel
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        }
      } else {
        console.error('[Auth] End impersonation failed:', data.error);
        // Fallback: just logout
        await logout();
      }
    } catch (error) {
      console.error('[Auth] End impersonation error:', error);
      await logout();
    }
  }, [state.token, state.isImpersonating, logout]);

  // Set session from impersonation callback (used by /auth/callback page)
  const setImpersonationSession = useCallback((token: string, user: AuthUser, permissions: Permissions) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify({ ...user, isImpersonating: true }));
    localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));

    setState({
      user: { ...user, isImpersonating: true },
      token,
      permissions,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      isImpersonating: true
    });
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshToken,
    updateUser,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canRead,
    canWrite,
    canEdit,
    canDelete,
    clearError,
    endImpersonation,
    setImpersonationSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to access auth context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Hook to check if user has permission for a resource/action
 */
export const usePermission = (resource: ResourceType, action: ActionType): boolean => {
  const { hasPermission } = useAuth();
  return hasPermission(resource, action);
};

/**
 * Hook to get all permission checks for a resource
 */
export const useResourcePermissions = (resource: ResourceType) => {
  const { canRead, canWrite, canEdit, canDelete, isAuthenticated, user } = useAuth();
  
  return {
    canRead: canRead(resource),
    canWrite: canWrite(resource),
    canEdit: canEdit(resource),
    canDelete: canDelete(resource),
    isAuthenticated,
    userRole: user?.role
  };
};

export default AuthContext;
