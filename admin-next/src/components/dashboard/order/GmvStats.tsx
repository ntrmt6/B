import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Order } from '../../../types';

interface GmvStatsProps {
  orders?: Order[];
}

const formatCurrency = (v: number) => `৳${v.toLocaleString('en-US', { minimumFractionDigits: v % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}`;

const GmvStats: React.FC<GmvStatsProps> = ({ orders = [] }) => {
  const metrics = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const getOrderTotal = (o: Order) => (o as any).total || (o as any).totalAmount || (o as any).price || 0;
    const getOrderDate = (o: Order) => new Date(o.createdAt || (o as any).date || '');

    // GMV = sum of all (non-cancelled/non-returned) order totals last 7 days
    const recentOrders = orders.filter(o => {
      const d = getOrderDate(o);
      return d >= sevenDaysAgo && !['Cancelled', 'Return', 'Returned Receive', 'Refund'].includes(o.status);
    });
    const prevOrders = orders.filter(o => {
      const d = getOrderDate(o);
      return d >= fourteenDaysAgo && d < sevenDaysAgo && !['Cancelled', 'Return', 'Returned Receive', 'Refund'].includes(o.status);
    });

    const gmv = recentOrders.reduce((s, o) => s + getOrderTotal(o), 0);
    const prevGmv = prevOrders.reduce((s, o) => s + getOrderTotal(o), 0);
    const gmvChange = prevGmv > 0 ? Math.round(((gmv - prevGmv) / prevGmv) * 100) : (gmv > 0 ? 100 : 0);

    // Average order value (all non-cancelled orders)
    const validOrders = orders.filter(o => !['Cancelled', 'Return', 'Returned Receive', 'Refund'].includes(o.status));
    const avgOrder = validOrders.length > 0 ? validOrders.reduce((s, o) => s + getOrderTotal(o), 0) / validOrders.length : 0;
    const recentValid = recentOrders.length;
    const prevValid = prevOrders.length;
    const avgChange = prevValid > 0 ? Math.round(((recentValid - prevValid) / prevValid) * 100) : (recentValid > 0 ? 100 : 0);

    // Courier Return (COD) — returned orders
    const returnedOrders = orders.filter(o => ['Return', 'Returned Receive', 'Refund'].includes(o.status));
    const totalReturned = returnedOrders.length;
    const demurrage = returnedOrders.reduce((s, o) => s + ((o as any).demurrageCharge || (o as any).deliveryCharge || 0), 0);

    return { gmv, gmvChange, avgOrder, avgChange, totalReturned, demurrage };
  }, [orders]);

  const containerClasses = "relative w-full p-3 py-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 flex flex-col gap-1 transition-all hover:shadow-md";

  return (
    <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-3 dark:bg-gray-800">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Business Overview</h3>
      <div className="flex flex-col gap-2">
        {/* GMV */}
        <article className={containerClasses}>
          <div className="flex justify-between items-start">
            <h2 className="font-semibold text-gray-900 text-xs uppercase tracking-wider">G M V</h2>
            <span className="text-[9px] text-gray-400 font-medium bg-gray-50 px-1.5 py-0.5 rounded-full">Last 7 days</span>
          </div>
          <div className="flex items-end justify-between">
            <div className="font-bold text-slate-800 text-xl leading-none">{formatCurrency(metrics.gmv)}</div>
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md ${metrics.gmvChange >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {metrics.gmvChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span className="text-[10px] font-bold leading-none">{metrics.gmvChange}%</span>
            </div>
          </div>
        </article>

        {/* AVG Order */}
        <article className={containerClasses}>
          <div className="flex justify-between items-start">
            <h2 className="font-semibold text-gray-900 text-xs uppercase tracking-wider">AVG ORDER</h2>
            <span className="text-[9px] text-gray-400 font-medium bg-gray-50 px-1.5 py-0.5 rounded-full">Per customer spend</span>
          </div>
          <div className="flex items-end justify-between">
            <div className="font-bold text-slate-800 text-xl leading-none">{formatCurrency(Math.round(metrics.avgOrder))}</div>
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md ${metrics.avgChange >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {metrics.avgChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span className="text-[10px] font-bold leading-none">{metrics.avgChange}%</span>
            </div>
          </div>
        </article>

        {/* Courier Return */}
        <article className={containerClasses}>
          <div className="flex justify-between items-start">
            <h2 className="font-semibold text-gray-900 text-xs uppercase tracking-wider">Courier Return (COD)</h2>
          </div>
          <div className="flex gap-4">
            <div className="flex flex-col">
              <span className="font-bold text-red-600 text-sm leading-tight">{metrics.totalReturned}</span>
              <span className="text-[9px] font-medium text-gray-400 uppercase tracking-tight">Total Returned</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-red-600 text-sm leading-tight">{formatCurrency(metrics.demurrage)}</span>
              <span className="text-[9px] font-medium text-gray-400 uppercase tracking-tight">Demurrage charges</span>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};

export default GmvStats;

