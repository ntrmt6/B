
import React, { useState, useEffect } from 'react';
import { Facebook, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import { FacebookPixelConfig } from '../types';

interface AdminFacebookPixelProps {
    onBack: () => void;
    config: FacebookPixelConfig;
    onSave: (config: FacebookPixelConfig) => Promise<void> | void;
}

const AdminFacebookPixel: React.FC<AdminFacebookPixelProps> = ({ onBack, config, onSave }) => {
    const [pixelId, setPixelId] = useState(config.pixelId);
    const [accessToken, setAccessToken] = useState(config.accessToken);
    const [enableTestEvent, setEnableTestEvent] = useState(config.enableTestEvent);
    const [isEnabled, setIsEnabled] = useState(config.isEnabled);
    const [saving, setSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    useEffect(() => {
        setPixelId(config.pixelId);
        setAccessToken(config.accessToken);
        setEnableTestEvent(config.enableTestEvent);
        setIsEnabled(config.isEnabled);
    }, [config.pixelId, config.accessToken, config.enableTestEvent, config.isEnabled]);

    const handleSave = async () => {
        if (isEnabled && !pixelId.trim()) {
            alert('Facebook Pixel ID is required while tracking is enabled.');
            return;
        }
        const payload: FacebookPixelConfig = {
            pixelId: pixelId.trim(),
            accessToken: accessToken.trim(),
            enableTestEvent,
            isEnabled,
        };
        setSaving(true);
        try {
            await onSave(payload);
            setStatusMessage('Facebook Pixel settings saved. Changes apply instantly on storefront.');
            setTimeout(() => setStatusMessage(null), 4000);
        } finally {
            setSaving(false);
        }
    };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in px-3 sm:px-4 lg:px-2">
        {/* Header with Back Button */}
        <div className="flex items-center gap-3 sm:gap-4">
            <button onClick={onBack} className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-full transition flex-shrink-0">
                <ArrowLeft size={18} className="text-gray-600 sm:w-5 sm:h-5"/>
            </button>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Facebook Pixel</h2>
        </div>

        {/* Info Section */}
        <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 border-2 sm:border-4 border-blue-100 shadow-sm ring-1 ring-blue-500">
                <Facebook size={20} className="text-white sm:w-6 sm:h-6" fill="white" />
            </div>
            <div className="pt-0.5 sm:pt-1 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <h3 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900">Facebook Pixel Tracking</h3>
                    <span className={`inline-flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${isEnabled && pixelId ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {isEnabled && pixelId ? <><CheckCircle size={10} className="sm:w-3 sm:h-3" /> Live</> : <><AlertTriangle size={10} className="sm:w-3 sm:h-3" /> Inactive</>}
                    </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 line-clamp-2">Connect Meta Pixel + Conversions API to track checkout conversions.</p>
            </div>
        </div>

        {statusMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg flex items-center gap-2 text-xs sm:text-sm">
                <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px]" /> {statusMessage}
            </div>
        )}

        {/* Form Fields */}
        <div className="space-y-3 sm:space-y-4 lg:space-y-6 max-w-3xl pt-1 sm:pt-2">
            <div className="flex items-center justify-between border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 bg-white shadow-sm gap-3">
                <div className="min-w-0">
                    <p className="font-semibold text-gray-800 text-sm sm:text-base">Enable tracking</p>
                    <p className="text-xs sm:text-sm text-gray-500 line-clamp-2">Turn this off to pause all pixel events without losing credentials.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input type="checkbox" className="sr-only" checked={isEnabled} onChange={(e) => setIsEnabled(e.target.checked)} />
                    <span className={`w-11 sm:w-14 h-6 sm:h-7 flex items-center rounded-full px-1 transition ${isEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <span className={`bg-white w-5 sm:w-6 h-5 sm:h-6 rounded-full shadow transform transition ${isEnabled ? 'translate-x-5 sm:translate-x-7' : ''}`}></span>
                    </span>
                </label>
            </div>
            <div>
                <input
                    type="text"
                    placeholder="Facebook Pixel Id"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 lg:py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 text-gray-700 placeholder-gray-400 shadow-sm"
                    value={pixelId}
                    onChange={(e) => setPixelId(e.target.value)}
                />
            </div>

            <div>
                <textarea
                    placeholder="Facebook Pixel Access Token"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 lg:py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 text-gray-700 placeholder-gray-400 shadow-sm min-h-[80px] sm:min-h-[100px] lg:min-h-[120px] resize-none align-top"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                />
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
                <input
                    type="checkbox"
                    id="testEvent"
                    className="w-4 sm:w-5 h-4 sm:h-5 border-2 border-gray-400 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    checked={enableTestEvent}
                    onChange={(e) => setEnableTestEvent(e.target.checked)}
                />
                <label htmlFor="testEvent" className="text-xs sm:text-sm text-gray-600 cursor-pointer select-none">
                    Enable Test Event
                </label>
            </div>

            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-3 sm:p-4 text-xs sm:text-sm text-gray-600">
                <p className="font-semibold text-gray-800 mb-1">Need this info?</p>
                <ul className="list-disc list-inside space-y-0.5 sm:space-y-1">
                    <li>Pixel ID is in Meta Events Manager.</li>
                    <li>Access token needed for server-side events.</li>
                    <li>Use Test Event toggle when verifying, disable afterwards.</li>
                </ul>
            </div>

            <button
                onClick={handleSave}
                disabled={saving}
                className="w-full btn-search justify-center py-2 sm:py-2.5 lg:py-3 rounded-lg font-semibold text-sm disabled:opacity-50"
            >
                {saving ? 'Saving...' : 'Save'}
            </button>
        </div>
    </div>
  );
};

export default AdminFacebookPixel;
