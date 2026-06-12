import React, { useState } from 'react';
import OrderAnalytics from './OrderAnalytics';
import FigmaOrderStatus from './FigmaOrderStatus';
import FigmaAnalyticsChart from './FigmaAnalyticsChart';
import FigmaBestSellingProducts from './FigmaBestSellingProducts';
import FigmaTopProducts from './FigmaTopProducts';
import FigmaSalesPerformance from './FigmaSalesPerformance';
import FigmaSalesByCategory from './FigmaSalesByCategory';
import { Order, Product } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface FigmaDashboardContentProps {
  user?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
  tenantId?: string;
  orders?: Order[];
  products?: Product[];
  onNavigate?: (page: string) => void;
}

const FigmaDashboardContent: React.FC<FigmaDashboardContentProps> = ({
  user = { name: 'User' },
  tenantId = '',
  orders = [],
  products = [],
  onNavigate
}) => {
  const { language, setLanguage } = useLanguage();

  // Calculate stats from real data - default to 0 when no data
  const totalProducts = products.length;
  const totalOrders = orders.length;
  const totalAmount = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
  const lowStock = products.filter(p => (p.stock || 0) < 10).length;
  const toReview = orders.filter(o => o.status === 'Pending').length;

  // Order status stats - default to 0
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;
  const confirmedOrders = orders.filter(o => o.status === 'Confirmed').length;
  const courierOrders = orders.filter(o => o.status === 'Sent to Courier' || o.status === 'Shipped').length;
  const deliveredOrders = orders.filter(o => o.status === 'Delivered').length;
  const canceledOrders = orders.filter(o => o.status === 'Cancelled').length;
  const returnsOrders = orders.filter(o => o.status === 'Return' || o.status === 'Returned Receive').length;

  // Format currency
  const formattedAmount = '\u09F3' + totalAmount.toLocaleString('en-IN');

  // Best selling products data
  const bestSellingData = products.slice(0, 4).map((p, idx) => ({
    id: String(p.id || idx + 1),
    name: p.name || ['Apple iPhone 13', 'Nike Air Jordan', 'T-shirt', 'Cross Bag'][idx],
    totalOrder: String(Math.floor(Math.random() * 500) + 50),
    status: ((p.stock || 0) > 0 ? 'Stock' : 'Stock out') as 'Stock' | 'Stock out',
    price: 'tk' + (p.price || 999).toFixed(2),
    image: p.image
  }));

  // Top products data
  const topProductsData = products.slice(0, 5).map((p, idx) => ({
    id: String(p.id || idx + 1),
    name: p.name || ['Apple iPhone 13', 'Nike Air Jordan', 'T-shirt', 'Assorted Cross Bag', 'Fur Pom Gloves'][idx],
    itemCode: '#FXZ-' + (4567 + idx),
    price: p.price || [999, 72.4, 35.4, 80, 45][idx],
    image: p.image
  }));

  return (
    <div className="space-y-3 xs:space-y-4 sm:space-y-5 p-2 xs:p-3 sm:p-4 md:p-5 lg:p-4 xl:p-5 bg-[#F9FAFC] min-h-full overflow-x-hidden max-w-full">
      {/* Order Analytics Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl mx-2 sm:mx-4 md:mx-6 p-4 sm:p-6 shadow-sm">
        <OrderAnalytics
          totalProducts={totalProducts}
          totalOrders={totalOrders}
          totalRevenue={totalAmount}
          lowStockProducts={lowStock}
          toBeReviewed={toReview}
          reservedPrice={0}
          netProfit={totalAmount}
          notifications={[]}
        />
      </div>

      {/* Visitor Analytics */}
      <FigmaAnalyticsChart tenantId={tenantId} onNavigate={onNavigate} />

      {/* Order Status Row */}
      <FigmaOrderStatus
        orderStats={{
          pending: pendingOrders,
          confirmed: confirmedOrders,
          courier: courierOrders,
          delivered: deliveredOrders,
          canceled: canceledOrders,
          returns: returnsOrders
        }}
      />

      {/* Sales Performance + Sales by Category Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 xs:gap-4 sm:gap-5 lg:gap-4 xl:gap-5">
        {/* Sales Performance Chart - Left Side */}
        <div className="lg:col-span-8">
          <FigmaSalesPerformance />
        </div>

        {/* Sales by Category Pie Chart - Right Side */}
        <div className="lg:col-span-4">
          <FigmaSalesByCategory />
        </div>
      </div>

      {/* Best Selling Products + Top Products Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 xs:gap-4 sm:gap-5 lg:gap-4 xl:gap-5">
        {/* Best Selling Products Table - Left Side */}
        <div className="lg:col-span-8">
          <FigmaBestSellingProducts products={bestSellingData} />
        </div>

        {/* Top Products List - Right Side */}
        <div className="lg:col-span-4">
          <FigmaTopProducts products={topProductsData} />
        </div>
      </div>
    </div>
  );
};

export default FigmaDashboardContent;
