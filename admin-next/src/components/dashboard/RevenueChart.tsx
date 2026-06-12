import React, { useEffect, useState, useMemo } from 'react';
import { RevenueChartProps } from './types';

const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  const [isAnimated, setIsAnimated] = useState(false);

  // Check if there's actual data with values
  const hasData = useMemo(() => {
    return data && data.length > 0 && data.some(d => (d.sales || 0) > 0 || (d.costs || 0) > 0);
  }, [data]);

  useEffect(() => {
    // Only animate if there's data
    if (hasData) {
      const timer = setTimeout(() => setIsAnimated(true), 100);
      return () => clearTimeout(timer);
    }
  }, [hasData]);

  // Should show curved chart only when animated AND has data
  const showCurved = isAnimated && hasData;

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm hover:shadow-lg hover:shadow-slate-500/10 transition-all">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm sm:text-base font-bold text-slate-900">
          Revenue & Costs
        </h3>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 bg-blue-500 rounded-full"></span>
            <span className="text-[10px] sm:text-xs text-slate-600 font-medium">Sales</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 bg-red-400 rounded-full"></span>
            <span className="text-[10px] sm:text-xs text-slate-600 font-medium">Costs</span>
          </div>
        </div>
      </div>

      {/* Area Chart */}
      <div className="h-36 sm:h-40 relative">
        <svg className="w-full h-full" viewBox="0 0 300 150" preserveAspectRatio="none">
          <defs>
            <linearGradient id="salesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Y-axis labels */}
          <text x="0" y="15" className="text-[9px] fill-slate-400">$80K</text>
          <text x="0" y="42" className="text-[9px] fill-slate-400">$60K</text>
          <text x="0" y="69" className="text-[9px] fill-slate-400">$40K</text>
          <text x="0" y="96" className="text-[9px] fill-slate-400">$20K</text>
          <text x="0" y="123" className="text-[9px] fill-slate-400">$0</text>

          {/* Grid lines - lighter */}
          {[0, 1, 2, 3, 4].map(i => (
            <line key={i} x1="28" y1={12 + i * 27} x2="295" y2={12 + i * 27} stroke="#F1F5F9" strokeWidth="0.5" />
          ))}

          {/* Sales Area - Animated from flat to curved when data exists */}
          <path
            d={showCurved 
              ? "M28,95 Q80,55 150,75 T270,35 L270,120 L28,120 Z" 
              : "M28,110 Q80,110 150,110 T270,110 L270,120 L28,120 Z"
            }
            fill="url(#salesGradient)"
            style={{ transition: 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
          <path
            d={showCurved 
              ? "M28,95 Q80,55 150,75 T270,35" 
              : "M28,110 Q80,110 150,110 T270,110"
            }
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{ transition: 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />

          {/* Costs Line - Animated from flat to curved when data exists */}
          <path
            d={showCurved 
              ? "M28,105 Q80,85 150,90 T270,65" 
              : "M28,110 Q80,110 150,110 T270,110"
            }
            fill="none"
            stroke="#F87171"
            strokeWidth="2"
            strokeDasharray="5,5"
            style={{ transition: 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1)', transitionDelay: '0.2s' }}
          />
        </svg>

        {/* X-axis labels */}
        <div className="absolute bottom-0 left-7 right-0 flex justify-between text-[8px] sm:text-[9px] text-slate-400 font-medium">
          <span>Dec 1</span>
          <span className="hidden xs:inline">Dec 8</span>
          <span>Dec 15</span>
          <span className="hidden xs:inline">Dec 22</span>
          <span>Dec 29</span>
        </div>
      </div>
    </div>
  );
};

export default RevenueChart;
