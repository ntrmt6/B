import React from 'react';

interface DayData {
  date: string;
  mobile: number;
  tablet: number;
  desktop: number;
}

interface DeviceViewChartProps {
  data?: DayData[];
}

const DeviceViewChart: React.FC<DeviceViewChartProps> = ({
  data = [
    { date: 'Jan 25', mobile: 30, tablet: 35, desktop: 40 },
    { date: 'Jan 26', mobile: 30, tablet: 35, desktop: 55 },
    { date: 'Jan 27', mobile: 30, tablet: 35, desktop: 70 },
    { date: 'Jan 28', mobile: 30, tablet: 35, desktop: 55 },
    { date: 'Jan 29', mobile: 30, tablet: 35, desktop: 40 },
    { date: 'Jan 30', mobile: 30, tablet: 35, desktop: 60 },
    { date: 'Jan 31', mobile: 30, tablet: 35, desktop: 40 },
  ]
}) => {
  // Map desktop values to height classes
  const getDesktopHeight = (value: number) => {
    if (value >= 70) return 'h-40 sm:h-44';
    if (value >= 60) return 'h-32 sm:h-36';
    if (value >= 55) return 'h-28 sm:h-32';
    if (value >= 40) return 'h-24 sm:h-28';
    return 'h-20 sm:h-24';
  };

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm hover:shadow-lg hover:shadow-slate-500/10 transition-all h-full overflow-hidden">
      <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-3">
        Device Views
      </h3>
      
      <div className="flex h-full">
        {/* Y-axis label */}
        <div className="flex flex-col justify-center h-44 sm:h-48 mr-2">
          <span 
            className="text-xs text-slate-500 whitespace-nowrap font-medium"
            style={{ 
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)'
            }}
          >
            Units
          </span>
        </div>

        <div className="flex-1 flex flex-col">
          {/* Bar Chart */}
          <div className="inline-flex justify-between items-end flex-1 px-1">
            {data.map((day, index) => (
              <div key={index} className="inline-flex flex-col justify-center items-center gap-0.5">
                {/* Bars Group */}
                <div className="inline-flex justify-start items-end gap-0.5">
                  {/* Mobile Bar - Blue */}
                  <div className="w-5 h-16 sm:h-20 relative bg-gradient-to-b from-blue-400 to-blue-600 rounded-t overflow-hidden group-hover:opacity-90 transition-opacity">
                    <div 
                      className="left-[2px] top-[5px] absolute origin-top-left -rotate-90 text-center text-white text-xs font-bold"
                    >
                      {day.mobile}
                    </div>
                  </div>
                  
                  {/* Tablet Bar - Orange */}
                  <div className="w-5 h-20 sm:h-24 relative bg-gradient-to-b from-amber-400 to-orange-600 rounded-t overflow-hidden group-hover:opacity-90 transition-opacity">
                    <div 
                      className="left-[2px] top-[5px] absolute origin-top-left -rotate-90 text-right text-white text-xs font-bold"
                    >
                      {day.tablet}
                    </div>
                  </div>
                  
                  {/* Desktop Bar - Purple */}
                  <div className={`w-5 ${getDesktopHeight(day.desktop)} relative bg-gradient-to-b from-violet-400 to-indigo-600 rounded-t overflow-hidden group-hover:opacity-90 transition-opacity`}>
                    <div 
                      className="left-[2px] top-[5px] absolute origin-top-left -rotate-90 text-right text-white text-xs font-bold"
                    >
                      {day.desktop}
                    </div>
                  </div>
                </div>
                
                {/* Date Label */}
                <div className="text-slate-500 text-[10px] sm:text-xs font-medium">
                  {day.date}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 sm:gap-5 mt-3 pt-2.5 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full"></div>
              <span className="text-[10px] sm:text-xs text-slate-600 font-medium">
                Mobile
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full"></div>
              <span className="text-[10px] sm:text-xs text-slate-600 font-medium">
                Tablet
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-gradient-to-br from-violet-400 to-indigo-600 rounded-full"></div>
              <span className="text-[10px] sm:text-xs text-slate-600 font-medium">
                Desktop
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceViewChart;
