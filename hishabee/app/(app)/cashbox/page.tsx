'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  fetchCashboxTransactions,
  createCashboxTransaction,
  deleteCashboxTransaction,
  type CashboxTransaction,
  type CashboxSummary,
} from '@/lib/services/cashbox';
import { formatCurrency } from '@/lib/tenant-config';
import {
  ArrowLeft, RefreshCcw, Plus, TrendingUp, TrendingDown,
  X, Trash2, Calendar, ChevronDown, SlidersHorizontal,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

/* ─── Theme Colors ───────────────────────────────────────────────────────── */
const CRYSTAL_ORANGE = '#FF8A00';
const CRYSTAL_BLUE = '#1E90FF';

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function getTxId(tx: CashboxTransaction) {
  return tx._id || tx.id || '';
}
function getTxKey(tx: CashboxTransaction, i: number) {
  return getTxId(tx) || `${tx.type}-${tx.date}-${tx.amount}-${i}`;
}

function getMonthRange(): { from: string; to: string; label: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const label = `${from.toLocaleDateString('en-GB', { month: 'short', day: '2-digit', year: 'numeric' })} - ${to.toLocaleDateString('en-GB', { month: 'short', day: '2-digit', year: 'numeric' })}`;
  return { from: from.toISOString(), to: to.toISOString(), label };
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ', ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
}

/* ─── Cashbox Page ───────────────────────────────────────────────────────── */
export default function CashboxPage() {
  const { tenantId, tenantConfig } = useAuth();
  const fc = (n: number) => formatCurrency(n, tenantConfig.currency);
  const router = useRouter();

  /* state */
  const [transactions, setTransactions] = useState<CashboxTransaction[]>([]);
  const [summary, setSummary] = useState<CashboxSummary>({
    totalCashIn: 0, totalCashOut: 0, balance: 0, totalTransactions: 0, totalAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [dateRange] = useState(() => getMonthRange());

  /* fetch */
  const loadData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterType !== 'all') params.type = filterType;
      if (filterSource !== 'all') params.source = filterSource;
      if (dateRange.from) params.from = dateRange.from;
      if (dateRange.to) params.to = dateRange.to;

      const data = await fetchCashboxTransactions(tenantId, params);
      setTransactions(data.transactions);
      setSummary(data.summary);
    } catch {
      toast.error('Failed to load cashbox data');
    } finally {
      setLoading(false);
    }
  }, [tenantId, filterType, filterSource, dateRange]);

  useEffect(() => { loadData(); }, [loadData]);

  /* actions */
  const handleAdd = async (type: 'cash_in' | 'cash_out', amount: number, note: string) => {
    if (!tenantId) return;
    try {
      await createCashboxTransaction(tenantId, { type, amount, note, source: 'manual' });
      toast.success(type === 'cash_in' ? 'Cash In recorded' : 'Cash Out recorded');
      setShowAddModal(false);
      loadData();
    } catch {
      toast.error('Failed to record transaction');
    }
  };

  const handleDelete = async (id: string) => {
    if (!tenantId || !id || !confirm('Delete this transaction?')) return;
    try {
      await deleteCashboxTransaction(tenantId, id);
      setTransactions(prev => prev.filter(t => getTxId(t) !== id));
      toast.success('Transaction deleted');
      loadData();
    } catch {
      toast.error('Failed to delete');
    }
  };

  /* filtered count/amount for display */
  const filteredStats = useMemo(() => {
    const count = transactions.length;
    const amount = transactions.reduce((s, t) => s + t.amount, 0);
    return { count, amount };
  }, [transactions]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 py-3 text-white sticky top-0 z-20"
        style={{ background: `linear-gradient(135deg, ${CRYSTAL_ORANGE}, ${CRYSTAL_ORANGE}dd)` }}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/')} className="p-1 rounded-lg hover:bg-white/20 transition-colors">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-lg font-bold tracking-wide">Cashbox</h1>
        </div>
        <button
          onClick={loadData}
          className="p-2 rounded-lg hover:bg-white/20 transition-colors"
          title="Refresh"
        >
          <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Balance Card */}
        <div className="mx-3 mt-4">
          <div className="rounded-2xl p-5 text-center" style={{ background: `${CRYSTAL_BLUE}18` }}>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Balance</p>
            <p className="text-2xl font-extrabold" style={{ color: summary.balance >= 0 ? '#16a34a' : '#dc2626' }}>
              {fc(summary.balance)}
            </p>
          </div>
        </div>

        {/* Cash In / Cash Out Cards */}
        <div className="grid grid-cols-2 gap-3 mx-3 mt-3">
          <div className="rounded-2xl p-4 text-center bg-emerald-50 border border-emerald-100">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">Cash In</p>
            <p className="text-lg font-extrabold text-emerald-700">{fc(summary.totalCashIn)}</p>
          </div>
          <div className="rounded-2xl p-4 text-center bg-rose-50 border border-rose-100">
            <p className="text-xs font-bold uppercase tracking-widest text-rose-600 mb-1">Cash Out</p>
            <p className="text-lg font-extrabold text-rose-700">{fc(summary.totalCashOut)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mx-3 mt-4 flex-wrap">
          <div className="relative">
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-xs font-medium text-gray-700 outline-none focus:border-blue-400"
            >
              <option value="all">All Types</option>
              <option value="cash_in">Cash In</option>
              <option value="cash_out">Cash Out</option>
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={filterSource}
              onChange={e => setFilterSource(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-xs font-medium text-gray-700 outline-none focus:border-blue-400"
            >
              <option value="all">All Sources</option>
              <option value="manual">Manual</option>
              <option value="transaction">Transaction</option>
              <option value="sale">Sale</option>
              <option value="purchase">Purchase</option>
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600">
            <Calendar size={14} className="text-gray-400" />
            <span>{dateRange.label}</span>
          </div>
        </div>

        {/* Summary Row */}
        <div className="flex items-center justify-between mx-3 mt-3 mb-2">
          <p className="text-sm font-semibold text-gray-700">
            Total Transactions: <span style={{ color: CRYSTAL_BLUE }}>{filteredStats.count}</span>
          </p>
          <p className="text-sm font-semibold text-gray-700">
            Amount: <span style={{ color: CRYSTAL_ORANGE }}>{fc(filteredStats.amount)}</span>
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-200 mx-3" />

        {/* Transaction List */}
        {loading ? (
          <div className="mx-3 mt-3 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                  <div className="h-5 bg-gray-200 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16 mx-3">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: `${CRYSTAL_BLUE}15` }}>
              <SlidersHorizontal size={28} style={{ color: CRYSTAL_BLUE }} />
            </div>
            <p className="text-gray-500 font-medium">No transactions found</p>
            <p className="text-xs text-gray-400 mt-1">Tap + to record a cash in or cash out</p>
          </div>
        ) : (
          <div className="mx-3 mt-3 space-y-2.5">
            {transactions.map((tx, i) => {
              const isCashIn = tx.type === 'cash_in';
              return (
                <div
                  key={getTxKey(tx, i)}
                  className="bg-white rounded-xl border border-gray-100 p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: isCashIn ? '#dcfce7' : '#ffe4e6' }}
                    >
                      {isCashIn
                        ? <TrendingUp size={18} className="text-emerald-600" />
                        : <TrendingDown size={18} className="text-rose-600" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-gray-900 text-sm capitalize">{tx.source || 'Manual'}</p>
                        <p className={`font-bold text-sm ${isCashIn ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {fc(tx.amount)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-xs text-gray-400">{formatDateShort(tx.date)}</p>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            isCashIn
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                              : 'bg-rose-50 text-rose-600 border border-rose-200'
                          }`}
                        >
                          {isCashIn ? 'Cash In' : 'Cash Out'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Note + Delete */}
                  {(tx.note || getTxId(tx)) && (
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                      {tx.note ? (
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <span className="inline-block w-3 h-3 border border-gray-300 rounded-sm flex-shrink-0" />
                          {tx.note}
                        </p>
                      ) : <span />}
                      <button
                        onClick={() => handleDelete(getTxId(tx))}
                        className="p-1 text-gray-300 hover:text-rose-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── FAB (Add Transaction) ───────────────────────────────────────── */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white z-30 hover:scale-105 active:scale-95 transition-transform"
        style={{ background: `linear-gradient(135deg, ${CRYSTAL_BLUE}, ${CRYSTAL_BLUE}cc)` }}
      >
        <Plus size={26} />
      </button>

      {/* ── Add Transaction Modal ───────────────────────────────────────── */}
      {showAddModal && (
        <AddTransactionModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAdd}
          fc={fc}
        />
      )}
    </div>
  );
}

/* ─── Add Transaction Modal ──────────────────────────────────────────────── */
function AddTransactionModal({
  onClose,
  onSave,
  fc,
}: {
  onClose: () => void;
  onSave: (type: 'cash_in' | 'cash_out', amount: number, note: string) => void;
  fc: (n: number) => string;
}) {
  const [type, setType] = useState<'cash_in' | 'cash_out'>('cash_in');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const num = Number(amount);
    if (!num || num <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setSubmitting(true);
    try {
      await onSave(type, num, note);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl animate-in slide-in-from-bottom">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">New Transaction</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Type Toggle */}
        <div className="p-4 space-y-4">
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setType('cash_in')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                type === 'cash_in'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Cash In
            </button>
            <button
              onClick={() => setType('cash_out')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                type === 'cash_out'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Cash Out
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Amount</label>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              autoFocus
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg font-bold outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Note (optional)</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Cash withdrawal, customer payment..."
              rows={2}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all resize-none"
            />
          </div>

          {/* Preview */}
          {amount && Number(amount) > 0 && (
            <div className={`rounded-xl p-3 text-center text-sm font-medium ${
              type === 'cash_in' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {type === 'cash_in' ? '+ ' : '- '}{fc(Number(amount))} will be recorded as {type === 'cash_in' ? 'Cash In' : 'Cash Out'}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !amount || Number(amount) <= 0}
            className="w-full py-3.5 rounded-xl text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90 active:scale-[0.99]"
            style={{
              background: type === 'cash_in'
                ? 'linear-gradient(135deg, #16a34a, #15803d)'
                : 'linear-gradient(135deg, #dc2626, #b91c1c)',
            }}
          >
            {submitting ? 'Saving...' : type === 'cash_in' ? 'Record Cash In' : 'Record Cash Out'}
          </button>
        </div>
      </div>
    </div>
  );
}
