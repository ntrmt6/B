import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Globe, FileText, Image, Building, Save, Info, Eye, Code } from 'lucide-react';
import { DataService } from '../services/DataService';
import { GalleryPicker } from '../components/GalleryPicker';
import toast from 'react-hot-toast';

interface AdminSeoSettingsProps {
  onBack: () => void;
  tenantId?: string;
}

type SchemaType = 'Store' | 'Organization' | 'LocalBusiness';

interface SeoFormData {
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  ogImage: string;
  schemaType: SchemaType;
  schemaName: string;
  schemaDescription: string;
  schemaLogo: string;
  schemaAddress: string;
  schemaPhone: string;
  schemaEmail: string;
  schemaPriceRange: string;
  schemaOpeningHours: string;
}

const defaultFormData: SeoFormData = {
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
  ogImage: '',
  schemaType: 'Store',
  schemaName: '',
  schemaDescription: '',
  schemaLogo: '',
  schemaAddress: '',
  schemaPhone: '',
  schemaEmail: '',
  schemaPriceRange: '',
  schemaOpeningHours: '',
};

const AdminSeoSettings: React.FC<AdminSeoSettingsProps> = ({ onBack, tenantId }) => {
  const [formData, setFormData] = useState<SeoFormData>(defaultFormData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryTarget, setGalleryTarget] = useState<'ogImage' | 'schemaLogo'>('ogImage');
  const [activeTab, setActiveTab] = useState<'meta' | 'schema'>('meta');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await DataService.getWebsiteConfig(tenantId);
        if (config) {
          setFormData({
            seoTitle: config.seoTitle || '',
            seoDescription: config.seoDescription || '',
            seoKeywords: config.seoKeywords || '',
            ogImage: config.ogImage || '',
            schemaType: config.schemaType || 'Store',
            schemaName: config.schemaName || config.storeName || '',
            schemaDescription: config.schemaDescription || config.shortDescription || '',
            schemaLogo: config.schemaLogo || config.headerLogo || '',
            schemaAddress: config.schemaAddress || (config.addresses?.[0] || ''),
            schemaPhone: config.schemaPhone || (config.phones?.[0] || ''),
            schemaEmail: config.schemaEmail || (config.emails?.[0] || ''),
            schemaPriceRange: config.schemaPriceRange || '',
            schemaOpeningHours: config.schemaOpeningHours || '',
          });
        }
      } catch (error) {
        console.warn('Failed to load SEO config:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadConfig();
  }, [tenantId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const existing = await DataService.getWebsiteConfig(tenantId);
      await DataService.save(
        'website_config',
        {
          ...existing,
          seoTitle: formData.seoTitle || undefined,
          seoDescription: formData.seoDescription || undefined,
          seoKeywords: formData.seoKeywords || undefined,
          ogImage: formData.ogImage || undefined,
          schemaType: formData.schemaType || undefined,
          schemaName: formData.schemaName || undefined,
          schemaDescription: formData.schemaDescription || undefined,
          schemaLogo: formData.schemaLogo || undefined,
          schemaAddress: formData.schemaAddress || undefined,
          schemaPhone: formData.schemaPhone || undefined,
          schemaEmail: formData.schemaEmail || undefined,
          schemaPriceRange: formData.schemaPriceRange || undefined,
          schemaOpeningHours: formData.schemaOpeningHours || undefined,
        },
        tenantId
      );
      toast.success('SEO settings saved successfully!');
    } catch (error) {
      console.error('Failed to save SEO config:', error);
      toast.error('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof SeoFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const openGallery = (target: 'ogImage' | 'schemaLogo') => {
    setGalleryTarget(target);
    setIsGalleryOpen(true);
  };

  const handleGallerySelect = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, [galleryTarget]: imageUrl }));
    setIsGalleryOpen(false);
  };

  const generateSchemaPreview = () => {
    const schema: Record<string, any> = {
      '@context': 'https://schema.org',
      '@type': formData.schemaType,
      name: formData.schemaName || 'Your Store Name',
      description: formData.schemaDescription || 'Your store description',
    };

    if (formData.schemaLogo) schema.logo = formData.schemaLogo;
    if (formData.schemaAddress) schema.address = formData.schemaAddress;
    if (formData.schemaPhone) schema.telephone = formData.schemaPhone;
    if (formData.schemaEmail) schema.email = formData.schemaEmail;
    if (formData.schemaPriceRange) schema.priceRange = formData.schemaPriceRange;
    if (formData.schemaOpeningHours) schema.openingHours = formData.schemaOpeningHours;

    return JSON.stringify(schema, null, 2);
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-5xl mx-auto p-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
        <div className="h-24 bg-gray-200 rounded mb-6"></div>
        <div className="h-12 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 sm:space-y-6 animate-fade-in px-3 sm:px-4 lg:px-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <button onClick={onBack} className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-full transition flex-shrink-0">
            <ArrowLeft size={18} className="text-gray-600 sm:w-5 sm:h-5" />
          </button>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">SEO Settings</h2>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
        >
          {isSaving ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Saving...
            </>
          ) : (
            <>
              <Save size={16} />
              Save
            </>
          )}
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-800 text-sm">Improve Your Shop's Visibility</h4>
            <p className="text-xs sm:text-sm text-blue-700 mt-1">
              Configure meta tags and structured data (Schema.org) to help search engines understand your shop better.
              This can improve your ranking in Google search results.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('meta')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
            activeTab === 'meta'
              ? 'text-orange-600 border-orange-500'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          <FileText size={16} />
          Meta Tags
        </button>
        <button
          onClick={() => setActiveTab('schema')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
            activeTab === 'schema'
              ? 'text-orange-600 border-orange-500'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          <Code size={16} />
          Schema Markup
        </button>
      </div>

      {/* Meta Tags Tab */}
      {activeTab === 'meta' && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <Globe size={20} className="text-orange-500" />
            <h3 className="font-semibold text-gray-800">Meta Tags</h3>
          </div>

          {/* SEO Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              SEO Title
              <span className="text-gray-400 font-normal ml-2">({formData.seoTitle.length}/60 characters)</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Best Electronics Store in Bangladesh | Your Shop Name"
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={formData.seoTitle}
              onChange={(e) => handleInputChange('seoTitle', e.target.value)}
              maxLength={70}
            />
            <p className="text-xs text-gray-500 mt-1">
              This appears as the clickable headline in search results. Keep it under 60 characters.
            </p>
          </div>

          {/* SEO Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Meta Description
              <span className="text-gray-400 font-normal ml-2">({formData.seoDescription.length}/160 characters)</span>
            </label>
            <textarea
              rows={3}
              placeholder="e.g., Shop the latest electronics, gadgets, and accessories at unbeatable prices. Fast delivery across Bangladesh. 100% authentic products guaranteed."
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
              value={formData.seoDescription}
              onChange={(e) => handleInputChange('seoDescription', e.target.value)}
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">
              This is the snippet shown below the title in search results. Keep it under 160 characters.
            </p>
          </div>

          {/* SEO Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Keywords
            </label>
            <input
              type="text"
              placeholder="e.g., electronics, gadgets, online shopping, Bangladesh"
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={formData.seoKeywords}
              onChange={(e) => handleInputChange('seoKeywords', e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Comma-separated keywords relevant to your shop. While less important for Google, they help other search engines.
            </p>
          </div>

          {/* OG Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Social Share Image (OG Image)
            </label>
            <div className="flex items-start gap-4">
              <div
                onClick={() => openGallery('ogImage')}
                className="w-40 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition overflow-hidden"
              >
                {formData.ogImage ? (
                  <img src={formData.ogImage} alt="OG" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-gray-400">
                    <Image size={24} />
                    <span className="text-xs mt-1">Click to select</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Or paste image URL here"
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={formData.ogImage}
                  onChange={(e) => handleInputChange('ogImage', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This image appears when your shop is shared on Facebook, Twitter, etc. Recommended: 1200x630px
                </p>
              </div>
            </div>
          </div>

          {/* Google Preview */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Eye size={16} className="text-gray-500" />
              <h4 className="font-medium text-gray-700 text-sm">Google Search Preview</h4>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-xl">
              <div className="text-blue-800 text-lg hover:underline cursor-pointer truncate">
                {formData.seoTitle || 'Your Shop Title Will Appear Here'}
              </div>
              <div className="text-green-700 text-sm mt-1 truncate">
                yourshop.allinbangla.com
              </div>
              <div className="text-gray-600 text-sm mt-1 line-clamp-2">
                {formData.seoDescription || 'Your meta description will appear here. Write a compelling description to attract more clicks.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schema Tab */}
      {activeTab === 'schema' && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 space-y-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Building size={20} className="text-orange-500" />
              <h3 className="font-semibold text-gray-800">Schema.org Markup</h3>
            </div>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              <Code size={14} />
              {showPreview ? 'Hide' : 'Show'} JSON-LD
            </button>
          </div>

          <p className="text-sm text-gray-600">
            Schema markup helps search engines understand your business better, potentially showing rich snippets in search results.
          </p>

          {/* Schema Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Business Type
            </label>
            <select
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
              value={formData.schemaType}
              onChange={(e) => handleInputChange('schemaType', e.target.value as SchemaType)}
            >
              <option value="Store">Store (Online/Physical Store)</option>
              <option value="Organization">Organization (Company/Business)</option>
              <option value="LocalBusiness">Local Business (Physical Location)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Business Name
              </label>
              <input
                type="text"
                placeholder="Your Store Name"
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                value={formData.schemaName}
                onChange={(e) => handleInputChange('schemaName', e.target.value)}
              />
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Price Range
              </label>
              <select
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                value={formData.schemaPriceRange}
                onChange={(e) => handleInputChange('schemaPriceRange', e.target.value)}
              >
                <option value="">Select price range</option>
                <option value="$">$ (Budget-friendly)</option>
                <option value="$$">$$ (Moderate)</option>
                <option value="$$$">$$$ (Premium)</option>
                <option value="$$$$">$$$$ (Luxury)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Business Description
            </label>
            <textarea
              rows={2}
              placeholder="Brief description of your business"
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
              value={formData.schemaDescription}
              onChange={(e) => handleInputChange('schemaDescription', e.target.value)}
            />
          </div>

          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Business Logo URL
            </label>
            <div className="flex gap-3">
              <div
                onClick={() => openGallery('schemaLogo')}
                className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition overflow-hidden flex-shrink-0"
              >
                {formData.schemaLogo ? (
                  <img src={formData.schemaLogo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Image size={20} className="text-gray-400" />
                )}
              </div>
              <input
                type="text"
                placeholder="https://example.com/logo.png"
                className="flex-1 px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                value={formData.schemaLogo}
                onChange={(e) => handleInputChange('schemaLogo', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="+880 1XXXXXXXXX"
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                value={formData.schemaPhone}
                onChange={(e) => handleInputChange('schemaPhone', e.target.value)}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                placeholder="contact@yourshop.com"
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                value={formData.schemaEmail}
                onChange={(e) => handleInputChange('schemaEmail', e.target.value)}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Business Address
            </label>
            <input
              type="text"
              placeholder="123 Main Street, Dhaka, Bangladesh"
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={formData.schemaAddress}
              onChange={(e) => handleInputChange('schemaAddress', e.target.value)}
            />
          </div>

          {/* Opening Hours */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Opening Hours
            </label>
            <input
              type="text"
              placeholder="e.g., Mo-Fr 09:00-18:00, Sa 10:00-16:00"
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={formData.schemaOpeningHours}
              onChange={(e) => handleInputChange('schemaOpeningHours', e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Use ISO 8601 format. Example: Mo-Fr 09:00-18:00, Sa 10:00-16:00
            </p>
          </div>

          {/* JSON-LD Preview */}
          {showPreview && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-700 text-sm mb-2">Generated JSON-LD Schema</h4>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto">
                {generateSchemaPreview()}
              </pre>
              <p className="text-xs text-gray-500 mt-2">
                This structured data will be automatically added to your store pages.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Gallery Picker */}
      <GalleryPicker
        isOpen={isGalleryOpen}
        onSelect={handleGallerySelect}
        onClose={() => setIsGalleryOpen(false)}
        multiple={false}
        title={galleryTarget === 'ogImage' ? 'Select Social Share Image' : 'Select Business Logo'}
      />
    </div>
  );
};

export default AdminSeoSettings;
