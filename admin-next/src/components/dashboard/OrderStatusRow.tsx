import React from 'react';
import { Calendar, Truck, CheckCircle, Clock, XCircle, RotateCcw } from 'lucide-react';
import { OrderStatusRowProps } from './types';

const OrderStatusRow: React.FC<OrderStatusRowProps> = ({
  todayOrders,
  courierOrders,
  confirmedOrders,
  pendingOrders,
  cancelledOrders,
  returnsCount
}) => {
  return (
    <div>
      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3">
        Order Status
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Today */}
        <div className="group bg-white border border-slate-100 rounded-xl p-2.5 sm:p-3 shadow-sm hover:shadow-lg hover:shadow-pink-500/20 hover:border-pink-200 transition-all cursor-pointer">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="p-1.5 bg-pink-50 rounded-lg group-hover:scale-110 transition-transform">
              <Calendar className="w-3.5 h-3.5 text-pink-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-400 font-medium truncate">
                Today
              </div>
              <div className="text-base sm:text-lg font-black text-slate-900">
                {todayOrders}
              </div>
            </div>
          </div>
        </div>

        {/* Courier */}
        <div className="group bg-white border border-slate-100 rounded-xl p-2.5 sm:p-3 shadow-sm hover:shadow-lg hover:shadow-orange-500/20 hover:border-orange-200 transition-all cursor-pointer">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="p-1.5 bg-orange-50 rounded-lg group-hover:scale-110 transition-transform">
              <Truck className="w-3.5 h-3.5 text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-400 font-medium truncate">
                Courier
              </div>
              <div className="text-base sm:text-lg font-black text-slate-900">
                {courierOrders}
              </div>
            </div>
          </div>
        </div>

        {/* Confirmed */}
        <div className="group bg-white border border-slate-100 rounded-xl p-2.5 sm:p-3 shadow-sm hover:shadow-lg hover:shadow-emerald-500/20 hover:border-emerald-200 transition-all cursor-pointer">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="p-1.5 bg-emerald-50 rounded-lg group-hover:scale-110 transition-transform">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-400 font-medium truncate">
                Confirmed
              </div>
              <div className="text-base sm:text-lg font-black text-slate-900">
                {confirmedOrders}
              </div>
            </div>
          </div>
        </div>

        {/* Pending */}
        <div className="group bg-white border border-slate-100 rounded-xl p-2.5 sm:p-3 shadow-sm hover:shadow-lg hover:shadow-amber-500/20 hover:border-amber-200 transition-all cursor-pointer">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="p-1.5 bg-amber-50 rounded-lg group-hover:scale-110 transition-transform">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-400 font-medium truncate">
                Pending
              </div>
              <div className="text-base sm:text-lg font-black text-slate-900">
                {pendingOrders}
              </div>
            </div>
          </div>
        </div>

        {/* Cancelled */}
        <div className="group bg-white border border-slate-100 rounded-xl p-2.5 sm:p-3 shadow-sm hover:shadow-lg hover:shadow-rose-500/20 hover:border-rose-200 transition-all cursor-pointer">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="p-1.5 bg-rose-50 rounded-lg group-hover:scale-110 transition-transform">
              <XCircle className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-400 font-medium truncate">
                Cancelled
              </div>
              <div className="text-base sm:text-lg font-black text-slate-900">
                {cancelledOrders}
              </div>
            </div>
          </div>
        </div>

        {/* Returns */}
        <div className="group bg-white border border-slate-100 rounded-xl p-2.5 sm:p-3 shadow-sm hover:shadow-lg hover:shadow-blue-500/20 hover:border-blue-200 transition-all cursor-pointer">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="p-1.5 bg-blue-50 rounded-lg group-hover:scale-110 transition-transform">
              <RotateCcw className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-400 font-medium truncate">
                Returns
              </div>
              <div className="text-base sm:text-lg font-black text-slate-900">
                {returnsCount}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderStatusRow;
