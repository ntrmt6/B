export interface ExpenseItem {
  id: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  status: 'Published' | 'Draft' | 'Trash';
  note?: string;
  imageUrl?: string;
}

export interface IncomeItem {
  id: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  status: 'Published' | 'Draft' | 'Trash';
  note?: string;
  imageUrl?: string;
}

export interface PurchaseRecord {
  _id: string;
  purchaseNumber: string;
  items: Array<{ productName: string; quantity: number; price: number; total: number; productImage?: string }>;
  totalAmount: number;
  paymentType: 'cash' | 'due';
  supplierName: string;
  mobileNumber: string;
  address: string;
  note: string;
  cashPaid: number;
  dueAmount: number;
  employeeName?: string;
  createdAt: string;
  tenantId: string;
}

export interface FigmaBusinessReportProps {
  orders?: any[];
  products?: any[];
  user?: any;
  onLogout?: () => void;
  tenantId?: string;
  initialTab?: string;
}

export type TabType = 'overview' | 'profit' | 'expense' | 'income' | 'purchase' | 'due' | 'note';
export type DateRangeType = 'day' | 'month' | 'year' | 'all' | 'custom';

export interface SummaryData {
  totalRevenue: number;
  purchaseCost: number;
  profitFromSell: number;
  otherIncome: number;
  otherExpenses: number;
  netProfit: number;
  netProfitPercent: number;
  isProfit: boolean;
  businessValue: number;
  ordersCount: number;
  deliveredCount: number;
}

export interface DueSummaryData {
  totalWillGet: number;
  totalWillGive: number;
}

export interface DueGraphData {
  getPercent: number;
  givePercent: number;
  youWillGet: number;
  youWillGive: number;
}
