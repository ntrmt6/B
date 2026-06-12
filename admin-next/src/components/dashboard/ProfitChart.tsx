import React, { useEffect, useState, useMemo } from 'react';
import { ProfitChartProps } from './types';

const ProfitChart: React.FC<ProfitChartProps> = ({ data }) => {
  const [isAnimated, setIsAnimated] = useState(false);

  // Check if there's actual data with values
  const hasData = useMemo(() => {
    return data && data.length > 0 && data.some(d => (d.value || 0) > 0);
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
    <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm">
      <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 font-['Roboto']">
        Total Profit
      </h3>

      <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
        <span className="w-3 h-0.5 bg-blue-500"></span>
        <span className="text-[10px] sm:text-xs text-blue-500 font-medium">Profit</span>
      </div>

      {/* Area Chart */}
      <div className="h-36 sm:h-44 relative">
        <svg className="w-full h-full" viewBox="0 0 300 150" preserveAspectRatio="none">
          <defs>
            <linearGradient id="profitGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Y-axis labels */}
          <text x="0" y="15" className="text-[9px] fill-gray-400">$80K</text>
          <text x="0" y="42" className="text-[9px] fill-gray-400">$60K</text>
          <text x="0" y="69" className="text-[9px] fill-gray-400">$40K</text>
          <text x="0" y="96" className="text-[9px] fill-gray-400">$20K</text>
          <text x="0" y="123" className="text-[9px] fill-gray-400">$0</text>

          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map(i => (
            <line key={i} x1="28" y1={12 + i * 27} x2="295" y2={12 + i * 27} stroke="#E5E7EB" strokeWidth="0.5" />
          ))}

          {/* Profit Area - Animated from flat to curved when data exists */}
          <path
            d={showCurved 
              ? "M28,100 Q80,70 150,50 T270,30 L270,120 L28,120 Z" 
              : "M28,110 Q80,110 150,110 T270,110 L270,120 L28,120 Z"
            }
            fill="url(#profitGradient)"
            style={{ transition: 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
          <path
            d={showCurved 
              ? "M28,100 Q80,70 150,50 T270,30" 
              : "M28,110 Q80,110 150,110 T270,110"
            }
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
            strokeLinecap="round"
            style={{ transition: 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        </svg>

        {/* X-axis labels */}
        <div className="absolute bottom-0 left-7 right-0 flex justify-between text-[8px] sm:text-[10px] text-gray-400">
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

export default ProfitChart;
