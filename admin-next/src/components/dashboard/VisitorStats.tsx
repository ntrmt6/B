import React from 'react';
import { Wifi, Users, Globe } from 'lucide-react';
import { VisitorStatsProps } from './types';

const VisitorStats: React.FC<VisitorStatsProps> = ({ visitorStats }) => {
  return (
    <div className="grid grid-cols-1 xs:grid-cols-3 md:grid-cols-3 gap-2 xs:gap-3">
      {/* Online Now */}
      <div className="group bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-xl p-2.5 xs:p-3 sm:p-4 shadow-sm hover:shadow-lg hover:shadow-blue-500/20 hover:border-blue-200 transition-all cursor-pointer active:scale-[0.98]">
        <div className="flex items-center gap-2 xs:gap-3">
          <div className="p-1.5 xs:p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg group-hover:scale-110 transition-transform">
            <Wifi className="w-4 h-4 xs:w-5 xs:h-5 text-blue-500" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] xs:text-xs text-slate-400 dark:text-gray-500 font-medium mb-0.5 xs:mb-1">
              Online Now
            </div>
            <div className="text-lg xs:text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {visitorStats?.onlineNow || 35}
            </div>
            <div className="text-[9px] xs:text-[10px] sm:text-xs text-slate-500 dark:text-gray-400 mt-0.5 truncate">
              Active visitors on site
            </div>
          </div>
        </div>
      </div>

      {/* Today Visitors */}
      <div className="group bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-xl p-2.5 xs:p-3 sm:p-4 shadow-sm hover:shadow-lg hover:shadow-orange-500/20 hover:border-orange-200 transition-all cursor-pointer active:scale-[0.98]">
        <div className="flex items-center gap-2 xs:gap-3">
          <div className="p-1.5 xs:p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg group-hover:scale-110 transition-transform">
            <Users className="w-4 h-4 xs:w-5 xs:h-5 text-orange-500" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] xs:text-xs text-slate-400 dark:text-gray-500 font-medium mb-0.5 xs:mb-1">
              Today Visitors
            </div>
            <div className="text-lg xs:text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {visitorStats?.todayVisitors || 35}
            </div>
            <div className="text-[9px] xs:text-[10px] sm:text-xs text-slate-500 dark:text-gray-400 mt-0.5 truncate">
              Last 7 days: {visitorStats?.periodVisitors || 4}
            </div>
          </div>
        </div>
      </div>

      {/* Total Visitors */}
      <div className="group bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-xl p-2.5 xs:p-3 sm:p-4 shadow-sm hover:shadow-lg hover:shadow-indigo-500/20 hover:border-indigo-200 transition-all cursor-pointer active:scale-[0.98]">
        <div className="flex items-center gap-2 xs:gap-3">
          <div className="p-1.5 xs:p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg group-hover:scale-110 transition-transform">
            <Globe className="w-4 h-4 xs:w-5 xs:h-5 text-indigo-500" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] xs:text-xs text-slate-400 dark:text-gray-500 font-medium mb-0.5 xs:mb-1">
              Total Visitors
            </div>
            <div className="text-lg xs:text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {visitorStats?.totalVisitors || 35}
            </div>
            <div className="text-[9px] xs:text-[10px] sm:text-xs text-slate-500 dark:text-gray-400 mt-0.5 truncate">
              {visitorStats?.totalPageViews || 15} page views
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitorStats;
