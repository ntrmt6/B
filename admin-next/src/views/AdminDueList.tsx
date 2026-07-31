import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, RefreshCw, TrendingUp, TrendingDown, ArrowRight,
  Clock, CheckCircle2, XCircle, CalendarRange, ChevronLeft, Users, Package, Briefcase, Minus, Trash2
} from 'lucide-react';
import { DueEntity, DueTransaction, EntityType } from '../types';
import AddNewDueModal from '../components/AddNewDueModal';
import DueHistoryModal from '../components/DueHistoryModal';
import { dueListService } from '../services/DueListService';

type TabFilter = 'All' | EntityType;

interface AdminDueListProps { user?: any; onLogout?: () => void; }

const TAB_CONFIG: { key: TabFilter; icon: React.ElementType; label: string }[] = [
  { key: 'All',      icon: Users,     label: 'All'       },
  { key: 'Customer', icon: Users,     label: 'Customers' },
  { key: 'Supplier', icon: Package,   label: 'Suppliers' },
  { key: 'Employee', icon: Briefcase, label: 'Employees' },
];

const TYPE_BADGE: Record<EntityType, string> = {
  Customer: 'bg-blue-50 text-blue-600',
  Supplier: 'bg-purple-50 text-purple-600',
  Employee: 'bg-amber-50 text-amber-700',
};

const STATUS_CONFIG = {
  Pending:   { icon: Clock,        bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200'   },
  Paid:      { icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Cancelled: { icon: XCircle,      bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200'    },
};

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function groupTransactionsByMonth(transactions: DueTransaction[]) {
  const groups: { label: string; transactions: DueTransaction[] }[] = [];
  const seen = new Map<string, number>();
  transactions.forEach(t => {
    const d = new Date(t.transactionDate);
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!seen.has(label)) { seen.set(label, groups.length); groups.push({ label, transactions: [] }); }
    groups[seen.get(label)!].transactions.push(t);
  });
  return groups;
}

const AdminDueList: React.FC<AdminDueListProps> = () => {
  const [activeTab, setActiveTab]             = useState<TabFilter>('All');
  const [showAddModal, setShowAddModal]       = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [entities, setEntities]               = useState<DueEntity[]>([]);
  const [transactions, setTransactions]       = useState<DueTransaction[]>([]);
  const [searchQuery, setSearchQuery]         = useState('');
  const [dateRange, setDateRange]             = useState({
    from: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0],
    to:   new Date().toISOString().split('T')[0],
  });
  const [selectedEntity, setSelectedEntity]   = useState<DueEntity | null>(null);
  const [loading, setLoading]                 = useState(false);
  const [txLoading, setTxLoading]             = useState(false);
  const [mobileDetail, setMobileDetail]       = useState(false);
  const [deletingId, setDeletingId]           = useState<string | null>(null);

  const totalWillGet  = entities.reduce((s, e) => s + (e.totalOwedToMe || 0), 0);
  const totalWillGive = entities.reduce((s, e) => s + (e.totalIOweThemNumber || 0), 0);
  const netBalance    = totalWillGet - totalWillGive;

  const fetchEntities = useCallback(async () => {
    setLoading(true);
    try {
      const type = activeTab === 'All' ? undefined : activeTab;
      setEntities(await dueListService.getEntities(type, searchQuery));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [activeTab, searchQuery]);

  const fetchTransactions = useCallback(async () => {
    if (!selectedEntity) { setTransactions([]); return; }
    setTxLoading(true);
    try { setTransactions(await dueListService.getTransactions(selectedEntity._id, dateRange.from, dateRange.to)); }
    catch (e) { console.error(e); }
    finally { setTxLoading(false); }
  }, [selectedEntity, dateRange]);

  useEffect(() => { setSelectedEntity(null); setTransactions([]); setMobileDetail(false); }, []);
  useEffect(() => { fetchEntities(); setSelectedEntity(null); setTransactions([]); setMobileDetail(false); }, [activeTab, searchQuery]);
  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const filteredEntities = entities.filter(e =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.phone.includes(searchQuery)
  );

  const entityGet  = selectedEntity ? transactions.filter(t => t.direction === 'INCOME').reduce((s, t) => s + t.amount, 0) : 0;
  const entityGive = selectedEntity ? transactions.filter(t => t.direction === 'EXPENSE').reduce((s, t) => s + t.amount, 0) : 0;
  const entityNet  = entityGet - entityGive;

  const selectEntity = (e: DueEntity) => { setSelectedEntity(e); setMobileDetail(true); };

  const handleDelete = async (e: React.MouseEvent, entity: DueEntity) => {
    e.stopPropagation();
    if (!confirm(`Delete "${entity.name}"? This will also remove all their transactions.`)) return;
    setDeletingId(entity._id);
    try {
      await dueListService.deleteEntity(entity._id);
      if (selectedEntity?._id === entity._id) {
        setSelectedEntity(null);
        setTransactions([]);
        setMobileDetail(false);
      }
      setEntities(prev => prev.filter(en => en._id !== entity._id));
    } catch (err) {
      alert('Failed to delete: ' + (err as any).message);
    } finally {
      setDeletingId(null);
    }
  };

  const groupedTx = groupTransactionsByMonth(transactions);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Top Header ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Due List</h1>
              <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">Track money you owe and are owed</p>
            </div>

            {/* Summary Chips */}
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
                <TrendingUp size={15} className="text-rose-500 shrink-0" />
                <div>
                  <p className="text-[10px] text-rose-500 font-medium leading-none">Will Get</p>
                  <p className="text-sm font-bold text-rose-700 leading-tight">৳{totalWillGet.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                <TrendingDown size={15} className="text-emerald-500 shrink-0" />
                <div>
                  <p className="text-[10px] text-emerald-500 font-medium leading-none">Will Give</p>
                  <p className="text-sm font-bold text-emerald-700 leading-tight">৳{totalWillGive.toLocaleString()}</p>
                </div>
              </div>
              <div className={`flex items-center gap-2 rounded-xl px-3 py-2 border ${netBalance >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
                <div>
                  <p className={`text-[10px] font-medium leading-none ${netBalance >= 0 ? 'text-blue-500' : 'text-orange-500'}`}>Net Balance</p>
                  <p className={`text-sm font-bold leading-tight ${netBalance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{netBalance >= 0 ? '+' : ''}৳{netBalance.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setShowHistoryModal(true)} className="px-3 sm:px-4 py-2 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition text-xs sm:text-sm">
                History
              </button>
              <button onClick={() => setShowAddModal(true)} className="px-3 sm:px-4 py-2 btn-theme-primary rounded-xl font-medium transition flex items-center gap-1.5 text-xs sm:text-sm">
                <Plus size={15} /><span className="hidden xs:inline">New Due</span><span className="xs:hidden">Add</span>
              </button>
            </div>
          </div>

          {/* Mobile summary strip */}
          <div className="md:hidden flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-100 rounded-lg px-3 py-1.5 shrink-0">
              <TrendingUp size={12} className="text-rose-500" />
              <span className="text-xs font-bold text-rose-700">৳{totalWillGet.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-1.5 shrink-0">
              <TrendingDown size={12} className="text-emerald-500" />
              <span className="text-xs font-bold text-emerald-700">৳{totalWillGive.toLocaleString()}</span>
            </div>
            <div className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 border shrink-0 ${netBalance >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
              <span className={`text-xs font-bold ${netBalance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Net {netBalance >= 0 ? '+' : ''}৳{Math.abs(netBalance).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
        <div className="flex gap-5 lg:gap-6">

          {/* ── Entity Sidebar ── */}
          <aside className={`w-full lg:w-72 xl:w-80 shrink-0 flex flex-col gap-2 ${mobileDetail ? 'hidden lg:flex' : 'flex'}`}>

            {/* Type Tabs */}
            <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-0.5">
              {TAB_CONFIG.map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[11px] font-semibold transition-all ${
                    activeTab === key
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={11} />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-primary/30 focus:border-theme-primary bg-white transition"
              />
              {searchQuery ? (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <XCircle size={14} />
                </button>
              ) : (
                <button onClick={fetchEntities} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <RefreshCw size={13} />
                </button>
              )}
            </div>

            {/* Entity List */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex-1">
              {loading ? (
                <div className="space-y-px p-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse flex gap-2.5 p-2.5 rounded-lg">
                      <div className="w-8 h-8 bg-gray-200 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1.5 py-0.5">
                        <div className="h-3 bg-gray-200 rounded w-2/3" />
                        <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredEntities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                    <Users size={18} className="text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm font-medium">No entries found</p>
                  {searchQuery && <p className="text-gray-400 text-xs mt-1">Try a different search</p>}
                </div>
              ) : (
                <div className="divide-y divide-gray-50 overflow-y-auto max-h-[calc(100vh-260px)]">
                  {filteredEntities.map(entity => {
                    const isSelected = selectedEntity?._id === entity._id;
                    const net = (entity.totalOwedToMe || 0) - (entity.totalIOweThemNumber || 0);
                    const isDeleting = deletingId === entity._id;
                    return (
                      <div
                        key={entity._id}
                        onClick={() => selectEntity(entity)}
                        className={`group relative flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-gray-900 text-white'
                            : 'hover:bg-gray-50 text-gray-900'
                        }`}
                      >
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {getInitials(entity.name)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className={`font-semibold text-[13px] truncate leading-tight ${isSelected ? 'text-white' : 'text-gray-900'}`}>{entity.name}</p>
                            {activeTab === 'All' && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${isSelected ? 'bg-white/20 text-white/80' : TYPE_BADGE[entity.type as EntityType] || ''}`}>
                                {entity.type.slice(0,3).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[11px] font-medium ${isSelected ? 'text-rose-300' : 'text-rose-600'}`}>
                              ↑৳{(entity.totalOwedToMe || 0).toLocaleString()}
                            </span>
                            <span className={`text-[11px] font-medium ${isSelected ? 'text-emerald-300' : 'text-emerald-600'}`}>
                              ↓৳{(entity.totalIOweThemNumber || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Net + delete */}
                        <div className="flex items-center gap-1 shrink-0">
                          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-lg ${
                            net > 0
                              ? isSelected ? 'bg-rose-500/30 text-rose-200' : 'bg-rose-50 text-rose-700'
                              : net < 0
                              ? isSelected ? 'bg-emerald-500/30 text-emerald-200' : 'bg-emerald-50 text-emerald-700'
                              : isSelected ? 'bg-white/10 text-white/60' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {net > 0 ? '+' : ''}৳{Math.abs(net).toLocaleString()}
                          </span>

                          <button
                            onClick={e => handleDelete(e, entity)}
                            disabled={isDeleting}
                            className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg ${
                              isSelected
                                ? 'hover:bg-white/20 text-white/60 hover:text-white'
                                : 'hover:bg-rose-50 text-gray-300 hover:text-rose-500'
                            } ${isDeleting ? 'opacity-100' : ''}`}
                          >
                            {isDeleting
                              ? <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                              : <Trash2 size={13} />
                            }
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          {/* ── Transaction Detail ── */}
          <main className={`flex-1 min-w-0 flex flex-col gap-4 ${!mobileDetail && selectedEntity ? 'hidden lg:flex' : mobileDetail ? 'flex' : 'hidden lg:flex'}`}>

            {!selectedEntity ? (
              <div className="flex-1 bg-white border border-gray-200 rounded-2xl flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-5">
                  <Users size={32} className="text-gray-300" />
                </div>
                <p className="text-gray-600 font-semibold text-lg">Select a person</p>
                <p className="text-gray-400 text-sm mt-1">Choose someone from the list to see their transactions</p>
              </div>
            ) : (
              <>
                {/* Entity header card */}
                <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5">
                  <div className="flex items-center gap-4">
                    <button onClick={() => { setMobileDetail(false); setSelectedEntity(null); }} className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition -ml-1">
                      <ChevronLeft size={20} className="text-gray-600" />
                    </button>
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gray-900 text-white flex items-center justify-center text-sm font-bold shrink-0">
                      {getInitials(selectedEntity.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="font-bold text-gray-900 text-lg sm:text-xl truncate">{selectedEntity.name}</h2>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${TYPE_BADGE[selectedEntity.type as EntityType] || 'bg-gray-100 text-gray-600'}`}>
                          {selectedEntity.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">{selectedEntity.phone}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
                    <div className="text-center">
                      <p className="text-xs text-gray-400 font-medium">Will Get</p>
                      <p className="text-base sm:text-lg font-bold text-rose-600 mt-0.5">৳{entityGet.toLocaleString()}</p>
                    </div>
                    <div className="text-center border-x border-gray-100">
                      <p className="text-xs text-gray-400 font-medium">Will Give</p>
                      <p className="text-base sm:text-lg font-bold text-emerald-600 mt-0.5">৳{entityGive.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400 font-medium">Net</p>
                      <p className={`text-base sm:text-lg font-bold mt-0.5 ${entityNet >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {entityNet >= 0 ? '+' : ''}৳{entityNet.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Date filter */}
                <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <CalendarRange size={15} />
                    <span className="text-xs font-medium">Range</span>
                  </div>
                  <div className="flex items-center gap-2 flex-1 flex-wrap">
                    <input
                      type="date"
                      value={dateRange.from}
                      onChange={e => setDateRange(d => ({ ...d, from: e.target.value }))}
                      className="flex-1 min-w-0 text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-primary/30 focus:border-theme-primary"
                    />
                    <Minus size={12} className="text-gray-300 shrink-0" />
                    <input
                      type="date"
                      value={dateRange.to}
                      onChange={e => setDateRange(d => ({ ...d, to: e.target.value }))}
                      className="flex-1 min-w-0 text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-primary/30 focus:border-theme-primary"
                    />
                  </div>
                  <button onClick={fetchTransactions} className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-400 hover:text-gray-600">
                    <RefreshCw size={14} />
                  </button>
                </div>

                {/* Transactions */}
                <div className="flex-1 bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  {txLoading ? (
                    <div className="space-y-3 p-5">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="animate-pulse flex gap-3 p-4 border border-gray-100 rounded-xl">
                          <div className="w-2 h-full bg-gray-200 rounded" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-2/3" />
                            <div className="h-3 bg-gray-100 rounded w-1/3" />
                          </div>
                          <div className="h-5 bg-gray-200 rounded w-20" />
                        </div>
                      ))}
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <CalendarRange size={22} className="text-gray-300" />
                      </div>
                      <p className="text-gray-500 font-semibold">No transactions</p>
                      <p className="text-gray-400 text-sm mt-1">Try adjusting the date range or add a new due</p>
                      <button onClick={() => setShowAddModal(true)} className="mt-4 flex items-center gap-1.5 text-sm font-semibold btn-theme-primary px-4 py-2 rounded-xl">
                        <Plus size={14} /> Add Transaction
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-y-auto max-h-[calc(100vh-380px)] p-4 sm:p-5 space-y-5">
                      {groupedTx.map(({ label, transactions: group }) => (
                        <div key={label}>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
                            <div className="flex-1 h-px bg-gray-100" />
                            <span className="text-xs text-gray-400">{group.length} tx</span>
                          </div>

                          <div className="space-y-2">
                            {group.map(tx => {
                              const isGet = tx.direction === 'INCOME';
                              const cfg = STATUS_CONFIG[tx.status];
                              const StatusIcon = cfg.icon;
                              return (
                                <div
                                  key={tx._id}
                                  className="group flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all relative overflow-hidden"
                                >
                                  <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${isGet ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                                  <div className={`pl-1 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isGet ? 'bg-rose-50' : 'bg-emerald-50'}`}>
                                    {isGet
                                      ? <TrendingUp size={16} className="text-rose-500" />
                                      : <TrendingDown size={16} className="text-emerald-500" />
                                    }
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{tx.notes || 'Transaction'}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-xs text-gray-400">
                                        {new Date(tx.transactionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </span>
                                      {tx.dueDate && (
                                        <span className="text-xs text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">
                                          Due {new Date(tx.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className={`text-sm font-bold ${isGet ? 'text-rose-600' : 'text-emerald-600'}`}>
                                      {isGet ? '+' : '-'}৳{tx.amount.toLocaleString()}
                                    </p>
                                    <div className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full mt-1 border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                      <StatusIcon size={9} />
                                      {tx.status}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {/* FAB (mobile, when entity selected) */}
      {selectedEntity && mobileDetail && (
        <button
          onClick={() => setShowAddModal(true)}
          className="fixed bottom-20 left-5 z-40 lg:hidden w-14 h-14 btn-theme-primary rounded-full shadow-xl flex items-center justify-center"
        >
          <Plus size={22} />
        </button>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddNewDueModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={async data => {
            try {
              await dueListService.createTransaction(data);
              setShowAddModal(false);
              fetchEntities();
              if (selectedEntity?.name === data.entityName) fetchTransactions();
            } catch (e) {
              console.error(e);
              alert('Failed to save transaction');
            }
          }}
        />
      )}

      {showHistoryModal && (
        <DueHistoryModal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          onRefresh={fetchEntities}
          entityId={selectedEntity?._id}
          entityName={selectedEntity?.name}
        />
      )}
    </div>
  );
};

export default AdminDueList;
