import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Building2, DollarSign, ShoppingCart, Users, PieChart,
  Plus, Filter, UserPlus, Download, RefreshCw, Mail, Shield,
  Eye, Edit, ExternalLink, Crown, Rocket, Search, Loader2
} from 'lucide-react';
import StatsCard from './StatsCard';
import ServerMetric from './ServerMetric';
import QuickActionButton from './QuickActionButton';
import { SystemStats, TenantStats, Activity } from './types';
import { getPrimaryDomain, getApiUrl } from '../../utils/appHelpers';
import { getAuthHeader } from '../../services/authService';
import { formatCurrency, getPlanBadge, getStatusBadge } from './utils';
import { toast } from 'react-hot-toast';

interface OverviewTabProps {
  systemStats: SystemStats;
  topTenants: TenantStats[];
  recentActivities: Activity[];
  onViewAllTenants: () => void;
  onAddTenant?: () => void;
  onAddUser?: () => void;
  onBroadcast?: () => void;
  onSecurity?: () => void;
  onViewTenant?: (tenantId: string) => void;
  onEditTenant?: (tenantId: string) => void;
}

interface DashboardStatsData {
  totalTenants: number;
  activeTenants: number;
  tenantsChange: number;
  totalOrders: number;
  ordersChange: number;
  totalUsers: number;
  usersChange: number;
  subscriptionDistribution: Record<string, number>;
}

interface ServerStatus {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  uptime: string;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  systemStats,
  topTenants,
  recentActivities,
  onViewAllTenants,
  onAddTenant,
  onAddUser,
  onBroadcast,
  onSecurity,
  onViewTenant,
  onEditTenant
}) => {
  const API_URL = getApiUrl();
  // Base URL for non-API endpoints (e.g., /health)
  const BASE_URL = API_URL.replace(/\/api\/?$/, '');
  const [dashboardStats, setDashboardStats] = useState<DashboardStatsData | null>(null);
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isFlushing, setIsFlushing] = useState(false);

  // Fetch dashboard stats from backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_URL}/tenants/dashboard-stats`, {
          headers: getAuthHeader()
        });
        if (response.ok) {
          const result = await response.json();
          setDashboardStats(result.data);
        }
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
      }
    };
    fetchStats();
  }, [API_URL]);

  // Fetch server status from health endpoint
  useEffect(() => {
    const fetchServerStatus = async () => {
      try {
        const response = await fetch(`${BASE_URL}/health`);
        if (response.ok) {
          const result = await response.json();
          if (result.server) {
            setServerStatus(result.server);
          }
        }
      } catch (error) {
        console.error('Failed to load server status:', error);
      }
    };
    fetchServerStatus();
    // Refresh server status every 30 seconds
    const interval = setInterval(fetchServerStatus, 30000);
    return () => clearInterval(interval);
  }, [API_URL]);

  // Determine values: use API data when available, fall back to props
  const displayStats = useMemo(() => {
    if (dashboardStats) {
      return {
        totalTenants: dashboardStats.totalTenants,
        activeTenants: dashboardStats.activeTenants,
        tenantsChange: dashboardStats.tenantsChange,
        totalOrders: dashboardStats.totalOrders,
        ordersChange: dashboardStats.ordersChange,
        totalUsers: dashboardStats.totalUsers,
        usersChange: dashboardStats.usersChange,
      };
    }
    return {
      totalTenants: systemStats.totalTenants,
      activeTenants: systemStats.activeTenants,
      tenantsChange: 0,
      totalOrders: systemStats.totalOrders,
      ordersChange: 0,
      totalUsers: systemStats.totalUsers,
      usersChange: 0,
    };
  }, [dashboardStats, systemStats]);

  // Subscription distribution for pie chart
  const planData = useMemo(() => {
    const dist = dashboardStats?.subscriptionDistribution || { starter: 0, growth: 0, enterprise: 0 };
    const total = Object.values(dist).reduce((sum, n) => sum + n, 0) || 1;
    return {
      enterprise: { count: dist.enterprise || 0, pct: Math.round(((dist.enterprise || 0) / total) * 100) },
      growth: { count: dist.growth || 0, pct: Math.round(((dist.growth || 0) / total) * 100) },
      starter: { count: dist.starter || 0, pct: Math.round(((dist.starter || 0) / total) * 100) },
      total
    };
  }, [dashboardStats]);

  // Server status: use API data or fallback to systemStats
  const server = useMemo(() => {
    if (serverStatus) return serverStatus;
    return {
      cpuUsage: systemStats.serverLoad,
      memoryUsage: systemStats.memoryUsage,
      diskUsage: systemStats.diskUsage,
      uptime: systemStats.uptime,
    };
  }, [serverStatus, systemStats]);

  // Determine if all systems are operational
  const allSystemsOk = server.cpuUsage < 85 && server.memoryUsage < 90 && server.diskUsage < 85;

  // SVG pie chart calculation
  const circumference = 2 * Math.PI * 40; // r=40
  const enterpriseArc = (planData.enterprise.pct / 100) * circumference;
  const growthArc = (planData.growth.pct / 100) * circumference;
  const starterArc = (planData.starter.pct / 100) * circumference;

  // Filter tenants by search query
  const filteredTenants = useMemo(() => {
    if (!searchQuery.trim()) return topTenants;
    const q = searchQuery.toLowerCase();
    return topTenants.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.subdomain.toLowerCase().includes(q) ||
      t.plan.toLowerCase().includes(q) ||
      t.status.toLowerCase().includes(q)
    );
  }, [topTenants, searchQuery]);

  // Export tenants as CSV
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`${API_URL}/tenants/export`, {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tenants-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success('Tenant list exported successfully');
      } else {
        toast.error('Failed to export tenants');
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export tenants');
    } finally {
      setIsExporting(false);
    }
  }, [API_URL]);

  // Flush cache
  const handleFlushCache = useCallback(async () => {
    setIsFlushing(true);
    try {
      const response = await fetch(`${BASE_URL}/health/cache/flush`, {
        method: 'POST',
        headers: getAuthHeader()
      });
      if (response.ok) {
        const result = await response.json();
        toast.success(`Cache flushed: ${result.data?.l1Cleared || 0} memory entries cleared`);
      } else {
        toast.error('Failed to flush cache');
      }
    } catch (error) {
      console.error('Cache flush failed:', error);
      toast.error('Failed to flush cache');
    } finally {
      setIsFlushing(false);
    }
  }, [API_URL]);

  // Visit tenant subdomain
  const handleVisitTenant = useCallback((subdomain: string) => {
    const domain = getPrimaryDomain();
    const url = domain ? `https://${subdomain}.${domain}` : `http://${subdomain}.localhost:3000`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
        <StatsCard
          title="Total Tenants"
          value={displayStats.totalTenants}
          change={displayStats.tenantsChange}
          changeType={displayStats.tenantsChange >= 0 ? 'increase' : 'decrease'}
          icon={Building2}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          subtitle={`${displayStats.activeTenants} active`}
        />
        <StatsCard
          title="Monthly Revenue"
          value={formatCurrency(systemStats.monthlyRevenue)}
          change={0}
          changeType="increase"
          icon={DollarSign}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          subtitle="Coming soon"
        />
        <StatsCard
          title="Total Orders"
          value={displayStats.totalOrders.toLocaleString()}
          change={displayStats.ordersChange}
          changeType={displayStats.ordersChange >= 0 ? 'increase' : 'decrease'}
          icon={ShoppingCart}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          subtitle="All tenants"
        />
        <StatsCard
          title="Active Users"
          value={displayStats.totalUsers.toLocaleString()}
          change={displayStats.usersChange}
          changeType={displayStats.usersChange >= 0 ? 'increase' : 'decrease'}
          icon={Users}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          subtitle="Last 7 days"
        />
      </div>

      {/* Pie Chart & Server Status Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
        {/* Subscription Distribution Pie Chart */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Subscription Distribution</h3>
            <PieChart className="w-5 h-5 text-slate-400" />
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            {/* SVG Pie Chart */}
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {/* Enterprise */}
                <circle
                  cx="50" cy="50" r="40"
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth="20"
                  strokeDasharray={`${enterpriseArc} ${circumference}`}
                  strokeDashoffset="0"
                  className="transition-all duration-500"
                />
                {/* Growth */}
                <circle
                  cx="50" cy="50" r="40"
                  fill="transparent"
                  stroke="#14b8a6"
                  strokeWidth="20"
                  strokeDasharray={`${growthArc} ${circumference}`}
                  strokeDashoffset={`${-enterpriseArc}`}
                  className="transition-all duration-500"
                />
                {/* Starter */}
                <circle
                  cx="50" cy="50" r="40"
                  fill="transparent"
                  stroke="#334155"
                  strokeWidth="20"
                  strokeDasharray={`${starterArc} ${circumference}`}
                  strokeDashoffset={`${-(enterpriseArc + growthArc)}`}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl sm:text-2xl font-bold text-slate-900">{planData.total}</span>
                <span className="text-xs text-slate-500">Total</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-row sm:flex-col gap-3 sm:gap-4 flex-wrap justify-center">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-slate-700">Enterprise</p>
                  <p className="text-xs text-slate-500">{planData.enterprise.pct}% ({planData.enterprise.count})</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-teal-500"></span>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-slate-700">Growth</p>
                  <p className="text-xs text-slate-500">{planData.growth.pct}% ({planData.growth.count})</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-600"></span>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-slate-700">Starter</p>
                  <p className="text-xs text-slate-500">{planData.starter.pct}% ({planData.starter.count})</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Server Status */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Server Status</h3>
            <span className={`flex items-center gap-2 text-xs sm:text-sm ${allSystemsOk ? 'text-emerald-600' : 'text-amber-600'}`}>
              <span className={`w-2 h-2 rounded-full animate-pulse ${allSystemsOk ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              <span className="hidden sm:inline">{allSystemsOk ? 'All Systems Operational' : 'Degraded Performance'}</span>
              <span className="sm:hidden">{allSystemsOk ? 'Online' : 'Degraded'}</span>
            </span>
          </div>
          
          <div className="space-y-3 sm:space-y-4">
            <ServerMetric label="CPU Usage" value={server.cpuUsage} color="violet" />
            <ServerMetric label="Memory" value={server.memoryUsage} color="blue" />
            <ServerMetric label="Disk Space" value={server.diskUsage} color="emerald" />
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs sm:text-sm text-slate-600">Uptime</span>
              <span className="text-xs sm:text-sm font-semibold text-slate-900">{server.uptime || systemStats.uptime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-4 sm:mb-6 text-sm sm:text-base">Quick Actions</h3>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <QuickActionButton icon={Plus} label="Add Tenant" color="violet" onClick={onAddTenant} />
            <QuickActionButton icon={UserPlus} label="Add User" color="blue" onClick={onAddUser} />
            <QuickActionButton icon={isExporting ? Loader2 : Download} label="Export" color="emerald" onClick={handleExport} />
            <QuickActionButton icon={isFlushing ? Loader2 : RefreshCw} label="Cache" color="amber" onClick={handleFlushCache} />
            <QuickActionButton icon={Mail} label="Broadcast" color="pink" onClick={onBroadcast} />
            <QuickActionButton icon={Shield} label="Security" color="red" onClick={onSecurity} />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Recent Activity</h3>
            <button className="text-xs sm:text-sm text-emerald-600 hover:text-emerald-700 font-medium">View All</button>
          </div>
          <div className="space-y-3 sm:space-y-4 max-h-64 overflow-y-auto">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No recent activity</p>
            ) : (
              recentActivities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-start gap-2 sm:gap-3">
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    activity.type === 'alert' ? 'bg-amber-100 text-amber-600' :
                    activity.type === 'payment' ? 'bg-emerald-100 text-emerald-600' :
                    activity.type === 'upgrade' ? 'bg-emerald-100 text-emerald-600' :
                    'bg-slate-700 text-slate-300'
                  }`}>
                    <activity.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-slate-700 truncate">{activity.message}</p>
                    <p className="text-[10px] sm:text-xs text-slate-400">{activity.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Top Tenants Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Top Performing Tenants</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">Based on revenue and orders</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search tenants..."
                  className="pl-8 pr-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-36 sm:w-48"
                />
              </div>
              <button 
                onClick={onAddTenant}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-1.5 sm:gap-2"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Add Tenant</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>
        </div>

        {/* Top Tenants - Desktop Table / Mobile Cards */}
        <div className="overflow-x-auto">
          {/* Desktop Table */}
          <table className="w-full hidden md:table">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tenant</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Orders</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Revenue</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Users</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden xl:table-cell">Last Active</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 lg:px-6 py-3 lg:py-4">
                    <div className="flex items-center gap-2 lg:gap-3">
                      <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs lg:text-sm flex-shrink-0">
                        {tenant.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 text-sm lg:text-base truncate">{tenant.name}</p>
                        <p className="text-xs lg:text-sm text-slate-500 truncate">{tenant.subdomain}.{getPrimaryDomain()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-3 lg:py-4">
                    <span className={`inline-flex items-center gap-1 lg:gap-1.5 px-2 lg:px-3 py-1 rounded-full text-xs font-medium ${getPlanBadge(tenant.plan)}`}>
                      {tenant.plan === 'enterprise' && <Crown className="w-3 h-3" />}
                      {tenant.plan === 'growth' && <Rocket className="w-3 h-3" />}
                      <span className="hidden lg:inline">{tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1)}</span>
                      <span className="lg:hidden">{tenant.plan.charAt(0).toUpperCase()}</span>
                    </span>
                  </td>
                  <td className="px-4 lg:px-6 py-3 lg:py-4">
                    <span className={`inline-flex items-center gap-1 lg:gap-1.5 px-2 lg:px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(tenant.status)}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${tenant.status === 'active' ? 'bg-emerald-500' : tenant.status === 'trialing' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                      <span className="hidden lg:inline">{tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}</span>
                    </span>
                  </td>
                  <td className="px-4 lg:px-6 py-3 lg:py-4">
                    <span className="text-xs lg:text-sm font-medium text-slate-900">{tenant.totalOrders.toLocaleString()}</span>
                  </td>
                  <td className="px-4 lg:px-6 py-3 lg:py-4 hidden lg:table-cell">
                    <span className="text-sm font-semibold text-emerald-600">{formatCurrency(tenant.totalRevenue)}</span>
                  </td>
                  <td className="px-4 lg:px-6 py-3 lg:py-4 hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600">{tenant.activeUsers}</span>
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-3 lg:py-4 hidden xl:table-cell">
                    <span className="text-sm text-slate-500">{tenant.lastActivity}</span>
                  </td>
                  <td className="px-4 lg:px-6 py-3 lg:py-4 text-right">
                    <div className="flex items-center justify-end gap-1 lg:gap-2">
                      <button 
                        onClick={() => onViewTenant?.(tenant.id)}
                        title="View tenant details"
                        className="p-1.5 lg:p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
                      >
                        <Eye className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                      </button>
                      <button 
                        onClick={() => onEditTenant?.(tenant.id)}
                        title="Edit tenant"
                        className="p-1.5 lg:p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
                      >
                        <Edit className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                      </button>
                      <button 
                        onClick={() => handleVisitTenant(tenant.subdomain)}
                        title={`Visit ${tenant.subdomain}.${getPrimaryDomain()}`}
                        className="p-1.5 lg:p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
                      >
                        <ExternalLink className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile Card Layout */}
          <div className="md:hidden divide-y divide-slate-200">
            {filteredTenants.map((tenant) => (
              <div key={tenant.id} className="p-4 hover:bg-slate-50 transition-colors">
                {/* Tenant Info */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {tenant.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 text-sm truncate">{tenant.name}</p>
                      <p className="text-xs text-slate-500 truncate">{tenant.subdomain}.{getPrimaryDomain()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button 
                      onClick={() => onViewTenant?.(tenant.id)}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleVisitTenant(tenant.subdomain)}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Plan</p>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getPlanBadge(tenant.plan)}`}>
                      {tenant.plan === 'enterprise' && <Crown className="w-3 h-3" />}
                      {tenant.plan === 'growth' && <Rocket className="w-3 h-3" />}
                      {tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1)}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Status</p>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(tenant.status)}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${tenant.status === 'active' ? 'bg-emerald-500' : tenant.status === 'trialing' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                      {tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Orders</p>
                    <p className="text-sm font-semibold text-slate-900">{tenant.totalOrders.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Revenue</p>
                    <p className="text-sm font-semibold text-emerald-600">{formatCurrency(tenant.totalRevenue)}</p>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Users className="w-3.5 h-3.5" />
                    <span>{tenant.activeUsers} users</span>
                  </div>
                  <span className="text-xs text-slate-400">{tenant.lastActivity}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Empty state for filtered results */}
          {filteredTenants.length === 0 && searchQuery && (
            <div className="p-8 text-center">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No tenants match {`"${searchQuery}"`}</p>
            </div>
          )}
        </div>

        <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs sm:text-sm text-slate-500">
            Showing {filteredTenants.length} of {displayStats.totalTenants} tenants
          </p>
          <button 
            onClick={onViewAllTenants}
            className="text-xs sm:text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            View All Tenants →
          </button>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
