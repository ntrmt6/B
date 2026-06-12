import React from 'react';
import { ExternalLink } from 'lucide-react';

interface RecentOrdersTableProps {
  orders: any[];
}

const RecentOrdersTable: React.FC<RecentOrdersTableProps> = ({ orders }) => {
  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'delivered':
        return 'bg-emerald-50 text-emerald-600';
      case 'pending':
        return 'bg-amber-50 text-amber-600';
      case 'cancelled':
      case 'returned':
        return 'bg-red-50 text-red-600';
      default:
        return 'bg-gray-50 text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-gray-50 flex justify-between items-center">
        <h3 className="text-base sm:text-lg font-bold text-gray-900">Recent Orders</h3>
        <button className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700">View All</button>
      </div>

      {/* Mobile Card View (< sm) */}
      <div className="sm:hidden divide-y divide-gray-50">
        {orders.map((order, index) => (
          <div key={index} className="p-3 hover:bg-gray-50/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-900">{order.id}</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${getStatusStyle(order.status)}`}>
                {order.status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600 shrink-0">
                  {order.customerName?.charAt(0) || 'C'}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-medium text-gray-900 truncate block">{order.customerName}</span>
                  <span className="text-[10px] text-gray-400">{order.date}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-bold text-gray-900">৳{order.amount}</span>
                <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400">
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View (>= sm) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left min-w-[540px]">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Order ID</th>
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th>
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.map((order, index) => (
              <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                  <span className="text-xs sm:text-sm font-bold text-gray-900">{order.id}</span>
                </td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-500">{order.date}</td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] sm:text-xs font-bold text-gray-600 shrink-0">
                      {order.customerName?.charAt(0) || 'C'}
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">{order.customerName}</span>
                  </div>
                </td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-gray-900">৳{order.amount}</td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                  <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold ${getStatusStyle(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right">
                  <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400">
                    <ExternalLink size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentOrdersTable;
