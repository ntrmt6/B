import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Search, Filter, Printer, ShieldAlert, ShieldCheck, X, Package2, Mail, Truck, AlertTriangle, CheckCircle2, Send, Loader2, MoreVertical, Download, Trash2, Plus, TrendingUp, ChevronLeft, ChevronRight, ChevronDown, MoreHorizontal, ChevronUp, ShoppingCart, DollarSign, Package, Eye, Edit } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Order, CourierConfig, PathaoConfig } from '../types';
import { CourierService, FraudCheckResult } from '../services/CourierService';
import { MetricsSkeleton, TableSkeleton } from '../components/SkeletonLoaders';
import { normalizeImageUrl } from '../utils/imageUrlHelper';

interface AdminOrdersProps {
  orders: Order[];
  courierConfig: CourierConfig;
  onUpdateOrder: (orderId: string, updates: Partial<Order>) => void;
}

type StatusFilter = 'all' | Order['status'];

// New clean status colors for the redesigned UI
const STATUS_COLORS: Record<Order['status'], string> = {
  Pending: 'text-orange-600 bg-orange-50 border border-orange-200',
  Confirmed: 'text-blue-600 bg-blue-50 border border-blue-200',
  'On Hold': 'text-amber-600 bg-amber-50 border border-amber-200',
  Processing: 'text-cyan-600 bg-cyan-50 border border-cyan-200',
  Shipped: 'text-indigo-600 bg-indigo-50 border border-indigo-200',
  'Sent to Courier': 'text-purple-600 bg-purple-50 border border-purple-200',
  Delivered: 'text-emerald-600 bg-emerald-50 border border-emerald-200',
  Cancelled: 'text-red-600 bg-red-50 border border-red-200',
  Return: 'text-yellow-600 bg-yellow-50 border border-yellow-200',
  Refund: 'text-pink-600 bg-pink-50 border border-pink-200',
  'Returned Receive': 'text-slate-600 bg-slate-50 border border-slate-200',
  Incomplete: ''
};

const STATUSES: Order['status'][] = ['Pending', 'Confirmed', 'On Hold', 'Processing', 'Shipped', 'Sent to Courier', 'Delivered', 'Cancelled', 'Return', 'Refund', 'Returned Receive'];

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(value);

const getCourierId = (order: Order) => {
  if (order.trackingId) return order.trackingId;
  if (order.courierMeta) {
    return (
      (order.courierMeta.tracking_id as string) ||
      (order.courierMeta.trackingCode as string) ||
      (order.courierMeta.consignment_id as string) ||
      (order.courierMeta.invoice as string)
    );
  }
  return undefined;
};

const AdminOrders: React.FC<AdminOrdersProps> = ({ orders, courierConfig, onUpdateOrder }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [draftOrder, setDraftOrder] = useState<Order | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFraudChecking, setIsFraudChecking] = useState(false);
  const [isSendingToSteadfast, setIsSendingToSteadfast] = useState(false);
  const [isSendingToPathao, setIsSendingToPathao] = useState(false);
  const [pathaoConfig, setPathaoConfig] = useState<PathaoConfig | null>(null);
  const [fraudResult, setFraudResult] = useState<FraudCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [highlightedOrderId, setHighlightedOrderId] = useState<string | null>(null);
  const orderRowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

  // Multi-select state
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [openActionDropdown, setOpenActionDropdown] = useState<string | null>(null);
  const [showCourierModal, setShowCourierModal] = useState(false);
  const [courierModalOrderId, setCourierModalOrderId] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [mobileCardActionDropdown, setMobileCardActionDropdown] = useState<string | null>(null);

  // Available couriers
  const COURIERS = [
    { id: 'pathao', name: 'Pathao Courier', logo: '/icons/pathao.png' },
    { id: 'steadfast', name: 'Steadfast Courier', logo: '/icons/steadfast.png' },
    { id: 'redx', name: 'RedX Courier', logo: '/icons/redx.png' },
  ];

  // Simulate initial data loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (openActionDropdown !== null) {
        if (!target.closest('[data-action-dropdown]')) {
          setOpenActionDropdown(null);
        }
      }
      if (mobileCardActionDropdown !== null) {
        if (!target.closest('[data-mobile-card-dropdown]')) {
          setMobileCardActionDropdown(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openActionDropdown, mobileCardActionDropdown]);

  // Check for highlighted order from notification click
  useEffect(() => {
    const storedOrderId = window.sessionStorage.getItem('highlightOrderId');
    if (storedOrderId) {
      setHighlightedOrderId(storedOrderId);
      window.sessionStorage.removeItem('highlightOrderId');

      // Scroll to the order after a short delay
      setTimeout(() => {
        const orderRow = orderRowRefs.current.get(storedOrderId);
        if (orderRow) {
          orderRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Remove highlight after 3 seconds
        setTimeout(() => {
          setHighlightedOrderId(null);
        }, 3000);
      }, 500);
    }
  }, [orders]);

  const metrics = useMemo(() => {
    // Exclude incomplete orders from general metrics
    const validOrders = orders.filter(o => o.status !== 'Incomplete');
    const total = validOrders.length;
    const revenue = validOrders.reduce((sum: number, order: Order) => sum + (order.amount || 0), 0);
    const pending = validOrders.filter((order: Order) => order.status === 'Pending').length;
    const fulfilled = validOrders.filter((order: Order) => order.status === 'Delivered').length;
    const average = total ? revenue / total : 0;
    return { total, revenue, pending, fulfilled, average };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return orders.filter((order: Order) => {
      // Exclude incomplete orders from the main order list
      if (order.status === 'Incomplete') return false;

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      if (!query) return matchesStatus;
      const haystack = `${order.id} ${order.customer} ${order.location} ${order.phone || ''}`.toLowerCase();
      return matchesStatus && haystack.includes(query);
    });
  }, [orders, searchTerm, statusFilter]);

  const openOrderModal = (order: Order) => {
    setSelectedOrder(order);
    setDraftOrder({ ...order });
    setFraudResult(null);
  };

  const closeOrderModal = () => {
    setSelectedOrder(null);
    setDraftOrder(null);
    setIsSaving(false);
    setIsFraudChecking(false);
    setFraudResult(null);
  };

  const handleDraftChange = <K extends keyof Order>(field: K, value: Order[K]) => {
    setDraftOrder((prev: Order | null) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSaveOrder = async () => {
    if (!selectedOrder || !draftOrder) return;
    setIsSaving(true);
    try {
      const { id, ...updates } = draftOrder;
      onUpdateOrder(selectedOrder.id, updates);
      toast.success('Order updated');
      closeOrderModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update order';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  // Ctrl+S keyboard shortcut for save when modal is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && selectedOrder) {
        e.preventDefault();
        handleSaveOrder();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Selection handlers
  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds((prev: string[]) =>
      prev.includes(orderId)
        ? prev.filter((id: string) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map((o: Order) => o.id));
    }
  };

  const clearSelection = () => {
    setSelectedOrderIds([]);
  };

  // Bulk action handlers
  const handleBulkDelete = () => {
    if (selectedOrderIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedOrderIds.length} order(s)?`)) {
      // Implementation would call backend
      toast.success(`${selectedOrderIds.length} order(s) deleted`);
      setSelectedOrderIds([]);
    }
  };

  const handleBulkStatusChange = (newStatus: Order['status']) => {
    selectedOrderIds.forEach((orderId: string) => {
      onUpdateOrder(orderId, { status: newStatus });
    });
    toast.success(`Updated ${selectedOrderIds.length} order(s) to ${newStatus}`);
    setSelectedOrderIds([]);
    setShowStatusModal(false);
  };

  const handleDownloadExcel = () => {
    const selectedOrders = orders.filter((o: Order) => selectedOrderIds.includes(o.id));
    // Create CSV content
    const headers = ['Order ID', 'Customer', 'Phone', 'Location', 'Amount', 'Status', 'Date'];
    const rows = selectedOrders.map((o: Order) => [
      o.id, o.customer, o.phone || '', o.location, o.amount, o.status, o.date
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Excel file downloaded');
  };

  const handleMultiplePrint = () => {
    selectedOrderIds.forEach((orderId: string) => {
      const order = orders.find((o: Order) => o.id === orderId);
      if (order) handlePrintInvoice(order);
    });
  };

  const handleAssignCourier = (courierId: string, courierName: string) => {
    if (courierModalOrderId) {
      // Single order assignment
      onUpdateOrder(courierModalOrderId, {
        courierProvider: courierName as Order['courierProvider'],
        status: 'Sent to Courier'
      });
      toast.success(`Courier assigned: ${courierName}`);
    } else {
      // Bulk assignment
      selectedOrderIds.forEach((orderId: string) => {
        onUpdateOrder(orderId, {
          courierProvider: courierName as Order['courierProvider'],
          status: 'Sent to Courier'
        });
      });
      toast.success(`Courier assigned to ${selectedOrderIds.length} order(s)`);
      setSelectedOrderIds([]);
    }
    setShowCourierModal(false);
    setCourierModalOrderId(null);
  };

  const handleFraudCheck = async (order: Order) => {
    if (!courierConfig.apiKey || !courierConfig.secretKey) {
      toast.error('Please configure Steadfast API credentials in Courier Settings first.');
      return;
    }
    setIsFraudChecking(true);
    try {
      const result = await CourierService.checkFraudRisk(order, courierConfig);
      setFraudResult(result);
      toast.success('Fraud check completed');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Fraud check failed';
      toast.error(message);
    } finally {
      setIsFraudChecking(false);
    }
  };

  const handleSendToSteadfast = async (order: Order) => {
    if (!courierConfig.apiKey || !courierConfig.secretKey) {
      toast.error('Please configure Steadfast API credentials in Courier Settings first.');
      return;
    }
    if (!order.phone) {
      toast.error('Customer phone number is required to send to Steadfast.');
      return;
    }
    if (order.courierProvider === 'Steadfast' && order.trackingId) {
      toast.error('This order has already been sent to Steadfast.');
      return;
    }

    setIsSendingToSteadfast(true);
    try {
      const result = await CourierService.sendToSteadfast(order, courierConfig);

      // Update the order with tracking info
      const updates: Partial<Order> = {
        trackingId: result.trackingId,
        courierProvider: 'Steadfast',
        courierMeta: result.response,
        status: 'Sent to Courier'
      };

      onUpdateOrder(order.id, updates);

      // Update draft order to reflect changes
      setDraftOrder((prev: Order | null) => prev ? { ...prev, ...updates } : prev);

      toast.success(`Order sent to Steadfast! Tracking ID: ${result.trackingId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send order to Steadfast';
      toast.error(message);
    } finally {
      setIsSendingToSteadfast(false);
    }
  };

  // Load Pathao config on component mount
  useEffect(() => {
    const loadPathaoConfig = async () => {
      try {
        const config = await CourierService.loadPathaoConfig('');
        if (config) setPathaoConfig(config);
      } catch (e) { /* ignore */ }
    };
    loadPathaoConfig();
  }, []);

  const handleSendToPathao = async (order: Order) => {
    if (!pathaoConfig?.apiKey || !pathaoConfig?.secretKey || !pathaoConfig?.username || !pathaoConfig?.password) {
      toast.error('Please configure Pathao API credentials in Courier Settings first.');
      return;
    }
    if (!pathaoConfig.storeId) {
      toast.error('Pathao Store ID is required. Configure it in Courier Settings.');
      return;
    }
    if (!order.phone) {
      toast.error('Customer phone number is required to send to Pathao.');
      return;
    }
    if (order.courierProvider === 'Pathao' && order.trackingId) {
      toast.error('This order has already been sent to Pathao.');
      return;
    }

    setIsSendingToPathao(true);
    try {
      const result = await CourierService.sendToPathao(order, pathaoConfig);

      const updates: Partial<Order> = {
        trackingId: result.trackingId,
        courierProvider: 'Pathao',
        courierMeta: result.response,
        status: 'Sent to Courier'
      };

      onUpdateOrder(order.id, updates);
      setDraftOrder((prev: Order | null) => prev ? { ...prev, ...updates } : prev);

      toast.success(`Order sent to Pathao! Tracking ID: ${result.trackingId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send order to Pathao';
      toast.error(message);
    } finally {
      setIsSendingToPathao(false);
    }
  };

  const handlePrintInvoice = (order: Order) => {
    try {
      const courierId = getCourierId(order) || 'Pending assignment';
      const popup = window.open('', 'PRINT', 'width=900,height=700');
      if (!popup) {
        toast.error('Please allow popups to print the invoice.');
        return;
      }
      const itemLabel = order.productName ? `${order.productName}${order.variant ? ` (${order.variant.color} / ${order.variant.size})` : ''}` : 'Custom Order';
      const now = new Date().toLocaleString();
      popup.document.write(`<!doctype html>
<html>
<head>
<meta charSet="utf-8" />
<title>Invoice ${order.id}</title>
<style>
body { font-family: 'Segoe UI', Arial, sans-serif; padding: 32px; color: #0f172a; }
header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
h1 { font-size: 24px; margin: 0; }
.section { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
.section h2 { margin: 0 0 12px; font-size: 16px; text-transform: uppercase; color: #475569; letter-spacing: 0.05em; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
.label { font-size: 12px; text-transform: uppercase; color: #94a3b8; margin-bottom: 4px; letter-spacing: 0.05em; }
.value { font-size: 15px; font-weight: 600; color: #0f172a; }
table { width: 100%; border-collapse: collapse; margin-top: 8px; }
th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e2e8f0; }
th { text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em; color: #64748b; }
footer { text-align: center; margin-top: 32px; font-size: 12px; color: #475569; }
</style>
</head>
<body>
<header>
  <div>
    <p style="text-transform: uppercase; letter-spacing: 0.2em; color: #ef4444; margin: 0;">Admin Console</p>
    <h1>Invoice ${order.id}</h1>
  </div>
  <div style="text-align: right;">
    <p class="label" style="margin:0;">Printed</p>
    <p class="value" style="margin:0;">${now}</p>
  </div>
</header>
<section class="section">
  <h2>Customer</h2>
  <div class="grid">
    <div><p class="label">Name</p><p class="value">${order.customer}</p></div>
    <div><p class="label">Phone</p><p class="value">${order.phone || 'Not Provided'}</p></div>
    <div><p class="label">Email</p><p class="value">${order.email || 'Not Provided'}</p></div>
    <div><p class="label">Division</p><p class="value">${order.division || 'N/A'}</p></div>
  </div>
  <div style="margin-top:12px;">
    <p class="label">Delivery Address</p>
    <p class="value">${order.location}</p>
  </div>
</section>
<section class="section">
  <h2>Courier</h2>
  <div class="grid">
    <div><p class="label">Provider</p><p class="value">${order.courierProvider || 'Not Assigned'}</p></div>
    <div><p class="label">Courier ID</p><p class="value">${courierId}</p></div>
    <div><p class="label">Delivery Type</p><p class="value">${order.deliveryType || 'Regular'}</p></div>
  </div>
</section>
<section class="section">
  <h2>Items</h2>
  <div className="overflow-x-auto">
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Qty</th>
        <th>Charge</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${itemLabel}</td>
        <td>${order.quantity || 1}</td>
        <td>${order.deliveryCharge ? formatCurrency(order.deliveryCharge) : '-'}</td>
        <td>${formatCurrency(order.amount)}</td>
      </tr>
    </tbody>
  </table>
</section>
<section class="section" style="display:flex; justify-content:flex-end;">
  <div style="width: 260px;">
    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
      <span class="label">Subtotal</span>
      <span class="value">${formatCurrency(order.amount - (order.deliveryCharge || 0))}</span>
    </div>
    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
      <span class="label">Delivery</span>
      <span class="value">${order.deliveryCharge ? formatCurrency(order.deliveryCharge) : 'Included'}</span>
    </div>
    <div style="border-top:1px solid #e2e8f0; margin-top:12px; padding-top:8px; display:flex; justify-content:space-between;">
      <span class="label" style="letter-spacing:0.1em;">Total Due</span>
      <span class="value" style="font-size:18px;">${formatCurrency(order.amount)}</span>
    </div>
  </div>
</section>
<footer>Courier ID must be shared with the customer. Thank you for using the premium admin console.</footer>
</body>
</html>`);
      popup.document.close();
      popup.focus();
      popup.print();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to print invoice';
      toast.error(message);
    }
  };

  const fraudBadge = fraudResult ? (() => {
    const status = (fraudResult.status || '').toLowerCase();
    if (['pass', 'safe', 'low'].some((cue) => status.includes(cue))) {
      return { label: fraudResult.status, color: 'text-emerald-300', icon: <ShieldCheck size={18} /> };
    }
    if (['review', 'medium', 'warn'].some((cue) => status.includes(cue))) {
      return { label: fraudResult.status, color: 'text-amber-300', icon: <AlertTriangle size={18} /> };
    }
    return { label: fraudResult.status, color: 'text-rose-300', icon: <ShieldAlert size={18} /> };
  })() : null;

  const isSteadfastConfigured = !!(courierConfig.apiKey && courierConfig.secretKey);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ordersPerPage;
    return filteredOrders.slice(start, start + ordersPerPage);
  }, [filteredOrders, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const validOrders = orders.filter(o => o.status !== 'Incomplete');
    return {
      all: validOrders.length,
      completed: validOrders.filter((o: Order) => o.status === 'Delivered').length,
      pending: validOrders.filter((o: Order) => o.status === 'Pending').length,
      cancelled: validOrders.filter((o: Order) => o.status === 'Cancelled').length,
      returned: validOrders.filter((o: Order) => o.status === 'Return' || o.status === 'Returned Receive').length,
    };
  }, [orders]);

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8 font-sans text-slate-800">
      <div className="mx-auto max-w-[1920px]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Order List</h1>
            <p className="text-slate-500 mt-1">Manage and track all customer orders</p>
          </div>
          <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg transition-colors shadow-sm font-medium text-sm">
            <Plus size={18} strokeWidth={2.5} />
            <span>Add New Order</span>
          </button>
        </div>

        {/* Steadfast Configuration Warning */}
        {!isSteadfastConfigured && (
          <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-4 items-start">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600 shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="font-semibold text-amber-900">Steadfast API Not Configured</p>
              <p className="text-amber-700 text-sm mt-1">Go to Courier Settings to add your API Key and Secret Key to enable order sending and fraud checks.</p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {isLoading ? (
          <MetricsSkeleton count={4} />
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
              {[ 
                { label: 'Total Orders', value: metrics.total.toLocaleString(), icon: <ShoppingCart size={20} />, trend: '15% Than last month', trendUp: true, hasMenu: false, color: 'bg-blue-600', lightColor: 'bg-blue-50 text-blue-700' },
                { label: 'GMV', value: formatCurrency(metrics.revenue), icon: <DollarSign size={20} />, trend: '5% Than last month', trendUp: false, hasMenu: true, color: 'bg-emerald-600', lightColor: 'bg-emerald-50 text-emerald-700' },
                { label: 'Pending', value: metrics.pending.toLocaleString(), icon: <Package size={20} />, trend: '8% Than last month', trendUp: true, hasMenu: true, color: 'bg-amber-500', lightColor: 'bg-amber-50 text-amber-700' },
                { label: 'AVG Order', value: formatCurrency(metrics.average), icon: <TrendingUp size={20} />, trend: '12% Than last month', trendUp: true, hasMenu: false, color: 'bg-indigo-600', lightColor: 'bg-indigo-50 text-indigo-700' },
              ].map((stat, i) => (
              <div key={i} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-lg ${stat.lightColor}`}>
                    {stat.icon}
                  </div>
                  {stat.hasMenu && (
                    <button className="text-slate-400 hover:text-slate-600">
                      <MoreHorizontal size={20} />
                    </button>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                  <div className="flex items-center gap-2 mt-3 text-xs font-medium">
                    <span className={`flex items-center gap-0.5 ${stat.trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {stat.trendUp ? <ChevronUp size={12} strokeWidth={3} /> : <ChevronDown size={12} strokeWidth={3} />}
                      {stat.trend.split(' ')[0]}
                    </span>
                    <span className="text-slate-400">
                      {stat.trend.split(' ').slice(1).join(' ')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Main Content Area */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {/* Filters & Actions Toolbar */}
          <div className="p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Scrollable Tabs */}
            <div className="overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
              <div className="flex items-center gap-1">
                {[
                  { id: 'all', label: 'All order', count: tabCounts.all },
                  { id: 'Delivered', label: 'Completed', count: tabCounts.completed },
                  { id: 'Pending', label: 'Pending', count: tabCounts.pending },
                  { id: 'Cancelled', label: 'Canceled', count: tabCounts.cancelled },
                  { id: 'Return', label: 'Returned', count: tabCounts.returned },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id as StatusFilter)}
                    className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${statusFilter === tab.id
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                  >
                    {tab.label}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search & Actions */}
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-72">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search order report..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
                />
              </div>
              <button className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors">
                <Filter size={18} />
              </button>
              <button className="flex flex-col justify-center items-center p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors gap-0.5 h-[38px] w-[38px]">
                <ChevronUp size={10} className="-mb-0.5" />
                <ChevronDown size={10} className="-mt-0.5" />
              </button>
            </div>
          </div>

          {/* Orders Table/Cards */}
          {isLoading ? (
            <div className="p-6">
              <TableSkeleton rows={6} cols={7} />
            </div>
          ) : (
            <>
                {/* Mobile Card View (< lg) */}
                <div className="block lg:hidden divide-y divide-slate-100 dark:divide-slate-700">
                  {paginatedOrders.length > 0 && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedOrderIds.length === paginatedOrders.length && paginatedOrders.length > 0}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                        />
                        <span className="font-medium">Select All</span>
                      </label>
                      <span className="text-xs font-semibold bg-white border border-slate-200 px-2 py-1 rounded">{paginatedOrders.length} Orders</span>
                    </div>
                  )}

                  {paginatedOrders.length ? (
                  paginatedOrders.map((order: Order, index: number) => {
                    const isSelected = selectedOrderIds.includes(order.id);
                    const rowNumber = (currentPage - 1) * ordersPerPage + index + 1;
                    const isPaid = (order as Order & { paymentMethod?: string }).paymentMethod?.match(/bKash|Nagad|Card/);

                    return (
                      <div
                        key={order.id}
                        ref={(el) => { if (el) orderRowRefs.current.set(order.id, el as unknown as HTMLTableRowElement); }}
                        onClick={() => toggleOrderSelection(order.id)}
                        className={`p-4 transition-colors ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/20' : 'bg-white dark:bg-slate-900'}`}
                      >
                        {/* Card Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleOrderSelection(order.id);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 mt-1"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-slate-400">#{rowNumber < 10 ? `0${rowNumber}` : rowNumber}</span>
                                <span className="font-bold text-slate-900">{order.id.slice(-6)}</span>
                              </div>
                              <span className="text-xs text-slate-500">{order.date ? new Date(order.date).toLocaleDateString('en-GB') : 'N/A'}</span>
                            </div>
                          </div>
                          <div className={`px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                            {order.status}
                          </div>
                        </div>

                        {/* Product Info */}
                        <div className="flex gap-3 mb-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <div className="h-12 w-12 rounded-md overflow-hidden bg-white border border-slate-200 shrink-0 flex items-center justify-center">
                            {order.productImage ? (
                              <img src={normalizeImageUrl(order.productImage)} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <Package2 size={20} className="text-slate-400" />
                            )}
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-sm font-medium text-slate-900 truncate">{order.productName || 'Custom Order'}</p>
                            <p className="text-xs text-slate-500">SKU: {order.sku || order.id.slice(-6)}</p>
                          </div>
                        </div>

                        {/* Customer & Price */}
                        <div className="flex justify-between items-end">
                          <div className="text-sm">
                            <p className="font-medium text-slate-900 dark:text-white">{order.customer}</p>
                            <p className="text-slate-500 text-xs">{order.phone || 'No Phone'}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(order.amount)}</p>
                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                              {isPaid ? 'Paid' : 'Unpaid'}
                            </span>
                          </div>
                        </div>

                        {/* Mobile Action Dropdown */}
                        <div className="relative mt-4" data-mobile-card-dropdown>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMobileCardActionDropdown(mobileCardActionDropdown === order.id ? null : order.id);
                            }}
                            className="w-full flex items-center justify-center gap-2 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <MoreVertical size={16} /> Actions
                          </button>
                          {mobileCardActionDropdown === order.id && (
                            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden z-20">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openOrderModal(order);
                                  setMobileCardActionDropdown(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                              >
                                <Eye size={16} className="text-blue-500" />
                                View Order
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openOrderModal(order);
                                  setMobileCardActionDropdown(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-t border-slate-100 dark:border-slate-700"
                              >
                                <Edit size={16} className="text-emerald-500" />
                                Edit Order
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                  ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <Package2 size={48} strokeWidth={1} className="mb-3 opacity-50" />
                        <p className="font-medium">No orders found</p>
                      <p className="text-sm">Try adjusting your filters</p>
                    </div>
                  )}
                </div>

                {/* Desktop Table View (>= lg) */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase font-semibold tracking-wider">
                      <tr>
                        <th className="p-4 w-4">
                          <input
                            type="checkbox"
                            checked={selectedOrderIds.length === paginatedOrders.length && paginatedOrders.length > 0}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                          />
                        </th>
                        <th className="p-4">No</th>
                        <th className="p-4">Order ID</th>
                        <th className="p-4">SKU</th>
                        <th className="p-4">Product</th>
                        <th className="p-4">Customer</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Price</th>
                        <th className="p-4">Payment</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedOrders.length ? (
                        paginatedOrders.map((order, index) => {
                          const isSelected = selectedOrderIds.includes(order.id);
                          const rowNumber = (currentPage - 1) * ordersPerPage + index + 1;

                        return (
                          <tr
                            key={order.id} 
                            ref={(el) => { if (el) orderRowRefs.current.set(order.id, el); }}
                            onClick={() => toggleOrderSelection(order.id)}
                            className={`group hover:bg-slate-50/80 transition-colors cursor-pointer ${isSelected ? 'bg-blue-50/30 hover:bg-blue-50/50' : ''}`}
                          >
                            <td className="p-4">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => { e.stopPropagation(); toggleOrderSelection(order.id); }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                              />
                            </td>
                            <td className="p-4 text-sm text-slate-500 font-mono">{rowNumber < 10 ? `0${rowNumber}` : rowNumber}</td>
                            <td className="p-4 text-sm font-semibold text-slate-900">{order.id.slice(-6)}</td>
                            <td className="p-4 text-sm text-slate-500">{order.sku || '-'}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-md bg-white border border-slate-200 p-0.5 shrink-0 overflow-hidden">
                                  {order.productImage ? (
                                    <img src={normalizeImageUrl(order.productImage)} alt="" className="h-full w-full object-cover rounded-sm" />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center bg-slate-50">
                                      <Package2 size={16} className="text-slate-400" />
                                    </div>
                                  )}
                                </div>
                                <span className="text-sm font-medium text-slate-900 truncate max-w-[150px]" title={order.productName}>{order.productName || 'Custom Order'}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-slate-900">{order.customer}</span>
                                <span className="text-xs text-slate-500">{order.phone || 'No phone'}</span>
                              </div>
                            </td>
                            <td className="p-4 text-sm text-slate-600 whitespace-nowrap">
                              {order.date ? new Date(order.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                            </td>
                            <td className="p-4 text-sm font-semibold text-slate-900">
                              {formatCurrency(order.amount)}
                            </td>
                            <td className="p-4">
                              {(() => {
                                const orderWithPayment = order as Order & { paymentMethod?: string; transactionId?: string };
                                const paymentMethod = orderWithPayment.paymentMethod;
                                const transactionId = orderWithPayment.transactionId;
                                const isPaid = paymentMethod?.match(/bKash|Nagad|Rocket|UPay|Tap|Card/i);
                                
                                return (
                                  <div className="flex flex-col gap-0.5">
                                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border w-fit ${isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                      {isPaid ? 'Paid' : 'Unpaid'}
                                    </span>
                                    {paymentMethod && paymentMethod !== 'Cash On Delivery' && (
                                      <span className="text-xs text-slate-500 truncate max-w-[100px]" title={paymentMethod}>
                                        {paymentMethod}
                                      </span>
                                    )}
                                    {transactionId && (
                                      <span className="text-xs text-emerald-600 font-mono truncate max-w-[100px]" title={`TxID: ${transactionId}`}>
                                        TxID: {transactionId.slice(0, 8)}...
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={(e) => { e.stopPropagation(); openOrderModal(order); }}
                                className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all opacity-0 group-hover:opacity-100"
                              >
                                <MoreHorizontal size={18} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                      ) : (
                        <tr>
                          <td colSpan={11} className="p-12 text-center">
                            <div className="flex flex-col items-center justify-center text-slate-400">
                              <Package2 size={48} className="mb-3 opacity-50" strokeWidth={1} />
                              <p className="font-medium text-slate-600">No orders found matching your criteria</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {filteredOrders.length > 0 && (
                  <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-slate-500">
                      Showing <span className="font-medium text-slate-900">{((currentPage - 1) * ordersPerPage) + 1}</span> to <span className="font-medium text-slate-900">{Math.min(currentPage * ordersPerPage, filteredOrders.length)}</span> of <span className="font-medium text-slate-900">{filteredOrders.length}</span> entries
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 border border-slate-200 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum: number;
                          const maxVisible = 5;
                          if (totalPages <= maxVisible) pageNum = i + 1;
                          else if (currentPage <= 3) pageNum = i + 1;
                          else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                          else pageNum = currentPage - 2 + i;

                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${currentPage === pageNum
                                  ? 'bg-slate-900 text-white'
                                  : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      className="px-3 py-1.5 border border-slate-200 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Floating Selection Bar */}
      {selectedOrderIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-4 sm:gap-6 ring-1 ring-white/10">
            <div className="flex items-center gap-3 pr-4 border-r border-white/20">
              <span className="flex items-center justify-center bg-white text-slate-900 font-bold text-xs h-6 w-6 rounded-full">{selectedOrderIds.length}</span>
              <span className="text-sm font-medium hidden sm:inline">Selected</span>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={handleDownloadExcel} className="p-2 hover:bg-white/10 rounded-lg transition-colors flex flex-col items-center gap-1 group" title="Export CSV">
                <Download size={18} className="text-slate-300 group-hover:text-white" />
              </button>
              <button onClick={handleMultiplePrint} className="p-2 hover:bg-white/10 rounded-lg transition-colors flex flex-col items-center gap-1 group" title="Print Invoices">
                <Printer size={18} className="text-slate-300 group-hover:text-white" />
              </button>
              <button onClick={() => setShowStatusModal(true)} className="p-2 hover:bg-white/10 rounded-lg transition-colors flex flex-col items-center gap-1 group" title="Update Status">
                <Truck size={18} className="text-slate-300 group-hover:text-white" />
              </button>
              <div className="w-px h-8 bg-white/20 mx-1"></div>
              <button onClick={handleBulkDelete} className="p-2 hover:bg-rose-500/20 rounded-lg transition-colors flex flex-col items-center gap-1 group" title="Delete">
                <Trash2 size={18} className="text-rose-400 group-hover:text-rose-300" />
              </button>
            </div>
            <button onClick={clearSelection} className="ml-2 text-xs text-slate-400 hover:text-white flex items-center gap-1">
              <X size={12} /> Clear
            </button>
          </div>
        </div>
      )}

      {/* Modals Container - Fixed Z-Index Context */}
      <>
        {/* Courier Modal */}
        {showCourierModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900">Assign Courier</h3>
                <p className="text-sm text-slate-500">Choose a provider for selected orders</p>
              </div>
              <div className="p-2">
                {COURIERS.map((courier) => (
                  <button
                    key={courier.id}
                    onClick={() => handleAssignCourier(courier.id, courier.name)}
                     className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors group"
                   >
                     <div className="flex items-center gap-4">
                       <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                         {courier.logo ? <img src={courier.logo} alt="" className="h-6 w-6 object-contain" onError={(e: any) => e.target.style.display = 'none'} /> : <Truck size={20} className="text-slate-400" />}
                       </div>
                       <span className="font-medium text-slate-900">{courier.name}</span>
                     </div>
                     <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-600" />
                   </button>
                 ))}
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                <button 
                  onClick={() => { setShowCourierModal(false); setCourierModalOrderId(null); }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Modal */}
        {showStatusModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900">Update Status</h3>
                <p className="text-sm text-slate-500">Change status for {selectedOrderIds.length} orders</p>
              </div>
              <div className="p-4 grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto">
                {STATUSES.map((status) => (
                  <button
                    key={status}
                    onClick={() => handleBulkStatusChange(status)}
                      className={`p-3 text-sm font-medium rounded-lg border transition-all text-center ${STATUS_COLORS[status] || 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                    >
                      {status}
                    </button>
                  ))}
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Order Modal */}
        {selectedOrder && draftOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-3 sm:p-4 lg:p-6 border-b border-slate-200 bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-slate-900">Edit Order</h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-xs font-mono font-medium">{selectedOrder.id.slice(-6)}</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">Update details, assign courier or check fraud risk</p>
                </div>
                <button onClick={closeOrderModal} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors">
                  <X size={24} className="" />
                </button>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                  {/* Left Column: Form Fields */}
                  <div className="lg:col-span-2 space-y-8">
                    {/* Customer Info Section */}
                    <div className="bg-slate-50/50 p-3 sm:p-4 lg:p-6 rounded-xl border border-slate-100">
                      <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <div className="w-1 h-5 bg-blue-600 rounded-full"></div> Customer Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="block space-y-1.5">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer Name</span>
                          <input 
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            value={draftOrder.customer} 
                            onChange={(e) => handleDraftChange('customer', e.target.value)}
                          />
                        </label>
                        <label className="block space-y-1.5">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</span>
                          <input 
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            value={draftOrder.phone || ''} 
                            onChange={(e) => handleDraftChange('phone', e.target.value)}
                          />
                        </label>
                        <label className="block space-y-1.5">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</span>
                          <input 
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            value={draftOrder.email || ''} 
                            onChange={(e) => handleDraftChange('email', e.target.value)}
                          />
                        </label>
                        <label className="block space-y-1.5">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Division</span>
                          <input 
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            value={draftOrder.division || ''} 
                            onChange={(e) => handleDraftChange('division', e.target.value)}
                          />
                        </label>
                      </div>
                      <label className="block space-y-1.5 mt-4">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Delivery Address</span>
                        <textarea
                          rows={2}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                          value={draftOrder.location} 
                          onChange={(e) => handleDraftChange('location', e.target.value)}
                        />
                      </label>
                    </div>

                    <div className="border-t border-slate-100" />

                    {/* Order Details Section */}
                    <div className="bg-slate-50/50 p-3 sm:p-4 lg:p-6 rounded-xl border border-slate-100">
                      <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <div className="w-1 h-5 bg-emerald-600 rounded-full"></div> Order Settings
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="block space-y-1.5">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount (BDT)</span>
                          <input type="number"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                            value={draftOrder.amount} 
                            onChange={(e) => handleDraftChange('amount', Number(e.target.value))}
                          />
                        </label>
                        <label className="block space-y-1.5">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Delivery Charge</span>
                          <input type="number"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                            value={draftOrder.deliveryCharge || 0} 
                            onChange={(e) => handleDraftChange('deliveryCharge', Number(e.target.value))}
                          />
                        </label>
                        <label className="block space-y-1.5">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</span>
                          <select 
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all appearance-none"
                            value={draftOrder.status} 
                            onChange={(e) => handleDraftChange('status', e.target.value as Order['status'])}
                          >
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </label>
                        <label className="block space-y-1.5">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Delivery Type</span>
                          <select 
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all appearance-none"
                            value={draftOrder.deliveryType || 'Regular'} 
                            onChange={(e) => handleDraftChange('deliveryType', e.target.value as Order['deliveryType'])}
                          >
                            <option value="Regular">Regular</option>
                            <option value="Express">Express</option>
                            <option value="Free">Free</option>
                          </select>
                        </label>
                        <label className="block space-y-1.5">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Courier Provider</span>
                          <select 
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all appearance-none"
                            value={draftOrder.courierProvider || ''} 
                            onChange={(e) => handleDraftChange('courierProvider', (e.target.value || undefined) as Order['courierProvider'])}
                          >
                            <option value="">Not Assigned</option>
                            <option value="Steadfast">Steadfast</option>
                            <option value="Pathao">Pathao</option>
                          </select>
                        </label>
                        <label className="block space-y-1.5">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tracking ID</span>
                          <input
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                            value={draftOrder.trackingId || ''}
                            onChange={(e) => handleDraftChange('trackingId', e.target.value)}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Payment Info Section - Show only if payment method is manual */}
                    {((draftOrder as Order & { paymentMethod?: string; transactionId?: string; customerPaymentPhone?: string }).paymentMethod || 
                      (draftOrder as Order & { paymentMethod?: string; transactionId?: string; customerPaymentPhone?: string }).transactionId) && (
                      <>
                        <div className="border-t border-slate-100" />
                        <div className="bg-amber-50/50 p-3 sm:p-4 lg:p-6 rounded-xl border border-amber-200">
                          <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <div className="w-1 h-5 bg-amber-500 rounded-full"></div> Payment Information
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment Method</span>
                              <p className="text-sm font-medium text-slate-900 bg-white px-3 py-2 rounded-lg border border-amber-200">
                                {(draftOrder as Order & { paymentMethod?: string }).paymentMethod || 'Cash On Delivery'}
                              </p>
                            </div>
                            {(draftOrder as Order & { transactionId?: string }).transactionId && (
                              <div className="space-y-1.5">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Transaction ID</span>
                                <p className="text-sm font-medium text-emerald-700 bg-white px-3 py-2 rounded-lg border border-emerald-200 flex items-center gap-2">
                                  <CheckCircle2 size={14} className="text-emerald-500" />
                                  {(draftOrder as Order & { transactionId?: string }).transactionId}
                                </p>
                              </div>
                            )}
                            {(draftOrder as Order & { customerPaymentPhone?: string }).customerPaymentPhone && (
                              <div className="space-y-1.5">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer Payment Phone</span>
                                <p className="text-sm font-medium text-slate-900 bg-white px-3 py-2 rounded-lg border border-slate-200">
                                  {(draftOrder as Order & { customerPaymentPhone?: string }).customerPaymentPhone}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Right Column: Cards & Actions */}
                  <div className="space-y-6">
                    {/* Snapshot Card */}
                    <div className="bg-slate-900 text-slate-300 p-3 sm:p-4 lg:p-6 rounded-xl shadow-lg">
                      <div className="flex items-center gap-2 mb-4 text-white font-semibold border-b border-slate-700 pb-2">
                        <Package2 size={18} /> Order Snapshot
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-3"><Mail size={16} className="text-slate-500" /> <span className="text-slate-200">{draftOrder.productName || 'Custom'}</span></div>
                        <div className="flex items-center gap-3"><AlertTriangle size={16} className="text-slate-500" /> <span>Qty: <span className="text-white font-medium">{draftOrder.quantity || 1}</span></span></div>
                        {draftOrder.variant && <div className="flex items-center gap-3"><CheckCircle2 size={16} className="text-slate-500" /> <span>{draftOrder.variant.color} / {draftOrder.variant.size}</span></div>}
                        <div className="flex items-center gap-3"><Truck size={16} className="text-slate-500" /> <span className="truncate">ID: {getCourierId(draftOrder) || 'Pending'}</span></div>
                      </div>
                    </div>

                    {/* Fraud Check Card */}
                    <div className="border border-slate-200 rounded-xl p-5 shadow-sm bg-white">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-bold text-slate-900">Fraud Check</p>
                          <p className="text-xs text-slate-500">Powered by Steadfast</p>
                        </div>
                        {fraudBadge && (
                          <div className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded border bg-slate-50 ${fraudBadge.color}`}>
                            {fraudBadge.icon}
                            <span className="uppercase">{fraudBadge.label}</span>
                          </div>
                        )}
                      </div>

                      {fraudResult && (
                        <div className="mb-4 p-3 bg-slate-50 rounded border border-slate-100 text-sm">
                          <p>Score: <span className="font-bold text-slate-900">{fraudResult.riskScore ?? 'N/A'}</span></p>
                          {fraudResult.remarks && <p className="text-slate-600 text-xs mt-1">{fraudResult.remarks}</p>}
                        </div>
                      )}

                      <button
                        onClick={() => handleFraudCheck(draftOrder)}
                        disabled={isFraudChecking}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors"
                      >
                        {isFraudChecking ? 'Checking...' : 'Run Analysis'}
                      </button>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Quick Actions</p>
                      {/* Steadfast Action */}
                      {draftOrder.courierProvider === 'Steadfast' && draftOrder.trackingId ? (
                        <div className="w-full p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                          <CheckCircle2 size={18} /> Sent to Steadfast
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSendToSteadfast(draftOrder)}
                            disabled={isSendingToSteadfast || !courierConfig.apiKey}
                            className="w-full p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                          >
                          {isSendingToSteadfast ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                          Send to Steadfast
                        </button>
                      )}

                      {/* Pathao Action */}
                      {draftOrder.courierProvider === 'Pathao' && draftOrder.trackingId ? (
                        <div className="w-full p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                          <CheckCircle2 size={18} /> Sent to Pathao
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSendToPathao(draftOrder)}
                            disabled={isSendingToPathao || !pathaoConfig?.apiKey}
                            className="w-full p-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                          >
                          {isSendingToPathao ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                          Send to Pathao
                        </button>
                      )}

                      <button
                        onClick={() => handlePrintInvoice(draftOrder)}
                        className="w-full p-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                      >
                        <Printer size={18} /> Print Invoice
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-200 bg-slate-50/50 flex justify-end gap-3">
                <button
                  onClick={closeOrderModal}
                  className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveOrder}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-70 flex items-center gap-2 transition-colors shadow-lg shadow-slate-900/10"
                >
                  {isSaving && <Loader2 size={18} className="animate-spin" />}
                  {isSaving ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    </div>
  );
};

export default AdminOrders;