

/**
 * DonutChart Component
 * * A responsive order summary component featuring a donut chart
 * and a detailed legend with color-coded status indicators.
 */
export default function DonutChart() {
  const data = [
    { label: 'Pending', percentage: 31, color: '#26007e' },
    { label: 'Confirmed', percentage: 20, color: '#7ad100' },
    { label: 'Delivered', percentage: 14, color: '#1883ff' },
    { label: 'Canceled', percentage: 11, color: '#fab300' },
    { label: 'Paid Returned', percentage: 15, color: '#c71cb6' },
    { label: 'Returned', percentage: 9, color: '#da0000' },
  ];

  const totalOrders = 1250;
  
  // SVG Donut Calculations
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  let currentOffset = 0;

  return (
    <div className="flex flex-col w-[408px] h-[310px] items-start gap-[21px] px-4 py-[21px] relative bg-white rounded-[10px] shadow-sm overflow-hidden font-sans">
      {/* Header */}
      <div className="relative w-full">
        <h2 className="text-[#23272e] font-bold text-lg tracking-tight">
          Order Summary
        </h2>
      </div>

      <div className="flex items-center justify-between gap-4 relative self-stretch w-full flex-grow">
        {/* Donut Chart Container */}
        <div className="relative w-[174px] h-[174px] flex items-center justify-center">
          <svg viewBox="0 0 160 160" className="w-full h-full transform -rotate-90">
            {data.map((item, index) => {
              const strokeDasharray = `${(item.percentage * circumference) / 100} ${circumference}`;
              const strokeDashoffset = -currentOffset;
              currentOffset += (item.percentage * circumference) / 100;

              return (
                <circle
                  key={index}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth="16"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500 ease-in-out"
                />
              );
            })}
          </svg>

          {/* Center Text Overlays */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[#939393] text-xs font-normal mb-[-4px]">Total</span>
            <span className="text-black font-bold text-3xl">{totalOrders}</span>
            <span className="text-[#939393] text-xs font-normal mt-[-2px]">Order</span>
          </div>
        </div>

        {/* Legend Section */}
        <div className="flex flex-col items-start gap-2.5 flex-1 pl-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2.5 w-full">
              <div 
                className="w-3 h-3 rounded-sm flex-shrink-0" 
                style={{ backgroundColor: item.color }} 
              />
              <p className="text-sm font-medium text-black whitespace-nowrap">
                {item.label} (
                <span style={{ color: item.color }}>{item.percentage}%</span>
                )
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const DonutChartExport = DonutChart;