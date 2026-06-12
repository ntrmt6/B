import React from 'react';
import { CheckCircle2, AlertCircle, Palette, Layout, Move, Eye } from 'lucide-react';

interface StoreStudioSettingsProps {
  enabled: boolean;
}

export const StoreStudioSettings: React.FC<StoreStudioSettingsProps> = ({ enabled }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Store Studio Settings</h2>
      
      {/* Status Card */}
      <div className={`p-4 rounded-lg mb-6 ${
        enabled 
          ? 'bg-green-50 border border-green-200' 
          : 'bg-gray-50 border border-gray-200'
      }`}>
        <div className="flex items-start gap-3">
          {enabled ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5" />
          )}
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 mb-1">
              {enabled ? 'Store Studio is Active' : 'Store Studio is Inactive'}
            </h3>
            <p className="text-sm text-gray-600">
              {enabled 
                ? 'Your custom store design is being displayed to customers. You can edit layouts, colors, and product order in the other tabs.'
                : 'Store is using the default design. Enable Store Studio above to start customizing your store layout and appearance.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Palette className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium text-gray-900">Visual Customization</h3>
          </div>
          <p className="text-sm text-gray-600">
            Change colors, fonts, spacing, and styling of every element in your store without writing any code.
          </p>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Layout className="w-5 h-5 text-purple-600" />
            <h3 className="font-medium text-gray-900">Layout Builder</h3>
          </div>
          <p className="text-sm text-gray-600">
            Drag and drop sections to create your perfect store layout. Add hero banners, product grids, and more.
          </p>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Move className="w-5 h-5 text-green-600" />
            <h3 className="font-medium text-gray-900">Product Ordering</h3>
          </div>
          <p className="text-sm text-gray-600">
            Rearrange products to control which items appear first, second, and so on in your store.
          </p>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-5 h-5 text-orange-600" />
            <h3 className="font-medium text-gray-900">Live Preview</h3>
          </div>
          <p className="text-sm text-gray-600">
            See changes in real-time with image and video previews before publishing to customers.
          </p>
        </div>
      </div>

      {/* Important Note */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> Product checkout flow remains unchanged regardless of Store Studio settings. 
          Your customers will have the same smooth checkout experience.
        </p>
      </div>
    </div>
  );
};

export default StoreStudioSettings;
