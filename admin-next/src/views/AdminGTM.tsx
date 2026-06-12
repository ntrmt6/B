import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, AlertTriangle, Code, ExternalLink } from 'lucide-react';
import { DataService } from '../services/DataService';

const dataService = DataService;

interface GTMConfig {
  containerId: string;
  isEnabled: boolean;
  enableDataLayer: boolean;
}

interface AdminGTMProps {
  onBack: () => void;
  tenantId?: string;
}

const AdminGTM: React.FC<AdminGTMProps> = ({ onBack, tenantId }) => {
  const [containerId, setContainerId] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [enableDataLayer, setEnableDataLayer] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await dataService.get<GTMConfig>('gtm_config', {
          containerId: '',
          isEnabled: false,
          enableDataLayer: true
        }, tenantId);
        
        if (config) {
          setContainerId(config.containerId || '');
          setIsEnabled(config.isEnabled || false);
          setEnableDataLayer(config.enableDataLayer ?? true);
        }
      } catch (error) {
        console.warn('Failed to load GTM config:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadConfig();
  }, [tenantId]);

  const handleSave = async () => {
    if (isEnabled && !containerId.trim()) {
      alert('GTM Container ID is required while tracking is enabled.');
      return;
    }
    
    // Validate GTM ID format (GTM-XXXXXXX)
    if (containerId.trim() && !containerId.trim().match(/^GTM-[A-Z0-9]+$/i)) {
      alert('Invalid GTM Container ID format. It should be like GTM-XXXXXXX');
      return;
    }

    setIsSaving(true);
    try {
      const payload: GTMConfig = {
        containerId: containerId.trim().toUpperCase(),
        isEnabled,
        enableDataLayer
      };
      await dataService.save('gtm_config', payload, tenantId);
      setStatusMessage('Google Tag Manager settings saved. Changes apply instantly on storefront.');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (error) {
      console.error('Failed to save GTM config:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-5xl mx-auto p-2 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
        <div className="h-24 bg-gray-200 rounded mb-6"></div>
        <div className="h-12 bg-gray-200 rounded mb-4"></div>
        <div className="h-12 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in px-3 sm:px-4 lg:px-2">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button onClick={onBack} className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-full transition flex-shrink-0">
          <ArrowLeft size={18} className="text-gray-600 sm:w-5 sm:h-5"/>
        </button>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Google Tag Manager</h2>
      </div>

      {/* Info Section */}
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 border-2 sm:border-4 border-blue-100 shadow-sm ring-1 ring-blue-400">
          <Code size={20} className="text-white sm:w-6 sm:h-6" />
        </div>
        <div className="pt-0.5 sm:pt-1 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h3 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900">Google Tag Manager</h3>
            <span className={`inline-flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${isEnabled && containerId ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {isEnabled && containerId ? <><CheckCircle size={10} className="sm:w-3 sm:h-3" /> Live</> : <><AlertTriangle size={10} className="sm:w-3 sm:h-3" /> Inactive</>}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 line-clamp-2">
            Manage all marketing tags, analytics, and tracking in one place.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg flex items-center gap-2 text-xs sm:text-sm">
          <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px]" /> {statusMessage}
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-3 sm:space-y-4 lg:space-y-6 max-w-3xl pt-1 sm:pt-2">
        {/* Enable Toggle */}
        <div className="flex items-center justify-between border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 bg-white shadow-sm gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 text-sm sm:text-base">Enable GTM</p>
            <p className="text-xs sm:text-sm text-gray-500 line-clamp-2">Turn this off to pause GTM without losing your container ID.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
            <input 
              type="checkbox" 
              className="sr-only" 
              checked={isEnabled} 
              onChange={(e) => setIsEnabled(e.target.checked)} 
            />
            <span className={`w-11 sm:w-14 h-6 sm:h-7 flex items-center rounded-full px-1 transition ${isEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
              <span className={`bg-white w-5 sm:w-6 h-5 sm:h-6 rounded-full shadow transform transition ${isEnabled ? 'translate-x-5 sm:translate-x-7' : ''}`}></span>
            </span>
          </label>
        </div>

        {/* Container ID Input */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">GTM Container ID</label>
          <input
            type="text"
            placeholder="GTM-XXXXXXX"
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 lg:py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 placeholder-gray-400 shadow-sm font-mono"
            value={containerId}
            onChange={(e) => setContainerId(e.target.value.toUpperCase())}
          />
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
            Find in GTM → Admin → Container Settings
          </p>
        </div>

        {/* Data Layer Toggle */}
        <div className="flex items-center justify-between border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 bg-white shadow-sm gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 text-sm sm:text-base">Enhanced Data Layer</p>
            <p className="text-xs sm:text-sm text-gray-500 line-clamp-2">Push e-commerce events to dataLayer for advanced tracking.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
            <input 
              type="checkbox" 
              className="sr-only" 
              checked={enableDataLayer} 
              onChange={(e) => setEnableDataLayer(e.target.checked)} 
            />
            <span className={`w-11 sm:w-14 h-6 sm:h-7 flex items-center rounded-full px-1 transition ${enableDataLayer ? 'bg-green-500' : 'bg-gray-300'}`}>
              <span className={`bg-white w-5 sm:w-6 h-5 sm:h-6 rounded-full shadow transform transition ${enableDataLayer ? 'translate-x-5 sm:translate-x-7' : ''}`}></span>
            </span>
          </label>
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
          <h4 className="font-semibold text-blue-800 mb-1.5 sm:mb-2 flex items-center gap-2 text-sm sm:text-base">
            <Code size={14} className="sm:w-4 sm:h-4" /> What can you do with GTM?
          </h4>
          <ul className="text-xs sm:text-sm text-blue-700 space-y-0.5 sm:space-y-1.5">
            <li>• Add GA4, Facebook Pixel, TikTok Pixel</li>
            <li>• Track custom events & conversions</li>
            <li>• A/B testing and remarketing</li>
          </ul>
          <a 
            href="https://tagmanager.google.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-2 sm:mt-3 text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Open GTM <ExternalLink size={12} className="sm:w-3.5 sm:h-3.5" />
          </a>
        </div>

        {/* Available Events Info */}
        {enableDataLayer && (
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-3 sm:p-4">
            <h4 className="font-semibold text-gray-800 mb-1.5 sm:mb-2 text-sm sm:text-base">Available dataLayer Events</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
              <code className="bg-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border text-gray-600 truncate">view_item</code>
              <code className="bg-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border text-gray-600 truncate">add_to_cart</code>
              <code className="bg-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border text-gray-600 truncate">remove_from_cart</code>
              <code className="bg-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border text-gray-600 truncate">begin_checkout</code>
              <code className="bg-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border text-gray-600 truncate">purchase</code>
              <code className="bg-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border text-gray-600 truncate">search</code>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-2 sm:pt-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 sm:px-6 py-2 sm:py-2.5 lg:py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
          >
            {isSaving ? (
              <>
                <span className="w-3.5 sm:w-4 h-3.5 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Saving...
              </>
            ) : (
              'Save'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminGTM;
