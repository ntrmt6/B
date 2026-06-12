import React from 'react';

interface BarGroupProps {
  date: string;
  mobileValue: number;
  tabValue: number;
  desktopValue: number;
  maxValue: number;
}

const BarGroup: React.FC<BarGroupProps> = ({ date, mobileValue, tabValue, desktopValue, maxValue }) => {
  // Calculate height as percentage of max value (max bar height is 160px)
  const getHeight = (val: number) => {
    const maxHeight = 160;
    const minHeight = 60;
    const height = Math.max(minHeight, (val / maxValue) * maxHeight);
    return height;
  };

  const Bar: React.FC<{ value: number; gradient: string }> = ({ value, gradient }) => {
    const height = getHeight(value);
    return (
      <div 
        className={`w-7 relative ${gradient} rounded-t-sm flex items-start justify-center pt-2`}
        style={{ height: `${height}px` }}
      >
        <span 
          className="text-white text-sm font-semibold font-['Lato'] transform -rotate-90 origin-center whitespace-nowrap"
          style={{ marginTop: height > 80 ? '8px' : '4px' }}
        >
          {value}
        </span>
      </div>
    );
  };

  return (
    <div className="inline-flex flex-col justify-end items-center gap-2">
      <div className="inline-flex justify-start items-end gap-0.5">
        <Bar value={mobileValue} gradient="bg-gradient-to-b from-sky-400 to-blue-500" />
        <Bar value={tabValue} gradient="bg-gradient-to-b from-amber-400 to-orange-500" />
        <Bar value={desktopValue} gradient="bg-gradient-to-b from-violet-400 to-indigo-600" />
      </div>
      <div className="justify-start text-neutral-600 text-xs font-normal font-['DM_Sans']">{date}</div>
    </div>
  );
};

interface FigmaViewsChartProps {
  chartData?: {
    date: string;
    mobile: number;
    tab: number;
    desktop: number;
  }[];
}

const FigmaViewsChart: React.FC<FigmaViewsChartProps> = ({
  chartData = [
    { date: 'Jan 25', mobile: 30, tab: 35, desktop: 40 },
    { date: 'Jan 26', mobile: 30, tab: 35, desktop: 55 },
    { date: 'Jan 27', mobile: 30, tab: 35, desktop: 70 },
    { date: 'Jan 28', mobile: 30, tab: 35, desktop: 55 },
    { date: 'Jan 29', mobile: 30, tab: 35, desktop: 40 },
    { date: 'Jan 30', mobile: 30, tab: 35, desktop: 60 },
    { date: 'Jan 31', mobile: 30, tab: 35, desktop: 40 },
  ]
}) => {
  // Calculate max value for scaling
  const maxValue = Math.max(
    ...chartData.flatMap(d => [d.mobile, d.tab, d.desktop])
  );

  return (
    <div className="w-full min-h-[300px] relative overflow-visible">
      {/* Y-axis label */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
        <span className="origin-center -rotate-90 text-center text-neutral-600 text-xs font-normal font-['DM_Sans'] whitespace-nowrap" style={{ marginLeft: '-28px' }}>
          Units of measure
        </span>
        <div className="w-px h-40 bg-stone-300" />
      </div>

      {/* Chart Bars */}
      <div className="ml-12 mr-4 pt-4 pb-2 flex justify-between items-end gap-2">
        {chartData.map((data, index) => (
          <BarGroup
            key={index}
            date={data.date}
            mobileValue={data.mobile}
            tabValue={data.tab}
            desktopValue={data.desktop}
            maxValue={maxValue}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex justify-center items-center gap-3 sm:gap-4 lg:gap-6 md:gap-12 mt-4 pb-2">
        <div className="flex justify-center items-center gap-2.5">
          <div className="w-5 h-5 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full" />
          <div className="text-center text-neutral-600 text-xs font-medium font-['DM_Sans']">Mobile View</div>
        </div>
        <div className="flex justify-center items-center gap-2.5">
          <div className="w-5 h-5 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full" />
          <div className="text-center text-neutral-600 text-xs font-medium font-['DM_Sans']">Tab View</div>
        </div>
        <div className="flex justify-center items-center gap-2.5">
          <div className="w-5 h-5 bg-gradient-to-b from-violet-400 to-indigo-600 rounded-full" />
          <div className="text-center text-neutral-600 text-xs font-medium font-['DM_Sans']">Desktop View</div>
        </div>
      </div>
    </div>
  );
};

export default FigmaViewsChart;
