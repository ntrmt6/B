import React, { useState, useRef, useEffect } from 'react';
import {
  Save,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ThemeConfig, WebsiteConfig, Product } from '../types';
import { DataService } from '../services/DataService';
import {
  isBase64Image,
  convertBase64ToUploadedUrl
} from '../services/imageUploadService';

// Import refactored components
import {
  AdminCustomizationProps,
  ColorKey,
  DEFAULT_COLORS,
  DEFAULT_WEBSITE_CONFIG,
  ThemeViewTab,
  ThemeColorsTab,
  CustomThemeSections
} from '../components/AdminCustomization';
import { useDarkMode } from '../context/DarkModeContext';

// ============================================================================
// Main Component
// ============================================================================

const AdminCustomization: React.FC<AdminCustomizationProps> = ({
  tenantId,
  tenantSubdomain,
  logo,
  onUpdateLogo,
  themeConfig,
  onUpdateTheme,
  websiteConfig,
  onUpdateWebsiteConfig,
  initialTab = 'website_info',
  products = []
}) => {
  // ---------------------------------------------------------------------------
  // Tab State
  // ---------------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState(initialTab === 'theme_view' || initialTab === 'theme_colors' ? initialTab : 'theme_view');

  // ---------------------------------------------------------------------------
  // Website Configuration State
  // ---------------------------------------------------------------------------
  const [websiteConfiguration, setWebsiteConfiguration] = useState<WebsiteConfig>(
    () => (websiteConfig ? { ...DEFAULT_WEBSITE_CONFIG, ...websiteConfig } : DEFAULT_WEBSITE_CONFIG)
  );

  // ---------------------------------------------------------------------------
  // Theme Colors State
  // ---------------------------------------------------------------------------
  const [themeColors, setThemeColors] = useState({ ...DEFAULT_COLORS });
  const { isDarkMode: isDark } = useDarkMode();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // ---------------------------------------------------------------------------
  // Save State
  // ---------------------------------------------------------------------------
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ---------------------------------------------------------------------------
  // Refs for State Management
  // ---------------------------------------------------------------------------
  const prevTenantIdRef = useRef<string>(tenantId);
  const hasLoadedInitialConfig = useRef(false);
  const hasUnsavedChangesRef = useRef(false);
  const prevWebsiteConfigRef = useRef<WebsiteConfig | null>(null);
  const isSavingRef = useRef(false);
  const lastSaveTimestampRef = useRef<number>(0);
  const SAVE_PROTECTION_MS = 3000;

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  // Simulate initial loading state for better UX
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // Sync active activeTab with initialTab prop
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Expose unsaved changes flag getter function to prevent data refresh overwrites
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__getAdminCustomizationUnsavedChanges = () => {
        const timeSinceLastSave = Date.now() - lastSaveTimestampRef.current;
        const isWithinProtectionWindow = timeSinceLastSave < SAVE_PROTECTION_MS;
        if (isWithinProtectionWindow) {
          console.log('[AdminCustomization] Within save protection window, blocking refresh');
          return true;
        }
        return hasUnsavedChangesRef.current;
      };
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).__getAdminCustomizationUnsavedChanges;
      }
    };
  }, []);

  useEffect(() => {
    // Skip if we're currently saving - this prevents the loop
    if (isSavingRef.current) {
      return;
    }
    
    // On tenant change, reload config from prop
    if (prevTenantIdRef.current !== tenantId) {
      console.log('[AdminCustomization] Tenant changed, reloading config');
      prevTenantIdRef.current = tenantId;
      hasLoadedInitialConfig.current = false;
      hasUnsavedChangesRef.current = false;
      
      if (websiteConfig) {
        setWebsiteConfiguration({
          ...DEFAULT_WEBSITE_CONFIG,
          ...websiteConfig,
          addresses: websiteConfig.addresses || [],
          emails: websiteConfig.emails || [],
          phones: websiteConfig.phones || [],
          socialLinks: websiteConfig.socialLinks || [],
          footerQuickLinks: websiteConfig.footerQuickLinks || [],
          footerUsefulLinks: websiteConfig.footerUsefulLinks || [],
          showFlashSaleCounter: websiteConfig.showFlashSaleCounter ?? true,
          headerLogo: websiteConfig.headerLogo ?? null,
          footerLogo: websiteConfig.footerLogo ?? null,
          campaigns: websiteConfig.campaigns || [],
          carouselItems: websiteConfig.carouselItems || [],
          popups: websiteConfig.popups || [],
          categorySectionStyle: websiteConfig.categorySectionStyle || DEFAULT_WEBSITE_CONFIG.categorySectionStyle
        });
        hasLoadedInitialConfig.current = true;
      }
    } 
    // Initial load if not yet loaded
    else if (!hasLoadedInitialConfig.current && websiteConfig) {
      console.log('[AdminCustomization] Initial config load');
      setWebsiteConfiguration({
        ...DEFAULT_WEBSITE_CONFIG,
        ...websiteConfig,
        addresses: websiteConfig.addresses || [],
        emails: websiteConfig.emails || [],
        phones: websiteConfig.phones || [],
        socialLinks: websiteConfig.socialLinks || [],
        footerQuickLinks: websiteConfig.footerQuickLinks || [],
        footerUsefulLinks: websiteConfig.footerUsefulLinks || [],
        showFlashSaleCounter: websiteConfig.showFlashSaleCounter ?? true,
        headerLogo: websiteConfig.headerLogo ?? null,
        footerLogo: websiteConfig.footerLogo ?? null,
        campaigns: websiteConfig.campaigns || [],
        carouselItems: websiteConfig.carouselItems || [],
        popups: websiteConfig.popups || [],
        categorySectionStyle: websiteConfig.categorySectionStyle || DEFAULT_WEBSITE_CONFIG.categorySectionStyle
      });
      hasLoadedInitialConfig.current = true;
      hasUnsavedChangesRef.current = false;
    }
  }, [tenantId, websiteConfig]);

  // Track local changes to mark as unsaved
  useEffect(() => {
    if (hasLoadedInitialConfig.current && prevWebsiteConfigRef.current) {
      const configChanged = JSON.stringify(websiteConfiguration) !== JSON.stringify(prevWebsiteConfigRef.current);
      if (configChanged) {
        hasUnsavedChangesRef.current = true;
      }
    }
    prevWebsiteConfigRef.current = websiteConfiguration;
  }, [websiteConfiguration]);

  // Auto-convert base64 branding images to uploaded URLs
  useEffect(() => {
    const convertBase64BrandingImages = async () => {
      const updates: Partial<WebsiteConfig> = {};
      let hasUpdates = false;

      if (websiteConfiguration.headerLogo && isBase64Image(websiteConfiguration.headerLogo)) {
        try {
          const uploadedUrl = await convertBase64ToUploadedUrl(websiteConfiguration.headerLogo, tenantId, 'branding');
          updates.headerLogo = uploadedUrl;
          hasUpdates = true;
        } catch (err) {
          console.error('[AdminCustomization] Failed to convert headerLogo:', err);
        }
      }

      if (websiteConfiguration.footerLogo && isBase64Image(websiteConfiguration.footerLogo)) {
        try {
          const uploadedUrl = await convertBase64ToUploadedUrl(websiteConfiguration.footerLogo, tenantId, 'branding');
          updates.footerLogo = uploadedUrl;
          hasUpdates = true;
        } catch (err) {
          console.error('[AdminCustomization] Failed to convert footerLogo:', err);
        }
      }

      if (websiteConfiguration.favicon && isBase64Image(websiteConfiguration.favicon)) {
        try {
          const uploadedUrl = await convertBase64ToUploadedUrl(websiteConfiguration.favicon, tenantId, 'branding');
          updates.favicon = uploadedUrl;
          hasUpdates = true;
        } catch (err) {
          console.error('[AdminCustomization] Failed to convert favicon:', err);
        }
      }

      if (hasUpdates) {
        setWebsiteConfiguration(prev => ({ ...prev, ...updates }));
      }
    };

    if (hasLoadedInitialConfig.current) {
      convertBase64BrandingImages();
    }
  }, [tenantId]);

  // Sync theme colors with prop
  useEffect(() => {
    if (themeConfig) {
      setThemeColors({
        primary: themeConfig.primaryColor,
        secondary: themeConfig.secondaryColor,
        tertiary: themeConfig.tertiaryColor,
        font: themeConfig.fontColor || DEFAULT_COLORS.font,
        hover: themeConfig.hoverColor || DEFAULT_COLORS.hover,
        surface: themeConfig.surfaceColor || DEFAULT_COLORS.surface,
        adminBg: themeConfig.adminBgColor || DEFAULT_COLORS.adminBg,
        adminInputBg: themeConfig.adminInputBgColor || DEFAULT_COLORS.adminInputBg,
        adminBorder: themeConfig.adminBorderColor || DEFAULT_COLORS.adminBorder,
        adminFocus: themeConfig.adminFocusColor || DEFAULT_COLORS.adminFocus
      });
      setIsDarkMode(themeConfig.darkMode);
    }
  }, [themeConfig]);

  // ---------------------------------------------------------------------------
  // Save All Changes Handler
  // ---------------------------------------------------------------------------

  const handleSaveChanges = async (): Promise<void> => {
    if (isSaving) return;

    setIsSaving(true);
    isSavingRef.current = true;
    setIsSaved(false);
    const loadingToast = toast.loading('Saving changes...');
    const startTime = Date.now();

    try {
      if (onUpdateWebsiteConfig) {
        console.log('[AdminCustomization] Saving config with productDetailTheme:', websiteConfiguration.productDetailTheme, 'readyTheme:', websiteConfiguration.readyTheme);
        await onUpdateWebsiteConfig(websiteConfiguration);
      }

      if (onUpdateTheme) {
        const themePayload = {
          primaryColor: themeColors.primary,
          secondaryColor: themeColors.secondary,
          tertiaryColor: themeColors.tertiary,
          fontColor: themeColors.font,
          hoverColor: themeColors.hover,
          surfaceColor: themeColors.surface,
          darkMode: isDarkMode,
          adminBgColor: themeColors.adminBg,
          adminInputBgColor: themeColors.adminInputBg,
          adminBorderColor: themeColors.adminBorder,
          adminFocusColor: themeColors.adminFocus
        };
        await onUpdateTheme(themePayload);
      }


      // Update protection refs immediately after save completes (before any delay)
      hasUnsavedChangesRef.current = false;
      prevWebsiteConfigRef.current = websiteConfiguration;
      lastSaveTimestampRef.current = Date.now();

      // Clear all server-side cache for the tenant so style changes are reflected in real-time
      if (tenantId) {
        await DataService.clearServerCache(tenantId);
      }

      // Brief delay for visual feedback
      const elapsed = Date.now() - startTime;
      if (elapsed < 2000) {
        await new Promise(resolve => setTimeout(resolve, 2000 - elapsed));
      }

      toast.dismiss(loadingToast);
      setIsSaved(true);
      toast.success('Saved successfully!');
      setTimeout(() => setIsSaved(false), 2000);
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Save failed:', error);
      toast.error('Save failed. Please try again.');
    } finally {
      setIsSaving(false);
      setTimeout(() => {
        isSavingRef.current = false;
      }, 2000);
    }
  };

  // ---------------------------------------------------------------------------
  // Ctrl+S Keyboard Shortcut for Save
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveChanges();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div style={{ minHeight: '100vh', backgroundColor: isDark ? '#111827' : '#f9f9f9', padding: '20px' }}>
      {/* Main Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Header Card */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* Title Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1
              style={{
                fontFamily: '"Lato", sans-serif',
                fontWeight: 700,
                fontSize: '22px',
                color: '#023337',
                letterSpacing: '0.11px',
                margin: 0,
              }}
            >
              Customization
            </h1>
            <button
              onClick={handleSaveChanges}
              disabled={isSaving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                borderRadius: '8px',
                border: 'none',
                fontFamily: '"Lato", sans-serif',
                fontWeight: 700,
                fontSize: '15px',
                cursor: isSaving ? 'wait' : 'pointer',
                transition: 'all 0.2s ease',
                ...(isSaved
                  ? { backgroundColor: '#22c55e', color: 'white' }
                  : isSaving
                  ? { backgroundColor: '#4ade80', color: 'white' }
                  : { backgroundColor: '#22c55e', color: 'white' }),
              }}
            >
              {isSaved ? (
                <>
                  <CheckCircle2 size={18} />
                  Saved!
                </>
              ) : isSaving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
          </div>

          {/* Tab Navigation - Figma Style */}
          <div style={{ display: 'flex', gap: '16px' }}>
            {/* Ready made theme Tab */}
            <button
              onClick={() => setActiveTab('theme_view')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '12px 22px',
                backgroundColor: 'white',
                border: 'none',
                borderBottom: activeTab === 'theme_view' ? '2px solid #38bdf8' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Grid Icon */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ opacity: activeTab === 'theme_view' ? 1 : 0.5 }}>
                <rect x="3" y="3" width="7" height="7" rx="1" stroke={activeTab === 'theme_view' ? '#38bdf8' : '#333'} strokeWidth="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1" stroke={activeTab === 'theme_view' ? '#38bdf8' : '#333'} strokeWidth="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1" stroke={activeTab === 'theme_view' ? '#38bdf8' : '#333'} strokeWidth="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1" stroke={activeTab === 'theme_view' ? '#38bdf8' : '#333'} strokeWidth="1.5" />
              </svg>
              <span
                style={{
                  fontFamily: '"Poppins", sans-serif',
                  fontWeight: 500,
                  fontSize: '16px',
                  ...(activeTab === 'theme_view'
                    ? {
                        background: 'linear-gradient(90deg, #38bdf8 0%, #1e90ff 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }
                    : { color: 'black' }),
                }}
              >
                Ready made theme
              </span>
            </button>

            {/* Custom Theme Tab */}
            <button
              onClick={() => setActiveTab('theme_colors')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '12px 22px',
                backgroundColor: 'white',
                border: 'none',
                borderBottom: activeTab === 'theme_colors' ? '2px solid #38bdf8' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Category Icon */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ opacity: activeTab === 'theme_colors' ? 1 : 0.5 }}>
                <circle cx="8" cy="8" r="4" stroke={activeTab === 'theme_colors' ? '#38bdf8' : '#333'} strokeWidth="1.5" />
                <circle cx="16" cy="8" r="4" stroke={activeTab === 'theme_colors' ? '#38bdf8' : '#333'} strokeWidth="1.5" />
                <circle cx="8" cy="16" r="4" stroke={activeTab === 'theme_colors' ? '#38bdf8' : '#333'} strokeWidth="1.5" />
                <rect x="12" y="12" width="8" height="8" rx="1" stroke={activeTab === 'theme_colors' ? '#38bdf8' : '#333'} strokeWidth="1.5" />
              </svg>
              <span
                style={{
                  fontFamily: '"Poppins", sans-serif',
                  fontWeight: 500,
                  fontSize: '16px',
                  ...(activeTab === 'theme_colors'
                    ? {
                        background: 'linear-gradient(90deg, #38bdf8 0%, #1e90ff 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }
                    : { color: 'black' }),
                }}
              >
                Custom Theme
              </span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'theme_view' && (
          <ThemeViewTab
            websiteConfiguration={websiteConfiguration}
            setWebsiteConfiguration={setWebsiteConfiguration}
          />
        )}

        {activeTab === 'theme_colors' && (
          <>
            {/* Theme Colors Card */}
            <ThemeColorsTab
              websiteConfiguration={websiteConfiguration}
              setWebsiteConfiguration={setWebsiteConfiguration}
              themeColors={themeColors}
              setThemeColors={setThemeColors}
            />
            {/* Section-by-Section Style Selection */}
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '20px',
              }}
            >
              <CustomThemeSections
                websiteConfiguration={websiteConfiguration}
                setWebsiteConfiguration={setWebsiteConfiguration}
                tenantSubdomain={tenantSubdomain}
                isSaved={isSaved}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminCustomization;
