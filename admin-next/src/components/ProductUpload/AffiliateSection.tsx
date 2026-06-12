import React from 'react';

interface AffiliateSectionProps {
  data: any;
  onChange: (data: any) => void;
}

const AffiliateSection: React.FC<AffiliateSectionProps> = ({ data, onChange }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Affiliate (Optional)</h2>

      <div className="space-y-4">
        {/* Product Source */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Source
          </label>
          <select
            value={data.affiliateSource}
            onChange={(e) => onChange({ affiliateSource: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="">None</option>
            <option value="amazon">Amazon</option>
            <option value="aliexpress">AliExpress</option>
            <option value="daraz">Daraz</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Source Product URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Source Product URL
          </label>
          <input
            type="url"
            value={data.sourceProductUrl}
            onChange={(e) => onChange({ sourceProductUrl: e.target.value })}
            placeholder="https://example.com/product"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Source SKU */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Source SKU
          </label>
          <input
            type="text"
            value={data.sourceSku}
            onChange={(e) => onChange({ sourceSku: e.target.value })}
            placeholder="SKU from source platform"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>
    </div>
  );
};

export default AffiliateSection;
