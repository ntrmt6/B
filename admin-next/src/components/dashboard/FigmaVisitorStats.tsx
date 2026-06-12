import React, { useEffect, useState } from 'react';
import { getAuthHeader } from '../../services/authService';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// Icon components matching Figma design
const OnlineNowIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="2" fill={color} />
    <path d="M8 8C9.1 6.9 10.5 6.3 12 6.3C13.5 6.3 14.9 6.9 16 8" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M4 4C6.2 1.8 9.1 0.5 12 0.5C14.9 0.5 17.8 1.8 20 4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const TodayVisitorsIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="9" cy="7" r="4" stroke={color} strokeWidth="1.5"/>
    <path d="M23 21V19C22.9992 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TotalVisitorsIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5"/>
    <ellipse cx="12" cy="12" rx="5" ry="10" stroke={color} strokeWidth="1.5"/>
    <line x1="2" y1="12" x2="22" y2="12" stroke={color} strokeWidth="1.5"/>
  </svg>
);

interface VisitorCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: number;
  themeColors: {
    gradient: string;
    iconColor: string;
    titleColor: string;
  };
  loading?: boolean;
}

const VisitorCard: React.FC<VisitorCardProps> = ({
  icon,
  title,
  subtitle,
  value,
  themeColors,
  loading = false
}) => {
  return (
    <div className="w-full min-h-[64px] sm:min-h-[75px] lg:min-h-[81px] bg-gradient-to-r from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 rounded-xl shadow-sm flex items-center px-3 sm:px-4 gap-2.5 sm:gap-3 relative overflow-hidden transition-shadow hover:shadow-md active:scale-[0.98]">
      <div
        className="absolute w-[140px] h-[140px] sm:w-[198px] sm:h-[198px] -right-8 sm:-right-[37px] -top-16 sm:-top-[83px] rounded-full opacity-20 pointer-events-none"
        style={{ background: themeColors.gradient }}
      />
      <div className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 flex items-center justify-center z-10">
        {icon}
      </div>
      <div className="flex-1 flex flex-col justify-center min-w-0 z-10">
        <div
          className="font-medium text-sm sm:text-base leading-tight truncate font-poppins"
          style={{ color: themeColors.titleColor }}
        >
          {title}
        </div>
        <div className="text-xs font-normal text-gray-800 dark:text-gray-300 leading-tight mt-0.5 truncate font-poppins">
          {subtitle}
        </div>
      </div>
      <div className="text-xl sm:text-2xl lg:text-[28px] font-medium text-gray-900 dark:text-white leading-none flex-shrink-0 z-10 tabular-nums font-poppins">
        {loading ? <div className="w-10 h-7 sm:h-8 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" /> : value}
      </div>
    </div>
  );
};

interface BarChartProps {
  chartData: Array<{
    date: string;
    mobile: number;
    tablet: number;
    desktop: number;
  }>;
  loading?: boolean;
}

const BarChart: React.FC<BarChartProps> = ({ chartData, loading = false }) => {

  // Color gradients matching Figma
  const mobileGradient = 'linear-gradient(180deg, #38bdf8 1.829%, #1e90ff 100%)';
  const tabletGradient = 'linear-gradient(180deg, #ff9f1c 0%, #ff6a00 100%)';
  const desktopGradient = 'linear-gradient(180deg, #a08bff 0%, #5943ff 100%)';

  // Scale values to fit chart height (max 200px)
  const getBarHeight = (value: number, maxValue: number): number => {
    const minHeight = 40;
    const maxHeight = 193;
    if (maxValue === 0) return minHeight;
    return Math.max(minHeight, Math.min(maxHeight, (value / maxValue) * maxHeight));
  };

  const maxValue = Math.max(
    ...chartData.flatMap(d => [d.mobile, d.tablet, d.desktop])
  );

  // Format date (e.g., "Jan 25")
  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const day = date.getDate();
      return `${month} ${day}`;
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-gradient-to-r from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 rounded-xl shadow-sm p-4 sm:p-5 flex flex-col min-h-[200px] sm:min-h-[300px] items-center justify-center">
        <span className="text-sm text-gray-400 font-poppins">Loading chart data...</span>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="w-full bg-gradient-to-r from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 rounded-xl shadow-sm p-4 sm:p-5 flex flex-col">
        <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white mb-4 font-poppins">Visitor Analytics</h3>
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-r from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 rounded-xl shadow-sm p-3 sm:p-4 lg:p-5 flex flex-col">
      <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white mb-3 sm:mb-4 font-poppins">Visitor Analytics</h3>
      
      <div className="flex-1 relative flex flex-col items-center justify-end pt-6 sm:pt-8 lg:pt-10">
        {/* Y-axis label - hidden on very small screens */}
        <div className="hidden sm:block absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-gray-500 dark:text-gray-400 whitespace-nowrap font-['DM_Sans']">
          Units of measure
        </div>
        
        <div className="flex items-end justify-between w-full h-[140px] xs:h-[160px] sm:h-[180px] lg:h-[200px] gap-1 xs:gap-2 sm:gap-3 lg:gap-4 pl-2 sm:pl-8 lg:pl-10">
          {chartData.map((day, index) => (
            <div key={index} className="flex flex-col items-center gap-1 flex-1 min-w-0">
              <div className="flex items-end gap-px xs:gap-0.5 sm:gap-1">
                {/* Mobile bar */}
                <div className="relative w-2 xs:w-3 sm:w-4 lg:w-5 xl:w-6 rounded-t-sm overflow-hidden" style={{ height: `${Math.max(25, getBarHeight(day.mobile, maxValue) * 0.65)}px`, background: mobileGradient }}>
                  <div className="absolute left-1/2 top-1 -translate-x-1/2 -rotate-90 text-[7px] xs:text-[8px] sm:text-[10px] lg:text-xs font-semibold text-white whitespace-nowrap font-lato">
                    {day.mobile}
                  </div>
                </div>
                
                {/* Tablet bar */}
                <div className="relative w-2 xs:w-3 sm:w-4 lg:w-5 xl:w-6 rounded-t-sm overflow-hidden" style={{ height: `${Math.max(25, getBarHeight(day.tablet, maxValue) * 0.65)}px`, background: tabletGradient }}>
                  <div className="absolute left-1/2 top-1 -translate-x-1/2 -rotate-90 text-[7px] xs:text-[8px] sm:text-[10px] lg:text-xs font-semibold text-white whitespace-nowrap font-lato">
                    {day.tablet}
                  </div>
                </div>
                
                {/* Desktop bar */}
                <div className="relative w-2 xs:w-3 sm:w-4 lg:w-5 xl:w-6 rounded-t-sm overflow-hidden" style={{ height: `${Math.max(25, getBarHeight(day.desktop, maxValue) * 0.65)}px`, background: desktopGradient }}>
                  <div className="absolute left-1/2 top-1 -translate-x-1/2 -rotate-90 text-[7px] xs:text-[8px] sm:text-[10px] lg:text-xs font-semibold text-white whitespace-nowrap font-lato">
                    {day.desktop}
                  </div>
                </div>
              </div>
              
              <div className="text-[7px] xs:text-[8px] sm:text-[10px] lg:text-xs text-gray-500 dark:text-gray-400 font-['DM_Sans'] whitespace-nowrap">{formatDate(day.date)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend - responsive */}
      <div className="flex items-center justify-center gap-3 xs:gap-4 sm:gap-6 lg:gap-8 xl:gap-12 mt-3 sm:mt-4 lg:mt-5">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 rounded-full flex-shrink-0" style={{ background: mobileGradient }} />
          <span className="text-[9px] xs:text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 font-['DM_Sans']">Mobile View</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 rounded-full flex-shrink-0" style={{ background: tabletGradient }} />
          <span className="text-[9px] xs:text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 font-['DM_Sans']">Tab View</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 rounded-full flex-shrink-0" style={{ background: desktopGradient }} />
          <span className="text-[9px] xs:text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 font-['DM_Sans']">Desktop View</span>
        </div>
      </div>
    </div>
  );
};

interface FigmaVisitorStatsProps {
  visitorStats?: {
    onlineNow?: number;
    todayVisitors?: number;
    totalVisitors?: number;
    last7Days?: number;
    pageViews?: number;
    chartData?: Array<{
      date: string;
      mobile: number;
      tablet: number;
      desktop: number;
    }>;
  };
  tenantId?: string;
}

const FigmaVisitorStats: React.FC<FigmaVisitorStatsProps> = ({
  visitorStats,
  tenantId
}) => {
  const [stats, setStats] = useState({
    onlineNow: 0,
    todayVisitors: 0,
    totalVisitors: 0,
    last7Days: 0,
    pageViews: 0,
    chartData: [] as Array<{
      date: string;
      mobile: number;
      tablet: number;
      desktop: number;
    }>
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If stats are passed as props, use them
    if (visitorStats) {
      setStats({
        onlineNow: visitorStats.onlineNow || 0,
        todayVisitors: visitorStats.todayVisitors || 0,
        totalVisitors: visitorStats.totalVisitors || 0,
        last7Days: visitorStats.last7Days || 0,
        pageViews: visitorStats.pageViews || 0,
        chartData: visitorStats.chartData || []
      });
      setLoading(false);
      return;
    }

    // Fetch from API
    const fetchStats = async () => {
      const activeTenantId = tenantId || localStorage.getItem('activeTenantId');
      if (!activeTenantId) {
        setLoading(false);
        return;
      }

      try {
        const apiUrl = API_BASE;
        
        // Fetch stats and online count in parallel
        const [statsRes, onlineRes] = await Promise.all([
          fetch(`${apiUrl}/api/visitors/${activeTenantId}/stats?period=7d`, { headers: getAuthHeader() }),
          fetch(`${apiUrl}/api/visitors/${activeTenantId}/online`, { headers: getAuthHeader() })
        ]);

        if (statsRes.ok && onlineRes.ok) {
          const statsData = await statsRes.json();
          const onlineData = await onlineRes.json();

          setStats({
            onlineNow: onlineData.online || 0,
            todayVisitors: statsData.todayVisitors || 0,
            totalVisitors: statsData.totalVisitors || 0,
            last7Days: statsData.periodVisitors || 0,
            pageViews: statsData.totalPageViews || 0,
            chartData: statsData.chartData || []
          });
        }
      } catch (error) {
        console.error('Error fetching visitor stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // Refresh online count every 30 seconds
    const interval = setInterval(async () => {
      const activeTenantId = tenantId || localStorage.getItem('activeTenantId');
      if (!activeTenantId) return;
      
      try {
        const apiUrl = API_BASE;
        const onlineRes = await fetch(`${apiUrl}/api/visitors/${activeTenantId}/online`, { headers: getAuthHeader() });
        if (onlineRes.ok) {
          const onlineData = await onlineRes.json();
          setStats(prev => ({ ...prev, onlineNow: onlineData.online || 0 }));
        }
      } catch (error) {
        console.error('Error refreshing online count:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [visitorStats, tenantId]);

  const blueTheme = {
    gradient: 'radial-gradient(circle at 50% 50%, #38bdf8 0%, #1e90ff 100%)',
    iconColor: '#38bdf8',
    titleColor: '#008dff'
  };

  const orangeTheme = {
    gradient: 'radial-gradient(circle at 50% 50%, #ff9f1c 0%, #ff6a00 100%)',
    iconColor: '#ff6a00',
    titleColor: '#f50'
  };

  const purpleTheme = {
    gradient: 'radial-gradient(circle at 50% 50%, #a08bff 0%, #5943ff 100%)',
    iconColor: '#5943ff',
    titleColor: '#3f34be'
  };

  return (
    <div className="w-full font-poppins grid grid-cols-1 lg:grid-cols-[minmax(280px,340px)_1fr] xl:grid-cols-[372px_1fr] gap-3 sm:gap-4 lg:gap-5">
      {/* Left: Visitor Cards */}
      <div className="flex flex-col gap-2.5 sm:gap-3 lg:gap-[14px]">
        <VisitorCard
          icon={<OnlineNowIcon color={blueTheme.iconColor} />}
          title="Online Now"
          subtitle="Active visitors on site"
          value={stats.onlineNow}
          themeColors={blueTheme}
          loading={loading}
        />
        
        <VisitorCard
          icon={<TodayVisitorsIcon color={orangeTheme.iconColor} />}
          title="Today visitors"
          subtitle={`Last 7 days: ${stats.last7Days}`}
          value={stats.todayVisitors}
          themeColors={orangeTheme}
          loading={loading}
        />
        
        <VisitorCard
          icon={<TotalVisitorsIcon color={purpleTheme.iconColor} />}
          title="Total visitors"
          subtitle={`${stats.pageViews} page view`}
          value={stats.totalVisitors}
          themeColors={purpleTheme}
          loading={loading}
        />
      </div>

      {/* Right: Bar Chart */}
      <BarChart chartData={stats.chartData} loading={loading} />
    </div>
  );
};

export default FigmaVisitorStats;
