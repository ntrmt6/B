import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Edit2, Trash2, DollarSign, TrendingUp, FileText, 
  Settings, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw,
  Users, Search, PlayCircle, Ban, Archive, RotateCcw, Store,
  Loader2, X, ChevronRight, CreditCard, Package
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { 
  SubscriptionPlan, 
  BillingTransaction, 
  Invoice, 
  TrialSettings 
} from './types';
import type { Tenant, TenantStatus, ShopStatus } from '../../types';
import RenewSubscription from '../dashboard/RenewSubscription';

interface SubscriptionsTabProps {
  onLoadPlans: () => Promise<SubscriptionPlan[]>;
  onCreatePlan: (plan: Omit<SubscriptionPlan, '_id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdatePlan: (id: string, plan: Partial<SubscriptionPlan>) => Promise<void>;
  onDeletePlan: (id: string) => Promise<void>;
  onLoadTransactions: () => Promise<BillingTransaction[]>;
  onRefundTransaction: (id: string, reason: string) => Promise<void>;
  onLoadInvoices: () => Promise<Invoice[]>;
  onLoadTrialSettings: () => Promise<TrialSettings>;
  onUpdateTrialSettings: (settings: Partial<TrialSettings>) => Promise<void>;
  tenants?: Tenant[];
  onUpdateTenantStatus?: (tenantId: string, status: TenantStatus, reason?: string) => Promise<void>;
  onUpdateShopStatus?: (tenantId: string, shopStatus: Partial<ShopStatus>) => Promise<void>;
}

const SubscriptionsTab: React.FC<SubscriptionsTabProps> = ({
  onLoadPlans,
  onCreatePlan,
  onUpdatePlan,
  onDeletePlan,
  onLoadTransactions,
  onRefundTransaction,
  onLoadInvoices,
  onLoadTrialSettings,
  onUpdateTrialSettings,
  tenants = [],
  onUpdateTenantStatus,
  onUpdateShopStatus
}) => {
  const [activeView, setActiveView] = useState<'plans' | 'billing' | 'invoices' | 'trials' | 'tenant-status' | 'shop-status'>('plans');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [transactions, setTransactions] = useState<BillingTransaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [trialSettings, setTrialSettings] = useState<TrialSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundingTransaction, setRefundingTransaction] = useState<BillingTransaction | null>(null);

  useEffect(() => {
    loadData();
  }, [activeView]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeView === 'plans') {
        const plansData = await onLoadPlans();
        setPlans(plansData);
      } else if (activeView === 'billing') {
        const transactionsData = await onLoadTransactions();
        setTransactions(transactionsData);
      } else if (activeView === 'invoices') {
        const invoicesData = await onLoadInvoices();
        setInvoices(invoicesData);
      } else if (activeView === 'trials') {
        const settings = await onLoadTrialSettings();
        setTrialSettings(settings);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdatePlan = async (planData: Omit<SubscriptionPlan, '_id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingPlan?._id) {
        await onUpdatePlan(editingPlan._id, planData);
        toast.success('Plan updated successfully');
      } else {
        await onCreatePlan(planData);
        toast.success('Plan created successfully');
      }
      setShowPlanModal(false);
      setEditingPlan(null);
      loadData();
    } catch (error) {
      toast.error(editingPlan ? 'Failed to update plan' : 'Failed to create plan');
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    
    try {
      await onDeletePlan(id);
      toast.success('Plan deleted successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to delete plan');
    }
  };

  const handleRefund = async (reason: string) => {
    if (!refundingTransaction?._id) return;
    
    try {
      await onRefundTransaction(refundingTransaction._id, reason);
      toast.success('Transaction refunded successfully');
      setShowRefundModal(false);
      setRefundingTransaction(null);
      loadData();
    } catch (error) {
      toast.error('Failed to refund transaction');
    }
  };

  const formatCurrency = (amount: number, currency: string = 'BDT') => {
    return `${currency === 'BDT' ? '৳' : '$'}${amount.toLocaleString()}`;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
      paid: 'bg-green-100 text-green-800',
      sent: 'bg-blue-100 text-blue-800',
      draft: 'bg-gray-100 text-gray-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="p-3 sm:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-1 sm:mb-2">Subscriptions & Billing</h1>
        <p className="text-sm sm:text-base text-slate-600">Manage subscription plans, billing history, tenant status, and trial settings</p>
      </div>

      {/* Navigation Tabs - Scrollable on mobile */}
      <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 border-b border-slate-200 overflow-x-auto pb-px -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide">
        <button
          onClick={() => setActiveView('plans')}
          className={`px-3 sm:px-4 py-2 font-medium transition-colors whitespace-nowrap text-sm sm:text-base flex-shrink-0 ${
            activeView === 'plans'
              ? 'text-emerald-600 border-b-2 border-emerald-600'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4 inline mr-1 sm:mr-2" />
          Plans
        </button>
        <button
          onClick={() => setActiveView('tenant-status')}
          className={`px-3 sm:px-4 py-2 font-medium transition-colors whitespace-nowrap text-sm sm:text-base flex-shrink-0 ${
            activeView === 'tenant-status'
              ? 'text-emerald-600 border-b-2 border-emerald-600'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4 inline mr-1 sm:mr-2" />
          Tenant Status
        </button>
        <button
          onClick={() => setActiveView('billing')}
          className={`px-3 sm:px-4 py-2 font-medium transition-colors whitespace-nowrap text-sm sm:text-base flex-shrink-0 ${
            activeView === 'billing'
              ? 'text-emerald-600 border-b-2 border-emerald-600'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-1 sm:mr-2" />
          Billing
        </button>
        <button
          onClick={() => setActiveView('invoices')}
          className={`px-3 sm:px-4 py-2 font-medium transition-colors whitespace-nowrap text-sm sm:text-base flex-shrink-0 ${
            activeView === 'invoices'
              ? 'text-emerald-600 border-b-2 border-emerald-600'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-1 sm:mr-2" />
          Invoices
        </button>
        <button
          onClick={() => setActiveView('trials')}
          className={`px-3 sm:px-4 py-2 font-medium transition-colors whitespace-nowrap text-sm sm:text-base flex-shrink-0 ${
            activeView === 'trials'
              ? 'text-emerald-600 border-b-2 border-emerald-600'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 inline mr-1 sm:mr-2" />
          Trials
        </button>
        <button
          onClick={() => setActiveView('shop-status')}
          className={`px-3 sm:px-4 py-2 font-medium transition-colors whitespace-nowrap text-sm sm:text-base flex-shrink-0 ${
            activeView === 'shop-status'
              ? 'text-emerald-600 border-b-2 border-emerald-600'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4 inline mr-1 sm:mr-2" />
          Shop Status
        </button>
      </div>

      {/* Content */}
      {loading && activeView !== 'tenant-status' && activeView !== 'shop-status' ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Plans View */}
          {activeView === 'plans' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-800">Subscription Plans</h2>
                <button
                  onClick={() => {
                    setEditingPlan(null);
                    setShowPlanModal(true);
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-[#38BDF8] to-[#1E90FF] text-white rounded-lg hover:from-[#2BAEE8] hover:to-[#1A7FE8] transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Plan
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                {plans.map((plan) => (
                  <div
                    key={plan._id}
                    className={`bg-white rounded-xl shadow-sm border-2 p-6 ${
                      plan.isPopular ? 'border-emerald-500' : 'border-slate-200'
                    }`}
                  >
                    {plan.isPopular && (
                      <div className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">
                        POPULAR
                      </div>
                    )}
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">{plan.displayName}</h3>
                    <p className="text-slate-600 mb-4">{plan.description}</p>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-slate-800">
                        {formatCurrency(plan.price, plan.currency)}
                      </span>
                      <span className="text-slate-600 ml-2">/ {plan.billingCycle}</span>
                    </div>
                    
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span>
                          {plan.features.maxProducts === 'unlimited' 
                            ? 'Unlimited products' 
                            : `${plan.features.maxProducts} products`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span>
                          {plan.features.maxOrders === 'unlimited' 
                            ? 'Unlimited orders' 
                            : `${plan.features.maxOrders} orders/month`}
                        </span>
                      </div>
                      {plan.features.customDomain && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          <span>Custom domain</span>
                        </div>
                      )}
                      {plan.features.prioritySupport && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          <span>Priority support</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingPlan(plan);
                          setShowPlanModal(true);
                        }}
                        className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => plan._id && handleDeletePlan(plan._id)}
                        className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Billing History View */}
          {activeView === 'billing' && (
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-slate-800 mb-4">Billing History</h2>
              {/* Desktop Table */}
              <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tenant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Plan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction._id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{transaction.tenantName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{transaction.planName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(transaction.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {transaction.status === 'completed' && (
                            <button
                              onClick={() => { setRefundingTransaction(transaction); setShowRefundModal(true); }}
                              className="text-red-600 hover:text-red-800"
                            >Refund</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {transactions.map((transaction) => (
                  <div key={transaction._id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-slate-900 text-sm">{transaction.tenantName}</span>
                      {getStatusBadge(transaction.status)}
                    </div>
                    <div className="space-y-1 text-sm text-slate-600">
                      <div className="flex justify-between">
                        <span>Plan</span><span className="font-medium text-slate-800">{transaction.planName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Amount</span><span className="font-medium text-slate-800">{formatCurrency(transaction.amount, transaction.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date</span><span>{new Date(transaction.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {transaction.status === 'completed' && (
                      <button
                        onClick={() => { setRefundingTransaction(transaction); setShowRefundModal(true); }}
                        className="mt-3 w-full py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
                      >Refund</button>
                    )}
                  </div>
                ))}
                {transactions.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm">No billing history</div>
                )}
              </div>
            </div>
          )}

          {/* Invoices View */}
          {activeView === 'invoices' && (
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-slate-800 mb-4">Invoices</h2>
              {/* Desktop Table */}
              <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Invoice #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tenant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Due Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {invoices.map((invoice) => (
                      <tr key={invoice._id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{invoice.invoiceNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{invoice.tenantName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{formatCurrency(invoice.total, invoice.currency)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(invoice.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {invoices.map((invoice) => (
                  <div key={invoice._id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-slate-900 text-sm">{invoice.invoiceNumber}</span>
                      {getStatusBadge(invoice.status)}
                    </div>
                    <div className="space-y-1 text-sm text-slate-600">
                      <div className="flex justify-between">
                        <span>Tenant</span><span className="font-medium text-slate-800">{invoice.tenantName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Amount</span><span className="font-medium text-slate-800">{formatCurrency(invoice.total, invoice.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Due Date</span><span>{new Date(invoice.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {invoices.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm">No invoices</div>
                )}
              </div>
            </div>
          )}

          {/* Trial Management View */}
          {activeView === 'trials' && trialSettings && (
            <TrialManagement
              settings={trialSettings}
              onUpdate={async (updates) => {
                await onUpdateTrialSettings(updates);
                toast.success('Trial settings updated');
                loadData();
              }}
            />
          )}

          {/* Tenant Status Management View */}
          {activeView === 'tenant-status' && (
            <TenantStatusManager
              tenants={tenants}
              onUpdateTenantStatus={onUpdateTenantStatus}
            />
          )}

          {/* Shop Status Management View */}
          {activeView === 'shop-status' && (
            <ShopStatusManager
              tenants={tenants}
              onUpdateShopStatus={onUpdateShopStatus}
            />
          )}
        </>
      )}

      {/* Plan Modal */}
      {showPlanModal && (
        <PlanModal
          plan={editingPlan}
          onClose={() => {
            setShowPlanModal(false);
            setEditingPlan(null);
          }}
          onSave={handleCreateOrUpdatePlan}
        />
      )}

      {/* Refund Modal */}
      {showRefundModal && refundingTransaction && (
        <RefundModal
          transaction={refundingTransaction}
          onClose={() => {
            setShowRefundModal(false);
            setRefundingTransaction(null);
          }}
          onRefund={handleRefund}
        />
      )}
    </div>
  );
};

// Plan Modal Component
const PlanModal: React.FC<{
  plan: SubscriptionPlan | null;
  onClose: () => void;
  onSave: (plan: Omit<SubscriptionPlan, '_id' | 'createdAt' | 'updatedAt'>) => void;
}> = ({ plan, onClose, onSave }) => {
  const [formData, setFormData] = useState<Omit<SubscriptionPlan, '_id' | 'createdAt' | 'updatedAt'>>(
    plan || {
      name: 'basic',
      displayName: '',
      description: '',
      price: 0,
      billingCycle: 'monthly',
      currency: 'BDT',
      features: {
        maxProducts: 100,
        maxOrders: 100,
        maxUsers: 1,
        maxStorageGB: 1,
        customDomain: false,
        analyticsAccess: false,
        prioritySupport: false,
        apiAccess: false,
        whiteLabel: false,
        multiCurrency: false,
        advancedReports: false
      },
      isActive: true,
      isPopular: false
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800">
            {plan ? 'Edit Plan' : 'Create New Plan'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Plan Type
              </label>
              <select
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value as 'basic' | 'pro' | 'enterprise' })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Price
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Billing Cycle
              </label>
              <select
                value={formData.billingCycle}
                onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value as 'monthly' | 'yearly' })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="BDT">BDT</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Features & Limits</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Max Products
                </label>
                <input
                  type="text"
                  value={formData.features.maxProducts}
                  onChange={(e) => {
                    const value = e.target.value === 'unlimited' ? 'unlimited' : parseInt(e.target.value) || 0;
                    setFormData({
                      ...formData,
                      features: { ...formData.features, maxProducts: value }
                    });
                  }}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="100 or 'unlimited'"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Max Orders/Month
                </label>
                <input
                  type="text"
                  value={formData.features.maxOrders}
                  onChange={(e) => {
                    const value = e.target.value === 'unlimited' ? 'unlimited' : parseInt(e.target.value) || 0;
                    setFormData({
                      ...formData,
                      features: { ...formData.features, maxOrders: value }
                    });
                  }}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="100 or 'unlimited'"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.features.customDomain}
                  onChange={(e) => setFormData({
                    ...formData,
                    features: { ...formData.features, customDomain: e.target.checked }
                  })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700">Custom Domain</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.features.prioritySupport}
                  onChange={(e) => setFormData({
                    ...formData,
                    features: { ...formData.features, prioritySupport: e.target.checked }
                  })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700">Priority Support</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.features.analyticsAccess}
                  onChange={(e) => setFormData({
                    ...formData,
                    features: { ...formData.features, analyticsAccess: e.target.checked }
                  })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700">Analytics</span>
              </label>
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-slate-700">Active</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isPopular}
                onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-slate-700">Mark as Popular</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-[#38BDF8] to-[#1E90FF] text-white rounded-lg hover:from-[#2BAEE8] hover:to-[#1A7FE8] transition-colors"
            >
              {plan ? 'Update Plan' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Refund Modal Component
const RefundModal: React.FC<{
  transaction: BillingTransaction;
  onClose: () => void;
  onRefund: (reason: string) => void;
}> = ({ transaction, onClose, onRefund }) => {
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRefund(reason);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800">Refund Transaction</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm text-slate-600 mb-1">Transaction ID</p>
            <p className="font-medium text-slate-800">{transaction._id}</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm text-slate-600 mb-1">Amount</p>
            <p className="font-medium text-slate-800">
              {transaction.currency === 'BDT' ? '৳' : '$'}{transaction.amount.toLocaleString()}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Refund Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              rows={4}
              required
              placeholder="Please provide a reason for this refund..."
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Process Refund
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Trial Management Component
const TrialManagement: React.FC<{
  settings: TrialSettings;
  onUpdate: (settings: Partial<TrialSettings>) => void;
}> = ({ settings, onUpdate }) => {
  const [formData, setFormData] = useState(settings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
      <h2 className="text-xl font-semibold text-slate-800 mb-6">Trial Management Settings</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Default Trial Duration (Days)
          </label>
          <input
            type="number"
            value={formData.defaultTrialDays}
            onChange={(e) => setFormData({ ...formData, defaultTrialDays: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            min="1"
            max="365"
          />
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.autoExpireTrials}
              onChange={(e) => setFormData({ ...formData, autoExpireTrials: e.target.checked })}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm text-slate-700">Automatically expire trials</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.sendExpirationAlerts}
              onChange={(e) => setFormData({ ...formData, sendExpirationAlerts: e.target.checked })}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm text-slate-700">Send expiration alerts</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.allowTrialExtension}
              onChange={(e) => setFormData({ ...formData, allowTrialExtension: e.target.checked })}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm text-slate-700">Allow trial extensions</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.requirePaymentMethod}
              onChange={(e) => setFormData({ ...formData, requirePaymentMethod: e.target.checked })}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm text-slate-700">Require payment method for trial</span>
          </label>
        </div>

        {formData.allowTrialExtension && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Max Trial Extension (Days)
            </label>
            <input
              type="number"
              value={formData.maxTrialExtensionDays}
              onChange={(e) => setFormData({ ...formData, maxTrialExtensionDays: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              min="0"
              max="30"
            />
          </div>
        )}

        <button
          type="submit"
          className="w-full px-4 py-2 bg-gradient-to-r from-[#38BDF8] to-[#1E90FF] text-white rounded-lg hover:from-[#2BAEE8] hover:to-[#1A7FE8] transition-colors"
        >
          Save Settings
        </button>
      </form>
    </div>
  );
};

// Tenant Status Manager Component
const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  active: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' },
  trialing: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', border: 'border-amber-200' },
  suspended: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', border: 'border-red-200' },
  inactive: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', border: 'border-gray-200' },
  pending: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', border: 'border-blue-200' },
  archived: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400', border: 'border-slate-300' },
};

const TenantStatusManager: React.FC<{
  tenants: Tenant[];
  onUpdateTenantStatus?: (tenantId: string, status: TenantStatus, reason?: string) => Promise<void>;
}> = ({ tenants, onUpdateTenantStatus }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionModal, setActionModal] = useState<{ tenant: Tenant; action: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewTenant, setRenewTenant] = useState<Tenant | null>(null);

  const filteredTenants = tenants.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subdomain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.contactEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = tenants.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleAction = (tenant: Tenant, action: string) => {
    setActionModal({ tenant, action });
  };

  const confirmAction = async () => {
    if (!actionModal || !onUpdateTenantStatus) return;
    setIsProcessing(true);
    try {
      const statusMap: Record<string, TenantStatus> = {
        activate: 'active',
        suspend: 'suspended',
        block: 'inactive',
        reactivate: 'active',
      };
      const newStatus = statusMap[actionModal.action] || 'active';
      const tenantId = actionModal.tenant.id || actionModal.tenant._id || '';
      await onUpdateTenantStatus(tenantId, newStatus);
      setActionModal(null);
    } catch {
      // error handled by parent
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRenew = (tenant: Tenant) => {
    setRenewTenant(tenant);
    setShowRenewModal(true);
  };

  const getActionButtons = (tenant: Tenant) => {
    const actions: { label: string; action: string; icon: React.ReactNode; color: string }[] = [];
    
    if (tenant.status !== 'active') {
      actions.push({ label: 'Activate', action: 'activate', icon: <PlayCircle className="w-3.5 h-3.5" />, color: 'bg-emerald-600 hover:bg-emerald-700 text-white' });
    }
    if (tenant.status === 'suspended' || tenant.status === 'inactive') {
      actions.push({ label: 'Reactivate', action: 'reactivate', icon: <RotateCcw className="w-3.5 h-3.5" />, color: 'bg-blue-600 hover:bg-blue-700 text-white' });
    }
    if (tenant.status === 'active' || tenant.status === 'trialing') {
      actions.push(
        { label: 'Suspend', action: 'suspend', icon: <Ban className="w-3.5 h-3.5" />, color: 'bg-orange-500 hover:bg-orange-600 text-white' },
        { label: 'Block', action: 'block', icon: <XCircle className="w-3.5 h-3.5" />, color: 'bg-red-600 hover:bg-red-700 text-white' }
      );
    }

    // Remove duplicate activate/reactivate (only show one relevant action)
    const uniqueActions = actions.filter((a, i, arr) => {
      if (a.action === 'reactivate' && arr.some(x => x.action === 'activate')) return false;
      return true;
    });

    return uniqueActions;
  };

  return (
    <div>
      {/* Status Summary Cards */}
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

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, subdomain, or email..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Tenant List */}
      <div className="space-y-3">
        {filteredTenants.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Store className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No tenants found</p>
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
                      <p className="text-xs text-slate-400 truncate">{tenant.subdomain} · {tenant.contactEmail}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Plan: <span className="font-medium capitalize">{tenant.plan}</span>
                        {tenant.subscriptionEndsAt && (
                          <> · Expires: {new Date(tenant.subscriptionEndsAt).toLocaleDateString()}</>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-1.5 sm:flex-nowrap sm:gap-2">
                    {actions.map(({ label, action, icon, color }) => (
                      <button
                        key={action}
                        onClick={() => handleAction(tenant, action)}
                        className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium flex items-center justify-center gap-1 transition-colors ${color}`}
                      >
                        {icon} {label}
                      </button>
                    ))}
                    <button
                      onClick={() => handleRenew(tenant)}
                      className="flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium flex items-center justify-center gap-1 bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                    >
                      <CreditCard className="w-3.5 h-3.5" /> Renew
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Action Confirmation Modal */}
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
                    <CheckCircle className="w-4 h-4" />
                    Confirm
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Renew Subscription Modal */}
      {showRenewModal && (
        <RenewSubscription
          isOpen={showRenewModal}
          onClose={() => { setShowRenewModal(false); setRenewTenant(null); }}
          selectedPlan={renewTenant?.plan || 'starter'}
        />
      )}
    </div>
  );
};

// Shop Status Manager Component
const SHOP_STATUS_COLOR_CLASSES: Record<string, { active: string; dot: string }> = {
  amber: {
    active: 'bg-amber-50 border-amber-300 text-amber-700',
    dot: 'border-amber-500 bg-amber-500',
  },
  blue: {
    active: 'bg-blue-50 border-blue-300 text-blue-700',
    dot: 'border-blue-500 bg-blue-500',
  },
  purple: {
    active: 'bg-purple-50 border-purple-300 text-purple-700',
    dot: 'border-purple-500 bg-purple-500',
  },
  emerald: {
    active: 'bg-emerald-50 border-emerald-300 text-emerald-700',
    dot: 'border-emerald-500 bg-emerald-500',
  },
  orange: {
    active: 'bg-orange-50 border-orange-300 text-orange-700',
    dot: 'border-orange-500 bg-orange-500',
  },
  red: {
    active: 'bg-red-50 border-red-300 text-red-700',
    dot: 'border-red-500 bg-red-500',
  },
  gray: {
    active: 'bg-gray-100 border-gray-300 text-gray-700',
    dot: 'border-gray-500 bg-gray-500',
  },
};

const SHOP_STATUS_FIELDS: { key: keyof ShopStatus; label: string; description: string; color: string }[] = [
  { key: 'isTrialing', label: 'Trialing', description: 'Shop is on a trial period', color: 'amber' },
  { key: 'isStartups', label: 'Startups', description: 'Startup package', color: 'blue' },
  { key: 'isEnterprise', label: 'Enterprise', description: 'Enterprise package', color: 'purple' },
  { key: 'isPremium', label: 'Premium', description: 'Premium package', color: 'emerald' },
  { key: 'isExpired', label: 'Expired', description: 'Subscription expired', color: 'orange' },
  { key: 'isSuspended', label: 'Suspended', description: 'Shop is suspended', color: 'red' },
  { key: 'isBlocked', label: 'Blocked', description: 'Shop is blocked', color: 'gray' },
];

const ShopStatusManager: React.FC<{
  tenants: Tenant[];
  onUpdateShopStatus?: (tenantId: string, shopStatus: Partial<ShopStatus>) => Promise<void>;
}> = ({ tenants, onUpdateShopStatus }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingTenant, setUpdatingTenant] = useState<string | null>(null);

  const filteredTenants = tenants.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.name?.toLowerCase().includes(q) ||
      t.subdomain?.toLowerCase().includes(q) ||
      t.contactEmail?.toLowerCase().includes(q)
    );
  });

  const handleToggleStatus = useCallback(async (tenantId: string, field: keyof ShopStatus, currentValue: boolean) => {
    if (!onUpdateShopStatus) return;
    setUpdatingTenant(`${tenantId}-${field}`);
    try {
      await onUpdateShopStatus(tenantId, { [field]: !currentValue });
    } catch (error) {
      // Error is already handled in the parent
    } finally {
      setUpdatingTenant(null);
    }
  }, [onUpdateShopStatus]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Shop Status Management</h3>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, subdomain, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>

      {/* Tenant List */}
      <div className="space-y-4">
        {filteredTenants.length === 0 ? (
          <div className="text-center py-8 text-slate-500">No tenants found</div>
        ) : (
          filteredTenants.map(tenant => {
            const tenantId = tenant.id || tenant._id || '';
            const shopStatus = tenant.shopStatus || {
              isTrialing: false, isStartups: false, isEnterprise: false,
              isPremium: false, isExpired: false, isSuspended: false, isBlocked: false
            };

            return (
              <div key={tenantId} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Store className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800">{tenant.name}</h4>
                    <p className="text-xs text-slate-500">{tenant.subdomain} • {tenant.contactEmail}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {SHOP_STATUS_FIELDS.map(({ key, label, description, color }) => {
                    const isActive = shopStatus[key] ?? false;
                    const isUpdating = updatingTenant === `${tenantId}-${key}`;
                    const colorClasses = SHOP_STATUS_COLOR_CLASSES[color] || SHOP_STATUS_COLOR_CLASSES.gray;

                    return (
                      <button
                        key={key}
                        onClick={() => handleToggleStatus(tenantId, key, isActive)}
                        disabled={isUpdating}
                        title={description}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                          isActive
                            ? colorClasses.active
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                        } ${isUpdating ? 'opacity-50' : ''}`}
                      >
                        {isUpdating ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                        ) : (
                          <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isActive ? colorClasses.dot : 'border-slate-300'
                          }`}>
                            {isActive && <CheckCircle className="w-2.5 h-2.5 text-white" />}
                          </div>
                        )}
                        <span className="truncate">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SubscriptionsTab;
