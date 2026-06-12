import React, { useMemo } from 'react';
import { CategoryChartProps } from './types';
import { CATEGORY_COLORS } from './utils';

const CategoryChart: React.FC<CategoryChartProps> = ({ data = [] }) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return [
        { name: 'Electronics', value: 35, color: '#3B82F6' },
        { name: 'Clothing', value: 25, color: '#10B981' },
        { name: 'Home & Garden', value: 18, color: '#F59E0B' },
        { name: 'Sports', value: 12, color: '#8B5CF6' },
        { name: 'Books', value: 7, color: '#EC4899' },
        { name: 'Other', value: 3, color: '#06B6D4' },
      ];
    }
    const total = data.reduce((sum, d) => sum + d.value, 0);
    return data.map((d, i) => ({
      ...d,
      value: total > 0 ? Math.round((d.value / total) * 100) : 0,
      color: d.color || CATEGORY_COLORS[i % CATEGORY_COLORS.length].bg
    }));
  }, [data]);

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100 sm:col-span-2 lg:col-span-1">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-gray-900 text-sm sm:text-base font-semibold font-['Roboto']">
            Sale by Category
          </h3>
          <p className="text-gray-500 text-xs mt-0.5">Product category distribution</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-4">
        {chartData.slice(0, 4).map((cat, index) => (
          <div key={index} className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-full">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: cat.color }}
            ></span>
            <span className="text-[10px] sm:text-xs text-gray-600 truncate max-w-[60px]">{cat.name}</span>
          </div>
        ))}
      </div>

      {/* Semi-Donut Chart */}
      <div className="flex justify-center items-center">
        <div className="relative w-full max-w-[220px] h-[130px]">
          <svg viewBox="0 0 220 130" className="w-full h-full">
            <defs>
              <filter id="dropShadowCat" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.15"/>
              </filter>
            </defs>
            
            {(() => {
              const centerX = 110;
              const centerY = 115;
              const outerRadius = 100;
              const innerRadius = 60;
              let cumulativeAngle = 180;

              return chartData.map((item, index) => {
                const angle = (item.value / total) * 180;
                const startAngle = cumulativeAngle;
                const endAngle = startAngle - angle;
                cumulativeAngle = endAngle;

                const startRad = (startAngle * Math.PI) / 180;
                const endRad = (endAngle * Math.PI) / 180;

                const x1 = centerX + outerRadius * Math.cos(startRad);
                const y1 = centerY - outerRadius * Math.sin(startRad);
                const x2 = centerX + outerRadius * Math.cos(endRad);
                const y2 = centerY - outerRadius * Math.sin(endRad);

                const x3 = centerX + innerRadius * Math.cos(endRad);
                const y3 = centerY - innerRadius * Math.sin(endRad);
                const x4 = centerX + innerRadius * Math.cos(startRad);
                const y4 = centerY - innerRadius * Math.sin(startRad);

                const largeArc = angle > 90 ? 1 : 0;

                const midAngle = (startAngle + endAngle) / 2;
                const midRad = (midAngle * Math.PI) / 180;
                const labelRadius = (outerRadius + innerRadius) / 2;
                const labelX = centerX + labelRadius * Math.cos(midRad);
                const labelY = centerY - labelRadius * Math.sin(midRad);

                return (
                  <g key={index} className="cursor-pointer hover:opacity-80 transition-opacity">
                    <path
                      d={`M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`}
                      fill={item.color}
                      filter="url(#dropShadowCat)"
                    />
                    {item.value >= 10 && (
                      <text
                        x={labelX}
                        y={labelY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-white font-semibold"
                        style={{ fontSize: '11px' }}
                      >
                        {item.value}%
                      </text>
                    )}
                  </g>
                );
              });
            })()}
            
            {/* Center text */}
            <text
              x="110"
              y="105"
              textAnchor="middle"
              className="fill-gray-900 font-bold"
              style={{ fontSize: '16px' }}
            >
              {total}%
            </text>
            <text
              x="110"
              y="120"
              textAnchor="middle"
              className="fill-gray-400"
              style={{ fontSize: '9px' }}
            >
              Total
            </text>
          </svg>
        </div>
      </div>

      {/* Category List */}
      <div className="mt-4 space-y-2">
        {chartData.slice(0, 3).map((cat, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: cat.color }}
              ></div>
              <span className="text-xs text-gray-600">{cat.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${cat.value}%`,
                    backgroundColor: cat.color
                  }}
                ></div>
              </div>
              <span className="text-xs font-medium text-gray-700 w-8 text-right">{cat.value}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryChart;
