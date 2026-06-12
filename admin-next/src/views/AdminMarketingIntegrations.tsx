import React from 'react';
import { ArrowLeft, Code, Facebook, Video, Search } from 'lucide-react';

interface IntegrationCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconRingColor: string;
  onClick: () => void;
  isComingSoon?: boolean;
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({
  title,
  description,
  icon,
  iconBgColor,
  iconRingColor,
  onClick,
  isComingSoon = false
}) => (
  <button
    onClick={onClick}
    disabled={isComingSoon}
    className={`w-full text-left p-4 sm:p-5 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 flex items-start gap-4 ${isComingSoon ? 'opacity-60 cursor-not-allowed' : 'hover:border-gray-300 active:scale-[0.99]'}`}
  >
    <div 
      className={`w-10 sm:w-12 h-10 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 border-2 sm:border-4 shadow-sm ${iconBgColor} ${iconRingColor}`}
    >
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900">{title}</h3>
        {isComingSoon && (
          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] sm:text-xs font-medium rounded-full">
            Coming Soon
          </span>
        )}
      </div>
      <p className="text-xs sm:text-sm text-gray-500 mt-0.5 line-clamp-2">{description}</p>
    </div>
    {!isComingSoon && (
      <div className="flex-shrink-0 self-center">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    )}
  </button>
);

interface AdminMarketingIntegrationsProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
}

const AdminMarketingIntegrations: React.FC<AdminMarketingIntegrationsProps> = ({ onBack, onNavigate }) => {
  const integrations = [
    {
      id: 'gtm',
      title: 'Google Tag Manager',
      description: 'Manage all marketing tags, analytics, and tracking scripts in one place.',
      icon: <Code size={20} className="text-white sm:w-6 sm:h-6" />,
      iconBgColor: 'bg-blue-500',
      iconRingColor: 'border-blue-100 ring-1 ring-blue-400',
      navigateTo: 'settings_gtm',
      isComingSoon: false
    },
    {
      id: 'facebook',
      title: 'Facebook Pixel',
      description: 'Track conversions, optimize ads, and build remarketing audiences with Meta Pixel.',
      icon: <Facebook size={20} className="text-white sm:w-6 sm:h-6" fill="white" />,
      iconBgColor: 'bg-blue-600',
      iconRingColor: 'border-blue-100 ring-1 ring-blue-500',
      navigateTo: 'settings_facebook_pixel',
      isComingSoon: false
    },
    {
      id: 'tiktok',
      title: 'TikTok Pixel',
      description: 'Measure ad performance and optimize campaigns on TikTok.',
      icon: <Video size={20} className="text-white sm:w-6 sm:h-6" />,
      iconBgColor: 'bg-gray-900',
      iconRingColor: 'border-gray-200 ring-1 ring-gray-600',
      navigateTo: 'settings_tiktok_pixel',
      isComingSoon: true
    },
    {
      id: 'seo',
      title: 'SEO Tools',
      description: 'Optimize your store for search engines with meta tags and structured data.',
      icon: <Search size={20} className="text-white sm:w-6 sm:h-6" />,
      iconBgColor: 'bg-green-500',
      iconRingColor: 'border-green-100 ring-1 ring-green-400',
      navigateTo: 'settings_seo',
      isComingSoon: true
    }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in px-3 sm:px-4 lg:px-2">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button 
          onClick={onBack} 
          className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-full transition flex-shrink-0"
        >
          <ArrowLeft size={18} className="text-gray-600 sm:w-5 sm:h-5"/>
        </button>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Marketing Integrations</h2>
      </div>

      {/* Description */}
      <p className="text-sm sm:text-base text-gray-600">
        Connect your marketing tools to track conversions, optimize ad spend, and improve your store's visibility.
      </p>

      {/* Integration Cards */}
      <div className="space-y-3 sm:space-y-4">
        {integrations.map((integration) => (
          <IntegrationCard
            key={integration.id}
            title={integration.title}
            description={integration.description}
            icon={integration.icon}
            iconBgColor={integration.iconBgColor}
            iconRingColor={integration.iconRingColor}
            onClick={() => !integration.isComingSoon && onNavigate(integration.navigateTo)}
            isComingSoon={integration.isComingSoon}
          />
        ))}
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4 sm:p-5 mt-6">
        <h4 className="font-semibold text-orange-800 mb-2 text-sm sm:text-base">
          💡 Pro Tip
        </h4>
        <p className="text-xs sm:text-sm text-orange-700">
          Use Google Tag Manager to manage all your tracking pixels in one place. 
          Simply add your GTM container ID and configure Facebook, TikTok, and other pixels directly from GTM.
        </p>
      </div>
    </div>
  );
};

export default AdminMarketingIntegrations;
