import React, { useEffect, useState } from "react";
import { getAuthHeader } from '../../services/authService';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

interface FigmaAnalyticsChartProps {
  tenantId?: string;
  onNavigate?: (page: string) => void;
}

/**
 * Main App Component
 * Displays a combined view of Visitor Statistics and Traffic Charts.
 */
const FigmaAnalyticsChart: React.FC<FigmaAnalyticsChartProps> = ({ tenantId, onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    onlineNow: 0, 
    todayVisitors: 0, 
    totalVisitors: 0, 
    last7Days: 0, 
    pageViews: 0 
  });
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const activeTenantId = tenantId || localStorage.getItem('activeTenantId');
    if (!activeTenantId) {
      setLoading(false);
      return;
    }

    const fetchVisitorData = async () => {
      try {
        setLoading(true);
        const apiUrl = API_BASE;

        const [statsRes, onlineRes] = await Promise.all([
          fetch(`${apiUrl}/api/visitors/${activeTenantId}/stats?period=30d`, { headers: getAuthHeader() }),
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
            pageViews: statsData.totalPageViews || 0
          });

          // Build last 8 days array, filling gaps with zeros
          const last8DaysArr: any[] = [];
          for (let i = 7; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
            const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const found = (statsData.chartData || []).find((c: any) => c.date === dateStr);
            last8DaysArr.push({
              date: label,
              mobile: found?.mobile || 0,
              tab: found?.tablet || found?.tab || 0,
              desktop: found?.desktop || 0,
            });
          }
          const maxVal = Math.max(...last8DaysArr.map((d: any) => Math.max(d.desktop, d.mobile, d.tab)), 1);
          setChartData(last8DaysArr.map(item => ({
            ...item,
            desktopHeight: Math.max(82, Math.min(193, (item.desktop / maxVal) * 193)),
            mobileHeight: Math.max(50, Math.min(120, (item.mobile / maxVal) * 120)),
            tabHeight: Math.max(60, Math.min(150, (item.tab / maxVal) * 150)),
          })));
        }
      } catch (error) {
        console.error('Error fetching visitor data:', error);
        const fallback: any[] = [];
        for (let i = 7; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          fallback.push({ date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), mobile: 0, tab: 0, desktop: 0, desktopHeight: 82, mobileHeight: 50, tabHeight: 60 });
        }
        setChartData(fallback);
      } finally {
        setLoading(false);
      }
    };

    fetchVisitorData();

    const interval = setInterval(async () => {
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
  }, [tenantId]);

  const statsData = [
    {
      id: "online-now",
      title: "Online Now",
      subtitle: "Active visitors on site",
      value: stats.onlineNow.toString(),
      icon: "https://c.animaapp.com/9ijsMV30/img/fluent-live-24-regular.svg",
      iconAlt: "Fluent live",
      titleColor: "#008cff",
      bgGradient: "bg-[linear-gradient(0deg,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0.95)_100%),linear-gradient(0deg,rgba(136,201,255,1)_0%,rgba(136,201,255,1)_100%)]",
      decorativeCircleBg: "bg-[#008cff36]",
    },
    {
      id: "today-visitors",
      title: "Today visitors",
      subtitle: `Last 7 days: ${Math.round(stats.last7Days / 7)}`,
      value: stats.todayVisitors.toString(),
      icon: "https://c.animaapp.com/9ijsMV30/img/fluent-people-community-20-regular.svg",
      iconAlt: "Fluent people",
      titleColor: "#ff5500",
      bgGradient: "bg-[linear-gradient(0deg,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0.95)_100%),linear-gradient(0deg,rgba(255,195,136,1)_0%,rgba(255,195,136,1)_100%)]",
      decorativeCircleBg: "bg-[#ff7d0042]",
    },
    {
      id: "total-visitors",
      title: "Total visitors",
      subtitle: `${(stats.pageViews / 1000).toFixed(1)}k page view`,
      value: stats.totalVisitors.toString(),
      icon: "https://c.animaapp.com/9ijsMV30/img/streamline-plump-web.svg",
      iconAlt: "Streamline plump web",
      titleColor: "#3f34be",
      bgGradient: "bg-[linear-gradient(0deg,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0.95)_100%),linear-gradient(0deg,rgba(162,136,255,1)_0%,rgba(162,136,255,1)_100%)]",
      decorativeCircleBg: "bg-[linear-gradient(180deg,rgba(55,0,251,0.21)_0%,rgba(33,0,149,0.21)_100%)]",
    },
  ];

  const legendItems = [
    { color: "bg-[linear-gradient(90deg,rgba(56,189,248,1)_0%,rgba(30,144,255,1)_100%)]", label: "Mobile View" },
    { color: "bg-[linear-gradient(180deg,rgba(255,106,0,1)_0%,rgba(255,159,28,1)_100%)]", label: "Tab View" },
    { color: "bg-[linear-gradient(180deg,rgba(160,139,255,1)_0%,rgba(89,67,255,1)_100%)]", label: "Desktop View" },
  ];

  if (loading && chartData.length === 0) {
    return (
      <div className="w-full">
        <div className="flex w-full items-center bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-sm">
          <div className="w-full h-[200px] sm:h-[273px] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-slate-100 border-t-slate-400 rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col lg:flex-row w-full items-stretch gap-2.5 sm:gap-3 lg:gap-4 bg-white dark:bg-gray-800 p-2.5 sm:p-3 lg:p-4 rounded-xl">
        {/* Visitor Stats Section - responsive width */}
        <section className="flex flex-row lg:flex-col gap-2 sm:gap-3 lg:gap-[15px] flex-shrink-0 lg:w-[340px] xl:w-[372px] overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
          {statsData.map((stat) => {
            const isClickable = stat.id === 'online-now' && !!onNavigate;
            return (
            <article
              key={stat.id}
              className={`relative flex-1 lg:flex-1 min-w-[160px] sm:min-w-0 rounded-lg overflow-hidden shadow-[0px_2px_4px_#0000000d] ${stat.bgGradient} transition-shadow hover:shadow-md active:scale-[0.98] ${isClickable ? 'cursor-pointer' : ''}`}
              onClick={isClickable ? () => onNavigate('online_now') : undefined}
              role={isClickable ? 'button' : undefined}
              tabIndex={isClickable ? 0 : undefined}
              onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate('online_now'); } } : undefined}
            >
              <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 lg:p-3 min-h-[60px] sm:min-h-[70px] lg:min-h-[75px]">
                <div
                  className={`${stat.decorativeCircleBg} absolute -top-16 -right-4 sm:-top-20 sm:right-auto sm:left-[200px] lg:left-[237px] w-[140px] h-[140px] sm:w-[198px] sm:h-[198px] rounded-full pointer-events-none`}
                />

                <img
                  className="w-7 h-7 sm:w-[34px] sm:h-[34px] lg:w-[38px] lg:h-[38px] flex-shrink-0 z-10"
                  alt={stat.iconAlt}
                  src={stat.icon}
                />

                <div className="flex-1 min-w-0 z-10">
                  <h3
                    className="font-medium text-xs sm:text-sm lg:text-base leading-tight truncate font-poppins"
                    style={{ color: stat.titleColor }}
                  >
                    {stat.title}
                  </h3>
                  <p className="font-normal text-black dark:text-gray-300 text-[10px] sm:text-xs leading-tight truncate font-poppins">
                    {stat.subtitle}
                  </p>
                </div>

                <div
                  className="font-medium text-black dark:text-white text-lg sm:text-xl lg:text-2xl flex-shrink-0 z-10 tabular-nums font-poppins"
                >
                  {stat.value}
                </div>
              </div>
            </article>
            );
          })}
        </section>

        {/* Traffic Chart Section - takes remaining width */}
        <div className="relative flex-1 min-w-0 h-[200px] sm:h-[230px] lg:h-[250px] bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-slate-100 dark:border-gray-700 p-1.5 sm:p-2.5 lg:p-3">
          {/* Y-axis label - hidden on very small screens */}
          <div className="hidden sm:flex absolute left-0 top-0 bottom-8 items-center">
            <div className="rotate-[-90deg] font-normal text-slate-400 dark:text-gray-500 text-[10px] whitespace-nowrap font-['DM_Sans']">
              Units of measure
            </div>
            <div className="h-full w-px bg-slate-200 dark:bg-gray-600 ml-1" />
          </div>

          {/* Chart bars - fully responsive */}
          <div className="flex items-end justify-between h-[calc(100%-40px)] pl-2 sm:pl-8 lg:pl-10 pr-1 sm:pr-2 pt-2 gap-0.5 xs:gap-1 sm:gap-2">
            {chartData.map((data, index) => (
              <div
                key={index}
                className="flex flex-col items-center justify-end gap-0.5 sm:gap-1 flex-1 min-w-0"
              >
                <div className="flex items-end gap-px xs:gap-0.5 sm:gap-1 w-full justify-center">
                  <div className="w-2 xs:w-3 sm:w-4 lg:w-5 xl:w-6 bg-[linear-gradient(180deg,rgba(56,189,248,1)_0%,rgba(30,144,255,1)_100%)] rounded-t-sm relative" style={{ height: `${Math.max(20, (data.mobileHeight || 82) * 0.6)}px` }}>
                    <div className="text-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 font-semibold text-white text-[7px] xs:text-[8px] sm:text-[10px] whitespace-nowrap font-lato">
                      {data.mobile}
                    </div>
                  </div>

                  <div className="w-2 xs:w-3 sm:w-4 lg:w-5 xl:w-6 bg-[linear-gradient(180deg,rgba(255,159,28,1)_0%,rgba(255,106,0,1)_100%)] rounded-t-sm relative" style={{ height: `${Math.max(20, (data.tabHeight || 60) * 0.6)}px` }}>
                    <div className="text-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 font-semibold text-white text-[7px] xs:text-[8px] sm:text-[10px] whitespace-nowrap font-lato">
                      {data.tab}
                    </div>
                  </div>

                  <div className="w-2 xs:w-3 sm:w-4 lg:w-5 xl:w-6 bg-[linear-gradient(180deg,rgba(160,139,255,1)_0%,rgba(89,67,255,1)_100%)] rounded-t-sm relative" style={{ height: `${Math.max(20, (data.desktopHeight || 82) * 0.6)}px` }}>
                    <div className="text-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 font-semibold text-white text-[7px] xs:text-[8px] sm:text-[10px] whitespace-nowrap font-lato">
                      {data.desktop}
                    </div>
                  </div>
                </div>

                <div className="font-normal text-slate-400 dark:text-gray-500 text-[7px] xs:text-[8px] sm:text-[10px] whitespace-nowrap font-['DM_Sans']">
                  {data.date}
                </div>
              </div>
            ))}
          </div>

          {/* Legend - responsive positioning */}
          <div className="flex items-center justify-center gap-3 xs:gap-4 sm:gap-6 lg:gap-8 xl:gap-12 absolute bottom-1 sm:bottom-2 left-0 right-0">
            {legendItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-1 xs:gap-1.5 sm:gap-2"
              >
                <div className={`w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 rounded-full flex-shrink-0 ${item.color}`} />
                <span className="font-medium text-slate-500 dark:text-gray-400 text-[8px] xs:text-[9px] sm:text-[10px] whitespace-nowrap font-['DM_Sans']">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FigmaAnalyticsChart;
