import React, { useEffect, useState } from 'react';
import { getAuthHeader } from '../../services/authService';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// === SVG Icons matching Figma design ===
const OnlineNowIcon = ({ color }: { color: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="2" fill={color} />
    <path d="M8 8C9.1 6.9 10.5 6.3 12 6.3C13.5 6.3 14.9 6.9 16 8" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M4 4C6.2 1.8 9.1 0.5 12 0.5C14.9 0.5 17.8 1.8 20 4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const TodayVisitorsIcon = ({ color }: { color: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="9" cy="7" r="4" stroke={color} strokeWidth="1.5"/>
    <path d="M23 21V19C22.9992 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TotalVisitorsIcon = ({ color }: { color: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5"/>
    <ellipse cx="12" cy="12" rx="5" ry="10" stroke={color} strokeWidth="1.5"/>
    <line x1="2" y1="12" x2="22" y2="12" stroke={color} strokeWidth="1.5"/>
  </svg>
);

// === Visitor Card ===
const VisitorCard = ({ icon, title, subtitle, value, bgColor, iconColor, titleColor, loading, onClick }: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: number;
  bgColor: string;
  iconColor: string;
  titleColor: string;
  loading?: boolean;
  onClick?: () => void;
}) => (
  <div
    className={`relative w-full h-[81px] lg:h-full rounded-2xl shadow-sm flex items-center px-4 sm:px-5 gap-3 sm:gap-4 overflow-hidden transition-all duration-200 hover:shadow-md active:scale-[0.98] lg:min-h-0 ${onClick ? 'cursor-pointer' : ''}`}
    style={{ backgroundColor: bgColor }}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
  >
    <div
      className="absolute w-[160px] h-[160px] rounded-full opacity-10 pointer-events-none"
      style={{
        background: `radial-gradient(circle, ${iconColor} 0%, transparent 70%)`,
        right: '-30px',
        top: '-50px'
      }}
    />
    <div className="w-[34px] h-[34px] sm:w-[40px] sm:h-[40px] flex items-center justify-center z-10 shrink-0 bg-white/40 rounded-lg">
      {icon}
    </div>
    <div className="flex-1 z-10 min-w-0">
      <div className="font-bold text-sm sm:text-base leading-tight truncate" style={{ color: titleColor }}>
        {title}
      </div>
      <div className="text-[11px] sm:text-[13px] text-gray-600 dark:text-gray-400 leading-tight mt-0.5 truncate opacity-80">
        {subtitle}
      </div>
    </div>
    <div className="text-xl sm:text-[28px] font-bold text-[#161719] dark:text-white z-10 ml-2 tabular-nums">
      {loading ? (
        <div className="w-10 h-8 bg-black/5 dark:bg-white/10 animate-pulse rounded" />
      ) : (
        value.toLocaleString()
      )}
    </div>
  </div>
);

// === Traffic Chart Section (Responsive Figma Design) ===
const TrafficChartSection = ({ chartData, loading }: { chartData: any[]; loading: boolean }) => {
  const legendItems = [
    { color: "bg-[linear-gradient(90deg,rgba(56,189,248,1)_0%,rgba(30,144,255,1)_100%)]", label: "Mobile View" },
    { color: "bg-[linear-gradient(180deg,rgba(255,106,0,1)_0%,rgba(255,159,28,1)_100%)]", label: "Tab View" },
    { color: "bg-[linear-gradient(180deg,rgba(160,139,255,1)_0%,rgba(89,67,255,1)_100%)]", label: "Desktop View" },
  ];

  // Calculate dynamic heights based on max value
  const maxValue = Math.max(...chartData.flatMap(d => [d.mobile, d.tab, d.desktop]), 1);
  const getHeight = (value: number) => {
    const minHeight = 60;
    const maxHeight = 160;
    return Math.max(minHeight, Math.min(maxHeight, (value / maxValue) * maxHeight));
  };

  return (
    <div className="relative w-full h-[220px] sm:h-[250px] lg:h-[273px] bg-white dark:bg-gray-800 rounded-lg overflow-hidden p-3 sm:p-4">
      {loading ? (
        <div className="h-full w-full flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-slate-100 border-t-slate-400 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="h-full flex flex-col">
          {/* Chart Area */}
          <div className="flex-1 flex items-end justify-between gap-2 pb-2 relative">
            {/* Y-axis label */}
            <div className="absolute -left-1 sm:-left-2 top-1/2 -translate-y-1/2 -rotate-90 hidden sm:block">
              <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap">
                Units of measure
              </span>
            </div>

            {/* Y-axis line */}
            <div className="absolute left-4 sm:left-8 top-0 bottom-8 w-px bg-gray-200 dark:bg-gray-600" />

            {/* Chart bars */}
            <div className="flex-1 flex items-end justify-around gap-0.5 xs:gap-1 sm:gap-2 pl-6 sm:pl-10 lg:pl-12 pr-1 sm:pr-2 h-[140px] sm:h-[160px] lg:h-[180px]">
              {chartData.map((data, index) => (
                <div key={index} className="flex flex-col items-center justify-end flex-1 min-w-0 max-w-[60px] sm:max-w-[80px]">
                  <div className="flex items-end gap-px xs:gap-0.5 sm:gap-1 mb-1">
                    {/* Mobile bar */}
                    <div 
                      className="relative w-2 xs:w-3 sm:w-4 bg-[linear-gradient(180deg,rgba(56,189,248,1)_0%,rgba(30,144,255,1)_100%)] rounded-t-sm"
                      style={{ height: `${getHeight(data.mobile)}px` }}
                    >
                      <div className="text-center absolute top-1 left-1/2 -translate-x-1/2 -rotate-90 text-white text-[7px] xs:text-[8px] sm:text-[10px] font-semibold whitespace-nowrap">
                        {data.mobile}
                      </div>
                    </div>

                    {/* Tablet bar */}
                    <div 
                      className="relative w-2 xs:w-3 sm:w-4 bg-[linear-gradient(180deg,rgba(255,159,28,1)_0%,rgba(255,106,0,1)_100%)] rounded-t-sm"
                      style={{ height: `${getHeight(data.tab)}px` }}
                    >
                      <div className="text-center absolute top-1 left-1/2 -translate-x-1/2 -rotate-90 text-white text-[7px] xs:text-[8px] sm:text-[10px] font-semibold whitespace-nowrap">
                        {data.tab}
                      </div>
                    </div>

                    {/* Desktop bar */}
                    <div 
                      className="relative w-2 xs:w-3 sm:w-4 bg-[linear-gradient(180deg,rgba(160,139,255,1)_0%,rgba(89,67,255,1)_100%)] rounded-t-sm"
                      style={{ height: `${getHeight(data.desktop)}px` }}
                    >
                      <div className="text-center absolute top-1 left-1/2 -translate-x-1/2 -rotate-90 text-white text-[7px] xs:text-[8px] sm:text-[10px] font-semibold whitespace-nowrap">
                        {data.desktop}
                      </div>
                    </div>
                  </div>

                  {/* Date label */}
                  <div className="text-[7px] xs:text-[8px] sm:text-[9px] text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
                    {data.date}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-3 xs:gap-4 sm:gap-6 pt-2 sm:pt-3 border-t border-gray-100 dark:border-gray-700">
            {legendItems.map((item, index) => (
              <div key={index} className="flex items-center gap-1 xs:gap-1.5 sm:gap-2">
                <div className={`w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 rounded-full flex-shrink-0 ${item.color}`} />
                <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// === Main Component ===
interface VisitorAnalyticsProps {
  tenantId?: string;
  onNavigate?: (page: string) => void;
}

export const VisitorAnalytics: React.FC<VisitorAnalyticsProps> = ({ tenantId, onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ onlineNow: 0, todayVisitors: 0, totalVisitors: 0, last7Days: 0, pageViews: 0 });
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
          fetch(`${apiUrl}/api/visitors/${activeTenantId}/stats?period=7d`, { headers: getAuthHeader() }),
          fetch(`${apiUrl}/api/visitors/${activeTenantId}/online`, { headers: getAuthHeader() })
        ]);

        if (statsRes.ok && onlineRes.ok) {
          const statsData = await statsRes.json();
          const onlineData = await onlineRes.json();

          setStats({
            onlineNow: onlineData.online || 0,
            todayVisitors: statsData.today || 0,
            totalVisitors: statsData.total || 0,
            last7Days: statsData.last7Days || 0,
            pageViews: statsData.pageViews || 0
          });

          if (statsData.chartData && Array.isArray(statsData.chartData)) {
            setChartData(statsData.chartData.map((item: any) => ({
              date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              mobile: item.mobile || 0,
              tab: item.tablet || item.tab || 0,
              desktop: item.desktop || 0
            })));
          } else {
            setChartData(Array.from({ length: 7 }, (_, i) => {
              const d = new Date();
              d.setDate(d.getDate() - (6 - i));
              return { date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), mobile: 0, tab: 0, desktop: 0 };
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching visitor data:', error);
        setChartData(Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return { date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), mobile: 0, tab: 0, desktop: 0 };
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchVisitorData();

    // Refresh online count every 30 seconds
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

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-3 lg:gap-4">
      {/* Left: Visitor Stat Cards */}
      <section className="lg:col-span-4 flex flex-row lg:flex-col gap-2 sm:gap-3 lg:gap-4 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
        <div className="flex-1 min-w-[160px] sm:min-w-0">
          <VisitorCard
            icon={<OnlineNowIcon color="#0EA5E9" />}
            title="Online Now"
            subtitle="Active visitors browsing right now"
            value={stats.onlineNow}
            bgColor="rgba(14, 165, 233, 0.08)"
            iconColor="#0EA5E9"
            titleColor="#0369A1"
            loading={loading}
            onClick={onNavigate ? () => onNavigate('online_now') : undefined}
          />
        </div>
        <div className="flex-1 min-w-[160px] sm:min-w-0">
          <VisitorCard
            icon={<TodayVisitorsIcon color="#F97316" />}
            title="Today Visitors"
            subtitle={`Last 7 days avg: ${Math.round(stats.last7Days / 7)}`}
            value={stats.todayVisitors}
            bgColor="rgba(249, 115, 22, 0.08)"
            iconColor="#F97316"
            titleColor="#C2410C"
            loading={loading}
          />
        </div>
        <div className="flex-1 min-w-[160px] sm:min-w-0">
          <VisitorCard
            icon={<TotalVisitorsIcon color="#6366F1" />}
            title="Total Visitors"
            subtitle={`${(stats.pageViews / 1000).toFixed(1)}k cumulative views`}
            value={stats.totalVisitors}
            bgColor="rgba(99, 102, 241, 0.08)"
            iconColor="#6366F1"
            titleColor="#4338CA"
            loading={loading}
          />
        </div>
      </section>

      {/* Right: Traffic Chart (Figma Design) */}
      <div className="lg:col-span-8 min-w-0 w-full">
        <TrafficChartSection chartData={chartData} loading={loading} />
      </div>
    </div>
  );
};

export default VisitorAnalytics;
