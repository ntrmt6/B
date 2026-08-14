'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { X, Plus, Trash2, Pencil, Package, TrendingUp, Target, AlertTriangle, Check } from 'lucide-react';
import api from '@/lib/api';

interface InventoryItem {
  _id: string;
  name: string;
  unit?: string;
  stockQty: number;
  buyPrice: number;
  sellPrice: number;
  lowStockThreshold: number;
  notes?: string;
}

interface Sale {
  _id: string;
  itemName: string;
  qty: number;
  salePrice: number;
  profit: number;
  entityName?: string;
  soldAt: string;
}

interface Target {
  date: string;
  targetSales: number;
  targetProfit: number;
  salesTotal: number;
  profitTotal: number;
  saleCount: number;
  unitsSold: number;
}

interface EntityLite {
  _id: string;
  name: string;
  type: 'Customer' | 'Supplier' | 'Employee';
}

interface Props {
  open: boolean;
  onClose: () => void;
  isDark: boolean;
  entities: EntityLite[];
  onSaleRecorded?: () => void;
}

type Tab = 'items' | 'sell' | 'target';

const fmt = (n: number) => {
  const abs = Math.abs(n);
  if (abs < 1000) return 'Tk ' + abs.toLocaleString('en-IN');
  return 'Tk ' + new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(abs).toLowerCase();
};

const todayKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const emptyDraft = (): Partial<InventoryItem> => ({
  name: '', unit: '', stockQty: 0, buyPrice: 0, sellPrice: 0, lowStockThreshold: 5, notes: '',
});

export default function InventoryModal({ open, onClose, isDark, entities, onSaleRecorded }: Props) {
  const [tab, setTab] = useState<Tab>('items');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [target, setTarget] = useState<Target>({
    date: todayKey(), targetSales: 0, targetProfit: 0,
    salesTotal: 0, profitTotal: 0, saleCount: 0, unitsSold: 0,
  });
  const [loading, setLoading] = useState(false);

  // Item add/edit form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<InventoryItem>>(emptyDraft());
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sell form
  const [sellItemId, setSellItemId] = useState('');
  const [sellQty, setSellQty] = useState('1');
  const [sellPriceOverride, setSellPriceOverride] = useState('');
  const [sellEntityId, setSellEntityId] = useState('');
  const [sellStatus, setSellStatus] = useState<'Paid' | 'Pending'>('Paid');
  const [selling, setSelling] = useState(false);

  // Target draft
  const [tgtSalesDraft, setTgtSalesDraft] = useState('0');
  const [tgtProfitDraft, setTgtProfitDraft] = useState('0');
  const [savingTgt, setSavingTgt] = useState(false);

  const customers = useMemo(
    () => entities.filter((e) => e.type === 'Customer'),
    [entities]
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [it, sa, tg] = await Promise.all([
        api.get('/duebook/inventory/items'),
        api.get('/duebook/inventory/sales', { params: { limit: 30 } }),
        api.get('/duebook/inventory/today'),
      ]);
      setItems(Array.isArray(it.data) ? it.data : []);
      setSales(Array.isArray(sa.data) ? sa.data : []);
      setTarget(tg.data);
      setTgtSalesDraft(String(tg.data?.targetSales || 0));
      setTgtProfitDraft(String(tg.data?.targetProfit || 0));
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadAll();
  }, [open, loadAll]);

  // ─── Item CRUD ──────────────────────────────
  const openNew = () => {
    setEditingId(null);
    setDraft(emptyDraft());
    setShowForm(true);
  };
  const openEdit = (it: InventoryItem) => {
    setEditingId(it._id);
    setDraft({ ...it });
    setShowForm(true);
  };
  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setDraft(emptyDraft());
  };
  const saveItem = async () => {
    const name = (draft.name || '').trim();
    if (!name) { toast.error('Name required'); return; }
    setSaving(true);
    try {
      const payload = {
        name,
        unit: draft.unit || '',
        stockQty: Number(draft.stockQty) || 0,
        buyPrice: Number(draft.buyPrice) || 0,
        sellPrice: Number(draft.sellPrice) || 0,
        lowStockThreshold: Number(draft.lowStockThreshold ?? 5),
        notes: draft.notes || '',
      };
      if (editingId) {
        await api.put(`/duebook/inventory/items/${editingId}`, payload);
        toast.success('Updated');
      } else {
        await api.post('/duebook/inventory/items', payload);
        toast.success('Added');
      }
      closeForm();
      loadAll();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };
  const deleteItem = async (id: string) => {
    if (!confirm('Delete this item? Sales history stays.')) return;
    try {
      await api.delete(`/duebook/inventory/items/${id}`);
      toast.success('Deleted');
      loadAll();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to delete');
    }
  };

  // ─── Sell ──────────────────────────────────
  const currentSellItem = items.find((i) => i._id === sellItemId);
  const sellQtyNum = Number(sellQty) || 0;
  const sellPriceNum = sellPriceOverride !== ''
    ? Number(sellPriceOverride) || 0
    : currentSellItem?.sellPrice || 0;
  const sellTotal = sellPriceNum * sellQtyNum;
  const sellProfit = currentSellItem
    ? (sellPriceNum - currentSellItem.buyPrice) * sellQtyNum
    : 0;

  const submitSell = async () => {
    if (!sellItemId) { toast.error('Pick an item'); return; }
    if (!sellQtyNum || sellQtyNum <= 0) { toast.error('Qty must be > 0'); return; }
    if (currentSellItem && sellQtyNum > currentSellItem.stockQty) {
      toast.error(`Only ${currentSellItem.stockQty} in stock`); return;
    }
    setSelling(true);
    try {
      await api.post('/duebook/inventory/sell', {
        itemId: sellItemId,
        qty: sellQtyNum,
        salePrice: sellPriceOverride !== '' ? sellPriceNum : undefined,
        entityId: sellEntityId || undefined,
        status: sellEntityId ? sellStatus : undefined,
      });
      toast.success('Sale recorded');
      setSellItemId(''); setSellQty('1'); setSellPriceOverride('');
      setSellEntityId(''); setSellStatus('Paid');
      loadAll();
      onSaleRecorded?.();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to record sale');
    } finally {
      setSelling(false);
    }
  };

  // ─── Target ────────────────────────────────
  const saveTarget = async () => {
    setSavingTgt(true);
    try {
      await api.put('/duebook/inventory/target', {
        date: todayKey(),
        targetSales: Number(tgtSalesDraft) || 0,
        targetProfit: Number(tgtProfitDraft) || 0,
      });
      toast.success('Target saved');
      loadAll();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to save target');
    } finally {
      setSavingTgt(false);
    }
  };

  const totalStockValue = items.reduce((s, i) => s + i.buyPrice * i.stockQty, 0);
  const totalPotentialRevenue = items.reduce((s, i) => s + i.sellPrice * i.stockQty, 0);
  const totalPotentialProfit = totalPotentialRevenue - totalStockValue;

  if (!open) return null;

  const salesPct = target.targetSales > 0
    ? Math.min(100, (target.salesTotal / target.targetSales) * 100) : 0;
  const profitPct = target.targetProfit > 0
    ? Math.min(100, (target.profitTotal / target.targetProfit) * 100) : 0;

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white dark:bg-slate-800 rounded-t-2xl shadow-2xl z-10 sheet-slide-up flex flex-col max-h-[92dvh]" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 flex justify-center pt-2 pb-1">
          <div className="w-9 h-1 bg-gray-300 dark:bg-slate-600 rounded-full" />
        </div>
        <div className="flex-shrink-0 flex items-center justify-between px-4 pb-2 pt-1">
          <h3 className="text-[14px] font-bold text-gray-900 dark:text-slate-100 flex items-center gap-1.5">
            <Package size={15} /> Inventory
          </h3>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
            <X size={15} className="text-gray-400 dark:text-slate-500" />
          </button>
        </div>

        <div className="flex-shrink-0 flex gap-1 px-3 pb-2 pt-1 border-b border-gray-100 dark:border-slate-700">
          {(['items', 'sell', 'target'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition ${
                tab === t
                  ? 'bg-sky-500 text-white'
                  : 'text-gray-500 dark:text-slate-400 active:bg-gray-100 dark:active:bg-slate-700'
              }`}>
              {t === 'items' ? 'Items' : t === 'sell' ? 'Sell' : "Today's Target"}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto scroll-view px-3 pb-5 pt-2 space-y-3">
          {loading && (
            <div className="text-center text-[12px] text-gray-400 py-8">Loading…</div>
          )}

          {/* ── ITEMS TAB ── */}
          {!loading && tab === 'items' && (
            <>
              {/* Summary */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg px-2 py-1.5">
                  <p className="text-[9px] text-blue-700 dark:text-blue-400 font-medium leading-none uppercase">Items</p>
                  <p className="text-[13px] font-bold text-blue-700 dark:text-blue-400 tabular-nums leading-tight mt-0.5">{items.length}</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/30 rounded-lg px-2 py-1.5">
                  <p className="text-[9px] text-amber-700 dark:text-amber-400 font-medium leading-none uppercase">Stock Value</p>
                  <p className="text-[13px] font-bold text-amber-700 dark:text-amber-400 tabular-nums leading-tight mt-0.5">{fmt(totalStockValue)}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/30 rounded-lg px-2 py-1.5">
                  <p className="text-[9px] text-green-700 dark:text-green-400 font-medium leading-none uppercase">Potential Profit</p>
                  <p className="text-[13px] font-bold text-green-700 dark:text-green-400 tabular-nums leading-tight mt-0.5">{fmt(totalPotentialProfit)}</p>
                </div>
              </div>

              <button onClick={openNew}
                className="w-full py-2 rounded-xl bg-sky-500 text-white text-[13px] font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all">
                <Plus size={14} /> Add Item
              </button>

              {items.length === 0 && (
                <div className="text-center text-[12px] text-gray-400 py-8">
                  No items yet. Add your first item to start tracking stock.
                </div>
              )}

              {items.map(it => {
                const perUnit = it.sellPrice - it.buyPrice;
                const totalUnit = perUnit * it.stockQty;
                const low = it.stockQty <= it.lowStockThreshold;
                return (
                  <div key={it._id} className="border border-gray-200 dark:border-slate-700 rounded-xl p-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[13px] font-bold text-gray-900 dark:text-slate-100 truncate">{it.name}</span>
                          {it.unit && <span className="text-[10px] text-gray-400">/{it.unit}</span>}
                          {low && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-[9px] font-bold uppercase">
                              <AlertTriangle size={9} /> Low
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-4 gap-1 mt-1.5">
                          <div>
                            <p className="text-[9px] text-gray-400 uppercase leading-none">Stock</p>
                            <p className="text-[12px] font-bold text-gray-800 dark:text-slate-200 tabular-nums">{it.stockQty}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-gray-400 uppercase leading-none">Buy</p>
                            <p className="text-[12px] font-semibold text-gray-700 dark:text-slate-300 tabular-nums">{fmt(it.buyPrice)}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-gray-400 uppercase leading-none">Sell</p>
                            <p className="text-[12px] font-semibold text-gray-700 dark:text-slate-300 tabular-nums">{fmt(it.sellPrice)}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-gray-400 uppercase leading-none">Profit/u</p>
                            <p className={`text-[12px] font-bold tabular-nums ${perUnit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600'}`}>{fmt(perUnit)}</p>
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-1">
                          Total potential: <span className={`font-bold ${totalUnit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600'}`}>{fmt(totalUnit)}</span>
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button onClick={() => openEdit(it)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => deleteItem(it._id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* ── SELL TAB ── */}
          {!loading && tab === 'sell' && (
            <>
              <div>
                <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Item</label>
                <select value={sellItemId} onChange={e => setSellItemId(e.target.value)}
                  className="w-full mt-1 border border-gray-200 dark:border-slate-600 dark:bg-slate-900 rounded-lg px-3 py-2 text-[13px] text-gray-900 dark:text-slate-100 outline-none focus:border-sky-400">
                  <option value="">— Choose item —</option>
                  {items.map(it => (
                    <option key={it._id} value={it._id} disabled={it.stockQty <= 0}>
                      {it.name} (stock: {it.stockQty}) — {fmt(it.sellPrice)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Qty</label>
                  <input type="number" min="0" step="any" value={sellQty} onChange={e => setSellQty(e.target.value)}
                    className="w-full mt-1 border border-gray-200 dark:border-slate-600 dark:bg-slate-900 rounded-lg px-3 py-2 text-[13px] text-gray-900 dark:text-slate-100 outline-none focus:border-sky-400" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Price / unit</label>
                  <input type="number" min="0" step="any"
                    placeholder={currentSellItem ? String(currentSellItem.sellPrice) : '0'}
                    value={sellPriceOverride} onChange={e => setSellPriceOverride(e.target.value)}
                    className="w-full mt-1 border border-gray-200 dark:border-slate-600 dark:bg-slate-900 rounded-lg px-3 py-2 text-[13px] text-gray-900 dark:text-slate-100 outline-none focus:border-sky-400" />
                </div>
              </div>

              {currentSellItem && sellQtyNum > 0 && (
                <div className="bg-gray-50 dark:bg-slate-900/40 rounded-xl p-2.5 grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-[9px] text-gray-400 uppercase leading-none">Total</p>
                    <p className="text-[13px] font-bold text-gray-800 dark:text-slate-200 tabular-nums mt-0.5">{fmt(sellTotal)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 uppercase leading-none">Cost</p>
                    <p className="text-[13px] font-bold text-gray-800 dark:text-slate-200 tabular-nums mt-0.5">{fmt(currentSellItem.buyPrice * sellQtyNum)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 uppercase leading-none">Profit</p>
                    <p className={`text-[13px] font-bold tabular-nums mt-0.5 ${sellProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600'}`}>{fmt(sellProfit)}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Customer (optional)</label>
                <select value={sellEntityId} onChange={e => setSellEntityId(e.target.value)}
                  className="w-full mt-1 border border-gray-200 dark:border-slate-600 dark:bg-slate-900 rounded-lg px-3 py-2 text-[13px] text-gray-900 dark:text-slate-100 outline-none focus:border-sky-400">
                  <option value="">— Walk-in / no customer —</option>
                  {customers.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
                {sellEntityId && (
                  <div className="flex gap-1.5 mt-2">
                    {(['Paid', 'Pending'] as const).map(s => (
                      <button key={s} onClick={() => setSellStatus(s)}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition ${
                          sellStatus === s
                            ? (s === 'Paid' ? 'bg-green-500 text-white' : 'bg-amber-500 text-white')
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
                        }`}>
                        {s === 'Paid' ? 'Paid Now' : 'Add to Due'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={submitSell} disabled={selling || !sellItemId || sellQtyNum <= 0}
                className="w-full py-3 rounded-xl bg-sky-500 text-white text-[14px] font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all disabled:opacity-50">
                <Check size={15} /> {selling ? 'Recording…' : 'Record Sale'}
              </button>

              {/* Recent sales */}
              <div>
                <p className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mt-3 mb-1.5">Recent Sales</p>
                {sales.length === 0 && (
                  <p className="text-[11px] text-gray-400 py-2">No sales yet.</p>
                )}
                {sales.slice(0, 15).map(s => (
                  <div key={s._id} className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-slate-700 last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-semibold text-gray-800 dark:text-slate-200 truncate">
                        {s.itemName} <span className="text-gray-400 font-normal">× {s.qty}</span>
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(s.soldAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        {s.entityName ? ` · ${s.entityName}` : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[12px] font-bold text-gray-800 dark:text-slate-200 tabular-nums">{fmt(s.salePrice * s.qty)}</p>
                      <p className={`text-[10px] font-semibold tabular-nums ${s.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600'}`}>{fmt(s.profit)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── TARGET TAB ── */}
          {!loading && tab === 'target' && (
            <>
              <div className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/30 dark:to-blue-900/30 rounded-xl p-3">
                <p className="text-[10px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wide">Today · {target.date}</p>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <p className="text-[9px] text-gray-500 dark:text-slate-400 uppercase">Sales</p>
                    <p className="text-[16px] font-bold text-gray-900 dark:text-slate-100 tabular-nums">{fmt(target.salesTotal)}</p>
                    <p className="text-[10px] text-gray-400">of {fmt(target.targetSales)}</p>
                    <div className="h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-sky-500 transition-all" style={{ width: `${salesPct}%` }} />
                    </div>
                    <p className="text-[9px] text-sky-600 dark:text-sky-400 font-bold mt-0.5">{salesPct.toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500 dark:text-slate-400 uppercase">Profit</p>
                    <p className="text-[16px] font-bold text-green-700 dark:text-green-400 tabular-nums">{fmt(target.profitTotal)}</p>
                    <p className="text-[10px] text-gray-400">of {fmt(target.targetProfit)}</p>
                    <div className="h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-green-500 transition-all" style={{ width: `${profitPct}%` }} />
                    </div>
                    <p className="text-[9px] text-green-600 dark:text-green-400 font-bold mt-0.5">{profitPct.toFixed(0)}%</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-2 text-[10px] text-gray-500 dark:text-slate-400">
                  <span><TrendingUp size={9} className="inline mr-0.5" />{target.saleCount} sales</span>
                  <span>· {target.unitsSold} units sold</span>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Set Today's Target</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-500 dark:text-slate-400">Sales target</label>
                    <input type="number" min="0" step="any" value={tgtSalesDraft} onChange={e => setTgtSalesDraft(e.target.value)}
                      className="w-full mt-1 border border-gray-200 dark:border-slate-600 dark:bg-slate-900 rounded-lg px-3 py-2 text-[13px] text-gray-900 dark:text-slate-100 outline-none focus:border-sky-400" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 dark:text-slate-400">Profit target</label>
                    <input type="number" min="0" step="any" value={tgtProfitDraft} onChange={e => setTgtProfitDraft(e.target.value)}
                      className="w-full mt-1 border border-gray-200 dark:border-slate-600 dark:bg-slate-900 rounded-lg px-3 py-2 text-[13px] text-gray-900 dark:text-slate-100 outline-none focus:border-sky-400" />
                  </div>
                </div>
                <button onClick={saveTarget} disabled={savingTgt}
                  className="w-full mt-2 py-2.5 rounded-xl bg-sky-500 text-white text-[13px] font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all disabled:opacity-50">
                  <Target size={14} /> {savingTgt ? 'Saving…' : 'Save Target'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── ITEM ADD/EDIT SHEET (nested) ── */}
      {showForm && (
        <div className="absolute inset-0 z-60 flex flex-col justify-end" onClick={closeForm}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white dark:bg-slate-800 rounded-t-2xl shadow-2xl z-10 sheet-slide-up flex flex-col max-h-[85dvh]" onClick={e => e.stopPropagation()}>
            <div className="flex-shrink-0 flex justify-center pt-2 pb-1">
              <div className="w-9 h-1 bg-gray-300 dark:bg-slate-600 rounded-full" />
            </div>
            <div className="flex-shrink-0 flex items-center justify-between px-4 pb-2 pt-1">
              <h3 className="text-[14px] font-bold text-gray-900 dark:text-slate-100">{editingId ? 'Edit Item' : 'New Item'}</h3>
              <button onClick={closeForm} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                <X size={15} className="text-gray-400 dark:text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto scroll-view px-4 pb-5 pt-3 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Name *</label>
                <input value={draft.name || ''} onChange={e => setDraft({ ...draft, name: e.target.value })}
                  className="w-full mt-1 border border-gray-200 dark:border-slate-600 dark:bg-slate-900 rounded-lg px-3 py-2 text-[13px] text-gray-900 dark:text-slate-100 outline-none focus:border-sky-400" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Unit (e.g. kg, pc)</label>
                <input value={draft.unit || ''} onChange={e => setDraft({ ...draft, unit: e.target.value })}
                  className="w-full mt-1 border border-gray-200 dark:border-slate-600 dark:bg-slate-900 rounded-lg px-3 py-2 text-[13px] text-gray-900 dark:text-slate-100 outline-none focus:border-sky-400" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase">Stock Qty</label>
                  <input type="number" min="0" step="any" value={draft.stockQty ?? 0} onChange={e => setDraft({ ...draft, stockQty: Number(e.target.value) })}
                    className="w-full mt-1 border border-gray-200 dark:border-slate-600 dark:bg-slate-900 rounded-lg px-2 py-2 text-[13px] text-gray-900 dark:text-slate-100 outline-none focus:border-sky-400" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase">Buy Price</label>
                  <input type="number" min="0" step="any" value={draft.buyPrice ?? 0} onChange={e => setDraft({ ...draft, buyPrice: Number(e.target.value) })}
                    className="w-full mt-1 border border-gray-200 dark:border-slate-600 dark:bg-slate-900 rounded-lg px-2 py-2 text-[13px] text-gray-900 dark:text-slate-100 outline-none focus:border-sky-400" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase">Sell Price</label>
                  <input type="number" min="0" step="any" value={draft.sellPrice ?? 0} onChange={e => setDraft({ ...draft, sellPrice: Number(e.target.value) })}
                    className="w-full mt-1 border border-gray-200 dark:border-slate-600 dark:bg-slate-900 rounded-lg px-2 py-2 text-[13px] text-gray-900 dark:text-slate-100 outline-none focus:border-sky-400" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Low Stock Alert Below</label>
                <input type="number" min="0" step="any" value={draft.lowStockThreshold ?? 5}
                  onChange={e => setDraft({ ...draft, lowStockThreshold: Number(e.target.value) })}
                  className="w-full mt-1 border border-gray-200 dark:border-slate-600 dark:bg-slate-900 rounded-lg px-3 py-2 text-[13px] text-gray-900 dark:text-slate-100 outline-none focus:border-sky-400" />
              </div>
              {(draft.buyPrice !== undefined && draft.sellPrice !== undefined) && (
                <div className="bg-gray-50 dark:bg-slate-900/40 rounded-lg px-3 py-2 flex justify-between text-[11px]">
                  <span className="text-gray-500 dark:text-slate-400">Profit / unit:</span>
                  <span className={`font-bold tabular-nums ${((Number(draft.sellPrice) - Number(draft.buyPrice))) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600'}`}>
                    {fmt(Number(draft.sellPrice) - Number(draft.buyPrice))}
                  </span>
                </div>
              )}
              <button onClick={saveItem} disabled={saving}
                className="w-full py-3 rounded-xl bg-sky-500 text-white text-[14px] font-bold active:scale-[0.98] transition-all disabled:opacity-50">
                {saving ? 'Saving…' : (editingId ? 'Update Item' : 'Add Item')}
              </button>
              {isDark ? null : null /* isDark reserved for future themed inline styles */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
