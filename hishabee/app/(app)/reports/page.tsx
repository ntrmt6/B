'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/tenant-config';
import { fetchEntities, type Entity } from '@/lib/services/entities';
import {
  BarChart3, TrendingUp, DollarSign,
  RefreshCcw, ShoppingCart, Receipt, Plus, Printer
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ProfitLossData {
  totalRevenue: number;
  totalExpenses: number;
  totalPurchases: number;
  totalIncome: number;
  netProfit: number;
  orderCount: number;
  expenseCount: number;
  purchaseCount: number;
  incomeCount: number;
}

interface DueSummary {
  totalWillGet: number;
  totalWillGive: number;
}

// Per-tenant localStorage cache helpers
const REPORT_CACHE_PREFIX = 'hishabee_report_';

function getCacheKey(tenantId: string, period: string) {
  return `${REPORT_CACHE_PREFIX}${tenantId}_${period}`;
}

function getCachedReport(tenantId: string, period: string): ProfitLossData | null {
  try {
    const raw = localStorage.getItem(getCacheKey(tenantId, period));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.data ?? null;
  } catch {
    return null;
  }
}

function setCachedReport(tenantId: string, period: string, data: ProfitLossData) {
  try {
    localStorage.setItem(getCacheKey(tenantId, period), JSON.stringify({ data, ts: Date.now() }));
  } catch { /* quota exceeded — ignore */ }
}

// View modes for the reports page
type ViewMode = 'overview' | 'charts';

export default function ReportsPage() {
  const router = useRouter();
  const { tenantId, tenantConfig } = useAuth();
  const fc = (n: number) => formatCurrency(n, tenantConfig.currency);
  const [data, setData] = useState<ProfitLossData | null>(null);
  const [dueSummary, setDueSummary] = useState<DueSummary>({ totalWillGet: 0, totalWillGive: 0 });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('Monthly');
  const [viewMode, setViewMode] = useState<ViewMode>('overview');

  // Restore cached data for current tenant+period on mount and period change
  useEffect(() => {
    if (!tenantId) return;
    const cached = getCachedReport(tenantId, period);
    if (cached) setData(cached);
  }, [tenantId, period]);

  // Fetch due summary from entities
  const loadDueSummary = useCallback(async () => {
    if (!tenantId) return;
    try {
      const entities = await fetchEntities(tenantId);
      const summary = entities.reduce((acc: DueSummary, e: Entity) => ({
        totalWillGet: acc.totalWillGet + (e.totalOwedToMe || 0),
        totalWillGive: acc.totalWillGive + (e.totalIOweThemNumber || 0),
      }), { totalWillGet: 0, totalWillGive: 0 });
      setDueSummary(summary);
    } catch {
      // Keep existing due data on failure
    }
  }, [tenantId]);

  const loadReport = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const pMap: Record<string, string> = { Today: 'daily', Weekly: 'weekly', Monthly: 'monthly', Yearly: 'yearly', 'All Time': '' };
      const params: Record<string, string> = {};
      const apiPeriod = pMap[period];
      if (apiPeriod) params.period = apiPeriod;
      const res = await api.get('/profit-loss/summary', {
        params,
        headers: { 'X-Tenant-Id': tenantId },
      });
      const d = res.data;
      const report: ProfitLossData = {
        totalRevenue: d.totalRevenue ?? 0,
        totalExpenses: d.totalExpenses ?? d.otherExpense ?? 0,
        totalPurchases: d.totalPurchases ?? 0,
        totalIncome: d.totalIncome ?? d.otherIncome ?? 0,
        netProfit: d.netProfit ?? d.totalProfitLoss ?? 0,
        orderCount: d.orderCount ?? 0,
        expenseCount: d.expenseCount ?? 0,
        purchaseCount: d.purchaseCount ?? 0,
        incomeCount: d.incomeCount ?? 0,
      };
      setData(report);
      setCachedReport(tenantId, period, report);
    } catch {
      // On failure, keep showing cached data if available
      if (!data) {
        const cached = getCachedReport(tenantId, period);
        if (cached) {
          setData(cached);
        } else {
          setData({ totalRevenue: 0, totalExpenses: 0, totalPurchases: 0, totalIncome: 0, netProfit: 0, orderCount: 0, expenseCount: 0, purchaseCount: 0, incomeCount: 0 });
        }
      }
      toast.error('Report data unavailable');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, period]);

  useEffect(() => {
    loadReport();
    loadDueSummary();
  }, [loadReport, loadDueSummary]);

  const handleRefresh = () => {
    loadReport();
    loadDueSummary();
  };

  // PDF print handler
  const handlePrintPDF = () => {
    if (!data) return;
    const doc = window.open('', '_blank');
    if (!doc) return;
    const reportDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
    const totalDue = dueSummary.totalWillGet + dueSummary.totalWillGive;
    const totalBalance = data.totalRevenue - data.totalPurchases + data.totalIncome - data.totalExpenses;
    const profitFromSell = data.totalRevenue - data.totalPurchases;
    const cashSell = Math.max(0, data.totalRevenue - dueSummary.totalWillGet);
    const htmlContent = `
      <html>
        <head>
          <title>Business Overview - ${tenantConfig.appName}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 30px; color: #1a1a1a; }
            h1 { font-size: 22px; margin-bottom: 4px; }
            .meta { color: #64748b; font-size: 13px; margin-bottom: 20px; }
            .section { margin-bottom: 20px; }
            .section h2 { font-size: 14px; color: #64748b; text-transform: uppercase; margin-bottom: 10px; }
            .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 8px; display: flex; justify-content: space-between; }
            .card .label { font-weight: 600; font-size: 13px; }
            .card .sub { font-size: 10px; color: #94a3b8; }
            .card .value { font-weight: 700; font-size: 14px; }
            .green { color: #059669; }
            .red { color: #e11d48; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .grid .box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <h1>Business Overview</h1>
          <p class="meta">${tenantConfig.appName} &bull; Period: ${period} &bull; Generated: ${reportDate}</p>
          <div class="section">
            <h2>General Sales Report</h2>
            <div class="card"><div><div class="label">Total Sell</div></div><div class="value green">${fc(data.totalRevenue)}</div></div>
            <div class="card"><div><div class="label">Cash Sell</div><div class="sub">Without Customer Due</div></div><div class="value green">${fc(cashSell)}</div></div>
            <div class="card"><div><div class="label">Customer Received</div></div><div class="value green">${fc(dueSummary.totalWillGet)}</div></div>
            <div class="card"><div><div class="label">Cash Purchase</div><div class="sub">Without Supplier Due</div></div><div class="value red">${fc(data.totalPurchases)}</div></div>
            <div class="card"><div><div class="label">Supplier Due Given</div></div><div class="value red">${fc(dueSummary.totalWillGive)}</div></div>
          </div>
          <div class="section">
            <div class="card"><div><div class="label">Total Balance</div></div><div class="value green">${fc(totalBalance)}</div></div>
            <div class="card"><div><div class="label">Profit from Selling Products</div></div><div class="value ${profitFromSell >= 0 ? 'green' : 'red'}">${fc(profitFromSell)}</div></div>
          </div>
          <div class="section">
            <h2>Other</h2>
            <div class="grid">
              <div class="box"><div class="sub">Other Income</div><div class="value green">${fc(data.totalIncome)}</div></div>
              <div class="box"><div class="sub">Other Expense</div><div class="value red">${fc(data.totalExpenses)}</div></div>
            </div>
          </div>
          <div class="section">
            <h2>Total Due</h2>
            <div class="card"><div class="label">Total Due</div><div class="value red">${fc(totalDue)}</div></div>
            <div class="grid">
              <div class="box"><div class="sub">Due to Supplier</div><div class="value">${fc(dueSummary.totalWillGive)}</div></div>
              <div class="box"><div class="sub">Due from Customer</div><div class="value">${fc(dueSummary.totalWillGet)}</div></div>
            </div>
          </div>
        </body>
      </html>
    `;
    doc.document.write(htmlContent);
    doc.document.close();
    doc.print();
  };

  // Chart data for bar chart
  const chartBars = data ? [
    { label: 'Revenue', value: data.totalRevenue, color: 'bg-green-500' },
    { label: 'Purchases', value: data.totalPurchases, color: 'bg-blue-500' },
    { label: 'Expenses', value: data.totalExpenses, color: 'bg-orange-500' },
    ...(data.totalIncome > 0 ? [{ label: 'Income', value: data.totalIncome, color: 'bg-cyan-500' }] : []),
    { label: 'Net Profit', value: Math.abs(data.netProfit), color: data.netProfit >= 0 ? 'bg-emerald-500' : 'bg-red-500' },
  ] : [];
  const chartMax = Math.max(...chartBars.map(b => b.value), 1);

  // Computed values for overview
  const profitFromSell = data ? data.totalRevenue - data.totalPurchases : 0;
  const totalBalance = data ? data.totalRevenue - data.totalPurchases + data.totalIncome - data.totalExpenses : 0;
  const cashSell = data ? Math.max(0, data.totalRevenue - dueSummary.totalWillGet) : 0;
  const totalDue = dueSummary.totalWillGet + dueSummary.totalWillGive;

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto">
      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-white border-2 border-green-100 rounded-md px-3 py-1.5 flex items-center gap-2 shadow-sm">
            <div className="bg-green-100 p-1 rounded">
              <BarChart3 size={16} className="text-green-600" />
            </div>
            <span className="text-sm font-bold text-green-700">
              Net: {data ? fc(data.netProfit) : '...'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-white border rounded-md p-1 shadow-sm w-full md:w-auto overflow-x-auto">
          {['Today', 'Weekly', 'Monthly', 'Yearly', 'All Time'].map((item) => (
            <button
              key={item}
              onClick={() => setPeriod(item)}
              className={`px-3 py-1 text-xs rounded-md transition-colors whitespace-nowrap ${
                period === item ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-100' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {item}
            </button>
          ))}
          <div className="h-4 w-[1px] bg-gray-200 mx-1" />
          <button onClick={handleRefresh} disabled={loading} className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 rounded">
            <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setViewMode('overview')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            viewMode === 'overview'
              ? 'bg-[#1E90FF] text-white'
              : 'bg-white text-gray-500 border hover:bg-gray-50'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setViewMode('charts')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            viewMode === 'charts'
              ? 'bg-[#1E90FF] text-white'
              : 'bg-white text-gray-500 border hover:bg-gray-50'
          }`}
        >
          Charts
        </button>
        {viewMode === 'overview' && (
          <button
            onClick={handlePrintPDF}
            disabled={!data}
            className="ml-auto flex items-center gap-1 bg-[#1E90FF] text-white px-3 py-1.5 rounded-lg text-[11px] font-bold hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <Printer size={12} /> PDF
          </button>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && !data ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border rounded-lg p-4 shadow-sm animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
              <div className="h-5 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : viewMode === 'overview' ? (
        /* ===== BUSINESS OVERVIEW ===== */
        <div className="space-y-4">
          {/* General Sales Report */}
          <div>
            <h3 className="text-[13px] font-bold text-gray-400 mb-2 uppercase tracking-wide">General Sales Report</h3>
            <div className="space-y-2">
              <ReportCard label="Total Sell" value={fc(data?.totalRevenue ?? 0)} color="green" />
              <ReportCard label="Cash Sell" sub="(Total Sell - Customer Due)" value={fc(cashSell)} color="green" />
              <ReportCard label="Customer Received" value={fc(dueSummary.totalWillGet)} color="green" />
              <ReportCard label="Cash Purchase" sub="(Without Supplier Due)" value={fc(data?.totalPurchases ?? 0)} color="red" />
              <ReportCard label="Supplier Due Given" value={fc(dueSummary.totalWillGive)} color="red" />
            </div>
          </div>

          <div className="border-t border-gray-200" />

          {/* Balance & Profit */}
          <div className="space-y-2">
            <ReportCard
              label="Total Balance"
              sub="(Total Sell + Income) - (Total Purchase + Expense)"
              value={fc(totalBalance)}
              color="green"
            />
            <ReportCard
              label="Profit from Selling Products"
              sub="(Sold Products Price - Purchase Cost)"
              value={fc(profitFromSell)}
              color={profitFromSell >= 0 ? 'green' : 'red'}
            />
          </div>

          {/* Income / Expense Tiles */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => router.push('/sales')}
              className="bg-white p-3 rounded-lg border text-center hover:shadow-md transition-shadow"
            >
              <p className="text-[11px] text-gray-500">Other Income</p>
              <p className="font-bold text-emerald-600 text-sm">{fc(data?.totalIncome ?? 0)}</p>
            </button>
            <button
              onClick={() => router.push('/expenses')}
              className="bg-white p-3 rounded-lg border text-center hover:shadow-md transition-shadow"
            >
              <p className="text-[11px] text-gray-500">Other Expense</p>
              <p className="font-bold text-rose-500 text-sm">{fc(data?.totalExpenses ?? 0)}</p>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => router.push('/sales')}
              className="bg-emerald-500 text-white py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-1 hover:bg-emerald-600 transition-colors"
            >
              <Plus size={16} /> Add Income
            </button>
            <button
              onClick={() => router.push('/expenses')}
              className="bg-rose-400 text-white py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-1 hover:bg-rose-500 transition-colors"
            >
              <Plus size={16} /> Add Expense
            </button>
          </div>

          {/* Total Due Section */}
          <div className="bg-white p-3 rounded-lg border">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs font-bold text-gray-600 uppercase">Total Due</p>
              <p className="text-rose-500 font-bold">{fc(totalDue)}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 h-20">
              <button
                onClick={() => router.push('/due-book')}
                className="bg-emerald-500 rounded-lg flex flex-col items-center justify-center text-white p-1 hover:bg-emerald-600 transition-colors"
              >
                <p className="text-[10px] text-center">Due to Supplier</p>
                <p className="font-bold text-sm">{fc(dueSummary.totalWillGive)}</p>
              </button>
              <button
                onClick={() => router.push('/due-book')}
                className="bg-rose-400 rounded-lg flex flex-col items-center justify-center text-white p-1 hover:bg-rose-500 transition-colors"
              >
                <p className="text-[10px] text-center">Due from Customer</p>
                <p className="font-bold text-sm text-center leading-none">{fc(dueSummary.totalWillGet)}</p>
              </button>
            </div>
          </div>

          {/* All Business Reports Grid */}
          <div>
            <h3 className="text-[15px] font-bold text-gray-600 mb-3">All Business Reports</h3>
            <div className="grid grid-cols-3 gap-2">
              <GridIcon label="Sales Report" onClick={() => router.push('/sales')} icon="📊" />
              <GridIcon label="Purchase Report" onClick={() => router.push('/purchases')} icon="🛍️" />
              <GridIcon label="Stock Report" onClick={() => router.push('/products')} icon="📋" />
              <GridIcon label="Product Report" onClick={() => router.push('/products')} icon="📦" />
              <GridIcon label="Best Customer" onClick={() => router.push('/contacts')} icon="👤" />
              <GridIcon label="Best Employee" onClick={() => router.push('/contacts')} icon="👷" />
              <GridIcon label="Profit Loss" onClick={() => setViewMode('charts')} icon="📉" />
              <GridIcon label="Expense Report" onClick={() => router.push('/expenses')} icon="💸" />
              <GridIcon label="Supplier Report" onClick={() => router.push('/contacts')} icon="🤝" />
              <GridIcon label="Cashbox" onClick={() => router.push('/cashbox')} icon="💰" />
            </div>
          </div>
        </div>
      ) : (
        /* ===== CHARTS VIEW (Original content) ===== */
        <div>
          {/* Metric Cards */}
          {data && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              {[
                { title: 'Revenue', value: fc(data.totalRevenue), sub: `${data.orderCount} orders`, icon: <DollarSign size={20} className="text-green-500" />, color: 'text-green-600' },
                { title: 'Purchases', value: fc(data.totalPurchases), sub: `${data.purchaseCount} entries`, icon: <ShoppingCart size={20} className="text-blue-500" />, color: 'text-blue-600' },
                { title: 'Expenses', value: fc(data.totalExpenses), sub: `${data.expenseCount} entries`, icon: <Receipt size={20} className="text-orange-500" />, color: 'text-orange-600' },
                { title: 'Net Profit', value: fc(data.netProfit), sub: data.netProfit >= 0 ? 'Profit' : 'Loss', icon: <TrendingUp size={20} className={data.netProfit >= 0 ? 'text-green-500' : 'text-red-500'} />, color: data.netProfit >= 0 ? 'text-green-600' : 'text-red-600' },
              ].map((m, idx) => (
                <div key={idx} className="bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[11px] font-medium text-gray-500 uppercase tracking-tight">{m.title}</span>
                    {m.icon}
                  </div>
                  <div className={`text-lg font-bold ${m.color}`}>{m.value}</div>
                  <div className="text-[10px] text-gray-400">{m.sub}</div>
                </div>
              ))}
            </div>
          )}

          {/* Bar Chart */}
          {data && (
            <div className="bg-white border rounded-lg p-3 shadow-sm mb-4">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Overview Chart</h2>
              <div className="flex items-end gap-3 h-44 px-2">
                {chartBars.map((bar, i) => {
                  const pct = chartMax > 0 ? (bar.value / chartMax) * 100 : 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] font-semibold text-gray-600">{fc(bar.value)}</span>
                      <div className="w-full flex items-end justify-center" style={{ height: '120px' }}>
                        <div
                          className={`${bar.color} rounded-t-md w-full max-w-[48px] transition-all duration-700 ease-out`}
                          style={{ height: `${Math.max(pct, 2)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-500 text-center leading-tight">{bar.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Profit Breakdown */}
          {data && (
            <div className="bg-white border rounded-lg p-3 shadow-sm">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Profit Breakdown</h2>
              <div className="space-y-2">
                <BarRow label="Revenue" value={data.totalRevenue} max={Math.max(data.totalRevenue, data.totalExpenses + data.totalPurchases, 1)} color="bg-green-500" fc={fc} />
                <BarRow label="Expenses" value={data.totalExpenses} max={Math.max(data.totalRevenue, data.totalExpenses + data.totalPurchases, 1)} color="bg-orange-400" fc={fc} />
                <BarRow label="Purchases" value={data.totalPurchases} max={Math.max(data.totalRevenue, data.totalExpenses + data.totalPurchases, 1)} color="bg-blue-400" fc={fc} />
                {data.totalIncome > 0 && (
                  <BarRow label="Income" value={data.totalIncome} max={Math.max(data.totalRevenue, data.totalExpenses + data.totalPurchases, 1)} color="bg-cyan-400" fc={fc} />
                )}
              </div>
              <div className="mt-2.5 pt-2 border-t flex items-baseline justify-between">
                <span className="text-xs font-medium text-gray-600">Net Profit / Loss</span>
                <span className={`text-sm font-bold ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fc(data.netProfit)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ===== Helper Components ===== */

function ReportCard({ label, sub, value, color }: { label: string; sub?: string; value: string; color: 'green' | 'red' }) {
  return (
    <div className="bg-white p-3 border rounded-lg shadow-sm">
      <div className="flex justify-between items-start gap-1">
        <div className="flex-1">
          <p className="font-bold text-gray-600 text-[13px]">{label}</p>
          {sub && <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{sub}</p>}
        </div>
        <p className={`font-bold text-[14px] whitespace-nowrap ${color === 'green' ? 'text-emerald-600' : 'text-rose-500'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function GridIcon({ label, onClick, icon }: { label: string; onClick: () => void; icon: string }) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-lg border aspect-square flex flex-col items-center justify-center p-1 shadow-sm active:scale-95 transition-all hover:shadow-md"
    >
      <div className="text-3xl mb-1">{icon}</div>
      <p className="text-[10px] font-bold text-gray-500 text-center leading-tight">{label}</p>
    </button>
  );
}

function BarRow({ label, value, max, color, fc }: { label: string; value: number; max: number; color: string; fc: (n: number) => string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-0.5">
        <span className="text-gray-500">{label}</span>
        <span className="font-medium text-gray-700">{fc(value)}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
