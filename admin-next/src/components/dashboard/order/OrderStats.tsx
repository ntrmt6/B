import React from 'react';
import { Order } from '../../../types';
import { DonutChart } from '../../modern-dashboard/OrderSummaryChart';
import { TrendChart } from './TrendChart';
import GmvStats from './GmvStats';

export interface OrderStatusDataItem {
  label: string;
  percentage: number;
  color: string;
  bgColor: string;
}

interface OrderStatsProps {
  orders: Order[];
  orderStatusData: OrderStatusDataItem[];
  visitorChartData: number[][];
  orderChartData: number[][];
  currentMonthDays: number;
}

const OrderStats: React.FC<OrderStatsProps> = ({
  orders,
  orderStatusData,
  visitorChartData,
  orderChartData,
  currentMonthDays,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 xxs:gap-4 mb-4 xxs:mb-6 dark:bg-gray-800">
      {/* Order Summary */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 xxs:p-4 sm:p-5 flex flex-col h-full">
        <h3 className="text-xs xxs:text-sm font-medium text-gray-700 mb-3 xxs:mb-4">Order Summary</h3>
        <div className="flex flex-col xxs:flex-row items-center justify-center gap-3 xxs:gap-4 lg:gap-6 flex-1">
          <div className="relative w-[140px] h-[140px] xxs:w-[160px] xxs:h-[160px] sm:w-[180px] sm:h-[180px] flex-shrink-0">
            <DonutChart data={orderStatusData} total={orders.length || 1} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-gray-400 dark:text-gray-300 text-[8px] xxs:text-[9px] font-bold uppercase tracking-widest">Total</span>
              <span className="text-black dark:text-white font-extrabold text-2xl xxs:text-3xl leading-none my-1">{orders.length}</span>
              <span className="text-gray-400 dark:text-gray-300 text-[8px] xxs:text-[9px] font-bold uppercase tracking-widest">Orders</span>
            </div>
          </div>
          <div className="flex flex-wrap xxs:flex-col justify-center gap-1 xxs:gap-2 text-xs xxs:text-sm">
            {orderStatusData.map((status, index) => (
              <div key={index} className="flex items-center gap-1 xxs:gap-2">
                <span className={`w-2 h-2 xxs:w-3 xxs:h-3 rounded-full ${status.bgColor}`}></span>
                <span className="text-slate-700 dark:text-slate-300 font-medium text-[10px] xxs:text-sm">{status.label}</span>
                <span style={{ color: status.color }} className="text-[10px] xxs:text-sm">({status.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 xxs:p-4 sm:p-5 flex flex-col h-full">
        <div className="flex items-center gap-3 xxs:gap-4 mb-2 xxs:mb-3">
          <span className="flex items-center gap-1 text-[10px] xxs:text-xs font-semibold text-[#FF8A00]">
            <span className="w-1.5 h-1.5 xxs:w-2 xxs:h-2 rounded-full bg-[#FF8A00]"></span>
            Visitors
          </span>
          <span className="flex items-center gap-1 text-[10px] xxs:text-xs font-semibold text-[#38BDF8]">
            <span className="w-1.5 h-1.5 xxs:w-2 xxs:h-2 rounded-full bg-[#38BDF8]"></span>
            Orders
          </span>
        </div>
        <div className="flex-1 min-h-[140px] xxs:min-h-[160px] sm:min-h-[180px]">
          <TrendChart visitorData={visitorChartData} orderData={orderChartData} daysInMonth={currentMonthDays} />
        </div>
      </div>

      <GmvStats orders={orders} />
    </div>
  );
};

export default OrderStats;
