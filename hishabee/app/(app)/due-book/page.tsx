'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchEntities, createEntity, deleteEntity, fetchTransactions, createTransaction, type Entity, type Transaction } from '@/lib/services/entities';
import { formatCurrency } from '@/lib/tenant-config';
import {
  BookOpen, Plus, Search, RefreshCcw, FileText,
  X, Package, Banknote, Calendar, StickyNote, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ─── helpers ─── */
function getTransactionKey(tx: Transaction, index: number) {
  return tx._id || tx.id || `${tx.entityId}-${tx.date}-${tx.amount}-${index}`;
}
function getInitial(name: string) {
  return (name || '?').charAt(0).toUpperCase();
}

/* ─── main page ─── */
export default function DueBookPage() {
  const { tenantId, tenantConfig } = useAuth();
  const fc = (n: number) => formatCurrency(n, tenantConfig.currency);
  const entityTypes = tenantConfig.entityTypes;

  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState(entityTypes[0] || 'Customer');
  const [search, setSearch] = useState('');
  const [showAddEntity, setShowAddEntity] = useState(false);
  const [showNewDueModal, setShowNewDueModal] = useState(false);
  const [showMoneyEntry, setShowMoneyEntry] = useState<'given' | 'received' | null>(null);

  /* ─── data loading ─── */
  const loadEntities = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const data = await fetchEntities(tenantId);
      setEntities(data);
    } catch {
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { loadEntities(); }, [loadEntities]);

  const loadTransactions = useCallback(async (entityId: string) => {
    if (!tenantId) return;
    setTxLoading(true);
    try {
      const data = await fetchTransactions(tenantId, entityId);
      setTransactions(data);
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setTxLoading(false);
    }
  }, [tenantId]);

  const selectEntity = (entity: Entity) => {
    setSelectedEntity(entity);
    loadTransactions(entity._id);
  };

  /* ─── filtered lists ─── */
  const filteredEntities = useMemo(() => {
    return entities.filter(e => {
      const matchTab = e.type?.toLowerCase() === activeTab.toLowerCase();
      const matchSearch = !search ||
        e.name?.toLowerCase().includes(search.toLowerCase()) ||
        e.phone?.includes(search);
      return matchTab && matchSearch;
    });
  }, [entities, activeTab, search]);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    entityTypes.forEach(t => {
      counts[t] = entities.filter(e => e.type?.toLowerCase() === t.toLowerCase()).length;
    });
    return counts;
  }, [entities, entityTypes]);

  const totalGet = entities.reduce((s, e) => s + (e.totalOwedToMe || 0), 0);
  const totalGive = entities.reduce((s, e) => s + (e.totalIOweThemNumber || 0), 0);

  /* ─── actions ─── */
  const handleAddEntity = async (name: string, phone: string, type: string) => {
    if (!tenantId) return;
    try {
      await createEntity(tenantId, { name, phone, type: type as Entity['type'], totalOwedToMe: 0, totalIOweThemNumber: 0 });
      toast.success('Contact added');
      setShowAddEntity(false);
      loadEntities();
    } catch {
      toast.error('Failed to add contact');
    }
  };

  const handleDeleteEntity = async (id: string) => {
    if (!tenantId || !confirm('Delete this contact and all transactions?')) return;
    try {
      await deleteEntity(tenantId, id);
      setEntities(prev => prev.filter(e => e._id !== id));
      if (selectedEntity?._id === id) {
        setSelectedEntity(null);
        setTransactions([]);
      }
      toast.success('Contact deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleAddTransaction = async (type: 'due' | 'payment', amount: number, description: string) => {
    if (!tenantId || !selectedEntity) return;
    try {
      await createTransaction(tenantId, {
        entityId: selectedEntity._id,
        type,
        amount,
        description,
        date: new Date().toISOString(),
      });
      toast.success('Transaction added');
      setShowMoneyEntry(null);
      loadTransactions(selectedEntity._id);
      loadEntities();
    } catch {
      toast.error('Failed to add transaction');
    }
  };

  /* ─── running balance for table ─── */
  const txWithBalance = useMemo(() => {
    let balance = 0;
    return transactions.map(tx => {
      const got = tx.type === 'due' ? tx.amount : 0;
      const gave = tx.type === 'payment' ? tx.amount : 0;
      balance += got - gave;
      return { ...tx, got, gave, balance };
    });
  }, [transactions]);

  const txTotalGot = txWithBalance.reduce((s, t) => s + t.got, 0);
  const txTotalGave = txWithBalance.reduce((s, t) => s + t.gave, 0);
  const txBalance = txTotalGot - txTotalGave;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-gray-50">
      {/* ─── Top Header ─── */}
      <div className="flex-shrink-0 bg-white border-b px-4 md:px-6 py-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 max-w-[1600px] mx-auto">
          <div className="flex items-center gap-2">
            <BookOpen size={22} className="text-orange-500" />
            <h1 className="text-lg font-bold text-gray-900">Due List</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center border border-orange-200 text-orange-600 px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-50">
              You Will Get : {fc(totalGet)}
            </span>
            <span className="inline-flex items-center border border-sky-200 text-sky-600 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-50">
              You Will Give : {fc(totalGive)}
            </span>
            <button
              onClick={() => {
                if (!selectedEntity) { toast.error('Select a contact first'); return; }
                setShowNewDueModal(true);
              }}
              className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-800 transition"
            >
              <Plus size={14} /> New Due
            </button>
          </div>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex overflow-hidden max-w-[1600px] mx-auto w-full">
        {/* ─── Left Panel: Contact List ─── */}
        <div className="w-full sm:w-80 md:w-96 flex-shrink-0 flex flex-col border-r bg-white">
          {/* Tabs */}
          <div className="flex border-b px-3 pt-3">
            {entityTypes.map(type => (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={`pb-2 px-3 text-sm font-medium transition-colors relative ${
                  activeTab === type
                    ? 'text-gray-900'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {type}
                {tabCounts[type] > 0 && (
                  <sup className="ml-0.5 text-[10px] text-gray-400">({tabCounts[type]})</sup>
                )}
                {activeTab === type && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Search + actions */}
          <div className="flex items-center gap-2 px-3 py-2.5">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or phone number"
                className="w-full pl-8 pr-3 py-2 border rounded-lg text-xs focus:ring-1 focus:ring-sky-400 focus:border-sky-400 outline-none"
              />
            </div>
            <button onClick={loadEntities} className="p-2 border rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50">
              <RefreshCcw size={14} />
            </button>
            <button
              onClick={() => setShowAddEntity(true)}
              className="p-2 border rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Add Entity Inline Form */}
          {showAddEntity && (
            <AddEntityForm
              entityTypes={entityTypes}
              activeTab={activeTab}
              onSave={handleAddEntity}
              onCancel={() => setShowAddEntity(false)}
            />
          )}

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-3 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                    <div className="w-9 h-9 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                      <div className="h-2.5 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredEntities.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                No {activeTab.toLowerCase()}s yet
              </div>
            ) : (
              <div className="divide-y">
                {filteredEntities.map(entity => {
                  const due = (entity.totalOwedToMe || 0) + (entity.totalIOweThemNumber || 0);
                  const isGet = (entity.totalOwedToMe || 0) > 0;
                  const isSelected = selectedEntity?._id === entity._id;
                  return (
                    <button
                      key={entity._id}
                      onClick={() => selectEntity(entity)}
                      className={`w-full flex items-center gap-3 px-3 py-3 text-left transition hover:bg-gray-50 ${
                        isSelected ? 'bg-sky-50/60' : ''
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-gray-500">
                        {getInitial(entity.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{entity.name}</p>
                        <p className="text-[11px] text-gray-400 truncate">{entity.phone || entity.type}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`text-sm font-bold ${isGet ? 'text-orange-500' : due < 0 ? 'text-sky-500' : 'text-gray-400'}`}>
                          {fc(Math.abs(due))}
                        </span>
                        {due !== 0 && (
                          <p className={`text-[10px] mt-0.5 px-1.5 py-0.5 rounded-full font-medium inline-block ${
                            isGet ? 'bg-orange-50 text-orange-500' : 'bg-sky-50 text-sky-500'
                          }`}>
                            {isGet ? 'Given' : 'Received'}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ─── Right Panel: Transaction Details ─── */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {selectedEntity ? (
            <>
              {/* Entity Header */}
              <div className="flex-shrink-0 px-4 md:px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button onClick={() => { setSelectedEntity(null); setTransactions([]); }} className="text-gray-400 hover:text-gray-600 lg:hidden">
                    <X size={18} />
                  </button>
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-500">
                    {getInitial(selectedEntity.name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 text-sm">{selectedEntity.name}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-600 uppercase tracking-wide">
                        {selectedEntity.type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{selectedEntity.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Balance</span>
                  <span className={`text-lg font-bold ${txBalance >= 0 ? 'text-orange-500' : 'text-sky-500'}`}>
                    {fc(Math.abs(txBalance))}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => loadTransactions(selectedEntity._id)}
                    className="p-2 border rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                    title="Refresh"
                  >
                    <RefreshCcw size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteEntity(selectedEntity._id)}
                    className="p-2 border border-red-200 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"
                    title="Delete contact"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="flex-1 overflow-y-auto">
                {txLoading ? (
                  <div className="p-6 space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
                    ))}
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                    <FileText size={40} className="text-gray-200" />
                    <p className="text-sm">No transactions yet</p>
                    <button
                      onClick={() => setShowNewDueModal(true)}
                      className="mt-2 text-xs text-sky-500 hover:text-sky-600 font-medium"
                    >
                      + Add first transaction
                    </button>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left px-4 md:px-6 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Due History</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-orange-500 uppercase tracking-wider">You Got</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-sky-500 uppercase tracking-wider">You Gave</th>
                        <th className="text-right px-4 md:px-6 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {txWithBalance.map((tx, index) => (
                        <tr key={getTransactionKey(tx, index)} className="hover:bg-gray-50/50">
                          <td className="px-4 md:px-6 py-3">
                            <p className="text-sm text-gray-700">
                              {new Date(tx.date || tx.createdAt).toLocaleDateString('en-US', {
                                day: '2-digit', month: 'short', year: 'numeric',
                              })},&nbsp;
                              {new Date(tx.date || tx.createdAt).toLocaleTimeString('en-US', {
                                hour: '2-digit', minute: '2-digit', hour12: true,
                              })}
                            </p>
                            {tx.description && (
                              <p className="text-[11px] text-gray-400 mt-0.5">Note: {tx.description}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {tx.got > 0 && <span className="text-orange-500 font-medium">{fc(tx.got)}</span>}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {tx.gave > 0 && <span className="text-sky-500 font-medium">{fc(tx.gave)}</span>}
                          </td>
                          <td className="px-4 md:px-6 py-3 text-right font-medium text-gray-700">{fc(Math.abs(tx.balance))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Bottom Bar: Total + Action Buttons */}
              <div className="flex-shrink-0 border-t bg-white">
                {transactions.length > 0 && (
                  <div className="flex items-center px-4 md:px-6 py-2 text-sm bg-gray-50 border-b">
                    <span className="flex-1 font-semibold text-gray-600">Total</span>
                    <span className="w-28 text-right font-bold text-orange-500">{fc(txTotalGot)}</span>
                    <span className="w-28 text-right font-bold text-sky-500">{fc(txTotalGave)}</span>
                    <span className="w-32 text-right font-bold text-gray-700">{fc(Math.abs(txBalance))}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 p-3 md:p-4">
                  <button
                    onClick={() => setShowMoneyEntry('given')}
                    className="py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 shadow-sm transition-all active:scale-[0.98]"
                  >
                    Given
                  </button>
                  <button
                    onClick={() => setShowMoneyEntry('received')}
                    className="py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600 shadow-sm transition-all active:scale-[0.98]"
                  >
                    Received
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
              <BookOpen size={48} className="text-gray-200" />
              <p className="text-sm">Select a contact to view transactions</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── New Due Type Modal ─── */}
      {showNewDueModal && selectedEntity && (
        <NewDueModal
          onClose={() => setShowNewDueModal(false)}
          onSelectMoney={(direction) => {
            setShowNewDueModal(false);
            setShowMoneyEntry(direction);
          }}
        />
      )}

      {/* ─── Money Entry Sidebar ─── */}
      {showMoneyEntry && selectedEntity && (
        <MoneyEntryDrawer
          direction={showMoneyEntry}
          entity={selectedEntity}
          onSave={(amount, note) => {
            const type = showMoneyEntry === 'given' ? 'payment' : 'due';
            handleAddTransaction(type, amount, note);
          }}
          onClose={() => setShowMoneyEntry(null)}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SUB COMPONENTS
   ═══════════════════════════════════════════════════ */

/* ─── Add Entity Inline Form ─── */
function AddEntityForm({ entityTypes, activeTab, onSave, onCancel }: {
  entityTypes: string[];
  activeTab: string;
  onSave: (name: string, phone: string, type: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState(activeTab);

  return (
    <div className="px-3 pb-3 border-b bg-gray-50/50">
      <div className="space-y-2">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Name *"
          className="w-full border rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-sky-400"
          autoFocus
        />
        <input
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="Phone *"
          className="w-full border rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-sky-400"
        />
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-sky-400"
        >
          {entityTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => {
            if (!name || !phone) { toast.error('Name and phone are required'); return; }
            onSave(name, phone, type);
          }}
          className="flex-1 bg-gray-900 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-gray-800"
        >
          Save
        </button>
        <button onClick={onCancel} className="px-3 py-2 border rounded-lg text-xs hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ─── New Due Type Modal ─── */
function NewDueModal({ onClose, onSelectMoney }: {
  onClose: () => void;
  onSelectMoney: (direction: 'given' | 'received') => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [dueType, setDueType] = useState<'product' | 'money' | null>(null);
  const [direction, setDirection] = useState<'given' | 'received'>('given');

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <h2 className="text-lg font-bold text-gray-900">Select the due type</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 pb-6">
          {/* Step 1: Due type cards */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <button
              onClick={() => { setDueType('product'); setStep(2); }}
              className={`border-2 rounded-xl p-5 flex flex-col items-center gap-3 transition-all ${
                dueType === 'product' ? 'border-sky-400 bg-sky-50/50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                <Package size={24} className="text-orange-500" />
              </div>
              <span className="text-sm font-semibold text-gray-700">Product Due</span>
            </button>
            <button
              onClick={() => { setDueType('money'); setStep(2); }}
              className={`border-2 rounded-xl p-5 flex flex-col items-center gap-3 transition-all ${
                dueType === 'money' ? 'border-sky-400 bg-sky-50/50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center">
                <Banknote size={24} className="text-sky-500" />
              </div>
              <span className="text-sm font-semibold text-gray-700">Money Due</span>
            </button>
          </div>

          {/* Step 2: Direction */}
          {step === 2 && dueType === 'money' && (
            <div className="mt-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Due Type</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDirection('given')}
                  className={`border-2 rounded-xl p-4 text-left transition-all ${
                    direction === 'given'
                      ? 'border-orange-400 bg-orange-50/50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      direction === 'given' ? 'border-orange-500' : 'border-gray-300'
                    }`}>
                      {direction === 'given' && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                    </div>
                    <span className="font-semibold text-sm text-gray-800">Given</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1 ml-6">You give money</p>
                </button>
                <button
                  onClick={() => setDirection('received')}
                  className={`border-2 rounded-xl p-4 text-left transition-all ${
                    direction === 'received'
                      ? 'border-sky-400 bg-sky-50/50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      direction === 'received' ? 'border-sky-500' : 'border-gray-300'
                    }`}>
                      {direction === 'received' && <div className="w-2 h-2 rounded-full bg-sky-500" />}
                    </div>
                    <span className="font-semibold text-sm text-gray-800">Received</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1 ml-6">You received money</p>
                </button>
              </div>
            </div>
          )}

          {/* Continue */}
          <button
            onClick={() => {
              if (!dueType) { toast.error('Select a due type'); return; }
              if (dueType === 'product') { toast('Product due coming soon', { icon: '📦' }); onClose(); return; }
              onSelectMoney(direction);
            }}
            disabled={!dueType}
            className={`w-full mt-5 py-3 rounded-xl text-sm font-bold transition-all ${
              dueType
                ? 'bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.98]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Money Entry Drawer ─── */
function MoneyEntryDrawer({ direction, entity, onSave, onClose }: {
  direction: 'given' | 'received';
  entity: Entity;
  onSave: (amount: number, note: string) => void;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const isGiven = direction === 'given';
  const accentColor = isGiven ? 'orange' : 'sky';

  const handleSave = async () => {
    if (!amount || Number(amount) <= 0) { toast.error('Enter a valid amount'); return; }
    setSaving(true);
    try {
      await onSave(Number(amount), note);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Drawer */}
      <div
        className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className={`text-lg font-bold ${isGiven ? 'text-orange-500' : 'text-sky-500'}`}>
            Money {isGiven ? 'Given' : 'Received'} Entry
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Entity info */}
        <div className="px-5 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500">
              {getInitial(entity.name)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-gray-900">{entity.name}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${
                  isGiven ? 'bg-orange-100 text-orange-600' : 'bg-sky-100 text-sky-600'
                }`}>
                  {entity.type}
                </span>
              </div>
              <p className="text-xs text-gray-400">{entity.phone}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Date */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Date</label>
            <div className="flex items-center border rounded-xl px-4 py-3 bg-gray-50">
              <Calendar size={16} className="text-gray-400 mr-2" />
              <span className="text-sm text-gray-600">
                {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
              Amount <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Amount"
              className={`w-full border-2 rounded-xl px-4 py-3 text-sm outline-none transition focus:border-${accentColor}-400 focus:ring-1 focus:ring-${accentColor}-200`}
              autoFocus
            />
          </div>

          {/* Note */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Note</label>
            <div className="flex items-center border rounded-xl overflow-hidden">
              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Note"
                className="flex-1 px-4 py-3 text-sm outline-none"
              />
              <div className="px-3 text-gray-300">
                <StickyNote size={16} />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex-shrink-0 px-5 pb-5 pt-3 border-t">
          <button
            onClick={handleSave}
            disabled={saving || !amount}
            className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98] ${
              saving || !amount
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
