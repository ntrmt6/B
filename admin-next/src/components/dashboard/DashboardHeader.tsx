import React, { useState } from 'react';
import {
  Globe,
  Play,
  Search,
  Settings,
  MessageCircle,
  Bell,
  X
} from 'lucide-react';
import { DashboardHeaderProps } from './types';
import { getStoreUrl, getHostTenantSlug } from '../../utils/appHelpers';

// Tutorial video URLs by page
const TUTORIAL_VIDEOS: Record<string, string> = {
  'dashboard': 'https://www.youtube.com/watch?v=59b9ptwx0Js',
  'orders': 'https://www.youtube.com/watch?v=xxxxxxxxx',
  'products': 'https://www.youtube.com/watch?v=xxxxxxxxx',
  'inventory': 'https://www.youtube.com/watch?v=xxxxxxxxx',
  'customers_reviews': 'https://www.youtube.com/watch?v=xxxxxxxxx',
  'customization': 'https://www.youtube.com/watch?v=xxxxxxxxx',
  'landing_pages': 'https://www.youtube.com/watch?v=xxxxxxxxx',
  'store_studio': 'https://www.youtube.com/watch?v=xxxxxxxxx',
  'gallery': 'https://www.youtube.com/watch?v=xxxxxxxxx',
  'admin_control': 'https://www.youtube.com/watch?v=xxxxxxxxx',
  'business_report': 'https://www.youtube.com/watch?v=xxxxxxxxx',
  'activity_log': 'https://www.youtube.com/watch?v=xxxxxxxxx',
  'support': 'https://www.youtube.com/watch?v=xxxxxxxxx',
  'settings': 'https://www.youtube.com/watch?v=xxxxxxxxx',
  'default': 'https://www.youtube.com/watch?v=59b9ptwx0Js'
};

// Get store URL for tenant (uses centralized getStoreUrl from appHelpers)

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  tenantId,
  tenantSubdomain,
  currentPage = 'dashboard',
  user,
  searchQuery,
  onSearchChange,
  onSearch
}) => {
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  
  const resolvedSubdomain = tenantSubdomain || (typeof window !== 'undefined' ? getHostTenantSlug() || (window as any).__CUSTOM_DOMAIN_TENANT__?.subdomain : '') || '';

  return (
    <>
    <div className="w-full bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Welcome Text */}
        <div className="flex-shrink-0">
          <div className="text-slate-900 text-base sm:text-lg font-bold">
            Welcome back, {user?.name || 'Admin'}
          </div>
          <div className="text-slate-500 text-xs sm:text-sm font-medium">
              Monitor your business.
          </div>
        </div>
        
        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Website Button */}
          {resolvedSubdomain ? (
            <a
              href={getStoreUrl(resolvedSubdomain)}
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-all"
            >
              <Globe className="w-3.5 h-3.5 text-slate-600" />
              <span className="ml-1.5 text-slate-700 text-xs sm:text-sm font-medium">
                View Website
              </span>
            </a>
          ) : (
            <span 
              className="h-8 px-2.5 bg-gray-200 border border-gray-300 rounded-lg flex items-center cursor-not-allowed"
              title="Loading store..."
            >
              <Globe className="w-3.5 h-3.5 text-gray-400" />
              <span className="ml-1.5 text-gray-500 text-xs sm:text-sm font-medium">
                Loading...
              </span>
            </span>
          )}
          
          {/* Tutorials Button */}
          <button 
            onClick={() => setShowTutorialModal(true)}
            className="h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-all"
          >
            <Play className="w-3.5 h-3.5 text-red-500" />
            <span className="ml-1.5 text-slate-700 text-xs sm:text-sm font-medium">
              Tutorials
            </span>
          </button>
          
          {/* Search Box */}
          <div className="w-full sm:w-48 md:w-64 h-8 bg-slate-50 border border-slate-200 rounded-lg flex items-center px-2.5 hover:border-blue-300 transition-colors">
            <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                onSearch?.(e.target.value);
              }}
              className="flex-1 bg-transparent text-slate-700 text-xs sm:text-sm font-medium outline-none ml-2 placeholder:text-slate-400"
            />
          </div>
        </div>
        
        {/* Right Side - Icons & Profile */}
        <div className="hidden lg:flex items-center gap-2">
          <button className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <Settings className="w-4 h-4 text-slate-600" />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <MessageCircle className="w-4 h-4 text-slate-600" />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <Bell className="w-4 h-4 text-slate-600" />
          </button>
          
          {/* Admin Profile */}
          <div className="flex items-center gap-1.5 ml-2 pl-2.5 border-l border-slate-200">
            <div className="text-right">
              <div className="text-slate-400 text-[10px] font-medium">
                Admin
              </div>
              <div className="text-slate-900 text-xs sm:text-sm font-bold">
                {user?.name || 'Admin'}
              </div>
            </div>
            {user?.avatar ? (
              <img
                className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-100"
                src={user.avatar}
                alt="Admin Avatar"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                {(user?.name || 'A').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    
    {/* Tutorial Video Modal */}
    {showTutorialModal && (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4" onClick={() => setShowTutorialModal(false)}>
        <div 
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <Play className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Tutorial Video</h2>
                <p className="text-sm text-gray-500">Learn how to use this feature</p>
              </div>
            </div>
            <button 
              onClick={() => setShowTutorialModal(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* Video Container */}
            <div className="w-full max-w-4xl h-[600px] bg-black rounded-2xl shadow-2xl overflow-hidden">
              <iframe
              width="100%"
              height="100%"
              src={(() => {
                const videoUrl = TUTORIAL_VIDEOS[currentPage] || TUTORIAL_VIDEOS['default'];
                const videoId = videoUrl.includes('watch?v=') 
                  ? videoUrl.split('watch?v=')[1]?.split('&')[0]
                  : videoUrl.split('/').pop();
                return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
              })()}
              title="Tutorial Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-[500px] h-[281px]"
            />
          </div>
          
          {/* Modal Footer */}
          <div className="p-4 bg-gray-50 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Need more help? Visit our <a href="#" className="text-blue-600 hover:underline">Help Center</a>
            </p>
            <button 
              onClick={() => setShowTutorialModal(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default DashboardHeader;
