import React, { useState } from "react";
import { Package, FileText, TrendingDown, DollarSign, MessageSquare } from "lucide-react";

interface DashOverviewProps {
  totalProducts?: number;
  totalOrders?: number;
  lowStock?: number;
  totalAmount?: number;
  toBeReviewed?: number;
  notifications?: { image: string; title?: string }[];
}

export const DashOverview: React.FC<DashOverviewProps> = ({
  totalProducts = 33,
  totalOrders = 18,
  lowStock = 1,
  totalAmount = 23929,
  toBeReviewed = 14,
  notifications = [{ image: "https://via.placeholder.com/226x54", title: "Notification" }]
}) => {
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const [activeNotification, setActiveNotification] = useState(0);

  const today = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayOfWeek = dayNames[today.getDay()];
  const dateStr = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;

  const formatAmount = (amount: number) => {
    return `৳${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-100 shadow-sm font-['Roboto']">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Row 1 */}
        {/* Total Products */}
        <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-2xl font-medium text-gray-900">{totalProducts}</p>
            <p className="text-xs font-medium text-gray-600">Total Products</p>
          </div>
          <div className="w-11 h-11 bg-white rounded-lg flex items-center justify-center">
            <Package className="w-6 h-6 text-gray-700" />
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-2xl font-medium text-gray-900">{totalOrders}</p>
            <p className="text-xs font-medium text-gray-600">Total Orders</p>
          </div>
          <div className="w-11 h-11 bg-white rounded-lg flex items-center justify-center">
            <FileText className="w-6 h-6 text-gray-700" />
          </div>
        </div>

        {/* Language & Date */}
        <div className="flex gap-3">
          {/* Language Toggle */}
          <div className="flex-1 bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-600 mb-2">Language</p>
            <div className="flex h-[26px] rounded-full border border-gray-200 overflow-hidden bg-white">
              <button
                onClick={() => setLanguage('en')}
                className={`flex-1 text-xs font-medium transition-colors ${
                  language === 'en' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Eng
              </button>
              <button
                onClick={() => setLanguage('bn')}
                className={`flex-1 text-xs font-medium transition-colors ${
                  language === 'bn' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                বাংলা
              </button>
            </div>
          </div>

          {/* Date Display */}
          <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-2 min-w-[100px]">
            <div className="text-base font-medium text-gray-900">{dateStr}</div>
            <div className="px-3 py-1 rounded-full bg-gradient-to-r from-sky-400 to-blue-500 text-white text-sm font-medium">
              {dayOfWeek}
            </div>
          </div>
        </div>

        {/* Important Notification */}
        <div className="bg-gray-50 rounded-lg p-4 row-span-2">
          <p className="text-xs text-gray-600 mb-3">Important Notification</p>
          <div className="bg-white rounded-lg p-3 h-[80px] flex items-center justify-center overflow-hidden">
            {notifications.length > 0 && (
              <img
                src={notifications[activeNotification]?.image}
                alt="Notification"
                className="max-h-full object-contain"
              />
            )}
          </div>
          {/* Dots */}
          <div className="flex items-center justify-center gap-1 mt-3">
            {notifications.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveNotification(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === activeNotification
                    ? 'w-4 bg-gradient-to-r from-sky-400 to-blue-500'
                    : 'w-2 bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Row 2 */}
        {/* Low Stock */}
        <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-2xl font-medium text-gray-900">{lowStock}</p>
            <p className="text-xs font-medium text-gray-600">Low Stock</p>
          </div>
          <div className="w-11 h-11 bg-white rounded-lg flex items-center justify-center">
            <TrendingDown className="w-6 h-6 text-gray-700" />
          </div>
        </div>

        {/* Total Amount */}
        <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-2xl font-medium text-gray-900">{formatAmount(totalAmount)}</p>
            <p className="text-xs font-medium text-gray-600">Total Amount</p>
          </div>
          <div className="w-11 h-11 bg-white rounded-lg flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-gray-700" />
          </div>
        </div>

        {/* To be Reviewed */}
        <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-2xl font-medium text-gray-900">{toBeReviewed}</p>
            <p className="text-xs font-medium text-gray-600">To be Reviewed</p>
          </div>
          <div className="w-11 h-11 bg-white rounded-lg flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-gray-700" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashOverview;