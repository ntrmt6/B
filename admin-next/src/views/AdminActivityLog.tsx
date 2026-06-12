import React, { useState, useEffect } from 'react';
import { ActivityLogSkeleton } from '../components/SkeletonLoaders';
import {
  Activity,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit,
  Package,
  Plus,
  ShoppingCart,
  Trash2,
  Upload,
  User,
  Download,
  Settings,
  Image,
  FileText,
  Bell,
  MessageSquare,
  Database,
  LogIn,
  LogOut,
  Boxes,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  FilterX,
  Eye,
  CheckSquare,
  Square,
} from 'lucide-react';
import { useDarkMode } from '../context/DarkModeContext';

// Figma-based inline styles (dark mode aware)
const createFigmaStyles = (isDark: boolean) => ({
  container: {
    backgroundColor: isDark ? '#111827' : '#f9f9f9',
    minHeight: '100vh',
    position: 'relative' as const,
  },
  mainContent: {
    backgroundColor: isDark ? '#1f2937' : '#ffffff',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
    padding: '20px',
    overflow: 'hidden',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap' as const,
    gap: '16px',
  },
  title: {
    fontFamily: "'Lato', sans-serif",
    fontWeight: 700,
    fontSize: '22px',
    color: isDark ? '#f1f5f9' : '#023337',
    letterSpacing: '0.11px',
    margin: 0,
  },
  filtersRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    flexWrap: 'wrap' as const,
  },
  dateRangeGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  filterButton: {
    backgroundColor: isDark ? '#374151' : '#f9f9f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 7px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    gap: '8px',
  },
  filterButtonText: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 400,
    fontSize: '12px',
    color: isDark ? '#e5e7eb' : '#000000',
  },
  filterToText: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 400,
    fontSize: '12px',
    color: isDark ? '#e5e7eb' : '#000000',
  },
  clearFilterButton: {
    backgroundColor: isDark ? '#1f2937' : '#ffffff',
    border: '1px solid #ff6a00',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    padding: '6px 16px 6px 12px',
    borderRadius: '8px',
    height: '48px',
    cursor: 'pointer',
  },
  clearFilterText: {
    fontFamily: "'Lato', sans-serif",
    fontWeight: 700,
    fontSize: '15px',
    background: 'linear-gradient(180deg, #ff6a00 0%, #ff9f1c 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '-0.3px',
  },
  tableHeader: {
    height: '48px',
    background: isDark ? 'linear-gradient(180deg, #1e293b 0%, #334155 100%)' : 'linear-gradient(180deg, #e0f7fa 0%, #b2ebf2 100%)',
    display: 'grid',
    gridTemplateColumns: '60px 150px 150px 1fr 120px 160px 40px',
    alignItems: 'center',
    padding: '0 20px',
  },
  tableHeaderText: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 500,
    fontSize: '16px',
    color: isDark ? '#e5e7eb' : '#000000',
  },
  tableRow: {
    height: '68px',
    borderBottom: isDark ? '0.5px solid #374151' : '0.5px solid #b9b9b9',
    display: 'grid',
    gridTemplateColumns: '60px 150px 150px 1fr 120px 160px 40px',
    alignItems: 'center',
    padding: '0 20px',
  },
  cellText: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 400,
    fontSize: '12px',
    color: isDark ? '#e5e7eb' : '#1d1a1a',
  },
  entityTitle: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 500,
    fontSize: '16px',
    color: isDark ? '#f1f5f9' : '#1d1a1a',
  },
  entitySubtitle: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 400,
    fontSize: '12px',
    color: isDark ? '#9ca3af' : '#6a717f',
  },
  actionBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  actionIcon: {
    width: '16px',
    height: '16px',
    borderRadius: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulkBadge: {
    backgroundColor: '#ded8ff',
    borderRadius: '28px',
    padding: '0 8px',
    height: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulkText: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 300,
    fontSize: '12px',
    color: '#2300e8',
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px',
  },
  pageButton: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: isDark ? '1px solid #4b5563' : '1px solid #e0e0e0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDark ? '#374151' : '#ffffff',
    cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
    fontSize: '14px',
    color: isDark ? '#e5e7eb' : '#1d1a1a',
  },
  pageButtonActive: {
    backgroundColor: '#38bdf8',
    border: 'none',
    color: '#ffffff',
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
    fontSize: '14px',
    color: isDark ? '#e5e7eb' : '#1d1a1a',
  },
  dropdown: {
    position: 'absolute' as const,
    top: '100%',
    left: 0,
    marginTop: '4px',
    backgroundColor: isDark ? '#1f2937' : '#ffffff',
    border: isDark ? '1px solid #374151' : '1px solid #e0e0e0',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    zIndex: 50,
    minWidth: '150px',
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: '10px 16px',
    fontFamily: "'Poppins', sans-serif",
    fontSize: '12px',
    color: isDark ? '#e5e7eb' : '#1d1a1a',
    cursor: 'pointer',
    border: 'none',
    width: '100%',
    textAlign: 'left' as const,
    backgroundColor: 'transparent',
  },
  dotsIcon: {
    width: '24px',
    height: '24px',
    cursor: 'pointer',
    color: isDark ? '#9ca3af' : '#6a717f',
  },
});
const API_BASE_URL = process.env.NEXT_PUBLIC_VITE_API_BASE_URL
  ? String(process.env.NEXT_PUBLIC_VITE_API_BASE_URL)
  : '';

// Helper function to safely get token from localStorage (client-side only)
const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('admin_auth_token');
  } catch {
    return null;
  }
};

interface AuditLog {
  _id: string;
  tenantId?: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  actionType: 'create' | 'update' | 'delete' | 'bulk_create' | 'bulk_update' | 'bulk_delete' | 'login' | 'logout' | 'export' | 'import' | 'other';
  resourceType: string;
  resourceId?: string;
  resourceName?: string;
  details: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure' | 'warning';
  createdAt: string;
  updatedAt: string;
}


interface AdminActivityLogProps {
  tenantId?: string;
}

const AdminActivityLog: React.FC<AdminActivityLogProps> = ({ tenantId }) => {
  const { isDarkMode } = useDarkMode();
  const figmaStyles = createFigmaStyles(isDarkMode);
  const [token, setToken] = useState<string | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  
  // Modal and menu states
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [markedAsRead, setMarkedAsRead] = useState<Set<string>>(new Set());
  
  // Get token on client side only
  useEffect(() => {
    const storedToken = getStoredToken();
    setToken(storedToken);
  }, []);
  
  // Filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>('all');
  const [actionTypeFilter, setActionTypeFilter] = useState<string>('all');
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  
  // Dropdown states
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showActionDropdown, setShowActionDropdown] = useState(false);
  const [showItemsDropdown, setShowItemsDropdown] = useState(false);

  const resourceTypes = [
    { value: 'all', label: 'All Type' },
    { value: 'product', label: 'Product' },
    { value: 'inventory', label: 'Inventory' },
    { value: 'order', label: 'Order' },
    { value: 'category', label: 'Category' },
    { value: 'user', label: 'User' },
    { value: 'gallery', label: 'Gallery' },
    { value: 'carousel', label: 'Carousel' },
    { value: 'popup', label: 'Popup' },
    { value: 'campaign', label: 'Campaign' },
    { value: 'expense', label: 'Expense' },
    { value: 'income', label: 'Income' },
    { value: 'due', label: 'Due' },
    { value: 'review', label: 'Review' },
    { value: 'settings', label: 'Settings' },
    { value: 'other', label: 'Other' },
  ];

  const actionTypes = [
    { value: 'all', label: 'All Actions' },
    { value: 'create', label: 'Create' },
    { value: 'update', label: 'Update' },
    { value: 'delete', label: 'Delete' },
    { value: 'bulk_create', label: 'Bulk Create' },
    { value: 'bulk_update', label: 'Bulk Update' },
    { value: 'bulk_delete', label: 'Bulk Delete' },
    { value: 'login', label: 'Login' },
    { value: 'logout', label: 'Logout' },
    { value: 'export', label: 'Export' },
    { value: 'import', label: 'Import' },
    { value: 'other', label: 'Other' },
  ];

  const itemsPerPageOptions = [5, 10, 20, 50, 100];

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      if (tenantId) params.append('tenantId', tenantId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (resourceTypeFilter !== 'all') params.append('resourceType', resourceTypeFilter);
      if (actionTypeFilter !== 'all') params.append('actionType', actionTypeFilter);

      const response = await fetch(`${API_BASE_URL}/api/audit-logs?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.data || []);
        const paginationData = data.pagination || { page: 1, limit: 10, total: 0, pages: 0 };
        setTotalPages(paginationData.pages);
        setTotalItems(paginationData.total);
      } else {
        console.error('Failed to fetch activity logs');
        setLogs([]);
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchLogs();
    }
  }, [currentPage, itemsPerPage, startDate, endDate, resourceTypeFilter, actionTypeFilter, token, tenantId]);

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setResourceTypeFilter('all');
    setActionTypeFilter('all');
    setItemsPerPage(10);
    setCurrentPage(1);
  };

  const getActionIcon = (actionType: string, resourceType: string) => {
    const iconStyle = { width: '12px', height: '12px' };
    
    // Special icon for inventory
    if (resourceType === 'inventory') {
      return <Edit style={{ ...iconStyle, color: '#ff6a00' }} />;
    }
    
    switch (actionType) {
      case 'create':
      case 'bulk_create':
        return <Plus style={{ ...iconStyle, color: '#22c55e' }} />;
      case 'update':
      case 'bulk_update':
        return <Edit style={{ ...iconStyle, color: '#6366f1' }} />;
      case 'delete':
      case 'bulk_delete':
        return <Trash2 style={{ ...iconStyle, color: '#ef4444' }} />;
      case 'login':
        return <LogIn style={{ ...iconStyle, color: '#a855f7' }} />;
      case 'logout':
        return <LogOut style={{ ...iconStyle, color: '#ff6a00' }} />;
      case 'export':
        return <Download style={{ ...iconStyle, color: '#06b6d4' }} />;
      case 'import':
        return <Upload style={{ ...iconStyle, color: '#6366f1' }} />;
      default:
        return <Activity style={{ ...iconStyle, color: '#6b7280' }} />;
    }
  };

  // Get icon background color based on Figma design
  const getActionIconBg = (actionType: string, resourceType: string): string => {
    if (resourceType === 'inventory') {
      return '#ffefd8'; // Orange background for inventory
    }
    if (resourceType === 'admin' || resourceType === 'user') {
      return '#d8ffe8'; // Green background for admin/user
    }
    if (resourceType === 'order') {
      if (actionType === 'delete' || actionType === 'bulk_delete') {
        return '#ffd8d8'; // Red background for delete
      }
      return '#d8f0ff'; // Light blue for order status
    }
    switch (actionType) {
      case 'create':
      case 'bulk_create':
        return '#d8ffe8'; // Green
      case 'update':
      case 'bulk_update':
        return '#ded8ff'; // Purple
      case 'delete':
      case 'bulk_delete':
        return '#ffd8d8'; // Red
      case 'login':
      case 'logout':
        return '#ded8ff'; // Purple
      default:
        return '#ded8ff'; // Default purple
    }
  };

  // Format action label for display
  const formatActionLabel = (actionType: string, resourceType: string): string => {
    const resource = resourceType.charAt(0).toUpperCase() + resourceType.slice(1);
    const action = actionType.replace('bulk_', '');
    return `${resource}_${action}`;
  };

  const getResourceIcon = (resourceType: string) => {
    const iconClass = "w-4 h-4 text-gray-400";
    
    switch (resourceType) {
      case 'product':
        return <Package className={iconClass} />;
      case 'inventory':
        return <Boxes className="w-4 h-4 text-emerald-500" />;
      case 'order':
        return <ShoppingCart className={iconClass} />;
      case 'user':
        return <User className={iconClass} />;
      case 'category':
        return <Database className={iconClass} />;
      case 'gallery':
        return <Image className={iconClass} />;
      case 'settings':
        return <Settings className={iconClass} />;
      case 'notification':
        return <Bell className={iconClass} />;
      case 'support_ticket':
        return <MessageSquare className={iconClass} />;
      default:
        return <FileText className={iconClass} />;
    }
  };

  const formatActionType = (actionType: string) => {
    return actionType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getActionBadgeColor = (actionType: string, resourceType?: string) => {
    // Special badge for inventory
    if (resourceType === 'inventory') {
      return 'bg-emerald-100 text-emerald-700';
    }
    
    switch (actionType) {
      case 'create':
        return 'bg-green-100 text-green-700';
      case 'update':
        return 'bg-blue-100 text-blue-700';
      case 'delete':
        return 'bg-red-100 text-red-700';
      case 'bulk_create':
        return 'bg-green-100 text-green-700';
      case 'bulk_update':
        return 'bg-blue-100 text-blue-700';
      case 'bulk_delete':
        return 'bg-red-100 text-red-700';
      case 'login':
        return 'bg-purple-100 text-purple-700';
      case 'logout':
        return 'bg-orange-100 text-orange-700';
      case 'export':
        return 'bg-cyan-100 text-cyan-700';
      case 'import':
        return 'bg-indigo-100 text-indigo-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const isBulkAction = (actionType: string) => {
    return actionType.startsWith('bulk_');
  };

  // Check if a log represents a bulk operation (multiple items affected)
  const isBulkLog = (log: AuditLog): boolean => {
    // Check action type first
    if (log.actionType.startsWith('bulk_')) return true;
    
    // Check metadata for arrays of items
    if (log.metadata?.affectedItems && log.metadata.affectedItems.length > 1) return true;
    if (log.metadata?.orderIds && log.metadata.orderIds.length > 1) return true;
    if (log.metadata?.productIds && log.metadata.productIds.length > 1) return true;
    if (log.metadata?.itemCount && log.metadata.itemCount > 1) return true;
    
    // Check description for "(X items)" pattern
    const itemsMatch = log.details.match(/\((\d+)\s*items?\)/i);
    if (itemsMatch && parseInt(itemsMatch[1]) > 1) return true;
    
    return false;
  };

  // Get the count of items affected in a bulk action
  const getBulkItemCount = (log: AuditLog): number => {
    if (log.metadata?.affectedItems) return log.metadata.affectedItems.length;
    if (log.metadata?.orderIds) return log.metadata.orderIds.length;
    if (log.metadata?.productIds) return log.metadata.productIds.length;
    if (log.metadata?.itemCount) return log.metadata.itemCount;
    
    const itemsMatch = log.details.match(/\((\d+)\s*items?\)/i);
    if (itemsMatch) return parseInt(itemsMatch[1]);
    
    return 1;
  };

  // Render inventory change details
  const renderInventoryDetails = (log: AuditLog) => {
    const metadata = log.metadata || {};
    const previousStock = metadata.previousStock;
    const newStock = metadata.newStock;
    const productName = metadata.productName || log.resourceName;
    const stockChange = (newStock !== undefined && previousStock !== undefined) 
      ? newStock - previousStock 
      : null;

    if (log.resourceType !== 'inventory' || previousStock === undefined) {
      return <p className="text-sm text-gray-600 truncate">{log.details}</p>;
    }

    return (
      <div className="space-y-1">
        <p className="text-sm text-gray-700 font-medium">{productName}</p>
        <div className="flex items-center gap-2 text-sm">
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded font-mono">
            {previousStock}
          </span>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <span className={`px-2 py-0.5 rounded font-mono ${
            stockChange && stockChange > 0 
              ? 'bg-green-100 text-green-700' 
              : stockChange && stockChange < 0 
                ? 'bg-red-100 text-red-700' 
                : 'bg-gray-100 text-gray-600'
          }`}>
            {newStock}
          </span>
          {stockChange !== null && (
            <span className={`flex items-center gap-1 text-xs font-medium ${
              stockChange > 0 ? 'text-green-600' : stockChange < 0 ? 'text-red-600' : 'text-gray-500'
            }`}>
              {stockChange > 0 ? (
                <>
                  <TrendingUp className="w-3 h-3" />
                  +{stockChange}
                </>
              ) : stockChange < 0 ? (
                <>
                  <TrendingDown className="w-3 h-3" />
                  {stockChange}
                </>
              ) : (
                'No change'
              )}
            </span>
          )}
        </div>
      </div>
    );
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container') && !target.closest('.action-menu-container')) {
        setShowTypeDropdown(false);
        setShowActionDropdown(false);
        setShowItemsDropdown(false);
        setActiveMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle view click
  const handleViewLog = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetailModal(true);
    setActiveMenuId(null);
  };

  // Handle mark as read
  const handleMarkAsRead = (logId: string) => {
    setMarkedAsRead(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  // Parse bulk entities from metadata or details
  const parseBulkEntities = (log: AuditLog): string[] => {
    // Get resource type for labeling
    const resourceLabel = log.resourceType.charAt(0).toUpperCase() + log.resourceType.slice(1);
    
    if (log.metadata?.affectedItems) {
      return log.metadata.affectedItems.map((item: any) => item.name || item.id || `${resourceLabel} ${item}`);
    }
    if (log.metadata?.orderIds) {
      return log.metadata.orderIds.map((id: string) => `Order ${id.slice(-4)}`);
    }
    if (log.metadata?.productIds) {
      return log.metadata.productIds.map((id: string, idx: number) => `Product ${idx + 1}`);
    }
    
    // Try to extract count from details like "(14 items)"
    const itemsMatch = log.details.match(/\((\d+)\s*items?\)/i);
    if (itemsMatch) {
      const count = Math.min(parseInt(itemsMatch[1]), 10);
      return Array.from({ length: count }, (_, i) => `${resourceLabel} ${i + 1}`);
    }
    
    // Try to extract from details pattern like "14 products"
    const countMatch = log.details.match(/(\d+)\s+(products?|orders?|items?)/i);
    if (countMatch) {
      const count = Math.min(parseInt(countMatch[1]), 10);
      return Array.from({ length: count }, (_, i) => `${resourceLabel} ${i + 1}`);
    }
    
    return [log.resourceName || resourceLabel];
  };

  // Parse bulk description details
  const parseBulkDescriptions = (log: AuditLog): string[] => {
    const resourceLabel = log.resourceType.charAt(0).toUpperCase() + log.resourceType.slice(1);
    
    if (log.metadata?.changes) {
      return log.metadata.changes.map((change: any) => 
        `${change.name || change.id} (${change.oldStatus || 'previous'} to ${change.newStatus || 'new'})`
      );
    }
    
    // Generate descriptions based on action type and count
    const itemCount = getBulkItemCount(log);
    if (itemCount > 1) {
      // Generate sample descriptions based on action
      const action = log.actionType.replace('bulk_', '');
      return Array.from({ length: Math.min(itemCount, 8) }, (_, i) => 
        `${resourceLabel} ${i + 1} (${action}d successfully)`
      );
    }
    
    return [log.details];
  };

  // Activity Detail Modal Component
  const ActivityDetailModal = ({ log, onClose }: { log: AuditLog; onClose: () => void }) => {
    const isBulk = isBulkLog(log);
    const itemCount = getBulkItemCount(log);
    const entities = isBulk ? parseBulkEntities(log) : [log.resourceName || log.resourceType];
    const descriptions = isBulk ? parseBulkDescriptions(log) : [log.details];
    const isRead = markedAsRead.has(log._id);
    const slNumber = logs.findIndex(l => l._id === log._id) + 1 + (currentPage - 1) * itemsPerPage;

    return (
      <div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div 
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden "
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 py-4 border-b border-gray-100 dark:border-gray-700 dark:bg-gray-800">
            <span className="text-sm text-gray-500 font-poppins">SI : {slNumber}</span>
            <span className="text-sm text-gray-500 font-poppins">{formatDateTime(log.createdAt)}</span>
          </div>

          {/* Content */}
          <div className="px-6 py-5 space-y-4">
            {/* Action */}
            <div className="flex items-start gap-4">
              <span className="text-sm text-gray-500 font-poppins w-20 shrink-0">Action</span>
              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: getActionIconBg(log.actionType, log.resourceType) }}
                >
                  {getActionIcon(log.actionType, log.resourceType)}
                </div>
                <span className="text-sm font-medium text-gray-900 font-poppins">
                  {formatActionLabel(log.actionType, log.resourceType)}
                </span>
              </div>
            </div>

            {/* Action by */}
            <div className="flex items-start gap-4">
              <span className="text-sm text-gray-500 font-poppins w-20 shrink-0">Action by</span>
              <span className="text-sm font-medium text-gray-900 font-poppins">: {log.userName}</span>
            </div>

            {/* Entity */}
            <div className="flex items-start gap-4">
              <span className="text-sm text-gray-500 font-poppins w-20 shrink-0">Entity</span>
              {isBulk ? (
                <div className="flex-1">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {entities.slice(0, 10).map((entity, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-900" />
                        <span className="text-sm text-gray-900 font-poppins">{entity}</span>
                      </div>
                    ))}
                  </div>
                  {entities.length > 10 && (
                    <span className="text-xs text-gray-500 mt-2 block">
                      +{entities.length - 10} more items
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-sm font-medium text-gray-900 font-poppins">
                  : {log.resourceName || `${log.resourceType} ${log.resourceId?.slice(-4) || ''}`}
                </span>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <span className="text-sm text-gray-500 font-poppins">Description</span>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-48 overflow-y-auto">
                {isBulk ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700 font-poppins font-medium">
                      {log.details}
                    </p>
                    {descriptions.length > 1 && (
                      <div className="space-y-1 mt-3 pt-3 border-t border-gray-200">
                        {descriptions.slice(0, 10).map((desc, idx) => (
                          <p key={idx} className="text-sm text-gray-600 font-poppins">
                            {desc}
                          </p>
                        ))}
                        {descriptions.length > 10 && (
                          <p className="text-xs text-gray-500 mt-2">
                            +{descriptions.length - 10} more changes
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-700 font-poppins">{log.details}</p>
                )}
              </div>
            </div>
          </div>

          {/* Footer - Mark as Read */}
          <div className="px-6 py-4 border-t border-gray-100 flex justify-center">
            <button
              onClick={() => handleMarkAsRead(log._id)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors font-poppins"
            >
              {isRead ? (
                <CheckSquare className="w-5 h-5 text-blue-500" />
              ) : (
                <Square className="w-5 h-5" />
              )}
              <span>Mark as Read</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={figmaStyles.container}>
      {/* Main Content */}
      <div style={figmaStyles.mainContent}>
        {/* Header Row */}
        <div style={figmaStyles.headerRow}>
          <h1 style={figmaStyles.title}>Activity Log</h1>
          
          <div style={figmaStyles.filtersRow}>
            {/* Date Range */}
            <div style={figmaStyles.dateRangeGroup}>
              <div style={{ position: 'relative' }} className="dropdown-container">
                <button
                  style={figmaStyles.filterButton}
                  onClick={() => {}}
                >
                  <span style={figmaStyles.filterButtonText}>
                    {startDate || '01-01-2025'}
                  </span>
                  <ChevronDown style={{ width: '10px', height: '10px', transform: 'rotate(0deg)', color: '#000' }} />
                </button>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ position: 'absolute', opacity: 0, top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                />
              </div>
              <span style={figmaStyles.filterToText}>To</span>
              <div style={{ position: 'relative' }} className="dropdown-container">
                <button
                  style={figmaStyles.filterButton}
                  onClick={() => {}}
                >
                  <span style={figmaStyles.filterButtonText}>
                    {endDate || '01-01-2026'}
                  </span>
                  <ChevronDown style={{ width: '10px', height: '10px', transform: 'rotate(0deg)', color: '#000' }} />
                </button>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ position: 'absolute', opacity: 0, top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                />
              </div>
            </div>

            {/* Type Dropdown */}
            <div style={{ position: 'relative' }} className="dropdown-container">
              <button
                style={figmaStyles.filterButton}
                onClick={() => {
                  setShowTypeDropdown(!showTypeDropdown);
                  setShowActionDropdown(false);
                  setShowItemsDropdown(false);
                }}
              >
                <span style={figmaStyles.filterButtonText}>
                  {resourceTypes.find(t => t.value === resourceTypeFilter)?.label || 'All Type'}
                </span>
                <ChevronDown style={{ width: '10px', height: '10px', transform: showTypeDropdown ? 'rotate(180deg)' : 'rotate(0deg)', color: '#000', transition: 'transform 0.2s' }} />
              </button>
              {showTypeDropdown && (
                <div style={figmaStyles.dropdown}>
                  {resourceTypes.map(type => (
                    <button
                      key={type.value}
                      onClick={() => {
                        setResourceTypeFilter(type.value);
                        setShowTypeDropdown(false);
                        setCurrentPage(1);
                      }}
                      style={{
                        ...figmaStyles.dropdownItem,
                        backgroundColor: resourceTypeFilter === type.value ? '#e0f7fa' : 'transparent',
                      }}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Action Dropdown */}
            <div style={{ position: 'relative' }} className="dropdown-container">
              <button
                style={figmaStyles.filterButton}
                onClick={() => {
                  setShowActionDropdown(!showActionDropdown);
                  setShowTypeDropdown(false);
                  setShowItemsDropdown(false);
                }}
              >
                <span style={figmaStyles.filterButtonText}>
                  {actionTypes.find(a => a.value === actionTypeFilter)?.label || 'All Actions'}
                </span>
                <ChevronDown style={{ width: '10px', height: '10px', transform: showActionDropdown ? 'rotate(180deg)' : 'rotate(0deg)', color: '#000', transition: 'transform 0.2s' }} />
              </button>
              {showActionDropdown && (
                <div style={figmaStyles.dropdown}>
                  {actionTypes.map(action => (
                    <button
                      key={action.value}
                      onClick={() => {
                        setActionTypeFilter(action.value);
                        setShowActionDropdown(false);
                        setCurrentPage(1);
                      }}
                      style={{
                        ...figmaStyles.dropdownItem,
                        backgroundColor: actionTypeFilter === action.value ? '#e0f7fa' : 'transparent',
                      }}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* By Admin Dropdown (items per page) */}
            <div style={{ position: 'relative' }} className="dropdown-container">
              <button
                style={figmaStyles.filterButton}
                onClick={() => {
                  setShowItemsDropdown(!showItemsDropdown);
                  setShowTypeDropdown(false);
                  setShowActionDropdown(false);
                }}
              >
                <span style={figmaStyles.filterButtonText}>By Admin</span>
                <ChevronDown style={{ width: '10px', height: '10px', transform: showItemsDropdown ? 'rotate(180deg)' : 'rotate(0deg)', color: '#000', transition: 'transform 0.2s' }} />
              </button>
              {showItemsDropdown && (
                <div style={figmaStyles.dropdown}>
                  {itemsPerPageOptions.map(option => (
                    <button
                      key={option}
                      onClick={() => {
                        setItemsPerPage(option);
                        setShowItemsDropdown(false);
                        setCurrentPage(1);
                      }}
                      style={{
                        ...figmaStyles.dropdownItem,
                        backgroundColor: itemsPerPage === option ? '#e0f7fa' : 'transparent',
                      }}
                    >
                      {option} Items
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Clear Filter Button */}
            <button
              style={figmaStyles.clearFilterButton}
              onClick={clearFilters}
            >
              <FilterX style={{ width: '24px', height: '24px', color: '#ff6a00' }} />
              <span style={figmaStyles.clearFilterText}>Clear filter</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', overflow: 'hidden' }}>
          {loading ? (
            <ActivityLogSkeleton />
          ) : logs.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <Activity style={{ width: '48px', height: '48px', color: '#d1d5db', margin: '0 auto 12px' }} />
              <h3 style={{ ...figmaStyles.entityTitle, marginBottom: '4px' }}>No Activity Logs Found</h3>
              <p style={figmaStyles.entitySubtitle}>No logs match your current filters</p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div style={figmaStyles.tableHeader}>
                <span style={figmaStyles.tableHeaderText}>SL</span>
                <span style={figmaStyles.tableHeaderText}>Action</span>
                <span style={figmaStyles.tableHeaderText}>Entity</span>
                <span style={figmaStyles.tableHeaderText}>Description</span>
                <span style={figmaStyles.tableHeaderText}>Name</span>
                <span style={figmaStyles.tableHeaderText}>Date & Time</span>
                <span></span>
              </div>

              {/* Table Rows */}
              {logs.map((log, index) => (
                <div key={log._id} style={figmaStyles.tableRow}>
                  {/* SL */}
                  <span style={figmaStyles.cellText}>
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </span>

                  {/* Action */}
                  <div style={figmaStyles.actionBadge}>
                    <div style={{
                      ...figmaStyles.actionIcon,
                      backgroundColor: getActionIconBg(log.actionType, log.resourceType),
                    }}>
                      {getActionIcon(log.actionType, log.resourceType)}
                    </div>
                    <span style={figmaStyles.cellText}>
                      {formatActionLabel(log.actionType, log.resourceType)}
                    </span>
                  </div>

                  {/* Entity */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ ...figmaStyles.entityTitle, fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                      {log.resourceName || `${log.resourceType.charAt(0).toUpperCase() + log.resourceType.slice(1)} ${log.resourceId?.slice(-4) || ''}`}
                    </span>
                    <span style={figmaStyles.entitySubtitle}>
                      {log.resourceType.charAt(0).toUpperCase() + log.resourceType.slice(1)}
                    </span>
                  </div>

                  {/* Description */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={figmaStyles.cellText}>{log.details}</span>
                    {isBulkAction(log.actionType) && (
                      <div style={figmaStyles.bulkBadge}>
                        <span style={figmaStyles.bulkText}>Bulk</span>
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <span style={figmaStyles.cellText}>{log.userName}</span>

                  {/* Date & Time */}
                  <span style={figmaStyles.cellText}>{formatDateTime(log.createdAt)}</span>

                  {/* Actions Menu */}
                  <div className="action-menu-container" style={{ position: 'relative' }}>
                    <button
                      onClick={() => setActiveMenuId(activeMenuId === log._id ? null : log._id)}
                      style={{ 
                        ...figmaStyles.dotsIcon, 
                        background: 'none', 
                        border: 'none', 
                        padding: '4px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      className="hover:bg-gray-100 transition-colors"
                    >
                      <MoreVertical style={{ width: '20px', height: '20px', color: '#6a717f' }} />
                    </button>
                    {activeMenuId === log._id && (
                      <div 
                        style={{
                          position: 'absolute',
                          top: '100%',
                          right: 0,
                          marginTop: '4px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          zIndex: 50,
                          minWidth: '120px',
                          overflow: 'hidden',
                        }}
                      >
                        <button
                          onClick={() => handleViewLog(log)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 16px',
                            width: '100%',
                            border: 'none',
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            fontFamily: "'Poppins', sans-serif",
                            fontSize: '13px',
                            color: '#1d1a1a',
                          }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <Eye style={{ width: '16px', height: '16px', color: '#6366f1' }} />
                          <span>View</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Activity Detail Modal */}
        {showDetailModal && selectedLog && (
          <ActivityDetailModal 
            log={selectedLog} 
            onClose={() => {
              setShowDetailModal(false);
              setSelectedLog(null);
            }} 
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={figmaStyles.pagination}>
            <button
              style={figmaStyles.navButton}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft style={{ width: '16px', height: '16px' }} />
              <span>Previous</span>
            </button>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    style={{
                      ...figmaStyles.pageButton,
                      ...(currentPage === pageNum ? figmaStyles.pageButtonActive : {}),
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <span style={{ color: '#6b7280' }}>...</span>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    style={figmaStyles.pageButton}
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>

            <button
              style={figmaStyles.navButton}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <span>Next</span>
              <ChevronRight style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminActivityLog;
