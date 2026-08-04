'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Plus, Search, X, ChevronLeft, LogOut,
  TrendingUp, TrendingDown, UserPlus, Trash2, CheckCircle2, Circle,
} from 'lucide-react';

/* ─── Types ─── */
interface Entity {
  _id: string; name: string; phone?: string;
  type: 'Customer' | 'Supplier' | 'Employee';
  totalOwedToMe: number; totalIOweThemNumber: number;
}

interface Transaction {
  _id: string; amount: number;
  direction: 'INCOME' | 'EXPENSE';
  transactionDate: string; notes?: string;
  status: 'Pending' | 'Paid' | 'Cancelled';
}

const TYPES: Entity['type'][] = ['Customer', 'Supplier', 'Employee'];
const AVATAR_COLORS = ['#0ea5e9','#8b5cf6','#10b981','#f59e0b','#ec4899','#6366f1'];
const avatarColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
const initial = (name: string) => (name || '?')[0].toUpperCase();
const fmt = (n: number) => '৳' + Math.abs(n).toLocaleString('en-IN');
const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-GB', { day:'2-digit', month:'short' });

/* ─── API helpers ─── */
const getEntities = async (tid: string): Promise<Entity[]> => {
  const r = await api.get('/entities', { headers: { 'X-Tenant-Id': tid } });
  return r.data?.entities || r.data || [];
};
const getTx = async (tid: string, entityId: string): Promise<Transaction[]> => {
  const r = await api.get('/transactions', { params: { entityId }, headers: { 'X-Tenant-Id': tid } });
  return r.data?.transactions || r.data || [];
};
const addTx = async (tid: string, payload: object) =>
  api.post('/transactions', payload, { headers: { 'X-Tenant-Id': tid } });
const addEntity = async (tid: string, payload: object) =>
  api.post('/entities', payload, { headers: { 'X-Tenant-Id': tid } });
const deleteEntity = async (tid: string, id: string) =>
  api.delete(`/entities/${id}`, { headers: { 'X-Tenant-Id': tid } });
const patchTxStatus = async (tid: string, txId: string, status: 'Pending' | 'Paid') =>
  api.patch(`/transactions/${txId}`, { status }, { headers: { 'X-Tenant-Id': tid } });

/* ══════════════════════════════════════════ */
export default function DueBookPage() {
  const { user, tenantId, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Entity['type']>('Customer');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Entity | null>(null);
  const [transactions, setTx] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  /* modal: add transaction */
  const [showAdd, setShowAdd] = useState(false);
  const [addDir, setAddDir] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [addAmount, setAddAmount] = useState('');
  const [addNote, setAddNote] = useState('');
  const [addDate, setAddDate] = useState(new Date().toISOString().split('T')[0]);
  const [addSaving, setAddSaving] = useState(false);

  /* modal: add entity */
  const [showAddEntity, setShowAddEntity] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newType, setNewType] = useState<Entity['type']>('Customer');
  const [entitySaving, setEntitySaving] = useState(false);

  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);
  const txListRef = useRef<HTMLDivElement>(null);

  const TODAY = new Date().toISOString().split('T')[0];
  const YESTERDAY = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  useEffect(() => {
    if (!authLoading && !user) window.location.replace('/login');
  }, [authLoading, user]);

  // Safety net: if auth never resolves (e.g. WebView localStorage blocked), redirect after 3s
  useEffect(() => {
    const t = setTimeout(() => {
      if (!user) window.location.replace('/login');
    }, 3000);
    return () => clearTimeout(t);
  }, [user]);

  const loadEntities = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try { setEntities(await getEntities(tenantId)); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [tenantId]);

  useEffect(() => { loadEntities(); }, [loadEntities]);

  // Android hardware back button intercept.
  // Only listen — never call replaceState, which would corrupt Next.js Router's history state.
  // History entries are pushed explicitly in selectEntity and openAdd.
  useEffect(() => {
    const onPop = () => {
      if (showAdd) { setShowAdd(false); window.history.pushState({ duebook: 'modal' }, ''); return; }
      if (showAddEntity) { setShowAddEntity(false); window.history.pushState({ duebook: 'modal' }, ''); return; }
      if (selected) { setSelected(null); setTx([]); window.history.pushState({ duebook: 'list' }, ''); return; }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [showAdd, showAddEntity, selected]);

  const loadTx = useCallback(async (entity: Entity) => {
    if (!tenantId) return;
    setTxLoading(true);
    try { setTx(await getTx(tenantId, entity._id)); }
    catch { toast.error('Failed to load transactions'); }
    finally { setTxLoading(false); }
  }, [tenantId]);

  const selectEntity = (entity: Entity) => {
    setSelected(entity);
    loadTx(entity);
    window.history.pushState({ duebook: 'detail' }, '');
  };

  const filtered = useMemo(() => entities.filter(e => {
    const matchTab = e.type?.toLowerCase() === tab.toLowerCase();
    if (!search) return matchTab;
    return matchTab && (
      e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.phone?.includes(search)
    );
  }), [entities, tab, search]);

  const totalGet = entities.reduce((s, e) => s + (e.totalOwedToMe || 0), 0);
  const totalGive = entities.reduce((s, e) => s + (e.totalIOweThemNumber || 0), 0);

  const txWithBal = useMemo(() => {
    let bal = 0;
    return [...transactions]
      .sort((a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime())
      .map(tx => {
        if (tx.status === 'Pending') { const d = tx.direction === 'INCOME' ? tx.amount : -tx.amount; bal += d; }
        return { ...tx, bal };
      });
  }, [transactions]);

  // Scroll to bottom of transaction list so the most recent entry is visible
  useEffect(() => {
    if (txListRef.current && txWithBal.length > 0) {
      txListRef.current.scrollTop = txListRef.current.scrollHeight;
    }
  }, [txWithBal]);

  const handleAddTx = async () => {
    if (!selected || !tenantId || !addAmount) return;
    const amt = parseFloat(addAmount);
    if (isNaN(amt) || amt <= 0) { toast.error('Enter valid amount'); return; }
    setAddSaving(true);
    try {
      await addTx(tenantId, {
        entityId: selected._id, entityName: selected.name,
        amount: amt, direction: addDir,
        transactionDate: addDate, notes: addNote || undefined,
      });
      toast.success('Saved');
      setShowAdd(false);
      setAddAmount(''); setAddNote('');
      setAddDate(new Date().toISOString().split('T')[0]);
      const updated = await getEntities(tenantId);
      setEntities(updated);
      const fresh = updated.find(e => e._id === selected._id);
      if (fresh) setSelected(fresh);
      await loadTx(fresh || selected);
    } catch { toast.error('Failed to save'); }
    finally { setAddSaving(false); }
  };

  const handleAddEntity = async () => {
    if (!tenantId || !newName || !newPhone) { toast.error('Name and phone required'); return; }
    setEntitySaving(true);
    try {
      await addEntity(tenantId, { name: newName, phone: newPhone, type: newType });
      toast.success('Added');
      setShowAddEntity(false); setNewName(''); setNewPhone('');
      await loadEntities();
    } catch { toast.error('Failed to add'); }
    finally { setEntitySaving(false); }
  };

  const handleDeleteEntity = async (entity: Entity) => {
    if (!tenantId || !confirm(`Delete ${entity.name}?`)) return;
    try {
      await deleteEntity(tenantId, entity._id);
      setSelected(null); setTx([]);
      await loadEntities();
      toast.success('Deleted');
    } catch { toast.error('Cannot delete — has transactions'); }
  };

  const handleMarkPaid = async (tx: Transaction & { bal: number }) => {
    if (!tenantId || markingPaid) return;
    const newStatus = tx.status === 'Paid' ? 'Pending' : 'Paid';
    setMarkingPaid(tx._id);
    try {
      await patchTxStatus(tenantId, tx._id, newStatus);
      toast.success(newStatus === 'Paid' ? 'Marked as paid' : 'Marked as pending');
      const updated = await getEntities(tenantId);
      setEntities(updated);
      const fresh = updated.find(e => e._id === selected?._id);
      if (fresh) setSelected(fresh);
      if (selected) await loadTx(fresh || selected);
    } catch { toast.error('Failed to update'); }
    finally { setMarkingPaid(null); }
  };

  const openAdd = (dir: 'INCOME' | 'EXPENSE') => {
    setAddDir(dir); setAddAmount(''); setAddNote('');
    setAddDate(new Date().toISOString().split('T')[0]);
    setShowAdd(true);
    window.history.pushState({ duebook: 'modal' }, '');
  };

  if (authLoading) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', gap: 16 }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#00900a,#1e90ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>৳</span>
      </div>
      <div style={{ width: 28, height: 28, border: '3px solid #0ea5e9', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  );

  if (!user) return null;

  return (
    <div className="h-screen flex flex-col bg-gray-50 max-w-sm mx-auto relative overflow-hidden">

      {/* ── TOP BAR ── */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-3 h-10 flex items-center justify-between">
        {selected ? (
          <button onClick={() => { setSelected(null); setTx([]); }}
            className="flex items-center gap-1 text-sky-500 font-semibold text-[13px]">
            <ChevronLeft size={16} /> Back
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-md bg-sky-500 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">DB</span>
            </div>
            <span className="text-[14px] font-bold text-gray-900">DueBook</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          {!selected && (
            <>
              <button onClick={() => { setShowSearch(!showSearch); setTimeout(() => searchRef.current?.focus(), 50); }}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                <Search size={15} />
              </button>
              <button onClick={() => { setNewType(tab); setShowAddEntity(true); }}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-sky-500 text-white">
                <UserPlus size={13} />
              </button>
            </>
          )}
          {selected && (
            <button onClick={() => handleDeleteEntity(selected)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50">
              <Trash2 size={14} />
            </button>
          )}
          <button onClick={() => { logout(); router.replace('/login'); }}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
            <LogOut size={14} />
          </button>
        </div>
      </div>

      {/* ── SUMMARY ROW ── */}
      {!selected && (
        <div className="flex-shrink-0 flex gap-2 px-3 py-1.5 bg-white border-b border-gray-100">
          <div className="flex-1 flex items-center gap-1.5 bg-green-50 rounded-lg px-2.5 py-1.5">
            <TrendingUp size={12} className="text-green-600 shrink-0" />
            <div>
              <p className="text-[10px] text-green-700 font-medium leading-none">Will Get</p>
              <p className="text-[13px] font-bold text-green-700 tabular-nums leading-tight">{fmt(totalGet)}</p>
            </div>
          </div>
          <div className="flex-1 flex items-center gap-1.5 bg-red-50 rounded-lg px-2.5 py-1.5">
            <TrendingDown size={12} className="text-red-600 shrink-0" />
            <div>
              <p className="text-[10px] text-red-700 font-medium leading-none">Will Give</p>
              <p className="text-[13px] font-bold text-red-700 tabular-nums leading-tight">{fmt(totalGive)}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── ENTITY TABS ── */}
      {!selected && (
        <>
          <div className="flex-shrink-0 flex bg-white border-b border-gray-100">
            {TYPES.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 text-[12px] font-semibold border-b-2 transition-colors ${
                  tab === t ? 'text-sky-500 border-sky-500' : 'text-gray-400 border-transparent'
                }`}>
                {t}
              </button>
            ))}
          </div>
          {showSearch && (
            <div className="flex-shrink-0 px-3 py-1.5 bg-white border-b border-gray-100">
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2.5 py-1.5">
                <Search size={13} className="text-gray-400 shrink-0" />
                <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
                  placeholder={`Search ${tab.toLowerCase()}s…`}
                  className="flex-1 bg-transparent text-[12px] outline-none border-none text-gray-900"
                  style={{ background: 'transparent' }}
                />
                {search && <button onClick={() => setSearch('')}><X size={12} className="text-gray-400" /></button>}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── ENTITY DETAIL HEADER ── */}
      {selected && (
        <div className="flex-shrink-0 px-3 py-2 bg-white border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[13px] shrink-0"
              style={{ background: avatarColor(selected.name) }}>
              {initial(selected.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-gray-900 truncate">{selected.name}</p>
              <p className="text-[11px] text-gray-400">{selected.phone || selected.type}</p>
            </div>
          </div>
          <div className="flex gap-1.5 mt-2">
            <div className="flex-1 text-center bg-green-50 rounded-lg py-1.5">
              <p className="text-[10px] text-green-600 font-medium">Get</p>
              <p className="text-[13px] font-bold text-green-700 tabular-nums">{fmt(selected.totalOwedToMe)}</p>
            </div>
            <div className="flex-1 text-center bg-red-50 rounded-lg py-1.5">
              <p className="text-[10px] text-red-600 font-medium">Give</p>
              <p className="text-[13px] font-bold text-red-700 tabular-nums">{fmt(selected.totalIOweThemNumber)}</p>
            </div>
            <div className="flex-1 text-center bg-gray-50 rounded-lg py-1.5">
              <p className="text-[10px] text-gray-500 font-medium">Net</p>
              <p className={`text-[13px] font-bold tabular-nums ${(selected.totalOwedToMe - selected.totalIOweThemNumber) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {fmt(selected.totalOwedToMe - selected.totalIOweThemNumber)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── SCROLL AREA ── */}
      <div ref={txListRef} className="flex-1 overflow-y-auto scroll-view">

        {/* Entity list */}
        {!selected && (
          loading ? (
            <div className="p-2 space-y-1.5">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-2.5 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-2.5 bg-gray-200 rounded w-2/3" />
                    <div className="h-2 bg-gray-100 rounded w-1/2" />
                  </div>
                  <div className="h-3.5 w-12 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                <UserPlus size={20} className="text-gray-400" />
              </div>
              <p className="text-[13px] font-semibold text-gray-700 mb-1">
                {search ? `No results for "${search}"` : `No ${tab.toLowerCase()}s yet`}
              </p>
              {!search && (
                <button onClick={() => { setNewType(tab); setShowAddEntity(true); }}
                  className="mt-2 px-4 py-1.5 bg-sky-500 text-white rounded-lg text-[12px] font-bold">
                  + Add {tab}
                </button>
              )}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filtered.map(entity => {
                const net = (entity.totalOwedToMe || 0) - (entity.totalIOweThemNumber || 0);
                const total = (entity.totalOwedToMe || 0) + (entity.totalIOweThemNumber || 0);
                return (
                  <button key={entity._id} onClick={() => selectEntity(entity)}
                    className="w-full flex items-center gap-2.5 bg-white rounded-xl px-3 py-2.5 text-left shadow-[0_1px_2px_rgba(0,0,0,0.05)] active:bg-gray-50 transition">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[12px] shrink-0"
                      style={{ background: avatarColor(entity.name) }}>
                      {initial(entity.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900 truncate">{entity.name}</p>
                      <p className="text-[11px] text-gray-400 truncate">{entity.phone || entity.type}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {total > 0 ? (
                        <>
                          <p className={`text-[13px] font-bold tabular-nums ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {net >= 0 ? '+' : '-'}{fmt(net)}
                          </p>
                          <p className={`text-[10px] font-medium ${net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {net >= 0 ? 'to get' : 'to pay'}
                          </p>
                        </>
                      ) : (
                        <p className="text-[12px] text-gray-300 font-medium">Clear</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )
        )}

        {/* Transaction list */}
        {selected && (
          txLoading ? (
            <div className="p-2 space-y-1.5">
              {[1,2,3,4].map(i => <div key={i} className="h-12 bg-white rounded-xl animate-pulse" />)}
            </div>
          ) : txWithBal.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <p className="text-[13px] font-semibold text-gray-600 mb-1">No transactions yet</p>
              <p className="text-[11px] text-gray-400">Use buttons below to record</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {txWithBal.map((tx, i) => {
                const isPaid = tx.status === 'Paid';
                const isMarking = markingPaid === tx._id;
                return (
                  <div key={tx._id || i} className={`rounded-xl overflow-hidden flex shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-opacity ${isPaid ? 'opacity-60' : 'bg-white'}`}
                    style={{ background: isPaid ? '#f9fafb' : 'white' }}>
                    <div className={`w-1 shrink-0 ${isPaid ? 'bg-gray-300' : tx.direction === 'INCOME' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div className="flex-1 flex items-center gap-2 px-2.5 py-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className={`text-[11px] ${isPaid ? 'text-gray-400' : 'text-gray-500'}`}>{fmtDate(tx.transactionDate)}</p>
                          {isPaid && <span className="text-[9px] font-bold text-green-600 bg-green-100 px-1 rounded">PAID</span>}
                        </div>
                        {tx.notes && <p className="text-[11px] text-gray-400 truncate mt-0.5 max-w-[130px]">{tx.notes}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-[13px] font-bold tabular-nums ${isPaid ? 'text-gray-400 line-through' : tx.direction === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.direction === 'INCOME' ? '+' : '-'}{fmt(tx.amount)}
                        </p>
                        {!isPaid && <p className="text-[10px] text-gray-400 tabular-nums">bal: {fmt(tx.bal)}</p>}
                      </div>
                      <button
                        onClick={() => handleMarkPaid(tx)}
                        disabled={!!markingPaid}
                        className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg active:bg-gray-100 transition"
                      >
                        {isMarking
                          ? <span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          : isPaid
                            ? <CheckCircle2 size={18} className="text-green-500" />
                            : <Circle size={18} className="text-gray-300" />
                        }
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* ── BOTTOM ACTION BAR (entity selected) ── */}
      {selected && (
        <div className="flex-shrink-0 grid grid-cols-2 gap-2 px-3 py-2 bg-white border-t border-gray-100">
          <button onClick={() => openAdd('INCOME')}
            className="py-2.5 rounded-xl bg-gradient-to-r from-green-400 to-green-600 text-white text-[13px] font-bold shadow-sm active:scale-[0.98] transition flex items-center justify-center gap-1">
            <TrendingUp size={14} /> They Owe
          </button>
          <button onClick={() => openAdd('EXPENSE')}
            className="py-2.5 rounded-xl bg-gradient-to-r from-red-400 to-red-600 text-white text-[13px] font-bold shadow-sm active:scale-[0.98] transition flex items-center justify-center gap-1">
            <TrendingDown size={14} /> I Owe
          </button>
        </div>
      )}

      {/* ── FAB (entity list) ── */}
      {!selected && (
        <button onClick={() => openAdd('INCOME')}
          className="absolute bottom-4 right-3 w-12 h-12 rounded-full bg-sky-500 shadow-lg shadow-sky-200 flex items-center justify-center active:scale-95 transition z-30">
          <Plus size={22} className="text-white" />
        </button>
      )}

      {/* ══════════════════════════════════════
          ADD TRANSACTION SHEET
          ══════════════════════════════════════ */}
      {showAdd && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end" onClick={() => setShowAdd(false)}>
          <div className="absolute inset-0 bg-black/40" />
          {/* sheet-inner: shrinks with keyboard via max-height: 85dvh */}
          <div className="relative bg-white rounded-t-2xl shadow-2xl z-10 sheet-inner" onClick={e => e.stopPropagation()}>

            {/* ── Fixed header ── */}
            <div className="flex-shrink-0">
              <div className="flex justify-center pt-2 pb-1">
                <div className="w-9 h-1 bg-gray-300 rounded-full" />
              </div>
              <div className="flex items-center justify-between px-4 pb-2 pt-1">
                <h3 className="text-[14px] font-bold text-gray-900">
                  {addDir === 'INCOME' ? 'They Owe Me' : 'I Owe Them'}
                </h3>
                <button onClick={() => setShowAdd(false)} className="w-6 h-6 flex items-center justify-center rounded-lg">
                  <X size={15} className="text-gray-400" />
                </button>
              </div>
              {/* direction toggle */}
              <div className="flex gap-1.5 px-4 pb-3">
                <button onClick={() => setAddDir('INCOME')}
                  className={`flex-1 py-2 rounded-xl text-[13px] font-bold border-2 transition-all ${
                    addDir === 'INCOME' ? 'bg-green-50 border-green-500 text-green-700 shadow-sm' : 'border-gray-200 text-gray-400'
                  }`}>
                  <TrendingUp size={13} className="inline mr-1 -mt-0.5" />They Owe
                </button>
                <button onClick={() => setAddDir('EXPENSE')}
                  className={`flex-1 py-2 rounded-xl text-[13px] font-bold border-2 transition-all ${
                    addDir === 'EXPENSE' ? 'bg-red-50 border-red-500 text-red-700 shadow-sm' : 'border-gray-200 text-gray-400'
                  }`}>
                  <TrendingDown size={13} className="inline mr-1 -mt-0.5" />I Owe
                </button>
              </div>
            </div>

            {/* ── Scrollable body — survives keyboard popup ── */}
            <div className="flex-1 overflow-y-auto scroll-view px-4 pb-2 space-y-3">
              {/* amount */}
              <div>
                <label className="text-[11px] font-semibold text-gray-500 block mb-1">Amount (৳) *</label>
                <input type="number" inputMode="decimal" value={addAmount}
                  onChange={e => setAddAmount(e.target.value)} placeholder="0.00" autoFocus
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-[22px] font-bold tabular-nums text-gray-900 outline-none focus:border-sky-400 transition"
                />
                {/* quick amount chips */}
                <div className="flex gap-1.5 mt-2 overflow-x-auto pb-0.5 no-scrollbar">
                  {[100, 500, 1000, 5000, 10000].map(chip => (
                    <button key={chip}
                      onClick={() => setAddAmount(v => String((parseFloat(v) || 0) + chip))}
                      className="shrink-0 px-3 py-1 bg-sky-50 border border-sky-200 rounded-full text-[11px] font-semibold text-sky-600 active:bg-sky-100 transition">
                      +{chip >= 1000 ? (chip / 1000) + 'K' : chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* date — quick buttons + picker */}
              <div>
                <label className="text-[11px] font-semibold text-gray-500 block mb-1">Date</label>
                <div className="flex gap-1.5 items-center">
                  <button onClick={() => setAddDate(TODAY)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition shrink-0 ${
                      addDate === TODAY ? 'bg-sky-50 border-sky-400 text-sky-700' : 'border-gray-200 text-gray-400'
                    }`}>Today</button>
                  <button onClick={() => setAddDate(YESTERDAY)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition shrink-0 ${
                      addDate === YESTERDAY ? 'bg-sky-50 border-sky-400 text-sky-700' : 'border-gray-200 text-gray-400'
                    }`}>Yesterday</button>
                  <input type="date" value={addDate} onChange={e => setAddDate(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-[12px] text-gray-900 outline-none focus:border-sky-400 min-w-0"
                  />
                </div>
              </div>

              {/* note */}
              <div>
                <label className="text-[11px] font-semibold text-gray-500 block mb-1">Note (optional)</label>
                <input type="text" value={addNote} onChange={e => setAddNote(e.target.value)}
                  placeholder="e.g. Invoice #101"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-sky-400"
                />
              </div>
            </div>

            {/* ── Sticky save button — always above keyboard ── */}
            <div className="flex-shrink-0 px-4 pt-2 pb-5">
              <button onClick={handleAddTx} disabled={addSaving || !addAmount}
                className={`w-full py-3 rounded-xl text-white text-[14px] font-bold disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.98] transition-all ${
                  addDir === 'INCOME'
                    ? 'bg-gradient-to-r from-green-400 to-green-600'
                    : 'bg-gradient-to-r from-red-400 to-red-600'
                }`}>
                {addSaving
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : `Save${addAmount ? ' ৳' + parseFloat(addAmount).toLocaleString('en-IN') : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          ADD ENTITY SHEET
          ══════════════════════════════════════ */}
      {showAddEntity && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end" onClick={() => setShowAddEntity(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-t-2xl shadow-2xl z-10" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-9 h-1 bg-gray-300 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-4 pb-2 pt-1">
              <h3 className="text-[14px] font-bold text-gray-900">Add Contact</h3>
              <button onClick={() => setShowAddEntity(false)} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100">
                <X size={15} className="text-gray-400" />
              </button>
            </div>
            <div className="px-4 pb-5 space-y-2.5">
              <div className="flex gap-1.5">
                {TYPES.map(t => (
                  <button key={t} onClick={() => setNewType(t)}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border-2 transition ${
                      newType === t ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-gray-200 text-gray-400'
                    }`}>{t}</button>
                ))}
              </div>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="Full name *" autoFocus
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-sky-400"
              />
              <input type="tel" inputMode="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)}
                placeholder="Phone number *"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-sky-400"
              />
              <button onClick={handleAddEntity} disabled={entitySaving || !newName || !newPhone}
                className="w-full py-3 rounded-xl bg-sky-500 text-white text-[14px] font-bold disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center">
                {entitySaving
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : 'Add Contact'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
