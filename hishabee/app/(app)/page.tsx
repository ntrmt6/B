'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { fetchDashboardMetrics, type DashboardMetrics } from '@/lib/services/dashboard';
import { formatCurrency as fmtCurrency } from '@/lib/tenant-config';
import {
  ShoppingBag, ShoppingCart, Receipt,
  Package, Wallet, ArrowUpRight,
  BookOpen, Calculator, Users, List, BarChart3,
  Smartphone, Printer, Megaphone, Globe, AlertCircle,
  ShieldCheck, Trash2, RefreshCcw
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { tenantId, tenantConfig } = useAuth();
  const formatCurrency = (n: number) => fmtCurrency(n, tenantConfig.currency);
  const router = useRouter();
  const [timeframe, setTimeframe] = useState('Today');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMetrics = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const data = await fetchDashboardMetrics(tenantId, timeframe);
      setMetrics(data);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [tenantId, timeframe]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const metricCards = metrics ? [
    { title: 'Today Sell', value: formatCurrency(metrics.todaySell), icon: <ArrowUpRight className="text-green-500" />, color: 'text-green-600' },
    { title: 'Today Purchase', value: formatCurrency(metrics.todayPurchase), icon: <ShoppingCart className="text-blue-500" />, color: 'text-blue-600' },
    { title: 'Today Expense', value: formatCurrency(metrics.todayExpense), icon: <Receipt className="text-orange-500" />, color: 'text-orange-600' },
    { title: 'Total Stock', value: metrics.totalStock.toFixed(2), icon: <Package className="text-green-600" />, color: 'text-green-700' },
    { title: 'You Will Get', value: formatCurrency(metrics.youWillGet), icon: <Wallet className="text-red-500" />, color: 'text-red-600' },
    { title: 'You Will Give', value: formatCurrency(metrics.youWillGive), icon: <Wallet className="text-green-500" />, color: 'text-green-600' },
  ] : [];

  const bookList = [
    { name: 'Purchase Book', icon: <BookOpen className="text-orange-400" />, href: '/purchases' },
    { name: 'Sales Book', icon: <Calculator className="text-yellow-500" />, href: '/sales' },
    { name: 'Due Book', icon: <Receipt className="text-red-400" />, href: '/due-book' },
    { name: 'Expense Book', icon: <Wallet className="text-blue-400" />, href: '/expenses' },
  ];

  const businessTools = [
    { name: 'Contacts', icon: <Users className="text-blue-500" />, href: '/contacts' },
    { name: 'Product List', icon: <List className="text-orange-500" />, href: '/products' },
    { name: 'Stock Book', icon: <Package className="text-green-500" />, href: '/products' },
    { name: 'Business Report', icon: <BarChart3 className="text-gray-600" />, href: '/reports' },
  ];

  const others = [
    { name: 'Cashbox', icon: <Calculator className="text-orange-400" />, href: '/reports' },
    { name: 'App Training', icon: <Smartphone className="text-yellow-600" />, href: '#' },
    { name: 'App Access', icon: <ShieldCheck className="text-blue-500" />, href: '#' },
    { name: 'Printer', icon: <Printer className="text-gray-500" />, href: '#' },
    { name: 'Marketing', icon: <Megaphone className="text-blue-400" />, href: '#' },
    { name: 'Online Shop', icon: <Globe className="text-red-400" />, href: '#' },
    { name: 'Expired Product', icon: <AlertCircle className="text-red-500" />, href: '#' },
    { name: 'Warranty Product', icon: <Package className="text-orange-400" />, href: '#' },
    { name: 'Recycle Bin', icon: <Trash2 className="text-blue-400" />, href: '#' },
  ];

  return (
    <div className="p-2 md:p-4 max-w-7xl mx-auto space-y-3">
      {/* Balance & Filter Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div className="bg-gradient-to-r from-[var(--crystal-blue)] to-[var(--crystal-blue-dark)] rounded-lg px-4 py-2 flex items-center gap-2 shadow-md">
          <Wallet size={16} className="text-white/80" />
          <span className="text-sm font-bold text-white">
            Balance: {metrics ? formatCurrency(metrics.balance) : '...'}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm w-full md:w-auto overflow-x-auto">
          {['Today', 'Weekly', 'Monthly', 'Yearly', 'All Time'].map((item) => (
            <button
              key={item}
              onClick={() => setTimeframe(item)}
              className={`px-2.5 py-1 text-[11px] rounded-md transition-all whitespace-nowrap font-medium ${
                timeframe === item
                  ? 'bg-[var(--crystal-blue)] text-white shadow-sm'
                  : 'text-gray-500 hover:text-[var(--crystal-blue)] hover:bg-[var(--crystal-blue-light)]'
              }`}
            >
              {item}
            </button>
          ))}
          <button
            onClick={loadMetrics}
            disabled={loading}
            className="flex items-center gap-1 px-2 py-1 text-[11px] text-gray-500 hover:text-[var(--crystal-blue)] rounded-md transition-colors"
          >
            <RefreshCcw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {loading && !metrics ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-lg p-2.5 shadow-sm animate-pulse">
              <div className="h-2.5 bg-gray-100 rounded w-2/3 mb-2" />
              <div className="h-5 bg-gray-100 rounded w-1/2" />
            </div>
          ))
        ) : (
          metricCards.map((m, idx) => (
            <div key={idx} className="bg-white border border-gray-100 rounded-lg p-2.5 shadow-sm hover:shadow-md hover:border-[var(--crystal-blue-light)] transition-all group">
              <div className="flex justify-between items-start mb-0.5">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{m.title}</span>
                <span className="opacity-60 group-hover:opacity-100 transition-opacity">{m.icon}</span>
              </div>
              <div className={`text-base font-bold ${m.color}`}>{m.value}</div>
            </div>
          ))
        )}
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { name: 'Purchase', gradient: 'from-orange-500 to-[var(--crystal-orange)]', icon: <ShoppingBag size={24} className="text-white" />, href: '/purchases' },
          { name: 'Sell', gradient: 'from-[var(--crystal-blue)] to-[var(--crystal-blue-dark)]', icon: <ShoppingCart size={24} className="text-white" />, href: '/sell' },
          { name: 'Quick Sell', gradient: 'from-emerald-500 to-emerald-600', icon: <div className="relative"><ShoppingCart size={24} className="text-white" /><div className="absolute -top-1 -right-1 bg-white text-emerald-600 rounded-full p-0.5"><ArrowUpRight size={8} /></div></div>, href: '/quick-sell' },
        ].map((action, idx) => (
          <button
            key={idx}
            onClick={() => router.push(action.href)}
            className={`bg-gradient-to-br ${action.gradient} rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all active:scale-95`}
          >
            {action.icon}
            <span className="text-xs font-bold text-white">{action.name}</span>
          </button>
        ))}
      </div>

      {/* Categorized Shortcut Sections */}
      <div className="space-y-2">
        <Section title="Book List" items={bookList} router={router} />
        <Section title="For Your Business" items={businessTools} router={router} />
        <Section title="Others" items={others} router={router} cols="grid-cols-4 md:grid-cols-6 lg:grid-cols-9" />
      </div>
    </div>
  );
}

function Section({ title, items, router, cols = 'grid-cols-4 md:grid-cols-4 lg:grid-cols-8' }: {
  title: string;
  items: Array<{ name: string; icon: React.ReactNode; href: string }>;
  router: ReturnType<typeof useRouter>;
  cols?: string;
}) {
  return (
    <section className="bg-white border border-gray-100 rounded-lg p-2.5 shadow-sm">
      <h2 className="text-[10px] font-bold text-[var(--crystal-blue-dark)] uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
        <span className="w-1 h-3 bg-[var(--crystal-orange)] rounded-full" />
        {title}
      </h2>
      <div className={`grid ${cols} gap-0.5`}>
        {items.map((item, idx) => (
          <button
            key={idx}
            onClick={() => item.href !== '#' && router.push(item.href)}
            className="flex flex-col items-center justify-center p-1.5 rounded-lg hover:bg-[var(--crystal-blue-light)] cursor-pointer transition-all group"
          >
            <div className="mb-1 group-hover:scale-110 transition-transform">
              {item.icon}
            </div>
            <span className="text-[9px] md:text-[11px] text-center font-medium text-gray-600 group-hover:text-[var(--crystal-blue-dark)] line-clamp-1">{item.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
