import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Save, ToggleLeft, ToggleRight, Crown, Building2, Check,
  AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Shield
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAuthHeader } from '../../services/authService';
import { getApiUrl } from '../../utils/appHelpers';
import type { Tenant } from '../../types';
import type { SectionAccessConfig, TenantFeaturesConfig, DashboardSectionDef } from './types';

/**
 * All tenant dashboard sections that can be controlled by super admin.
 * Grouped by category for better UX.
 */
const DASHBOARD_SECTIONS: DashboardSectionDef[] = [
  // Core
  { key: 'dashboard', label: 'Dashboard', description: 'Main dashboard overview page', category: 'Core' },
  { key: 'orders', label: 'Orders', description: 'Order management and processing', category: 'Core' },
  { key: 'products', label: 'Products', description: 'Product listing and management', category: 'Core' },
  { key: 'product-upload', label: 'Product Upload', description: 'Add/edit product forms', category: 'Core' },
  { key: 'inventory', label: 'Inventory', description: 'Inventory tracking and management', category: 'Core' },
  { key: 'customers_reviews', label: 'Customers & Reviews', description: 'Customer management and reviews', category: 'Core' },

  // Sales & Finance
  { key: 'business_report', label: 'Business Reports', description: 'Sales reports, profit/loss, analytics', category: 'Sales & Finance' },
  { key: 'expenses', label: 'Expenses', description: 'Expense tracking', category: 'Sales & Finance' },
  { key: 'income', label: 'Income', description: 'Income tracking', category: 'Sales & Finance' },
  { key: 'due_list', label: 'Due List', description: 'Due payments list', category: 'Sales & Finance' },
  { key: 'due_book', label: 'Due Book', description: 'Due book management', category: 'Sales & Finance' },
  { key: 'billing', label: 'Billing', description: 'Subscription billing and invoices', category: 'Sales & Finance' },
  { key: 'daily_target', label: 'Daily Target', description: 'Daily sales target setting', category: 'Sales & Finance' },

  // Marketing & Content
  { key: 'sms_marketing', label: 'SMS Marketing', description: 'SMS campaigns and marketing', category: 'Marketing & Content' },
  { key: 'landing_pages', label: 'Landing Pages', description: 'Create and manage landing pages', category: 'Marketing & Content' },
  { key: 'popups', label: 'Popups', description: 'Popup management', category: 'Marketing & Content' },
  { key: 'website_content', label: 'Website Content', description: 'Website content management (carousel, banners, etc.)', category: 'Marketing & Content' },

  // Store Management
  { key: 'manage_shop', label: 'Manage Shop', description: 'Store setup and management', category: 'Store Management' },
  { key: 'store_studio', label: 'Store Studio', description: 'Visual store builder', category: 'Store Management' },
  { key: 'customization', label: 'Customization', description: 'Theme and appearance customization', category: 'Store Management' },
  { key: 'catalog', label: 'Catalog', description: 'Categories, brands, and tags management', category: 'Store Management' },

  // Media & Design
  { key: 'product-media', label: 'Product Media Center', description: 'Product image and media management', category: 'Media & Design' },
  { key: 'gallery', label: 'Gallery', description: 'Image gallery', category: 'Media & Design' },
  { key: 'figma', label: 'Figma Integration', description: 'Figma design integration', category: 'Media & Design' },

  // Settings & Configuration
  { key: 'settings', label: 'Settings', description: 'General store settings', category: 'Settings' },
  { key: 'settings_delivery', label: 'Delivery Settings', description: 'Delivery configuration', category: 'Settings' },
  { key: 'settings_payment', label: 'Payment Settings', description: 'Payment gateway configuration', category: 'Settings' },
  { key: 'settings_courier', label: 'Courier Settings', description: 'Courier integration setup', category: 'Settings' },
  { key: 'settings_marketing', label: 'Marketing Integrations', description: 'Marketing tools integration', category: 'Settings' },
  { key: 'settings_facebook_pixel', label: 'Facebook Pixel', description: 'Facebook Pixel tracking setup', category: 'Settings' },
  { key: 'settings_gtm', label: 'Google Tag Manager', description: 'GTM integration', category: 'Settings' },
  { key: 'settings_domain', label: 'Custom Domain', description: 'Custom domain configuration', category: 'Settings' },
  { key: 'settings_google_console', label: 'Google Search Console', description: 'Google Search Console integration', category: 'Settings' },
  { key: 'settings_rewards', label: 'Reward Points', description: 'Reward point system settings', category: 'Settings' },

  // Administration
  { key: 'admin_control', label: 'Access Control', description: 'User roles and permissions management', category: 'Administration' },
  { key: 'activity_log', label: 'Activity Log', description: 'Audit trail and activity history', category: 'Administration' },
  { key: 'support', label: 'Support', description: 'Support ticket system', category: 'Administration' },
  { key: 'tutorial', label: 'Tutorials', description: 'Help and tutorial resources', category: 'Administration' },
];

/** Get unique categories from section definitions */
const CATEGORIES = [...new Set(DASHBOARD_SECTIONS.map(s => s.category))];

interface TenantFeatureControlTabProps {
  tenants: Tenant[];
}

const API_BASE_URL = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_BASE_URL || '') : '';

const TenantFeatureControlTab: React.FC<TenantFeatureControlTabProps> = ({ tenants }) => {
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [tenantSearch, setTenantSearch] = useState('');
  const [sectionsConfig, setSectionsConfig] = useState<Record<string, SectionAccessConfig>>({});
  const [originalConfig, setOriginalConfig] = useState<Record<string, SectionAccessConfig>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize default config where everything is enabled and not premium
  const getDefaultConfig = useCallback((): Record<string, SectionAccessConfig> => {
    const config: Record<string, SectionAccessConfig> = {};
    DASHBOARD_SECTIONS.forEach(section => {
      config[section.key] = { enabled: true, premium: false };
    });
    return config;
  }, []);

  // Load tenant features from API
  const loadTenantFeatures = useCallback(async (tenantId: string) => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/tenant-features/${tenantId}`, {
        headers: getAuthHeader(),
      });
      if (!response.ok) throw new Error('Failed to load tenant features');
      const result = await response.json();
      const config = result.data?.sections || {};

      // Merge with defaults (new sections get enabled by default)
      const defaultConfig = getDefaultConfig();
      const mergedConfig: Record<string, SectionAccessConfig> = {};
      DASHBOARD_SECTIONS.forEach(section => {
        mergedConfig[section.key] = config[section.key] || defaultConfig[section.key];
      });

      setSectionsConfig(mergedConfig);
      setOriginalConfig(mergedConfig);
      setHasChanges(false);
    } catch (error) {
      console.error('[TenantFeatureControl] Failed to load:', error);
      toast.error('Failed to load tenant features');
      const defaultConfig = getDefaultConfig();
      setSectionsConfig(defaultConfig);
      setOriginalConfig(defaultConfig);
    } finally {
      setLoading(false);
    }
  }, [getDefaultConfig]);

  // Save tenant features to API
  const saveTenantFeatures = useCallback(async () => {
    if (!selectedTenantId) return;
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/tenant-features/${selectedTenantId}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify({ sections: sectionsConfig }),
      });
      if (!response.ok) throw new Error('Failed to save tenant features');
      setOriginalConfig({ ...sectionsConfig });
      setHasChanges(false);
      toast.success('Tenant features saved successfully');
    } catch (error) {
      console.error('[TenantFeatureControl] Failed to save:', error);
      toast.error('Failed to save tenant features');
    } finally {
      setSaving(false);
    }
  }, [selectedTenantId, sectionsConfig]);

  // Detect changes
  useEffect(() => {
    const changed = JSON.stringify(sectionsConfig) !== JSON.stringify(originalConfig);
    setHasChanges(changed);
  }, [sectionsConfig, originalConfig]);

  // Load features when tenant is selected
  useEffect(() => {
    if (selectedTenantId) {
      loadTenantFeatures(selectedTenantId);
    }
  }, [selectedTenantId, loadTenantFeatures]);

  // Toggle section enabled/disabled
  const toggleEnabled = (sectionKey: string) => {
    setSectionsConfig(prev => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        enabled: !prev[sectionKey]?.enabled,
        // If disabling, also remove premium flag
        premium: !prev[sectionKey]?.enabled ? false : prev[sectionKey]?.premium,
      },
    }));
  };

  // Toggle section premium status
  const togglePremium = (sectionKey: string) => {
    setSectionsConfig(prev => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        // Enable the section if marking as premium
        enabled: true,
        premium: !prev[sectionKey]?.premium,
      },
    }));
  };

  // Bulk operations
  const enableAll = () => {
    const config: Record<string, SectionAccessConfig> = {};
    DASHBOARD_SECTIONS.forEach(section => {
      config[section.key] = { enabled: true, premium: false };
    });
    setSectionsConfig(config);
  };

  const disableAll = () => {
    const config: Record<string, SectionAccessConfig> = {};
    DASHBOARD_SECTIONS.forEach(section => {
      // Dashboard is always enabled
      if (section.key === 'dashboard') {
        config[section.key] = { enabled: true, premium: false };
      } else {
        config[section.key] = { enabled: false, premium: false };
      }
    });
    setSectionsConfig(config);
  };

  const toggleCategoryCollapse = (category: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // Toggle all sections in a category
  const toggleCategory = (category: string, enable: boolean) => {
    setSectionsConfig(prev => {
      const updated = { ...prev };
      DASHBOARD_SECTIONS.filter(s => s.category === category).forEach(section => {
        if (section.key === 'dashboard' && !enable) return; // Dashboard always enabled
        updated[section.key] = { ...updated[section.key], enabled: enable, premium: enable ? updated[section.key]?.premium : false };
      });
      return updated;
    });
  };

  const filteredTenants = tenants.filter(t =>
    !tenantSearch ||
    t.name?.toLowerCase().includes(tenantSearch.toLowerCase()) ||
    t.subdomain?.toLowerCase().includes(tenantSearch.toLowerCase())
  );

  const selectedTenant = tenants.find(t => (t.id || t._id) === selectedTenantId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Tenant Feature Control</h2>
          <p className="text-sm text-slate-500 mt-1">
            Enable, disable, or set sections to premium for each tenant&apos;s dashboard
          </p>
        </div>
        {selectedTenantId && hasChanges && (
          <button
            onClick={saveTenantFeatures}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      {/* Tenant Selector */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-slate-900">Select Tenant</h3>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={tenantSearch}
            onChange={e => setTenantSearch(e.target.value)}
            placeholder="Search tenants by name or subdomain..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
          {filteredTenants.map(tenant => {
            const id = tenant.id || tenant._id || '';
            const isSelected = id === selectedTenantId;
            return (
              <button
                key={id}
                onClick={() => setSelectedTenantId(id)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
                    : 'bg-white border-slate-200 hover:border-blue-200 hover:bg-blue-50/50'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tenant.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{tenant.name}</p>
                  <p className="text-xs text-slate-500 truncate">{tenant.subdomain}</p>
                </div>
                {isSelected && <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feature Controls */}
      {selectedTenantId && (
        <>
          {/* Selected Tenant Info + Bulk Actions */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
                  {selectedTenant?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{selectedTenant?.name}</p>
                  <p className="text-xs text-slate-500">{selectedTenant?.subdomain} · {selectedTenant?.status}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={enableAll}
                  className="px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  Enable All
                </button>
                <button
                  onClick={disableAll}
                  className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Disable All
                </button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
              <span className="ml-3 text-slate-600">Loading feature configuration...</span>
            </div>
          ) : (
            /* Section Categories */
            <div className="space-y-4">
              {CATEGORIES.map(category => {
                const categorySections = DASHBOARD_SECTIONS.filter(s => s.category === category);
                const isCollapsed = collapsedCategories.has(category);
                const enabledCount = categorySections.filter(s => sectionsConfig[s.key]?.enabled).length;
                const premiumCount = categorySections.filter(s => sectionsConfig[s.key]?.premium).length;

                return (
                  <div key={category} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Category Header */}
                    <div
                      className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => toggleCategoryCollapse(category)}
                    >
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-slate-900">{category}</h3>
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {enabledCount}/{categorySections.length} enabled
                        </span>
                        {premiumCount > 0 && (
                          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Crown className="w-3 h-3" />
                            {premiumCount} premium
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleCategory(category, true); }}
                          className="text-[10px] px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md hover:bg-emerald-100"
                        >
                          All On
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleCategory(category, false); }}
                          className="text-[10px] px-2 py-1 bg-red-50 text-red-600 rounded-md hover:bg-red-100"
                        >
                          All Off
                        </button>
                        {isCollapsed ? (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Section Items */}
                    {!isCollapsed && (
                      <div className="border-t border-slate-100 divide-y divide-slate-100">
                        {categorySections.map(section => {
                          const config = sectionsConfig[section.key] || { enabled: true, premium: false };
                          const isDashboard = section.key === 'dashboard';

                          return (
                            <div
                              key={section.key}
                              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:px-5 transition-colors ${
                                !config.enabled ? 'bg-slate-50/50' : config.premium ? 'bg-amber-50/30' : ''
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className={`text-sm font-medium ${config.enabled ? 'text-slate-900' : 'text-slate-400'}`}>
                                    {section.label}
                                  </p>
                                  {config.premium && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold">
                                      <Crown className="w-2.5 h-2.5" /> PREMIUM
                                    </span>
                                  )}
                                  {!config.enabled && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[10px] font-bold">
                                      DISABLED
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">{section.description}</p>
                              </div>

                              <div className="flex items-center gap-3 flex-shrink-0">
                                {/* Premium Toggle */}
                                <button
                                  onClick={() => togglePremium(section.key)}
                                  disabled={isDashboard}
                                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    config.premium
                                      ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                      : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200'
                                  } ${isDashboard ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  title={isDashboard ? 'Dashboard cannot be set to premium' : config.premium ? 'Remove premium requirement' : 'Set as premium (requires upgrade)'}
                                >
                                  <Crown className="w-3 h-3" />
                                  {config.premium ? 'Premium' : 'Set Premium'}
                                </button>

                                {/* Enable/Disable Toggle */}
                                <button
                                  onClick={() => toggleEnabled(section.key)}
                                  disabled={isDashboard}
                                  className={`relative flex items-center ${isDashboard ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                  title={isDashboard ? 'Dashboard is always enabled' : config.enabled ? 'Disable this section' : 'Enable this section'}
                                >
                                  {config.enabled ? (
                                    <ToggleRight className="w-10 h-6 text-emerald-500" />
                                  ) : (
                                    <ToggleLeft className="w-10 h-6 text-slate-300" />
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              Feature Control Guide
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                <ToggleRight className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-emerald-800">Enabled</p>
                  <p className="text-xs text-emerald-600 mt-0.5">Section is fully accessible to the tenant</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-100">
                <ToggleLeft className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Disabled</p>
                  <p className="text-xs text-red-600 mt-0.5">Section is completely hidden from the tenant</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
                <Crown className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Premium</p>
                  <p className="text-xs text-amber-600 mt-0.5">Section shows an upgrade prompt when accessed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Unsaved Changes Warning */}
          {hasChanges && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-300" />
              <span className="text-sm font-medium">You have unsaved changes</span>
              <button
                onClick={saveTenantFeatures}
                disabled={saving}
                className="px-4 py-1.5 bg-white text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Now'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!selectedTenantId && (
        <div className="text-center py-16">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">Select a Tenant</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Choose a tenant above to configure which dashboard sections they can access,
            and which sections require a premium subscription upgrade.
          </p>
        </div>
      )}
    </div>
  );
};

export default TenantFeatureControlTab;
