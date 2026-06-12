import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { SummaryData, DueGraphData, DueSummaryData } from '../types';
import { DueEntity } from '../../../../types';

interface ProfitLossTabProps {
  summary: SummaryData;
  dueGraphData: DueGraphData;
  dueSummary: DueSummaryData;
  dueEntities: DueEntity[];
  chartAnimated: boolean;
  tenantId?: string;
  getDateRangeDisplayText: () => string;
}

const ProfitLossTab: React.FC<ProfitLossTabProps> = ({
  summary,
  dueGraphData,
  dueSummary,
  dueEntities,
  chartAnimated,
  tenantId,
  getDateRangeDisplayText,
}) => {
  const handlePrintFullReport = () => {
    const doc = window.open('', '_blank');
    if (!doc) return;

    const reportDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    const htmlContent = `
      <html>
        <head>
          <title>Business Report - ${tenantId}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            body { font-family: 'Inter', -apple-system, sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.5; background: #fff; }
            .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #023337; font-size: 28px; font-weight: 700; }
            .header p { margin: 4px 0 0 0; color: #64748b; font-size: 14px; }
            .section-title { font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 16px; display: flex; align-items: center; }
            .section-title::after { content: ""; flex: 1; height: 1px; background: #f1f5f9; margin-left: 15px; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
            .card { padding: 20px; border-radius: 12px; border: 1px solid #f1f5f9; background: #f8fafc; }
            .card-label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 8px; }
            .card-value { font-size: 24px; font-weight: 700; color: #0f172a; }
            .profit, .get { color: #10b981 !important; }
            .loss, .give { color: #ef4444 !important; }
            .summary-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .summary-table th { text-align: left; padding: 12px; background: #f8fafc; border-bottom: 2px solid #f1f5f9; font-size: 13px; color: #64748b; }
            .summary-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
            .summary-table tr:last-child td { border-bottom: none; }
            .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8; }
            @media print { body { padding: 20px; } .card { border: 1px solid #e2e8f0; background: none !important; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>Performance Report</h1>
              <p>Store ID: ${tenantId}</p>
            </div>
            <div style="text-align: right;">
              <p>Period: <strong>${getDateRangeDisplayText()}</strong></p>
              <p>Generated: ${reportDate}</p>
            </div>
          </div>
          <div class="section-title">Financial Summary</div>
          <div class="grid">
            <div class="card">
              <div class="card-label">Total Revenue</div>
              <div class="card-value">৳${summary.totalRevenue.toLocaleString('en-IN')}</div>
            </div>
            <div class="card">
              <div class="card-label">Net Profit (${summary.netProfitPercent.toFixed(1)}%)</div>
              <div class="card-value ${summary.isProfit ? 'profit' : 'loss'}">
                ৳${Math.abs(summary.netProfit).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
          <div class="section-title">Due Book Overview</div>
          <div class="grid">
            <div class="card" style="border-left: 4px solid #10b981;">
              <div class="card-label">Total Receivable (You will Get)</div>
              <div class="card-value profit">৳${dueSummary.totalWillGet.toLocaleString('en-IN')}</div>
            </div>
            <div class="card" style="border-left: 4px solid #ef4444;">
              <div class="card-label">Total Payable (You will Give)</div>
              <div class="card-value give">৳${dueSummary.totalWillGive.toLocaleString('en-IN')}</div>
            </div>
          </div>
          <div class="section-title">Detailed Due Records</div>
          <table class="summary-table">
            <thead>
              <tr>
                <th>Entity Name</th><th>Phone</th>
                <th style="text-align: right;">Will Get</th>
                <th style="text-align: right;">Will Give</th>
              </tr>
            </thead>
            <tbody>
              ${dueEntities.length > 0 ? dueEntities.map((e) => `
                <tr>
                  <td style="font-weight: 600;">${e.name}</td>
                  <td>${e.phone || 'N/A'}</td>
                  <td style="text-align: right;" class="get">
                    ${e.totalOwedToMe > 0 ? '৳' + e.totalOwedToMe.toLocaleString('en-IN') : '-'}
                  </td>
                  <td style="text-align: right;" class="give">
                    ${e.totalIOweThemNumber > 0 ? '৳' + e.totalIOweThemNumber.toLocaleString('en-IN') : '-'}
                  </td>
                </tr>
              `).join('') : '<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding: 20px;">No due records found for this period.</td></tr>'}
            </tbody>
          </table>
          <div class="footer">
            This is a computer-generated report from your Business Portal.
            <br/>© ${new Date().getFullYear()} ${tenantId} Store Management
          </div>
          <script>
            window.onload = function() { setTimeout(() => { window.print(); }, 500); }
          </script>
        </body>
      </html>
    `;
    doc.document.write(htmlContent);
    doc.document.close();
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-[18px] font-bold text-slate-900 tracking-tight font-['Roboto']">
            Profit/Loss Report
          </h2>
          <p className="text-[12px] text-slate-500 font-['Roboto']">
            Track your business performance and financial health
          </p>
        </div>
        <button
          onClick={handlePrintFullReport}
          className="flex items-center gap-2 bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] text-white px-4 h-[48px] rounded-lg text-[15px] font-bold tracking-[-0.3px]"
        >
          Print Report
        </button>
      </div>

      <div className="flex flex-col xl:flex-row gap-5 px-5 pb-5">
        {/* Left Column */}
        <div className="flex-1 flex flex-col gap-5">
          {/* Charts Row */}
          <div className="flex flex-col lg:flex-row gap-5">
            {/* Revenue & Costs Chart */}
            <div className="flex-1 bg-white border border-[#f9f9f9] rounded-[10px] p-[10px]">
              <p className="text-[14px] font-medium text-slate-900 font-['Roboto'] mb-2">Revenue & Costs</p>
              <div className="flex gap-3 sm:gap-4 lg:gap-6 mb-3">
                <span className="text-[14px] font-medium text-[#00c80d] font-['Roboto']">Selling Price</span>
                <span className="text-[14px] font-bold text-[#f59f0a] font-['Roboto']">Cost Price</span>
              </div>
              <div className="h-[120px] relative">
                <div className="absolute left-0 top-0 w-[50px] flex flex-col justify-between h-full text-right text-[10px] text-[#131313]/50 font-['Roboto']">
                  <span>$80K</span><span>$60K</span><span>$40K</span><span>$20K</span><span>$0</span>
                </div>
                <div className="absolute left-[55px] right-0 top-0 bottom-[20px]">
                  <svg width="100%" height="100%" viewBox="0 0 400 100" preserveAspectRatio="none" className="absolute inset-0">
                    <path
                      d={(chartAnimated && summary.totalRevenue > 0)
                        ? "M0,80 C50,70 100,50 150,40 C200,30 250,25 300,20 C350,15 400,10 400,10"
                        : "M0,95 C50,95 100,95 150,95 C200,95 250,95 300,95 C350,95 400,95 400,95"}
                      stroke="#00c80d" strokeWidth="2" fill="none"
                      style={{ transition: 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
                    />
                  </svg>
                  <svg width="100%" height="100%" viewBox="0 0 400 100" preserveAspectRatio="none" className="absolute inset-0">
                    <path
                      d={(chartAnimated && summary.purchaseCost > 0)
                        ? "M0,90 C50,85 100,70 150,60 C200,50 250,45 300,35 C350,30 400,25 400,20"
                        : "M0,95 C50,95 100,95 150,95 C200,95 250,95 300,95 C350,95 400,95 400,95"}
                      stroke="#f59f0a" strokeWidth="2" fill="none"
                      style={{ transition: 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1)', transitionDelay: '0.2s' }}
                    />
                  </svg>
                </div>
                <div className="absolute left-[55px] right-0 bottom-0 flex justify-between text-[10px] text-[#131313]/50 font-['Roboto']">
                  <span>Dec 1</span><span>Dec 8</span><span>Dec 15</span><span>Dec 22</span><span>Dec 31</span>
                </div>
              </div>
            </div>

            {/* Total Profit Chart */}
            <div className="flex-1 bg-white border border-[#f9f9f9] rounded-[10px] p-[10px]">
              <p className="text-[14px] font-medium text-slate-900 font-['Roboto'] mb-2">Total Profit</p>
              <span className="text-[14px] font-bold bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] bg-clip-text text-transparent font-['Roboto']">
                Profit
              </span>
              <div className="h-[120px] relative mt-3">
                <div className="absolute left-0 top-0 w-[40px] flex flex-col justify-between h-full text-right text-[10px] text-[#131313]/50 font-['Roboto']">
                  <span>$80K</span><span>$60K</span><span>$40K</span><span>$20K</span><span>$0</span>
                </div>
                <div className="absolute left-[45px] right-0 top-0 bottom-[20px]">
                  <svg width="100%" height="100%" viewBox="0 0 400 100" preserveAspectRatio="none" className="absolute inset-0">
                    <defs>
                      <linearGradient id="profitGradientFigma" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#1e90ff" stopOpacity="0.05"/>
                      </linearGradient>
                      <linearGradient id="profitLineGradientFigma" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#38bdf8"/>
                        <stop offset="100%" stopColor="#1e90ff"/>
                      </linearGradient>
                    </defs>
                    <path
                      d={(chartAnimated && summary.profitFromSell > 0)
                        ? "M0,90 C50,85 100,80 150,75 C200,70 250,60 300,50 C350,40 400,25 400,20 L400,100 L0,100 Z"
                        : "M0,95 C50,95 100,95 150,95 C200,95 250,95 300,95 C350,95 400,95 400,95 L400,100 L0,100 Z"}
                      fill="url(#profitGradientFigma)"
                      style={{ transition: 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
                    />
                    <path
                      d={(chartAnimated && summary.profitFromSell > 0)
                        ? "M0,90 C50,85 100,80 150,75 C200,70 250,60 300,50 C350,40 400,25 400,20"
                        : "M0,95 C50,95 100,95 150,95 C200,95 250,95 300,95 C350,95 400,95 400,95"}
                      stroke="url(#profitLineGradientFigma)" strokeWidth="3" fill="none"
                      style={{ transition: 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
                    />
                  </svg>
                </div>
                <div className="absolute left-[45px] right-0 bottom-0 flex justify-between text-[10px] text-[#131313]/50 font-['Roboto']">
                  <span>Dec 1</span><span>Dec 8</span><span>Dec 15</span><span>Dec 22</span><span>Dec 31</span>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="flex flex-col gap-3">
            <div className="bg-[#f9f9f9] rounded-lg py-3 px-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[14px] font-medium text-slate-900 font-['Roboto']">Product Selling Price</span>
                  <span className="text-[10px] text-slate-500 font-['Roboto']">Total revenue from sales</span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-[16px] font-semibold text-[#008c09] tabular-nums font-['Roboto]">
                    ৳{summary.totalRevenue.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[12px] text-slate-500 font-['Roboto']">See Details &gt;</span>
                </div>
              </div>
              <div className="h-px bg-[#e5e5e5] my-2" />
              <div className="flex items-center justify-between py-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[14px] font-medium text-slate-900 font-['Roboto']">Purchase Cost</span>
                  <span className="text-[10px] text-slate-500 font-['Roboto']">Cost of goods sold</span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-[16px] font-semibold text-[#f59f0a] tabular-nums font-['Roboto']">
                    ৳{summary.purchaseCost.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[12px] text-slate-500 font-['Roboto']">See Details &gt;</span>
                </div>
              </div>
              <div className="h-px bg-[#e5e5e5] my-2" />
              <div className="flex items-center justify-between py-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[14px] font-medium text-slate-900 font-['Roboto']">Profit From Sell</span>
                  <span className="text-[10px] text-slate-500 font-['Roboto']">Selling Price - Purchase Cost</span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className={`text-[16px] font-semibold tabular-nums font-['Roboto'] ${summary.profitFromSell >= 0 ? 'bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] bg-clip-text text-transparent' : 'text-[#da0000]'}`}>
                    ৳{summary.profitFromSell.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[12px] text-slate-500 font-['Roboto']">See Details &gt;</span>
                </div>
              </div>
            </div>

            <div className="bg-[#f9f9f9] rounded-lg py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[14px] font-medium text-slate-900 font-['Roboto']">Income</span>
                  <span className="text-[10px] text-slate-500 font-['Roboto']">Adds to profit (+)</span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-[16px] font-semibold text-[#008c09] tabular-nums font-['Roboto']">
                    ৳{summary.otherIncome.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[12px] text-slate-500 font-['Roboto']">See Details &gt;</span>
                </div>
              </div>
            </div>

            <div className="bg-[#f9f9f9] rounded-lg py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[14px] font-medium text-slate-900 font-['Roboto']">Expense</span>
                  <span className="text-[10px] text-slate-500 font-['Roboto']">Subtracts from profit (-)</span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-[16px] font-semibold text-[#da0000] tabular-nums font-['Roboto']">
                    ৳{summary.otherExpenses.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[12px] text-slate-500 font-['Roboto']">See Details &gt;</span>
                </div>
              </div>
            </div>

            <div className="bg-[#f9f9f9] border border-[#38bdf8] rounded-lg py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[14px] font-medium text-slate-900 font-['Roboto']">Net Profit</span>
                  <span className="text-[10px] text-slate-500 font-['Roboto']">Profit + Income - Expense</span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <div className="flex items-center gap-1">
                    {summary.isProfit ? (
                      <TrendingUp size={18} className="text-[#21c45d]" />
                    ) : (
                      <TrendingDown size={18} className="text-[#da0000]" />
                    )}
                    <span className={`text-[16px] font-semibold tabular-nums font-['Roboto'] ${summary.isProfit ? 'text-[#21c45d]' : 'text-[#da0000]'}`}>
                      ৳{Math.abs(summary.netProfit).toLocaleString('en-IN')}
                    </span>
                    <span className={`text-[12px] font-medium font-['Roboto'] ${summary.isProfit ? 'text-[#21c45d]' : 'text-[#da0000]'}`}>
                      ({summary.netProfitPercent.toFixed(1)}%)
                    </span>
                  </div>
                  <span className="text-[12px] text-slate-500 font-['Roboto']">See Details &gt;</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="xl:w-[316px] flex flex-col gap-5">
          {/* Business Value Card */}
          <div className="bg-[#f9f9f9] rounded-lg p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-[14px] font-medium text-slate-900 font-['Roboto']">Business Value</span>
                <span className="text-[10px] text-slate-500 font-['Roboto']">Including Dues and Inventory Value</span>
              </div>
              <div className="flex items-center">
                {summary.isProfit ? (
                  <TrendingUp size={16} className="text-[#21c45d]" />
                ) : (
                  <TrendingDown size={16} className="text-[#da0000]" />
                )}
                <span className={`text-[14px] font-medium font-['Roboto'] ml-0.5 ${summary.isProfit ? 'text-[#21c45d]' : 'text-[#da0000]'}`}>
                  {summary.netProfitPercent.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="bg-white rounded-lg px-2 py-3 mt-2">
              <span className="text-xl sm:text-2xl lg:text-[32px] font-bold text-[#085e00] tabular-nums font-['Roboto']">
                ৳{summary.businessValue.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Due Graph Card */}
          <div style={{ background: 'white', border: '1px solid #eee', borderRadius: '10px', padding: '10px 28px', display: 'flex', flexDirection: 'column', gap: '25px', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 500, fontSize: '14px', color: '#64748b', margin: 0 }}>
              Due graph
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center', width: '100%' }}>
              {/* Legend */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ width: '15px', height: '15px', borderRadius: '50%', background: '#E31B23' }} />
                  <span style={{ fontFamily: "'Roboto', sans-serif", fontSize: '12px', color: '#334155', fontWeight: 400 }}>You will Give</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ fontFamily: "'Roboto', sans-serif", fontSize: '12px', color: '#334155', fontWeight: 400 }}>You will Get</span>
                  <div style={{ width: '15px', height: '15px', borderRadius: '50%', background: '#00A651' }} />
                </div>
              </div>

              {/* Semi-circle Gauge */}
              <div style={{ position: 'relative', width: '260px', height: '130px' }}>
                <svg width="260" height="130" viewBox="0 0 260 130" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="paint0_linear_green" x1="260" y1="65" x2="0" y2="65" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#3AA600"/>
                      <stop offset="1" stopColor="#00E82A"/>
                    </linearGradient>
                    <linearGradient id="paint0_linear_red" x1="0" y1="0" x2="85" y2="130" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#E31B23"/>
                      <stop offset="1" stopColor="#8B0000"/>
                    </linearGradient>
                  </defs>
                  <path
                    d="M9.15527e-05 130C9.30452e-05 112.928 3.36263 96.0235 9.89574 80.2511C16.4289 64.4788 26.0046 50.1477 38.0762 38.0761C50.1478 26.0045 64.4789 16.4288 80.2512 9.89569C96.0236 3.36258 112.928 4.74315e-05 130 4.96702e-05C147.072 5.19089e-05 163.977 3.36259 179.749 9.8957C195.521 16.4288 209.852 26.0045 221.924 38.0762C233.996 50.1478 243.571 64.4789 250.104 80.2512C256.637 96.0235 260 112.928 260 130L208.165 130C208.165 119.735 206.143 109.571 202.215 100.088C198.287 90.6043 192.529 81.9875 185.271 74.7292C178.013 67.471 169.396 61.7134 159.912 57.7853C150.429 53.8571 140.265 51.8354 130 51.8354C119.735 51.8354 109.571 53.8571 100.088 57.7853C90.6044 61.7134 81.9876 67.471 74.7293 74.7292C67.471 81.9875 61.7135 90.6043 57.7853 100.088C53.8572 109.571 51.8354 119.735 51.8354 130L9.15527e-05 130Z"
                    fill="url(#paint0_linear_green)"
                  />
                  {dueGraphData.givePercent >= 50 ? (
                    <path
                      d="M0 130C0 112.928 3.36254 96.0235 9.89565 80.2511C16.4288 64.4788 26.0045 50.1477 38.0761 38.0761C50.1477 26.0045 64.4788 16.4288 80.2511 9.89569C96.0235 3.36258 112.928 0 130 0L130 51.8354C119.735 51.8354 109.571 53.8571 100.088 57.7853C90.6043 61.7134 81.9875 67.471 74.7292 74.7292C67.471 81.9875 61.7134 90.6043 57.7853 100.088C53.8571 109.571 51.8354 119.735 51.8354 130L0 130Z"
                      fill="url(#paint0_linear_red)"
                    />
                  ) : dueGraphData.givePercent >= 30 ? (
                    <path
                      d="M0 130C0 112.928 3.36254 96.0235 9.89565 80.2511C16.4288 64.4788 26.0045 50.1477 38.0761 38.0761C50.1477 26.0045 64.4788 16.4288 80.2511 9.89569L100.088 57.7853C90.6043 61.7134 81.9875 67.471 74.7292 74.7292C67.471 81.9875 61.7134 90.6043 57.7853 100.088C53.8571 109.571 51.8354 119.735 51.8354 130L0 130Z"
                      fill="url(#paint0_linear_red)"
                    />
                  ) : dueGraphData.givePercent > 0 ? (
                    <path
                      d="M0 130C0 112.928 3.36254 96.0235 9.89565 80.2511C16.4288 64.4788 26.0045 50.1477 38.0761 38.0761L74.7292 74.7292C67.471 81.9875 61.7134 90.6043 57.7853 100.088C53.8571 109.571 51.8354 119.735 51.8354 130L0 130Z"
                      fill="url(#paint0_linear_red)"
                    />
                  ) : null}
                  {dueGraphData.givePercent > 5 && (
                    <text x="25" y="90" fill="white" fontSize="11" fontFamily="Roboto, sans-serif" fontWeight="500">{dueGraphData.givePercent}%</text>
                  )}
                  {dueGraphData.getPercent > 5 && (
                    <text x="200" y="50" fill="white" fontSize="11" fontFamily="Roboto, sans-serif" fontWeight="500">{dueGraphData.getPercent}%</text>
                  )}
                </svg>
              </div>
            </div>

            {/* Values Row */}
            <div style={{ background: 'white', borderRadius: '8px', display: 'flex', gap: '138px', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start', width: '61px' }}>
                <span style={{ fontFamily: "'Roboto', sans-serif", fontSize: '10px', color: '#334155', fontWeight: 400 }}>You will Give</span>
                <span style={{ fontFamily: "'Roboto', 'Noto Sans Bengali', sans-serif", fontSize: '16px', fontWeight: 700, color: '#da0000', fontVariantNumeric: 'tabular-nums' }}>
                  ৳{dueGraphData.youWillGive.toLocaleString('en-IN')}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end', justifyContent: 'center', width: '61px' }}>
                <span style={{ fontFamily: "'Roboto', sans-serif", fontSize: '10px', color: '#334155', fontWeight: 400 }}>You will Get</span>
                <span style={{ fontFamily: "'Roboto', 'Noto Sans Bengali', sans-serif", fontSize: '16px', fontWeight: 700, color: '#008c09', fontVariantNumeric: 'tabular-nums' }}>
                  ৳{dueGraphData.youWillGet.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitLossTab;
