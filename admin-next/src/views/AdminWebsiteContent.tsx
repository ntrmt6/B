import React, { useState, useRef, useEffect } from 'react';
import { MetricsSkeleton } from '../components/SkeletonLoaders';
import {
  Save,
  Image as ImageIcon,
  Globe,
  Layers,
  Loader2,
  CheckCircle2,
  MessageCircle,
  CalendarDays,
  FileText
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
  DEFAULT_WEBSITE_CONFIG,
  TabButton,
  CarouselTab,
  CampaignTab,
  PopupTab,
  WebsiteInfoTab,
  ChatSettingsTab,
  LandingPageTab
} from '../components/AdminCustomization';
import AdminLandingPage from './AdminLandingPage';

// ============================================================================
// Props Interface
// ============================================================================
interface AdminWebsiteContentProps {
  tenantId: string;
  logo: string | null;
  onUpdateLogo: (logo: string | null) => void;
  themeConfig?: ThemeConfig;
  onUpdateTheme?: (config: ThemeConfig) => Promise<void>;
  websiteConfig?: WebsiteConfig;
  onUpdateWebsiteConfig?: (config: WebsiteConfig) => Promise<void>;
  initialTab?: string;
  products?: Product[];
  // Landing Page props
  landingPages?: any[];
  onCreateLandingPage?: (page: any) => void;
  onUpdateLandingPage?: (page: any) => void;
  onToggleLandingPublish?: (pageId: string, status: string) => void;
  onPreviewLandingPage?: (page: any) => void;
  tenantSubdomain?: string;
}

// ============================================================================
// Main Component
// ============================================================================

const AdminWebsiteContent: React.FC<AdminWebsiteContentProps> = ({
  tenantId,
  logo,
  onUpdateLogo,
  themeConfig,
  onUpdateTheme,
  websiteConfig,
  onUpdateWebsiteConfig,
  initialTab = 'carousel',
  products = [],
  landingPages = [],
  onCreateLandingPage,
  onUpdateLandingPage,
  onToggleLandingPublish,
  onPreviewLandingPage,
  tenantSubdomain = ''
}) => {
  // ---------------------------------------------------------------------------
  // Tab State
  // ---------------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState(initialTab);

  // ---------------------------------------------------------------------------
  // Website Configuration State
  // ---------------------------------------------------------------------------
  const [websiteConfiguration, setWebsiteConfiguration] = useState<WebsiteConfig>(
    () => (websiteConfig ? { ...DEFAULT_WEBSITE_CONFIG, ...websiteConfig } : DEFAULT_WEBSITE_CONFIG)
  );

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
      (window as any).__getAdminWebsiteContentUnsavedChanges = () => {
        const timeSinceLastSave = Date.now() - lastSaveTimestampRef.current;
        const isWithinProtectionWindow = timeSinceLastSave < SAVE_PROTECTION_MS;
        if (isWithinProtectionWindow) {
          console.log('[AdminWebsiteContent] Within save protection window, blocking refresh');
          return true;
        }
        return hasUnsavedChangesRef.current;
      };
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).__getAdminWebsiteContentUnsavedChanges;
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
      console.log('[AdminWebsiteContent] Tenant changed, reloading config');
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
      console.log('[AdminWebsiteContent] Initial config load');
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

      // Check headerLogo
      if (websiteConfiguration?.headerLogo && isBase64Image(websiteConfiguration.headerLogo)) {
        try {
          const url = await convertBase64ToUploadedUrl(websiteConfiguration.headerLogo, tenantId, 'branding');
          updates.headerLogo = url;
          hasUpdates = true;
        } catch (error) {
          console.error('[AdminWebsiteContent] Failed to convert headerLogo:', error);
        }
      }

      // Check footerLogo
      if (websiteConfiguration?.footerLogo && isBase64Image(websiteConfiguration.footerLogo)) {
        try {
          const url = await convertBase64ToUploadedUrl(websiteConfiguration.footerLogo, tenantId, 'branding');
          updates.footerLogo = url;
          hasUpdates = true;
        } catch (error) {
          console.error('[AdminWebsiteContent] Failed to convert footerLogo:', error);
        }
      }

      // Check favicon
      if (websiteConfiguration?.favicon && isBase64Image(websiteConfiguration.favicon)) {
        try {
          const url = await convertBase64ToUploadedUrl(websiteConfiguration.favicon, tenantId, 'branding');
          updates.favicon = url;
          hasUpdates = true;
        } catch (error) {
          console.error('[AdminWebsiteContent] Failed to convert favicon:', error);
        }
      }

      if (hasUpdates) {
        setWebsiteConfiguration(prev => ({ ...prev, ...updates }));
      }
    };

    convertBase64BrandingImages();
  }, [websiteConfiguration?.headerLogo, websiteConfiguration?.footerLogo, websiteConfiguration?.favicon, tenantId]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="w-full px-1.5 sm:px-2.5 md:px-4 py-1.5 sm:py-2.5 space-y-1.5 sm:space-y-2.5 bg-[#F8F9FB] dark:bg-gray-900 min-h-screen">
        <MetricsSkeleton />
      </div>
    );
  }

  return (
    <div className="w-full px-1.5 sm:px-2.5 md:px-4 py-1.5 sm:py-2.5 space-y-1.5 sm:space-y-2.5 bg-[#F8F9FB] dark:bg-gray-900 min-h-screen transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 bg-white dark:bg-gray-800 rounded-lg p-2.5 sm:p-3.5 border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-xl font-bold text-gray-800 dark:text-white truncate font-['Lato']">Website Content</h2>
          <p className="text-gray-500 dark:text-gray-300 text-[11px] sm:text-xs mt-0.5 truncate font-['Roboto']">Manage carousel, campaigns, popups, website info and chat settings</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5 overflow-x-auto scrollbar-hide">
        <TabButton id="website_info" label="Website" icon={<Globe size={16} />} activeTab={activeTab} onTabChange={setActiveTab} />
        <TabButton id="carousel" label="Carousel" icon={<ImageIcon size={16} />} activeTab={activeTab} onTabChange={setActiveTab} />
        <TabButton id="campaigns" label="Campaigns" icon={<CalendarDays size={16} />} activeTab={activeTab} onTabChange={setActiveTab} />
        <TabButton id="popup" label="Popups" icon={<Layers size={16} />} activeTab={activeTab} onTabChange={setActiveTab} />
        <TabButton id="chat_settings" label="Chat" icon={<MessageCircle size={16} />} activeTab={activeTab} onTabChange={setActiveTab} />
        <TabButton id="landing_page" label="Landing Page" icon={<FileText size={16} />} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm p-1.5 sm:p-2.5 md:p-3.5 transition-colors duration-200">
        {activeTab === 'carousel' && (
          <CarouselTab
            websiteConfiguration={websiteConfiguration}
            setWebsiteConfiguration={setWebsiteConfiguration}
            tenantId={tenantId}
            onUpdateWebsiteConfig={async (cfg) => {
              if (onUpdateWebsiteConfig) await onUpdateWebsiteConfig(cfg);
              try { if (tenantId) await DataService.clearServerCache(tenantId); } catch (e) { console.warn('Failed clearing server cache after carousel save', e); }
            }}
            isSavingRef={isSavingRef}
            hasUnsavedChangesRef={hasUnsavedChangesRef}
            prevWebsiteConfigRef={prevWebsiteConfigRef}
            lastSaveTimestampRef={lastSaveTimestampRef}
          />
        )}

        {activeTab === 'campaigns' && (
          <CampaignTab
            websiteConfiguration={websiteConfiguration}
            setWebsiteConfiguration={setWebsiteConfiguration}
            tenantId={tenantId}
            products={products}
            onUpdateWebsiteConfig={async (cfg) => {
              if (onUpdateWebsiteConfig) await onUpdateWebsiteConfig(cfg);
              try { if (tenantId) await DataService.clearServerCache(tenantId); } catch (e) { console.warn('Failed clearing server cache after campaigns save', e); }
            }}
            hasUnsavedChangesRef={hasUnsavedChangesRef}
            prevWebsiteConfigRef={prevWebsiteConfigRef}
            lastSaveTimestampRef={lastSaveTimestampRef}
          />
        )}

        {activeTab === 'popup' && (
          <PopupTab
            websiteConfiguration={websiteConfiguration}
            setWebsiteConfiguration={setWebsiteConfiguration}
            tenantId={tenantId}
            onUpdateWebsiteConfig={async (cfg) => {
              if (onUpdateWebsiteConfig) await onUpdateWebsiteConfig(cfg);
              try { if (tenantId) await DataService.clearServerCache(tenantId); } catch (e) { console.warn('Failed clearing server cache after popup save', e); }
            }}
            hasUnsavedChangesRef={hasUnsavedChangesRef}
            prevWebsiteConfigRef={prevWebsiteConfigRef}
            lastSaveTimestampRef={lastSaveTimestampRef}
          />
        )}

        {activeTab === 'website_info' && (
          <WebsiteInfoTab
            websiteConfiguration={websiteConfiguration}
            setWebsiteConfiguration={setWebsiteConfiguration}
            logo={logo}
            onUpdateLogo={onUpdateLogo}
            tenantId={tenantId}
            onSave={async (cfg) => {
              if (onUpdateWebsiteConfig) await onUpdateWebsiteConfig(cfg);
              try { if (tenantId) await DataService.clearServerCache(tenantId); } catch (e) { console.warn('Failed clearing server cache after website info save', e); }
            }}
          />
        )}

        {activeTab === 'chat_settings' && (
          <ChatSettingsTab
            websiteConfiguration={websiteConfiguration}
            setWebsiteConfiguration={setWebsiteConfiguration}
            onSave={async (configOverride?: WebsiteConfig) => {
              const configToSave = configOverride || websiteConfiguration;
              if (onUpdateWebsiteConfig) await onUpdateWebsiteConfig(configToSave);
              try { if (tenantId) await DataService.clearServerCache(tenantId); } catch (e) { console.warn('Failed clearing server cache after chat settings save', e); }
            }}
          />
        )}

        {activeTab === 'landing_page' && (
          <LandingPageTab
            websiteConfiguration={websiteConfiguration}
            setWebsiteConfiguration={setWebsiteConfiguration}
            tenantId={tenantId}
            tenantSubdomain={tenantSubdomain}
            onSave={async (cfg) => {
              if (onUpdateWebsiteConfig) await onUpdateWebsiteConfig(cfg);
              try { if (tenantId) await DataService.clearServerCache(tenantId); } catch (e) { console.warn('Failed clearing server cache after landing page save', e); }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default AdminWebsiteContent;
