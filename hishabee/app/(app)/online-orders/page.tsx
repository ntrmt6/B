'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShoppingBag, Package, RotateCcw, RefreshCw, CheckCircle, Clock, XCircle, Truck, Search, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchBOPISOrders, updateBOPISStatus,
  fetchReturns, createReturn, processReturn,
  BOPISOrder, ReturnRequest,
} from '@/lib/services/pos';
import { fetchOrders, Order } from '@/lib/services/orders';

type TabView = 'bopis' | 'returns';

const CRYSTAL_ORANGE = '#FF8A00';
const CRYSTAL_BLUE = '#1E90FF';

const BOPIS_STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending_pickup: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: <Clock size={14} /> },
  ready_for_pickup: { label: 'Ready', color: 'bg-blue-100 text-blue-700', icon: <Package size={14} /> },
  picked_up: { label: 'Picked Up', color: 'bg-green-100 text-green-700', icon: <CheckCircle size={14} /> },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: <XCircle size={14} /> },
};

const RETURN_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Approved', color: 'bg-blue-100 text-blue-700' },
  processed: { label: 'Processed', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
};

export default function OnlineOrdersPage() {
  const { user } = useAuth();
  const tenantId = user?.tenantId || '';

  const [tab, setTab] = useState<TabView>('bopis');
  const [loading, setLoading] = useState(true);
  const [bopisOrders, setBopisOrders] = useState<BOPISOrder[]>([]);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');

  // Return form
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [retOrderId, setRetOrderId] = useState('');
  const [retCustomer, setRetCustomer] = useState('');
  const [retPhone, setRetPhone] = useState('');
  const [retProductName, setRetProductName] = useState('');
  const [retQuantity, setRetQuantity] = useState('1');
  const [retReason, setRetReason] = useState('');
  const [retRefundAmount, setRetRefundAmount] = useState('');
  const [retRefundMethod, setRetRefundMethod] = useState<'cash' | 'original_gateway' | 'store_credit'>('cash');

  const loadData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const [b, r, o] = await Promise.allSettled([
        fetchBOPISOrders(tenantId),
        fetchReturns(tenantId),
        fetchOrders(tenantId),
      ]);
      if (b.status === 'fulfilled') setBopisOrders(b.value);
      if (r.status === 'fulfilled') setReturns(r.value);
      if (o.status === 'fulfilled') setOrders(o.value.orders);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleBOPISStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateBOPISStatus(tenantId, orderId, { status: newStatus });
      toast.success('Status updated');
      loadData();
    } catch { toast.error('Failed to update status'); }
  };

  const handleCreateReturn = async () => {
    if (!retOrderId || !retCustomer || !retProductName || !retRefundAmount) {
      return toast.error('Please fill all required fields');
    }
    try {
      await createReturn(tenantId, {
        originalOrderId: retOrderId,
        customerName: retCustomer,
        customerPhone: retPhone,
        items: [{ productId: '', productName: retProductName, quantity: Number(retQuantity), returnReason: retReason }],
        refundAmount: Number(retRefundAmount),
        refundMethod: retRefundMethod,
        source: 'pos',
      });
      toast.success('Return request created');
      setShowReturnForm(false);
      setRetOrderId(''); setRetCustomer(''); setRetPhone(''); setRetProductName('');
      setRetQuantity('1'); setRetReason(''); setRetRefundAmount('');
      loadData();
    } catch { toast.error('Failed to create return'); }
  };

  const handleProcessReturn = async (id: string, status: string) => {
    try {
      await processReturn(tenantId, id, { status });
      toast.success(`Return ${status}`);
      loadData();
    } catch { toast.error('Failed to process return'); }
  };

  const filteredBopis = bopisOrders.filter((o) =>
    o.customerName.toLowerCase().includes(search.toLowerCase()) ||
    o.orderId.toLowerCase().includes(search.toLowerCase())
  );

  const filteredReturns = returns.filter((r) =>
    r.customerName.toLowerCase().includes(search.toLowerCase()) ||
    r.originalOrderId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Truck size={22} style={{ color: CRYSTAL_BLUE }} />
            Online Orders & Returns
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">BOPIS management and in-store return processing</p>
        </div>
        <button onClick={loadData} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <RefreshCw size={18} className={loading ? 'animate-spin text-gray-400' : 'text-gray-500'} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('bopis')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'bopis' ? 'text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600'
          }`}
          style={tab === 'bopis' ? { background: CRYSTAL_BLUE } : {}}
        >
          <ShoppingBag size={16} />
          BOPIS ({bopisOrders.filter((o) => o.status !== 'picked_up' && o.status !== 'cancelled').length})
        </button>
        <button
          onClick={() => setTab('returns')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'returns' ? 'text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600'
          }`}
          style={tab === 'returns' ? { background: CRYSTAL_ORANGE } : {}}
        >
          <RotateCcw size={16} />
          Returns ({returns.filter((r) => r.status === 'pending').length})
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by customer or order ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {loading && (
        <div className="text-center py-12">
          <RefreshCw size={24} className="animate-spin mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      )}

      {/* ─── BOPIS Tab ─── */}
      {!loading && tab === 'bopis' && (
        <div>
          {filteredBopis.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <ShoppingBag size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No BOPIS orders. Online pickup orders will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBopis.map((order) => {
                const status = BOPIS_STATUS_MAP[order.status];
                return (
                  <div key={order.orderId} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-bold text-gray-800 dark:text-white">{order.customerName}</p>
                        <p className="text-xs text-gray-400">Order {order.orderId} • {order.customerPhone || 'No phone'}</p>
                      </div>
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status?.color}`}>
                        {status?.icon}
                        {status?.label}
                      </span>
                    </div>

                    <div className="mb-2">
                      {order.items.map((item, i) => (
                        <p key={i} className="text-xs text-gray-500">• {item.productName} × {item.quantity}</p>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                      <span>Branch: {order.branchId}</span>
                      {order.readyAt && <span>• Ready: {new Date(order.readyAt).toLocaleTimeString()}</span>}
                      {order.pickedUpAt && <span>• Picked up: {new Date(order.pickedUpAt).toLocaleTimeString()}</span>}
                    </div>

                    {/* Action buttons based on current status */}
                    <div className="flex gap-2">
                      {order.status === 'pending_pickup' && (
                        <button
                          onClick={() => handleBOPISStatusChange(order.orderId, 'ready_for_pickup')}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white rounded-lg"
                          style={{ background: CRYSTAL_BLUE }}
                        >
                          <Package size={12} /> Mark Ready
                        </button>
                      )}
                      {order.status === 'ready_for_pickup' && (
                        <button
                          onClick={() => handleBOPISStatusChange(order.orderId, 'picked_up')}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white rounded-lg"
                          style={{ background: '#22C55E' }}
                        >
                          <CheckCircle size={12} /> Mark Picked Up
                        </button>
                      )}
                      {(order.status === 'pending_pickup' || order.status === 'ready_for_pickup') && (
                        <button
                          onClick={() => handleBOPISStatusChange(order.orderId, 'cancelled')}
                          className="px-3 py-1.5 text-xs font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Returns Tab ─── */}
      {!loading && tab === 'returns' && (
        <div>
          <div className="flex justify-end mb-3">
            <button
              onClick={() => setShowReturnForm(!showReturnForm)}
              className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-white rounded-lg"
              style={{ background: CRYSTAL_ORANGE }}
            >
              <RotateCcw size={14} /> New Return
            </button>
          </div>

          {/* Return Form */}
          {showReturnForm && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 border border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-bold mb-3">Create Return</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                <select value={retOrderId} onChange={(e) => {
                  setRetOrderId(e.target.value);
                  const order = orders.find((o) => o.orderId === e.target.value || String(o._id) === e.target.value);
                  if (order) {
                    setRetCustomer(order.customerName || '');
                    setRetPhone(order.customerPhone || '');
                    setRetRefundAmount(String(order.total || order.grandTotal || 0));
                  }
                }} className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                  <option value="">Select Original Order</option>
                  {orders.map((o) => <option key={o._id || o.orderId} value={o.orderId || o._id}>{o.orderId || o._id} - {o.customerName}</option>)}
                </select>
                <input type="text" placeholder="Customer Name" value={retCustomer} onChange={(e) => setRetCustomer(e.target.value)} className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                <input type="text" placeholder="Phone" value={retPhone} onChange={(e) => setRetPhone(e.target.value)} className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                <input type="text" placeholder="Product Name" value={retProductName} onChange={(e) => setRetProductName(e.target.value)} className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                <input type="number" placeholder="Quantity" value={retQuantity} onChange={(e) => setRetQuantity(e.target.value)} className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                <input type="text" placeholder="Return Reason" value={retReason} onChange={(e) => setRetReason(e.target.value)} className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                <input type="number" placeholder="Refund Amount (৳)" value={retRefundAmount} onChange={(e) => setRetRefundAmount(e.target.value)} className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                <select value={retRefundMethod} onChange={(e) => setRetRefundMethod(e.target.value as 'cash' | 'original_gateway' | 'store_credit')} className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                  <option value="cash">Cash Refund</option>
                  <option value="original_gateway">Original Payment Gateway</option>
                  <option value="store_credit">Store Credit</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowReturnForm(false)} className="px-3 py-2 text-xs border rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={handleCreateReturn} className="px-4 py-2 text-xs font-medium text-white rounded-lg" style={{ background: CRYSTAL_ORANGE }}>Submit Return</button>
              </div>
            </div>
          )}

          {filteredReturns.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <RotateCcw size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No return requests.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReturns.map((ret) => {
                const status = RETURN_STATUS_MAP[ret.status];
                return (
                  <div key={ret.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-bold text-gray-800 dark:text-white">{ret.customerName}</p>
                        <p className="text-xs text-gray-400">
                          Original Order: {ret.originalOrderId} • {ret.source === 'online' ? '🌐 Online' : '🏪 In-Store'}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status?.color}`}>{status?.label}</span>
                    </div>

                    <div className="mb-2">
                      {ret.items.map((item, i) => (
                        <p key={i} className="text-xs text-gray-500">• {item.productName} × {item.quantity} — {item.returnReason}</p>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold" style={{ color: CRYSTAL_ORANGE }}>৳{ret.refundAmount.toLocaleString()}</p>
                      <div className="flex gap-2">
                        {ret.status === 'pending' && (
                          <>
                            <button onClick={() => handleProcessReturn(ret.id, 'approved')} className="px-3 py-1.5 text-xs font-medium text-white rounded-lg" style={{ background: CRYSTAL_BLUE }}>Approve</button>
                            <button onClick={() => handleProcessReturn(ret.id, 'rejected')} className="px-3 py-1.5 text-xs font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50">Reject</button>
                          </>
                        )}
                        {ret.status === 'approved' && (
                          <button onClick={() => handleProcessReturn(ret.id, 'processed')} className="px-3 py-1.5 text-xs font-medium text-white rounded-lg" style={{ background: '#22C55E' }}>Process Refund & Restock</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
