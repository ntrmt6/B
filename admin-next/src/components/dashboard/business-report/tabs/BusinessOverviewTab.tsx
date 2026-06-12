import React from 'react';
import { Plus, Printer, RotateCcw } from 'lucide-react';
import { SummaryData, DueSummaryData, TabType } from '../types';

interface BusinessOverviewTabProps {
  summary: SummaryData;
  dueSummary: DueSummaryData;
  tenantId?: string;
  getDateRangeDisplayText: () => string;
  onNavigateTab: (tab: TabType) => void;
  onRefresh: () => void;
}

const BusinessOverviewTab: React.FC<BusinessOverviewTabProps> = ({
  summary,
  dueSummary,
  tenantId,
  getDateRangeDisplayText,
  onNavigateTab,
  onRefresh,
}) => {
  const fmt = (n: number) => n.toLocaleString('en-IN');

  const totalDue = dueSummary.totalWillGet + dueSummary.totalWillGive;
  const cashSell = summary.totalRevenue - dueSummary.totalWillGet;

  const handlePrintPDF = () => {
    const doc = window.open('', '_blank');
    if (!doc) return;
    const reportDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
    const htmlContent = `
      <html>
        <head>
          <title>Business Overview - ${tenantId || 'Report'}</title>
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
          <p class="meta">Store ID: ${tenantId || 'N/A'} &bull; Period: ${getDateRangeDisplayText()} &bull; Generated: ${reportDate}</p>
          <div class="section">
            <h2>General Sales Report</h2>
            <div class="card"><div><div class="label">Total Sell</div></div><div class="value green">৳ ${fmt(summary.totalRevenue)}</div></div>
            <div class="card"><div><div class="label">Cash Sell</div><div class="sub">Without Customer Due</div></div><div class="value green">৳ ${fmt(Math.max(0, cashSell))}</div></div>
            <div class="card"><div><div class="label">Customer Received</div></div><div class="value green">৳ ${fmt(dueSummary.totalWillGet)}</div></div>
            <div class="card"><div><div class="label">Cash Purchase</div><div class="sub">Without Supplier Due</div></div><div class="value red">৳ ${fmt(summary.purchaseCost)}</div></div>
            <div class="card"><div><div class="label">Supplier Due Given</div></div><div class="value red">৳ ${fmt(dueSummary.totalWillGive)}</div></div>
          </div>
          <div class="section">
            <div class="card"><div><div class="label">Total Balance</div></div><div class="value green">৳ ${fmt(summary.totalRevenue - summary.purchaseCost + summary.otherIncome - summary.otherExpenses)}</div></div>
            <div class="card"><div><div class="label">Profit from Selling Products</div></div><div class="value green">৳ ${fmt(summary.profitFromSell)}</div></div>
          </div>
          <div class="section">
            <h2>Other</h2>
            <div class="grid">
              <div class="box"><div class="sub">Other Income</div><div class="value green">৳ ${fmt(summary.otherIncome)}</div></div>
              <div class="box"><div class="sub">Other Expense</div><div class="value red">৳ ${fmt(summary.otherExpenses)}</div></div>
            </div>
          </div>
          <div class="section">
            <h2>Total Due</h2>
            <div class="card"><div class="label">Total Due</div><div class="value red">৳ ${fmt(totalDue)}</div></div>
            <div class="grid">
              <div class="box"><div class="sub">Due to Supplier</div><div class="value">৳ ${fmt(dueSummary.totalWillGive)}</div></div>
              <div class="box"><div class="sub">Due from Customer</div><div class="value">৳ ${fmt(dueSummary.totalWillGet)}</div></div>
            </div>
          </div>
        </body>
      </html>
    `;
    doc.document.write(htmlContent);
    doc.document.close();
    doc.print();
  };

  // Report card helper
  const ReportCard: React.FC<{
    label: string;
    sub?: string;
    value: string;
    color: 'green' | 'red';
  }> = ({ label, sub, value, color }) => (
    <div className="bg-white p-3 border border-gray-100 rounded-lg shadow-sm">
      <div className="flex justify-between items-start gap-1">
        <div className="flex-1">
          <p className="font-medium text-slate-900 text-[13px] font-['Roboto']">{label}</p>
          {sub && <p className="text-[10px] text-slate-500 leading-tight mt-0.5 font-['Roboto']">{sub}</p>}
        </div>
        <p className={`font-bold text-[14px] whitespace-nowrap tabular-nums font-['Roboto'] ${color === 'green' ? 'text-emerald-600' : 'text-rose-500'}`}>
          ৳ {value}
        </p>
      </div>
    </div>
  );

  // Grid icon helper
  const GridIcon: React.FC<{
    label: string;
    onClick: () => void;
    icon: string;
  }> = ({ label, onClick, icon }) => (
    <button
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-100 aspect-square flex flex-col items-center justify-center p-1 shadow-sm active:scale-95 transition-all hover:shadow-md"
    >
      <div className="text-3xl mb-1">{icon}</div>
      <p className="text-[10px] font-medium text-slate-500 text-center leading-tight font-['Roboto']">{label}</p>
    </button>
  );

  const totalBalance = summary.totalRevenue - summary.purchaseCost + summary.otherIncome - summary.otherExpenses;

  return (
    <div className="bg-[#F4F7F9] rounded-xl pb-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight font-['Roboto']">Business Overview</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="w-9 h-9 border border-gray-200 rounded-lg flex items-center justify-center text-slate-400 hover:bg-gray-50 transition-colors"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={handlePrintPDF}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 hover:bg-blue-700 transition-colors"
          >
            <Printer size={12} /> PDF
          </button>
        </div>
      </div>

      {/* Date Display */}
      <div className="px-4 mb-3">
          <div className="bg-white border border-gray-200 rounded-lg h-10 flex items-center px-3 gap-2 text-[13px] text-slate-500 font-['Roboto']">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          {getDateRangeDisplayText()}
        </div>
      </div>

      {/* General Sales Report */}
      <div className="px-4">
        <h3 className="text-[13px] font-semibold text-slate-500 mb-2 mt-1 uppercase tracking-widest font-['Roboto']">General Sales Report</h3>

        <div className="space-y-2">
          <ReportCard label="Total Sell" value={fmt(summary.totalRevenue)} color="green" />
          <ReportCard label="Cash Sell" sub="(Without Customer Due)" value={fmt(Math.max(0, cashSell))} color="green" />
          <ReportCard label="Customer Received" value={fmt(dueSummary.totalWillGet)} color="green" />
          <ReportCard label="Cash Purchase" sub="(Without Supplier Due)" value={fmt(summary.purchaseCost)} color="red" />
          <ReportCard label="Supplier Due Given" value={fmt(dueSummary.totalWillGive)} color="red" />
        </div>

        <div className="my-3 border-t border-slate-300" />

        <div className="space-y-2">
          <ReportCard
            label="Total Balance"
            sub="(Total Sell + Customer Due Received + Other Income) - (Total Purchase + Supplier Due Given + Other Expense)"
            value={fmt(totalBalance)}
            color="green"
          />
          <ReportCard
            label="Profit from Selling Products"
            sub="(Sold Products Price - Cost)"
            value={fmt(summary.profitFromSell)}
            color={summary.profitFromSell >= 0 ? 'green' : 'red'}
          />
        </div>

        {/* Other Income/Expense Summary Tiles */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={() => onNavigateTab('income')}
            className="bg-white p-3 rounded-lg border border-gray-100 text-center hover:shadow-md transition-shadow"
          >
            <p className="text-[11px] text-slate-500 font-['Roboto']">Other Income</p>
            <p className="font-bold text-emerald-600 text-sm tabular-nums font-['Roboto']">৳ {fmt(summary.otherIncome)}</p>
          </button>
          <button
            onClick={() => onNavigateTab('expense')}
            className="bg-white p-3 rounded-lg border border-gray-100 text-center hover:shadow-md transition-shadow"
          >
            <p className="text-[11px] text-slate-500 font-['Roboto']">Other Expense</p>
            <p className="font-bold text-rose-500 text-sm tabular-nums font-['Roboto']">৳ {fmt(summary.otherExpenses)}</p>
          </button>
        </div>

        {/* Add Income / Add Expense Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-2">
          <button
            onClick={() => onNavigateTab('income')}
            className="bg-emerald-500 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1 hover:bg-emerald-600 transition-colors"
          >
            <Plus size={16} /> Add Income
          </button>
          <button
            onClick={() => onNavigateTab('expense')}
            className="bg-rose-400 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1 hover:bg-rose-500 transition-colors"
          >
            <Plus size={16} /> Add Expense
          </button>
        </div>

        {/* Total Due Section */}
        <div className="bg-white mt-4 p-3 rounded-lg border border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-['Roboto']">Total Due</p>
            <p className="text-rose-500 font-bold tabular-nums font-['Roboto']">৳ {fmt(totalDue)}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 h-20">
            <button
              onClick={() => onNavigateTab('due')}
              className="bg-emerald-500 rounded-lg flex flex-col items-center justify-center text-white p-1 hover:bg-emerald-600 transition-colors"
            >
              <p className="text-[10px] text-center font-['Roboto']">Due to Supplier</p>
              <p className="font-bold text-sm tabular-nums font-['Roboto']">৳ {fmt(dueSummary.totalWillGive)}</p>
            </button>
            <button
              onClick={() => onNavigateTab('due')}
              className="bg-rose-400 rounded-lg flex flex-col items-center justify-center text-white p-1 hover:bg-rose-500 transition-colors"
            >
              <p className="text-[10px] text-center font-['Roboto']">Due from Customer</p>
              <p className="font-bold text-sm text-center leading-none tabular-nums font-['Roboto']">৳ {fmt(dueSummary.totalWillGet)}</p>
            </button>
          </div>
        </div>

        {/* All Business Reports Grid */}
        <h3 className="text-[15px] font-semibold text-slate-900 tracking-tight mt-6 mb-3 font-['Roboto']">All Business Reports</h3>
        <div className="grid grid-cols-3 gap-2">
          <GridIcon label="Sales Report" onClick={() => onNavigateTab('profit')} icon="📊" />
          <GridIcon label="Purchase Report" onClick={() => onNavigateTab('purchase')} icon="🛍️" />
          <GridIcon label="Stock Report" onClick={() => onNavigateTab('profit')} icon="📋" />
          <GridIcon label="Product Report" onClick={() => onNavigateTab('profit')} icon="📦" />
          <GridIcon label="Best Customer" onClick={() => onNavigateTab('due')} icon="👤" />
          <GridIcon label="Best Employee" onClick={() => onNavigateTab('due')} icon="👷" />
          <GridIcon label="Profit Loss" onClick={() => onNavigateTab('profit')} icon="📉" />
          <GridIcon label="Expense Report" onClick={() => onNavigateTab('expense')} icon="💸" />
          <GridIcon label="Supplier Report" onClick={() => onNavigateTab('purchase')} icon="🤝" />
          <GridIcon label="Income Report" onClick={() => onNavigateTab('income')} icon="📥" />
        </div>
      </div>
    </div>
  );
};

export default BusinessOverviewTab;
