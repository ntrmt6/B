import React, { useState, useMemo } from 'react';
import {
  Globe, FileText, Tag, TrendingDown, Package, Star, Search, Bell, Calendar,
  ChevronDown, ArrowUpRight, ArrowDownRight,
  ShoppingCart, Truck, CheckCircle, Clock, XCircle, RotateCcw, ChevronRight, Wifi, Users
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

// ─────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────
interface StatCard {
  id: string;
  label: string;
  value: number | string;
  icon: React.ReactNode;
  iconBg: string;
}

interface OrderStatus {
  id: string;
  label: string;
  count: number;
  color: string;
  hoverShadow: string;
  iconComponent: React.ReactNode;
}

interface AdminDashboardProps {
  orders?: any[];
  products?: any[];
  tenantId?: string;
  user?: any;
}

// ─────────────────────────────────────────────────────
// Static Data
// ─────────────────────────────────────────────────────
const visitorData = [
  { date: 'Jan 25', mobile: 850, tablet: 450, desktop: 650 },
  { date: 'Jan 26', mobile: 920, tablet: 480, desktop: 720 },
  { date: 'Jan 27', mobile: 780, tablet: 520, desktop: 680 },
  { date: 'Jan 28', mobile: 1100, tablet: 600, desktop: 850 },
  { date: 'Jan 29', mobile: 950, tablet: 550, desktop: 780 },
  { date: 'Jan 30', mobile: 880, tablet: 490, desktop: 710 },
  { date: 'Jan 31', mobile: 1020, tablet: 580, desktop: 820 },
];

const salesData = [
  { month: 'Jan', sales: 2400 },
  { month: 'Feb', sales: 4200 },
  { month: 'Mar', sales: 3100 },
  { month: 'Apr', sales: 5800 },
  { month: 'May', sales: 4200 },
  { month: 'Jun', sales: 6100 },
  { month: 'Jul', sales: 5200 },
];

const categoryData = [
  { name: 'Electronics', value: 35, color: '#6366f1' },
  { name: 'Clothing', value: 25, color: '#22c55e' },
  { name: 'Accessories', value: 20, color: '#eab308' },
  { name: 'Home & Garden', value: 12, color: '#ec4899' },
  { name: 'Others', value: 8, color: '#94a3b8' },
];

const defaultProducts = [
  { id: '1', name: 'iPhone 15 Pro', sku: 'IPH15P-001', price: 999, sold: 245, rating: 4.8 },
  { id: '2', name: 'Samsung Galaxy S24', sku: 'SGS24-002', price: 899, sold: 189, rating: 4.7 },
  { id: '3', name: 'MacBook Air M3', sku: 'MBA-M3-003', price: 1299, sold: 156, rating: 4.6 },
  { id: '4', name: 'AirPods Pro 2', sku: 'APP2-004', price: 249, sold: 312, rating: 4.9 },
  { id: '5', name: 'iPad Pro 12.9', sku: 'IPDP-005', price: 1099, sold: 98, rating: 4.5 },
];

// ─────────────────────────────────────────────────────
// Sub-Components: Analytics Card
// ─────────────────────────────────────────────────────
const AnalyticsCard: React.FC<StatCard> = ({ label, value, icon, iconBg }) => (
  <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100 hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-200 group">
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg ${iconBg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
        {React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4 sm:w-5 sm:h-5' })}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">{value}</p>
        <p className="text-[11px] sm:text-xs text-gray-500 truncate">{label}</p>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────
// Sub-Components: Visitor Stat Card
// ─────────────────────────────────────────────────────
const VisitorStatCard: React.FC<{
  label: string; value: string; change: string; isPositive: boolean;
  icon: React.ReactNode; iconBg: string; hoverColor: string;
}> = ({ label, value, change, isPositive, icon, iconBg, hoverColor }) => (
  <div className={`group bg-white rounded-xl p-3 sm:p-4 border border-gray-100 hover:shadow-lg ${hoverColor} transition-all duration-200 cursor-pointer`}>
    <div className="flex items-center gap-3">
      <div className={`p-2 ${iconBg} rounded-lg group-hover:scale-110 transition-transform shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] sm:text-xs text-gray-400 font-medium truncate">{label}</p>
        <p className="text-lg sm:text-xl lg:text-2xl font-black text-gray-900">{value}</p>
      </div>
      <span className={`flex items-center text-[11px] sm:text-xs font-semibold shrink-0 px-1.5 py-0.5 rounded-full ${isPositive ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {change}
      </span>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────
// Sub-Components: Order Status Card
// ─────────────────────────────────────────────────────
const OrderStatusCard: React.FC<OrderStatus> = ({ label, count, color, hoverShadow, iconComponent }) => (
  <div className={`group bg-white border border-gray-100 rounded-xl p-2.5 sm:p-3 shadow-sm ${hoverShadow} transition-all duration-200 cursor-pointer`}>
    <div className="flex items-center gap-2 sm:gap-2.5">
      <div className={`p-1.5 ${color} rounded-lg group-hover:scale-110 transition-transform shrink-0`}>
        {iconComponent}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] sm:text-xs text-gray-400 font-medium truncate">{label}</p>
        <p className="text-base sm:text-lg font-black text-gray-900">{count}</p>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────
// Main Dashboard Component
// ─────────────────────────────────────────────────────
const AdminDashboard: React.FC<AdminDashboardProps> = ({ orders = [], products = [], tenantId, user }) => {
  const [timePeriod, setTimePeriod] = useState<'day' | 'month' | 'year' | 'all'>('month');
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const [currentDate] = useState(new Date());

  // Computed values
  const totalProducts = products?.length || 4;
  const totalOrders = orders?.length || 65;
  const lowStockCount = products?.filter((p: any) => (p.stock || 0) < 10)?.length || 45;
  const pendingReviews = orders?.filter((o: any) => o.status === 'pending')?.length || 452;

  const analyticsCards: StatCard[] = useMemo(() => [
    { id: '1', label: 'Products on Hands', value: totalProducts, icon: <Globe className="text-blue-600" />, iconBg: 'bg-blue-50' },
    { id: '2', label: 'Total Orders', value: totalOrders, icon: <FileText className="text-purple-600" />, iconBg: 'bg-purple-50' },
    { id: '3', label: 'Reserved Price', value: '৳35K', icon: <Tag className="text-emerald-600" />, iconBg: 'bg-emerald-50' },
    { id: '4', label: 'Low Stock', value: lowStockCount, icon: <TrendingDown className="text-orange-600" />, iconBg: 'bg-orange-50' },
    { id: '5', label: 'To be Reviewed', value: pendingReviews, icon: <Package className="text-pink-600" />, iconBg: 'bg-pink-50' },
  ], [totalProducts, totalOrders, lowStockCount, pendingReviews]);

  const orderStatuses: OrderStatus[] = useMemo(() => [
    { id: 'today', label: 'Today', count: 35, color: 'bg-pink-50', hoverShadow: 'hover:shadow-lg hover:shadow-pink-500/20 hover:border-pink-200', iconComponent: <Calendar className="w-3.5 h-3.5 text-pink-500" /> },
    { id: 'courier', label: 'Courier', count: 35, color: 'bg-orange-50', hoverShadow: 'hover:shadow-lg hover:shadow-orange-500/20 hover:border-orange-200', iconComponent: <Truck className="w-3.5 h-3.5 text-orange-500" /> },
    { id: 'confirmed', label: 'Confirmed', count: 35, color: 'bg-emerald-50', hoverShadow: 'hover:shadow-lg hover:shadow-emerald-500/20 hover:border-emerald-200', iconComponent: <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> },
    { id: 'pending', label: 'Pending', count: 35, color: 'bg-amber-50', hoverShadow: 'hover:shadow-lg hover:shadow-amber-500/20 hover:border-amber-200', iconComponent: <Clock className="w-3.5 h-3.5 text-amber-500" /> },
    { id: 'cancelled', label: 'Cancelled', count: 35, color: 'bg-rose-50', hoverShadow: 'hover:shadow-lg hover:shadow-rose-500/20 hover:border-rose-200', iconComponent: <XCircle className="w-3.5 h-3.5 text-rose-500" /> },
    { id: 'returns', label: 'Returns', count: 35, color: 'bg-blue-50', hoverShadow: 'hover:shadow-lg hover:shadow-blue-500/20 hover:border-blue-200', iconComponent: <RotateCcw className="w-3.5 h-3.5 text-blue-500" /> },
  ], [orders]);

  const displayProducts = products?.length > 0 ? products.slice(0, 5) : defaultProducts;

  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6">

      {/* ──────────────── Section 1: Order Analytics ──────────────── */}
      <section>
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 mb-3 sm:mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-blue-500 rounded-full" />
            <h2 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900">Order Analytics</h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Language Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-medium rounded-md transition-all ${language === 'en' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >Eng</button>
              <button
                onClick={() => setLanguage('bn')}
                className={`px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-medium rounded-md transition-all ${language === 'bn' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >বাংলা</button>
            </div>
            {/* Date */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-white border border-gray-100 rounded-lg px-2.5 py-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{currentDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })}</span>
              <span className="hidden xs:inline text-gray-300">|</span>
              <span className="hidden xs:inline font-medium text-gray-700">{currentDate.toLocaleDateString('en-US', { weekday: 'short' })}</span>
            </div>
          </div>
        </div>

        {/* Analytics Cards Grid */}
        <div className="grid grid-cols-2 xs:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
          {analyticsCards.map((card) => (
            <AnalyticsCard key={card.id} {...card} />
          ))}
          {/* Notification CTA Card */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-3 sm:p-4 text-white hover:shadow-lg hover:shadow-blue-500/30 transition-all col-span-1">
            <div className="flex items-center justify-between mb-1.5">
              <Bell className="w-4 h-4 opacity-80" />
              <span className="text-[10px] sm:text-[11px] bg-white/20 px-1.5 py-0.5 rounded-full font-medium">New</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold">Important</p>
            <p className="text-[10px] sm:text-xs opacity-75 mt-0.5">Notification</p>
          </div>
        </div>
      </section>

      {/* ──────────────── Section 2: Visitor Stats + Chart ──────────────── */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
          {/* Visitor Cards */}
          <div className="md:col-span-4 lg:col-span-3 grid grid-cols-3 md:grid-cols-1 gap-2 sm:gap-3">
            <VisitorStatCard
              label="Online Now"
              value="127"
              change="+12%"
              isPositive={true}
              icon={<Wifi className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />}
              iconBg="bg-blue-50"
              hoverColor="hover:shadow-blue-500/20"
            />
            <VisitorStatCard
              label="Today Visitors"
              value="1,842"
              change="+8%"
              isPositive={true}
              icon={<Users className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />}
              iconBg="bg-orange-50"
              hoverColor="hover:shadow-orange-500/20"
            />
            <VisitorStatCard
              label="Total Visitors"
              value="45,231"
              change="+15%"
              isPositive={true}
              icon={<Globe className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />}
              iconBg="bg-indigo-50"
              hoverColor="hover:shadow-indigo-500/20"
            />
          </div>

          {/* Chart Area */}
          <div className="md:col-span-8 lg:col-span-9 bg-white rounded-xl p-3 sm:p-4 lg:p-5 border border-gray-100 shadow-sm">
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 mb-3 sm:mb-4">
              <h3 className="text-sm sm:text-base font-bold text-gray-900">Device Views</h3>
              <div className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs flex-wrap">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                  <span className="text-gray-500 font-medium">Mobile</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                  <span className="text-gray-500 font-medium">Tablet</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-violet-500 rounded-full" />
                  <span className="text-gray-500 font-medium">Desktop</span>
                </div>
              </div>
            </div>
            <div className="h-36 sm:h-44 md:h-48 lg:h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={visitorData} barGap={1} barSize={undefined}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    stroke="#cbd5e1"
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    stroke="#cbd5e1"
                    tickLine={false}
                    axisLine={false}
                    width={32}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                  />
                  <Bar dataKey="mobile" fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={18} />
                  <Bar dataKey="tablet" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={18} />
                  <Bar dataKey="desktop" fill="#8b5cf6" radius={[3, 3, 0, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────── Section 3: Order Status ──────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <div className="w-1 h-5 bg-emerald-500 rounded-full" />
          <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900">Order Status</h3>
        </div>
        <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3">
          {orderStatuses.map((status) => (
            <OrderStatusCard key={status.id} {...status} />
          ))}
        </div>
      </section>

      {/* ──────────────── Section 4: Sales Performance + Category ──────────────── */}
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-5">
          {/* Sales Performance - Line Chart */}
          <div className="lg:col-span-8 bg-white rounded-xl p-3 sm:p-4 lg:p-5 border border-gray-100 shadow-sm">
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 mb-3 sm:mb-4">
              <h3 className="text-sm sm:text-base font-bold text-gray-900">Sales Performance</h3>
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5 overflow-x-auto">
                {(['Day', 'Month', 'Year', 'All'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setTimePeriod(period.toLowerCase() as any)}
                    className={`px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                      timePeriod === period.toLowerCase()
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >{period}</button>
                ))}
              </div>
            </div>
            <div className="h-40 sm:h-48 md:h-56 lg:h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#cbd5e1" tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} stroke="#cbd5e1" tickLine={false} axisLine={false} width={36} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={{ fill: '#6366f1', strokeWidth: 2, r: 3 }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                    fill="url(#salesGrad)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sales by Category - Pie Chart */}
          <div className="lg:col-span-4 bg-white rounded-xl p-3 sm:p-4 lg:p-5 border border-gray-100 shadow-sm">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-3 sm:mb-4">Sales by Category</h3>
            <div className="h-32 sm:h-40 lg:h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius="45%"
                    outerRadius="80%"
                    paddingAngle={2}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 xs:grid-cols-1 gap-1.5 sm:gap-2 mt-3 sm:mt-4">
              {categoryData.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-gray-600 truncate">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <div className="w-10 sm:w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden xs:block">
                      <div className="h-full rounded-full" style={{ width: `${cat.value}%`, backgroundColor: cat.color }} />
                    </div>
                    <span className="font-semibold text-gray-700 w-7 text-right">{cat.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────── Section 5: Best Selling Products + Top Products ──────────────── */}
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-5">
          {/* Best Selling Products Table */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 p-3 sm:p-4 border-b border-gray-50">
              <h3 className="text-sm sm:text-base font-bold text-gray-900">Best Selling Products</h3>
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5 overflow-x-auto">
                {['Day', 'Month', 'Year', 'All'].map((period) => (
                  <button key={period} className="px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-medium rounded-md text-gray-500 hover:text-gray-700 transition-all whitespace-nowrap">{period}</button>
                ))}
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-gray-50">
              {displayProducts.map((product: any) => (
                <div key={product.id} className="flex items-center gap-3 p-3 hover:bg-gray-50/50 transition-colors">
                  <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{product.name}</p>
                    <p className="text-[10px] text-gray-400">{product.sku || `SKU-${product.id}`}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-gray-900">৳{product.price || product.selling_price || 0}</p>
                    <p className="text-[10px] text-gray-400">{product.sold || product.totalSold || 0} sold</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full min-w-[460px]">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="text-left py-2.5 px-3 sm:px-4 text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Product</th>
                    <th className="text-left py-2.5 px-3 sm:px-4 text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider hidden md:table-cell">SKU</th>
                    <th className="text-right py-2.5 px-3 sm:px-4 text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Price</th>
                    <th className="text-right py-2.5 px-3 sm:px-4 text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Sold</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {displayProducts.map((product: any) => (
                    <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-2.5 px-3 sm:px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-gray-400" />
                          </div>
                          <span className="text-xs sm:text-sm font-semibold text-gray-900 truncate max-w-[120px] sm:max-w-[180px] lg:max-w-none">{product.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 sm:px-4 text-xs text-gray-500 hidden md:table-cell">{product.sku || `SKU-${product.id}`}</td>
                      <td className="py-2.5 px-3 sm:px-4 text-right text-xs sm:text-sm font-bold text-gray-900">৳{product.price || product.selling_price || 0}</td>
                      <td className="py-2.5 px-3 sm:px-4 text-right text-xs sm:text-sm text-gray-600">{product.sold || product.totalSold || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Products List */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between gap-2 p-3 sm:p-4 border-b border-gray-50">
              <h3 className="text-sm sm:text-base font-bold text-gray-900">Top Products</h3>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-8 pr-3 py-1.5 sm:py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 w-24 sm:w-28 transition-all"
                />
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {displayProducts.map((product: any, index: number) => (
                <div key={product.id} className="flex items-center justify-between gap-2 p-2.5 sm:p-3 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 sm:w-7 sm:h-7 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-bold shrink-0">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                      <p className="text-[10px] sm:text-xs text-gray-400">৳{product.price || product.selling_price || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-xs sm:text-sm font-semibold text-gray-700">{product.rating || 4.5}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
