import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Store, Plus, Search, Edit2, Trash2, Eye, ChevronDown, DollarSign, Users, Package, TrendingUp, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Vendor, Product } from '../../../types';
import { VendorService } from '../../../services/VendorService';
import VendorFormModal from './VendorFormModal';
import VendorProductTable from './VendorProductTable';
import VendorSettings from './VendorSettings';

interface VendorDashboardProps {
  tenantId: string;
  products: Product[];
  onBack?: () => void;
}

type ViewMode = 'list' | 'products' | 'settings';

const VendorDashboard: React.FC<VendorDashboardProps> = ({ tenantId, products, onBack }) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true);
      const data = await VendorService.getVendors(tenantId, statusFilter || undefined);
      setVendors(data);
    } catch {
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  }, [tenantId, statusFilter]);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  const filtered = useMemo(() => {
    if (!search.trim()) return vendors;
    const q = search.toLowerCase();
    return vendors.filter(v =>
      v.name.toLowerCase().includes(q) ||
      v.email.toLowerCase().includes(q) ||
      v.slug.toLowerCase().includes(q)
    );
  }, [vendors, search]);

  // Stats
  const stats = useMemo(() => ({
    total: vendors.length,
    active: vendors.filter(v => v.status === 'active').length,
    totalSales: vendors.reduce((s, v) => s + (v.totalSales || 0), 0),
    totalCommission: vendors.reduce((s, v) => s + (v.totalCommission || 0), 0),
  }), [vendors]);

  const handleSave = useCallback(async (data: Partial<Vendor>) => {
    try {
      if (editingVendor) {
        await VendorService.updateVendor(tenantId, editingVendor._id, data);
        toast.success('Vendor updated');
      } else {
        await VendorService.createVendor(tenantId, data);
        toast.success('Vendor created');
      }
      setShowModal(false);
      setEditingVendor(null);
      fetchVendors();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save vendor');
    }
  }, [tenantId, editingVendor, fetchVendors]);

  const handleDelete = useCallback(async (vendor: Vendor) => {
    if (!confirm(`Delete vendor "${vendor.name}"? This cannot be undone.`)) return;
    try {
      await VendorService.deleteVendor(tenantId, vendor._id);
      toast.success('Vendor deleted');
      fetchVendors();
    } catch {
      toast.error('Failed to delete vendor');
    }
  }, [tenantId, fetchVendors]);

  const handleViewProducts = useCallback((vendor: Vendor) => {
    setSelectedVendor(vendor);
    setViewMode('products');
  }, []);

  const handleViewSettings = useCallback((vendor: Vendor) => {
    setSelectedVendor(vendor);
    setViewMode('settings');
  }, []);

  const handleVendorUpdate = useCallback((updatedVendor: Vendor) => {
    setVendors(prev => prev.map(v => v._id === updatedVendor._id ? updatedVendor : v));
    setSelectedVendor(updatedVendor);
  }, []);

  // If viewing products for a specific vendor
  if (viewMode === 'products' && selectedVendor) {
    return (
      <VendorProductTable
        vendor={selectedVendor}
        products={products.filter(p => p.vendorId === selectedVendor._id)}
        allProducts={products}
        onBack={() => { setViewMode('list'); setSelectedVendor(null); }}
      />
    );
  }

  // If viewing settings for a specific vendor
  if (viewMode === 'settings' && selectedVendor) {
    return (
      <VendorSettings
        vendor={selectedVendor}
        tenantId={tenantId}
        onBack={() => { setViewMode('list'); setSelectedVendor(null); }}
        onVendorUpdate={handleVendorUpdate}
      />
    );
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      suspended: 'bg-red-50 text-red-700 border-red-200',
      rejected: 'bg-slate-100 text-slate-500 border-slate-200',
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-medium border rounded ${colors[status] || colors.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Store className="w-5 h-5 text-[#FF8C00]" />
          <h1 className="text-lg font-semibold text-slate-800 dark:text-white">Vendor Management</h1>
          <span className="text-xs text-slate-400">({vendors.length})</span>
        </div>
        <button
          onClick={() => { setEditingVendor(null); setShowModal(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[#FF8C00] rounded hover:bg-[#e07b00] transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Vendor
        </button>
      </div>

      {/* Stats row — flat, no shadows */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Vendors', value: stats.total, icon: Users, color: 'text-blue-600' },
          { label: 'Active', value: stats.active, icon: Store, color: 'text-emerald-600' },
          { label: 'Total Sales', value: `৳${stats.totalSales.toLocaleString()}`, icon: TrendingUp, color: 'text-[#FF8C00]' },
          { label: 'Commission Earned', value: `৳${stats.totalCommission.toLocaleString()}`, icon: DollarSign, color: 'text-purple-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex items-center gap-3 px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
            <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{label}</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#FF8C00]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#FF8C00]"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table — flat borders, tight spacing */}
      <div className="border border-slate-200 dark:border-slate-700 rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <th className="text-left px-3 py-2 font-medium text-slate-500 dark:text-slate-400">Vendor</th>
              <th className="text-left px-3 py-2 font-medium text-slate-500 dark:text-slate-400 hidden md:table-cell">Email</th>
              <th className="text-center px-3 py-2 font-medium text-slate-500 dark:text-slate-400 hidden lg:table-cell">Commission</th>
              <th className="text-right px-3 py-2 font-medium text-slate-500 dark:text-slate-400 hidden sm:table-cell">Sales</th>
              <th className="text-center px-3 py-2 font-medium text-slate-500 dark:text-slate-400">Status</th>
              <th className="text-right px-3 py-2 font-medium text-slate-500 dark:text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-400">Loading vendors...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-400">
                {vendors.length === 0 ? 'No vendors yet. Add your first vendor to get started.' : 'No vendors match your search.'}
              </td></tr>
            ) : filtered.map((vendor) => (
              <tr key={vendor._id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {vendor.logo ? (
                      <img src={vendor.logo} alt="" className="w-7 h-7 rounded object-cover border border-slate-200" />
                    ) : (
                      <div className="w-7 h-7 rounded bg-[#FF8C00]/10 flex items-center justify-center">
                        <Store className="w-3.5 h-3.5 text-[#FF8C00]" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{vendor.name}</p>
                      <p className="text-xs text-slate-400 truncate">{vendor.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-300 hidden md:table-cell">{vendor.email}</td>
                <td className="px-3 py-2 text-center hidden lg:table-cell">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{vendor.commissionRate}%</span>
                </td>
                <td className="px-3 py-2 text-right hidden sm:table-cell">
                  <span className="text-sm font-medium text-slate-800 dark:text-white">৳{(vendor.totalSales || 0).toLocaleString()}</span>
                </td>
                <td className="px-3 py-2 text-center">{statusBadge(vendor.status)}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => handleViewProducts(vendor)} title="View Products" className="p-1 text-slate-400 hover:text-[#FF8C00] transition-colors">
                      <Package className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleViewSettings(vendor)} title="Settings" className="p-1 text-slate-400 hover:text-purple-600 transition-colors">
                      <Settings className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setEditingVendor(vendor); setShowModal(true); }} title="Edit" className="p-1 text-slate-400 hover:text-blue-600 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(vendor)} title="Delete" className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <VendorFormModal
          vendor={editingVendor}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingVendor(null); }}
        />
      )}
    </div>
  );
};

export default VendorDashboard;
