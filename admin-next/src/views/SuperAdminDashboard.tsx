import React, { useState, useEffect, useCallback } from 'react';
import { Building2, CreditCard, AlertTriangle, Rocket, MessageSquare } from 'lucide-react';
import { DataService } from '../services/DataService';
import { SubscriptionService } from '../services/SubscriptionService';
import { getAuthHeader } from '../services/authService';
import { getApiUrl, getPrimaryDomain } from '../utils/appHelpers';
import { Tenant, CreateTenantPayload, TenantStatus, ShopStatus } from '../types';
import { toast } from 'react-hot-toast';
import { SuperAdminTabSkeleton } from '../components/SkeletonLoaders';

// Import core UI components directly (not through barrel export to enable better code splitting)
// IMPORTANT: Direct imports prevent barrel exports from bundling all components together,
// allowing Vite to create separate chunks for each tab component and enable true lazy loading.
import Sidebar from '../components/superadmin/Sidebar';
import TopBar from '../components/superadmin/TopBar';
import type {
  TabType,
  SystemStats,
  TenantStats,
  PlatformConfig,
  Activity,
  AdminNotification,
  TenantThemeConfig,
  ChatConfig,
  BulkAnnouncement,
  SupportTicket,
  TicketMessage,
  MerchantHealth,
  AtRiskMerchant
} from '../components/superadmin/types';
import IsActiveTogglebtn from '@/components/superadmin/IsActiveTogglebtn';

// Lazy load tab components for better performance and code splitting
// Each tab component will be in its own bundle chunk
const OverviewTab = React.lazy(() => import('../components/superadmin/OverviewTab'));
const SettingsTab = React.lazy(() => import('../components/superadmin/SettingsTab'));
const NotificationsTab = React.lazy(() => import('../components/superadmin/NotificationsTab'));
const ThemeConfigTab = React.lazy(() => import('../components/superadmin/ThemeConfigTab'));
const ChatConfigTab = React.lazy(() => import('../components/superadmin/ChatConfigTab'));
const SubscriptionsTab = React.lazy(() => import('../components/superadmin/SubscriptionsTab'));
const BulkAnnouncementsTab = React.lazy(() => import('../components/superadmin/BulkAnnouncementsTab'));
const SupportTicketsTab = React.lazy(() => import('../components/superadmin/SupportTicketsTab'));
const MerchantSuccessTab = React.lazy(() => import('../components/superadmin/MerchantSuccessTab'));
const AnalyticsTab = React.lazy(() => import('../components/superadmin/AnalyticsTab'));
const AuditLogsTab = React.lazy(() => import('../components/superadmin/AuditLogsTab'));
const SystemHealthTab = React.lazy(() => import('../components/superadmin/SystemHealthTab'));
const BulkOperationsTab = React.lazy(() => import('../components/superadmin/BulkOperationsTab'));
const TutorialsTab = React.lazy(() => import('../components/superadmin/TutorialsTab'));
const ApkBuildsTab = React.lazy(() => import('../components/superadmin/ApkBuildsTab'));
const AppRequestsTab = React.lazy(() => import('../components/superadmin/AppRequestsTab'));
const AdsManagementTab = React.lazy(() => import('../components/superadmin/AdsManagementTab'));
const TenantFeatureControlTab = React.lazy(() => import('../components/superadmin/TenantFeatureControlTab'));
const BlogManagementTab = React.lazy(() => import('../components/superadmin/BlogManagementTab'));



// Lazy load AdminTenantManagement
const AdminTenantManagement = React.lazy(() => import('./AdminTenantManagement'));

// Default platform configuration
const defaultPlatformConfig: PlatformConfig = {
  platformName: 'SystemNext IT',
  platformUrl: getPrimaryDomain() || 'localhost',
  supportEmail: `support@${getPrimaryDomain() || 'localhost'}`,
  supportPhone: '+880 1410-050031',
  defaultCurrency: 'BDT',
  defaultLanguage: 'English',
  maintenanceMode: false,
  allowNewRegistrations: true,
  maxTenantsPerUser: 5,
  defaultTrialDays: 14,
  platformLogo: null,
  platformFavicon: null,
  smtpHost: '',
  smtpPort: '587',
  smtpUser: '',
  smtpPassword: '',
  googleAnalyticsId: '',
  facebookPixelId: '',
};

// Default theme configuration
const defaultThemeConfig: TenantThemeConfig = {
  primaryColor: '#22c55e',
  secondaryColor: '#ec4899',
  tertiaryColor: '#9333ea',
  fontColor: '#0f172a',
  hoverColor: '#f97316',
  surfaceColor: '#e2e8f0',
  darkMode: false,
  adminBgColor: '#030407',
  adminInputBgColor: '#0f172a',
  adminBorderColor: '#ffffff',
  adminFocusColor: '#f87171',
  // Storefront styling options
  headerStyle: 'style1',
  mobileHeaderStyle: 'style1',
  categorySectionStyle: 'style1',
  productCardStyle: 'style1',
  footerStyle: 'style1',
  bottomNavStyle: 'style1'
};

// Default chat configuration
const defaultChatConfig: ChatConfig = {
  enabled: true,
  whatsappNumber: '',
  messengerPageId: '',
  liveChatEnabled: true,
  supportHoursFrom: '09:00',
  supportHoursTo: '18:00',
  autoReplyMessage: 'Thanks for reaching out! We\'ll get back to you soon.',
  offlineMessage: 'We\'re currently offline. Please leave a message and we\'ll respond during business hours.'
};

// Mock announcements - will be replaced with API calls in future
const mockAnnouncements: BulkAnnouncement[] = [
  {
    id: '1',
    title: 'Scheduled Maintenance - December 29th',
    message: 'We will be performing scheduled maintenance on our servers. Expected downtime: 2 hours.',
    type: 'maintenance',
    channel: 'both',
    targetAudience: 'all',
    status: 'scheduled',
    scheduledAt: '2025-12-29T02:00:00',
    createdAt: '2 days ago',
    createdBy: 'Super Admin'
  },
  {
    id: '2',
    title: 'New Feature: Instagram Integration',
    message: 'We are excited to announce Instagram Shopping integration is now available for all Enterprise plans!',
    type: 'feature',
    channel: 'both',
    targetAudience: 'active',
    status: 'sent',
    sentAt: '2025-12-26',
    createdAt: '3 days ago',
    createdBy: 'Super Admin',
    openRate: 78,
    clickRate: 34
  },
  {
    id: '3',
    title: 'Holiday Season Tips',
    message: 'Maximize your sales this holiday season with these proven strategies...',
    type: 'info',
    channel: 'email',
    targetAudience: 'all',
    status: 'draft',
    createdAt: '1 day ago',
    createdBy: 'Super Admin'
  }
];

// Loading fallback for lazy-loaded tabs - using skeleton instead of spinner
const TabLoadingFallback = () => <SuperAdminTabSkeleton />;

const SuperAdminDashboard: React.FC = () => {
  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  // Tenant management state
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isTenantCreating, setIsTenantCreating] = useState(false);
  const [deletingTenantId, setDeletingTenantId] = useState<string | null>(null);

  // Platform settings state
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig>(defaultPlatformConfig);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Theme configuration state
  const [themeConfig, setThemeConfig] = useState<TenantThemeConfig>(defaultThemeConfig);

  // Chat configuration state
  const [chatConfig, setChatConfig] = useState<ChatConfig>(defaultChatConfig);

  // Announcements state
  const [announcements, setAnnouncements] = useState<BulkAnnouncement[]>(mockAnnouncements);

  // Support tickets state
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  // Merchant health state
  const [merchantHealth, setMerchantHealth] = useState<MerchantHealth[]>([]);
  const [atRiskMerchants, setAtRiskMerchants] = useState<AtRiskMerchant[]>([]);

  // Top tenants and activities state - replace mock data with real data
  const [topTenants, setTopTenants] = useState<TenantStats[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState<AdminNotification[]>([
    {
      id: '1',
      title: 'System Update Available',
      message: 'A new version of the platform is available. Please update at your earliest convenience.',
      type: 'info',
      targetTenants: 'all',
      createdAt: '2 hours ago',
      read: false,
      priority: 'medium'
    },
    {
      id: '2',
      title: 'Payment Processing Issue',
      message: 'We detected an issue with payment processing. Our team is working on resolving it.',
      type: 'warning',
      targetTenants: 'all',
      createdAt: '5 hours ago',
      read: false,
      priority: 'high'
    }
  ]);

  // Helper to get API URL - uses centralized getApiUrl from appHelpers
  const API_URL = getApiUrl();

  // Load tenants on mount
  useEffect(() => {
    const loadTenants = async () => {
      try {
        const data = await DataService.listTenants();
        setTenants(data);
      } catch (error) {
        console.error('Failed to load tenants:', error);
      }
    };
    loadTenants();
  }, []);

  // Load support tickets from API
  useEffect(() => {
    const loadSupportTickets = async () => {
      setIsLoadingTickets(true);
      try {
        const response = await fetch(`${API_URL}/support`, {
          headers: getAuthHeader()
        });
        
        if (response.ok) {
          const result = await response.json();
          // Transform backend tickets to frontend format
          const tickets: SupportTicket[] = (result.data || []).map((ticket: any) => ({
            id: ticket.id || ticket._id,
            tenantId: ticket.tenantId,
            tenantName: ticket.submittedBy?.name || 'Unknown Merchant',
            tenantSubdomain: ticket.tenantId,
            subject: ticket.title || getTicketSubject(ticket.type),
            description: ticket.description,
            category: mapTicketType(ticket.type),
            priority: ticket.priority || 'medium',
            status: mapTicketStatus(ticket.status),
            assignedTo: ticket.assignedTo?.name,
            createdAt: formatTimeAgo(ticket.createdAt),
            updatedAt: formatTimeAgo(ticket.updatedAt),
            messages: (ticket.comments || []).map((c: any) => ({
              id: c.id || c._id,
              senderId: c.userId,
              senderName: c.userName || 'Unknown',
              senderType: c.userId === ticket.submittedBy?.userId ? 'merchant' : 'support',
              message: c.message,
              createdAt: formatTimeAgo(c.createdAt)
            })),
            tags: ticket.images?.length > 0 ? ['has-attachments'] : []
          }));
          setSupportTickets(tickets);
        }
      } catch (error) {
        console.error('Failed to load support tickets:', error);
      } finally {
        setIsLoadingTickets(false);
      }
    };
    loadSupportTickets();
  }, [API_URL]);

  // Helper functions for ticket data transformation
  const getTicketSubject = (type: string): string => {
    switch (type) {
      case 'issue': return 'Issue Report';
      case 'feedback': return 'Feedback';
      case 'feature': return 'Feature Request';
      default: return 'Support Request';
    }
  };

  const mapTicketType = (type: string): 'bug' | 'feature_request' | 'billing' | 'technical' | 'general' => {
    switch (type) {
      case 'issue': return 'bug';
      case 'feature': return 'feature_request';
      case 'feedback': return 'general';
      default: return 'general';
    }
  };

  const mapTicketStatus = (status: string): 'open' | 'in_progress' | 'waiting_response' | 'resolved' | 'closed' => {
    switch (status) {
      case 'pending': return 'open';
      case 'in-progress': return 'in_progress';
      case 'resolved': return 'resolved';
      case 'closed': return 'closed';
      default: return 'open';
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // Load tenant statistics from API
  useEffect(() => {
    const loadTenantStats = async () => {
      if (tenants.length === 0) return;
      
      setIsLoadingStats(true);
      try {
        // Fetch stats for each tenant
        const statsPromises = tenants.slice(0, 10).map(async (tenant) => {
          try {
            const response = await fetch(`${API_URL}/tenants/${tenant.id}/stats`, {
              headers: getAuthHeader()
            });
            if (response.ok) {
              const result = await response.json();
              return {
                id: tenant.id,
                name: tenant.name,
                subdomain: tenant.subdomain,
                plan: tenant.plan || 'starter',
                status: tenant.status,
                totalOrders: result.data?.orderCount || 0,
                totalRevenue: 0, // Would need to calculate from orders
                activeUsers: result.data?.userCount || 0,
                lastActivity: tenant.updatedAt ? formatTimeAgo(tenant.updatedAt) : 'Unknown'
              };
            }
            return null;
          } catch (err) {
            console.error(`Failed to load stats for tenant ${tenant.id}:`, err);
            return null;
          }
        });

        const stats = (await Promise.all(statsPromises)).filter((s): s is TenantStats => s !== null);
        
        // Sort by total orders and take top 5
        const sortedStats = stats.sort((a, b) => b.totalOrders - a.totalOrders).slice(0, 5);
        setTopTenants(sortedStats);

        // Generate recent activities from tenant data
        const activities: Activity[] = [];
        tenants.slice(0, 5).forEach((tenant, idx) => {
          if (tenant.createdAt) {
            activities.push({
              id: idx + 1,
              type: 'new_tenant',
              message: `New tenant "${tenant.name}" registered`,
              time: formatTimeAgo(tenant.createdAt),
              icon: Building2
            });
          }
        });
        setRecentActivities(activities.slice(0, 5));
        
      } catch (error) {
        console.error('Failed to load tenant statistics:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadTenantStats();
  }, [tenants, API_URL]);

  // System stats derived from tenants and loaded data
  const systemStats: SystemStats = {
    totalTenants: tenants.length,
    activeTenants: tenants.filter(t => t.status === 'active').length,
    totalRevenue: topTenants.reduce((sum, t) => sum + (t.totalRevenue || 0), 0),
    monthlyRevenue: topTenants.reduce((sum, t) => sum + (t.totalRevenue || 0), 0),
    totalOrders: topTenants.reduce((sum, t) => sum + t.totalOrders, 0),
    totalUsers: topTenants.reduce((sum, t) => sum + t.activeUsers, 0),
    serverLoad: 34,
    uptime: '99.98%',
    diskUsage: 45,
    memoryUsage: 62
  };

  // Tenant handlers
  const handleCreateTenant = useCallback(async (
    payload: CreateTenantPayload,
    options?: { activate?: boolean }
  ): Promise<Tenant> => {
    setIsTenantCreating(true);
    try {
      const newTenant = await DataService.seedTenant(payload);
      // Force refresh to get fresh tenant list from server (bypass cache)
      const refreshed = await DataService.listTenants(true);
      setTenants(refreshed);
      toast.success(`${newTenant.name} created successfully`);
      return newTenant;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create tenant';
      toast.error(message);
      throw error;
    } finally {
      setIsTenantCreating(false);
    }
  }, []);

  const handleDeleteTenant = useCallback(async (tenantId: string): Promise<void> => {
    setDeletingTenantId(tenantId);
    try {
      await DataService.deleteTenant(tenantId);
      // Force refresh to get fresh tenant list from server (bypass cache)
      const refreshed = await DataService.listTenants(true);
      setTenants(refreshed);
      toast.success('Tenant deleted successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete tenant';
      toast.error(message);
      throw error;
    } finally {
      setDeletingTenantId(null);
    }
  }, []);

  const handleRefreshTenants = useCallback(async (): Promise<Tenant[]> => {
    try {
      // Force refresh when manually refreshing
      const data = await DataService.listTenants(true);
      setTenants(data);
      return data;
    } catch (error) {
      console.error('Failed to refresh tenants:', error);
      throw error;
    }
  }, []);

  // Save platform settings
  const handleSavePlatformSettings = useCallback(async () => {
    setIsSavingSettings(true);
    try {
      // In production, this would save to backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Platform settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSavingSettings(false);
    }
  }, []);

  // Notification handlers
  const handleSendNotification = useCallback(async (notification: Omit<AdminNotification, 'id' | 'createdAt' | 'read'>) => {
    try {
      // Call the broadcast API to send notification to all tenants
      const response = await fetch('/api/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notification)
      });
      
      if (!response.ok) {
        throw new Error('Failed to send notification');
      }
      
      const result = await response.json();
      
      // Add to local list for display
      const newNotification: AdminNotification = {
        ...notification,
        id: Date.now().toString(),
        createdAt: 'Just now',
        read: false
      };
      setNotifications(prev => [newNotification, ...prev]);
      toast.success(`Notification sent to ${result.data?.targetTenants || 'all'} tenants`);
    } catch (error) {
      toast.error('Failed to send notification');
      throw error;
    }
  }, []);

  const handleDeleteNotification = useCallback(async (notificationId: string) => {
    try {
      // Call API to delete broadcast notification
      const response = await fetch(`/api/notifications/broadcast/${notificationId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
      throw error;
    }
  }, []);

  // Helper to check if config has storefront styles
  const hasStorefrontStyles = (config: TenantThemeConfig): boolean => {
    return !!(config.headerStyle || config.mobileHeaderStyle || config.categorySectionStyle || 
              config.productCardStyle || config.footerStyle || config.bottomNavStyle);
  };

  // Helper interface for website config to improve type safety
  interface WebsiteConfigStyles {
    headerStyle?: string;
    mobileHeaderStyle?: string;
    categorySectionStyle?: string;
    productCardStyle?: string;
    footerStyle?: string;
    bottomNavStyle?: string;
    [key: string]: unknown;
  }

  // Theme configuration handlers
  const handleSaveTheme = useCallback(async (config: TenantThemeConfig) => {
    try {
      // Save default theme configuration
      const response = await fetch(`${API_URL}/tenant-data/public/default_theme_config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ data: config })
      });
      
      if (!response.ok) throw new Error('Failed to save theme');
      
      setThemeConfig(config);
      toast.success('Default theme saved successfully');
    } catch (error) {
      console.error('Failed to save theme:', error);
      toast.error('Failed to save theme');
      throw error;
    }
  }, [API_URL]);

  const handleApplyThemeToTenant = useCallback(async (tenantId: string, config: TenantThemeConfig) => {
    try {
      // Apply theme configuration to a specific tenant
      // This updates both theme_config and website_config for the tenant
      const themeResponse = await fetch(`${API_URL}/tenant-data/${tenantId}/theme_config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ data: config })
      });
      
      if (!themeResponse.ok) throw new Error('Failed to apply theme');
      
      // Also update website_config with storefront styles if they exist
      if (hasStorefrontStyles(config)) {
        // Fetch existing website config first
        const websiteConfigRes = await fetch(`${API_URL}/tenant-data/${tenantId}/website_config`, {
          headers: getAuthHeader()
        });
        
        let existingWebsiteConfig: WebsiteConfigStyles = {};
        if (websiteConfigRes.ok) {
          const result = await websiteConfigRes.json();
          existingWebsiteConfig = result.data || {};
        }
        
        // Merge storefront styles into website config
        const updatedWebsiteConfig: WebsiteConfigStyles = {
          ...existingWebsiteConfig,
          headerStyle: config.headerStyle || existingWebsiteConfig.headerStyle,
          mobileHeaderStyle: config.mobileHeaderStyle || existingWebsiteConfig.mobileHeaderStyle,
          categorySectionStyle: config.categorySectionStyle || existingWebsiteConfig.categorySectionStyle,
          productCardStyle: config.productCardStyle || existingWebsiteConfig.productCardStyle,
          footerStyle: config.footerStyle || existingWebsiteConfig.footerStyle,
          bottomNavStyle: config.bottomNavStyle || existingWebsiteConfig.bottomNavStyle,
        };
        
        await fetch(`${API_URL}/tenant-data/${tenantId}/website_config`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader()
          },
          body: JSON.stringify({ data: updatedWebsiteConfig })
        });
      }
      
      const tenant = tenants.find(t => (t.id || t._id) === tenantId);
      toast.success(`Theme applied to ${tenant?.name || 'tenant'} successfully`);
    } catch (error) {
      console.error('Failed to apply theme:', error);
      toast.error('Failed to apply theme');
      throw error;
    }
  }, [API_URL, tenants]);

  const handleApplyThemeToAll = useCallback(async (config: TenantThemeConfig) => {
    try {
      // Apply theme to all tenants
      let successCount = 0;
      let failCount = 0;
      
      for (const tenant of tenants) {
        try {
          const tenantId = tenant.id || tenant._id;
          if (!tenantId) continue;
          
          await fetch(`${API_URL}/tenant-data/${tenantId}/theme_config`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeader()
            },
            body: JSON.stringify({ data: config })
          });
          
          // Also update website_config with storefront styles
          if (hasStorefrontStyles(config)) {
            const websiteConfigRes = await fetch(`${API_URL}/tenant-data/${tenantId}/website_config`, {
              headers: getAuthHeader()
            });
            
            let existingWebsiteConfig: WebsiteConfigStyles = {};
            if (websiteConfigRes.ok) {
              const result = await websiteConfigRes.json();
              existingWebsiteConfig = result.data || {};
            }
            
            const updatedWebsiteConfig: WebsiteConfigStyles = {
              ...existingWebsiteConfig,
              headerStyle: config.headerStyle || existingWebsiteConfig.headerStyle,
              mobileHeaderStyle: config.mobileHeaderStyle || existingWebsiteConfig.mobileHeaderStyle,
              categorySectionStyle: config.categorySectionStyle || existingWebsiteConfig.categorySectionStyle,
              productCardStyle: config.productCardStyle || existingWebsiteConfig.productCardStyle,
              footerStyle: config.footerStyle || existingWebsiteConfig.footerStyle,
              bottomNavStyle: config.bottomNavStyle || existingWebsiteConfig.bottomNavStyle,
            };
            
            await fetch(`${API_URL}/tenant-data/${tenantId}/website_config`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
              },
              body: JSON.stringify({ data: updatedWebsiteConfig })
            });
          }
          
          successCount++;
        } catch (err) {
          failCount++;
          console.error(`Failed to apply theme to tenant:`, err);
        }
      }
      
      if (failCount === 0) {
        toast.success(`Theme applied to all ${successCount} tenants successfully`);
      } else {
        toast.success(`Theme applied to ${successCount} tenants, ${failCount} failed`);
      }
    } catch (error) {
      console.error('Failed to apply theme to all tenants:', error);
      toast.error('Failed to apply theme to all tenants');
      throw error;
    }
  }, [API_URL, tenants]);

  // Load tenant-specific theme configuration
  const handleLoadTenantTheme = useCallback(async (tenantId: string): Promise<TenantThemeConfig | null> => {
    try {
      const response = await fetch(`${API_URL}/tenant-data/${tenantId}/theme_config`, {
        headers: getAuthHeader()
      });
      
      if (!response.ok) return null;
      
      const result = await response.json();
      return result.data || null;
    } catch (error) {
      console.error('Failed to load tenant theme:', error);
      return null;
    }
  }, [API_URL]);

  // Chat configuration handlers
  const handleSaveChatConfig = useCallback(async (config: ChatConfig) => {
    try {
      // In production, this would save to backend
      await new Promise(resolve => setTimeout(resolve, 500));
      setChatConfig(config);
      toast.success('Chat configuration saved');
    } catch (error) {
      toast.error('Failed to save chat configuration');
      throw error;
    }
  }, []);

  const handleApplyChatToTenant = useCallback(async (tenantId: string, config: ChatConfig) => {
    try {
      // In production, this would call an API to update tenant chat settings
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Chat settings applied to tenant');
    } catch (error) {
      toast.error('Failed to apply chat settings');
      throw error;
    }
  }, []);

  const handleApplyChatToAll = useCallback(async (config: ChatConfig) => {
    try {
      // In production, this would call an API to update all tenants
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Chat settings applied to all tenants');
    } catch (error) {
      toast.error('Failed to apply chat settings to all tenants');
      throw error;
    }
  }, []);

  // Tenant status update handler
  const handleUpdateTenantStatus = useCallback(async (tenantId: string, status: Tenant['status'], reason?: string): Promise<void> => {
    if (!tenantId) {
      toast.error('Invalid tenant ID');
      return;
    }
    try {
      // Map frontend status values to backend-supported enum
      // Backend accepts: trialing, active, suspended, archived
      const statusMapping: Record<string, string> = {
        inactive: 'suspended',
        pending: 'trialing',
      };
      const backendStatus = statusMapping[status] || status;
      
      const response = await fetch(`${API_URL}/tenants/${tenantId}/status`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        body: JSON.stringify({ status: backendStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update tenant status (${response.status})`);
      }
      
      const updatedTenants = tenants.map(t => 
        (t.id === tenantId || t._id === tenantId)
          ? { 
              ...t, 
              status,
              ...(status === 'active' && { approvedAt: new Date().toISOString(), approvedBy: 'super_admin' }),
              ...(status === 'inactive' && reason && { rejectedAt: new Date().toISOString(), rejectedBy: 'super_admin', rejectionReason: reason }),
              ...(status === 'suspended' && { suspendedAt: new Date().toISOString(), suspendedBy: 'super_admin', suspensionReason: reason }),
            }
          : t
      );
      
      setTenants(updatedTenants);
      toast.success(`Tenant status updated to ${status}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update tenant status');
      throw error;
    }
  }, [tenants, API_URL]);

  // Shop status update handler
  const handleUpdateShopStatus = useCallback(async (tenantId: string, shopStatus: Partial<ShopStatus>): Promise<void> => {
    if (!tenantId) {
      toast.error('Invalid tenant ID');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/tenants/${tenantId}/shop-status`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        body: JSON.stringify(shopStatus),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update shop status (${response.status})`);
      }

      const result = await response.json();
      const updatedTenants = tenants.map(t =>
        (t.id === tenantId || t._id === tenantId)
          ? { ...t, shopStatus: result.data.shopStatus }
          : t
      );

      setTenants(updatedTenants);
      toast.success('Shop status updated successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update shop status');
      throw error;
    }
  }, [tenants, API_URL]);

  // Login as merchant handler
  const handleLoginAsMerchant = useCallback(async (tenantId: string): Promise<void> => {
    try {
      const tenant = tenants.find(t => t.id === tenantId);
      if (!tenant) throw new Error('Tenant not found');
      
      // In production, this would:
      // 1. Create a temporary admin session for the tenant
      // 2. Redirect to the tenant's admin dashboard
      // 3. Log the superadmin action for audit
      
      toast.success(`Ghosting as ${tenant.name}...`);
      
      // Simulate redirect delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, show what would happen
      console.log(`Would redirect to: https://admin.${getPrimaryDomain()}?tenant=${tenant.subdomain} with impersonation token`);
      
      // In production: window.location.href = impersonationUrl;
    } catch (error) {
      toast.error('Failed to login as merchant');
      throw error;
    }
  }, [tenants]);


  // Domain update handler - Full setup with Nginx and SSL
  const handleUpdateDomain = useCallback(async (tenantId: string, domain: string, type: 'subdomain' | 'custom'): Promise<void> => {
    try {
      if (type === 'custom') {
        // First verify DNS is configured
        toast.loading('Verifying DNS configuration...', { id: 'domain-setup' });
        
        const dnsResult = await DataService.verifyDomainDNS(tenantId, domain) as unknown as { dnsVerified: boolean };
        
        if (!dnsResult?.dnsVerified) {
          toast.error(
            `DNS not configured correctly. Please point ${domain} to our server IP first.`,
            { id: 'domain-setup', duration: 5000 }
          );
          throw new Error('DNS not configured. Please add an A record pointing to our server.');
        }
        
        // DNS verified, now setup the domain with Nginx and SSL
        toast.loading('Setting up domain with SSL certificate...', { id: 'domain-setup' });
        
        const setupResult = await DataService.setupCustomDomain(tenantId, domain) as unknown as { success: boolean; message?: string };
        
        if (setupResult.success) {
          // Update local state
          setTenants(prevTenants => 
            prevTenants.map(t => t.id === tenantId ? { ...t, customDomain: domain } : t)
          );
          
          toast.success(
            `Custom domain "${domain}" configured successfully with SSL!`,
            { id: 'domain-setup', duration: 5000 }
          );
        } else {
          throw new Error(setupResult.message || 'Domain setup failed');
        }
      } else {
        toast.error('Subdomain changes are not supported at this time');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to setup domain';
      toast.error(message, { id: 'domain-setup' });
      throw error;
    }
  }, []);

  // Announcement handlers

  // Announcement handlers
  const handleCreateAnnouncement = useCallback(async (announcement: Omit<BulkAnnouncement, 'id' | 'createdAt' | 'status'>) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newAnnouncement: BulkAnnouncement = {
        ...announcement,
        id: Date.now().toString(),
        createdAt: 'Just now',
        status: announcement.scheduledAt ? 'scheduled' : 'draft'
      };
      setAnnouncements(prev => [newAnnouncement, ...prev]);
      toast.success('Announcement created successfully');
    } catch (error) {
      toast.error('Failed to create announcement');
      throw error;
    }
  }, []);

  const handleUpdateAnnouncement = useCallback(async (id: string, updates: Partial<BulkAnnouncement>) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
      toast.success('Announcement updated');
    } catch (error) {
      toast.error('Failed to update announcement');
      throw error;
    }
  }, []);

  const handleDeleteAnnouncement = useCallback(async (id: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      toast.success('Announcement deleted');
    } catch (error) {
      toast.error('Failed to delete announcement');
      throw error;
    }
  }, []);

  const handleSendAnnouncement = useCallback(async (id: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setAnnouncements(prev => prev.map(a => 
        a.id === id ? { ...a, status: 'sent' as const, sentAt: new Date().toISOString() } : a
      ));
      toast.success('Announcement sent successfully');
    } catch (error) {
      toast.error('Failed to send announcement');
      throw error;
    }
  }, []);

  // Support ticket handlers
  const handleCreateTicket = useCallback(async (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'messages'>) => {
    try {
      const response = await fetch(`${API_URL}/support`, {
        method: 'POST',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: ticket.category === 'bug' ? 'issue' : ticket.category === 'feature_request' ? 'feature' : 'feedback',
          title: ticket.subject,
          description: ticket.description,
          priority: ticket.priority,
          tenantId: ticket.tenantId
        })
      });
      
      if (!response.ok) throw new Error('Failed to create ticket');
      
      // Refresh tickets list
      const refreshResponse = await fetch(`${API_URL}/support`, { headers: getAuthHeader() });
      if (refreshResponse.ok) {
        const result = await refreshResponse.json();
        const tickets: SupportTicket[] = (result.data || []).map((t: any) => ({
          id: t.id || t._id,
          tenantId: t.tenantId,
          tenantName: t.submittedBy?.name || 'Unknown Merchant',
          tenantSubdomain: t.tenantId,
          subject: t.title || getTicketSubject(t.type),
          description: t.description,
          category: mapTicketType(t.type),
          priority: t.priority || 'medium',
          status: mapTicketStatus(t.status),
          assignedTo: t.assignedTo?.name,
          createdAt: formatTimeAgo(t.createdAt),
          updatedAt: formatTimeAgo(t.updatedAt),
          messages: (t.comments || []).map((c: any) => ({
            id: c.id || c._id,
            senderId: c.userId,
            senderName: c.userName || 'Unknown',
            senderType: c.userId === t.submittedBy?.userId ? 'merchant' : 'support',
            message: c.message,
            createdAt: formatTimeAgo(c.createdAt)
          })),
          tags: t.images?.length > 0 ? ['has-attachments'] : []
        }));
        setSupportTickets(tickets);
      }
      toast.success('Ticket created');
    } catch (error) {
      toast.error('Failed to create ticket');
      throw error;
    }
  }, [API_URL]);

  const handleUpdateTicket = useCallback(async (id: string, updates: Partial<SupportTicket>) => {
    try {
      const backendUpdates: any = {};
      if (updates.status) {
        backendUpdates.status = updates.status === 'open' ? 'pending' 
          : updates.status === 'in_progress' ? 'in-progress' 
          : updates.status;
      }
      if (updates.priority) backendUpdates.priority = updates.priority;
      
      const response = await fetch(`${API_URL}/support/${id}`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(backendUpdates)
      });
      
      if (!response.ok) throw new Error('Failed to update ticket');
      
      setSupportTickets(prev => prev.map(t => t.id === id ? { ...t, ...updates, updatedAt: 'Just now' } : t));
      toast.success('Ticket updated');
    } catch (error) {
      toast.error('Failed to update ticket');
      throw error;
    }
  }, [API_URL]);

  const handleReplyTicket = useCallback(async (ticketId: string, message: Omit<TicketMessage, 'id' | 'createdAt'>) => {
    try {
      const response = await fetch(`${API_URL}/support/${ticketId}/comments`, {
        method: 'POST',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: message.message })
      });
      
      if (!response.ok) throw new Error('Failed to send reply');
      
      const result = await response.json();
      const newMessage: TicketMessage = {
        id: result.data?.id || Date.now().toString(),
        senderId: message.senderId,
        senderName: message.senderName,
        senderType: 'support',
        message: message.message,
        createdAt: 'Just now'
      };
      
      setSupportTickets(prev => prev.map(t => 
        t.id === ticketId 
          ? { ...t, messages: [...t.messages, newMessage], updatedAt: 'Just now', status: 'waiting_response' as const }
          : t
      ));
      toast.success('Reply sent');
    } catch (error) {
      toast.error('Failed to send reply');
      throw error;
    }
  }, [API_URL]);

  const handleCloseTicket = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/support/${id}`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'closed' })
      });
      
      if (!response.ok) throw new Error('Failed to close ticket');
      
      setSupportTickets(prev => prev.map(t => 
        t.id === id ? { ...t, status: 'closed' as const, resolvedAt: new Date().toISOString() } : t
      ));
      toast.success('Ticket closed');
    } catch (error) {
      toast.error('Failed to close ticket');
      throw error;
    }
  }, [API_URL]);

  // Merchant success handlers
  const handleAcknowledgeAlert = useCallback(async (merchantId: string, alertId: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setMerchantHealth(prev => prev.map(m => 
        m.tenantId === merchantId 
          ? { ...m, alerts: m.alerts.map(a => a.id === alertId ? { ...a, acknowledged: true, acknowledgedAt: new Date().toISOString() } : a) }
          : m
      ));
      toast.success('Alert acknowledged');
    } catch (error) {
      toast.error('Failed to acknowledge alert');
      throw error;
    }
  }, []);

  const handleContactMerchant = useCallback(async (merchantId: string, method: 'email' | 'phone' | 'message') => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      toast.success(`Opening ${method} for merchant...`);
      // In production, this would open email client, phone dialer, or messaging interface
    } catch (error) {
      toast.error('Failed to contact merchant');
      throw error;
    }
  }, []);

  const handleScheduleFollowUp = useCallback(async (merchantId: string, date: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setAtRiskMerchants(prev => prev.map(m => 
        m.tenantId === merchantId ? { ...m, nextFollowUp: date } : m
      ));
      toast.success('Follow-up scheduled');
    } catch (error) {
      toast.error('Failed to schedule follow-up');
      throw error;
    }
  }, []);

  const handleUpdateMerchantStatus = useCallback(async (merchantId: string, status: AtRiskMerchant['status']) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setAtRiskMerchants(prev => prev.map(m => 
        m.tenantId === merchantId ? { ...m, status } : m
      ));
      toast.success('Merchant status updated');
    } catch (error) {
      toast.error('Failed to update status');
      throw error;
    }
  }, []);

  const handleAddNote = useCallback(async (merchantId: string, note: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setAtRiskMerchants(prev => prev.map(m => 
        m.tenantId === merchantId ? { ...m, notes: note } : m
      ));
      toast.success('Note saved');
    } catch (error) {
      toast.error('Failed to save note');
      throw error;
    }
  }, []);

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'tenants':
        return (
          <React.Suspense fallback={<TabLoadingFallback />}>
            <AdminTenantManagement
              tenants={tenants}
              onCreateTenant={handleCreateTenant}
              onDeleteTenant={handleDeleteTenant}
              onRefreshTenants={handleRefreshTenants}
              onUpdateTenantStatus={handleUpdateTenantStatus}
              onLoginAsMerchant={handleLoginAsMerchant}
              onUpdateDomain={handleUpdateDomain}
              isCreating={isTenantCreating}
              deletingTenantId={deletingTenantId}
            />
          </React.Suspense>
        );

      case 'subscriptions':
        return (
          <React.Suspense fallback={<TabLoadingFallback />}>
            <SubscriptionsTab
              onLoadPlans={async () => await SubscriptionService.getPlans()}
              onCreatePlan={async (plan) => {
                await SubscriptionService.createPlan(plan);
              }}
              onUpdatePlan={async (id, plan) => {
                await SubscriptionService.updatePlan(id, plan);
              }}
              onDeletePlan={async (id) => {
                await SubscriptionService.deletePlan(id);
              }}
              onLoadTransactions={async () => {
                const result = await SubscriptionService.getTransactions();
                return result.data;
              }}
              onRefundTransaction={async (id, reason) => {
                await SubscriptionService.refundTransaction(id, reason);
              }}
              onLoadInvoices={async () => {
                const result = await SubscriptionService.getInvoices();
                return result.data;
              }}
              onLoadTrialSettings={async () => await SubscriptionService.getTrialSettings()}
              onUpdateTrialSettings={async (settings) => {
                await SubscriptionService.updateTrialSettings(settings);
              }}
              tenants={tenants}
              onUpdateTenantStatus={handleUpdateTenantStatus}
              onUpdateShopStatus={handleUpdateShopStatus}
            />
          </React.Suspense>
        );

      case 'settings':
        return (
          <React.Suspense fallback={<TabLoadingFallback />}>
            <SettingsTab
              platformConfig={platformConfig}
              setPlatformConfig={setPlatformConfig}
              isSavingSettings={isSavingSettings}
              onSave={handleSavePlatformSettings}
            />
          </React.Suspense>
        );

      case 'notifications':
        return (
          <React.Suspense fallback={<TabLoadingFallback />}>
            <NotificationsTab
              notifications={notifications}
              onSendNotification={handleSendNotification}
              onDeleteNotification={handleDeleteNotification}
              tenants={tenants}
            />
          </React.Suspense>
        );

      case 'theme-config':
        return (
          <React.Suspense fallback={<TabLoadingFallback />}>
            <ThemeConfigTab
              defaultTheme={themeConfig}
              onSaveTheme={handleSaveTheme}
              onApplyToTenant={handleApplyThemeToTenant}
              onApplyToAll={handleApplyThemeToAll}
              tenants={tenants}
              onLoadTenantTheme={handleLoadTenantTheme}
            />
          </React.Suspense>
        );

      case 'chat-config':
        return (
          <React.Suspense fallback={<TabLoadingFallback />}>
            <ChatConfigTab
              chatConfig={chatConfig}
              onSaveChatConfig={handleSaveChatConfig}
              onApplyToTenant={handleApplyChatToTenant}
              onApplyToAll={handleApplyChatToAll}
              tenants={tenants}
            />
          </React.Suspense>
        );

      case 'announcements':
        return (
          <React.Suspense fallback={<TabLoadingFallback />}>
            <BulkAnnouncementsTab
              announcements={announcements}
              tenants={tenants}
              onCreateAnnouncement={handleCreateAnnouncement}
              onUpdateAnnouncement={handleUpdateAnnouncement}
              onDeleteAnnouncement={handleDeleteAnnouncement}
              onSendAnnouncement={handleSendAnnouncement}
            />
          </React.Suspense>
        );

      case 'support-tickets':
        return (
          <React.Suspense fallback={<TabLoadingFallback />}>
            <SupportTicketsTab
              tickets={supportTickets}
              tenants={tenants}
              onCreateTicket={handleCreateTicket}
              onUpdateTicket={handleUpdateTicket}
              onReplyTicket={handleReplyTicket}
              onCloseTicket={handleCloseTicket}
            />
          </React.Suspense>
        );

      case 'merchant-success':
        return (
          <React.Suspense fallback={<TabLoadingFallback />}>
            <MerchantSuccessTab
              merchantHealth={merchantHealth}
              atRiskMerchants={atRiskMerchants}
              tenants={tenants}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              onContactMerchant={handleContactMerchant}
              onScheduleFollowUp={handleScheduleFollowUp}
              onUpdateMerchantStatus={handleUpdateMerchantStatus}
              onAddNote={handleAddNote}
            />
          </React.Suspense>
        );

      case 'analytics':
        return (
          <React.Suspense fallback={<TabLoadingFallback />}>
            <AnalyticsTab
              systemStats={systemStats}
              tenants={tenants}
            />
          </React.Suspense>
        );

      case 'audit-logs':
        return (
          <React.Suspense fallback={<TabLoadingFallback />}>
            <AuditLogsTab />
          </React.Suspense>
        );

      case 'system-health':
        return (
          <React.Suspense fallback={<TabLoadingFallback />}>
            <SystemHealthTab systemStats={systemStats} />
          </React.Suspense>
        );

      case 'bulk-operations':
        return (
          <React.Suspense fallback={<TabLoadingFallback />}>
            <BulkOperationsTab
              tenants={tenants}
              onBulkStatusChange={async (tenantIds, status) => {
                // Update status for multiple tenants
                for (const tenantId of tenantIds) {
                  await handleUpdateTenantStatus(tenantId, status as TenantStatus);
                }
              }}
              onBulkDelete={async (tenantIds) => {
                // Delete multiple tenants
                for (const tenantId of tenantIds) {
                  await handleDeleteTenant(tenantId);
                }
              }}
              onBulkEmail={async (tenantIds, subject, message) => {
                // Send bulk email - in production, this would call an API
                await new Promise(resolve => setTimeout(resolve, 1000));
                console.log('Bulk email sent:', { tenantIds, subject, message });
              }}
            />
          </React.Suspense>
        );

      case 'website-config':
        return (
          <div className="p-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 lg:p-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Website Configuration</h2>
              <p className="text-slate-600 mb-6">
                Configure global website settings for all tenants. This includes SEO, meta tags, and other website-wide settings.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="font-semibold text-slate-700 mb-2">Theme Settings</h3>
                  <p className="text-sm text-slate-500 mb-3">Configure default themes for tenant stores</p>
                  <button
                    onClick={() => setActiveTab('theme-config')}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600 transition-colors"
                  >
                    Go to Theme Config
                  </button>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="font-semibold text-slate-700 mb-2">Chat Settings</h3>
                  <p className="text-sm text-slate-500 mb-3">Configure chat widgets for tenant stores</p>
                  <button
                    onClick={() => setActiveTab('chat-config')}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600 transition-colors"
                  >
                    Go to Chat Config
                  </button>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="font-semibold text-slate-700 mb-2">Notifications</h3>
                  <p className="text-sm text-slate-500 mb-3">Send notifications to tenant admins</p>
                  <button
                    onClick={() => setActiveTab('notifications')}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600 transition-colors"
                  >
                    Go to Notifications
                  </button>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="font-semibold text-slate-700 mb-2">Platform Settings</h3>
                  <p className="text-sm text-slate-500 mb-3">Configure global platform settings</p>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600 transition-colors"
                  >
                    Go to Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'tutorials':
        return (
          <React.Suspense fallback={<TabLoadingFallback />}>
            <TutorialsTab />
          </React.Suspense>
        );

      case 'apk-builds':
        return (
          <React.Suspense fallback={<TabLoadingFallback />}>
            <ApkBuildsTab
              tenants={tenants}
              onSendNotification={async (tenantId, notification) => {
                // Send notification to specific tenant
                try {
                  const response = await fetch('/api/notifications/broadcast', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      ...notification,
                      targetTenants: [tenantId]
                    })
                  });
                  
                  if (!response.ok) {
                    throw new Error('Failed to send notification');
                  }
                } catch (error) {
                  throw error;
                }
              }}
            />
          </React.Suspense>
        );

      case 'app-requests':
        return (
          <React.Suspense fallback={<TabLoadingFallback />}>
            <AppRequestsTab />
          </React.Suspense>
        );

      case 'ads-management':
        return (
          <React.Suspense fallback={<TabLoadingFallback />}>
            <AdsManagementTab />
          </React.Suspense>
        );

      case 'tenant-features':
        return (
          <React.Suspense fallback={<TabLoadingFallback />}>
            <TenantFeatureControlTab tenants={tenants} />
          </React.Suspense>
        );

      case 'blog':
        return (
          <React.Suspense fallback={<TabLoadingFallback />}>
            <BlogManagementTab />
          </React.Suspense>
        );

          // Is active toggle btn here. 

        case 'new-section':
      return (
        <React.Suspense fallback={<TabLoadingFallback />}>
          <IsActiveTogglebtn 
            tenants={tenants} 
            onSelectTenant={async (tenant: Tenant, action: string) => {
              const statusMap: Record<string, Tenant['status']> = {
                activate: 'active',
                reactivate: 'active',
                suspend: 'suspended',
                block: 'archived',
              };
              const newStatus = statusMap[action] || 'suspended';
              try {
                await handleUpdateTenantStatus(tenant.id || tenant._id || '', newStatus);
              } catch (err) {
                console.error('[SuperAdmin] Tenant status update failed:', err);
              }
            }}
          />
        </React.Suspense>
      );

      default:
        return (
          <React.Suspense fallback={<TabLoadingFallback />}>
            <OverviewTab
              systemStats={systemStats}
              topTenants={topTenants}
              recentActivities={recentActivities}
              onViewAllTenants={() => setActiveTab('tenants')}
              onAddTenant={() => setActiveTab('tenants')}
              onAddUser={() => setActiveTab('tenants')}
              onBroadcast={() => setActiveTab('announcements')}
              onSecurity={() => setActiveTab('system-health')}
              onViewTenant={(tenantId) => {
                // Navigate to tenant detail (tenants tab)
                setActiveTab('tenants');
              }}
              onEditTenant={(tenantId) => {
                // Navigate to tenant edit (tenants tab)
                setActiveTab('tenants');
              }}
            />
          </React.Suspense>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalTenants={systemStats.totalTenants}
      />

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-72' : 'lg:ml-20'} ml-0`}>
        {/* Top Bar */}
        <TopBar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedPeriod={selectedPeriod}
          setSelectedPeriod={setSelectedPeriod}
        />

        {/* Tab Content */}
        {renderTabContent()}
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
