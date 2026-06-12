import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Search, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Filter, 
  FileText, 
  MoreVertical,
  Eye,
  Trash2
} from 'lucide-react';
import { OrderService } from '../services/OrderService';
import { onDataRefresh } from '../services/DataService';  // listen for real-time updates

interface Order {
  image: any;
  name?: string;
  orderId?: string;
  phone?: string;
  dateTime?: string;
  paymentType?: string;
  points?: number;
  total?: number;
}
/**
 * IncompleteOrder Component
 * A data table component for managing orders that haven't been completed.
 * Features: Search, Pagination, Empty States, and Responsive Design.
 */
interface IncompleteOrderProps {
  tenantId?: string;
}

const IncompleteOrder: React.FC<IncompleteOrderProps> = ({ tenantId: propTenantId }) => {
  const tenantId = propTenantId; // tenantId provided via prop from parent
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isLoading, setIsLoading] = useState(true);

  // Real data state
  const [orders, setOrders] = useState<Order[]>([]);

  // Modal & selected order for viewing details
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // fetch helper wrapped in useCallback so we can reuse it in multiple effects
  const fetchIncompleteOrders = useCallback(async () => {
    if (!tenantId) {
      console.warn('[IncompleteOrders] No tenantId provided, skipping fetch');
      setOrders([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await OrderService.getOrders(tenantId, { status: 'Incomplete' });
      const incomplete = data.map((o: any) => ({
        name: o.customer,
        orderId: o.id,
        phone: o.phone,
        dateTime: o.date ? new Date(o.date).toLocaleString() : 'N/A',
        paymentType: o.paymentMethod || 'COD',
        points: 0,
        total: o.amount,
        image: o.productImage
      }));

      // replace the current list with whatever the server returned but keep existing entries in case the
      // server is only returning new entries (some backends may trim or return limited sets)
      setOrders(prev => {
        // create a map for quick lookup
        const map = new Map<string, Order>();
        prev.forEach(o => o.orderId && map.set(o.orderId, o));
        incomplete.forEach(o => {
          if (o.orderId) map.set(o.orderId, o);
        });
        return Array.from(map.values());
      });
    } catch (err) {
      console.error('[IncompleteOrders] Failed to fetch:', err);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  // initial load / tenant change
  useEffect(() => {
    fetchIncompleteOrders();
  }, [tenantId, fetchIncompleteOrders]);

  // listen for socket/cache updates to orders and refresh automatically
  useEffect(() => {
    if (!tenantId) return;
    const unsubscribe = onDataRefresh((key, tid) => {
      if (key === 'orders' && tid === tenantId) {
        fetchIncompleteOrders();
      }
    });
    return unsubscribe;
  }, [tenantId, fetchIncompleteOrders]);

  // Filtered data based on search
  const filteredOrders = useMemo(() => {
    return orders.filter(order => 
      order.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderId?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orders, searchTerm]);

  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));

  // when search term or base orders change, reset the page
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, orders.length]);

  // Paginated slice of orders
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage]);

  async function handleDelete(orderId: string | undefined): Promise<void> {
    if (!tenantId || !orderId) return;
    const result = await OrderService.deleteOrder(tenantId, orderId);
    if (result.success) {
      setOrders(prev => prev.filter(o => o.orderId !== orderId));
    } else {
      console.error('Failed to delete order', result.error);
    }
  }

  function prevPage(event: React.MouseEvent<HTMLButtonElement>): void {
    setCurrentPage(Math.max(1, currentPage - 1));
  }

  function nextPage(event: React.MouseEvent<HTMLButtonElement>): void {
    setCurrentPage(Math.min(totalPages, currentPage + 1));
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 font-sans text-slate-700">
      {/* Top Header / Search Bar */}
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-2 rounded-lg shadow-sm border border-gray-100">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-4 pr-12 py-2 bg-purple-50/50 border border-purple-100 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="absolute right-0 top-0 h-full px-3 bg-purple-600 text-white rounded-r-md hover:bg-purple-700 transition-colors">
              <Search size={18} />
            </button>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Table Controls */}
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-purple-600 font-semibold border-b-2 border-purple-600 pb-1">All Data</span>
              <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
                {filteredOrders.length}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-sky-400 to-blue-500 text-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg hover:opacity-90 transition-opacity shadow-sm">
                <Download size={16} />
                Download CSV
              </button>
              
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <input 
                  type="text" 
                  value={currentPage} 
                  readOnly 
                  className="w-8 h-8 border border-gray-300 rounded text-center focus:outline-none"
                />
                <span>of {totalPages}</span>
                <div className="flex ml-2 border border-gray-300 rounded overflow-hidden">
                  <button
                    className="p-1.5 hover:bg-gray-100 disabled:opacity-30"
                    onClick={prevPage}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    className="p-1.5 hover:bg-gray-100 border-l border-gray-300 disabled:opacity-30"
                    onClick={nextPage}
                    disabled={currentPage >= totalPages}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Table Body */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-purple-50/50 text-gray-700 text-sm font-medium">
                  <th className="p-4 w-10">
                    <input type="checkbox" className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                  </th>
                  <th className="p-4">Image</th>
                  <th className="p-4">Order Id</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Phone No</th>
                  <th className="p-4">
                    <div className="flex items-center gap-1">
                      Order Date Time <Calendar size={14} className="text-purple-500" />
                    </div>
                  </th>
                  <th className="p-4">
                    <div className="flex items-center gap-1">
                      Payment Type <Filter size={14} className="text-purple-500" />
                    </div>
                  </th>
                  <th className="p-4">Order Status</th>
                  <th className="p-4">Reward Points</th>
                  <th className="p-4">Grand Total</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={11} className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                        <p className="mt-4 text-gray-500 font-medium">Loading incomplete orders...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredOrders.length > 0 ? (
                  paginatedOrders.map((order, idx) => (
                    <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors text-sm">
                      <td className="p-4"><input type="checkbox" className="rounded border-gray-300 text-purple-600" /></td>
                      <td className="p-4">
                        <div className="w-10 h-10 bg-gray-200 rounded-md overflow-hidden">
                          {order.image ? (
                            <img src={order.image} alt={order.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                              <Search size={16} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-medium text-purple-700">{order.orderId}</td>
                      <td className="p-4">{order.name}</td>
                      <td className="p-4 text-gray-500">{order.phone}</td>
                      <td className="p-4">{order.dateTime}</td>
                      <td className="p-4">{order.paymentType}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold uppercase tracking-wider">
                          Incomplete
                        </span>
                      </td>
                      <td className="p-4 text-center">{order.points}</td>
                      <td className="p-4 font-bold text-gray-800">৳{order.total}</td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <button
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowModal(true);
                            }}
                          ><Eye size={16} /></button>
                          <button
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                            onClick={() => handleDelete(order.orderId)}
                          ><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mb-4 text-white shadow-lg shadow-purple-200">
                          <FileText size={40} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">No Data Found!</h3>
                        <p className="text-gray-500">Please add some data to show here.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Pagination */}
          <div className="p-4 bg-white border-t border-gray-100 flex justify-end">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <button
                className="px-2 py-1 border border-gray-300 rounded disabled:opacity-30"
                onClick={prevPage}
                disabled={currentPage <= 1}
              >Prev</button>
              <input 
                type="text" 
                value={currentPage} 
                readOnly 
                className="w-8 h-8 border border-gray-300 rounded text-center focus:outline-none"
              />
              <span>of {totalPages}</span>
              <button
                className="px-2 py-1 border border-gray-300 rounded disabled:opacity-30"
                onClick={nextPage}
                disabled={currentPage >= totalPages}
              >Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Exporting as the requested name "IncompleteOerder" (as requested, keeping the typo or used as alias)
export const IncompleteOerder = IncompleteOrder;

export default IncompleteOrder;