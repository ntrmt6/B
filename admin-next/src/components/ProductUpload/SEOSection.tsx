import React from 'react';

interface SEOSectionProps {
  data: any;
  onChange: (data: any) => void;
}

const SEOSection: React.FC<SEOSectionProps> = ({ data, onChange }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">SEO Information</h2>

      <div className="space-y-4">
        {/* Meta Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Meta Title
          </label>
          <input
            type="text"
            value={data.metaTitle}
            onChange={(e) => onChange({ metaTitle: e.target.value })}
            placeholder="Enter meta title"
            maxLength={60}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            {data.metaTitle?.length || 0}/60 characters
          </p>
        </div>

        {/* Meta Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Meta Description
          </label>
          <textarea
            value={data.metaDescription}
            onChange={(e) => onChange({ metaDescription: e.target.value })}
            placeholder="Enter meta description"
            maxLength={160}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            {data.metaDescription?.length || 0}/160 characters
          </p>
        </div>

        {/* Keywords */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Keywords
          </label>
          <input
            type="text"
            value={data.keywords}
            onChange={(e) => onChange({ keywords: e.target.value })}
            placeholder="Enter keywords separated by commas (e.g., keyword1, keyword2, keyword3)"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            Keywords: {data.keywords ? data.keywords.split(',').length : 0}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SEOSection;
