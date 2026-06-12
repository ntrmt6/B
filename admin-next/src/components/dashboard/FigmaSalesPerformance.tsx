import React, { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Order } from '../../types';
import CustomDateRangePicker, { DateRange } from './CustomDateRangePicker';

interface ChartData {
  label: string;
  placedOrder: number;
  delivered: number;
  canceled: number;
}

type TimeFilterType = 'day' | 'week' | 'year' | 'custom';

const DATE_RANGE_OPTIONS: { id: TimeFilterType; label: string }[] = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'year', label: 'Year' },
];

interface FigmaSalesPerformanceProps {
  orders?: Order[];
  data?: ChartData[];
  timeFilter?: 'day' | 'month' | 'year' | 'all' | 'custom';
  selectedMonth?: Date;
}

const FigmaSalesPerformance: React.FC<FigmaSalesPerformanceProps> = ({
  orders = [],
  data: propData,
  timeFilter: externalTimeFilter,
  selectedMonth: externalSelectedMonth
}) => {
  const [internalTimeFilter, setInternalTimeFilter] = useState<TimeFilterType>('year');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<DateRange>({ startDate: null, endDate: null });

  const timeFilter = internalTimeFilter;

  // Last 5 years for yearly view
  const last5Years = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => current - 4 + i); // oldest to newest
  }, []);

  // Calculate data based on timeFilter
  const chartData = useMemo(() => {
    const now = new Date();
    
    if (timeFilter === 'year') {
      // Show last 5 years
      const yearStats: ChartData[] = last5Years.map(year => ({
        label: String(year),
        placedOrder: 0,
        delivered: 0,
        canceled: 0
      }));

      orders.forEach(order => {
        const orderDate = order.createdAt ? new Date(order.createdAt) : (order.date ? new Date(order.date) : null);
        if (!orderDate) return;
        
        const orderYear = orderDate.getFullYear();
        const yearIndex = last5Years.indexOf(orderYear);
        if (yearIndex >= 0) {
          yearStats[yearIndex].placedOrder++;
          if (order.status === 'Delivered') yearStats[yearIndex].delivered++;
          if (order.status === 'Cancelled') yearStats[yearIndex].canceled++;
        }
      });

      return yearStats;
    } else if (timeFilter === 'week') {
      // Show last 7 days
      const weekStats: ChartData[] = [];
      const dayTimestamps: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        date.setHours(0, 0, 0, 0);
        dayTimestamps.push(date.getTime());
        weekStats.push({
          label: date.toLocaleDateString('en-GB', { weekday: 'short' }),
          placedOrder: 0,
          delivered: 0,
          canceled: 0
        });
      }

      orders.forEach(order => {
        const orderDate = order.createdAt ? new Date(order.createdAt) : (order.date ? new Date(order.date) : null);
        if (!orderDate) return;
        
        const normalizedOrder = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate()).getTime();
        const idx = dayTimestamps.indexOf(normalizedOrder);
        if (idx >= 0) {
          weekStats[idx].placedOrder++;
          if (order.status === 'Delivered') weekStats[idx].delivered++;
          if (order.status === 'Cancelled') weekStats[idx].canceled++;
        }
      });

      return weekStats;
    } else if (timeFilter === 'custom') {
      // Show custom date range
      if (!customDateRange.startDate || !customDateRange.endDate) {
        return [{ label: '-', placedOrder: 0, delivered: 0, canceled: 0 }];
      }

      const start = new Date(customDateRange.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(customDateRange.endDate);
      end.setHours(23, 59, 59, 999);
      
      const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays <= 1) {
        // Single day - show hours
        const hourStats: ChartData[] = Array.from({ length: 24 }, (_, i) => ({
          label: `${i}:00`,
          placedOrder: 0,
          delivered: 0,
          canceled: 0
        }));

        orders.forEach(order => {
          const orderDate = order.createdAt ? new Date(order.createdAt) : (order.date ? new Date(order.date) : null);
          if (!orderDate || orderDate < start || orderDate > end) return;
          const hour = orderDate.getHours();
          hourStats[hour].placedOrder++;
          if (order.status === 'Delivered') hourStats[hour].delivered++;
          if (order.status === 'Cancelled') hourStats[hour].canceled++;
        });
        return hourStats;
      } else if (diffDays <= 31) {
        // Up to a month - show each day
        const dailyStats: ChartData[] = [];
        const startTime = start.getTime();
        for (let dayOffset = 0; dayOffset <= diffDays; dayOffset++) {
          const d = new Date(startTime + dayOffset * 86400000);
          dailyStats.push({
            label: `${d.getDate()}/${d.getMonth() + 1}`,
            placedOrder: 0,
            delivered: 0,
            canceled: 0
          });
        }

        orders.forEach(order => {
          const orderDate = order.createdAt ? new Date(order.createdAt) : (order.date ? new Date(order.date) : null);
          if (!orderDate || orderDate < start || orderDate > end) return;
          
          const dayDiff = Math.floor((orderDate.getTime() - startTime) / 86400000);
          if (dayDiff >= 0 && dayDiff < dailyStats.length) {
            dailyStats[dayDiff].placedOrder++;
            if (order.status === 'Delivered') dailyStats[dayDiff].delivered++;
            if (order.status === 'Cancelled') dailyStats[dayDiff].canceled++;
          }
        });
        return dailyStats;
      } else {
        // More than a month - show by month
        const monthStats: ChartData[] = [];
        const current = new Date(start.getFullYear(), start.getMonth(), 1);
        const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
        
        while (current <= endMonth) {
          monthStats.push({
            label: current.toLocaleString('default', { month: 'short', year: '2-digit' }),
            placedOrder: 0,
            delivered: 0,
            canceled: 0
          });
          current.setMonth(current.getMonth() + 1);
        }

        orders.forEach(order => {
          const orderDate = order.createdAt ? new Date(order.createdAt) : (order.date ? new Date(order.date) : null);
          if (!orderDate || orderDate < start || orderDate > end) return;
          
          const monthDiff = (orderDate.getFullYear() - start.getFullYear()) * 12 + (orderDate.getMonth() - start.getMonth());
          if (monthDiff >= 0 && monthDiff < monthStats.length) {
            monthStats[monthDiff].placedOrder++;
            if (order.status === 'Delivered') monthStats[monthDiff].delivered++;
            if (order.status === 'Cancelled') monthStats[monthDiff].canceled++;
          }
        });
        return monthStats;
      }
    } else if (timeFilter === 'day') {
      // Show hours of today
      const todayStats: ChartData[] = Array.from({ length: 24 }, (_, i) => ({
        label: `${i}:00`,
        placedOrder: 0,
        delivered: 0,
        canceled: 0
      }));

      orders.forEach(order => {
        const orderDate = order.createdAt ? new Date(order.createdAt) : (order.date ? new Date(order.date) : null);
        if (!orderDate || orderDate.toDateString() !== now.toDateString()) return;
        
        const hour = orderDate.getHours();
        todayStats[hour].placedOrder++;
        if (order.status === 'Delivered') todayStats[hour].delivered++;
        if (order.status === 'Cancelled') todayStats[hour].canceled++;
      });

      return todayStats;
    } else {
      // All time - show last 12 months
      const monthStats: ChartData[] = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthStats.push({
          label: date.toLocaleString('default', { month: 'short' }),
          placedOrder: 0,
          delivered: 0,
          canceled: 0
        });
      }

      orders.forEach(order => {
        const orderDate = order.createdAt ? new Date(order.createdAt) : (order.date ? new Date(order.date) : null);
        if (!orderDate) return;
        
        for (let i = 11; i >= 0; i--) {
          const checkDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          if (orderDate.getMonth() === checkDate.getMonth() && orderDate.getFullYear() === checkDate.getFullYear()) {
            const idx = 11 - i;
            monthStats[idx].placedOrder++;
            if (order.status === 'Delivered') monthStats[idx].delivered++;
            if (order.status === 'Cancelled') monthStats[idx].canceled++;
            break;
          }
        }
      });

      return monthStats;
    }
  }, [orders, timeFilter, last5Years, customDateRange]);

  // Use chartData directly - flat (zero) values when no orders
  const displayData = chartData;

  const maxValue = Math.max(100, ...displayData.map(d => Math.max(d.placedOrder, d.delivered, d.canceled)));
  
  // Creates sharp angular lines (not smooth curves)
  const createSharpPath = (values: number[], chartWidth: number, chartHeight: number) => {
    const points = values.map((value, index) => ({
      x: (index / (values.length - 1)) * chartWidth,
      y: chartHeight - (value / maxValue) * chartHeight
    }));
    if (points.length < 2) return '';
    let path = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x},${points[i].y}`;
    }
    return path;
  };

  return (
    <div className="w-full h-56 sm:h-72 p-2 xs:p-2.5 sm:p-3 bg-white dark:bg-gray-800 rounded-xl border border-zinc-200 dark:border-gray-700 flex flex-col justify-start items-start gap-1 xs:gap-1.5 overflow-hidden">
      {/* Header */}
      <div className="w-full flex flex-wrap justify-between items-center gap-2 xs:gap-2.5">
        <div className="text-zinc-800 dark:text-white text-sm sm:text-lg font-bold font-family: Poppins, Helvetica, sans-serif">Sale Performance</div>
        <div className="flex items-center gap-1.5 sm:gap-2 relative">
          {DATE_RANGE_OPTIONS.map(option => (
            <button
              key={option.id}
              onClick={() => { setInternalTimeFilter(option.id); setShowCustomDatePicker(false); }}
              className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg font-medium font-['Roboto'] text-[10px] sm:text-[12px] cursor-pointer transition-colors ${
                timeFilter === option.id
                  ? 'bg-gradient-to-b from-[#ff6a00] to-[#ff9f1c] text-white'
                  : 'bg-[#f9f9f9] text-[#a7a7a7] dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {option.label}
            </button>
          ))}
          <div className="relative">
            <button
              onClick={() => {
                if (timeFilter === 'custom') {
                  setShowCustomDatePicker(!showCustomDatePicker);
                } else {
                  setInternalTimeFilter('custom');
                  setShowCustomDatePicker(true);
                }
              }}
              className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg font-medium font-['Roboto'] text-[10px] sm:text-[12px] flex items-center gap-1 cursor-pointer transition-colors ${
                timeFilter === 'custom'
                  ? 'bg-gradient-to-b from-[#ff6a00] to-[#ff9f1c] text-white'
                  : 'bg-[#f9f9f9] text-[#a7a7a7] dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              Custom
              <ChevronDown size={12} className={showCustomDatePicker ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </button>
            <CustomDateRangePicker
              isOpen={showCustomDatePicker}
              onClose={() => setShowCustomDatePicker(false)}
              onApply={(range) => {
                setCustomDateRange(range);
                setInternalTimeFilter('custom');
                setShowCustomDatePicker(false);
              }}
              initialDateRange={customDateRange}
            />
          </div>
        </div>
      </div>

      {/* Legend - Wrap on mobile */}
      <div className="flex flex-wrap justify-start items-center gap-1.5 xs:gap-2 sm:gap-4">
        <div className="text-sky-400 text-xs sm:text-sm font-bold font-family: Poppins, Helvetica, sans-serif">Placed Order</div>
        <div className="text-orange-500 text-xs sm:text-sm font-bold font-family: Poppins, Helvetica, sans-serif">Order Delivered</div>
        <div className="text-red-600 text-xs sm:text-sm font-bold font-family: Poppins, Helvetica, sans-serif">Order Cancel</div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 w-full flex overflow-x-auto">
        {/* Y-axis labels */}
        <div className="flex flex-col justify-between h-full pr-2">
          {[100, 75, 50, 25, 0].map((val) => (
            <div key={val} className="w-6 h-8 sm:h-9 opacity-50 text-right text-neutral-900 dark:text-gray-300 text-[10px] font-medium font-family: Poppins, Helvetica, sans-serif flex items-center justify-end">
              {val}
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="flex-1 relative">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => (
            <div 
              key={i} 
              className="absolute w-full h-0 outline outline-1 outline-offset-[-0.50px] outline-zinc-300 dark:outline-gray-600" 
              style={{ top: `${i * 25}%` }} 
            />
          ))}
          {/* Line chart */}
          <svg className="w-full h-full absolute top-0 left-0" viewBox="0 0 700 180" preserveAspectRatio="none">
            {/* Placed Order (sky-400) */}
            <path
              d={createSharpPath(displayData.map(d => d.placedOrder), 700, 180)}
              fill="none"
              stroke="#38BDF8"
              strokeWidth="2"
            />
            {/* Order Delivered (orange-500) */}
            <path
              d={createSharpPath(displayData.map(d => d.delivered), 700, 180)}
              fill="none"
              stroke="#F97316"
              strokeWidth="2"
            />
            {/* Order Cancel (red-700) */}
            <path
              d={createSharpPath(displayData.map(d => d.canceled), 700, 180)}
              fill="none"
              stroke="#B91C1C"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="w-full pl-3 xs:pl-5 sm:pl-8 inline-flex justify-between items-center">
        {displayData.map((item, i) => (
          <div key={i} className="opacity-50 text-neutral-900 dark:text-gray-300 text-[8px] xs:text-[9px] sm:text-[10px] font-medium font-poppins">
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FigmaSalesPerformance;
