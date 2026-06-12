import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { StoreStudioConfig, Product } from '../../types';
import { noCacheFetchOptions } from '../../utils/fetchHelpers';
import { getAuthHeader } from '../../services/authService';
import StoreStudioHeader from './StoreStudioHeader';
import StoreStudioTabs from './StoreStudioTabs';
import StoreStudioSettings from './StoreStudioSettings';
import StoreStudioStyles from './StoreStudioStyles';
import ProductOrderManager from './ProductOrderManager';

// Lazy load PageBuilder for the Layout tab
const PageBuilder = lazy(() => import('../PageBuilder').then(m => ({ default: m.PageBuilder })));

interface StoreStudioManagerProps {
  tenantId: string;
  onBack?: () => void;
  products?: Product[];
}

export const StoreStudioManager: React.FC<StoreStudioManagerProps> = ({
  tenantId,
  onBack,
  products = []
}) => {
  const [config, setConfig] = useState<StoreStudioConfig>({
    tenantId,
    enabled: false,
    productDisplayOrder: [],
    updatedAt: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'styles' | 'layout' | 'products'>('layout');
  
  // Ref to store the config before toggle for proper rollback
  const configBeforeToggleRef = useRef<StoreStudioConfig | null>(null);

  // Fetch store studio configuration
  useEffect(() => {
    const fetchConfig = async () => {
      if (!tenantId) return;
      
      setIsLoading(true);
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
        const response = await fetch(`${API_BASE_URL}/api/tenant-data/${tenantId}/store_studio_config`, noCacheFetchOptions);
        
        if (response.ok) {
          const data = await response.json();
          setConfig(data.data || {
            tenantId,
            enabled: false,
            productDisplayOrder: [],
            updatedAt: new Date().toISOString()
          });
        } else {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message || errorData.error || 'Failed to load store studio configuration';
          console.error('Failed to fetch store studio config:', errorMessage);
          toast.error(errorMessage);
        }
      } catch (error) {
        console.error('Failed to fetch store studio config:', error);
        toast.error('Failed to load store studio configuration');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, [tenantId]);

  // Save store studio configuration
  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const response = await fetch(`${API_BASE_URL}/api/tenant-data/${tenantId}/store_studio_config`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify(config),
      });

      if (response.ok) {
        toast.success('Store studio configuration saved successfully!');
        // Clear server cache so store reflects changes immediately
        try {
          await fetch(`${API_BASE_URL}/api/tenant-data/${tenantId}/clear-cache`, {
            method: 'POST',
            headers: getAuthHeader(),
          });
          console.log('[StoreStudio] Cache cleared after config save');
        } catch (cacheErr) {
          console.warn('[StoreStudio] Failed to clear cache:', cacheErr);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || 'Failed to save configuration';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Failed to save store studio config:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save configuration';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard shortcut for save (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveConfig();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Toggle store studio enabled/disabled
  const handleToggleEnabled = async () => {
    configBeforeToggleRef.current = config;
    
    const newConfig: StoreStudioConfig = {
      ...config,
      enabled: !config.enabled,
      updatedAt: new Date().toISOString()
    };
    
    setConfig(newConfig);
    
    setIsSaving(true);
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const response = await fetch(`${API_BASE_URL}/api/tenant-data/${tenantId}/store_studio_config`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify(newConfig),
      });

      if (response.ok) {
        toast.success(`Store Studio ${newConfig.enabled ? 'enabled' : 'disabled'}!`);
        configBeforeToggleRef.current = null;
        // Clear server cache so store reflects the toggle immediately
        try {
          await fetch(`${API_BASE_URL}/api/tenant-data/${tenantId}/clear-cache`, {
            method: 'POST',
            headers: getAuthHeader(),
          });
          console.log('[StoreStudio] Cache cleared after toggle');
        } catch (cacheErr) {
          console.warn('[StoreStudio] Failed to clear cache:', cacheErr);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || 'Failed to save configuration';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Failed to toggle store studio:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update configuration';
      toast.error(errorMessage);
      if (configBeforeToggleRef.current) {
        setConfig(configBeforeToggleRef.current);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Save product order
  const handleSaveProductOrder = async (order: number[]) => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const response = await fetch(`${API_BASE_URL}/api/tenant-data/${tenantId}/product_display_order`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify({ productDisplayOrder: order }),
      });

      if (!response.ok) {
        throw new Error('Failed to save product order');
      }

      setConfig(prev => ({
        ...prev,
        productDisplayOrder: order,
        updatedAt: new Date().toISOString()
      }));

      // Clear server cache so store reflects the product order immediately
      try {
        await fetch(`${API_BASE_URL}/api/tenant-data/${tenantId}/clear-cache`, {
          method: 'POST',
          headers: getAuthHeader(),
        });
        console.log('[StoreStudio] Cache cleared after product order save');
      } catch (cacheErr) {
        console.warn('[StoreStudio] Failed to clear cache:', cacheErr);
      }
    } catch (error) {
      console.error('Failed to save product order:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading Store Studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StoreStudioHeader
            enabled={config.enabled}
            isSaving={isSaving}
            onBack={onBack}
            onToggleEnabled={handleToggleEnabled}
            onSave={handleSaveConfig}
          />
          <StoreStudioTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      {/* Content */}
      <div className={activeTab === 'layout' ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}>
        {activeTab === 'settings' && (
          <StoreStudioSettings enabled={config.enabled} />
        )}

        {activeTab === 'styles' && (
          <StoreStudioStyles tenantId={tenantId} />
        )}

        {activeTab === 'layout' && (
          <div className="h-[calc(100vh-120px)]">
            <Suspense 
              fallback={
                <div className="flex items-center justify-center p-12">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-gray-600">Loading Layout Builder...</p>
                  </div>
                </div>
              }
            >
              <PageBuilder tenantId={tenantId} />
            </Suspense>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <ProductOrderManager
              tenantId={tenantId}
              products={products}
              currentOrder={config.productDisplayOrder}
              onSave={handleSaveProductOrder}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreStudioManager;
