import React from 'react';
import { Users, Star, RefreshCw, Ban } from 'lucide-react';

interface CustomerStatsCardsProps {
  totalCustomers: number;
  totalReviews: number;
  repeatCustomers: number;
  blockedCustomers: number;
}

const CustomerStatsCards: React.FC<CustomerStatsCardsProps> = ({
  totalCustomers,
  totalReviews,
  repeatCustomers,
  blockedCustomers,
}) => (
  <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-2 xs:gap-3 sm:gap-4 md:gap-6">
    <div className="bg-[#F0F9FF] dark:bg-blue-900/20 rounded-xl p-3 xs:p-4 sm:p-5 flex items-start justify-between">
      <div className="space-y-0.5 xs:space-y-1">
        <h3 className="text-stone-900 dark:text-white text-xs xs:text-sm sm:text-base font-medium">Customer</h3>
        <p className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tabular-nums">{totalCustomers}</p>
        <p className="text-gray-500 dark:text-gray-400 text-[10px] xs:text-xs font-medium">Total user</p>
      </div>
      <div className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 bg-[#0095FF] rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
        <Users className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-white" />
      </div>
    </div>

    <div className="bg-[#FFF7ED] dark:bg-orange-900/20 rounded-xl p-3 xs:p-4 sm:p-5 flex items-start justify-between">
      <div className="space-y-0.5 xs:space-y-1">
        <h3 className="text-stone-900 dark:text-white text-xs xs:text-sm sm:text-base font-medium">Review</h3>
        <p className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tabular-nums">{totalReviews}</p>
        <p className="text-gray-500 dark:text-gray-400 text-[10px] xs:text-xs font-medium">Consumers review</p>
      </div>
      <div className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 bg-[#F97316] rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
        <Star className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" />
      </div>
    </div>

    <div className="bg-[#F0FDF4] dark:bg-green-900/20 rounded-xl p-3 xs:p-4 sm:p-5 flex items-start justify-between">
      <div className="space-y-0.5 xs:space-y-1">
        <h3 className="text-stone-900 dark:text-white text-xs xs:text-sm sm:text-base font-medium">Recurring</h3>
        <p className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tabular-nums">{repeatCustomers}</p>
        <p className="text-gray-500 dark:text-gray-400 text-[10px] xs:text-xs font-medium">Repeat customers</p>
      </div>
      <div className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 bg-[#22C55E] rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
        <RefreshCw className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-white" />
      </div>
    </div>

    <div className="bg-[#FEF2F2] dark:bg-red-900/20 rounded-xl p-3 xs:p-4 sm:p-5 flex items-start justify-between">
      <div className="space-y-0.5 xs:space-y-1">
        <h3 className="text-stone-900 dark:text-white text-xs xs:text-sm sm:text-base font-medium">Blocked</h3>
        <p className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tabular-nums">{blockedCustomers}</p>
        <p className="text-gray-500 dark:text-gray-400 text-[10px] xs:text-xs font-medium">Blocked users</p>
      </div>
      <div className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 bg-[#EF4444] rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
        <Ban className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-white" />
      </div>
    </div>
  </div>
);

export default CustomerStatsCards;
