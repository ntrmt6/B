import React, { useState } from 'react';
import { 
  CheckCircle2, Search, 
  Ban, PlayCircle, X, 
  Loader2, Store, Building2, XCircle, RotateCcw, CreditCard
} from 'lucide-react';
import { getPrimaryDomain } from '../../utils/appHelpers';
import type { Tenant } from '../../types';

// Status colors matching your main theme
const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  active: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' },
  trialing: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', border: 'border-amber-200' },
  suspended: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', border: 'border-red-200' },
  archived: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500', border: 'border-purple-200' },
  inactive: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', border: 'border-gray-200' },
  pending: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', border: 'border-blue-200' },
};

interface IsActiveTogglebtnProps {
  tenants?: Tenant[];
  primaryDomain?: string;
  onSelectTenant?: (tenant: Tenant, action: string) => Promise<void>;
  isProcessing?: boolean;
}

const IsActiveTogglebtn: React.FC<IsActiveTogglebtnProps> = ({ 
  tenants = [], 
  primaryDomain = getPrimaryDomain() || 'localhost:3000',
  onSelectTenant,
  isProcessing = false 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionModal, setActionModal] = useState<{ tenant: Tenant; action: string } | null>(null);

  // Filter tenants based on search and status
  const filteredTenants = tenants.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subdomain?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = tenants.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleActionClick = (tenant: Tenant, action: string) => {
    setActionModal({ tenant, action });
  };

  const confirmAction = async () => {
    if (actionModal && onSelectTenant) {
      await onSelectTenant(actionModal.tenant, actionModal.action);
      setActionModal(null);
    }
  };

  const getActionButtons = (tenant: Tenant) => {
    const actions: { label: string; action: string; icon: React.ReactNode; color: string }[] = [];
    
    if (tenant.status !== 'active') {
      actions.push({ label: 'Activate', action: 'activate', icon: <PlayCircle className="w-3.5 h-3.5" />, color: 'bg-emerald-600 hover:bg-emerald-700 text-white' });
    }
    if (tenant.status === 'active' || tenant.status === 'trialing') {
      actions.push(
        { label: 'Suspend', action: 'suspend', icon: <Ban className="w-3.5 h-3.5" />, color: 'bg-orange-500 hover:bg-orange-600 text-white' },
        { label: 'Block', action: 'block', icon: <XCircle className="w-3.5 h-3.5" />, color: 'bg-red-600 hover:bg-red-700 text-white' }
      );
    }
    if (tenant.status === 'suspended' || tenant.status === 'inactive' || tenant.status === 'archived') {
      actions.push({ label: 'Reactivate', action: 'reactivate', icon: <RotateCcw className="w-3.5 h-3.5" />, color: 'bg-blue-600 hover:bg-blue-700 text-white' });
    }
    return actions;
  };

  return (
    <div className="p-3 sm:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-2 mb-1 sm:mb-2">
          <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Package Management</h1>
        </div>
        <p className="text-sm sm:text-base text-slate-600">Manage tenant status - activate, suspend, block, or reactivate stores</p>
      </div>

      {/* Status Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-4 sm:mb-6">
        {[
          { key: 'all', label: 'All', count: tenants.length, color: 'bg-slate-100 text-slate-700' },
          { key: 'active', label: 'Active', count: statusCounts['active'] || 0, color: 'bg-emerald-50 text-emerald-700' },
          { key: 'trialing', label: 'Trialing', count: statusCounts['trialing'] || 0, color: 'bg-amber-50 text-amber-700' },
          { key: 'suspended', label: 'Suspended', count: statusCounts['suspended'] || 0, color: 'bg-red-50 text-red-700' },
          { key: 'inactive', label: 'Inactive', count: statusCounts['inactive'] || 0, color: 'bg-gray-100 text-gray-600' },
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setStatusFilter(item.key)}
            className={`p-2 sm:p-3 rounded-xl border-2 transition-all text-center ${
              statusFilter === item.key
                ? 'border-emerald-500 shadow-sm'
                : 'border-transparent hover:border-slate-200'
            } ${item.color}`}
          >
            <div className="text-lg sm:text-2xl font-bold">{item.count}</div>
            <div className="text-[10px] sm:text-xs font-medium">{item.label}</div>
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search stores by name or subdomain..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Tenant Cards */}
      <div className="space-y-3">
        {filteredTenants.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Store className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No stores found</p>
          </div>
        ) : (
          filteredTenants.map((tenant) => {
            const status = STATUS_COLORS[tenant.status] || STATUS_COLORS.inactive;
            const actions = getActionButtons(tenant);

            return (
              <div
                key={tenant.id || tenant._id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Tenant Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex-shrink-0 flex items-center justify-center text-emerald-600">
                      <Store className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-800 text-sm truncate">{tenant.name}</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${status.bg} ${status.text} ${status.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {tenant.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate">{tenant.subdomain}.{primaryDomain}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-1.5 sm:flex-nowrap sm:gap-2">
                    {actions.map(({ label, action, icon, color }) => (
                      <button
                        key={action}
                        onClick={() => handleActionClick(tenant as Tenant, action)}
                        className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium flex items-center justify-center gap-1 transition-colors ${color}`}
                      >
                        {icon} {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* The Popup Modal (Action Confirmation) */}
      {actionModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${
                actionModal.action === 'activate' || actionModal.action === 'reactivate'
                  ? 'bg-emerald-100 text-emerald-600' 
                  : actionModal.action === 'suspend'
                  ? 'bg-orange-100 text-orange-600'
                  : 'bg-red-100 text-red-600'
              }`}>
                {actionModal.action === 'activate' || actionModal.action === 'reactivate'
                  ? <PlayCircle className="w-6 h-6" />
                  : actionModal.action === 'suspend'
                  ? <Ban className="w-6 h-6" />
                  : <XCircle className="w-6 h-6" />
                }
              </div>
              <button onClick={() => setActionModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2 capitalize">
              {actionModal.action} Store?
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              You are about to <strong>{actionModal.action}</strong> the store &ldquo;<strong>{actionModal.tenant.name}</strong>&rdquo;. 
              This will affect the store&apos;s accessibility immediately.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setActionModal(null)}
                className="flex-1 py-2.5 text-gray-700 font-medium bg-gray-100 hover:bg-gray-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={isProcessing}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-white font-medium rounded-xl transition ${
                  actionModal.action === 'activate' || actionModal.action === 'reactivate'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : actionModal.action === 'suspend'
                    ? 'bg-orange-500 hover:bg-orange-600'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IsActiveTogglebtn;