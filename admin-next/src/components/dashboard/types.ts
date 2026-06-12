import { Order, Product } from '../../types';

// Chart data types
export type RevenueDataPoint = { name: string; sales: number; costs: number };
export type ProfitDataPoint = { name: string; value: number };
export type CategoryDataPoint = { name: string; value: number; color: string };

// Product display item type
export interface BestSellingProductItem {
  product: Product;
  orders: number;
  revenue: number;
}

// Component props
export interface DashboardHeaderProps {
  tenantId?: string;
  tenantSubdomain?: string;
  currentPage?: string;
  user?: { name?: string; avatar?: string; image?: string } | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearch?: (query: string) => void;
  onNavigate?: (page: string) => void;
  onLogout?: () => void;
  // Notification props
  notificationCount?: number;
  onNotificationClick?: () => void;
  notifications?: Array<{
    _id: string;
    type?: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string | Date;
    data?: Record<string, any | undefined>;
  }>;
  onMarkNotificationRead?: (ids?: string[]) => void;
  onOrderNotificationClick?: (orderId: string) => void;
  // Chat props
  unreadChatCount?: number;
  onChatClick?: () => void;
  // Tenant switcher props (super_admin only)
  tenants?: Array<{ id: string; _id?: string; name: string; subdomain: string; plan?: string; status?: string }>;
  activeTenantId?: string;
  onTenantChange?: (tenantId: string) => void;
  isTenantSwitching?: boolean;
  userRole?: string;
}

export interface OrderAnalyticsProps {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  lowStockProducts: number;
  toBeReviewed: number;
  reservedPrice?: number;
  netProfit?: number;
  notifications?: Array<{ id: string; image: string; title: string; linkUrl?: string }>;
}

export interface VisitorStatsProps {
  visitorStats?: {
    onlineNow?: number;
    todayVisitors?: number;
    periodVisitors?: number;
    totalVisitors?: number;
    totalPageViews?: number;
  };
}

export interface OrderStatusRowProps {
  todayOrders: number;
  courierOrders: number;
  confirmedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  returnsCount: number;
}

export interface RevenueChartProps {
  data: RevenueDataPoint[];
}

export interface ProfitChartProps {
  data: ProfitDataPoint[];
}

export interface CategoryChartProps {
  data: CategoryDataPoint[];
}

export interface BestSellingProductsProps {
  bestSellingProducts: BestSellingProductItem[];
  products: Product[];
}

export interface TopProductsProps {
  products: Product[];
}

export type PermissionMap = Record<string, string[]>;

export interface SidebarProps {
  activeItem?: string;
  onNavigate?: (item: string) => void;
  onLogoutClick?: () => void;
  className?: string;
  userRole?: string;
  permissions?: PermissionMap;
}
