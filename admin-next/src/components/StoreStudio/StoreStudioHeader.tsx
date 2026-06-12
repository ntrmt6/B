import React from 'react';
import { Store, Eye, EyeOff, Save, ArrowLeft, Loader2 } from 'lucide-react';

interface StoreStudioHeaderProps {
  enabled: boolean;
  isSaving: boolean;
  onBack?: () => void;
  onToggleEnabled: () => void;
  onSave: () => void;
}

export const StoreStudioHeader: React.FC<StoreStudioHeaderProps> = ({
  enabled,
  isSaving,
  onBack,
  onToggleEnabled,
  onSave,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-4 md:h-16 md:py-0">
      <div className="flex items-center gap-2 sm:gap-4">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
            <Store className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Store Studio</h1>
            <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Design your store without code</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-center sm:justify-start gap-3">
          <span className="text-sm font-medium text-gray-700">
            {enabled ? 'Enabled' : 'Disabled'}
          </span>
          <button
            onClick={onToggleEnabled}
            disabled={isSaving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              enabled ? 'bg-green-500' : 'bg-gray-300'
            } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={`Click to ${enabled ? 'disable' : 'enable'} Store Studio`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          {enabled ? (
            <Eye className="w-5 h-5 text-green-500" />
          ) : (
            <EyeOff className="w-5 h-5 text-gray-400" />
          )}
        </div>

        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default StoreStudioHeader;
