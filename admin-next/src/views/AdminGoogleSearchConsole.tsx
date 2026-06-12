import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, AlertTriangle, Search, ExternalLink, Copy, Check } from 'lucide-react';
import { DataService } from '../services/DataService';
import toast from 'react-hot-toast';

interface AdminGoogleSearchConsoleProps {
  onBack: () => void;
  tenantId?: string;
}

const AdminGoogleSearchConsole: React.FC<AdminGoogleSearchConsoleProps> = ({ onBack, tenantId }) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await DataService.getWebsiteConfig(tenantId);
        if (config?.googleSiteVerification) {
          setVerificationCode(config.googleSiteVerification);
        }
      } catch (error) {
        console.warn('Failed to load Google Search Console config:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadConfig();
  }, [tenantId]);

  const handleSave = async () => {
    const trimmed = verificationCode.trim();

    if (trimmed && !/^[A-Za-z0-9+/=_\-]+$/.test(trimmed)) {
      toast.error('Invalid verification code. Please paste only the content value from the meta tag.');
      return;
    }

    setIsSaving(true);
    try {
      const existing = await DataService.getWebsiteConfig(tenantId);
      await DataService.save(
        'website_config',
        { ...existing, googleSiteVerification: trimmed || undefined },
        tenantId
      );
      toast.success('Google Search Console verification saved.');
    } catch (error) {
      console.error('Failed to save Google Search Console config:', error);
      toast.error('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const metaTagPreview = verificationCode.trim()
    ? `<meta name="google-site-verification" content="${verificationCode.trim()}" />`
    : '';

  const handleCopy = () => {
    if (metaTagPreview) {
      navigator.clipboard.writeText(metaTagPreview).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
    }
  };

  const isActive = Boolean(verificationCode.trim());

  if (isLoading) {
    return (
      <div className="w-full max-w-5xl mx-auto p-2 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
        <div className="h-24 bg-gray-200 rounded mb-6"></div>
        <div className="h-12 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in px-3 sm:px-4 lg:px-2">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button onClick={onBack} className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-full transition flex-shrink-0">
          <ArrowLeft size={18} className="text-gray-600 sm:w-5 sm:h-5" />
        </button>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Google Search Console</h2>
      </div>

      {/* Info Section */}
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-white flex items-center justify-center flex-shrink-0 border-2 sm:border-4 border-blue-100 shadow-sm ring-1 ring-blue-300">
          {/* Google "G" logo */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21.8055 10.0415H21V10H12V14H17.6515C16.827 16.3285 14.6115 18 12 18C8.6865 18 6 15.3135 6 12C6 8.6865 8.6865 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C6.4775 2 2 6.4775 2 12C2 17.5225 6.4775 22 12 22C17.5225 22 22 17.5225 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z" fill="#FFC107"/>
            <path d="M3.15283 7.3455L6.43833 9.755C7.32733 7.554 9.48033 6 11.9998 6C13.5293 6 14.9208 6.577 15.9803 7.5195L18.8088 4.691C17.0228 3.0265 14.6338 2 11.9998 2C8.15883 2 4.82783 4.1685 3.15283 7.3455Z" fill="#FF3D00"/>
            <path d="M12.0002 22C14.5832 22 16.9302 21.0115 18.7047 19.404L15.6097 16.785C14.5719 17.5742 13.3039 18.001 12.0002 18C9.39916 18 7.19066 16.3415 6.35866 14.027L3.09766 16.5395C4.75266 19.778 8.11366 22 12.0002 22Z" fill="#4CAF50"/>
            <path d="M21.8055 10.0415H21V10H12V14H17.6515C17.2571 15.1082 16.5467 16.0766 15.608 16.7855L15.6095 16.7845L18.7045 19.4035C18.4855 19.6025 22 17 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z" fill="#1976D2"/>
          </svg>
        </div>
        <div className="pt-0.5 sm:pt-1 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h3 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900">Google Search Console</h3>
            <span className={`inline-flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${isActive ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {isActive
                ? <><CheckCircle size={10} className="sm:w-3 sm:h-3" /> Verified</>
                : <><AlertTriangle size={10} className="sm:w-3 sm:h-3" /> Not Set</>}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 line-clamp-2">
            Verify your store domain with Google Search Console to appear in Google search results.
          </p>
        </div>
      </div>

      {/* How-to steps */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
        <h4 className="font-semibold text-blue-800 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
          <Search size={14} className="sm:w-4 sm:h-4" /> How to verify your domain
        </h4>
        <ol className="text-xs sm:text-sm text-blue-700 space-y-1.5 list-decimal list-inside">
          <li>Go to <a href="https://search.google.com/search-console/welcome" target="_blank" rel="noopener noreferrer" className="underline font-medium" aria-label="Google Search Console (opens in new tab)">Google Search Console</a> and add your store URL as a property.</li>
          <li>Choose the <strong>HTML tag</strong> verification method.</li>
          <li>Copy the <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-800 font-mono">content</code> value from the provided meta tag (e.g., <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-800 font-mono">abc123XYZ...</code>).</li>
          <li>Paste it in the field below and click <strong>Save</strong>.</li>
          <li>Return to Google Search Console and click <strong>Verify</strong>.</li>
        </ol>
        <a
          href="https://search.google.com/search-console/welcome"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open Google Search Console (opens in new tab)"
          className="inline-flex items-center gap-1.5 mt-2 sm:mt-3 text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Open Google Search Console <ExternalLink size={12} className="sm:w-3.5 sm:h-3.5" />
        </a>
      </div>

      {/* Form */}
      <div className="space-y-3 sm:space-y-4 max-w-3xl pt-1 sm:pt-2">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
            Verification Code <span className="text-gray-400 font-normal">(content value only)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. abc123XYZ_example-verification-token"
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 lg:py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 placeholder-gray-400 shadow-sm font-mono"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
          />
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
            Paste only the <code className="bg-gray-100 px-1 rounded">content="…"</code> value, not the full meta tag.
          </p>
        </div>

        {/* Preview */}
        {metaTagPreview && (
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <h4 className="font-semibold text-gray-700 text-xs sm:text-sm">Generated Meta Tag</h4>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition"
              >
                {isCopied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
              </button>
            </div>
            <code className="text-[10px] sm:text-xs text-gray-600 break-all leading-relaxed">
              {metaTagPreview}
            </code>
            <p className="text-[10px] sm:text-xs text-gray-400 mt-1.5">
              This tag is automatically added to your store's <code className="bg-gray-100 px-0.5 rounded">&lt;head&gt;</code> section.
            </p>
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

export default AdminGoogleSearchConsole;
