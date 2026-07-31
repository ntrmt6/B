import { useState, useEffect, useRef } from 'react';
import { X, Trash2, Search, TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle, ChevronDown, AlertCircle, User } from 'lucide-react';
import { DueTransaction } from '../types';
import { dueListService } from '../services/DueListService';

interface Props { isOpen: boolean; onClose: () => void; onRefresh?: () => void; entityId?: string; entityName?: string; }

type FilterStatus = 'all' | 'Pending' | 'Paid' | 'Cancelled';

const statusConfig = {
  Pending:   { icon: Clock,          bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-400'   },
  Paid:      { icon: CheckCircle2,   bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-400' },
  Cancelled: { icon: XCircle,        bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',    dot: 'bg-rose-400'    },
};

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function groupByDate(transactions: DueTransaction[]) {
  const groups: Record<string, DueTransaction[]> = {};
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);

  transactions.forEach(t => {
    const d = new Date(t.transactionDate); d.setHours(0, 0, 0, 0);
    let label: string;
    if (d.getTime() === today.getTime()) label = 'Today';
    else if (d.getTime() === yesterday.getTime()) label = 'Yesterday';
    else if (d >= weekAgo) label = 'This Week';
    else label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!groups[label]) groups[label] = [];
    groups[label].push(t);
  });
  return groups;
}

const DueHistoryModal = ({ isOpen, onClose, onRefresh, entityId, entityName }: Props) => {
  const [transactions, setTransactions] = useState<DueTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (isOpen) { fetchTransactions(); setTimeout(() => searchRef.current?.focus(), 300); } }, [isOpen, filter, entityId]);

  const fetchTransactions = async () => {
    setLoading(true); setError(null);
    try { setTransactions(await dueListService.getTransactions(entityId, undefined, undefined, filter !== 'all' ? filter : undefined)); }
    catch { setError('Failed to load transaction history'); }
    finally { setLoading(false); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    setUpdatingId(id);
    try { await dueListService.updateTransactionStatus(id, status); fetchTransactions(); onRefresh?.(); }
    catch { setError('Failed to update transaction'); }
    finally { setUpdatingId(null); }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try { await dueListService.deleteTransaction(id); fetchTransactions(); onRefresh?.(); }
    catch { setError('Failed to delete transaction'); }
    finally { setDeletingId(null); setConfirmDeleteId(null); }
  };

  const filtered = transactions.filter(t =>
    t.entityName.toLowerCase().includes(search.toLowerCase()) ||
    (t.notes || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalGet = filtered.filter(t => t.direction === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const totalGive = filtered.filter(t => t.direction === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  const grouped = groupByDate(filtered);
  const groupOrder = ['Today', 'Yesterday', 'This Week'];
  const otherGroups = Object.keys(grouped).filter(k => !groupOrder.includes(k)).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  const orderedGroups = [...groupOrder.filter(k => grouped[k]), ...otherGroups];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={e => e.target === e.currentTarget && onClose()}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full sm:max-w-2xl lg:max-w-3xl max-h-[95dvh] sm:max-h-[90vh] bg-white sm:rounded-2xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">

        {/* Drag handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-start gap-4 px-5 sm:px-6 pt-4 pb-3 border-b border-gray-100">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">Transaction History</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {entityName ? <><span className="font-medium text-gray-700">{entityName}</span> · </> : ''}{filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-gray-700 shrink-0">
            <X size={20} />
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 px-5 sm:px-6 py-3">
          <div className="flex items-center gap-3 bg-rose-50 rounded-xl p-3 border border-rose-100">
            <div className="p-2 bg-rose-100 rounded-lg"><TrendingUp size={16} className="text-rose-600" /></div>
            <div>
              <p className="text-xs text-rose-600 font-medium">You Will Get</p>
              <p className="text-base font-bold text-rose-700">৳{totalGet.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-emerald-50 rounded-xl p-3 border border-emerald-100">
            <div className="p-2 bg-emerald-100 rounded-lg"><TrendingDown size={16} className="text-emerald-600" /></div>
            <div>
              <p className="text-xs text-emerald-600 font-medium">You Will Give</p>
              <p className="text-base font-bold text-emerald-700">৳{totalGive.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="px-5 sm:px-6 space-y-3 pb-3">
          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search by name or note…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-primary/30 focus:border-theme-primary bg-gray-50 transition"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status Pills */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
            {(['all', 'Pending', 'Paid', 'Cancelled'] as FilterStatus[]).map(s => {
              const cfg = s !== 'all' ? statusConfig[s] : null;
              const count = s === 'all' ? transactions.length : transactions.filter(t => t.status === s).length;
              return (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                    filter === s
                      ? s === 'all'
                        ? 'bg-gray-900 text-white border-gray-900'
                        : `${cfg!.bg} ${cfg!.text} ${cfg!.border}`
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {cfg && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
                  {s === 'all' ? 'All' : s}
                  <span className={`px-1 rounded ${filter === s ? 'opacity-70' : 'opacity-50'}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-5 sm:mx-6 mb-2 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle size={15} />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto"><X size={14} /></button>
          </div>
        )}

        {/* Transaction List */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 pb-6">
          {loading ? (
            <div className="space-y-3 mt-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex gap-3 p-4 border border-gray-100 rounded-2xl">
                  <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                  <div className="h-5 bg-gray-200 rounded w-20" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">No transactions found</p>
              <p className="text-gray-400 text-sm mt-1">{search ? 'Try a different search term' : 'No transactions match this filter'}</p>
            </div>
          ) : (
            <div className="space-y-5 mt-1">
              {orderedGroups.map(group => (
                <div key={group}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{group}</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                  <div className="space-y-2">
                    {grouped[group].map(t => {
                      const StatusIcon = statusConfig[t.status]?.icon ?? Clock;
                      const cfg = statusConfig[t.status];
                      const isGet = t.direction === 'INCOME';
                      const isConfirmDelete = confirmDeleteId === t._id;
                      const isDeleting = deletingId === t._id;
                      const isUpdating = updatingId === t._id;

                      return (
                        <div
                          key={t._id}
                          className={`group relative rounded-2xl border transition-all duration-200 overflow-hidden ${
                            isConfirmDelete ? 'border-red-300 bg-red-50' : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                          }`}
                        >
                          {/* Left accent bar */}
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${isGet ? 'bg-rose-400' : 'bg-emerald-400'}`} />

                          <div className="pl-4 pr-4 py-3.5 flex items-center gap-3">
                            {/* Avatar */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isGet ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {getInitials(t.entityName)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-gray-900 text-sm">{t.entityName}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${isGet ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                  {isGet ? 'Will Get' : 'Will Give'}
                                </span>
                              </div>
                              {t.notes && <p className="text-xs text-gray-500 mt-0.5 truncate">{t.notes}</p>}
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-400">{new Date(t.transactionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                {t.dueDate && (
                                  <span className="text-xs text-amber-500">· Due {new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                )}
                              </div>
                            </div>

                            {/* Amount */}
                            <div className="text-right shrink-0">
                              <p className={`font-bold text-base ${isGet ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {isGet ? '+' : '-'}৳{t.amount.toLocaleString()}
                              </p>

                              {/* Status badge */}
                              {!isConfirmDelete && (
                                <div className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mt-1 border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                  <StatusIcon size={10} />
                                  {t.status}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions row */}
                          {isConfirmDelete ? (
                            <div className="px-4 pb-3 flex items-center gap-2">
                              <p className="text-sm text-red-600 flex-1">Delete this transaction?</p>
                              <button
                                onClick={() => handleDelete(t._id!)}
                                disabled={isDeleting}
                                className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 disabled:opacity-60 transition"
                              >
                                {isDeleting ? 'Deleting…' : 'Yes, Delete'}
                              </button>
                              <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200 transition">
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="px-4 pb-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                              {/* Quick status changes */}
                              {(['Pending', 'Paid', 'Cancelled'] as const).filter(s => s !== t.status).map(s => {
                                const c = statusConfig[s];
                                return (
                                  <button
                                    key={s}
                                    onClick={() => handleStatusChange(t._id!, s)}
                                    disabled={isUpdating}
                                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border font-medium transition ${c.bg} ${c.text} ${c.border} hover:opacity-80 disabled:opacity-50`}
                                  >
                                    <c.icon size={10} />
                                    {s}
                                  </button>
                                );
                              })}
                              <button
                                onClick={() => setConfirmDeleteId(t._id!)}
                                className="ml-auto p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DueHistoryModal;
