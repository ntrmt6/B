import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { Order, Product } from '../../../types';
import { MetricsSkeleton } from '../../SkeletonLoaders';
import { DataService } from '../../../services/DataService';
import { getAuthHeader } from '../../../services/authService';

import { ReviewItem, ReviewStatus, CustomerInfo } from './types';
import CustomerStatsCards from './CustomerStatsCards';
import CustomerTable from './CustomerTable';
import ReviewTable from './ReviewTable';
import ReviewDetailModal from './ReviewDetailModal';
import CustomerViewModal from './CustomerViewModal';
import CustomerEditModal from './CustomerEditModal';
import AddCustomer from './addCustomer';

interface AdminCustomersReviewProps {
  orders: Order[];
  products?: Product[];
  activeTenantId: string;
}

const AdminCustomersReview: React.FC<AdminCustomersReviewProps> = ({ orders, products = [], activeTenantId }) => {
  // ── UI state ──────────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(true);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSortBy, setCustomerSortBy] = useState('Newest');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [categorySearch, setCategorySearch] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [customerActionDropdown, setCustomerActionDropdown] = useState<string | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<CustomerInfo | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<CustomerInfo | null>(null);

  // ── Review state ──────────────────────────────────────────────────────────
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewSortBy, setReviewSortBy] = useState('Newest');
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [mobileReviewMenuOpen, setMobileReviewMenuOpen] = useState<string | null>(null);

  // ── Manual customers (API-stored) ─────────────────────────────────────────
  const [manualCustomers, setManualCustomers] = useState<CustomerInfo[]>([]);

  // ── Data fetching ─────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!activeTenantId) return;
    const fetchReviews = async () => {
      try {
        setReviewsLoading(true);
        const { reviews: fetched } = await DataService.getAllReviewsForTenant(activeTenantId, { limit: 1000 });
        setReviews(fetched as ReviewItem[]);
      } catch {
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchReviews();
  }, [activeTenantId]);

  const fetchManualCustomers = useCallback(() => {
    if (!activeTenantId) return;
    fetch(`/api/tenant-data/${activeTenantId}/customers`, {
      headers: getAuthHeader() as Record<string, string>,
    })
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json) => setManualCustomers((json as { data?: CustomerInfo[] }).data ?? []))
      .catch(() => setManualCustomers([]));
  }, [activeTenantId]);

  useEffect(() => {
    fetchManualCustomers();
  }, [fetchManualCustomers]);

  // ── Derive customers from orders ──────────────────────────────────────────
  const orderDerivedCustomers = useMemo<CustomerInfo[]>(() => {
    const map = new Map<string, CustomerInfo>();
    let serial = 100;

    orders.forEach((order) => {
      const phone = order.customerPhone || order.phone || '';
      if (!phone) return;

      const existing = map.get(phone);
      const total = order.total || order.grandTotal || 0;
      const rawDate = order.createdAt || order.date || new Date().toISOString();
      const date = typeof rawDate === 'string' ? rawDate : new Date(rawDate).toISOString();

      if (existing) {
        existing.totalOrders += 1;
        existing.totalSpent += total;
        existing.orders.push(order);
        if (new Date(date) > new Date(existing.lastOrderDate)) existing.lastOrderDate = date;
        if (new Date(date) < new Date(existing.firstOrderDate)) existing.firstOrderDate = date;
        existing.avgOrderValue = existing.totalSpent / existing.totalOrders;
      } else {
        map.set(phone, {
          id: phone,
          name: order.customer || 'Unknown Customer',
          phone,
          email: order.email || '',
          address: order.location || '',
          totalOrders: 1,
          totalSpent: total,
          lastOrderDate: date,
          firstOrderDate: date,
          avgOrderValue: total,
          orders: [order],
          status: 'Active',
          serialNumber: serial++,
        });
      }
    });

    if (map.size === 0) {
      for (let i = 0; i < 4; i++) {
        map.set(`sample-${i}`, {
          id: `sample-${i}`,
          name: `Sample Customer ${i + 1}`,
          phone: '0000-000000',
          email: '',
          address: '',
          totalOrders: 0,
          totalSpent: 0,
          lastOrderDate: new Date().toISOString(),
          firstOrderDate: new Date().toISOString(),
          avgOrderValue: 0,
          orders: [],
          status: 'Active',
          serialNumber: 100,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  // ── Merge order-derived + manual (manual overrides if same phone) ──────────
  const customers = useMemo<CustomerInfo[]>(() => {
    const merged = [...orderDerivedCustomers];
    manualCustomers.forEach((mc) => {
      const idx = merged.findIndex((c) => c.phone === mc.phone);
      if (idx >= 0) {
        merged[idx] = { ...merged[idx], ...mc };
      } else {
        merged.push(mc);
      }
    });
    return merged;
  }, [orderDerivedCustomers, manualCustomers]);

  // ── Filtered / sorted lists ───────────────────────────────────────────────
  const filteredCustomers = useMemo<CustomerInfo[]>(() => {
    let result = [...customers];

    if (customerSearch.trim()) {
      const q = customerSearch.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.address?.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== 'All Status') result = result.filter((c) => c.status === statusFilter);
    if (categorySearch.trim()) {
      const q = categorySearch.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.orders.some((o) =>
            o.items?.some(
              (item: { name?: string; productName?: string }) =>
                item.name?.toLowerCase().includes(q) || item.productName?.toLowerCase().includes(q),
            ),
          ),
      );
    }

    switch (customerSortBy) {
      case 'Newest': result.sort((a, b) => new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime()); break;
      case 'Oldest': result.sort((a, b) => new Date(a.firstOrderDate).getTime() - new Date(b.firstOrderDate).getTime()); break;
      case 'Name': result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'Most Orders': result.sort((a, b) => b.totalOrders - a.totalOrders); break;
      case 'Highest Spent': result.sort((a, b) => b.totalSpent - a.totalSpent); break;
    }
    return result;
  }, [customers, customerSearch, statusFilter, categorySearch, customerSortBy]);

  const filteredReviews = useMemo<ReviewItem[]>(() => {
    let result = [...reviews];
    if (categorySearch.trim()) {
      const q = categorySearch.toLowerCase();
      result = result.filter((r) => {
        const pname = (products.find((p) => p.id === r.productId)?.name ?? '').toLowerCase();
        return (
          pname.includes(q) ||
          r.userName?.toLowerCase().includes(q) ||
          r.comment?.toLowerCase().includes(q) ||
          r.headline?.toLowerCase().includes(q)
        );
      });
    }
    switch (reviewSortBy) {
      case 'Newest': result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
      case 'Oldest': result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); break;
      case 'Highest Rating': result.sort((a, b) => b.rating - a.rating); break;
      case 'Lowest Rating': result.sort((a, b) => a.rating - b.rating); break;
      case 'Most Helpful': result.sort((a, b) => (b.helpful || 0) - (a.helpful || 0)); break;
    }
    return result;
  }, [reviews, categorySearch, reviewSortBy, products]);

  const customerStats = useMemo(() => ({
    totalCustomers: customers.length,
    totalReviews: reviews.length,
    repeatCustomers: customers.filter((c) => c.totalOrders > 1).length,
    blockedCustomers: customers.filter((c) => c.status === 'Blocked').length,
  }), [customers, reviews]);

  const selectedReview = useMemo(
    () => reviews.find((r) => r._id === selectedReviewId) ?? null,
    [reviews, selectedReviewId],
  );

  // ── Event handlers ────────────────────────────────────────────────────────
  const handleStatusChange = async (reviewId: string, status: ReviewStatus) => {
    if (!activeTenantId) return;
    setIsUpdating(true);
    try {
      await DataService.updateReviewStatus(activeTenantId, reviewId, status);
      setReviews((prev) => prev.map((r) => (r._id === reviewId ? { ...r, status } : r)));
      toast.success(status === 'approved' ? 'Review approved' : status === 'rejected' ? 'Review rejected' : 'Review pending');
    } catch {
      toast.error('Failed to update review status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendReply = async (reviewId: string, reply: string) => {
    if (!activeTenantId) return;
    setIsUpdating(true);
    try {
      await DataService.replyToReview(activeTenantId, reviewId, reply);
      setReviews((prev) =>
        prev.map((r) =>
          r._id === reviewId
            ? { ...r, reply, repliedAt: new Date().toISOString(), status: 'approved' as ReviewStatus }
            : r,
        ),
      );
      toast.success('Reply sent and review approved');
    } catch {
      toast.error('Failed to send reply');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 font-['Roboto'] p-4 md:p-6 lg:p-8 space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-teal-950">Customers &amp; Reviews</h1>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          {/* Global search */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              className="block w-full pl-10 pr-16 py-2.5 bg-[#F1F5F9] border-none rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              placeholder="Search customer, phone, product..."
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 pointer-events-none">
              Search
            </span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto">
            {/* Status filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-[#F1F5F9] text-gray-700 text-sm font-medium py-2.5 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                style={{ WebkitAppearance: 'none', MozAppearance: 'none', backgroundImage: 'none' }}
              >
                <option>All Status</option>
                <option>Active</option>
                <option>Blocked</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>

            <AddCustomer
              tenantId={activeTenantId}
              onCustomerAdded={(c) => {
                setManualCustomers((prev) => [...prev, c]); // optimistic
                fetchManualCustomers(); // sync with server
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      {isLoading ? (
        <MetricsSkeleton count={4} />
      ) : (
        <CustomerStatsCards {...customerStats} />
      )}

      {/* ── Main Split Layout ── */}
      <div className="flex flex-col xl:flex-row gap-3 sm:gap-4 lg:gap-6 items-start">
        {/* Left: Customer Table */}
        <CustomerTable
          customers={filteredCustomers}
          selectedCustomers={selectedCustomers}
          customerSearch={customerSearch}
          customerSortBy={customerSortBy}
          customerActionDropdown={customerActionDropdown}
          onSearchChange={setCustomerSearch}
          onSortChange={setCustomerSortBy}
          onSelectAll={() => {
            setSelectedCustomers(
              selectedCustomers.length === filteredCustomers.length ? [] : filteredCustomers.map((c) => c.id),
            );
          }}
          onSelectOne={(id) =>
            setSelectedCustomers((prev) =>
              prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id],
            )
          }
          onView={(c) => { setViewingCustomer(c); setCustomerActionDropdown(null); }}
          onEdit={(c) => { setEditingCustomer(c); setCustomerActionDropdown(null); }}
          onToggleDropdown={(id) => setCustomerActionDropdown((prev) => (prev === id ? null : id))}
        />

        {/* Right: Reviews Table */}
        <ReviewTable
          reviews={filteredReviews}
          selectedReviews={selectedReviews}
          selectedReviewId={selectedReviewId}
          reviewSortBy={reviewSortBy}
          loading={reviewsLoading}
          onSortChange={setReviewSortBy}
          onSelectAll={() =>
            setSelectedReviews(
              selectedReviews.length === filteredReviews.length ? [] : filteredReviews.map((r) => r._id),
            )
          }
          onSelectOne={(id) =>
            setSelectedReviews((prev) =>
              prev.includes(id) ? prev.filter((rid) => rid !== id) : [...prev, id],
            )
          }
          onSelectReview={setSelectedReviewId}
          mobileMenuOpen={mobileReviewMenuOpen}
          onToggleMobileMenu={(id) => setMobileReviewMenuOpen((prev) => (prev === id ? null : id))}
        />
      </div>

      {/* ── Modals ── */}
      {selectedReview && (
        <ReviewDetailModal
          review={selectedReview}
          products={products}
          isUpdating={isUpdating}
          onClose={() => setSelectedReviewId(null)}
          onStatusChange={handleStatusChange}
          onSendReply={handleSendReply}
        />
      )}

      {viewingCustomer && (
        <CustomerViewModal
          customer={viewingCustomer}
          onClose={() => setViewingCustomer(null)}
        />
      )}

      {editingCustomer && (
        <CustomerEditModal
          customer={editingCustomer}
          tenantId={activeTenantId}
          allCustomers={manualCustomers}
          onClose={() => setEditingCustomer(null)}
          onSaved={(updated) => {
            setManualCustomers((prev) => {
              const idx = prev.findIndex((c) => c.id === updated.id || c.phone === updated.phone);
              return idx >= 0 ? prev.map((c, i) => (i === idx ? updated : c)) : [...prev, updated];
            });
            setEditingCustomer(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminCustomersReview;
