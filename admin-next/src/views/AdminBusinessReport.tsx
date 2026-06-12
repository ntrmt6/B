import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, Receipt, History, Loader2, DollarSign, TrendingUp, TrendingDown, Calendar, ShoppingCart, Package, Users, FileText, BookOpen, StickyNote } from 'lucide-react';
import AdminExpenses from './AdminExpenses';
import AdminIncome from './AdminIncome';
import AdminPurchase from './AdminPurchase';

interface AdminBusinessReportProps {
  orders?: any[];
  products?: any[];
  user?: any;
  onLogout?: () => void;
  tenantId?: string;
  initialTab?: string;
}

type TabType = 'profit' | 'expense' | 'income' | 'purchase' | 'due' | 'note';

const mapInitialTabToType = (initialTab?: string): TabType => {
  if (!initialTab) return 'profit';
  if (initialTab.includes('expense')) return 'expense';
  if (initialTab.includes('income')) return 'income';
  if (initialTab.includes('purchase')) return 'purchase';
  if (initialTab.includes('due')) return 'due';
  if (initialTab.includes('note')) return 'note';
  return 'profit';
};

const AdminBusinessReport: React.FC<AdminBusinessReportProps> = ({ 
  orders = [], 
  products = [],
  user,
  onLogout,
  tenantId,
  initialTab 
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(() => mapInitialTabToType(initialTab));
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // Update tab when initialTab changes
  useEffect(() => {
    setActiveTab(mapInitialTabToType(initialTab));
  }, [initialTab]);

  // Calculate summary stats
  const summary = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const totalCost = products.reduce((sum, p) => sum + ((p.costPrice || 0) * (p.stock || 0)), 0);
    const deliveredOrders = orders.filter(o => o.status === 'Delivered');
    const deliveredRevenue = deliveredOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const estimatedProfit = deliveredRevenue * 0.3; // Assuming 30% margin
    
    return {
      totalRevenue,
      totalCost,
      deliveredRevenue,
      estimatedProfit,
      orderCount: orders.length,
      deliveredCount: deliveredOrders.length
    };
  }, [orders, products]);

  const tabs = [
    { id: 'profit' as TabType, label: 'Profit/Loss', icon: BarChart3 },
    { id: 'expense' as TabType, label: 'Expense', icon: Receipt },
    { id: 'income' as TabType, label: 'Income', icon: TrendingUp },
    { id: 'purchase' as TabType, label: 'Purchase', icon: ShoppingCart },
    { id: 'due' as TabType, label: 'Due Book', icon: BookOpen },
    { id: 'note' as TabType, label: 'Notes', icon: StickyNote },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'expense':
        return <AdminExpenses />;
      case 'income':
        return <AdminIncome />;
      case 'purchase':
        return <AdminPurchase tenantId={tenantId} />;
      case 'due':
        return (
          <div className="bg-white rounded-xl p-4 sm:p-6 lg:p-8 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700">Due Book Coming Soon</h3>
            <p className="text-gray-500 mt-2">This feature is under development</p>
          </div>
        );
      case 'note':
        return (
          <div className="bg-white rounded-xl p-4 sm:p-6 lg:p-8 text-center">
            <StickyNote className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700">Notes Coming Soon</h3>
            <p className="text-gray-500 mt-2">This feature is under development</p>
          </div>
        );
      case 'profit':
      default:
        return (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-semibold text-gray-900 mt-1">৳{summary.totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> From {summary.orderCount} orders
                </p>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Delivered Revenue</p>
                    <p className="text-2xl font-semibold text-gray-900 mt-1">৳{summary.deliveredRevenue.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> {summary.deliveredCount} delivered
                </p>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Estimated Profit</p>
                    <p className="text-2xl font-semibold text-gray-900 mt-1">৳{summary.estimatedProfit.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
                <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                  ~30% margin
                </p>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Inventory Value</p>
                    <p className="text-2xl font-semibold text-gray-900 mt-1">৳{summary.totalCost.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <p className="text-xs text-purple-600 mt-2 flex items-center gap-1">
                  {products.length} products
                </p>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Recent Delivered Orders</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.filter(o => o.status === 'Delivered').slice(0, 5).map((order, idx) => (
                      <tr key={order.id || idx} className="hover:bg-gray-50">
                        <td className="px-5 py-3 text-sm font-medium text-gray-900">{order.id}</td>
                        <td className="px-5 py-3 text-sm text-gray-600">{order.customerName || 'N/A'}</td>
                        <td className="px-5 py-3 text-sm font-medium text-gray-900">৳{(order.amount || 0).toLocaleString()}</td>
                        <td className="px-5 py-3">
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {orders.filter(o => o.status === 'Delivered').length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-gray-500">
                          No delivered orders yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 pb-12">
      {/* Top Navigation & Controls */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <h1 className="text-xl font-semibold text-gray-900">Business Report</h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="bg-transparent border-none text-sm text-gray-700 focus:outline-none"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className="bg-transparent border-none text-sm text-gray-700 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id ? 'border-[#0099FF] text-[#0099FF]' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-10 h-10 text-[#0099FF] animate-spin" />
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            {renderContent()}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBusinessReport;