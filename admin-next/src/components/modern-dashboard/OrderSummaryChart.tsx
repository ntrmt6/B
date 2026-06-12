import React from 'react';

interface OrderStatus {
  label: string;
  percentage: number;
  color: string;
  bgColor: string;
}

interface DonutChartProps {
  data: OrderStatus[];
  total: number;
}

/**
 * A dynamic Donut Chart component that renders based on percentage values.
 */
export const DonutChart = ({ data }: DonutChartProps) => {
  let cumulativePercentage = 0;
  const radius = 40;
  const strokeWidth = 12;
  const center = 50;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg 
      viewBox="0 0 100 100" 
      className="w-full h-full transform -rotate-90"
    >
      {data.map((item, index) => {
        const strokeDasharray = `${(item.percentage * circumference) / 100} ${circumference}`;
        const strokeDashoffset = -(cumulativePercentage * circumference) / 100;
        cumulativePercentage += item.percentage;

        return (
          <circle
            key={index}
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke={item.color}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-in-out"
          />
        );
      })}
    </svg>
  );
};

interface OrderSummaryChartProps {
  orderStatuses?: OrderStatus[];
  totalOrders?: number;
}

/**
 * OrderSummaryChart Component - Responsive, embeddable inside dashboard
 */
function OrderSummaryChart({ orderStatuses, totalOrders }: OrderSummaryChartProps) {
  const defaultStatuses: OrderStatus[] = [
    { label: "Pending", percentage: 31, color: "#26007e", bgColor: "bg-[#26007e]" },
    { label: "Confirmed", percentage: 20, color: "#7ad100", bgColor: "bg-[#7ad100]" },
    { label: "Delivered", percentage: 14, color: "#1883ff", bgColor: "bg-[#1883ff]" },
    { label: "Canceled", percentage: 11, color: "#fab300", bgColor: "bg-[#fab300]" },
    { label: "Paid Returned", percentage: 15, color: "#c71cb6", bgColor: "bg-[#c71cb6]" },
    { label: "Returned", percentage: 9, color: "#da0000", bgColor: "bg-[#da0000]" },
  ];

  const statuses = orderStatuses || defaultStatuses;
  const total = totalOrders || 1250;

  return (
    <div className="w-full bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-3 sm:p-4 md:p-5 lg:p-6">
        <h2 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 mb-3 sm:mb-4 lg:mb-5">
          Order Summary
        </h2>

        <div className="flex flex-col xs:flex-row items-center justify-between gap-4 sm:gap-6 lg:gap-8 w-full">
          {/* Donut Chart */}
          <div className="relative w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] lg:w-[180px] lg:h-[180px] shrink-0">
            <DonutChart data={statuses} total={total} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-gray-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">Total</span>
              <span className="text-gray-900 font-extrabold text-xl sm:text-2xl lg:text-3xl leading-none my-0.5">
                {total}
              </span>
              <span className="text-gray-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">Orders</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-2 sm:gap-2.5 w-full xs:w-auto">
            <ul className="grid grid-cols-2 xs:grid-cols-1 gap-1.5 sm:gap-2.5" role="list">
              {statuses.map((status, index) => (
                <li key={index} className="flex items-center gap-2 sm:gap-3">
                  <span
                    className={`shrink-0 w-2 h-2 sm:w-2.5 sm:h-2.5 ${status.bgColor} rounded-full`}
                    aria-hidden="true"
                  />
                  <p className="text-xs sm:text-sm font-semibold whitespace-nowrap">
                    <span className="text-slate-700">{status.label} </span>
                    <span className="text-gray-400 font-normal ml-0.5">(</span>
                    <span style={{ color: status.color }}>{status.percentage}%</span>
                    <span className="text-gray-400 font-normal">)</span>
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderSummaryChart;
