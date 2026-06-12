import React, { useState, useEffect } from 'react';
import { 
  Palette, Moon, Sun, Save, Loader2, RotateCcw, 
  Eye, Building2, Check, Layout, ChevronDown, ChevronUp,
  Smartphone, Monitor, Image as ImageIcon, X
} from 'lucide-react';
import { TenantThemeConfig } from './types';
import { getPrimaryDomain } from '../../utils/appHelpers';

interface ThemeConfigTabProps {
  defaultTheme: TenantThemeConfig;
  onSaveTheme: (theme: TenantThemeConfig) => Promise<void>;
  tenants: { id?: string; _id?: string; name: string; subdomain: string }[];
  onApplyToTenant: (tenantId: string, theme: TenantThemeConfig) => Promise<void>;
  onApplyToAll: (theme: TenantThemeConfig) => Promise<void>;
  onLoadTenantTheme?: (tenantId: string) => Promise<TenantThemeConfig | null>;
}

// Helper to get tenant ID from either id or _id field
const getTenantId = (tenant: { id?: string; _id?: string }): string => {
  return tenant.id || tenant._id || '';
};

type ThemeColorKey = 'primaryColor' | 'secondaryColor' | 'tertiaryColor' | 'fontColor' | 'hoverColor' | 'surfaceColor' | 'adminBgColor' | 'adminInputBgColor' | 'adminBorderColor' | 'adminFocusColor';

type StyleKey = 'headerStyle' | 'mobileHeaderStyle' | 'categorySectionStyle' | 'productCardStyle' | 'footerStyle' | 'bottomNavStyle';

const defaultThemeColors: TenantThemeConfig = {
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
  headerStyle: 'style1',
  mobileHeaderStyle: 'style1',
  categorySectionStyle: 'style5',
  productCardStyle: 'style1',
  footerStyle: 'style1',
  bottomNavStyle: 'style1'
};

const themeColorGuides: Array<{ key: ThemeColorKey; label: string; helper: string }> = [
  { key: 'primaryColor', label: 'Primary Accent', helper: 'Sidebar active state, admin CTAs, storefront hero buttons' },
  { key: 'secondaryColor', label: 'Secondary Accent', helper: 'Warning chips, checkout highlights, floating badges' },
  { key: 'tertiaryColor', label: 'Depth Accent', helper: 'Charts, outlines, subtle gradients' },
  { key: 'fontColor', label: 'Global Font Color', helper: 'Header links, footer text, storefront typography' },
  { key: 'hoverColor', label: 'Hover Accent', helper: 'Header & footer hover states, interactive link highlights' },
  { key: 'surfaceColor', label: 'Surface Glow', helper: 'Footer background wash, elevated cards, wishlist buttons' },
  { key: 'adminBgColor', label: 'Admin Background', helper: 'Admin panel main background color' },
  { key: 'adminInputBgColor', label: 'Admin Input Background', helper: 'Admin input fields, select boxes, text areas background' },
  { key: 'adminBorderColor', label: 'Admin Border Color', helper: 'Admin panel borders, dividers, outlines' },
  { key: 'adminFocusColor', label: 'Admin Focus Color', helper: 'Focus ring color for admin inputs' },
];

// Style sections configuration for storefront customization
const styleSections: Array<{ 
  key: StyleKey; 
  title: string; 
  count: number; 
  hasNone?: boolean;
  description: string;
}> = [
  { key: 'headerStyle', title: 'Header Section', count: 7, description: 'Desktop header layout and style' },
  { key: 'mobileHeaderStyle', title: 'Mobile Header', count: 7, description: 'Mobile header layout and navigation' },
  { key: 'categorySectionStyle', title: 'Category Section', count: 7, hasNone: true, description: 'Category display style on homepage' },
  { key: 'productCardStyle', title: 'Product Card', count: 6, description: 'Product card design and layout' },
  { key: 'footerStyle', title: 'Footer Section', count: 5, description: 'Footer layout and information display' },
  { key: 'bottomNavStyle', title: 'Bottom Navigation', count: 5, description: 'Mobile bottom navigation bar style' }
];

// Demo images for style previews
const THEME_DEMO_IMAGES: Record<string, Record<string, string>> = {
  headerStyle: {
    style1: 'https://hdnfltv.com/image/nitimages/pasted_1771447828354.webp',
    style2: 'https://hdnfltv.com/image/nitimages/header-2.webp',
    style3: 'https://hdnfltv.com/image/nitimages/header-3.webp',
    style4: 'https://hdnfltv.com/image/nitimages/header-4.webp',
    style5: 'https://hdnfltv.com/image/nitimages/header_-_5.webp',
    style6: 'https://hdnfltv.com/image/nitimages/pasted_1771520591605.webp',
    style7: 'https://hdnfltv.com/image/nitimages/Header7.webp',
  },
  mobileHeaderStyle: {
    style1: 'https://hdnfltv.com/image/nitimages/mobile_header_-_1_1768841563.webp',
    style2: 'https://hdnfltv.com/image/nitimages/mobile_header_2.webp',
    style3: 'https://hdnfltv.com/image/nitimages/mobile_header_3.webp',
    style4: 'https://hdnfltv.com/image/nitimages/mobile_header_4.webp',
    style5: 'https://hdnfltv.com/image/nitimages/mobile_header_5.webp',
    style6: 'https://hdnfltv.com/image/nitimages/Mobile_header_6.webp',
    style7: 'https://hdnfltv.com/image/nitimages/Header7.webp',
  },
  categorySectionStyle: {
    none: '',
    style1: 'https://hdnfltv.com/image/nitimages/category_-_1.webp',
    style2: 'https://hdnfltv.com/image/nitimages/category-2.webp',
    style3: 'https://hdnfltv.com/image/nitimages/category_-_3.webp',
    style4: 'https://hdnfltv.com/image/nitimages/category_-_4.webp',
    style5: 'https://hdnfltv.com/image/nitimages/category-5.webp',
    style6: 'https://hdnfltv.com/image/nitimages/category-5.webp',
    style7: 'https://hdnfltv.com/image/nitimages/category-5.webp',
  },
  productCardStyle: {
    style1: 'https://hdnfltv.com/image/nitimages/product_card_-_1.webp',
    style2: 'https://hdnfltv.com/image/nitimages/pasted_1772910489898.webp',
    style3: 'https://hdnfltv.com/image/nitimages/product_card_-_3.webp',
    style4: 'https://hdnfltv.com/image/nitimages/product_card_-_4.webp',
    style5: 'https://hdnfltv.com/image/nitimages/product_card_-_5.webp',
    style6: 'https://hdnfltv.com/image/nitimages/Product_card_style6.webp',
  },
  footerStyle: {
    style1: 'https://hdnfltv.com/image/nitimages/pasted_1773259417132.webp',
    style2: 'https://hdnfltv.com/image/nitimages/footer_-_2.webp',
    style3: 'https://hdnfltv.com/image/nitimages/footer_-3.webp',
    style4: 'https://hdnfltv.com/image/nitimages/footer_-4_orginal.webp',
    style5: 'https://hdnfltv.com/image/nitimages/footer_5_1768901505.webp',
  },
  bottomNavStyle: {
    style1: 'https://hdnfltv.com/image/nitimages/bottomNav-1.webp',
    style2: 'https://hdnfltv.com/image/nitimages/bottomNav-2.webp',
    style3: 'https://hdnfltv.com/image/nitimages/bottomNav-3.webp',
    style4: 'https://hdnfltv.com/image/nitimages/bottomNav_4.webp',
    style5: 'https://hdnfltv.com/image/nitimages/bottomNav-5.webp',
  },
};

const ThemeConfigTab: React.FC<ThemeConfigTabProps> = ({
  defaultTheme,
  onSaveTheme,
  tenants,
  onApplyToTenant,
  onApplyToAll,
  onLoadTenantTheme
}) => {
  const [theme, setTheme] = useState<TenantThemeConfig>(defaultTheme || defaultThemeColors);
  const [isSaving, setIsSaving] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [isLoadingTenantTheme, setIsLoadingTenantTheme] = useState(false);
  const [showTenantSelector, setShowTenantSelector] = useState(false);
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState<'colors' | 'styles'>('colors');
  const [expandedStyleSection, setExpandedStyleSection] = useState<string | null>(null);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoImage, setDemoImage] = useState<string>('');
  const [demoTitle, setDemoTitle] = useState<string>('');
  const [demoImageError, setDemoImageError] = useState(false);

  // Load tenant-specific theme when a tenant is selected
  useEffect(() => {
    const loadTenantTheme = async () => {
      if (selectedTenant && onLoadTenantTheme) {
        setIsLoadingTenantTheme(true);
        try {
          const tenantTheme = await onLoadTenantTheme(selectedTenant);
          if (tenantTheme) {
            setTheme({ ...defaultThemeColors, ...tenantTheme });
          }
        } catch (error) {
          console.error('Failed to load tenant theme:', error);
        } finally {
          setIsLoadingTenantTheme(false);
        }
      }
    };
    loadTenantTheme();
  }, [selectedTenant, onLoadTenantTheme]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveTheme(theme);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyToSelected = async () => {
    if (selectedTenants.length === 0) return;
    setIsApplying(true);
    try {
      for (const tenantId of selectedTenants) {
        await onApplyToTenant(tenantId, theme);
      }
      setSelectedTenants([]);
      setShowTenantSelector(false);
    } finally {
      setIsApplying(false);
    }
  };

  const handleApplyToSingleTenant = async () => {
    if (!selectedTenant) return;
    setIsApplying(true);
    try {
      await onApplyToTenant(selectedTenant, theme);
    } finally {
      setIsApplying(false);
    }
  };

  const handleApplyToAll = async () => {
    setIsApplying(true);
    try {
      await onApplyToAll(theme);
    } finally {
      setIsApplying(false);
    }
  };

  const handleReset = () => {
    setTheme(defaultThemeColors);
    setSelectedTenant('');
  };

  const updateColor = (key: ThemeColorKey, value: string) => {
    setTheme(prev => ({ ...prev, [key]: value }));
  };

  const updateStyle = (key: StyleKey, value: string) => {
    setTheme(prev => ({ ...prev, [key]: value }));
  };

  const handleShowDemo = (sectionKey: string, styleValue: string, sectionTitle: string): void => {
    const sectionDemos = THEME_DEMO_IMAGES[sectionKey];
    if (sectionDemos) {
      const imageUrl = sectionDemos[styleValue];
      
      setDemoImageError(false);
      
      if (styleValue === 'none' || !imageUrl) {
        setDemoImage('');
      } else {
        setDemoImage(imageUrl);
      }
      
      const styleLabel = styleValue === 'none' ? 'None' : `Style ${styleValue.replace('style', '')}`;
      setDemoTitle(`${sectionTitle} - ${styleLabel}`);
      setDemoModalOpen(true);
    }
  };

  const getSelectedTenantDisplayName = () => {
    const tenant = tenants.find(t => getTenantId(t) === selectedTenant);
    return tenant?.name || 'Select Tenant';
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Tenant Theme Configuration</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Configure theme colors and storefront styles for specific tenants</p>
        </div>
        
        {/* Tenant Selector */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-shrink-0">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900 text-sm">Configure for Tenant:</span>
            </div>
            <select
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
              className="flex-1 px-3 py-2 border border-blue-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Default (All Tenants) --</option>
              {tenants.map(tenant => (
                <option key={getTenantId(tenant)} value={getTenantId(tenant)}>
                  {tenant.name} ({tenant.subdomain})
                </option>
              ))}
            </select>
            {isLoadingTenantTheme && (
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            )}
          </div>
          {selectedTenant && (
            <p className="text-xs text-blue-700 mt-2">
              ✓ Editing theme for: <strong>{getSelectedTenantDisplayName()}</strong>. Changes will only apply to this tenant's store.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 sm:gap-3">
          <button
            onClick={handleReset}
            className="px-3 sm:px-4 py-2 sm:py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-sm border border-slate-200"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          {selectedTenant ? (
            <button
              onClick={handleApplyToSingleTenant}
              disabled={isApplying || isSaving}
              className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors text-sm flex-1 xs:flex-none"
            >
              {isApplying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span className="hidden sm:inline">Apply to {getSelectedTenantDisplayName()}</span>
              <span className="sm:hidden">Apply</span>
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-[#38BDF8] to-[#1E90FF] hover:from-[#2BAEE8] hover:to-[#1A7FE8] text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors text-sm flex-1 xs:flex-none"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span className="hidden sm:inline">Save Default Theme</span>
              <span className="sm:hidden">Save</span>
            </button>
          )}
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-xl">
        <button
          onClick={() => setActiveSection('colors')}
          className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
            activeSection === 'colors'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Palette className="w-4 h-4" />
          Theme Colors
        </button>
        <button
          onClick={() => setActiveSection('styles')}
          className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
            activeSection === 'styles'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layout className="w-4 h-4" />
          Storefront Styles
        </button>
      </div>

      {activeSection === 'colors' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Theme Colors */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Theme Colors</h3>
                  <p className="text-xs sm:text-sm text-slate-500 truncate">
                    {selectedTenant ? `Customize colors for ${getSelectedTenantDisplayName()}` : 'Customize default storefront and admin colors'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {themeColorGuides.map((field) => (
                  <div key={field.key} className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 border border-slate-200 rounded-lg sm:rounded-xl">
                    <input
                      type="color"
                      value={theme[field.key] || defaultThemeColors[field.key]}
                      onChange={(e) => updateColor(field.key, e.target.value)}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg border border-slate-200 cursor-pointer flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-slate-700 truncate">{field.label}</p>
                      <p className="text-xs text-slate-500 truncate hidden xs:block">{field.helper}</p>
                      <input
                        type="text"
                        value={theme[field.key] || ''}
                        onChange={(e) => updateColor(field.key, e.target.value)}
                        className="mt-1 w-full px-2 py-1 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Dark Mode Toggle */}
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    {theme.darkMode ? <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 flex-shrink-0" /> : <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 flex-shrink-0" />}
                    <div className="min-w-0">
                      <p className="font-medium text-slate-700 text-sm sm:text-base">Dark Mode</p>
                      <p className="text-xs sm:text-sm text-slate-500 truncate">Enable dark mode for admin panel</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setTheme(prev => ({ ...prev, darkMode: !prev.darkMode }))}
                    className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${theme.darkMode ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${theme.darkMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Preview & Apply */}
          <div className="space-y-4">
            {/* Preview */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 flex-shrink-0" />
                <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Color Preview</h3>
              </div>
              <div 
                className="rounded-lg sm:rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-3"
                style={{ backgroundColor: theme.surfaceColor }}
              >
                <div 
                  className="h-8 sm:h-10 rounded-lg flex items-center px-3 text-xs sm:text-sm font-medium"
                  style={{ backgroundColor: theme.primaryColor, color: '#fff' }}
                >
                  Primary Button
                </div>
                <div 
                  className="h-8 sm:h-10 rounded-lg flex items-center px-3 text-xs sm:text-sm font-medium"
                  style={{ backgroundColor: theme.secondaryColor, color: '#fff' }}
                >
                  Secondary Button
                </div>
                <div 
                  className="h-8 sm:h-10 rounded-lg flex items-center px-3 text-xs sm:text-sm border"
                  style={{ 
                    borderColor: theme.tertiaryColor, 
                    color: theme.fontColor,
                    backgroundColor: '#fff'
                  }}
                >
                  Outlined Element
                </div>
                <p className="text-xs sm:text-sm" style={{ color: theme.fontColor }}>
                  Sample text with font color
                </p>
                <p 
                  className="text-xs sm:text-sm cursor-pointer"
                  style={{ color: theme.hoverColor }}
                >
                  Hover accent text →
                </p>
              </div>
            </div>

            {/* Apply to Multiple Tenants */}
            {!selectedTenant && (
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 flex-shrink-0" />
                  <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Bulk Apply</h3>
                </div>
                
                <div className="space-y-2 sm:space-y-3">
                  <button
                    onClick={handleApplyToAll}
                    disabled={isApplying}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-[#38BDF8] to-[#1E90FF] hover:from-[#2BAEE8] hover:to-[#1A7FE8] text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors text-xs sm:text-sm"
                  >
                    {isApplying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Apply to All Tenants
                  </button>
                  
                  <button
                    onClick={() => setShowTenantSelector(!showTenantSelector)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors text-xs sm:text-sm flex items-center justify-center gap-2"
                  >
                    {showTenantSelector ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    Select Multiple Tenants
                  </button>

                  {showTenantSelector && (
                    <div className="mt-2 sm:mt-3 max-h-40 sm:max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                      {tenants.map(tenant => (
                        <label 
                          key={getTenantId(tenant)} 
                          className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTenants.includes(getTenantId(tenant))}
                            onChange={(e) => {
                              const tenantId = getTenantId(tenant);
                              setSelectedTenants(prev => 
                                e.target.checked 
                                  ? [...prev, tenantId]
                                  : prev.filter(id => id !== tenantId)
                              );
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-medium text-slate-700 truncate">{tenant.name}</p>
                            <p className="text-xs text-slate-500 truncate">{tenant.subdomain}.{getPrimaryDomain()}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  {selectedTenants.length > 0 && (
                    <button
                      onClick={handleApplyToSelected}
                      disabled={isApplying}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors text-xs sm:text-sm"
                    >
                      {isApplying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Apply to {selectedTenants.length} Tenant(s)
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Storefront Styles Section */
        <div className="space-y-4">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Layout className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Storefront Component Styles</h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  {selectedTenant 
                    ? `Configure storefront layout styles for ${getSelectedTenantDisplayName()}`
                    : 'Set default storefront component styles for all tenants'
                  }
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {styleSections.map(section => (
                <div key={section.key} className="border border-slate-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedStyleSection(expandedStyleSection === section.key ? null : section.key)}
                    className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {section.key.includes('mobile') || section.key.includes('bottom') ? (
                        <Smartphone className="w-4 h-4 text-slate-500" />
                      ) : (
                        <Monitor className="w-4 h-4 text-slate-500" />
                      )}
                      <div className="text-left">
                        <p className="font-medium text-slate-700 text-sm">{section.title}</p>
                        <p className="text-xs text-slate-500">{section.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                        {theme[section.key] || 'style1'}
                      </span>
                      {expandedStyleSection === section.key ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {expandedStyleSection === section.key && (
                    <div className="p-4 space-y-2 bg-white">
                      {section.hasNone && (
                        <div 
                          className={`border rounded-lg p-3 flex items-center justify-between cursor-pointer transition-all ${
                            !theme[section.key] || theme[section.key] === 'none' 
                              ? 'border-emerald-500 bg-emerald-50' 
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                          onClick={() => updateStyle(section.key, 'none')}
                        >
                          <div className="flex items-center gap-3">
                            <input 
                              type="radio" 
                              checked={!theme[section.key] || theme[section.key] === 'none'}
                              onChange={() => updateStyle(section.key, 'none')}
                              className="w-4 h-4 text-emerald-600"
                            />
                            <span className="font-medium text-slate-700 text-sm">None (Hidden)</span>
                          </div>
                        </div>
                      )}
                      
                      {Array.from({ length: section.count }).map((_, i) => {
                        const styleValue = `style${i + 1}`;
                        const isSelected = theme[section.key] === styleValue || (!theme[section.key] && !section.hasNone && i === 0);
                        
                        return (
                          <div 
                            key={styleValue}
                            className={`border rounded-lg p-3 flex items-center justify-between cursor-pointer transition-all ${
                              isSelected 
                                ? 'border-emerald-500 bg-emerald-50' 
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                            onClick={() => updateStyle(section.key, styleValue)}
                          >
                            <div className="flex items-center gap-3">
                              <input 
                                type="radio" 
                                checked={isSelected}
                                onChange={() => updateStyle(section.key, styleValue)}
                                className="w-4 h-4 text-emerald-600"
                              />
                              <span className="font-medium text-slate-700 text-sm">Style {i + 1}</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShowDemo(section.key, styleValue, section.title);
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              Preview
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Style Summary */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
            <h4 className="font-semibold text-slate-900 text-sm mb-4">Current Style Configuration</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {styleSections.map(section => (
                <div key={section.key} className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">{section.title}</p>
                  <p className="font-medium text-slate-700 text-sm mt-1">
                    {theme[section.key] === 'none' ? 'Hidden' : (theme[section.key] || 'Style 1').replace('style', 'Style ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Demo Preview Modal */}
      {demoModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 md:p-6" 
          onClick={() => setDemoModalOpen(false)}
        >
          <div 
            className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-4xl lg:max-w-5xl overflow-hidden" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-3 sm:p-4 border-b bg-gradient-to-r from-emerald-50 to-green-50 flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base md:text-lg truncate">{demoTitle}</h3>
                  <p className="text-xs text-slate-500 hidden sm:block">Preview how this style will look on the storefront</p>
                </div>
              </div>
              <button 
                onClick={() => setDemoModalOpen(false)} 
                className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-3 sm:p-4 md:p-6 max-h-[60vh] sm:max-h-[70vh] md:max-h-[75vh] overflow-y-auto bg-slate-50">
              {demoImage && !demoImageError ? (
                <div className="relative">
                  <div className="flex justify-center gap-2 mb-3 sm:mb-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-full text-xs text-slate-500 border shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      Live Preview
                    </span>
                  </div>
                  
                  <div className="relative rounded-lg sm:rounded-xl overflow-hidden shadow-lg border border-slate-200 bg-white">
                    <img 
                      src={demoImage} 
                      alt={demoTitle}
                      loading="lazy"
                      className="w-full h-auto object-contain max-h-[50vh] sm:max-h-[60vh] md:max-h-[65vh]"
                      onError={() => setDemoImageError(true)}
                    />
                  </div>
                </div>
              ) : demoImageError ? (
                <div className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-20 text-slate-400">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-50 flex items-center justify-center mb-4">
                    <ImageIcon className="w-8 h-8 sm:w-10 sm:h-10 opacity-50 text-red-400" />
                  </div>
                  <p className="text-sm sm:text-base font-medium text-red-500">Failed to load preview image</p>
                  <p className="text-xs sm:text-sm mt-1">Please try again later</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-20 text-slate-400">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <ImageIcon className="w-8 h-8 sm:w-10 sm:h-10 opacity-50" />
                  </div>
                  <p className="text-sm sm:text-base font-medium">No preview available</p>
                  <p className="text-xs sm:text-sm mt-1">This section is hidden</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t bg-white flex justify-end sticky bottom-0">
              <button 
                onClick={() => setDemoModalOpen(false)}
                className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg font-bold hover:from-emerald-700 hover:to-green-700 transition-all shadow-sm text-sm sm:text-base"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeConfigTab;
