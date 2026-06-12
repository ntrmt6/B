'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { fetchOrders, deleteOrder, updateOrder, type Order } from '@/lib/services/orders';
import { formatCurrency } from '@/lib/tenant-config';
import {
  BookOpen, Search, Eye, ChevronDown, Trash2, Pencil,
  X, Package, Plus, ShoppingCart
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ─── theme ─── */
const ORANGE = '#FF8A00';
const BLUE = '#1E90FF';

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-700',
  Confirmed: 'bg-blue-100 text-blue-700',
  Processing: 'bg-indigo-100 text-indigo-700',
  Shipped: 'bg-purple-100 text-purple-700',
  Delivered: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
  Return: 'bg-orange-100 text-orange-700',
};

function displayId(o: Order) {
  return o.orderId || (o._id ? o._id.slice(-6) : 'N/A');
}

function rowKey(o: Order, i: number) {
  return o._id || o.orderId || `${o.createdAt}-${i}`;
}

export default function SaleBookPage() {
  const { tenantId, tenantConfig } = useAuth();
  const router = useRouter();
  const STATUSES = tenantConfig.orderStatuses;
  const fc = (n: number) => formatCurrency(n, tenantConfig.currency);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), pageSize: String(pageSize) };
      if (search) params.query = search;
      if (statusFilter) params.status = statusFilter;
      const data = await fetchOrders(tenantId, params);
      setOrders(data.orders);
      setTotal(data.total);
    } catch {
      toast.error('Failed to load sales');
    } finally {
      setLoading(false);
    }
  }, [tenantId, page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (order: Order, status: string) => {
    if (!tenantId || !order._id) return;
    try {
      await updateOrder(tenantId, order._id, { status });
      setOrders(prev => prev.map(o => o._id === order._id ? { ...o, status } : o));
      toast.success(`Status → ${status}`);
    } catch {
      toast.error('Update failed');
    }
  };

  const handleDelete = async (order: Order) => {
    if (!tenantId || !order._id || !confirm('Delete this sale?')) return;
    try {
      await deleteOrder(tenantId, order._id);
      setOrders(prev => prev.filter(o => o._id !== order._id));
      setSelected(null);
      toast.success('Sale deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto">
      {/* header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen size={22} style={{ color: ORANGE }} /> Sale Book
          </h1>
          <p className="text-sm text-gray-500">{total} sale{total !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => router.push('/sell')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
          style={{ backgroundColor: BLUE }}
        >
          <Plus size={16} /> New Sale
        </button>
      </div>

      {/* filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by customer name or phone..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2"
            style={{ '--tw-ring-color': BLUE } as React.CSSProperties}
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2"
          style={{ '--tw-ring-color': BLUE } as React.CSSProperties}
        >
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* ─── Transaction Details Modal ─── */}
      {selected && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center" onClick={() => setSelected(null)}>
          <div
            className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* header */}
            <div className="sticky top-0 bg-white px-4 pt-4 pb-3 border-b flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-gray-900">Transaction Details</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
            </div>

            <div className="p-4 space-y-4">
              {/* payment badge */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Payment: <span className="font-bold text-gray-900">{fc(selected.total || selected.grandTotal || 0)}</span></p>
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: selected.paymentMethod === 'Due' || selected.status === 'Pending' ? '#EF4444' : '#22C55E' }}
                >
                  {selected.paymentMethod === 'Due' ? 'Due' : selected.status === 'Pending' ? 'Due' : 'Paid'}
                </span>
              </div>

              {/* totals breakdown */}
              <div className="border rounded-xl divide-y">
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-sm text-gray-600">Total</span>
                  <span className="text-sm font-semibold">{fc(selected.total || selected.grandTotal || 0)}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-sm text-gray-600">Delivery Charge</span>
                  <span className="text-sm font-semibold">{fc(selected.deliveryCharge || 0)}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-sm text-gray-600">Discount</span>
                  <span className="text-sm font-semibold">{fc(selected.discount || 0)}</span>
                </div>
                <div className="flex justify-between px-4 py-3 bg-gray-50">
                  <span className="font-bold text-gray-900">Grand Total</span>
                  <span className="font-bold text-lg" style={{ color: ORANGE }}>{fc(selected.grandTotal || selected.total || 0)}</span>
                </div>
              </div>

              {/* sold products */}
              {selected.items && selected.items.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Sold Products</h3>
                  <div className="space-y-2">
                    {selected.items.map((item, i) => (
                      <div key={i} className="border rounded-xl p-3 flex items-center gap-3">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Package size={18} className="text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                          <p className="text-xs text-gray-500">
                            Quantity : <span className="font-bold">{(item.quantity || 1).toFixed(2)}</span>
                            &nbsp;&nbsp;Price : <span className="font-bold">{fc(item.price)}</span>
                            &nbsp;&nbsp;Total : <span className="font-bold" style={{ color: ORANGE }}>{fc(item.price * (item.quantity || 1))}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* notes */}
              {selected.note && (
                <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Notes</p>
                  <p className="text-sm text-gray-700">{selected.note}</p>
                </div>
              )}

              {/* customer */}
              {(selected.customerName || selected.customerPhone) && (
                <div className="text-sm text-gray-500">
                  <p>Customer: <span className="font-medium text-gray-700">{selected.customerName || 'Walk-in'}</span></p>
                  {selected.customerPhone && <p>Phone: {selected.customerPhone}</p>}
                </div>
              )}
            </div>

            {/* bottom actions */}
            <div className="sticky bottom-0 bg-white border-t p-4 flex gap-3">
              <button
                onClick={() => handleDelete(selected)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              >
                <Trash2 size={16} /> Delete
              </button>
              <button
                onClick={() => { setSelected(null); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity"
                style={{ backgroundColor: '#1F2937' }}
              >
                <Pencil size={16} /> Edit Transaction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* orders table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="bg-white border rounded-xl p-4 animate-pulse h-16" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-white border rounded-xl">
          <ShoppingCart size={40} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">No sales found</p>
          <button onClick={() => router.push('/sell')} className="mt-3 text-sm font-semibold" style={{ color: BLUE }}>+ Create first sale</button>
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b" style={{ backgroundColor: `${BLUE}08` }}>
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Sale</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((order, idx) => (
                  <tr key={rowKey(order, idx)} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => setSelected(order)}>
                    <td className="px-4 py-3 font-medium" style={{ color: BLUE }}>#{displayId(order)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{order.customerName || 'Walk-in'}</p>
                      {order.customerPhone && <p className="text-xs text-gray-400">{order.customerPhone}</p>}
                    </td>
                    <td className="px-4 py-3 text-right font-bold" style={{ color: ORANGE }}>{fc(order.total || order.grandTotal || 0)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="relative inline-block">
                        <select
                          value={order.status}
                          onChange={e => { e.stopPropagation(); handleStatusChange(order, e.target.value); }}
                          onClick={e => e.stopPropagation()}
                          disabled={!order._id}
                          className={`appearance-none px-2 py-1 pr-6 rounded-full text-xs font-medium border-0 cursor-pointer ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}
                        >
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <ChevronDown size={12} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={e => { e.stopPropagation(); setSelected(order); }} className="p-1.5 rounded hover:bg-gray-100" style={{ color: BLUE }}>
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {total > pageSize && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-gray-500">Page {page}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50">Prev</button>
                <button onClick={() => setPage(p => p + 1)} disabled={page * pageSize >= total} className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
