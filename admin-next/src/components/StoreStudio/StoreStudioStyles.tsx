import React, { useState, useEffect, useCallback } from 'react';
import { Check, Loader2, Palette } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAuthHeader } from '../../services/authService';
import { THEME_DEMO_IMAGES } from '../PageBuilder/components/SectionVariants';

interface StyleCategory {
  key: string;
  label: string;
  description: string;
  options: Record<string, string>;
}

// Style categories that tenants can customize
const STYLE_CATEGORIES: StyleCategory[] = [
  {
    key: 'headerStyle',
    label: 'Header',
    description: 'Desktop header layout and design',
    options: THEME_DEMO_IMAGES.headerStyle || {},
  },
  {
    key: 'mobileHeaderStyle',
    label: 'Mobile Header',
    description: 'Mobile header layout',
    options: THEME_DEMO_IMAGES.mobileHeaderStyle || {},
  },
  {
    key: 'categorySectionStyle',
    label: 'Category Section',
    description: 'Category display layout',
    options: THEME_DEMO_IMAGES.categorySectionStyle || {},
  },
  {
    key: 'productCardStyle',
    label: 'Product Card',
    description: 'Product card appearance',
    options: THEME_DEMO_IMAGES.productCardStyle || {},
  },
  {
    key: 'footerStyle',
    label: 'Footer',
    description: 'Footer layout and design',
    options: THEME_DEMO_IMAGES.footerStyle || {},
  },
  {
    key: 'bottomNavStyle',
    label: 'Mobile Navigation',
    description: 'Mobile bottom navigation bar',
    options: THEME_DEMO_IMAGES.bottomNavStyle || {},
  },
];

// Readable labels for config keys
const CONFIG_KEY_LABELS: Record<string, string> = {
  headerStyle: 'Header',
  mobileHeaderStyle: 'Mobile Header',
  categorySectionStyle: 'Category Section',
  productCardStyle: 'Product Card',
  footerStyle: 'Footer',
  bottomNavStyle: 'Mobile Navigation',
};

interface StoreStudioStylesProps {
  tenantId: string;
}

export const StoreStudioStyles: React.FC<StoreStudioStylesProps> = ({ tenantId }) => {
  const [styles, setStyles] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Load current style customizations
  useEffect(() => {
    const loadStyles = async () => {
      if (!tenantId) return;
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
        const res = await fetch(`${API_BASE_URL}/api/tenant-data/${tenantId}/store_customization`, {
          cache: 'no-store',
        });
        if (res.ok) {
          const result = await res.json();
          if (result.data && typeof result.data === 'object') {
            setStyles(result.data);
          }
        }
      } catch (e) {
        console.error('[StoreStudioStyles] Failed to load styles:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadStyles();
  }, [tenantId]);

  // Save a style selection
  const handleSelectStyle = useCallback(async (configKey: string, styleValue: string) => {
    if (!tenantId) return;

    // Optimistically update UI
    setStyles(prev => ({ ...prev, [configKey]: styleValue }));
    setSavingKey(configKey);

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      // Fetch existing customization data
      const res = await fetch(`${API_BASE_URL}/api/tenant-data/${tenantId}/store_customization`, {
        cache: 'no-store',
      });
      const existing = res.ok ? await res.json() : { data: {} };
      const updated = { ...(existing.data || {}), [configKey]: styleValue };

      const saveRes = await fetch(`${API_BASE_URL}/api/tenant-data/${tenantId}/store_customization`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify({ data: updated }),
      });

      if (saveRes.ok) {
        const label = CONFIG_KEY_LABELS[configKey] || configKey;
        toast.success(`${label} updated to ${styleValue}`);
        // Clear server cache so store reflects the style change immediately
        try {
          await fetch(`${API_BASE_URL}/api/tenant-data/${tenantId}/clear-cache`, {
            method: 'POST',
            headers: getAuthHeader(),
          });
        } catch (cacheErr) {
          console.warn('[StoreStudioStyles] Failed to clear cache:', cacheErr);
        }
      } else {
        throw new Error('Failed to save');
      }
    } catch (e) {
      console.error('[StoreStudioStyles] Failed to save style:', e);
      toast.error('Failed to save style change');
      // Revert optimistic update
      setStyles(prev => {
        const reverted = { ...prev };
        delete reverted[configKey];
        return reverted;
      });
    } finally {
      setSavingKey(null);
    }
  }, [tenantId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Palette className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Store Styles</h2>
          <p className="text-sm text-gray-500">
            Choose visual styles for each section of your store
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {STYLE_CATEGORIES.map((category) => {
          const entries = Object.entries(category.options);
          if (entries.length === 0) return null;

          const currentValue = styles[category.key] || 'style1';

          return (
            <div key={category.key}>
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-gray-800">{category.label}</h3>
                <p className="text-xs text-gray-500">{category.description}</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {entries.map(([styleKey, thumbnail]) => {
                  const isSelected = currentValue === styleKey;
                  const isSaving = savingKey === category.key;
                  const styleNumber = styleKey.replace('style', '');

                  return (
                    <button
                      key={styleKey}
                      onClick={() => handleSelectStyle(category.key, styleKey)}
                      disabled={isSaving}
                      className={`group relative rounded-lg border-2 overflow-hidden transition-all ${
                        isSelected
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${isSaving ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
                    >
                      {/* Thumbnail */}
                      <div className="aspect-[4/3] bg-gray-50 relative">
                        {thumbnail ? (
                          <img
                            src={thumbnail}
                            alt={`${category.label} Style ${styleNumber}`}
                            className="w-full h-full object-cover object-top"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            Style {styleNumber}
                          </div>
                        )}

                        {/* Selected overlay */}
                        {isSelected && (
                          <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
                            <div className="bg-blue-500 rounded-full p-1">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        )}

                        {/* Saving indicator */}
                        {isSaving && isSelected && (
                          <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                          </div>
                        )}
                      </div>

                      {/* Label */}
                      <div className="px-2 py-1.5 text-center">
                        <span className={`text-xs font-medium ${
                          isSelected ? 'text-blue-600' : 'text-gray-600'
                        }`}>
                          Style {styleNumber}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info note */}
      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>Tip:</strong> Style changes are saved and applied to your live store immediately.
          Make sure Store Studio is enabled for customers to see these styles.
        </p>
      </div>
    </div>
  );
};

export default StoreStudioStyles;
