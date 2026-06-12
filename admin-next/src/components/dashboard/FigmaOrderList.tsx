import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, MoreVertical, ChevronLeft, ChevronRight, X, Printer, Truck, Package2, Mail, AlertTriangle, CheckCircle2, Send, Loader2, Trash2, ShieldCheck, ShieldAlert, Copy, ZoomIn, Edit3, ArrowLeftCircle, Eye, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Order, CourierConfig, PathaoConfig, Product } from '../../types';
import { CourierService, FraudCheckResult } from '../../services/CourierService';
import { OrderService } from '../../services/OrderService';
import { normalizeImageUrl } from '../../utils/imageUrlHelper';
import { printInvoice } from '../InvoicePrintTemplate';
import {
  STATUS_COLORS,
  STATUS_LABELS,
  NORMAL_STATUSES,
  TERMINAL_STATUSES,
  formatCurrency,
  getCourierId,
  BD_LOCATIONS,
  Division,
} from './order/constants';
import OrderStatusBadge from './order/OrderStatusBadge';
import OrderStats from './order/OrderStats';
import OrderTabs from './order/OrderTabs';
import AddOrderModal, { NewOrderFormState } from './order/AddOrderModal';


interface FigmaOrderListProps {
  orders?: Order[];
  courierConfig?: CourierConfig;
  onUpdateOrder?: (orderId: string, updates: Partial<Order>) => void;
  onAddOrder?: () => void;
  products?: Product[];
  tenantId?: string;
  onNewOrder?: (order: Order) => void;
  initialSelectedOrderId?: string | null;
  onClearSelectedOrderId?: () => void;
  incomplete: () => void;  // new line
}

const FigmaOrderList: React.FC<FigmaOrderListProps> = ({
  orders: propOrders = [],
  courierConfig = { apiKey: '', secretKey: '', instruction: '' },
  onUpdateOrder,
  onAddOrder,
  products = [],
  tenantId: propTenantId,
  onNewOrder,
  initialSelectedOrderId,
  onClearSelectedOrderId
}) => {
  // Helper function to truncate text to 5 words
  const truncateToWords = (text: string | undefined, wordLimit: number = 5): string => {
    if (!text) return 'Custom Order';
    const words = text.trim().split(/\s+/);
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(' ') + '...';
  };
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Multi-select state
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [draftOrder, setDraftOrder] = useState<Order | null>(null);
  const [showCourierModal, setShowCourierModal] = useState(false);
  const [courierModalOrderId, setCourierModalOrderId] = useState<string | null>(null);
  const [detailsOrder, setDetailsOrder] = useState<Order | null>(null);
  const [showStatusMenu, setShowStatusMenu] = useState<string | null>(null);

  // Add Order Modal state
  const [showAddOrderModal, setShowAddOrderModal] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState<NewOrderFormState>({
    customer: '',
    phone: '',
    address: '',
    division: '',
    district: '',
    upazila: '',
    productId: '',
    quantity: 1,
    deliveryCharge: 0,
    discountType: 'none',
    discountValue: '',
    notes: '',
  });

  // Product search state
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [useManualAddress, setUseManualAddress] = useState(false);

  // Memoized upazila options to prevent unnecessary re-renders
  const upazilaOptions = useMemo(() => {
    if (!newOrderForm.division || !newOrderForm.district || useManualAddress) return [];
    
    const divisionData = BD_LOCATIONS[newOrderForm.division as Division];
    if (!divisionData) return [];
    
    return divisionData[newOrderForm.district] || [];
  }, [newOrderForm.division, newOrderForm.district, useManualAddress]);

  // Get tenant ID from props or localStorage
  const tenantId = propTenantId || localStorage.getItem('activeTenantId') || '';

  // Ensure products is always an array
  const safeProducts = Array.isArray(products) ? products : [];

  // Get selected product for Add Order modal
  const selectedProductForOrder = useMemo(() => {
    if (!newOrderForm.productId) return null;
    return safeProducts.find(p => String(p.id) === String(newOrderForm.productId)) || null;
  }, [newOrderForm.productId, safeProducts]);

  // Filtered products based on search
  const filteredProducts = useMemo(() => {
    if (!productSearchTerm.trim()) return safeProducts;
    const searchLower = productSearchTerm.toLowerCase();
    return safeProducts.filter(p => 
      (p.name || '').toLowerCase().includes(searchLower) ||
      (p.sku || '').toLowerCase().includes(searchLower)
    );
  }, [safeProducts, productSearchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.product-search-container')) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debug: Log products when modal opens
  useEffect(() => {
    if (showAddOrderModal) {
      console.log('[FigmaOrderList] Add Order Modal opened');
      console.log('[FigmaOrderList] products prop:', products);
      console.log('[FigmaOrderList] safeProducts:', safeProducts);
      console.log('[FigmaOrderList] products count:', safeProducts.length);
      console.log('[FigmaOrderList] tenantId:', tenantId);
    }
  }, [showAddOrderModal, products, safeProducts, tenantId]);

  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [isFraudChecking, setIsFraudChecking] = useState(false);
  const [isSendingToSteadfast, setIsSendingToSteadfast] = useState(false);
  const [isSendingToPathao, setIsSendingToPathao] = useState(false);
  const [fraudResult, setFraudResult] = useState<FraudCheckResult | null>(null);
  const [pathaoConfig, setPathaoConfig] = useState<PathaoConfig | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // Stores orderId being deleted
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const ordersPerPage = 8;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownId || showStatusMenu) {
        const target = event.target as HTMLElement;
        if (!target.closest('[data-dropdown]')) {
          setOpenDropdownId(null);
          setShowStatusMenu(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdownId, showStatusMenu]);

  // Load Pathao config
  useEffect(() => {
    const loadPathaoConfig = async () => {
      try {
        const tenantId = localStorage.getItem('activeTenantId') || '';
        if (!tenantId) return; // Don't call API without tenantId
        const config = await CourierService.loadPathaoConfig(tenantId);
        if (config) setPathaoConfig(config);
      } catch (e) { /* ignore */ }
    };
    loadPathaoConfig();
  }, []);

  // Handle initial selected order from notification click
  useEffect(() => {
    if (initialSelectedOrderId && propOrders.length > 0) {
      const orderToOpen = propOrders.find(o => o.id === initialSelectedOrderId);
      if (orderToOpen) {
        setDetailsOrder(orderToOpen);
        // Clear the selection so it doesn't reopen on re-render
        onClearSelectedOrderId?.();
      }
    }
  }, [initialSelectedOrderId, propOrders, onClearSelectedOrderId]);

  const orders = propOrders;

  // Filter orders based on tab
  const filteredOrders = useMemo(() => {
    let filtered = orders;
    
    if (activeTab !== 'all') {
      if (activeTab === 'pending') filtered = filtered.filter(o => o.status === 'Pending');
      else if (activeTab === 'delivered') filtered = filtered.filter(o => o.status === 'Delivered');
      else if (activeTab === 'canceled') filtered = filtered.filter(o => o.status === 'Cancelled');
      else if (activeTab === 'returned') filtered = filtered.filter(o => o.status === 'Return' || o.status === 'Returned Receive');
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(o => 
        o.id?.toLowerCase().includes(query) ||
        o.customer?.toLowerCase().includes(query) ||
        o.phone?.toLowerCase().includes(query) ||
        o.productName?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [orders, activeTab, searchQuery]);

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ordersPerPage;
    return filteredOrders.slice(start, start + ordersPerPage);
  }, [filteredOrders, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedOrders(new Set()); // Clear selection on tab/search change
  }, [activeTab, searchQuery]);

  // Order summary calculations
  const orderSummary = useMemo(() => {
    const total = orders.length || 1;
    const pending = orders.filter(o => o.status === 'Pending').length;
    const confirmed = orders.filter(o => o.status === 'Confirmed').length;
    const delivered = orders.filter(o => o.status === 'Delivered').length;
    const canceled = orders.filter(o => o.status === 'Cancelled').length;
    const returned = orders.filter(o => o.status === 'Return' || o.status === 'Returned Receive').length;
    const paidReturned = orders.filter(o => o.status === 'Refund').length;
    const incomplete = orders.filter(o => o.status === 'Incomplete').length;
    const onHold = orders.filter(o => o.status === 'On Hold').length;
    const processing = orders.filter(o => o.status === 'Processing').length;
    const shipped = orders.filter(o => o.status === 'Shipped').length;
    const sentToCourier = orders.filter(o => o.status === 'Sent to Courier').length;

    return {
      total,
      pending: { count: pending, percent: Math.round((pending / total) * 100) },
      confirmed: { count: confirmed, percent: Math.round((confirmed / total) * 100) },
      delivered: { count: delivered, percent: Math.round((delivered / total) * 100) },
      canceled: { count: canceled, percent: Math.round((canceled / total) * 100) },
      paidReturned: { count: paidReturned, percent: Math.round((paidReturned / total) * 100) },
      returned: { count: returned, percent: Math.round((returned / total) * 100) },
      incomplete: { count: incomplete, percent: Math.round((incomplete / total) * 100) },
      onHold: { count: onHold, percent: Math.round((onHold / total) * 100) },
      processing: { count: processing, percent: Math.round((processing / total) * 100) },
      shipped: { count: shipped, percent: Math.round((shipped / total) * 100) },
      sentToCourier: { count: sentToCourier, percent: Math.round((sentToCourier / total) * 100) }
    };
  }, [orders]);

  // Current month info
  const currentMonthDays = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  }, []);

  // Generate chart data from orders - grouped by day of current month (raw counts)
  const orderChartData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const ordersByDay: { [key: number]: number } = {};
    for (let i = 1; i <= daysInMonth; i++) ordersByDay[i] = 0;
    
    orders.forEach(order => {
      const orderDate = new Date(order.createdAt || order.date || '');
      if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
        const day = orderDate.getDate();
        ordersByDay[day] = (ordersByDay[day] || 0) + 1;
      }
    });
    
    return Object.entries(ordersByDay).map(([day, count]) => [parseInt(day), count]);
  }, [orders]);

  // Fetch visitor data for current month
  const [visitorChartData, setVisitorChartData] = useState<number[][]>([]);
  useEffect(() => {
    const fetchVisitors = async () => {
      try {
        const tid = tenantId || localStorage.getItem('activeTenantId') || '';
        if (!tid) return;
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '';
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const daysInMonth = new Date(year, now.getMonth() + 1, 0).getDate();
        const res = await fetch(`${apiBase}/api/visitors/${encodeURIComponent(tid)}/stats?month=${month}&year=${year}`);
        if (!res.ok) return;
        const data = await res.json();
        // Build per-day visitor counts from dailyStats
        const byDay: { [key: number]: number } = {};
        for (let i = 1; i <= daysInMonth; i++) byDay[i] = 0;
        if (Array.isArray(data.dailyStats)) {
          data.dailyStats.forEach((ds: any) => {
            const d = new Date(ds.date);
            byDay[d.getDate()] = ds.visitors || ds.views || 0;
          });
        }
        setVisitorChartData(Object.entries(byDay).map(([d, v]) => [parseInt(d), v]));
      } catch {}
    };
    fetchVisitors();
  }, [tenantId]);

  const tabCounts = useMemo(() => ({
    all: orders.length,
    pending: orders.filter(o => o.status === 'Pending').length,
    delivered: orders.filter(o => o.status === 'Delivered').length,
    canceled: orders.filter(o => o.status === 'Cancelled').length,
    returned: orders.filter(o => o.status === 'Return' || o.status === 'Returned Receive').length
  }), [orders]);

  const tabs = [
    { id: 'all', label: 'All order', count: tabCounts.all },
    { id: 'pending', label: 'Pending', count: tabCounts.pending },
    { id: 'delivered', label: 'Delivered', count: tabCounts.delivered },
    { id: 'canceled', label: 'Canceled', count: tabCounts.canceled },
    { id: 'returned', label: 'Returned', count: tabCounts.returned }
  ];

  // Modal handlers
  const openOrderModal = useCallback((order: Order) => {
    setSelectedOrder(order);
    setDraftOrder({ ...order });
    setFraudResult(null);
    setOpenDropdownId(null);
  }, []);

  const closeOrderModal = useCallback(() => {
    setSelectedOrder(null);
    setDraftOrder(null);
    setIsSaving(false);
    setIsFraudChecking(false);
    setFraudResult(null);
  }, []);

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

  const handleDraftChange = <K extends keyof Order>(field: K, value: Order[K]) => {
    setDraftOrder((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSaveOrder = async () => {
    if (!selectedOrder || !draftOrder || !onUpdateOrder) return;
    setIsSaving(true);
    try {
      const { id, ...updates } = draftOrder;
      onUpdateOrder(selectedOrder.id, updates);
      toast.success('Order updated');
      closeOrderModal();
    } catch (error) {
      toast.error('Unable to update order');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFraudCheck = async (order: Order) => {
    if (!courierConfig.apiKey || !courierConfig.secretKey) {
      toast.error('Please configure Steadfast API credentials first.');
      return;
    }
    setIsFraudChecking(true);
    try {
      const result = await CourierService.checkFraudRisk(order, courierConfig);
      setFraudResult(result);
      toast.success('Fraud check completed');
    } catch (error) {
      toast.error('Fraud check failed');
    } finally {
      setIsFraudChecking(false);
    }
  };

  const handleSendToSteadfast = async (order: Order) => {
    if (!courierConfig.apiKey || !courierConfig.secretKey) {
      toast.error('Configure Steadfast API in Courier Settings first.');
      return;
    }
    if (!order.phone) {
      toast.error('Customer phone is required.');
      return;
    }
    if (order.courierProvider === 'Steadfast' && order.trackingId) {
      toast.error('Already sent to Steadfast.');
      return;
    }

    setIsSendingToSteadfast(true);
    try {
      const result = await CourierService.sendToSteadfast(order, courierConfig);
      const updates: Partial<Order> = {
        trackingId: result.trackingId,
        courierProvider: 'Steadfast',
        courierMeta: result.response,
        status: 'Sent to Courier'
      };
      onUpdateOrder?.(order.id, updates);
      setDraftOrder((prev) => prev ? { ...prev, ...updates } : prev);
      toast.success(`Sent to Steadfast! Tracking: ${result.trackingId}`);
    } catch (error) {
      toast.error('Failed to send to Steadfast');
    } finally {
      setIsSendingToSteadfast(false);
    }
  };

  const handleSendToPathao = async (order: Order) => {
    if (!pathaoConfig?.apiKey) {
      toast.error('Configure Pathao API in Courier Settings first.');
      return;
    }
    if (!order.phone) {
      toast.error('Customer phone is required.');
      return;
    }
    if (order.courierProvider === 'Pathao' && order.trackingId) {
      toast.error('Already sent to Pathao.');
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
      onUpdateOrder?.(order.id, updates);
      setDraftOrder((prev) => prev ? { ...prev, ...updates } : prev);
      toast.success(`Sent to Pathao! Tracking: ${result.trackingId}`);
    } catch (error) {
      toast.error('Failed to send to Pathao');
    } finally {
      setIsSendingToPathao(false);
    }
  };

  const handlePrintInvoice = (order: Order) => {
    const courierId = getCourierId(order) || '';
    printInvoice({
      order,
      courierProvider: order.courierProvider || '',
      consignmentId: courierId,
      // Shop info can be passed from props or fetched from config
      shopName: 'Your Shop',
      shopWebsite: '',
      shopEmail: '',
      shopPhone: '',
      shopAddress: '',
    });
  };

  const handleDuplicateOrder = (order: Order) => {
    toast.success('Order duplicated (placeholder)');
    setOpenDropdownId(null);
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm('Delete this order? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(orderId);
    try {
      const result = await OrderService.deleteOrder(tenantId, orderId);
      
      if (result.success) {
        toast.success('Order deleted successfully');
        window.location.reload();
      } else {
        toast.error(`Failed to delete order: ${result.error}`);
        setIsDeleting(null);
      }
    } catch (error) {
      toast.error('Failed to delete order');
      setIsDeleting(null);
    }
    
    setOpenDropdownId(null);
  };

  const handleOpenDetails = (order: Order) => {
    setDetailsOrder(order);
    setOpenDropdownId(null);
  };

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    const result = await OrderService.updateStatus(tenantId, orderId, newStatus);
    
    if (result.success) {
      if (onUpdateOrder) {
        onUpdateOrder(orderId, { status: newStatus });
      }
      toast.success(`Status updated to ${newStatus}`);
    } else {
      toast.error(`Failed to update status: ${result.error}`);
    }
    
    setShowStatusMenu(null);
    setOpenDropdownId(null);
  };

  // Multi-select handlers
  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === paginatedOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(paginatedOrders.map(o => o.id)));
    }
  };

  const clearSelection = () => {
    setSelectedOrders(new Set());
  };

  // Bulk action handlers
  const handleBulkPrint = () => {
    const orders = paginatedOrders.filter(o => selectedOrders.has(o.id));
    orders.forEach(order => handlePrintInvoice(order));
    toast.success(`Printing ${orders.length} invoice(s)`);
    clearSelection();
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedOrders.size} selected orders? This action cannot be undone.`)) {
      return;
    }
    
    setIsBulkProcessing(true);
    try {
      const result = await OrderService.bulkDelete(tenantId, Array.from(selectedOrders));
      
      if (result.successCount > 0) {
        toast.success(`${result.successCount} order(s) deleted successfully`);
        window.location.reload();
      }
      if (result.failCount > 0) {
        toast.error(`Failed to delete ${result.failCount} order(s)`);
        setIsBulkProcessing(false);
      }
    } catch (error) {
      toast.error('Failed to delete orders');
      setIsBulkProcessing(false);
    }
    
    clearSelection();
  };

  const handleBulkStatusChange = async (newStatus: Order['status']) => {
    setIsBulkProcessing(true);
    try {
      const result = await OrderService.bulkUpdateStatus(tenantId, Array.from(selectedOrders), newStatus);
      
      if (result.successCount > 0) {
        // Update local state for successful updates
        result.results.forEach(r => {
          if (r.success && onUpdateOrder) {
            onUpdateOrder(r.orderId, { status: newStatus });
          }
        });
        toast.success(`${result.successCount} order(s) updated to ${newStatus}`);
      }
      if (result.failCount > 0) {
        toast.error(`Failed to update ${result.failCount} order(s)`);
      }
    } catch (error) {
      toast.error('Failed to update orders');
    }
    
    setIsBulkProcessing(false);
    clearSelection();
  };

  // Handle creating new order
  const handleCreateOrder = async () => {
    if (!newOrderForm.customer.trim() || !newOrderForm.phone.trim() || !newOrderForm.productId) {
      toast.error('Customer name, phone, and product are required');
      return;
    }

    // Use the memoized selected product
    if (!selectedProductForOrder) {
      toast.error('Please select a valid product');
      return;
    }

    setIsCreatingOrder(true);
    const orderId = `#${Math.floor(1000 + Math.random() * 9000)}`;
    const orderAmount = (selectedProductForOrder.price || 0) * newOrderForm.quantity;
    
    // Calculate discount
    let discountAmount = 0;
    // Convert the string to a number, fallback to 0 if it's empty or invalid
const parsedDiscountValue = Number(newOrderForm.discountValue) || 0;
    if (newOrderForm.discountType === 'percentage' && parsedDiscountValue > 0) {
      discountAmount = (orderAmount * parsedDiscountValue) / 100;
    } else if (newOrderForm.discountType === 'taka' && parsedDiscountValue > 0) {
      discountAmount = parsedDiscountValue;
    }
    
    const subtotalAfterDiscount = orderAmount - discountAmount;
    const totalAmount = subtotalAfterDiscount + newOrderForm.deliveryCharge;
    
    const newOrder: Order = {
      id: orderId,
      tenantId,
      customer: newOrderForm.customer.trim(),
      location: newOrderForm.address.trim(),
      phone: newOrderForm.phone.trim(),
      customerPhone: newOrderForm.phone.trim(),
      division: newOrderForm.division,
      district: newOrderForm.district,
      upazila: newOrderForm.upazila,
      amount: totalAmount,
      total: totalAmount,
      grandTotal: totalAmount,
      date: new Date().toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: 'Pending',
      productId: selectedProductForOrder.id,
      productName: selectedProductForOrder.name,
      productImage: selectedProductForOrder.image,
      quantity: newOrderForm.quantity,
      deliveryCharge: newOrderForm.deliveryCharge,
      discountType: newOrderForm.discountType,
      discountValue: typeof newOrderForm.discountValue === 'string' ? (newOrderForm.discountValue === '' ? 0 : parseFloat(newOrderForm.discountValue)) : newOrderForm.discountValue,
      discountAmount: Number(discountAmount),
      source: 'admin' as const,
      createdAt: new Date().toISOString(),
      items: [],
      weight: 0,
      pathaoArea: 0,
      pathaoZone: 0,
      pathaoCity: 0,
      sku: selectedProductForOrder.sku || ''
    };

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const response = await fetch(`${apiBase}/api/orders/${tenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });

      if (response.ok) {
        const result = await response.json();
        const createdOrder = result.data || newOrder;
        
        // Notify parent component
        if (onNewOrder) {
          onNewOrder(createdOrder);
        }
        
        toast.success(`Order ${orderId} created successfully!`);
        setShowAddOrderModal(false);
        setNewOrderForm({
          customer: '',
          phone: '',
          address: '',
          division: '',
          district: '',
          upazila: '',
          productId: '',
          quantity: 1,
          deliveryCharge: 0,
          discountType: 'none',
          discountValue: '',
          notes: ''
        });
        setProductSearchTerm('');
        setShowProductDropdown(false);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleAssignCourier = (orderId: string, courierName: string) => {
    if (!onUpdateOrder) return;
    onUpdateOrder(orderId, {
      courierProvider: courierName as Order['courierProvider'],
      status: 'Sent to Courier'
    });
    toast.success(`Courier assigned: ${courierName}`);
    setShowCourierModal(false);
    setCourierModalOrderId(null);
  };

  const getFraudBadge = (result: FraudCheckResult | null) => {
    if (!result) return null;
    const status = (result.status || '').toLowerCase();
    if (['pass', 'safe', 'low'].some(c => status.includes(c))) {
      return { label: result.status, color: 'text-emerald-600', icon: <ShieldCheck size={16} /> };
    }
    if (['review', 'medium', 'warn'].some(c => status.includes(c))) {
      return { label: result.status, color: 'text-amber-600', icon: <AlertTriangle size={16} /> };
    }
    return { label: result.status, color: 'text-rose-600', icon: <ShieldAlert size={16} /> };
  };

  const fraudBadge = getFraudBadge(fraudResult);

  const orderStatusData = [
    { label: "Pending", percentage: orderSummary.pending.percent, color: "#26007e", bgColor: "bg-[#26007e]" },
    { label: "Confirmed", percentage: orderSummary.confirmed.percent, color: "#7ad100", bgColor: "bg-[#7ad100]" },
    { label: "Delivered", percentage: orderSummary.delivered.percent, color: "#1883ff", bgColor: "bg-[#1883ff]" },
    { label: "Canceled", percentage: orderSummary.canceled.percent, color: "#fab300", bgColor: "bg-[#fab300]" },
    { label: "Paid Returned", percentage: orderSummary.paidReturned.percent, color: "#c71cb6", bgColor: "bg-[#c71cb6]" },
    { label: "Returned", percentage: orderSummary.returned.percent, color: "#da0000", bgColor: "bg-[#da0000]" },
    { label: "Incomplete", percentage: orderSummary.incomplete.percent, color: "#22abeb", bgColor: "bg-[#9ca3af]" },
    { label: "On Hold", percentage: orderSummary.onHold.percent, color: "#f59e0b", bgColor: "bg-[#f59e0b]" },
    { label: "Processing", percentage: orderSummary.processing.percent, color: "#06b6d4", bgColor: "bg-[#06b6d4]" },
    { label: "Shipped", percentage: orderSummary.shipped.percent, color: "#6366f1", bgColor: "bg-[#6366f1]" },
    { label: "Sent to Courier", percentage: orderSummary.sentToCourier.percent, color: "#a855f7", bgColor: "bg-[#a855f7]" },
  ];

  const getPaymentBadge = (order: Order) => {
    const method = (order as any).paymentMethod || '';
    const isPaid = method.match(/bKash|Nagad|Card|Paid/i);
    return isPaid ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600';
  };

  const COURIERS = [
    { id: 'steadfast', name: 'Steadfast', logo: '/icons/steadfast.png' },
    { id: 'pathao', name: 'Pathao', logo: '/icons/pathao.png' },
    { id: 'redx', name: 'RedX', logo: '/icons/redx.png' },
  ];
  const editModalFieldClass = 'w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl mx-1 xxs:mx-2 sm:mx-4 md:mx-6 p-2 xxs:p-3 sm:p-6 shadow-sm font-['Roboto']">
      {/* Header */}
      <div className="flex flex-col xxs:flex-row items-start xxs:items-center justify-between gap-2 xxs:gap-3 sm:gap-0 mb-4 xxs:mb-6">
        <h1 className="text-base xxs:text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Order List</h1>
        <button 
          onClick={() => setShowAddOrderModal(true)}
          className="flex items-center gap-1 xxs:gap-2 px-2 xxs:px-3 sm:px-4 py-1.5 xxs:py-2 bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-lg text-xs xxs:text-sm font-medium hover:from-sky-500 hover:to-blue-600 transition-all w-full xxs:w-auto justify-center"
        >
          <Plus className="w-3 h-3 xxs:w-4 xxs:h-4" />
          Add Order
        </button>
      </div>

      {/* Stats Row */}
      <OrderStats
        orders={orders}
        orderStatusData={orderStatusData}
        visitorChartData={visitorChartData}
        orderChartData={orderChartData}
        currentMonthDays={currentMonthDays}
      />

      {/* Tabs */}
      <OrderTabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Search */}
      <div className="flex flex-col xxs:flex-row flex-wrap gap-2 xxs:gap-3 mb-4 xxs:mb-6">
        <div className="flex-1 relative min-w-0">
          <Search className="absolute left-2 xxs:left-3 top-2.5 xxs:top-3 w-4 h-4 xxs:w-5 xxs:h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 xxs:pl-10 pr-3 xxs:pr-4 py-2 border border-gray-200 rounded-lg text-xs xxs:text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        {/* <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors self-end xxs:self-auto">
          <SlidersHorizontal className="w-4 h-4 xxs:w-5 xxs:h-5 text-gray-600" />
        </button> */}
      </div>

      {/* Bulk Action Toolbar */}
      {selectedOrders.size > 0 && (
        <div className="flex flex-col xxs:flex-row flex-wrap items-start xxs:items-center gap-2 xxs:gap-3 mb-3 xxs:mb-4 p-2 xxs:p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-xs xxs:text-sm font-medium text-blue-700">
            {selectedOrders.size} order{selectedOrders.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex flex-wrap items-center gap-1 xxs:gap-2 w-full xxs:w-auto xxs:ml-auto">
            <button
              onClick={handleBulkPrint}
              className="flex items-center gap-1 xxs:gap-1.5 px-2 xxs:px-3 py-1 xxs:py-1.5 bg-white border border-gray-200 rounded-md text-xs xxs:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Printer size={14} className="xxs:w-4 xxs:h-4" />
              <span className="hidden xxs:inline">Print</span>
            </button>
            <button
              onClick={() => handleBulkStatusChange('Confirmed')}
              disabled={isBulkProcessing}
              className="flex items-center gap-1 xxs:gap-1.5 px-2 xxs:px-3 py-1 xxs:py-1.5 bg-emerald-500 text-white rounded-md text-xs xxs:text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBulkProcessing ? <Loader2 size={14} className="animate-spin xxs:w-4 xxs:h-4" /> : <CheckCircle2 size={14} className="xxs:w-4 xxs:h-4" />}
              <span className="hidden xxs:inline">Confirm</span>
            </button>
            <button
              onClick={() => handleBulkStatusChange('Sent to Courier')}
              disabled={isBulkProcessing}
              className="flex items-center gap-1 xxs:gap-1.5 px-2 xxs:px-3 py-1 xxs:py-1.5 bg-purple-500 text-white rounded-md text-xs xxs:text-sm font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBulkProcessing ? <Loader2 size={14} className="animate-spin xxs:w-4 xxs:h-4" /> : <Send size={14} className="xxs:w-4 xxs:h-4" />}
              <span className="hidden xs:inline">Courier</span>
            </button>
            <button
              onClick={() => handleBulkStatusChange('Cancelled')}
              disabled={isBulkProcessing}
              className="flex items-center gap-1 xxs:gap-1.5 px-2 xxs:px-3 py-1 xxs:py-1.5 bg-orange-500 text-white rounded-md text-xs xxs:text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBulkProcessing ? <Loader2 size={14} className="animate-spin xxs:w-4 xxs:h-4" /> : <X size={14} className="xxs:w-4 xxs:h-4" />}
              <span className="hidden xxs:inline">Cancel</span>
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={isBulkProcessing}
              className="flex items-center gap-1 xxs:gap-1.5 px-2 xxs:px-3 py-1 xxs:py-1.5 bg-red-500 text-white rounded-md text-xs xxs:text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBulkProcessing ? <Loader2 size={14} className="animate-spin xxs:w-4 xxs:h-4" /> : <Trash2 size={14} className="xxs:w-4 xxs:h-4" />}
              <span className="hidden xxs:inline">Delete</span>
            </button>
            <button
              onClick={clearSelection}
              className="p-1 xxs:p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              <X size={16} className="xxs:w-[18px] xxs:h-[18px]" />
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className={`hidden sm:block -mx-2 xxs:mx-0 px-2 xxs:px-0 ${openDropdownId ? "overflow-visible" : "overflow-x-auto"}`}>
        <table className="w-full text-xs xxs:text-sm min-w-0">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-8 xxs:w-10 px-2 xxs:px-3 py-2 xxs:py-3">
                <input
                  type="checkbox"
                  checked={paginatedOrders.length > 0 && selectedOrders.size === paginatedOrders.length}
                  onChange={toggleSelectAll}
                  className="w-3 h-3 xxs:w-4 xxs:h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
              </th>
              <th className="w-20 xxs:w-24 px-2 xxs:px-3 py-2 xxs:py-3 text-left font-semibold text-gray-700">Order ID</th>
              <th className="w-32 xxs:w-44 px-2 xxs:px-3 py-2 xxs:py-3 text-left font-semibold text-gray-700">Product</th>
              <th className="w-32 xxs:w-40 px-2 xxs:px-3 py-2 xxs:py-3 text-left font-semibold text-gray-700">Customer</th>
              <th className="hidden sm:table-cell w-16 xxs:w-20 px-2 xxs:px-3 py-2 xxs:py-3 text-left font-semibold text-gray-700">Date</th>
              <th className="w-20 xxs:w-24 px-2 xxs:px-3 py-2 xxs:py-3 text-left font-semibold text-gray-700">Price</th>
              <th className="hidden sm:table-cell w-14 xxs:w-16 px-2 xxs:px-3 py-2 xxs:py-3 text-left font-semibold text-gray-700">Payment</th>
              <th className="w-24 xxs:w-32 px-2 xxs:px-3 py-2 xxs:py-3 text-left font-semibold text-gray-700">Status</th>
              <th className="w-10 xxs:w-12 px-2 xxs:px-3 py-2 xxs:py-3 text-center font-semibold text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedOrders.length > 0 ? paginatedOrders.map((order) => (
              <tr key={order.id} className={`hover:bg-gray-50 transition-colors ${selectedOrders.has(order.id) ? 'bg-blue-50' : ''}`}>
                <td className="px-2 xxs:px-3 py-2 xxs:py-3">
                  <input
                    type="checkbox"
                    checked={selectedOrders.has(order.id)}
                    onChange={() => toggleSelectOrder(order.id)}
                    className="w-3 h-3 xxs:w-4 xxs:h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                </td>
                <td className="px-2 xxs:px-3 py-2 xxs:py-3 font-medium text-gray-900 whitespace-nowrap text-[10px] xxs:text-sm">{order.id?.slice(-6)}</td>
                <td className="px-2 xxs:px-3 py-2 xxs:py-3">
                  <div className="flex items-center gap-1 xxs:gap-2 min-w-0">
                    {order.productImage ? (
                      <img src={normalizeImageUrl(order.productImage)} alt="" className="w-6 h-6 xxs:w-8 xxs:h-8 rounded object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-6 h-6 xxs:w-8 xxs:h-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Package2 size={12} className="text-gray-400 xxs:w-[14px] xxs:h-[14px]" />
                      </div>
                    )}
                    <span className="text-gray-700 truncate text-[10px] xxs:text-sm max-w-[80px] xxs:max-w-none" title={order.productName || 'Custom Order'}>{truncateToWords(order.productName)}</span>
                  </div>
                </td>
                <td className="px-2 xxs:px-3 py-2 xxs:py-3">
                  <div className="truncate text-gray-900 font-medium text-[10px] xxs:text-sm max-w-[80px] xxs:max-w-none" title={order.customer}>{order.customer}</div>
                  <div className="text-[9px] xxs:text-xs text-gray-500 truncate">{order.phone || 'No phone'}</div>
                </td>
                <td className="hidden sm:table-cell px-2 xxs:px-3 py-2 xxs:py-3 text-gray-700 whitespace-nowrap text-[10px] xxs:text-sm">
                  {order.date ? new Date(order.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '-'}
                </td>
                <td className="px-2 xxs:px-3 py-2 xxs:py-3 font-medium text-gray-900 whitespace-nowrap text-[10px] xxs:text-sm">{formatCurrency(order.amount)}</td>
                <td className="hidden sm:table-cell px-2 xxs:px-3 py-2 xxs:py-3">
                  <span className={`px-1.5 xxs:px-2 py-0.5 xxs:py-1 rounded text-[9px] xxs:text-xs font-medium whitespace-nowrap ${getPaymentBadge(order)}`}>
                    {(order as any).paymentMethod?.match(/bKash|Nagad|Card|Paid/i) ? 'Paid' : 'COD'}
                  </span>
                </td>
                <td className="px-2 xxs:px-3 py-2 xxs:py-3">
                  <div className="flex items-center gap-1 xxs:gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 xxs:w-5 xxs:h-5">
                      <path d="M4.25 3.75H13.5C14.4665 3.75 15.25 4.53351 15.25 5.5V6.88965H17.2041C17.7848 6.88978 18.3279 7.1782 18.6533 7.65918L21.1992 11.4238C21.395 11.7132 21.4999 12.0549 21.5 12.4043V17.25H22C22.1381 17.25 22.25 17.3619 22.25 17.5C22.25 17.6381 22.1381 17.75 22 17.75H19.6621L19.5869 18.1582C19.3651 19.3485 18.3198 20.2498 17.0654 20.25C15.8109 20.25 14.7657 19.3487 14.5439 18.1582L14.4678 17.75H9.91211L9.83691 18.1582C9.61515 19.3485 8.56978 20.2498 7.31543 20.25C6.06089 20.25 5.01579 19.3487 4.79395 18.1582L4.71777 17.75H4.25C3.28351 17.75 2.5 16.9665 2.5 16V5.5C2.5 4.5335 3.2835 3.75 4.25 3.75ZM7.31543 15.6201C6.17509 15.6201 5.25023 16.5443 5.25 17.6846C5.25 18.825 6.17495 19.75 7.31543 19.75C8.45571 19.7498 9.37988 18.8249 9.37988 17.6846C9.37965 16.5445 8.45557 15.6203 7.31543 15.6201ZM17.0654 15.6201C15.9251 15.6201 15.0002 16.5443 15 17.6846C15 18.825 15.925 19.75 17.0654 19.75C18.2057 19.7498 19.1299 18.8249 19.1299 17.6846C19.1297 16.5445 18.2055 15.6203 17.0654 15.6201ZM4.25 4.25C3.55965 4.25 3 4.80965 3 5.5V16C3 16.6903 3.55964 17.25 4.25 17.25H4.75977L4.87109 16.9023C5.20208 15.8679 6.17245 15.1201 7.31543 15.1201C8.45822 15.1203 9.42782 15.868 9.75879 16.9023L9.87012 17.25H14.5098L14.6211 16.9023C14.6466 16.8227 14.6762 16.7448 14.709 16.6689L14.75 16.5742V5.5C14.75 4.80964 14.1903 4.25 13.5 4.25H4.25ZM15.25 15.707L15.9648 15.3672C16.2977 15.2089 16.6707 15.1201 17.0654 15.1201C18.2082 15.1203 19.1779 15.8681 19.5088 16.9023L19.6201 17.25H21V12.1953H15.25V15.707ZM15.25 11.6953H20.7793L20.251 10.915L18.2393 7.93945C18.0068 7.5959 17.6189 7.38978 17.2041 7.38965H15.25V11.6953Z" stroke="#26007F"/>
                      <path d="M12 10C12 11.6569 10.6569 13 9 13C7.34315 13 6 11.6569 6 10C6 8.34315 7.34315 7 9 7C9.47068 7 9.91605 7.1084 10.3125 7.30159M11.4375 8.125L8.8125 10.75L8.0625 10" stroke="#26007F" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <OrderStatusBadge status={order.status} />
                  </div>
                </td>
                <td className="px-2 xxs:px-3 py-2 xxs:py-3 text-center relative">
                  <div className="relative" data-dropdown>
                    <button 
                      onClick={() => setOpenDropdownId(openDropdownId === order.id ? null : order.id)} 
                      className="p-0.5 xxs:p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <MoreVertical className="w-3 h-3 xxs:w-4 xxs:h-4 text-gray-600" />
                    </button>
                    {openDropdownId === order.id && (
                      <div className="absolute right-0 top-full mt-1 z-[99999]">
                        <div style={{ width: '160px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', overflow: 'visible', padding: '6px 0' }}>
                          {/* Edit */}
                          <button 
                            onClick={() => openOrderModal(order)}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', height: '40px', padding: '0 16px', backgroundColor: 'white', border: 'none', cursor: 'pointer', fontFamily: '"Lato", sans-serif', fontWeight: 600, fontSize: '14px', color: 'black', whiteSpace: 'nowrap' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                          >
                            <Edit3 size={18} className="text-gray-700" />
                            Edit
                          </button>
                          {/* Print Invoice */}
                          <button 
                            onClick={() => { handlePrintInvoice(order); setOpenDropdownId(null); }}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', height: '40px', padding: '0 16px', backgroundColor: 'white', border: 'none', cursor: 'pointer', fontFamily: '"Lato", sans-serif', fontWeight: 600, fontSize: '14px', color: 'black', whiteSpace: 'nowrap' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                          >
                            <Printer size={18} className="text-gray-700" />
                            Print
                          </button>
                          {/* Details - Highlighted */}
                          <button 
                            onClick={() => handleOpenDetails(order)}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', height: '40px', padding: '0 16px', backgroundColor: 'white', border: 'none', cursor: 'pointer', fontFamily: '"Lato", sans-serif', fontWeight: 600, fontSize: '14px', color: 'black', whiteSpace: 'nowrap' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                          >
                            <ZoomIn size={18} className="text-gray-700" />
                            Details
                          </button>
                          {/* Duplicate */}
                          <button 
                            onClick={() => handleDuplicateOrder(order)}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', height: '40px', padding: '0 16px', backgroundColor: 'white', border: 'none', cursor: 'pointer', fontFamily: '"Lato", sans-serif', fontWeight: 600, fontSize: '14px', color: 'black', whiteSpace: 'nowrap' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                          >
                            <Copy size={18} className="text-gray-700" />
                            Duplicate
                          </button>
                          {/* Order Status */}
                          <div style={{ position: 'relative' }}>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setShowStatusMenu(showStatusMenu === order.id ? null : order.id); }}
                              style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', height: '40px', padding: '0 16px', backgroundColor: 'white', border: 'none', cursor: 'pointer', fontFamily: '"Lato", sans-serif', fontWeight: 600, fontSize: '14px', color: 'black', whiteSpace: 'nowrap' }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                            >
                              <ArrowLeftCircle size={18} className="text-gray-700" />
                              Order Status
                            </button>
                            {showStatusMenu === order.id && (
                              <div style={{ position: 'absolute', right: '100%', top: '-50%', width: '180px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', padding: '8px 0', zIndex: 100, marginRight: '8px' }}>
                                {/* Normal statuses */}
                                {NORMAL_STATUSES.map(status => (
                                  <button
                                    key={status}
                                    onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, status); }}
                                    style={{ display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left', backgroundColor: order.status === status ? '#f0f0f0' : 'white', border: 'none', cursor: 'pointer', fontFamily: '"Lato", sans-serif', fontSize: '14px', color: 'black', whiteSpace: 'nowrap' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = order.status === status ? '#f0f0f0' : 'white'}
                                  >
                                    {STATUS_LABELS[status]}
                                  </button>
                                ))}
                                {/* Separator line */}
                                <div style={{ height: '1px', backgroundColor: '#e5e5e5', margin: '8px 0' }} />
                                {/* Terminal/negative statuses */}
                                {TERMINAL_STATUSES.map(status => (
                                  <button
                                    key={status}
                                    onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, status); }}
                                    style={{ display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left', backgroundColor: order.status === status ? '#f0f0f0' : 'white', border: 'none', cursor: 'pointer', fontFamily: '"Lato", sans-serif', fontSize: '14px', color: 'black', whiteSpace: 'nowrap' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = order.status === status ? '#f0f0f0' : 'white'}
                                  >
                                    {STATUS_LABELS[status]}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          {/* Delete */}
                          <button 
                            onClick={() => handleDeleteOrder(order.id)}
                            disabled={isDeleting === order.id}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', height: '40px', padding: '0 16px', backgroundColor: 'white', border: 'none', cursor: isDeleting === order.id ? 'wait' : 'pointer', fontFamily: '"Lato", sans-serif', fontWeight: 600, fontSize: '14px', color: '#da0000', whiteSpace: 'nowrap', opacity: isDeleting === order.id ? 0.7 : 1 }}
                            onMouseEnter={(e) => !isDeleting && (e.currentTarget.style.backgroundColor = '#f9f9f9')}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                          >
                            {isDeleting === order.id ? <Loader2 size={18} className="text-red-600 animate-spin" /> : <Trash2 size={18} className="text-red-600" />}
                            {isDeleting === order.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                  <Package2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No orders found</p>
                  <p className="text-sm">Try adjusting your search or filters</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="block sm:hidden space-y-2">
        {paginatedOrders.length > 0 ? paginatedOrders.map((order) => (
          <div key={order.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 active:scale-[0.99] transition-transform">
            <div className="flex items-start gap-3">
              {/* Checkbox + Image */}
              <div className="flex flex-col items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedOrders.has(order.id)}
                  onChange={() => toggleOrderSelection(order.id)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                {order.productImage ? (
                  <img src={normalizeImageUrl(order.productImage)} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <Package2 size={18} className="text-gray-400" />
                  </div>
                )}
              </div>
              {/* Details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{truncateToWords(order.productName)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">#{order.orderId || order.id?.slice(-6)}</p>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">{formatCurrency(order.amount)}</span>
                </div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-xs text-gray-600 dark:text-gray-300">{order.customer}</span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="text-xs text-gray-400">{order.date ? new Date(order.date).toLocaleDateString() : ''}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <OrderStatusBadge status={order.status} className="inline-block" />
                    <select
                      aria-label="Change order status"
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                      className="h-7 px-2 text-[11px] border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {NORMAL_STATUSES.map(status => (
                        <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                      ))}
                      {TERMINAL_STATUSES.map(status => (
                        <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => { openOrderModal(order); }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="View/Edit"
                    >
                      <Eye size={16} className="text-gray-500" />
                    </button>
                    <div className="relative" data-dropdown>
                      <button 
                        onClick={() => setOpenDropdownId(openDropdownId === order.id ? null : order.id)} 
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      </button>
                      {openDropdownId === order.id && (
                        <div className="absolute right-0 top-full mt-1 z-[99999] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 min-w-[140px]">
                          <button 
                            onClick={() => { openOrderModal(order); setOpenDropdownId(null); }}
                            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <Edit3 size={16} />
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Package2 size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-sm">No orders found</p>
          </div>
        )}
      </div>


      {/* Pagination */}
      {filteredOrders.length > ordersPerPage && (
        <div className="flex flex-col items-center mt-4 xxs:mt-6 pt-3 xxs:pt-4 border-t border-pink-200">
          <p className="text-xs xxs:text-sm text-gray-500 mb-2 xxs:mb-3">
            Showing {((currentPage - 1) * ordersPerPage) + 1} to {Math.min(currentPage * ordersPerPage, filteredOrders.length)} of {filteredOrders.length}
          </p>
          <div className="flex items-center gap-0.5 xxs:gap-1 sm:gap-2 flex-wrap justify-center">
            {/* Previous Button */}
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-0.5 xxs:gap-1 px-1.5 xxs:px-2 sm:px-3 py-1 xxs:py-1.5 sm:py-2 text-xs xxs:text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md sm:rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} className="xxs:w-4 xxs:h-4" />
              <span className="hidden xxs:inline">Prev</span>
            </button>
            
            {/* Page Numbers */}
            <div className="flex items-center gap-0.5 xxs:gap-1 sm:gap-2 mx-0.5 xxs:mx-1 sm:mx-2">
              {(() => {
                const pages: (number | string)[] = [];
                if (totalPages <= 5) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  // Always show first page
                  pages.push(1);
                  
                  if (currentPage <= 3) {
                    // Near start: 1 2 3 ... last
                    for (let i = 2; i <= 3; i++) pages.push(i);
                    pages.push('...');
                    pages.push(totalPages);
                  } else if (currentPage >= totalPages - 2) {
                    // Near end: 1 ... last-2 last-1 last
                    pages.push('...');
                    for (let i = totalPages - 2; i <= totalPages; i++) pages.push(i);
                  } else {
                    // Middle: 1 ... current ... last
                    pages.push('...');
                    pages.push(currentPage);
                    pages.push('...');
                    pages.push(totalPages);
                  }
                }
                
                return pages.map((page, idx) => (
                  page === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-1 xxs:px-2 py-1 text-gray-400 text-xs xxs:text-sm">...</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page as number)}
                      className={`min-w-[28px] xxs:min-w-[32px] sm:min-w-[36px] h-7 xxs:h-8 sm:h-9 px-1.5 xxs:px-2 sm:px-3 py-1 xxs:py-1.5 sm:py-2 text-xs xxs:text-sm font-medium rounded-md sm:rounded-lg border transition-all shadow-sm ${
                        currentPage === page 
                          ? 'bg-gradient-to-r from-sky-400 to-blue-500 text-white border-transparent hover:opacity-90' 
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  )
                ));
              })()}
            </div>
            
            {/* Next Button */}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-0.5 xxs:gap-1 px-1.5 xxs:px-2 sm:px-3 py-1 xxs:py-1.5 sm:py-2 text-xs xxs:text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md sm:rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="hidden xxs:inline">Next</span>
              <ChevronRight size={14} className="xxs:w-4 xxs:h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Courier Selection Modal */}
      {showCourierModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Select Courier</h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Choose a delivery partner</p>
            </div>
            <div className="p-2">
              {COURIERS.map((courier) => (
                <button
                  key={courier.id}
                  onClick={() => courierModalOrderId && handleAssignCourier(courierModalOrderId, courier.name)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-white border flex items-center justify-center">
                      <Truck size={20} className="text-gray-400" />
                    </div>
                    <span className="font-medium text-gray-900">{courier.name}</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </button>
              ))}
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button 
                onClick={() => { setShowCourierModal(false); setCourierModalOrderId(null); }}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {selectedOrder && draftOrder && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-5xl h-[95vh] sm:h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-3 sm:p-4 lg:p-5 border-b bg-gray-50 dark:bg-gray-900 flex-shrink-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 sm:gap-3">
                  <h2 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white">Edit Order</h2>
                  <span className="px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px] sm:text-xs font-mono">{selectedOrder.id?.slice(-6)}</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1 hidden xs:block">Update order details and send to courier</p>
              </div>
              <button onClick={closeOrderModal} className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full flex-shrink-0">
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5 xl:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 xl:gap-8">
                {/* Left: Form Fields */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Customer Info */}
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 lg:p-4 xl:p-5 rounded-xl border border-gray-200 dark:border-gray-700">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                      <div className="w-1 h-5 bg-blue-600 rounded-full"></div> Customer Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="block space-y-1.5">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Customer Name</span>
                        <input 
                          className={editModalFieldClass}
                          value={draftOrder.customer} 
                          onChange={(e) => handleDraftChange('customer', e.target.value)}
                        />
                      </label>
                      <label className="block space-y-1.5">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Phone</span>
                        <input 
                          className={editModalFieldClass}
                          value={draftOrder.phone || ''} 
                          onChange={(e) => handleDraftChange('phone', e.target.value)}
                          maxLength={13}
                        />
                      </label>
                      <label className="block space-y-1.5">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Email</span>
                        <input 
                          className={editModalFieldClass}
                          value={draftOrder.email || ''} 
                          onChange={(e) => handleDraftChange('email', e.target.value)}
                        />
                      </label>
                      <label className="block space-y-1.5">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Division</span>
                        <input 
                          className={editModalFieldClass}
                          value={draftOrder.division || ''} 
                          onChange={(e) => handleDraftChange('division', e.target.value)}
                        />
                      </label>
                    </div>
                    <label className="block space-y-1.5 mt-4">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Delivery Address</span>
                      <textarea
                        rows={2}
                        className={`${editModalFieldClass} resize-none`}
                        value={draftOrder.location} 
                        onChange={(e) => handleDraftChange('location', e.target.value)}
                      />
                    </label>
                  </div>

                  {/* Order Settings */}
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 lg:p-4 xl:p-5 rounded-xl border border-gray-200 dark:border-gray-700">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                      <div className="w-1 h-5 bg-emerald-600 rounded-full"></div> Order Settings
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="block space-y-1.5">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Amount (BDT)</span>
                        <input 
                          type="number"
                          className={editModalFieldClass}
                          value={draftOrder.amount} 
                          onChange={(e) => handleDraftChange('amount', Number(e.target.value))}
                        />
                      </label>
                      <label className="block space-y-1.5">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Delivery Charge</span>
                        <input 
                          type="number"
                          className={editModalFieldClass}
                          value={draftOrder.deliveryCharge || 0} 
                          onChange={(e) => handleDraftChange('deliveryCharge', Number(e.target.value))}
                        />
                      </label>
                      <label className="block space-y-1.5">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</span>
                        <select 
                          className={editModalFieldClass}
                          value={draftOrder.status} 
                          onChange={(e) => handleDraftChange('status', e.target.value as Order['status'])}
                        >
                          <optgroup label="Order Flow">
                            {NORMAL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                          </optgroup>
                          <optgroup label="Terminal">
                            {TERMINAL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                          </optgroup>
                        </select>
                      </label>
                      <label className="block space-y-1.5">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Courier Provider</span>
                        <select 
                          className={editModalFieldClass}
                          value={draftOrder.courierProvider || ''} 
                          onChange={(e) => handleDraftChange('courierProvider', (e.target.value || undefined) as Order['courierProvider'])}
                        >
                          <option value="">Not Assigned</option>
                          <option value="Steadfast">Steadfast</option>
                          <option value="Pathao">Pathao</option>
                        </select>
                      </label>
                      <label className="block space-y-1.5">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Tracking ID</span>
                        <input
                          className={editModalFieldClass}
                          value={draftOrder.trackingId || ''}
                          onChange={(e) => handleDraftChange('trackingId', e.target.value)}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="space-y-6">
                  {/* Order Snapshot */}
                  <div className="bg-gray-900 text-gray-300 p-3 sm:p-4 lg:p-4 xl:p-5 rounded-xl">
                    <div className="flex items-center gap-2 mb-4 text-white font-semibold border-b border-gray-700 pb-2">
                      <Package2 size={18} /> Order Snapshot
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3"><Mail size={16} className="text-gray-500" /> <span className="text-gray-200">{draftOrder.productName || 'Custom'}</span></div>
                      <div className="flex items-center gap-3"><AlertTriangle size={16} className="text-gray-500" /> <span>Qty: <span className="text-white font-medium">{draftOrder.quantity || 1}</span></span></div>
                      <div className="flex items-center gap-3"><Truck size={16} className="text-gray-500" /> <span className="truncate">ID: {getCourierId(draftOrder) || 'Pending'}</span></div>
                    </div>
                  </div>

                  {/* Fraud Check Card */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-white dark:bg-gray-900">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-bold text-gray-900 dark:text-gray-100">Fraud Check</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Powered by Steadfast</p>
                      </div>
                      {fraudBadge && (
                        <div className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded border bg-gray-50 ${fraudBadge.color}`}>
                          {fraudBadge.icon}
                          <span className="uppercase">{fraudBadge.label}</span>
                        </div>
                      )}
                    </div>
                    {fraudResult && (
                      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm text-gray-800 dark:text-gray-200">
                        <p>Score: <span className="font-bold">{fraudResult.riskScore ?? 'N/A'}</span></p>
                        {fraudResult.remarks && <p className="text-gray-600 dark:text-gray-300 text-xs mt-1">{fraudResult.remarks}</p>}
                      </div>
                    )}
                    <button
                      onClick={() => handleFraudCheck(draftOrder)}
                      disabled={isFraudChecking}
                      className="w-full py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-100 rounded-lg text-xs font-bold uppercase"
                    >
                      {isFraudChecking ? 'Checking...' : 'Run Analysis'}
                    </button>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider ml-1">Quick Actions</p>
                    
                    {draftOrder.courierProvider === 'Steadfast' && draftOrder.trackingId ? (
                      <div className="w-full p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                        <CheckCircle2 size={18} /> Sent to Steadfast
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSendToSteadfast(draftOrder)}
                        disabled={isSendingToSteadfast || !courierConfig.apiKey}
                        className="w-full p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-300 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                      >
                        {isSendingToSteadfast ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        Send to Steadfast
                      </button>
                    )}

                    {draftOrder.courierProvider === 'Pathao' && draftOrder.trackingId ? (
                      <div className="w-full p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                        <CheckCircle2 size={18} /> Sent to Pathao
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSendToPathao(draftOrder)}
                        disabled={isSendingToPathao || !pathaoConfig?.apiKey}
                        className="w-full p-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-300 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                      >
                        {isSendingToPathao ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        Send to Pathao
                      </button>
                    )}

                    <button
                      onClick={() => handlePrintInvoice(draftOrder)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <Printer size={18} /> Print Invoice
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end gap-3">
              <button onClick={closeOrderModal} className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-100 font-medium hover:bg-gray-50 dark:hover:bg-gray-700">
                Cancel
              </button>
              <button
                onClick={handleSaveOrder}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 disabled:opacity-70 flex items-center gap-2"
              >
                {isSaving && <Loader2 size={18} className="animate-spin" />}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {detailsOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', width: '100%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e5e5e5', backgroundColor: '#f9fafb' }}>
              <div>
                <h2 style={{ fontFamily: '"Lato", sans-serif', fontWeight: 700, fontSize: '20px', color: '#111827', margin: 0 }}>Order Details</h2>
                <p style={{ fontFamily: '"Lato", sans-serif', fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Order {detailsOrder.id?.slice(-6)}</p>
              </div>
              <button 
                onClick={() => setDetailsOrder(null)} 
                style={{ padding: '8px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '8px' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X size={24} color="#6b7280" />
              </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {/* Status Badge */}
              <div style={{ marginBottom: '24px' }}>
                <OrderStatusBadge status={detailsOrder.status} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold" />
              </div>

              {/* Customer Info */}
              <div style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
                <h3 style={{ fontFamily: '"Lato", sans-serif', fontWeight: 700, fontSize: '14px', color: '#374151', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '4px', height: '20px', backgroundColor: '#3b82f6', borderRadius: '2px' }}></div>
                  Customer Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div>
                    <p style={{ fontFamily: '"Lato", sans-serif', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '4px' }}>Name</p>
                    <p style={{ fontFamily: '"Lato", sans-serif', fontSize: '15px', color: '#111827', fontWeight: 500 }}>{detailsOrder.customer || 'N/A'}</p>
                  </div>
                  <div>
                    <p style={{ fontFamily: '"Lato", sans-serif', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '4px' }}>Phone</p>
                    <p style={{ fontFamily: '"Lato", sans-serif', fontSize: '15px', color: '#111827', fontWeight: 500 }}>{detailsOrder.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p style={{ fontFamily: '"Lato", sans-serif', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '4px' }}>Email</p>
                    <p style={{ fontFamily: '"Lato", sans-serif', fontSize: '15px', color: '#111827', fontWeight: 500 }}>{detailsOrder.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p style={{ fontFamily: '"Lato", sans-serif', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '4px' }}>Division</p>
                    <p style={{ fontFamily: '"Lato", sans-serif', fontSize: '15px', color: '#111827', fontWeight: 500 }}>{detailsOrder.division || 'N/A'}</p>
                  </div>
                </div>
                <div style={{ marginTop: '16px' }}>
                  <p style={{ fontFamily: '"Lato", sans-serif', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '4px' }}>Delivery Address</p>
                  <p style={{ fontFamily: '"Lato", sans-serif', fontSize: '15px', color: '#111827', fontWeight: 500 }}>{detailsOrder.location || 'N/A'}</p>
                </div>
              </div>

              {/* Product Info */}
              <div style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
                <h3 style={{ fontFamily: '"Lato", sans-serif', fontWeight: 700, fontSize: '14px', color: '#374151', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '4px', height: '20px', backgroundColor: '#10b981', borderRadius: '2px' }}></div>
                  Product Details
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {detailsOrder.productImage && (
                    <img 
                      src={normalizeImageUrl(detailsOrder.productImage)} 
                      alt={detailsOrder.productName} 
                      style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e5e7eb' }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: '"Lato", sans-serif', fontSize: '14px', fontWeight: 600, color: '#111827' }}>{detailsOrder.productName || 'N/A'}</p>
                    <p style={{ fontFamily: '"Lato", sans-serif', fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Qty: {detailsOrder.quantity || 1}</p>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '20px' }}>
                <h3 style={{ fontFamily: '"Lato", sans-serif', fontWeight: 700, fontSize: '14px', color: '#374151', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '4px', height: '20px', backgroundColor: '#f59e0b', borderRadius: '2px' }}></div>
                  Order Summary
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: '"Lato", sans-serif', fontSize: '14px', color: '#6b7280' }}>Subtotal</span>
                    <span style={{ fontFamily: '"Lato", sans-serif', fontSize: '15px', fontWeight: 600, color: '#111827' }}>{formatCurrency(detailsOrder.amount || 0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: '"Lato", sans-serif', fontSize: '14px', color: '#6b7280' }}>Delivery Charge</span>
                    <span style={{ fontFamily: '"Lato", sans-serif', fontSize: '15px', fontWeight: 600, color: '#111827' }}>{formatCurrency(detailsOrder.deliveryCharge || 0)}</span>
                  </div>
                  <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: '"Lato", sans-serif', fontSize: '14px', fontWeight: 700, color: '#111827' }}>Total</span>
                    <span style={{ fontFamily: '"Lato", sans-serif', fontSize: '18px', fontWeight: 700, color: '#059669' }}>{formatCurrency((detailsOrder.amount || 0) + (detailsOrder.deliveryCharge || 0))}</span>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              {((detailsOrder as any).paymentMethod || (detailsOrder as any).transactionId || (detailsOrder as any).customerPaymentPhone) && (
                <div style={{ backgroundColor: '#fffbeb', borderRadius: '12px', padding: '20px', marginTop: '16px', border: '1px solid #fde68a' }}>
                  <h3 style={{ fontFamily: '"Lato", sans-serif', fontWeight: 700, fontSize: '14px', color: '#374151', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '4px', height: '20px', backgroundColor: '#f59e0b', borderRadius: '2px' }}></div>
                    Payment Information
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    {(detailsOrder as any).paymentMethod && (
                      <div>
                        <p style={{ fontFamily: '"Lato", sans-serif', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '4px' }}>Payment Method</p>
                        <p style={{ fontFamily: '"Lato", sans-serif', fontSize: '15px', color: '#111827', fontWeight: 500 }}>{(detailsOrder as any).paymentMethod}</p>
                      </div>
                    )}
                    {(detailsOrder as any).customerPaymentPhone && (
                      <div>
                        <p style={{ fontFamily: '"Lato", sans-serif', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '4px' }}>Payment Number</p>
                        <p style={{ fontFamily: '"Lato", sans-serif', fontSize: '15px', color: '#111827', fontWeight: 500 }}>{(detailsOrder as any).customerPaymentPhone}</p>
                      </div>
                    )}
                    {(detailsOrder as any).transactionId && (
                      <div style={{ gridColumn: 'span 2' }}>
                        <p style={{ fontFamily: '"Lato", sans-serif', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '4px' }}>Transaction ID</p>
                        <p style={{ fontFamily: '"Lato", sans-serif', fontSize: '15px', color: '#059669', fontWeight: 600, backgroundColor: '#d1fae5', padding: '8px 12px', borderRadius: '8px', display: 'inline-block' }}>{(detailsOrder as any).transactionId}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Courier Info if available */}
              {detailsOrder.courierProvider && (
                <div style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '20px', marginTop: '16px' }}>
                  <h3 style={{ fontFamily: '"Lato", sans-serif', fontWeight: 700, fontSize: '14px', color: '#374151', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '4px', height: '20px', backgroundColor: '#8b5cf6', borderRadius: '2px' }}></div>
                    Courier Information
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <p style={{ fontFamily: '"Lato", sans-serif', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '4px' }}>Provider</p>
                      <p style={{ fontFamily: '"Lato", sans-serif', fontSize: '15px', color: '#111827', fontWeight: 500 }}>{detailsOrder.courierProvider}</p>
                    </div>
                    <div>
                      <p style={{ fontFamily: '"Lato", sans-serif', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '4px' }}>Tracking ID</p>
                      <p style={{ fontFamily: '"Lato", sans-serif', fontSize: '15px', color: '#111827', fontWeight: 500 }}>{getCourierId(detailsOrder) || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e5e5', backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => { handlePrintInvoice(detailsOrder); }}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontFamily: '"Lato", sans-serif', fontWeight: 600, fontSize: '14px', color: '#374151' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                <Printer size={18} />
                Print Invoice
              </button>
              <button
                onClick={() => { setDetailsOrder(null); openOrderModal(detailsOrder); }}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px', backgroundColor: '#111827', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: '"Lato", sans-serif', fontWeight: 600, fontSize: '14px', color: 'white' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1f2937'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#111827'}
              >
                <Edit3 size={18} />
                Edit Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Order Modal */}
      <AddOrderModal
        showAddOrderModal={showAddOrderModal}
        setShowAddOrderModal={setShowAddOrderModal}
        isCreatingOrder={isCreatingOrder}
        newOrderForm={newOrderForm}
        setNewOrderForm={setNewOrderForm}
        productSearchTerm={productSearchTerm}
        setProductSearchTerm={setProductSearchTerm}
        showProductDropdown={showProductDropdown}
        setShowProductDropdown={setShowProductDropdown}
        useManualAddress={useManualAddress}
        setUseManualAddress={setUseManualAddress}
        upazilaOptions={upazilaOptions}
        selectedProductForOrder={selectedProductForOrder}
        filteredProducts={filteredProducts}
        safeProducts={safeProducts}
        handleCreateOrder={handleCreateOrder}
      />
    </div>
  );
};

export default FigmaOrderList;
