import { Order, Product } from '../../types';
import { RevenueDataPoint, CategoryDataPoint, BestSellingProductItem } from './types';

export const ALLOWED_REVENUE_STATUSES: Array<Order['status']> = [
  'Pending', 'Confirmed', 'On Hold', 'Processing', 'Shipped', 'Sent to Courier', 'Delivered'
];

export const CATEGORY_COLORS = [
  { bg: '#2196F3', label: 'ABC' },
  { bg: '#42A5F5', label: 'NBC' },
  { bg: '#64B5F6', label: 'CBS' },
  { bg: '#90CAF9', label: 'CNN' },
  { bg: '#BBDEFB', label: 'AOL' },
  { bg: '#E3F2FD', label: 'MSN' },
];

export const parseOrderDate = (dateString?: string): Date | null => {
  if (!dateString) return null;
  const direct = Date.parse(dateString);
  if (!Number.isNaN(direct)) return new Date(direct);
  const sanitized = Date.parse(dateString.replace(/,/g, ''));
  return Number.isNaN(sanitized) ? null : new Date(sanitized);
};

export const buildMonthlyRevenueData = (orders: Order[]): RevenueDataPoint[] => {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - 29);
  startDate.setHours(0, 0, 0, 0);

  const labels = ['Dec 1', 'Dec 8', 'Dec 15', 'Dec 22', 'Dec 29'];

  return labels.map((name, index) => {
    const weekStart = new Date(startDate);
    weekStart.setDate(startDate.getDate() + (index * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    let sales = 0;
    orders.forEach(order => {
      if (!ALLOWED_REVENUE_STATUSES.includes(order.status)) return;
      const orderDate = parseOrderDate(order.date);
      if (!orderDate || orderDate < weekStart || orderDate > weekEnd) return;
      sales += order.amount;
    });

    const costs = Math.round(sales * 0.6);

    return { name, sales, costs };
  });
};

export const buildCategoryBreakdown = (orders: Order[], products: Product[]): CategoryDataPoint[] => {
  if (!orders.length) return [];

  const productById = new Map(products.map((product) => [product.id, product]));
  const productByName = new Map(products.map((product) => [product.name.toLowerCase(), product]));
  const totals: Record<string, number> = {};

  orders.forEach((order) => {
    if (!ALLOWED_REVENUE_STATUSES.includes(order.status)) return;
    const matchedProduct =
      (order.productId && productById.get(order.productId)) ||
      (order.productName ? productByName.get(order.productName.toLowerCase()) : undefined);
    const category = matchedProduct?.category || 'Other';
    totals[category] = (totals[category] || 0) + order.amount;
  });

  const dataset = Object.entries(totals)
    .map(([name, value], index) => ({
      name,
      value,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length].bg
    }))
    .sort((a, b) => b.value - a.value);

  return dataset;
};

export const exportOrdersToCsv = (orders: Order[]): void => {
  if (typeof window === 'undefined' || !orders.length) return;
  const header = ['Order ID', 'Customer', 'Amount', 'Status', 'Date'];
  const rows = orders.map((order) => [order.id, order.customer, order.amount, order.status, order.date]);
  const csv = [header, ...rows]
    .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `dashboard-orders-${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Calculates best-selling products based on order data
 * @param orders - Array of orders to analyze
 * @param products - Array of products to match against
 * @param limit - Maximum number of products to return (default: 5)
 * @returns Array of best-selling product items sorted by order count
 */
export const calculateBestSellingProducts = (
  orders: Order[],
  products: Product[],
  limit: number = 5
): BestSellingProductItem[] => {
  const productSales: Record<string, BestSellingProductItem> = {};

  orders.forEach((order) => {
    if (!ALLOWED_REVENUE_STATUSES.includes(order.status)) return;

    const matchedProduct = products.find(
      (p) =>
        (order.productId && p.id === order.productId) ||
        (order.productName && p.name.toLowerCase() === order.productName.toLowerCase())
    );

    if (matchedProduct) {
      if (!productSales[matchedProduct.id]) {
        productSales[matchedProduct.id] = {
          product: matchedProduct,
          orders: 0,
          revenue: 0,
        };
      }
      productSales[matchedProduct.id].orders += 1;
      productSales[matchedProduct.id].revenue += order.amount;
    }
  });

  return Object.values(productSales)
    .sort((a, b) => b.orders - a.orders)
    .slice(0, limit);
};
